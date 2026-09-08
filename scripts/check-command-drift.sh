#!/usr/bin/env bash
# SPEC-HYG3-CMD-1..4: 宣言・runtime・Specta・wire 名の集合と重複を照合する。
set -euo pipefail
export LC_ALL=C
fail() { echo "[ERROR] $*" >&2; exit 1; }
command -v rg >/dev/null || fail "ripgrep (rg) is required"
root="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$root" || fail "cannot read root: $root"
[[ -d src-tauri/src && -f src-tauri/src/lib.rs && -f src/lib/bindings.ts ]] ||
    fail "missing src-tauri/src, lib.rs or src/lib/bindings.ts"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# rg の既定 gitignore 尊重で Rust source だけ列挙する（独自 walk を持たない）。
rg --files src-tauri/src | rg '\.rs$' > "$tmp/files"
while IFS= read -r file; do
    # production → pending（item 待ち）→ in_test（block 内）→ production の順に除外する。
    # ponytail: source の brace を数える近似。cfg 評価/macro 展開は別設計判断。
    awk '
        { sub(/\/\/.*/, "") }
        # nested cfg(test) で深度を再初期化すると外側 scope を途中で抜けるため、先に追跡する。
        in_test {
            depth += gsub(/{/, "{") - gsub(/}/, "}")
            if (depth <= 0) in_test=0
            next
        }
        /^[[:space:]]*#\[cfg\(test\)\]/ {
            pending=1
            sub(/^[[:space:]]*#\[cfg\(test\)\][[:space:]]*/, "")
        }
        pending {
            # 付随属性・空行は pending を維持し、同一行の item も処理する。
            while (sub(/^[[:space:]]*#\[[^]]*\][[:space:]]*/, "")) {}
            if ($0 ~ /^[[:space:]]*$/) next
            if (/{/) {
                depth=gsub(/{/, "{") - gsub(/}/, "}")
                in_test=(depth > 0)
                pending=0
            } else if (/;[[:space:]]*$/) pending=0
            next
        }
        { print }
    ' "$file"
done < "$tmp/files" > "$tmp/production.rs"
# command 属性から、付随属性・コメント・空行を挟んだ公開 fn 名までを拾う。
rg -U -o '#\[tauri::command([^]\n]*)\][[:space:]]*((#\[[^]\n]*\]|//[^\n]*)[[:space:]]*)*pub[[:space:]]+(async[[:space:]]+)?fn[[:space:]]+[A-Za-z_][A-Za-z_0-9]*' "$tmp/production.rs" |
    sed -nE 's/.*pub[[:space:]]+(async[[:space:]]+)?fn[[:space:]]+([A-Za-z_][A-Za-z_0-9]*).*/\2/p' > "$tmp/D" || true
# raw 属性数と照合し、未対応宣言を黙って捨てて D/H/S/T が一致する fail-open を防ぐ。
raw_count=$(awk '{ count += gsub(/#\[tauri::command/, "") } END { print count+0 }' "$tmp/production.rs")
parsed_count=$(wc -l < "$tmp/D")
[[ "$raw_count" -eq "$parsed_count" ]] || fail "D の収集漏れ $((raw_count - parsed_count)) 件"
[[ "$parsed_count" -gt 0 ]] || fail "no supported command declarations"

collect_registry() {
    local macro="$1"
    # macro 本体の各行は cmd::module::name, に限定。注釈は除去し未知構文は拒否する。
    awk -v macro="$macro" '
        { sub(/\/\/.*/, ""); line=$0 }
        index(line, macro "![") {
            if (inside) { bad=1; exit }
            inside=1; blocks++
            sub(".*" macro "!\\[", "", line)
        }
        inside {
            closing=index(line, "]")
            if (closing) line=substr(line, 1, closing-1)
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
            if (line != "") {
                n=split(line, entries, ",")
                for (i=1; i<=n; i++) {
                    entry=entries[i]
                    gsub(/^[[:space:]]+|[[:space:]]+$/, "", entry)
                    if (entry == "") continue
                    if (entry !~ /^cmd::[A-Za-z_][A-Za-z_0-9]*::[A-Za-z_][A-Za-z_0-9]*$/) {
                        print "unsupported " macro " entry: " entry > "/dev/stderr"
                        bad=1; exit
                    }
                    sub(/^cmd::[A-Za-z_][A-Za-z_0-9]*::/, "", entry)
                    print entry
                }
            }
            if (closing) inside=0
        }
        END { if (bad || inside || blocks != 1) exit 1 }
    ' src-tauri/src/lib.rs || fail "unsupported or missing $macro registry"
}
# D は test 除外後、H/S は raw lib.rs を走査する（generate_handler! は test 領域に置かない前提）。
# test 側にも registry を置いた場合は blocks != 1 で fail-closed にする。
collect_registry generate_handler > "$tmp/H"
collect_registry collect_commands > "$tmp/S"
# Specta が出力した invoke の第 1 引数（wire 名）だけを拾う。
rg -o '__TAURI_INVOKE\("[A-Za-z_][A-Za-z_0-9]*"' src/lib/bindings.ts |
    cut -d '"' -f 2 > "$tmp/T" || fail "no supported binding wire names"

failed=0
for set_name in D H S T; do
    [[ -s "$tmp/$set_name" ]] || fail "empty $set_name collection"
    sort "$tmp/$set_name" > "$tmp/$set_name.sorted"
    uniq -d "$tmp/$set_name.sorted" > "$tmp/duplicates"
    if [[ -s "$tmp/duplicates" ]]; then
        echo "[ERROR] duplicate $set_name:"
        cat "$tmp/duplicates"
        failed=1
    fi
    uniq "$tmp/$set_name.sorted" > "$tmp/$set_name.set"
done
printf 'D=%s H=%s S=%s T=%s\n' "$(wc -l < "$tmp/D")" "$(wc -l < "$tmp/H")" "$(wc -l < "$tmp/S")" "$(wc -l < "$tmp/T")"
# 12 方向すべてを列挙し、どの登録面に何が足りないかを表示する。
for left in D H S T; do
    for right in D H S T; do
        [[ "$left" == "$right" ]] && continue
        comm -23 "$tmp/$left.set" "$tmp/$right.set" > "$tmp/diff"
        if [[ -s "$tmp/diff" ]]; then
            echo "[ERROR] $left - $right:"
            cat "$tmp/diff"
            failed=1
        fi
    done
done
exit "$failed"
