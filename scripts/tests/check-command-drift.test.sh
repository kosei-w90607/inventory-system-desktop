#!/usr/bin/env bash
# SPEC-HYG3-CMD-1..4: production tree に触れず、固定した 2 command を oracle にする。
set -euo pipefail
SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
repo="$tmp/repo"
mkdir -p "$repo/src-tauri/src/cmd" "$repo/src/lib"
git init -q "$repo"
cat > "$repo/src-tauri/src/cmd/sample.rs" <<'RS'
#[tauri::command]
#[specta::specta]
pub fn alpha() {}
#[tauri::command]
pub async fn beta() {}
RS
cp "$repo/src-tauri/src/cmd/sample.rs" "$tmp/sample.rs"
cat > "$tmp/lib.rs" <<'RS'
fn register() {
    collect_commands![
        cmd::sample::alpha,
        cmd::sample::beta,
    ];
    tauri::generate_handler![
        cmd::sample::alpha,
        cmd::sample::beta,
    ];
}
RS
cat > "$tmp/bindings.ts" <<'TS'
export const commands = {
    alpha: () => __TAURI_INVOKE("alpha"),
    beta: () => __TAURI_INVOKE("beta"),
};
TS
for mode in baseline handler-omission duplicate wire-mismatch gitignored commented-declaration non-block-cfg-test nested-cfg-test; do
    cp "$tmp/lib.rs" "$repo/src-tauri/src/lib.rs"
    cp "$tmp/bindings.ts" "$repo/src/lib/bindings.ts"
    cp "$tmp/sample.rs" "$repo/src-tauri/src/cmd/sample.rs"
    expected=1
    case "$mode" in
        baseline) expected=0 ;;
        handler-omission)
            sed -i '/generate_handler!/,/];/{ /cmd::sample::beta,/d; }' "$repo/src-tauri/src/lib.rs"
            ;;
        duplicate)
            sed -i '/generate_handler!/,/];/{ /cmd::sample::beta,/p; }' "$repo/src-tauri/src/lib.rs"
            ;;
        wire-mismatch)
            sed -i 's/"beta"/"unknown_wire"/' "$repo/src/lib/bindings.ts"
            ;;
        gitignored)
            expected=0
            printf 'src-tauri/src/generated.rs\n' > "$repo/.gitignore"
            printf '#[tauri::command]\npub fn ignored_command() {}\n' > "$repo/src-tauri/src/generated.rs"
            ;;
        commented-declaration)
            # SC-CMD-1: コメントと空行を挟んだ未登録宣言も D に含める。
            # 登録済み alpha も同形にし、コメント対応の正の対照を置く。
            cat > "$repo/src-tauri/src/cmd/sample.rs" <<'RS'
#[tauri::command]
// registered command

#[specta::specta]
pub fn alpha() {}
#[tauri::command]
pub async fn beta() {}
RS
            cat >> "$repo/src-tauri/src/lib.rs" <<'RS'
#[tauri::command]
// comment

pub fn gamma() {}
RS
            ;;
        non-block-cfg-test)
            # SC-CMD-1: 非 block item の除外を次の production item へ持ち越さない。
            for prelude in \
                $'#[cfg(test)]\n#[allow(dead_code)]\nmod x;' \
                $'#[cfg(test)]\n#[allow(unused_imports)]\nuse std::fmt;' \
                '// #[cfg(test)] is only a comment'; do
                cp "$tmp/lib.rs" "$repo/src-tauri/src/lib.rs"
                printf '%s\n' "$prelude" >> "$repo/src-tauri/src/lib.rs"
                cat >> "$repo/src-tauri/src/lib.rs" <<'RS'
#[tauri::command]
pub fn gamma() {}
RS
                actual=0
                bash "$SOURCE_ROOT/scripts/check-command-drift.sh" "$repo" > "$tmp/prelude.log" 2>&1 || actual=$?
                [[ "$actual" -eq 1 ]]
                rg -q '^D=3 H=2 S=2 T=2$' "$tmp/prelude.log"
                rg -q '^gamma$' "$tmp/prelude.log"
            done
            cp "$tmp/lib.rs" "$repo/src-tauri/src/lib.rs"
            cat >> "$repo/src-tauri/src/lib.rs" <<'RS'
#[cfg(test)] use std::fmt;
#[tauri::command]
pub fn gamma() {}
RS
            ;;
        nested-cfg-test)
            expected=0
            # SC-CMD-1: nested 属性でも外側 test module の終端まで除外する。
            cat >> "$repo/src-tauri/src/lib.rs" <<'RS'
#[cfg(test)]
mod tests {
    #[cfg(test)]
    fn helper() {}
    #[tauri::command]
    pub fn test_only_command() {}
}
RS
            ;;
    esac
    actual=0
    bash "$SOURCE_ROOT/scripts/check-command-drift.sh" "$repo" > "$tmp/$mode.log" 2>&1 || actual=$?
    if [[ "$actual" -ne "$expected" ]]; then
        cat "$tmp/$mode.log"
        echo "FAIL $mode: expected=$expected actual=$actual" >&2
        exit 1
    fi
    if [[ "$mode" == baseline ]]; then
        # 独立した固定件数で、全収集が空でも PASS する欠陥を防ぐ。
        rg -q '^D=2 H=2 S=2 T=2$' "$tmp/$mode.log"
    elif [[ "$mode" == gitignored ]]; then
        diff "$tmp/baseline.log" "$tmp/gitignored.log"
    elif [[ "$mode" == nested-cfg-test ]]; then
        diff "$tmp/baseline.log" "$tmp/nested-cfg-test.log"
    elif [[ "$mode" == commented-declaration || "$mode" == non-block-cfg-test ]]; then
        rg -q '^D=3 H=2 S=2 T=2$' "$tmp/$mode.log"
        rg -q '^gamma$' "$tmp/$mode.log"
    else
        rg -q 'beta|unknown_wire' "$tmp/$mode.log"
    fi
    if [[ "$mode" == commented-declaration ]]; then
        # SC-CMD-1: 未対応の block コメントでも収集漏れを明示し、黙って捨てない。
        cat >> "$repo/src-tauri/src/lib.rs" <<'RS'
#[tauri::command]
/* unsupported declaration separator */
pub fn delta() {}
RS
        unsupported_actual=0
        bash "$SOURCE_ROOT/scripts/check-command-drift.sh" "$repo" > "$tmp/unsupported.log" 2>&1 || unsupported_actual=$?
        [[ "$unsupported_actual" -eq 1 ]]
        rg -q '^\[ERROR\] D の収集漏れ 1 件$' "$tmp/unsupported.log"
    fi
    echo "PASS $mode: exit=$actual"
done
