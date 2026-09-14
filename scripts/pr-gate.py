#!/usr/bin/env python3
"""SPEC-MERGE-EVIDENCE / MG-D5..D8. Owner-operated PR evidence; gh + stdlib only."""
import argparse
import base64
import copy
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from urllib.parse import quote

REPO = 'kosei-w90607/inventory-system-desktop'
OWNER = REPO.split('/')[0]
MARKER = '<!-- inventory-workflow-v1 -->'
POLICY = '.github/merge-gate-ruleset.json'
SHA = re.compile(r'[0-9a-f]{40}\Z')
OUTCOMES = {'pending', 'pass', 'fail', 'not-required'}
FIELDS = {'Evidence Mode', 'Phase', 'Risk', 'Execution Mode', 'Plan Commit', 'Amendments',
          'Coordinator', 'Writer', 'Plan Reviewer', 'Final Reviewer', 'Final Review Minimum', 'Human Gate'}


class GateError(Exception):
    def __init__(self, message, code=1):
        super().__init__(message)
        self.code = code


def require(condition, message, code=1):
    if not condition:
        raise GateError(message, code)


def command(argv, *, data=None, binary=False):
    try:
        result = subprocess.run(argv, input=data, capture_output=True, text=not binary, check=False)
    except OSError:
        raise GateError(f'command unavailable: {argv[0]}', 2) from None
    require(result.returncode == 0, f'command failed: {argv[0]} (exit {result.returncode})', 2)
    return result.stdout


def git(*args, binary=False):
    return command(['git', *args], binary=binary)


def unique_object(pairs):
    result = dict(pairs)
    require(len(result) == len(pairs), 'duplicate JSON fields', 2)
    return result


def decode_json(text):
    return json.loads(text, object_pairs_hook=unique_object)


def api(path, *, method='GET', payload=None, pages=False):
    argv = ['gh', 'api', '--hostname', 'github.com', '-X', method,
            '-H', 'Accept: application/vnd.github+json', path]
    if pages:
        argv += ['--paginate', '--slurp']
    if payload is not None:
        argv += ['--input', '-']
    try:
        return decode_json(command(argv, data=json.dumps(payload) if payload is not None else None))
    except (ValueError, TypeError):
        raise GateError('invalid GitHub JSON', 2) from None


def sha(value):
    require(isinstance(value, str) and SHA.fullmatch(value), 'invalid full SHA', 2)
    return value


def pointer(value):
    require(isinstance(value, str) and value.strip() and '\n' not in value and '\r' not in value,
            'evidence/run/model must be a nonempty public single-line pointer', 2)
    return value


def keys(value, required, optional=()):
    require(isinstance(value, dict) and set(required) <= value.keys() <= set(required) | set(optional),
            'invalid record fields', 2)


def evidence(values):
    require(isinstance(values, list), 'evidence must be an array', 2)
    for value in values:
        pointer(value)


def audit(value):
    keys(value, {'model', 'run_ref', 'evidence'})
    pointer(value['model']); pointer(value['run_ref']); evidence(value['evidence'])
    require(value['evidence'], 'audit evidence missing')


def validate_record(value, pr):
    keys(value, {'version', 'repo', 'pr', 'head', 'base', 'review', 'manual', 'r4'})
    require(type(value['version']) is int and value['version'] == 1 and value['repo'] == REPO
            and type(value['pr']) is int and value['pr'] == pr, 'record belongs to another repo/PR', 2)
    sha(value['head']); sha(value['base'])
    review = value['review']
    keys(review, {'outcome', 'broad', 'closure'})
    require(review['outcome'] in OUTCOMES, 'unknown review outcome', 2)
    broad, closure = review['broad'], review['closure']
    if broad is not None:
        keys(broad, {'head', 'base', 'plan_commit', 'amendments', 'audits'})
        sha(broad['head']); sha(broad['base'])
        if broad['plan_commit'] is not None:
            sha(broad['plan_commit'])
        require(isinstance(broad['amendments'], list), 'invalid amendments', 2)
        for item in broad['amendments']:
            sha(item)
        require(isinstance(broad['audits'], list), 'invalid audits', 2)
        for item in broad['audits']:
            audit(item)
        refs = [item['run_ref'] for item in broad['audits']]
        require(len(refs) == len(set(refs)), 'duplicate audit run_ref')
    if closure is not None:
        keys(closure, {'head', 'base', 'audit'})
        sha(closure['head']); sha(closure['base']); audit(closure['audit'])
        require(broad is not None and closure['audit']['run_ref'] not in [a['run_ref'] for a in broad['audits']],
                'closure must be an independent run')
    if review['outcome'] == 'not-required':
        require(broad is None and closure is None, 'unneeded review must have null audits')
    for kind in ('manual', 'r4'):
        result = value[kind]
        keys(result, {'outcome', 'evidence'}, {'source_head', 'reuse_approval'} if kind == 'manual' else ())
        require(result['outcome'] in OUTCOMES, 'unknown outcome', 2)
        evidence(result['evidence'])
        require(result['outcome'] != 'pass' or result['evidence'], f'{kind} pass needs evidence')
        require(('source_head' in result) == ('reuse_approval' in result), 'incomplete manual reuse')
        if 'source_head' in result:
            sha(result['source_head']); pointer(result['reuse_approval'])
            require(result['outcome'] == 'pass', 'only passed manual evidence may be reused')
    return value


def markdown(text):
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    return re.sub(r'(?m)^(```|~~~).*?^\1[^\n]*$', '', text, flags=re.S)


def parse_packet(text):
    text = markdown(text)
    sections = re.findall(r'^## Workflow State\s*\n(.*?)(?=^## |\Z)', text, flags=re.M | re.S)
    require(len(sections) == 1, 'packet Workflow State missing/ambiguous')
    pairs = re.findall(r'^- ([^:\n]+):\s*([^\n]+)', sections[0], flags=re.M)
    fields = dict(pairs)
    require(len(pairs) == len(fields) and FIELDS <= fields.keys(), 'packet fields missing/duplicate')
    require(fields['Evidence Mode'] == 'github', 'helper requires explicit github mode')
    require(not {'Reviewed Content HEAD', 'Final Exact-HEAD Evidence', 'Hosted CI Requirement'} & fields.keys(),
            'legacy fields in github packet')
    require(fields['Phase'] in ('kickoff','spec-check','design','plan-draft','plan-gate','plan-approved','implementing','archive'),
            'invalid tracked github Phase')
    require(fields['Risk'] in ('R2', 'R3', 'R4'), 'invalid packet Risk')
    risks = re.findall(r'^Risk: (R[0-4])\s*$', text, flags=re.M)
    require(risks == [fields['Risk']], 'packet Risk section mismatch')
    require(fields['Execution Mode'] in ('fable-window', 'dual-vendor-no-fable', 'codex-only'), 'unknown Execution Mode')
    plan = fields['Plan Commit']
    if plan == 'pending':
        require(fields['Phase'] in ('kickoff','spec-check','design','plan-draft','plan-gate'), 'approved Plan Commit missing')
    else:
        sha(plan)
    amendments = [] if fields['Amendments'] == 'none' else re.split(r'[,\s]+', fields['Amendments'])
    for item in amendments:
        sha(item)
    require(len(amendments) == len(set(amendments)), 'duplicate amendments')
    require(fields['Final Review Minimum'] in ('1', '2'), 'invalid review minimum')
    gates = fields['Human Gate'].split(',')
    require(len(gates) == len(set(gates)) and {'ready', 'merge'} <= set(gates) <= {'ready', 'merge', 'manual', 'r4'},
            'Human Gate must explicitly include ready,merge')
    require(fields['Risk'] != 'R4' or ('r4' in gates and fields['Final Review Minimum'] == '2'), 'R4 gates missing')
    return dict(phase=fields['Phase'], risk=fields['Risk'], mode=fields['Execution Mode'], plan_commit=plan, amendments=amendments,
                minimum=int(fields['Final Review Minimum']), manual='manual' in gates, r4='r4' in gates)


class Gate:
    def __init__(self, args):
        self.args = args
        require(args.repo == REPO, 'unsupported repository', 2)
        remote = git('remote', 'get-url', 'origin').strip()
        require(remote in (f'git@github.com:{REPO}.git', f'git@github.com:{REPO}',
                           f'https://github.com/{REPO}.git', f'https://github.com/{REPO}'), 'origin repo mismatch', 2)
        self.root = Path(git('rev-parse', '--show-toplevel').strip()).resolve()
        self.endpoint = f'repos/{REPO}'

    def pr(self):
        pr = api(f'{self.endpoint}/pulls/{self.args.pr}')
        require(pr['number'] == self.args.pr and pr['base']['repo']['full_name'] == REPO
                and pr['head']['repo']['full_name'] == REPO and pr['base']['ref'] == 'main', 'PR repo/base mismatch')
        sha(pr['head']['sha']); sha(pr['base']['sha'])
        require(pr['state'] == 'open' or pr.get('merged'), 'PR is closed')
        return pr

    def contents(self, path, ref):
        value = api(f'{self.endpoint}/contents/{quote(path, safe="/")}?ref={sha(ref)}')
        require(value.get('encoding') == 'base64', 'GitHub content unavailable', 2)
        return base64.b64decode(value['content'], validate=False).decode()

    def requirements(self, pr):
        head, base = pr['head']['sha'], pr['base']['sha']
        pages = api(f'{self.endpoint}/pulls/{self.args.pr}/files?per_page=100', pages=True)
        paths = [path for page in pages for item in page for path in (item['filename'], item.get('previous_filename', item['filename']))]
        require(paths and len(paths) < 6000, 'PR diff unavailable or truncated')
        # Use current main, not the PR's classifier, to determine review requirements.
        classifier = self.contents('scripts/ci/classify-changes.sh', base)
        output = command(['bash', '-c', classifier, 'classify-changes', '--files-from-stdin'], data='\n'.join(paths)+'\n')
        flags = dict(line.split('=', 1) for line in output.splitlines())
        expected = set('rust rust_drift frontend docs env generated traceability workflow unknown'.split())
        require(set(flags) == expected and all(v in ('true','false') for v in flags.values()), 'invalid main classifier', 2)
        entries = api(f'{self.endpoint}/contents/docs/plans?ref={head}')
        packets = [entry['path'] for entry in entries if entry['type'] == 'file' and re.fullmatch(r'\d{4}-\d\d-\d\d-.*\.md', entry['name'])]
        if self.args.packet:
            require(re.fullmatch(r'docs/plans/\d{4}-\d\d-\d\d-[A-Za-z0-9_-]+\.md', self.args.packet), 'invalid packet path', 2)
            require(packets == [self.args.packet], 'packet absent or multiple active packets')
            dashboard = markdown(self.contents('docs/Plans.md', head))
            section = re.search(r'^## 次の行動\s*\n(.*?)(?=^## |\Z)', dashboard, flags=re.M | re.S)
            require(section and f'](plans/{Path(self.args.packet).name})' in section[1], 'packet not registered in Plans')
            result = parse_packet(self.contents(self.args.packet, head))
        else:
            require(not packets, 'R2+ active packet requires --packet')
            require(self.args.risk in ('R0','R1') and self.args.manual in ('required','not-required'),
                    'no-packet route needs --risk R0|R1 --manual required|not-required', 2)
            require(not (flags['workflow'] == 'true' and flags['rust'] == 'true'), 'CI execution change requires R3 packet')
            result = dict(phase='implementing', risk=self.args.risk, mode=None, plan_commit=None, amendments=[], minimum=0,
                          manual=self.args.manual == 'required', r4=False)
        if result['minimum']:
            double = result['risk'] == 'R4' or flags['workflow'] == 'true' or (
                result['risk'] == 'R3' and result['mode'] == 'codex-only' and flags['frontend'] == 'true')
            require(not double or result['minimum'] == 2, 'required Double Audit minimum is 2')
        return result

    def server_record(self):
        pages = api(f'{self.endpoint}/issues/{self.args.pr}/comments?per_page=100', pages=True)
        records = [item for page in pages for item in page if MARKER in item.get('body', '')]
        require(len(records) <= 1, 'multiple workflow records')
        if not records:
            return None
        item = records[0]
        require(item['user']['login'] == OWNER, 'invalid workflow record author')
        match = re.fullmatch(re.escape(MARKER) + r'\n```json\n(.*?)\n```\n?', item['body'], flags=re.S)
        require(match is not None, 'malformed workflow record', 2)
        value = validate_record(decode_json(match[1]), self.args.pr)
        return dict(id=item['id'], body=item['body'], updated_at=item['updated_at'], record=value)

    def snapshot(self, *, clean=False):
        pr = self.pr()
        requirements = self.requirements(pr)
        server = self.server_record()
        if clean:
            require(requirements['phase'] == 'implementing', 'packet has not reached implementing')
            require(not git('status', '--porcelain', '--untracked-files=normal').strip(), 'capture requires clean checkout')
            require(git('rev-parse', 'HEAD').strip() == pr['head']['sha'], 'local HEAD differs from PR')
            for ref in (pr['base']['sha'], requirements['plan_commit'], *requirements['amendments']):
                if ref:
                    git('cat-file', '-e', f'{sha(ref)}^{{commit}}')
        require(self.same_pr(pr, self.pr()), 'head/base changed during observation')
        return dict(version=1, repo=REPO, pr=self.args.pr, head=pr['head']['sha'], base=pr['base']['sha'],
                    packet=self.args.packet, requirements=requirements, server=server), pr

    @staticmethod
    def same_pr(left, right):
        return all(left[k]['sha'] == right[k]['sha'] for k in ('head','base'))

    def validate_review(self, record, req, head, base):
        review = record['review']
        if not req['minimum']:
            require(review['outcome'] == 'not-required', 'R0/R1 review must be explicitly not-required')
            return
        require(review['outcome'] == 'pass', 'review not passed')
        broad = review['broad']
        require(broad is not None and len(broad['audits']) >= req['minimum'], 'broad audits below minimum')
        require(broad['plan_commit'] == req['plan_commit'] and broad['amendments'] == req['amendments'],
                'broad Plan contract changed; fresh broad required')
        closure = review['closure']
        if (broad['head'], broad['base']) == (head, base):
            require(closure is None, 'current broad must have null closure')
        else:
            require(closure is not None and (closure['head'], closure['base']) == (head, base), 'current closure missing')

    def reuse_geometry(self, old_head, old_base, head, base):
        require(old_head != head, 'reuse source must be previous head')
        require(git('show', '-s', '--format=%P', head).strip().split() == [old_head, base], 'not a single main merge')
        for left, right in ((old_base,old_head),(base,head)):
            require(len(git('merge-base', '--all', left, right).splitlines()) == 1, 'ambiguous merge-base')
        args = ('diff', '--binary', '--full-index', '--no-ext-diff', '--no-textconv')
        require(git(*args, f'{old_base}...{old_head}', '--', binary=True) == git(*args, f'{base}...{head}', '--', binary=True),
                'PR diff changed; manual reuse forbidden')

    def nonci(self, snap):
        server, req = snap['server'], snap['requirements']
        require(req.get('phase','implementing') == 'implementing', 'Plan Gate incomplete')
        if not server and not req['minimum'] and not req['manual'] and not req['r4']:
            return
        require(server is not None, 'workflow record missing')
        record = server['record']
        require((record['head'],record['base']) == (snap['head'],snap['base']), 'stale head/base in workflow record')
        self.validate_review(record, req, snap['head'], snap['base'])
        for kind in ('manual','r4'):
            require(record[kind]['outcome'] == ('pass' if req[kind] else 'not-required'), f'{kind} incomplete')
        manual = record['manual']
        if 'source_head' in manual:
            # Source pass was checked against the server when recording; verify geometry again.
            old_base = git('rev-parse', f"{snap['head']}^1^{{commit}}").strip()
            require(old_base == manual['source_head'], 'manual reuse source parent changed')
            require(len(git('show', '-s', '--format=%P', snap['head']).split()) == 2, 'manual reuse needs merge')
            require(git('rev-parse', f"{snap['head']}^2").strip() == snap['base'], 'manual reuse base changed')

    def rules(self, pr):
        desired = decode_json(self.contents(POLICY, pr['base']['sha']))
        require(desired['bypass_actors'] == [] and desired['enforcement'] == 'active'
                and desired['conditions']['ref_name'] == {'include':['refs/heads/main'], 'exclude':[]}, 'main policy invalid')
        effective = [r for page in api(f'{self.endpoint}/rules/branches/main?per_page=100', pages=True) for r in page]
        types = {r['type'] for r in effective}
        require({'pull_request','required_status_checks','deletion','non_fast_forward'} <= types, 'main protection missing')
        matched = False
        for rule in effective:
            if rule['type'] != 'required_status_checks':
                continue
            params = rule['parameters']
            if params.get('strict_required_status_checks_policy') is True and any(
                    c.get('context') == 'Merge gate' and c.get('integration_id') == 15368 for c in params['required_status_checks']):
                detail = api(f"{self.endpoint}/rulesets/{rule['ruleset_id']}")
                require(detail['bypass_actors'] == [], 'merge ruleset has bypass actors')
                require(detail['enforcement'] == 'active' and detail['target'] == 'branch', 'ruleset inactive')
                for key in ('name','conditions','rules'):
                    require(detail[key] == desired[key], f'main ruleset drift: {key}')
                matched = True
        require(matched, 'strict GitHub Actions Merge gate missing')

    def ci(self, pr):
        pages = api(f"{self.endpoint}/actions/workflows/ci.yml/runs?head_sha={pr['head']['sha']}&per_page=100", pages=True)
        runs = [r for page in pages for r in page['workflow_runs'] if r['head_sha'] == pr['head']['sha']]
        require(runs, 'CI run absent; check same-head runs before recovery dispatch')
        run = max(runs, key=lambda r: (r['created_at'],r['id']))
        require(run['event'] in ('pull_request','workflow_dispatch') and run['path'] == '.github/workflows/ci.yml'
                and run['head_repository']['full_name'] == REPO and run['head_branch'] == pr['head']['ref'], 'wrong CI workflow/source')
        require(run['status'] == 'completed' and run['conclusion'] == 'success', 'latest CI is pending/failed')
        checks = [c for page in api(f"{self.endpoint}/check-suites/{run['check_suite_id']}/check-runs?per_page=100", pages=True) for c in page['check_runs']]
        gate = [c for c in checks if c['name'] == 'Merge gate']
        require(len(gate) == 1 and gate[0]['app']['id'] == 15368 and gate[0]['status'] == 'completed'
                and gate[0]['conclusion'] == 'success', 'Merge gate missing, skipped or wrong app')
        return run['html_url']

    def status(self):
        snap, pr = self.snapshot()
        blockers = []
        if snap['requirements']['phase'] != 'implementing':
            return dict(state=snap['requirements']['phase'], blockers=['Plan Gate incomplete'], next='follow tracked Plan Gate')
        for check in (lambda: self.nonci(snap), lambda: self.rules(pr), lambda: self.ci(pr)):
            try:
                check()
            except GateError as error:
                if error.code == 2:
                    raise
                blockers.append(str(error))
        return dict(state='merged' if pr.get('merged') else ('Draft' if pr['draft'] else 'Ready'),
                    head=snap['head'], base=snap['base'], blockers=blockers,
                    next='resolve blockers' if blockers else ('owner Ready instruction' if pr['draft'] else 'owner merge instruction'))

    def capture(self):
        snap, _ = self.snapshot(clean=True)
        folder = self.root / '.local/pr-gate'
        require(git('check-ignore', '.local/pr-gate/capture.json').strip(), 'capture folder must be ignored')
        folder.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(mode='w', prefix=f'pr-{self.args.pr}-', suffix='.json', dir=folder, delete=False) as target:
            json.dump(snap, target, ensure_ascii=False, indent=2)
        return dict(capture=target.name, next='independent review or required manual check')

    def record(self):
        args = self.args
        require(args.capture and args.kind and args.outcome, 'record needs capture, kind and outcome', 2)
        path = Path(args.capture).resolve()
        require(path.parent == self.root / '.local/pr-gate', 'capture must belong to this checkout', 2)
        captured = decode_json(path.read_text())
        snap, pr = self.snapshot(clean=True)
        require(captured == snap, 'capture/server/head/base changed; fresh capture required')
        req, server = snap['requirements'], snap['server']
        old = server['record'] if server else None
        current = old and (old['head'],old['base']) == (snap['head'],snap['base'])
        if current:
            record = copy.deepcopy(old)
        else:
            record = dict(version=1, repo=REPO, pr=args.pr, head=snap['head'], base=snap['base'],
                          review=dict(outcome='pending' if req['minimum'] else 'not-required', broad=None, closure=None),
                          manual=dict(outcome='pending' if req['manual'] else 'not-required',evidence=[]),
                          r4=dict(outcome='pending' if req['r4'] else 'not-required',evidence=[]))
            if old and old['review']['broad']:
                broad=old['review']['broad']
                if (broad['plan_commit'],broad['amendments']) == (req['plan_commit'],req['amendments']):
                    record['review']['broad']=copy.deepcopy(broad)
        if args.kind == 'review':
            require(req['minimum'] and args.review_stage and args.pass_model and args.run_ref and args.evidence,
                    'review needs stage/model/run-ref/evidence', 2)
            item=dict(model=pointer(args.pass_model),run_ref=pointer(args.run_ref),evidence=args.evidence)
            broad=record['review']['broad']
            if args.review_stage == 'broad':
                if broad is None or (broad['head'],broad['base']) != (snap['head'],snap['base']):
                    broad=dict(head=snap['head'],base=snap['base'],plan_commit=req['plan_commit'],amendments=req['amendments'],audits=[])
                broad['audits']=[a for a in broad['audits'] if a['run_ref'] != args.run_ref] + [item]
                record['review']=dict(outcome=args.outcome,broad=broad,closure=None)
            else:
                require(server and broad and len(broad['audits']) >= req['minimum'], 'server broad required for closure')
                require((broad['head'],broad['base']) != (snap['head'],snap['base']), 'closure needs changed candidate')
                record['review']=dict(outcome=args.outcome,broad=broad,
                                      closure=dict(head=snap['head'],base=snap['base'],audit=item))
            if args.outcome == 'pass':
                self.validate_review(record,req,snap['head'],snap['base'])
        else:
            require((args.reuse_from is None) == (args.reuse_approval is None), 'reuse needs source and owner approval', 2)
            result=dict(outcome=args.outcome,evidence=args.evidence)
            if args.reuse_from:
                require(args.kind == 'manual' and args.outcome == 'pass' and old and old['manual']['outcome'] == 'pass', 'server manual pass required')
                require('source_head' not in old['manual'] and args.reuse_from == old['head'] and args.evidence == old['manual']['evidence'], 'manual source/evidence mismatch')
                self.reuse_geometry(sha(args.reuse_from),old['base'],snap['head'],snap['base'])
                result.update(source_head=args.reuse_from,reuse_approval=pointer(args.reuse_approval))
            require(args.outcome != 'not-required' or not req[args.kind], f'{args.kind} is required')
            record[args.kind]=result
        validate_record(record,args.pr)
        require(api('user')['login'] == OWNER, 'record writer must be repository owner')
        require(self.same_pr(pr,self.pr()) and self.server_record() == server, 'PR/comment changed before write')
        body=MARKER+'\n```json\n'+json.dumps(record,ensure_ascii=False,indent=2)+'\n```'
        endpoint=f"{self.endpoint}/issues/comments/{server['id']}" if server else f'{self.endpoint}/issues/{args.pr}/comments'
        api(endpoint,method='PATCH' if server else 'POST',payload={'body':body})
        require(self.same_pr(pr,self.pr()), 'head/base changed during write; record is stale')
        require(self.server_record()['record'] == record, 'record read-back mismatch')
        return dict(recorded=args.kind,outcome=args.outcome,next='fresh capture before next record')

    def mutate(self, action):
        snap, pr=self.snapshot()
        require(not pr.get('merged'), 'PR already merged')
        self.nonci(snap)
        self.rules(pr)
        if action == 'ready':
            require(pr['draft'], 'PR already Ready')
        else:
            require(not pr['draft'], 'PR is Draft')
            self.ci(pr)
            require(pr['mergeable'] is True and pr['mergeable_state'] == 'clean', 'PR not merge-clean')
        require(self.same_pr(pr,self.pr()) and self.server_record() == snap['server'], 'head/base/record changed before mutation')
        if action == 'ready':
            command(['gh','pr','ready',str(self.args.pr),'--repo',REPO])
        else:
            command(['gh','pr','merge',str(self.args.pr),'--repo',REPO,'--squash','--match-head-commit',snap['head']])
        after=self.pr()
        require(self.same_pr(pr,after), 'head/base changed during mutation; revalidate')
        require((not after['draft']) if action == 'ready' else after.get('merged'), 'mutation did not complete')
        return dict(state=action,next='wait for hosted CI' if action == 'ready' else 'docs closeout PR')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=('status','capture','record','ready','merge'))
    parser.add_argument('--pr',type=int,required=True)
    parser.add_argument('--repo',default=REPO)
    parser.add_argument('--packet',action='append')
    parser.add_argument('--risk',choices=('R0','R1'))
    parser.add_argument('--manual',choices=('required','not-required'))
    parser.add_argument('--json',action='store_true')
    parser.add_argument('--capture')
    parser.add_argument('--kind',choices=('review','manual','r4'))
    parser.add_argument('--outcome',choices=sorted(OUTCOMES))
    parser.add_argument('--evidence',action='append',default=[])
    parser.add_argument('--review-stage',choices=('broad','closure'))
    parser.add_argument('--pass-model')
    parser.add_argument('--run-ref')
    parser.add_argument('--reuse-from')
    parser.add_argument('--reuse-approval')
    args=parser.parse_args()
    try:
        require(args.pr > 0, 'PR number must be positive', 2)
        require(not args.packet or len(args.packet) == 1, 'exactly one packet may be specified', 2)
        args.packet = args.packet[0] if args.packet else None
        gate=Gate(args)
        result=gate.mutate(args.action) if args.action in ('ready','merge') else getattr(gate,args.action)()
        print(json.dumps(result,ensure_ascii=False) if args.json else '\n'.join(f'{k}: {v}' for k,v in result.items()))
        return 0
    except GateError as error:
        print(f'pr-gate: {error}',file=sys.stderr)
        return error.code
    except (ValueError,KeyError,TypeError,OSError,AttributeError) as error:
        print(f'pr-gate: invalid input or API response ({type(error).__name__})',file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
