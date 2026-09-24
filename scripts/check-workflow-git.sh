#!/usr/bin/env bash
# scripts/check-workflow-git.sh
# ============================================================================
# PK5（Plan Commit ancestry）の git 検査
# docs/DEV_WORKFLOW.md 「Plan Commit ancestry (D-039, PK5)」/ D-039 参照
#
# 呼び出し元: scripts/pre-push.sh（push 前 gate）/ scripts/local-ci.sh（L1 gate）
# hosted docs jobもfetch-depth: 0で実PR HEADを検査する（MG-D4）。
#
# 検査内容:
#   docs/plans/ 直下の各 packet について
#     - `Evidence Mode` 行は任意。あれば github だけを受理する
#     - `Phase` は WORKFLOW_STATE_PHASES の 8 値のどれか
#   PK5: 各 packet について
#     (a) `Plan Commit` の記録 SHA が現 HEAD の ancestor であること
#     (b) `Amendments` 行の各 SHA が `Plan Commit` の descendant かつ HEAD の ancestor であること
#     (c) `Plan Commit` の値が過去に書き換えられていないこと（初回 non-pending 値と現在値の比較）
#     (d) `Amendments` の登録順を含む prefix が保存されていること
#   検査対象の履歴が shallow なら ERROR（full history が必要）。
#
# 「active plan なし」自体は本スクリプトの対象外（doc-consistency-check.sh PK1 が担当、
# 本スクリプトは docs/plans/ 直下が空でも WARN/ERROR を出さず黙って skip する）
# ============================================================================

set -u  # 各 check を独立 FAIL=1 集約方式のため set -e は使わない

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL=0
PLAN_DIR="docs/plans"
WORKFLOW_STATE_PHASES="kickoff spec-check design plan-draft plan-gate plan-approved implementing archive"

is_workflow_phase() {
    local phase
    for phase in $WORKFLOW_STATE_PHASES; do
        [[ "$phase" == "$1" ]] && return 0
    done
    return 1
}

# ----------------------------------------------------------------------------
# PK5: 単一 packet ファイルの Plan Commit / Amendments ancestry 検査
# ----------------------------------------------------------------------------
check_plan_commit_ancestry() {
    local file="$1"
    local plan_commit plan_commit_full amendments amendment amendment_full first_value
    local -a amendment_shas=()

    plan_commit="$(grep -m1 -E '^- Plan Commit:[[:space:]]*' "$file" 2>/dev/null \
        | sed -E 's/^- Plan Commit:[[:space:]]*//; s/[[:space:]]+$//')"

    # Plan Commit が pending（未確定）の packet は PK5 の対象外（plan-draft/plan-gate フェーズ）
    if [[ -z "$plan_commit" || "$plan_commit" == "pending" ]]; then
        return 0
    fi

    if ! plan_commit_full="$(git rev-parse --verify "${plan_commit}^{commit}" 2>/dev/null)"; then
        echo "❌ [workflow-git] PK5: $file の Plan Commit '$plan_commit' は解決できない SHA です"
        FAIL=1
        return 0
    fi

    if ! git merge-base --is-ancestor "$plan_commit_full" HEAD 2>/dev/null; then
        echo "❌ [workflow-git] PK5: $file の Plan Commit '$plan_commit' は現在の HEAD の祖先ではありません"
        FAIL=1
    fi

    amendments="$(grep -m1 -E '^- Amendments:[[:space:]]*' "$file" 2>/dev/null \
        | sed -E 's/^- Amendments:[[:space:]]*//; s/[[:space:]]+$//')"
    if [[ -n "$amendments" ]]; then
        while IFS= read -r amendment; do
            [[ -z "$amendment" ]] && continue
            amendment_shas+=("$amendment")
            if ! amendment_full="$(git rev-parse --verify "${amendment}^{commit}" 2>/dev/null)"; then
                echo "❌ [workflow-git] PK5: $file の Amendments SHA '$amendment' は解決できません"
                FAIL=1
                continue
            fi
            if ! git merge-base --is-ancestor "$plan_commit_full" "$amendment_full" 2>/dev/null; then
                echo "❌ [workflow-git] PK5: $file の Amendments SHA '$amendment' は Plan Commit '$plan_commit' の descendant ではありません"
                FAIL=1
            fi
            if ! git merge-base --is-ancestor "$amendment_full" HEAD 2>/dev/null; then
                echo "❌ [workflow-git] PK5: $file の Amendments SHA '$amendment' は現在の HEAD の祖先ではありません"
                FAIL=1
            fi
        done < <(printf '%s' "$amendments" | grep -oE '[0-9a-f]{7,40}' || true)
    fi

    # Plan Commit 書き換え検出: ファイル履歴の全 diff から追加された
    # "- Plan Commit: <value>" 行を新しい commit 順に集め、pending を除外した上で
    # 最後（= 最も古い non-pending 値 = 初回確定値）を現在値と比較する。
    first_value="$(git log --follow -p -- "$file" 2>/dev/null \
        | grep -E '^[+]- Plan Commit:[[:space:]]*' \
        | sed -E 's/^[+]- Plan Commit:[[:space:]]*//; s/[[:space:]]+$//' \
        | grep -v -E '^pending$' \
        | tail -1)"

    if [[ -n "$first_value" && "$first_value" != "$plan_commit" ]]; then
        echo "❌ [workflow-git] PK5: $file の Plan Commit が書き換えられています（初回確定値 '$first_value' -> 現在値 '$plan_commit'）"
        FAIL=1
    fi
    # MG-D5: each registered sequence must remain a prefix, including original SHA spelling.
    # Separators/whitespace may change; resolving aliases here would weaken SHA immutability.
    local prior_amendments index
    local -a prior_shas=()
    while IFS= read -r prior_amendments; do
        mapfile -t prior_shas < <(printf '%s\n' "$prior_amendments" | grep -oE '[0-9a-f]{7,40}' || true)
        for ((index = 0; index < ${#prior_shas[@]}; index++)); do
            if [[ "${amendment_shas[$index]:-}" != "${prior_shas[$index]}" ]]; then
                echo "❌ [workflow-git] PK5: $file の Amendments が削除・変更されています（登録順序を含む prefix が必要です）"
                FAIL=1
                break
            fi
        done
    done < <(git log --follow -p -- "$file" | grep -E '^[+]- Amendments:')

}

main() {
    local file phase
    # Only the target ancestry matters: an unrelated ref can retain a shallow marker.
    # rev-list treats a shallow boundary as a root; the raw commit still names its parents.
    local history_root history_roots
    history_roots="$(git rev-list --max-parents=0 HEAD ${WORKFLOW_BASE_SHA:+"$WORKFLOW_BASE_SHA"})" || exit 1
    while IFS= read -r history_root; do
        if git cat-file -p "$history_root" | sed -n '/^$/q; /^parent /p' | grep -q .; then
            echo "❌ [workflow-git] PK5: full history required; shallow target ancestry is not evidence"
            exit 1
        fi
    done <<< "$history_roots"
    if [[ -n "${WORKFLOW_BASE_SHA:-}" ]] && ! git merge-base "$WORKFLOW_BASE_SHA" HEAD >/dev/null 2>&1; then
        echo "❌ [workflow-git] PK5: hosted base history unavailable"
        exit 1
    fi

    while IFS= read -r file; do
        [[ -n "$file" ]] || continue
        if grep -qE '^- Evidence Mode:' "$file" &&
            [[ "$(sed -n 's/^- Evidence Mode: *//p' "$file" | sed -E 's/[[:space:]]+$//')" != "github" ]]; then
            echo "❌ [workflow-git] Evidence Mode は廃止。書くなら github: $file"
            FAIL=1
        fi
        phase="$(sed -n 's/^- Phase: *//p' "$file" | sed -E 's/[[:space:]]+$//')"
        if ! is_workflow_phase "$phase"; then
            echo "❌ [workflow-git] invalid tracked Phase in $file"
            FAIL=1
        fi
        check_plan_commit_ancestry "$file"
    done < <(find "$REPO_ROOT/$PLAN_DIR" -maxdepth 1 -name '*.md' -type f 2>/dev/null | sort)

    if [[ "$FAIL" -eq 0 ]]; then
        echo "✅ [workflow-git] PK5 検査 OK"
    fi

    exit "$FAIL"
}

main
