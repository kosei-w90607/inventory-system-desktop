#!/usr/bin/env bash
# SPEC-MERGE-EVIDENCE / MG-D2: GitHub's skipped/neutral must never make a required job green.
set -euo pipefail
python3 - <<'PY'
import json
import os
import sys

try:
    needs = json.loads(os.environ['NEEDS_JSON'])
    flags = needs['changes']['outputs']
    keys = {'rust', 'rust_drift', 'frontend', 'docs', 'env', 'generated', 'traceability', 'workflow', 'unknown'}
    if set(flags) != keys or any(value not in ('true', 'false') for value in flags.values()):
        raise ValueError('invalid classification')
    if flags['unknown'] == 'true' and any(v != 'true' for v in flags.values()):
        raise ValueError('unknown path requires full fallback')
    required = {
        'changes': True, 'docs': True,
        'rust_lint': flags['rust'] == 'true',
        'rust_test': flags['rust'] == 'true',
        'rust_drift': any(flags[k] == 'true' for k in ('rust', 'rust_drift', 'generated', 'traceability')),
        'frontend': flags['frontend'] == 'true',
        'env_safety': flags['env'] == 'true',
        'workflow': flags['workflow'] == 'true',
    }
    if set(needs) != set(required):
        raise ValueError('missing or unknown job')
    for job, selected in required.items():
        result = needs[job]['result']
        if result != 'success' and not (not selected and result == 'skipped'):
            raise ValueError(f'{job}: {result} (required={selected})')
except (KeyError, TypeError, ValueError) as error:
    print(f'Merge gate blocked: {error}', file=sys.stderr)
    sys.exit(1)
print('Merge gate: all required jobs succeeded')
PY
