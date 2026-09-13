#!/usr/bin/env bash
set -euo pipefail
# SPEC-MERGE-EVIDENCE / MG-D2: actual evaluator boundary, including every bad result.
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
python3 - <<'PY'
import copy
import json
import os
import subprocess

flags = dict.fromkeys('rust rust_drift frontend docs env generated traceability workflow unknown'.split(), 'false')
flags['docs'] = 'true'
needs = {name: {'result': 'skipped'} for name in ('rust_lint','rust_test','rust_drift','frontend','env_safety','workflow')}
needs.update(changes={'result':'success','outputs':flags}, docs={'result':'success'})
def run(data, expected):
    actual = subprocess.run(['bash','scripts/ci/check-required-jobs.sh'], env={**os.environ,'NEEDS_JSON':json.dumps(data)}, capture_output=True)
    assert (actual.returncode == 0) == expected, actual.stderr.decode()
run(needs, True)
data=copy.deepcopy(needs); data['changes']['outputs']['unknown']='true'; run(data,False)
for bad in ('failure','cancelled','skipped','neutral','pending','unknown',None):
    for job in ('changes','docs'):
        data=copy.deepcopy(needs); data[job]['result']=bad; run(data,False)
for job in needs:
    data=copy.deepcopy(needs); del data[job]; run(data,False)
for key in flags:
    for bad in ('', 'TRUE', True, None):
        data=copy.deepcopy(needs); data['changes']['outputs'][key]=bad; run(data,False)
    data=copy.deepcopy(needs); del data['changes']['outputs'][key]; run(data,False)
for job,flag in [('rust_lint','rust'),('rust_test','rust'),('rust_drift','rust_drift'),('frontend','frontend'),('env_safety','env'),('workflow','workflow')]:
    for bad in ('failure','cancelled','skipped','neutral','unknown',None):
        data=copy.deepcopy(needs); data['changes']['outputs'][flag]='true'; data[job]['result']=bad; run(data,False)
full=copy.deepcopy(needs)
full['changes']['outputs']=dict.fromkeys(flags,'true')
for job in full: full[job]['result']='success'
run(full, True)
print('PASS: merge-gate')
PY
