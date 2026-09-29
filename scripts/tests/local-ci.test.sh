#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCAL_CI="$SOURCE_ROOT/scripts/local-ci.sh"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

[[ -x "$LOCAL_CI" ]] || fail "local-ci.sh is missing or not executable"
grep -Fq 'run_required frontend-install "$REPO_ROOT" npm ci' "$LOCAL_CI" || fail "full mode does not run npm ci"
SUITE="$SOURCE_ROOT/scripts/tests/run-workflow-tests.sh"
grep -Fq 'bash scripts/tests/run-workflow-tests.sh' "$LOCAL_CI" || fail "local does not call shared suite"
grep -Fq 'bash scripts/tests/claude-hooks.test.sh' "$SUITE" || fail "shared hook audit missing"
grep -Fq 'bash -n "$shell_file"' "$SUITE" || fail "per-file shell syntax missing"

if "$LOCAL_CI" invalid > /tmp/local-ci-invalid.out 2>&1; then
    fail "invalid mode exited zero"
fi
grep -Fq "usage:" /tmp/local-ci-invalid.out || fail "invalid mode did not print usage"
rm -f /tmp/local-ci-invalid.out

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
repo="$tmp/repo"
mkdir -p "$repo/scripts/ci" "$repo/scripts/tests" "$repo/docs"
cp "$SOURCE_ROOT/scripts/local-ci.sh" "$repo/scripts/local-ci.sh"
cp "$SOURCE_ROOT/scripts/ci/classify-changes.sh" "$repo/scripts/ci/classify-changes.sh"
cat > "$repo/scripts/doc-consistency-check.sh" <<'EOF'
#!/bin/bash
echo "doc-check"
if [[ "${DOC_CHECK_MUTATE:-0}" == "1" ]]; then
    echo "gate mutation" >> README.md
fi
exit "${DOC_CHECK_EXIT:-0}"
EOF
printf '#!/bin/bash\necho "workflow-git-check"\nexit "${WORKFLOW_GIT_CHECK_EXIT:-0}"\n' > "$repo/scripts/check-workflow-git.sh"
printf '.local/\n' > "$repo/.gitignore"
chmod +x "$repo/scripts/local-ci.sh" "$repo/scripts/ci/classify-changes.sh" "$repo/scripts/doc-consistency-check.sh" "$repo/scripts/check-workflow-git.sh"

git -C "$repo" init -q
git -C "$repo" config user.name test
git -C "$repo" config user.email test@example.invalid
printf 'base\n' > "$repo/README.md"
git -C "$repo" add README.md .gitignore scripts
git -C "$repo" commit -qm base
git -C "$repo" branch -M main
base_sha="$(git -C "$repo" rev-parse HEAD)"
git -C "$repo" update-ref refs/remotes/origin/main "$base_sha"
git -C "$repo" switch -qc feature
printf 'docs\n' > "$repo/docs/example.md"
git -C "$repo" add docs/example.md
git -C "$repo" commit -qm docs
head_sha="$(git -C "$repo" rev-parse HEAD)"

(
    cd "$repo"
    bash scripts/local-ci.sh changed
)

clean_log="$(find "$repo/.local/ci-evidence" -type f -name "*${head_sha}*" | head -1)"
[[ -n "$clean_log" ]] || fail "CLEAN evidence file with HEAD SHA not found"
grep -Fq "HEAD_SHA=$head_sha" "$clean_log" || fail "HEAD SHA missing from evidence body"
grep -Fq "MODE=changed" "$clean_log" || fail "mode missing from evidence"
grep -Fq "TREE_STATE=CLEAN" "$clean_log" || fail "CLEAN marker missing"
grep -Fq "GATE=docs" "$clean_log" || fail "docs gate missing"
grep -Fq "GATE=workflow-git" "$clean_log" || fail "workflow-git gate missing (must run unconditionally like docs)"
grep -Fq "RESULT=PASS" "$clean_log" || fail "PASS result missing"

printf 'dirty\n' > "$repo/untracked.txt"
(
    cd "$repo"
    bash scripts/local-ci.sh changed
)
dirty_log="$(find "$repo/.local/ci-evidence" -type f -name "*${head_sha}*" | sort | tail -1)"
grep -Fq "TREE_STATE=DIRTY" "$dirty_log" || fail "DIRTY marker missing"
rm "$repo/untracked.txt"

if (
    cd "$repo"
    DOC_CHECK_MUTATE=1 bash scripts/local-ci.sh changed
); then
    fail "gate-created dirty state was accepted"
fi
mutated_log="$(find "$repo/.local/ci-evidence" -type f -name "*${head_sha}*" | sort | tail -1)"
grep -Eq '^END_TREE_STATE=DIRTY$' "$mutated_log" || fail "end DIRTY state missing"
grep -Eq '^RESULT=FAIL$' "$mutated_log" || fail "dirty mutation was not failed"
git -C "$repo" restore README.md

if (
    cd "$repo"
    DOC_CHECK_EXIT=9 bash scripts/local-ci.sh changed
); then
    fail "failed gate exited zero"
fi
failed_log="$(find "$repo/.local/ci-evidence" -type f -name "*${head_sha}*" | sort | tail -1)"
grep -Fq "RESULT=FAIL" "$failed_log" || fail "FAIL result missing"
grep -Eq '^EXIT_CODE=9$' "$failed_log" || fail "final gate exit code was not preserved"

if (
    cd "$repo"
    WORKFLOW_GIT_CHECK_EXIT=7 bash scripts/local-ci.sh changed
); then
    fail "workflow-git (PK5) gate failure was swallowed"
fi
workflow_git_failed_log="$(find "$repo/.local/ci-evidence" -type f -name "*${head_sha}*" | sort | tail -1)"
grep -Fq "GATE=workflow-git" "$workflow_git_failed_log" || fail "workflow-git gate missing from failure evidence"
grep -Fq "RESULT=FAIL" "$workflow_git_failed_log" || fail "workflow-git failure did not fail the run"
grep -Eq '^EXIT_CODE=7$' "$workflow_git_failed_log" || fail "workflow-git gate exit code was not preserved"

# SPEC-WF-HARNESS5-D5: full stops before any gate when node_modules is a symlink; changed does not.
mkdir -p "$tmp/bin" "$tmp/target"
printf 'kept\n' > "$tmp/target/marker"
for stub in npm cargo; do
    printf '#!/bin/bash\nprintf "%%s %%s\\n" "%s" "$*" >> "$STUB_LOG"\n' "$stub" > "$tmp/bin/$stub"
    chmod +x "$tmp/bin/$stub"
done
export STUB_LOG="$tmp/stub-calls.log"
: > "$STUB_LOG"
ln -s "$tmp/target" "$repo/node_modules"
latest_log() {
    find "$repo/.local/ci-evidence" -type f -name "local-ci-$1-${head_sha}-*" | sort | tail -1
}

if (
    cd "$repo"
    PATH="$tmp/bin:$PATH" bash scripts/local-ci.sh full
); then
    fail "full ran with a symlinked node_modules"
fi
symlink_log="$(latest_log full)"
grep -Fq "ERROR=node_modules is a symlink" "$symlink_log" || fail "symlink ERROR missing"
grep -Eq '^RESULT=FAIL$' "$symlink_log" || fail "symlink full did not fail"
if grep -q '^GATE=' "$symlink_log"; then
    fail "a gate ran before the symlink check"
fi
[[ ! -s "$STUB_LOG" ]] || fail "npm/cargo ran with a symlinked node_modules: $(cat "$STUB_LOG")"
[[ -f "$tmp/target/marker" ]] || fail "symlink target was modified"

(
    cd "$repo"
    PATH="$tmp/bin:$PATH" bash scripts/local-ci.sh changed
) || fail "changed stopped on a symlinked node_modules"
if grep -Fq "ERROR=" "$(latest_log changed)"; then
    fail "changed reported an ERROR for a symlinked node_modules"
fi

unlink "$repo/node_modules"
mkdir -p "$repo/node_modules" "$repo/src-tauri"
printf '#!/bin/bash\nexit 0\n' > "$repo/scripts/tests/run-workflow-tests.sh"
printf '#!/bin/bash\nexit 0\n' > "$repo/scripts/check-env-safety.sh"
(
    cd "$repo"
    PATH="$tmp/bin:$PATH" bash scripts/local-ci.sh full
) || true
real_log="$(latest_log full)"
if grep -Fq "ERROR=" "$real_log"; then
    fail "full with a real node_modules reported an ERROR"
fi
grep -Fq "GATE=frontend-install" "$real_log" || fail "full with a real node_modules did not reach frontend-install"
grep -Fxq "npm ci" "$STUB_LOG" || fail "npm ci was not called with a real node_modules"

echo "PASS: local-ci"
