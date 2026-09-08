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
for mode in baseline handler-omission duplicate wire-mismatch gitignored; do
    cp "$tmp/lib.rs" "$repo/src-tauri/src/lib.rs"
    cp "$tmp/bindings.ts" "$repo/src/lib/bindings.ts"
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
    else
        rg -q 'beta|unknown_wire' "$tmp/$mode.log"
    fi
    echo "PASS $mode: exit=$actual"
done
