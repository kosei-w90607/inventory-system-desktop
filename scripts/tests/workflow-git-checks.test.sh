#!/usr/bin/env bash
# scripts/tests/workflow-git-checks.test.sh
# scripts/check-workflow-git.sh（PK5）の synthetic git fixture repo テスト。
# 各シナリオは tmpdir に git init した使い捨て repo を構築し、正例/負例を判定する。
# 実 SHA（PR #165 等）は dangling で automated fixture には使えないため（Plan Gate R1）、
# ここでは全て test 自身が構築する commit 列のみを使う。
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHECK_SCRIPT="$SOURCE_ROOT/scripts/check-workflow-git.sh"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local msg="$3"
    if ! printf '%s' "$haystack" | grep -Fq -- "$needle"; then
        fail "$msg (期待した文字列が出力に含まれない: $needle)"
    fi
}

assert_not_contains() {
    local haystack="$1"
    local needle="$2"
    local msg="$3"
    if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
        fail "$msg (含まれてはいけない文字列が出力に含まれる: $needle)"
    fi
}

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

init_repo() {
    local repo="$1"
    mkdir -p "$repo"
    git -C "$repo" init -q -b main
    git -C "$repo" config user.name test
    git -C "$repo" config user.email test@example.invalid
}

commit_all() {
    local repo="$1"
    local subject="$2"
    git -C "$repo" add -A
    git -C "$repo" commit -q -m "$subject"
    git -C "$repo" rev-parse HEAD
}

write_packet() {
    local repo="$1"
    local packet_name="$2"
    local plan_commit="$3"
    local amendments="$4"
    local phase="implementing"
    [[ "$plan_commit" == "pending" ]] && phase="plan-gate"
    mkdir -p "$repo/docs/plans"
    cat > "$repo/docs/plans/$packet_name" <<EOF
# Test Packet

## Workflow State

- Phase: ${phase}
- Plan Commit: ${plan_commit}
- Amendments: ${amendments}
EOF
}

append_rebase_map() {
    local repo="$1"
    local packet_name="$2"
    local old_sha="$3"
    local new_sha="$4"
    printf '\nRebase Map: %s -> %s\n' "$old_sha" "$new_sha" >> "$repo/docs/plans/$packet_name"
}

run_check() {
    local repo="$1"
    (cd "$repo" && bash "$CHECK_SCRIPT" 2>&1)
}

# 旧 state-only 系 subject の commit を作る（T-G5 / T-G6 用）。差分がないと
# `git commit` が失敗するため、ダミーのログファイルへの追記を伴わせる。
state_only_commit() {
    local repo="$1"
    local subject="$2"
    printf '%s\n' "$subject" >> "$repo/.state-log"
    commit_all "$repo" "$subject" > /dev/null
}

# set -e 環境下で non-zero 終了を安全に捕捉するためのラッパー。
# 呼び出し後、変数 CHECK_STATUS に終了コードが入る。
CHECK_STATUS=0
capture_check() {
    local repo="$1"
    local -n __out_ref="$2"
    set +e
    __out_ref="$(run_check "$repo")"
    CHECK_STATUS=$?
    set -e
}

# ============================================================================
# PK5: ancestry 正例（plan-first が実装 commit の祖先）
# ============================================================================
repo="$tmp/pk5-ancestry-ok"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
commit_all "$repo" "base" > /dev/null

write_packet "$repo" "packet.md" "pending" "none"
a_sha="$(commit_all "$repo" "docs(plans): plan-first")"

write_packet "$repo" "packet.md" "$a_sha" "none"
commit_all "$repo" "docs(plans): Plan Commit を確定して implementing へ進める" > /dev/null

printf 'impl\n' > "$repo/impl.txt"
commit_all "$repo" "feat: implement" > /dev/null

capture_check "$repo" output
[[ "$CHECK_STATUS" -eq 0 ]] || fail "ancestry 正例が ERROR 判定された:\n$output"
assert_not_contains "$output" "PK5:" "ancestry 正例で PK5 出力が発生した"

# ============================================================================
# PK5: squash 相当の負例（squash merge 後は ancestor でない）
# ============================================================================
repo="$tmp/pk5-squash-negative"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
commit_all "$repo" "base" > /dev/null
git -C "$repo" branch feature

git -C "$repo" switch -q feature
write_packet "$repo" "packet.md" "pending" "none"
a_sha="$(commit_all "$repo" "docs(plans): plan-first")"
write_packet "$repo" "packet.md" "$a_sha" "none"
commit_all "$repo" "docs(plans): Plan Commit を確定して implementing へ進める" > /dev/null
printf 'impl\n' > "$repo/impl.txt"
commit_all "$repo" "feat: implement" > /dev/null

git -C "$repo" switch -q main
git -C "$repo" merge -q --squash feature > /dev/null
commit_all "$repo" "feat: implement (squashed)" > /dev/null

capture_check "$repo" output
[[ "$CHECK_STATUS" -ne 0 ]] || fail "squash 後の非 ancestor が ERROR 判定されなかった"
assert_contains "$output" "は現在の HEAD の祖先ではありません" "squash 負例で ancestry ERROR が出力されない"

# ============================================================================
# PK5: Plan Commit 書き換え検出（ancestry は成立するが原本改変）
# ============================================================================
repo="$tmp/pk5-rewrite"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
commit_all "$repo" "base" > /dev/null

write_packet "$repo" "packet.md" "pending" "none"
a_sha="$(commit_all "$repo" "docs(plans): plan-first")"

write_packet "$repo" "packet.md" "$a_sha" "none"
b_sha="$(commit_all "$repo" "docs(plans): Plan Commit を確定して implementing へ進める")"

printf 'impl\n' > "$repo/impl.txt"
commit_all "$repo" "feat: implement" > /dev/null

# 不正な書き換え: original を b_sha に差し替える（b_sha 自体は HEAD の祖先なので
# ancestry 検査だけでは検出できず、rewrite 検出が唯一の網であることを確認する）
write_packet "$repo" "packet.md" "$b_sha" "none"
commit_all "$repo" "docs(plans): Plan Commit を修正" > /dev/null

capture_check "$repo" output
[[ "$CHECK_STATUS" -ne 0 ]] || fail "Plan Commit 書き換えが ERROR 判定されなかった"
assert_contains "$output" "書き換えられています" "書き換え検出 ERROR が出力されない"
assert_not_contains "$output" "は現在の HEAD の祖先ではありません" "書き換えテストで無関係な ancestry ERROR も発生した（テスト設計の分離が崩れている）"

# ============================================================================
# PK5: Amendments 追記型の正例（original 不変 + Amendments 追記）
# ============================================================================
repo="$tmp/pk5-amendments-ok"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
commit_all "$repo" "base" > /dev/null

write_packet "$repo" "packet.md" "pending" "none"
a_sha="$(commit_all "$repo" "docs(plans): plan-first")"

write_packet "$repo" "packet.md" "$a_sha" "none"
commit_all "$repo" "docs(plans): Plan Commit を確定して implementing へ進める" > /dev/null

printf 'impl\n' > "$repo/impl.txt"
c_sha="$(commit_all "$repo" "feat: implement")"

write_packet "$repo" "packet.md" "$a_sha" "$c_sha"
commit_all "$repo" "docs(plans): gated amendment を記録" > /dev/null

capture_check "$repo" output
[[ "$CHECK_STATUS" -eq 0 ]] || fail "Amendments 追記正例が ERROR 判定された:\n$output"
assert_not_contains "$output" "PK5:" "Amendments 正例で PK5 出力が発生した"

# MG-D5 / F1: two amendments retain their order; only token separators may differ.
printf 'second amendment\n' >> "$repo/impl.txt"
d_sha="$(commit_all "$repo" 'feat: second amendment')"
write_packet "$repo" "packet.md" "$a_sha" "$c_sha, $d_sha"
commit_all "$repo" 'docs(plans): append second amendment' > /dev/null
capture_check "$repo" output
[[ "$CHECK_STATUS" -eq 0 ]] || fail "ordered amendment append rejected: $output"
write_packet "$repo" "packet.md" "$a_sha" "  $c_sha  ,   $d_sha  "
valid_amendments_head="$(commit_all "$repo" 'docs(plans): amendment separators only')"
capture_check "$repo" output
[[ "$CHECK_STATUS" -eq 0 ]] || fail "amendment formatting change rejected: $output"

# Each invalid candidate branches from the same valid history; no destructive reset is needed.
for variant in reorder replacement removal spelling; do
    git -C "$repo" switch -qc "amendment-$variant" "$valid_amendments_head"
    case "$variant" in
        reorder) changed="$d_sha, $c_sha" ;;
        replacement) changed="$a_sha, $d_sha" ;;
        removal) changed="$c_sha" ;;
        spelling) changed="${c_sha:0:12}, $d_sha" ;;
    esac
    write_packet "$repo" "packet.md" "$a_sha" "$changed"
    commit_all "$repo" "docs(plans): invalid amendment $variant" > /dev/null
    capture_check "$repo" output
    [[ "$CHECK_STATUS" -ne 0 ]] || fail "amendment $variant was accepted"
    assert_contains "$output" "Amendments が削除・変更されています" "amendment $variant reason missing"
    assert_not_contains "$output" "祖先ではありません" "amendment $variant failed for unrelated ancestry"
done
git -C "$repo" switch -q --detach "$valid_amendments_head"

# MG-D5 / S-P3-1: recorded amendment removal fails even though every remaining SHA is ancestral.
write_packet "$repo" "packet.md" "$a_sha" "none"
commit_all "$repo" "docs(plans): remove recorded amendment" > /dev/null
capture_check "$repo" output
[[ "$CHECK_STATUS" -ne 0 ]] || fail "registered amendment removal was accepted"
assert_contains "$output" "Amendments が削除・変更されています" "amendment removal reason missing"
assert_not_contains "$output" "祖先ではありません" "amendment removal failed for unrelated ancestry"

# ============================================================================
# T-G2: Rebase Map 行は解釈しない。rebase で非 ancestor になった Plan Commit は、
# patch-id 同値の Rebase Map 行を足しても ERROR のまま（escape hatch にしない）
# ============================================================================
repo="$tmp/pk5-rebase-map-ignored"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
commit_all "$repo" "base" > /dev/null
git -C "$repo" branch feature

git -C "$repo" switch -q feature
write_packet "$repo" "packet.md" "pending" "none"
old_plan_sha="$(commit_all "$repo" "docs(plans): plan-first")"
write_packet "$repo" "packet.md" "$old_plan_sha" "none"
commit_all "$repo" "docs(plans): Plan Commit を確定して implementing へ進める" > /dev/null
printf 'impl\n' > "$repo/impl.txt"
commit_all "$repo" "feat: implement" > /dev/null

git -C "$repo" switch -q main
printf 'main advance\n' > "$repo/main.txt"
commit_all "$repo" "chore: advance main" > /dev/null
git -C "$repo" switch -q feature
git -C "$repo" rebase main > /dev/null
new_plan_sha="$(git -C "$repo" log --format=%H --grep='^docs(plans): plan-first$' -1)"
old_patch_id="$(git -C "$repo" show --pretty=format: --binary "$old_plan_sha" | git patch-id --stable | awk '{print $1}')"
new_patch_id="$(git -C "$repo" show --pretty=format: --binary "$new_plan_sha" | git patch-id --stable | awk '{print $1}')"
[[ -n "$old_patch_id" && "$old_patch_id" == "$new_patch_id" ]] || fail "T-G2 fixture: rebase 前後の plan-first が patch-id 同値でない"

append_rebase_map "$repo" "packet.md" "$old_plan_sha" "$new_plan_sha"
commit_all "$repo" "docs(plans): rebase map を記録" > /dev/null

capture_check "$repo" output
[[ "$CHECK_STATUS" -ne 0 ]] || fail "Rebase Map 行で非 ancestor の Plan Commit が受理された:\n$output"
assert_contains "$output" "は現在の HEAD の祖先ではありません" "Rebase Map 行ありの非 ancestor で ancestry ERROR が出力されない"

# ============================================================================
# PK5: Amendments 非 descendant の負例（並行ブランチの SHA を記録）
# ============================================================================
repo="$tmp/pk5-amendments-non-descendant"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
commit_all "$repo" "base" > /dev/null

git -C "$repo" branch plan-branch
git -C "$repo" branch unrelated-branch

git -C "$repo" switch -q plan-branch
write_packet "$repo" "packet.md" "pending" "none"
a_sha="$(commit_all "$repo" "docs(plans): plan-first")"
write_packet "$repo" "packet.md" "$a_sha" "none"
commit_all "$repo" "docs(plans): Plan Commit を確定して implementing へ進める" > /dev/null

git -C "$repo" switch -q unrelated-branch
printf 'unrelated\n' > "$repo/unrelated.txt"
u_sha="$(commit_all "$repo" "chore: unrelated parallel work")"

git -C "$repo" switch -q main
git -C "$repo" merge -q --no-edit plan-branch > /dev/null
git -C "$repo" merge -q --no-edit unrelated-branch > /dev/null

# unrelated-branch の U は main の祖先だが、plan-branch の A の子孫ではない
write_packet "$repo" "packet.md" "$a_sha" "$u_sha"
commit_all "$repo" "docs(plans): gated amendment を記録" > /dev/null

capture_check "$repo" output
[[ "$CHECK_STATUS" -ne 0 ]] || fail "非 descendant の Amendments が ERROR 判定されなかった"
assert_contains "$output" "の descendant ではありません" "非 descendant ERROR が出力されない"
assert_not_contains "$output" "は現在の HEAD の祖先ではありません" "非 descendant テストで無関係な ancestor-of-HEAD ERROR も発生した"

# ============================================================================
# PK5: pending は skip（ERROR/WARN いずれも出さない）
# ============================================================================
repo="$tmp/pk5-pending-skip"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
commit_all "$repo" "base" > /dev/null
write_packet "$repo" "packet.md" "pending" "none"
commit_all "$repo" "docs(plans): plan-draft" > /dev/null

capture_check "$repo" output
[[ "$CHECK_STATUS" -eq 0 ]] || fail "pending packet で誤って ERROR になった:\n$output"
assert_not_contains "$output" "PK5:" "pending packet で PK5 出力が発生した（skip されていない）"

# ============================================================================
# T-G5: active packet ありで旧 state-only / state-backtrack subject の commit 列を
# 積んでも通る（commit の件数・subject を検査しない）
# ============================================================================
add_retired_subject_commits() {
    local repo="$1"
    state_only_commit "$repo" "docs(plans): state-only遷移 plan-draft->plan-gate"
    state_only_commit "$repo" "docs(plans): state-only遷移 plan-gate->plan-approved"
    state_only_commit "$repo" "docs(plans): state-only遷移 local-verified->independent-review"
    state_only_commit "$repo" "docs(plans): state-only遷移 human-confirm->ready-hosted-final"
    state_only_commit "$repo" "docs(plans): state-backtrack ready-hosted-final->implementing"
    state_only_commit "$repo" "docs(plans): state-backtrack implementing->implementing"
}

repo="$tmp/retired-subjects-with-packet"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
base_sha="$(commit_all "$repo" "base")"
git -C "$repo" update-ref refs/remotes/origin/main "$base_sha"
write_packet "$repo" "packet.md" "pending" "none"
a_sha="$(commit_all "$repo" "docs(plans): plan-first")"
write_packet "$repo" "packet.md" "$a_sha" "none"
commit_all "$repo" "docs(plans): Plan Commit を確定して implementing へ進める" > /dev/null
add_retired_subject_commits "$repo"

capture_check "$repo" output
[[ "$CHECK_STATUS" -eq 0 ]] || fail "旧 subject の commit 列で active packet ありの検査が ERROR になった:\n$output"
assert_not_contains "$output" "STATECAP" "active packet ありで STATECAP 出力が発生した"

# ============================================================================
# T-G6: docs/plans/ が無い repo（packet 0 件）でも同じ commit 列で通る。
# 旧実装は packet 0 件で STATECAP を走らせ ERROR になるため、撤去を判別する
# ============================================================================
repo="$tmp/retired-subjects-no-packet"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
base_sha="$(commit_all "$repo" "base")"
git -C "$repo" update-ref refs/remotes/origin/main "$base_sha"
add_retired_subject_commits "$repo"

capture_check "$repo" output
[[ "$CHECK_STATUS" -eq 0 ]] || fail "packet 0 件で旧 subject の commit 列が ERROR になった:\n$output"
assert_not_contains "$output" "STATECAP" "packet 0 件で STATECAP 出力が発生した"

echo "PASS: workflow-git-checks"

# T-G4: Evidence Mode 行は任意（あれば github だけ）。Phase は marker の有無に関わらず 8 値のどれか。
repo="$tmp/github-mode"
init_repo "$repo"
printf 'base\n' > "$repo/README.md"
base_sha="$(commit_all "$repo" base)"
git -C "$repo" update-ref refs/remotes/origin/main "$base_sha"
write_packet "$repo" packet.md pending none
plan_sha="$(commit_all "$repo" plan-first)"
write_packet "$repo" packet.md "$plan_sha" none
commit_all "$repo" implementation > /dev/null
packet="$repo/docs/plans/packet.md"
capture_check "$repo" output
[[ "$CHECK_STATUS" == 0 ]] || fail "markerless implementing packet rejected: $output"
sed -i '/^- Phase:/i\- Evidence Mode: github' "$packet"
capture_check "$repo" output
[[ "$CHECK_STATUS" == 0 ]] || fail "Evidence Mode: github packet rejected: $output"
for marker in legacy mystery; do
    sed -i "s/^- Evidence Mode:.*/- Evidence Mode: $marker/" "$packet"
    capture_check "$repo" output
    [[ "$CHECK_STATUS" != 0 ]] || fail "Evidence Mode: $marker accepted"
    assert_contains "$output" "Evidence Mode は廃止。書くなら github" "Evidence Mode: $marker reason missing"
done
sed -i 's/^- Evidence Mode:.*/- Evidence Mode: github/; s/^- Phase:.*/- Phase: local-verified/' "$packet"
capture_check "$repo" output
[[ "$CHECK_STATUS" != 0 ]] || fail "late tracked Phase accepted with marker"
sed -i '/^- Evidence Mode:/d' "$packet"
capture_check "$repo" output
[[ "$CHECK_STATUS" != 0 ]] || fail "late tracked Phase accepted without marker"
assert_contains "$output" "invalid tracked Phase" "markerless late Phase reason missing"
sed -i '/^- Phase:/d' "$packet"
capture_check "$repo" output
[[ "$CHECK_STATUS" != 0 ]] || fail "packet without Phase accepted"
sed -i '/^## Workflow State/a\\n- Phase: implementing' "$packet"
capture_check "$repo" output
[[ "$CHECK_STATUS" == 0 ]] || fail "restored packet rejected: $output"
echo "PASS: workflow state marker and phase"

# MG-D4: a real shallow clone must fail, even if its visible tip looks consistent.
shallow="$tmp/shallow"
git clone -q --depth 1 "file://$repo" "$shallow"
capture_check "$shallow" output
[[ "$CHECK_STATUS" != 0 ]] || fail "shallow history became successful evidence"
assert_contains "$output" "full history required" "shallow failure reason missing"
echo "PASS: shallow history rejected"

# An unrelated shallow ref does not make this separate parentless target incomplete.
git -C "$shallow" config user.name test
git -C "$shallow" config user.email test@example.invalid
empty_tree="$(git -C "$shallow" mktree < /dev/null)"
complete_root="$(printf 'complete root\n' | git -C "$shallow" commit-tree "$empty_tree")"
git -C "$shallow" switch -q --detach "$complete_root"
capture_check "$shallow" output
[[ "$CHECK_STATUS" == 0 ]] || fail "unrelated shallow marker rejected complete target: $output"
echo "PASS: unrelated shallow boundary excluded"
