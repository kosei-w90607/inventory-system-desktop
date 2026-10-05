#!/usr/bin/env python3
"""SPEC-MERGE-EVIDENCE / MG-D1a, MG-D5..D8: synthetic fixtures, no GitHub mutation."""
import argparse
import copy
import importlib.util
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
sys.dont_write_bytecode = True
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('pr_gate', ROOT/'scripts/pr-gate.py')
g=importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
H='a'*40; B='b'*40; P='c'*40; OLD='d'*40
REQ=dict(risk='R3',plan_commit=P,amendments=[],minimum=2,manual=True,r4=True)
# D-107 (3): literals from the packet's Boundary / Wire Contract, not from the helper.
FRESH_BROAD='broad Plan contract changed; fresh broad required: record --review-stage broad at the current head (a closure cannot carry this broad)'
BROAD_REQUIRED='broad required: record --review-stage broad at the current head until it has Final Review Minimum audits (no usable broad on the server; a closure cannot replace it)'

def good_record():
    return dict(version=1,repo=g.REPO,pr=7,head=H,base=B,
                review=dict(outcome='pass',broad=dict(head=H,base=B,plan_commit=P,amendments=[],
                    audits=[dict(model=m,run_ref=m,evidence=[f'https://example.invalid/{m}']) for m in ('sonnet','opus')]),closure=None),
                manual=dict(outcome='pass',evidence=['https://example.invalid/manual']),
                r4=dict(outcome='pass',evidence=['https://example.invalid/approval']))

def args(**kw):
    value=dict(repo=g.REPO,pr=7,packet=None,risk='R0',manual='not-required',capture=None,
               kind='review',outcome='pass',review_stage='broad',pass_model='sonnet',run_ref='new',
               evidence=['https://example.invalid/result'],reuse_from=None,reuse_approval=None,reviewed_head=H,pr_reviews=0)
    return argparse.Namespace(**(value|kw))

class Records(unittest.TestCase):
    def setUp(self):
        self.gate=object.__new__(g.Gate); self.gate.args=args(); self.gate.endpoint='repos/'+g.REPO
        self.record=good_record()
        self.snap=dict(head=H,base=B,requirements=copy.deepcopy(REQ),server=dict(record=self.record))
    def test_valid_and_all_pending_gates(self):
        g.validate_record(self.record,7); self.gate.nonci(self.snap)
        for kind in ('review','manual','r4'):
            for outcome in ('pending','fail','not-required'):
                data=copy.deepcopy(self.snap); data['server']['record'][kind]['outcome']=outcome
                with self.subTest(kind=kind,outcome=outcome),self.assertRaises(g.GateError): self.gate.nonci(data)
    def test_stale_version(self):
        for key in ('head','base'):
            data=copy.deepcopy(self.snap);data['server']['record'][key]=OLD
            with self.assertRaises(g.GateError):self.gate.nonci(data)
    def test_plan_contract_change_reported_before_stale(self):
        # T1-1 / D-107 (3): a changed Plan contract is named before stale head/base.
        data=copy.deepcopy(self.snap);record=data['server']['record']
        record['head']=OLD;record['review']['broad']['amendments']=[OLD]
        with self.assertRaisesRegex(g.GateError,'^'+re.escape(FRESH_BROAD)+'$'):self.gate.nonci(data)
    def test_stale_without_contract_change_keeps_stale(self):
        # T1-4 / MG-D8: the same contract at an old head stays a stale record.
        data=copy.deepcopy(self.snap);data['server']['record']['head']=OLD
        with self.assertRaisesRegex(g.GateError,'^stale head/base in workflow record$'):self.gate.nonci(data)
    def test_broad_contract_and_minimum(self):
        for key,value in [('plan_commit',None),('plan_commit',OLD),('amendments',[OLD]),('audits',[])]:
            data=copy.deepcopy(self.snap);data['server']['record']['review']['broad'][key]=value
            with self.assertRaises(g.GateError): self.gate.nonci(data)
    def test_closure_required_for_head_or_base_change(self):
        for key in ('head','base'):
            data=copy.deepcopy(self.snap);data['server']['record']['review']['broad'][key]=OLD
            with self.assertRaises(g.GateError):self.gate.nonci(data)
            data['server']['record']['review']['closure']=dict(head=H,base=B,audit=dict(model='opus',run_ref='closure',evidence=['https://example.invalid/closure']))
            self.gate.nonci(data)
    def test_wire_fail_closed(self):
        mutants=[]
        for key,value in [('repo','other/repo'),('pr',True),('head','abc'),('version',2)]:
            data=copy.deepcopy(self.record);data[key]=value;mutants.append(data)
        for kind in ('manual','r4'):
            data=copy.deepcopy(self.record);data[kind]['evidence']=[];mutants.append(data)
        data=copy.deepcopy(self.record);data['review']['broad']['audits'][1]['run_ref']='sonnet';mutants.append(data)
        data=copy.deepcopy(self.record);data['manual']['source_head']=OLD;mutants.append(data)
        for data in mutants:
            with self.assertRaises(g.GateError):g.validate_record(data,7)
    def test_comment_author_duplicate_malformed(self):
        body=g.MARKER+'\n```json\n'+json.dumps(self.record)+'\n```'
        item=dict(id=1,user=dict(login=g.OWNER),body=body,updated_at='today')
        with patch.object(g,'api',return_value=[[item]]):self.assertEqual(self.gate.server_record()['record'],self.record)
        for items in ([item,item],[item|dict(user=dict(login='attacker'))],[item|dict(body=g.MARKER+'bad')]):
            with patch.object(g,'api',return_value=[items]),self.assertRaises(g.GateError):self.gate.server_record()
    def test_r0_still_requires_explicit_manual(self):
        data=copy.deepcopy(self.snap); data['server']=None
        data['requirements'].update(minimum=0,r4=False,manual=True)
        with self.assertRaises(g.GateError):self.gate.nonci(data)
        data['requirements']['manual']=False;self.gate.nonci(data)
    def test_packet_schema(self):
        # T-H1: new template (no Evidence Mode / Execution Mode lines) is accepted and returns no mode.
        text='## Workflow State\n'+''.join(f'- {k}: {v}\n' for k,v in {
            'Phase':'implementing','Risk':'R3',
            'Plan Commit':P,'Amendments':'none','Coordinator':'owner','Writer':'codex',
            'Plan Reviewer':'opus','Final Reviewer':'sonnet','Final Review Minimum':'2','Human Gate':'ready,merge,manual'}.items())+'\n## Risk\nRisk: R3\n'
        parsed=g.parse_packet(text)
        self.assertEqual(parsed['minimum'],2)
        self.assertNotIn('mode',parsed)
        marker='- Phase: implementing'
        mutants=[(marker,'- Evidence Mode: legacy\n'+marker),(marker,'- Evidence Mode: mystery\n'+marker),
                 ('Phase: implementing','Phase: local-verified'),('Final Review Minimum: 2','Final Review Minimum: 0'),
                 ('Human Gate: ready,merge,manual','Human Gate: none'),(P,'pending')]
        mutants+=[(marker,f'- {field}: required\n'+marker) for field in ('Reviewed Content HEAD','Final Exact-HEAD Evidence','Hosted CI Requirement')]
        # Valueless lines must not vanish: Evidence Mode at section end and mid-section, and an empty required field.
        mutants+=[('\n\n## Risk','\n- Evidence Mode:\n## Risk'),(marker,'- Evidence Mode:\n'+marker),('Writer: codex','Writer:')]
        for source,dest in mutants:
            with self.subTest(dest=dest),self.assertRaises(g.GateError):g.parse_packet(text.replace(source,dest,1))
        fields=g.workflow_fields(text.replace(marker,'- Evidence Mode:\n'+marker,1))
        self.assertEqual((fields['Evidence Mode'],fields['Phase']),('','implementing'))
        # T-H2: old template lines are accepted and Execution Mode is not evaluated.
        for mode in ('fable-window','dual-vendor-no-fable','codex-only','waterfall（任意の文字列）'):
            with self.subTest(mode=mode):
                old=text.replace(marker,f'- Evidence Mode: github\n{marker}\n- Execution Mode: {mode}',1)
                self.assertEqual(g.parse_packet(old),parsed)

class RecordLifecycle(unittest.TestCase):
    setUp = Records.setUp
    # MG-D6 / GA1: server pass -> reused manual -> fresh capture -> current closure.
    def exercise(self, old, kind='manual', outcome='pass', source=OLD, values=None, mutate_capture=False, captured_requirements=REQ):
        with tempfile.TemporaryDirectory() as tmp:
            self.gate.root=Path(tmp)
            folder=Path(tmp)/'.local/pr-gate';folder.mkdir(parents=True)
            server=None if old is None else dict(id=1,body='previous',updated_at='before',record=copy.deepcopy(old))
            snap=dict(version=1,repo=g.REPO,pr=7,head=H,base=B,packet=None,requirements=REQ,server=server)
            capture=folder/'capture.json';capture.write_text(json.dumps(snap|dict(requirements=captured_requirements)))
            if mutate_capture and server:server['updated_at']='changed'
            self.gate.args=args(capture=str(capture),kind=kind,outcome=outcome,review_stage='closure',
                reuse_from=source if kind=='manual' else None,reuse_approval='https://example.invalid/owner' if source and kind=='manual' else None,
                evidence=values if values is not None else ['https://example.invalid/manual'])
            pr=dict(head=dict(sha=H),base=dict(sha=B))
            state={'server':server}
            def transport(path,method='GET',payload=None,**kwargs):
                if path=='user':return dict(login=g.OWNER)
                if '/pulls/7/reviews' in path and method=='GET':return [[]]
                self.assertIn('/comments',path)
                match=payload['body'].split('```json\n')[1].split('\n```')[0]
                state['server']=dict(id=1,body=payload['body'],updated_at='after',record=json.loads(match))
                return state['server']
            with patch.object(self.gate,'snapshot',return_value=(snap,pr)),patch.object(self.gate,'pr',return_value=pr),\
                 patch.object(self.gate,'server_record',side_effect=lambda:state['server']),\
                 patch.object(self.gate,'reuse_geometry'),patch.object(g,'api',side_effect=transport):
                self.gate.record()
            return state['server']['record']
    def previous(self):
        old=good_record();old['head']=OLD;old['review']['broad']['head']=OLD
        return old
    def test_reuse_then_closure_order(self):
        current=self.exercise(self.previous())
        self.assertEqual(current['manual']['source_head'],OLD)
        self.assertEqual(current['r4']['outcome'],'pending')
        self.assertEqual(current['review']['outcome'],'pending')
        complete=self.exercise(current,kind='review',source=None)
        self.assertEqual(complete['review']['closure']['head'],H)
        self.assertEqual(complete['manual']['outcome'],'pass')
    def test_source_record_missing_changed_or_not_pass(self):
        mutants=[None]
        for outcome in ('pending','fail','not-required'):
            old=self.previous();old['manual']['outcome']=outcome;mutants.append(old)
        for old in mutants:
            with self.assertRaises(g.GateError):self.exercise(old)
        with self.assertRaises(g.GateError):self.exercise(self.previous(),source=P)
        with self.assertRaises(g.GateError):self.exercise(self.previous(),values=['replaced'])
        with self.assertRaises(g.GateError):self.exercise(self.previous(),mutate_capture=True)
    def test_closure_first_loses_old_manual_and_cannot_restore_cache(self):
        current=self.exercise(self.previous(),kind='review',source=None)
        self.assertEqual(current['manual']['outcome'],'pending')
        with self.assertRaises(g.GateError):self.exercise(current)
    def test_old_shape_capture_requires_fresh_capture(self):
        # T-H7b: a capture made before the requirements lost 'mode' is rejected, not silently accepted.
        with self.assertRaisesRegex(g.GateError,'fresh capture required'):
            self.exercise(self.previous(),captured_requirements=REQ|dict(mode='codex-only'))
    def test_closure_without_server_broad_names_next_step(self):
        # T1-4 / D-107 (3): no usable broad (none recorded, or below minimum) names the broad to record.
        empty=self.previous();empty['review']=dict(outcome='pending',broad=None,closure=None)
        short=self.previous();short['review']['broad']['audits']=short['review']['broad']['audits'][:1]
        for old in (None,empty,short):
            with self.subTest(old=old and len((old['review']['broad'] or {}).get('audits',[]))):
                with self.assertRaises(g.GateError) as caught:self.exercise(old,kind='review',source=None)
                self.assertEqual(str(caught.exception),BROAD_REQUIRED)
    def test_changed_plan_requires_new_broad(self):
        old=self.previous();old['review']['broad']['plan_commit']=P.replace('c','f')
        with self.assertRaises(g.GateError):self.exercise(old,kind='review',source=None)


class GitReuse(unittest.TestCase):
    def test_exact_merge_and_changed_patch(self):
        with tempfile.TemporaryDirectory() as tmp:
            def git(*args): return subprocess.check_output(['git','-C',tmp,*args],text=True).strip()
            git('init','-q','-b','main');git('config','user.name','test');git('config','user.email','test@example.invalid')
            Path(tmp,'base').write_text('base');git('add','.');git('commit','-qm','base');base=git('rev-parse','HEAD')
            git('switch','-qc','feature');Path(tmp,'feature').write_text('feature');git('add','.');git('commit','-qm','feature');old=git('rev-parse','HEAD')
            git('switch','-q','main');Path(tmp,'main').write_text('main');git('add','.');git('commit','-qm','main');newbase=git('rev-parse','HEAD')
            git('switch','-q','feature');git('merge','-qm','sync','main');head=git('rev-parse','HEAD')
            gate=object.__new__(g.Gate)
            def bridge(*args,binary=False):return g.command(['git','-C',tmp,*args],binary=binary)
            with patch.object(g,'git',side_effect=bridge):
                gate.reuse_geometry(old,base,head,newbase)
                for wrong in ((base,base,head,newbase),(old,base,head,base),(old,base,old,newbase)):
                    with self.assertRaises(g.GateError):gate.reuse_geometry(*wrong)
                Path(tmp,'feature').write_text('changed');git('add','.');git('commit','-qm','edit')
                with self.assertRaises(g.GateError):gate.reuse_geometry(old,base,git('rev-parse','HEAD'),newbase)

# The fake gh executes as a process and validates HTTP endpoint/argv wiring, not just a mocked verdict.
FAKE_GH=r'''#!/usr/bin/env python3
import json,os,sys
from pathlib import Path
state_path=Path(os.environ['PR_GATE_FIXTURE'])
s=json.loads(state_path.read_text());a=sys.argv[1:]
s['calls'].append(a)
def save():state_path.write_text(json.dumps(s))
save()
if s.get('offline'):sys.exit(9)
if a[0]=='pr':
    assert a[1] in ('ready','merge') and '--repo' in a and '--admin' not in a
    if a[1]=='merge':
        assert a[a.index('--match-head-commit')+1]==s['pr']['head']['sha']
        if s.get('merge_race'):sys.exit(1)
        s['pr']['merged']=True
    else:s['pr']['draft']=False
    save();sys.exit(0)
assert a[0]=='api' and a[1:3]==['--hostname','github.com']
method=a[a.index('-X')+1];path=a[7]
if s.get('http_error_path') and s['http_error_path'] in path:sys.exit(1)
if method!='GET':
    assert '/issues/' in path and '/comments' in path
    payload=json.load(sys.stdin);assert list(payload)==['body']
    s['comments']=[dict(id=1,user=dict(login=s['owner']),body=payload['body'],updated_at='now')]
    save();print(json.dumps(s['comments'][0]));sys.exit(0)
if path=='user':value={'login':s['owner']}
elif '/pulls/7/files' in path:value=s['file_pages'] if 'file_pages' in s else [s['files']]
elif '/pulls/7/reviews' in path:value=s['review_pages'] if 'review_pages' in s else [s.get('reviews',[])]
elif path.endswith('/pulls/7'):
    s['reads']=s.get('reads',0)+1
    if s.get('head_race_at')==s['reads']:s['pr']['head']['sha']='e'*40
    save();value=s['pr']
elif '/issues/7/comments' in path:value=[s['comments']]
elif '/contents/' in path:
    import base64
    name=path.split('/contents/')[1].split('?')[0]
    # Head listings stay served so a regression back to listing-based selection is caught.
    if name=='docs':value=[dict(type='dir',name='plans',path='docs/plans')]
    elif name=='docs/plans':value=s.get('packets',[])
    else:
        ref=path.split('?ref=')[1]
        content=s.get('snapshots',{}).get(ref,{}).get(name,s['contents'][name])
        value={'encoding':'base64','content':base64.b64encode(content.encode()).decode()}
elif '/rules/branches/main' in path:value=[s['effective']]
elif '/rulesets/1' in path:value=s['policy']
elif '/actions/workflows/ci.yml/runs' in path:value=[{'workflow_runs':s['runs']}]
elif '/check-suites/2/check-runs' in path:value=[{'check_runs':s['checks']}]
else:raise AssertionError(path)
print(json.dumps(value))
'''

HELPER='scripts/pr-gate.py';HELPER_TEXT=(ROOT/HELPER).read_text()

class CLI(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        self.repo=self.root/'repo';self.repo.mkdir();self.bin=self.root/'bin';self.bin.mkdir()
        self.gh=self.bin/'gh';self.gh.write_text(FAKE_GH);self.gh.chmod(0o755)
        def git(*args):return subprocess.check_output(['git','-C',str(self.repo),*args],text=True).strip()
        self.git=git;git('init','-q','-b','feature');git('config','user.name','test');git('config','user.email','test@example.invalid')
        (self.repo/'.gitignore').write_text('.local/\n');git('add','.');git('commit','-qm','fixture');self.head=git('rev-parse','HEAD')
        git('remote','add','origin','https://github.com/'+g.REPO+'.git')
        policy=json.loads((ROOT/'.github/merge-gate-ruleset.json').read_text())
        self.state={'owner':g.OWNER,'calls':[],'pr':dict(number=7,state='open',merged=False,draft=True,
            head=dict(sha=self.head,ref='feature',repo=dict(full_name=g.REPO)),base=dict(sha=self.head,ref='main',repo=dict(full_name=g.REPO)),mergeable=True,mergeable_state='clean'),
            'files':[dict(filename='docs/example.md',status='modified')], 'comments':[], 'policy':policy,
            'contents':{'scripts/ci/classify-changes.sh':(ROOT/'scripts/ci/classify-changes.sh').read_text(),g.POLICY:json.dumps(policy),
                        HELPER:HELPER_TEXT},
            'effective':[r|{'ruleset_id':1} for r in policy['rules']],
            'runs':[dict(id=10,head_sha=self.head,created_at='2026-09-14',event='pull_request',path='.github/workflows/ci.yml',head_repository=dict(full_name=g.REPO),head_branch='feature',status='completed',conclusion='success',check_suite_id=2,html_url='https://example.invalid/run')],
            'checks':[dict(name='Merge gate',app=dict(id=15368),status='completed',conclusion='success')]}
        self.file=self.root/'api.json';self.save()
    def tearDown(self):self.tmp.cleanup()
    def save(self):self.file.write_text(json.dumps(self.state))
    def load(self):self.state=json.loads(self.file.read_text());return self.state
    def run_cli(self,action,*extra,expected=0):
        before=self.git('status','--porcelain')
        value=subprocess.run(['python3',str(ROOT/'scripts/pr-gate.py'),action,'--pr','7','--risk','R0','--manual','not-required','--json',*extra],cwd=self.repo,
            env={**os.environ,'PATH':str(self.bin)+os.pathsep+os.environ['PATH'],'PR_GATE_FIXTURE':str(self.file)},capture_output=True,text=True)
        self.assertEqual(value.returncode,expected,value.stdout+value.stderr)
        self.assertEqual(self.git('status','--porcelain'),before)
        return json.loads(value.stdout) if value.returncode==0 else value.stderr
    @staticmethod
    def packet_text(fields):
        return '## Workflow State\n'+''.join(f'- {k}: {v}\n' for k,v in fields.items())+'\n## Risk\nRisk: '+fields['Risk']+'\n'

    def configure_packet(self, **overrides):
        packet='docs/plans/2026-09-14-fixture.md'
        self.plan_ref=self.head
        self.git('commit','--allow-empty','-qm','candidate after plan')
        self.head=self.git('rev-parse','HEAD')
        self.state['pr']['head']['sha']=self.head
        self.state['runs'][0]['head_sha']=self.head
        self.state['files']=self.state['files']+[dict(filename=packet,status='added')]
        fields={'Phase':'implementing','Risk':'R3',
                'Plan Commit':self.plan_ref,'Amendments':'none','Coordinator':'owner','Writer':'codex','Plan Reviewer':'opus',
                'Final Reviewer':'sonnet+opus','Final Review Minimum':'2','Human Gate':'ready,merge'} | overrides
        self.state['contents'][packet]=self.packet_text(fields)
        # Approval snapshot predates its own SHA; phase/self-reference are not gate conditions.
        approved=fields | {'Phase':'plan-gate','Plan Commit':'pending'}
        self.state['snapshots']={self.plan_ref:{packet:self.packet_text(approved)}}
        self.save()
        return packet,fields

    def test_unamended_gate_condition_changes_are_rejected(self):
        cases=[({'Risk':'R4','Human Gate':'ready,merge,manual,r4'},'Risk','R3'),
               ({'Human Gate':'ready,merge,manual'},'Human Gate','ready,merge'),
               ({},'Final Review Minimum','1')]
        for approved,key,value in cases:
            with self.subTest(field=key):
                packet,fields=self.configure_packet(**approved)
                self.state['contents'][packet]=self.packet_text(fields | {key:value})
                self.save()
                result=self.run_cli('status','--packet',packet,expected=1)
                self.assertIn('approved packet condition changed: '+key,result)
                self.run_cli('ready','--packet',packet,expected=1)

    def test_execution_mode_change_is_not_a_gate_condition(self):
        # T-H6: approved snapshot carries Execution Mode; current changes or drops it without a condition error.
        for current in ('dual-vendor-no-fable',None):
            with self.subTest(current=current):
                packet,fields=self.configure_packet(**{'Execution Mode':'fable-window'})
                if current is None:
                    fields=dict(fields);del fields['Execution Mode']
                else:
                    fields=fields|{'Execution Mode':current}
                self.state['contents'][packet]=self.packet_text(fields);self.save()
                status=self.run_cli('status','--packet',packet)
                self.assertEqual(status['state'],'Draft')
                self.assertFalse([b for b in status['blockers'] if 'approved packet condition changed' in b],status['blockers'])

    def test_registered_amendment_order_cannot_roll_back_manual(self):
        packet='docs/plans/2026-09-14-fixture.md'
        path=self.repo/packet;path.parent.mkdir(parents=True)
        fields={'Phase':'plan-gate','Risk':'R3',
                'Plan Commit':'pending','Amendments':'none','Coordinator':'owner','Writer':'codex','Plan Reviewer':'opus',
                'Final Reviewer':'sonnet','Final Review Minimum':'1','Human Gate':'ready,merge,manual'}
        def commit(subject):
            path.write_text(self.packet_text(fields));self.git('add',packet);self.git('commit','-qm',subject)
            return self.git('rev-parse','HEAD')
        plan=commit('plan-first')
        fields.update({'Phase':'implementing','Plan Commit':plan})
        commit('approve plan')
        fields['Human Gate']='ready,merge'
        a1=commit('A1 approved without manual')
        fields['Amendments']=a1;commit('register A1')
        fields['Human Gate']='ready,merge,manual'
        a2=commit('A2 requires manual')
        fields['Amendments']=a1+', '+a2
        commit('register A2')
        self.state['files']=[dict(filename=packet,status='added')]
        self.state['snapshots']={ref:{packet:self.git('show',ref+':'+packet)} for ref in (plan,a1,a2)}
        def observe():
            self.state['pr']['head']['sha']=self.git('rev-parse','HEAD')
            self.state['contents'][packet]=path.read_text();self.save()
            capture=self.run_cli('capture','--packet',packet)['capture']
            check=subprocess.run(['bash',str(ROOT/'scripts/check-workflow-git.sh')],cwd=self.repo,capture_output=True,text=True)
            return json.loads(Path(capture).read_text())['requirements'],check
        required,check=observe()
        self.assertTrue(required['manual'])
        self.assertEqual(check.returncode,0,check.stdout+check.stderr)
        fields.update({'Amendments':a2+', '+a1,'Human Gate':'ready,merge'})
        commit('invalid reorder restores older A1 conditions')
        downgraded,check=observe()
        # The helper selects the last entry; shared PK5 must make this candidate unmergeable.
        self.assertFalse(downgraded['manual'])
        self.assertNotEqual(check.returncode,0,'PK5 accepted A2,A1 and helper captured manual=false: '+check.stdout)
        self.assertIn('Amendments が削除・変更されています',check.stdout)

    def test_latest_amendment_snapshot_owns_gate_conditions(self):
        packet,fields=self.configure_packet(**{'Human Gate':'ready,merge,manual'})
        amended=fields | {'Final Review Minimum':'1','Human Gate':'ready,merge'}
        self.state['snapshots'][P]={packet:self.packet_text(amended | {'Phase':'plan-gate','Plan Commit':'pending'})}
        self.state['contents'][packet]=self.packet_text(amended | {'Amendments':P})
        self.save()
        self.assertEqual(self.run_cli('status','--packet',packet)['state'],'Draft')
        # Merely pointing to the old Plan Commit cannot authorize the amendment's conditions.
        self.state['contents'][packet]=self.packet_text(amended)
        self.save()
        self.assertIn('approved packet condition changed',self.run_cli('status','--packet',packet,expected=1))

    def test_status_capture_ready_merge(self):
        self.assertEqual(self.run_cli('status')['blockers'],[])
        self.assertTrue(all(c[0]=='api' and 'GET' in c for c in self.load()['calls']))
        capture=self.run_cli('capture')['capture'];self.assertTrue(Path(capture).is_file())
        self.run_cli('ready');self.run_cli('merge')
        self.assertTrue(self.load()['pr']['merged'])
    def test_packet_double_audit_cli(self):
        packet,fields=self.configure_packet()
        self.state['files']=[dict(filename='scripts/pr-gate.py',status='modified'),dict(filename=packet,status='added')];self.save()
        common=('--packet',packet)
        capture=self.run_cli('capture',*common)['capture']
        self.run_cli('record',*common,'--capture',capture,'--kind','review','--review-stage','broad','--pass-model','sonnet','--run-ref','sonnet-audit','--evidence','https://example.invalid/sonnet','--outcome','pending','--reviewed-head',self.head,'--pr-reviews','0')
        self.assertIn('review not passed',self.run_cli('ready',*common,expected=1))
        capture=self.run_cli('capture',*common)['capture']
        self.run_cli('record',*common,'--capture',capture,'--kind','review','--review-stage','broad','--pass-model','opus','--run-ref','opus-audit','--evidence','https://example.invalid/opus','--outcome','pass','--reviewed-head',self.head,'--pr-reviews','0')
        self.run_cli('ready',*common)
        self.run_cli('status',*common,*common,expected=2)
        self.load()
        self.state['contents'][packet]=self.state['contents'][packet].replace('Phase: implementing','Phase: plan-gate').replace('Plan Commit: '+fields['Plan Commit'],'Plan Commit: pending')
        self.state['comments']=[]
        self.state['pr']['draft']=True
        self.save()
        waiting=self.run_cli('status',*common)
        self.assertIn('Plan Gate incomplete',waiting['blockers'])
        self.assertIn('Plan Gate incomplete',self.run_cli('ready',*common,expected=1))
        self.assertIn('packet has not reached implementing',self.run_cli('capture',*common,expected=1))
        self.assertIn('Plan Gate incomplete',self.run_cli('merge',*common,expected=1))


    def test_workflow_minimum_one_rejected(self):
        packet,_=self.configure_packet(**{'Final Review Minimum':'1'})
        self.state['files']=[dict(filename='scripts/pr-gate.py',status='modified'),dict(filename=packet,status='added')];self.save()
        for action in ('status','ready'):
            self.assertIn('required Double Audit minimum is 2',self.run_cli(action,'--packet',packet,expected=1))

    def test_r4_minimum_one_rejected(self):
        packet,_=self.configure_packet(**{'Risk':'R4','Human Gate':'ready,merge,r4','Final Review Minimum':'1'})
        for action in ('status','ready'):
            self.assertIn('R4 gates missing',self.run_cli(action,'--packet',packet,expected=1))

    def test_r4_approval_gate_cannot_be_omitted(self):
        packet,_=self.configure_packet(**{'Risk':'R4'})
        for action in ('status','ready'):
            self.assertIn('R4 gates missing',self.run_cli(action,'--packet',packet,expected=1))

    def test_codex_only_r3_ui_minimum_one_accepted(self):
        # T-H7a: Execution Mode no longer changes the review count; only R4 / workflow require 2.
        packet,_=self.configure_packet(**{'Execution Mode':'codex-only','Final Review Minimum':'1'})
        self.state['files']=[dict(filename='src/features/example/view.tsx',status='modified'),dict(filename=packet,status='added')];self.save()
        status=self.run_cli('status','--packet',packet)
        self.assertFalse([b for b in status['blockers'] if 'minimum' in b.lower()],status['blockers'])

    def assert_rules_blocked(self):
        self.save()
        self.assertTrue(self.run_cli('status')['blockers'])
        self.run_cli('ready',expected=1)
        self.load();self.state['pr']['draft']=False;self.save()
        self.run_cli('merge',expected=1)
        self.assertFalse(any(call[0]=='pr' for call in self.load()['calls']))

    def add_rule_defaults(self, additions):
        # API detail is separate from both the main contents and effective rules.
        self.state['policy']=copy.deepcopy(self.state['policy'])
        self.state['policy']['rules'][2]['parameters'].update(copy.deepcopy(additions))

    def test_rules_accept_observed_defaults(self):
        original=copy.deepcopy(self.state)
        # MG-D1a: observed response literals, not copied from the desired policy.
        for additions in ({}, {'required_reviewers': []},
                          {'require_extra_approval_for_unattributed_changes': True},
                          {'required_reviewers': [], 'require_extra_approval_for_unattributed_changes': True}):
            with self.subTest(additions=additions):
                self.state=copy.deepcopy(original);self.add_rule_defaults(additions);self.save()
                self.assertEqual(self.run_cli('status')['blockers'],[])
                self.run_cli('ready');self.run_cli('merge')
                self.assertTrue(self.load()['pr']['merged'])

    def test_rules_reject_default_value_or_type_drift(self):
        original=copy.deepcopy(self.state)
        for key,values in (
            ('required_reviewers', [[{}], None, {}, '[]', False, 0]),
            ('require_extra_approval_for_unattributed_changes', [False, None, 'true', 0, 1, [], {}]),
        ):
            for value in values:
                with self.subTest(key=key,value=value):
                    self.state=copy.deepcopy(original)
                    self.add_rule_defaults({'required_reviewers': [], 'require_extra_approval_for_unattributed_changes': True})
                    self.state['policy']['rules'][2]['parameters'][key]=value
                    self.assert_rules_blocked()

    def test_rules_defaults_preserve_drift_rejection(self):
        self.add_rule_defaults({'required_reviewers': [], 'require_extra_approval_for_unattributed_changes': True})
        original=copy.deepcopy(self.state);rules=original['policy']['rules']
        changes=[
            (('rules',2,'parameters','unknown_default'), []),
            (('rules',3,'parameters','required_reviewers'), []),
            (('rules',2,'parameters','allowed_merge_methods'), list(reversed(rules[2]['parameters']['allowed_merge_methods']))),
            (('rules',2,'parameters','required_review_thread_resolution'), True),
            (('rules',3,'parameters','strict_required_status_checks_policy'), False),
            (('rules',3,'parameters','required_status_checks'), [{'context':'Other','integration_id':15368}]),
            (('rules',3,'parameters','required_status_checks'), [{'context':'Merge gate','integration_id':1}]),
            (('rules',), rules[1:]),
            (('rules',), rules[:1]+rules[2:]),
            (('rules',), rules[:2]+rules[3:]),
            (('rules',), list(reversed(rules))),
            (('name',), 'other-policy'),
            (('target',), 'tag'),
            (('enforcement',), 'evaluate'),
            (('conditions','ref_name','include'), ['refs/heads/other']),
            (('conditions','ref_name','exclude'), ['refs/heads/main']),
            (('bypass_actors',), [{'actor_id':1,'actor_type':'RepositoryRole','bypass_mode':'always'}]),
        ]
        for path,value in changes:
            with self.subTest(path=path,value=value):
                self.state=copy.deepcopy(original);target=self.state['policy']
                for key in path[:-1]:target=target[key]
                target[path[-1]]=copy.deepcopy(value)
                self.assert_rules_blocked()

    def test_rules_keep_explicit_desired_defaults(self):
        original=copy.deepcopy(self.state)
        for key,expected,other in (
            ('required_reviewers', [], [{}]),
            ('require_extra_approval_for_unattributed_changes', False, True),
        ):
            for matches,value in ((True,expected),(False,other)):
                with self.subTest(key=key,matches=matches):
                    self.state=copy.deepcopy(original)
                    desired=copy.deepcopy(original['policy']);desired['rules'][2]['parameters'][key]=expected
                    self.state['pr']['base']['sha']=B
                    self.state['snapshots']={B:{g.POLICY:json.dumps(desired)}}
                    self.state['contents'][g.POLICY]='{}'  # Only the main snapshot is authoritative.
                    self.state['policy']=copy.deepcopy(desired)
                    self.state['policy']['rules'][2]['parameters'][key]=value
                    if matches:
                        self.save();self.assertEqual(self.run_cli('status')['blockers'],[])
                        self.run_cli('ready');self.run_cli('merge')
                    else:self.assert_rules_blocked()

    def test_rules_leave_inputs_unchanged(self):
        desired=json.loads(self.state['contents'][g.POLICY])
        self.add_rule_defaults({'required_reviewers': [], 'require_extra_approval_for_unattributed_changes': True})
        detail=self.state['policy'];effective=self.state['effective']
        before=copy.deepcopy((desired,detail,effective))
        gate=object.__new__(g.Gate);gate.endpoint='repos/'+g.REPO
        with patch.object(gate,'contents',return_value='main policy'), \
             patch.object(g,'decode_json',return_value=desired), \
             patch.object(g,'api',side_effect=[[effective],detail]):
            gate.rules(self.state['pr'])
        self.assertEqual((desired,detail,effective),before)

    def test_rules_reject_strict_false(self):
        for rule in self.state['effective']:
            if rule['type']=='required_status_checks':
                rule['parameters']['strict_required_status_checks_policy']=False
        # Desired/detail remain strong: each fresh response must independently be safe.
        self.state['policy']=json.loads(self.state['contents'][g.POLICY])
        self.assert_rules_blocked()

    def test_rules_reject_bypass(self):
        self.state['policy']['bypass_actors']=[{'actor_id':1,'actor_type':'RepositoryRole','bypass_mode':'always'}]
        self.assert_rules_blocked()

    def test_rules_reject_inactive_enforcement(self):
        self.state['policy']['enforcement']='evaluate'
        self.assert_rules_blocked()

    def test_rules_reject_parameter_drift(self):
        self.state['policy']['rules'][2]['parameters']['required_review_thread_resolution']=True
        self.assert_rules_blocked()

    def test_bad_rules_checks_latest_run(self):
        for group,change in [('effective',[]),('checks',[]),('checks',[dict(name='Merge gate',app=dict(id=1),status='completed',conclusion='success')]),('checks',[dict(name='Merge gate',app=dict(id=15368),status='completed',conclusion='skipped')])]:
            original=copy.deepcopy(self.state[group]);self.state[group]=change;self.save()
            self.assertTrue(self.run_cli('status')['blockers']);self.state[group]=original
        self.state['runs'].append(self.state['runs'][0]|dict(id=11,status='in_progress',conclusion=None));self.save()
        self.assertTrue(self.run_cli('status')['blockers'])
    def test_offline_bad_repo_input_and_race(self):
        self.state['offline']=True;self.save();self.run_cli('status',expected=2)
        self.state.pop('offline');self.save();self.run_cli('status','--repo','wrong/repo',expected=2)
        self.run_cli('status','--pr','-1',expected=2)
        self.state['head_race_at']=2;self.save();self.run_cli('capture',expected=1)
    def test_merge_match_head_race(self):
        self.state['pr']['draft']=False;self.state['merge_race']=True;self.save()
        self.run_cli('merge',expected=2);self.assertFalse(self.load()['pr']['merged'])
    def test_shell_branch_is_argv_data(self):
        marker=self.root/'owned'
        branch=f'feature;touch {marker}'
        self.state['pr']['head']['ref']=branch;self.state['runs'][0]['head_branch']=branch;self.save()
        self.run_cli('status');self.assertFalse(marker.exists())
    def test_required_manual_record_and_comment_only_write(self):
        capture=self.run_cli('capture','--manual','required')['capture']
        self.run_cli('ready','--manual','required',expected=1)
        self.run_cli('record','--manual','required','--capture',capture,'--kind','manual','--outcome','pass','--evidence','https://example.invalid/manual')
        self.run_cli('ready','--manual','required')
        self.assertEqual(len(self.load()['comments']),1)
        self.run_cli('record','--manual','required','--capture',capture,'--kind','manual','--outcome','pass','--evidence','x',expected=1)
    def test_low_risk_execution_change_rejected(self):
        self.state['files']=[dict(filename='scripts/pr-gate.py',status='modified')];self.save();self.run_cli('status',expected=1)

class HelperVersion(unittest.TestCase):
    # SPEC-WF-HARNESS5-D2: the helper runs only when its bytes equal the PR base's scripts/pr-gate.py.
    setUp=CLI.setUp;tearDown=CLI.tearDown;save=CLI.save;load=CLI.load;run_cli=CLI.run_cli
    CHANGED=HELPER_TEXT+'\n'  # One trailing byte: normalizing (rstrip, newline folding) must still differ.
    def captures(self):return sorted((self.repo/'.local/pr-gate').glob('*.json'))
    def test_mismatch_blocks_every_action(self):
        capture=self.run_cli('capture','--manual','required')['capture']
        self.load();self.state['contents'][HELPER]=self.CHANGED;self.state['calls']=[];self.save()
        before=self.captures()
        for action,extra in (('status',()),('capture',()),('ready',()),('merge',()),
                             ('record',('--capture',capture,'--kind','manual','--outcome','pass','--evidence','https://example.invalid/manual'))):
            with self.subTest(action=action):
                if action=='merge':self.load();self.state['pr']['draft']=False;self.save()
                error=self.run_cli(action,'--manual','required',*extra,expected=1)
                self.assertIn('helper differs from base '+self.head,error)
                self.assertIn('git show '+self.head+':scripts/pr-gate.py',error)
        calls=self.load()['calls']
        self.assertFalse([c for c in calls if c[0]=='pr' or 'POST' in c or 'PATCH' in c],calls)
        self.assertEqual(self.state['comments'],[])
        self.assertEqual(self.captures(),before)
    def test_mismatch_command_is_complete(self):
        # T5-1 / D-107 (5): the recovery command restores the original argv, quoted for the shell.
        capture=self.run_cli('capture','--manual','required')['capture']
        self.load();self.state['contents'][HELPER]=self.CHANGED;self.save()
        extra=('record','--manual','required','--capture',capture,'--kind','manual','--outcome','pass','--evidence',"a b; touch x 'q'")
        error=self.run_cli(*extra,expected=1)
        self.assertNotIn('…',error)
        tail=error.split('python3 "${TMPDIR:-/tmp}/pr-gate-base.py" ',1)[1]
        self.assertEqual(shlex.split(tail),[extra[0],'--pr','7','--risk','R0','--manual','not-required','--json',*extra[1:]])
    def test_same_bytes_passes(self):
        self.assertEqual(self.run_cli('status')['blockers'],[])
    def test_base_fetch_failure_exit_2(self):
        self.state['http_error_path']='/contents/'+HELPER;self.save()
        self.run_cli('status',expected=2)
    def test_compares_base_not_head(self):
        self.state['pr']['base']['sha']=B
        for base,head,expected in ((HELPER_TEXT,self.CHANGED,0),(self.CHANGED,HELPER_TEXT,1)):
            with self.subTest(base_changed=expected==1):
                self.state['snapshots']={B:{HELPER:base}};self.state['contents'][HELPER]=head;self.save()
                result=self.run_cli('status',expected=expected)
                if expected:self.assertIn('helper differs from base '+B,result)
                else:self.assertEqual(result['blockers'],[])

class ReviewedHead(unittest.TestCase):
    # SPEC-WF-HARNESS5-D8: a review record binds to the head the reviewer audited.
    tearDown=CLI.tearDown;save=CLI.save;load=CLI.load;run_cli=CLI.run_cli
    packet_text=staticmethod(CLI.packet_text);configure_packet=CLI.configure_packet
    def review(self,stage,run,reviewed,expected=0,outcome='pass',pr_reviews=0):
        common=('--packet',self.packet)
        capture=self.run_cli('capture',*common)['capture']
        extra=('--reviewed-head',reviewed) if reviewed is not None else ()
        extra+=('--pr-reviews',str(pr_reviews)) if pr_reviews is not None else ()
        return self.run_cli('record',*common,'--capture',capture,'--kind','review','--review-stage',stage,'--pass-model',run,
                            '--run-ref',run,'--evidence','https://example.invalid/'+run,'--outcome',outcome,*extra,expected=expected)
    def setUp(self):
        CLI.setUp(self)
        self.packet,_=self.configure_packet()
        self.state['files']=[dict(filename='scripts/pr-gate.py',status='modified'),dict(filename=self.packet,status='added')];self.save()
    def broad_then_push(self):
        # Broad passes at H1, then a fix is pushed: H2 needs a closure.
        self.review('broad','sonnet',self.head,outcome='pending');self.review('broad','opus',self.head)
        self.audited=self.head
        self.git('commit','--allow-empty','-qm','fix');self.head=self.git('rev-parse','HEAD')
        self.load();self.state['pr']['head']['sha']=self.head;self.state['runs'][0]['head_sha']=self.head;self.save()
        return copy.deepcopy(self.load()['comments'])
    def amend(self):
        # A Gated Amendment registered after the broad changes the Plan contract.
        self.load();self.state['contents'][self.packet]=self.state['contents'][self.packet].replace('Amendments: none','Amendments: '+self.audited);self.save()
    def push(self):
        self.git('commit','--allow-empty','-qm','next');self.head=self.git('rev-parse','HEAD')
        self.load();self.state['pr']['head']['sha']=self.head;self.state['runs'][0]['head_sha']=self.head;self.save()
    def blockers(self):return self.run_cli('status','--packet',self.packet)['blockers']
    def test_status_after_amendment_names_fresh_broad(self):
        # T1-2 / D-107 (3)
        self.broad_then_push();self.amend()
        blockers=self.blockers()
        self.assertIn(FRESH_BROAD,blockers);self.assertNotIn('stale head/base in workflow record',blockers)
    def test_closure_after_amendment_says_fresh_broad(self):
        # T1-3 / D-107 (3)
        before=self.broad_then_push();self.amend()
        self.assertIn(FRESH_BROAD,self.review('closure','closure',self.head,expected=1))
        self.assertEqual(self.load()['comments'],before)
    def test_status_after_amendment_and_manual_names_broad_required(self):
        # T1-5 / D-107 (3): record() drops the old-contract broad (broad=None); status names the broad to record.
        manual=lambda text:text.replace('- Human Gate: ready,merge\n','- Human Gate: ready,merge,manual\n')
        self.state['contents'][self.packet]=manual(self.state['contents'][self.packet])
        self.state['snapshots'][self.plan_ref][self.packet]=manual(self.state['snapshots'][self.plan_ref][self.packet]);self.save()
        self.broad_then_push();self.amend()
        capture=self.run_cli('capture','--packet',self.packet)['capture']
        self.run_cli('record','--packet',self.packet,'--capture',capture,'--kind','manual','--outcome','pass','--evidence','https://example.invalid/manual')
        blockers=self.blockers()
        self.assertEqual(blockers[0],BROAD_REQUIRED)
        self.assertFalse([b for b in blockers if b in ('review not passed',FRESH_BROAD)],blockers)
        # H3 with the record left at H2: the missing broad is still named before stale head/base.
        self.push()
        self.assertEqual(self.blockers()[0],BROAD_REQUIRED)
    # D-107 (4): --pr-reviews must equal the PR reviews with a body on the reviewed head.
    def item(self,id,body='summary',commit=None,**extra):
        return dict(id=id,commit_id=commit or self.head,body=body,state='COMMENTED',submitted_at=f'2026-10-05T01:{id%60:02d}:00Z')|extra
    def put_reviews(self,*reviews):self.load();self.state['reviews']=list(reviews);self.save()
    def writes(self):return [c for c in self.load()['calls'] if 'POST' in c or 'PATCH' in c]
    def mismatch(self,declared,listed):
        return (f'--pr-reviews {declared} but the reviewed head has {len(listed)} PR reviews with a body; read each before recording: '
                +', '.join(f'id={i} submitted_at={t}' for i,t in listed))
    def test_pr_reviews_undercount_rejected(self):
        # T2-1
        self.put_reviews(self.item(101),self.item(102))
        error=self.review('broad','sonnet',self.head,expected=1,pr_reviews=1)
        self.assertIn(self.mismatch(1,[(101,'2026-10-05T01:41:00Z'),(102,'2026-10-05T01:42:00Z')]),error)
        self.assertEqual(self.load()['comments'],[]);self.assertEqual(self.writes(),[])
    def test_pr_reviews_match_records(self):
        # T2-2
        self.put_reviews(self.item(101),self.item(102))
        self.review('broad','sonnet',self.head,pr_reviews=2,outcome='pending')
        self.assertEqual(len(self.load()['comments']),1)
    def test_pr_reviews_count_only_body_on_reviewed_head(self):
        # T2-3: empty, blank and null bodies and another head's review are not counted.
        self.put_reviews(self.item(101),self.item(102,body=''),self.item(103,body='  \n'),self.item(104,body=None),self.item(105,commit=OLD))
        self.assertIn(self.mismatch(2,[(101,'2026-10-05T01:41:00Z')]),self.review('broad','sonnet',self.head,expected=1,pr_reviews=2))
        self.assertEqual(self.load()['comments'],[])
        self.review('broad','sonnet',self.head,pr_reviews=1,outcome='pending')
        self.assertEqual(len(self.load()['comments']),1)
    def test_pr_reviews_overcount_and_closure_rejected(self):
        # T2-4
        self.assertIn(self.mismatch(1,[]),self.review('broad','sonnet',self.head,expected=1,pr_reviews=1))
        self.assertEqual(self.load()['comments'],[])
        before=self.broad_then_push()
        self.put_reviews(self.item(201))
        self.assertIn(self.mismatch(0,[(201,'2026-10-05T01:21:00Z')]),self.review('closure','closure',self.head,expected=1,pr_reviews=0))
        self.assertEqual(self.load()['comments'],before)
        self.review('closure','closure',self.head,pr_reviews=1)
        self.assertNotEqual(self.load()['comments'],before)
    def test_pr_reviews_missing_negative_or_unavailable(self):
        # T2-5
        for value in (None,-1):
            with self.subTest(value=value):
                error=self.review('broad','sonnet',self.head,expected=2,pr_reviews=value)
                self.assertIn('review needs --pr-reviews (count of PR reviews with a body on the reviewed head)',error)
        self.load();self.state['http_error_path']='/reviews';self.save()
        self.review('broad','sonnet',self.head,expected=2,pr_reviews=0)
        self.assertEqual(self.load()['comments'],[]);self.assertEqual(self.writes(),[])
    def test_reviewed_head_checked_before_pr_reviews(self):
        # T2-6 / D-099 D8: the reviewed head is checked before the reviews are read.
        self.put_reviews(self.item(101))
        self.assertIn('reviewed head differs from capture head',self.review('broad','sonnet',OLD,expected=1,pr_reviews=5))
        self.assertFalse([c for c in self.load()['calls'] if any('/reviews' in a for a in c)])
    def test_pr_reviews_pending_review_listed(self):
        # T2-7: a PENDING review has no submitted_at (or null) and is still counted and listed.
        pending=self.item(302,state='PENDING');del pending['submitted_at']
        self.put_reviews(self.item(301),pending,self.item(303,state='PENDING',submitted_at=None))
        error=self.review('broad','sonnet',self.head,expected=1,pr_reviews=1)
        self.assertIn(self.mismatch(1,[(301,'2026-10-05T01:01:00Z'),(302,'not-submitted'),(303,'not-submitted')]),error)
        self.assertEqual(self.load()['comments'],[]);self.assertEqual(self.writes(),[])
    def test_pr_reviews_counted_across_pages(self):
        # T2-8: every page is counted, not only the first.
        self.load();self.state['review_pages']=[[self.item(401)]+[self.item(500+i,body='') for i in range(99)],[self.item(402)]];self.save()
        self.review('broad','sonnet',self.head,expected=1,pr_reviews=1)
        self.assertEqual(self.load()['comments'],[])
        self.review('broad','sonnet',self.head,pr_reviews=2,outcome='pending')
        self.assertEqual(len(self.load()['comments']),1)
    def test_broad_mismatch_rejected(self):
        self.assertIn('reviewed head differs from capture head',self.review('broad','sonnet',OLD,expected=1))
        self.assertEqual(self.load()['comments'],[])
    def test_closure_mismatch_rejected(self):
        before=self.broad_then_push()
        self.assertIn('reviewed head differs from capture head',self.review('closure','closure',self.audited,expected=1))
        self.assertEqual(self.load()['comments'],before)
    def test_missing_reviewed_head_exit_2(self):
        for value in (None,'abc'):
            with self.subTest(value=value):self.review('broad','sonnet',value,expected=2)
        self.assertEqual(self.load()['comments'],[])
    def test_matching_head_records(self):
        self.broad_then_push()
        self.review('closure','closure',self.head)
        record=json.loads(self.load()['comments'][0]['body'].split('```json\n')[1].split('\n```')[0])
        self.assertEqual((record['review']['broad']['head'],record['review']['closure']['head']),(self.audited,self.head))
        self.run_cli('ready','--packet',self.packet)

MINE='docs/plans/2026-09-14-fixture.md'; OTHER='docs/plans/2026-09-13-other.md'
TOUCH='PR diff must touch exactly the --packet active packet'
LEAVE='packet leaving docs/plans must move to docs/archive/plans in this PR'

class PacketScope(unittest.TestCase):
    # SPEC-WF-PARALLEL-FRICTION D1..D3: the PR binds to the active packets its own diff touches.
    # Borrows CLI's fixture by attribute: subclassing CLI would run every CLI test a second time.
    setUp=CLI.setUp;tearDown=CLI.tearDown;save=CLI.save;load=CLI.load;run_cli=CLI.run_cli
    packet_text=staticmethod(CLI.packet_text);configure_packet=CLI.configure_packet
    def phase(self,path,phase):self.state['contents'][path]=self.packet_text({'Phase':phase,'Risk':'R3'})
    def diff(self,*entries):
        self.state['files']=[dict(filename='docs/example.md',status='modified')]+[dict(zip(('status','filename','previous_filename'),e)) for e in entries]
        self.save()
    def archive(self,path):return 'docs/archive/plans/'+Path(path).name
    def fetched(self,path):return any('/contents/'+path+'?' in ' '.join(call) for call in self.load()['calls'])

    def test_other_lane_packet_in_head_r2_passes(self):
        self.configure_packet();self.phase(OTHER,'implementing')
        self.state['packets']=[dict(type='file',name=Path(p).name,path=p) for p in (OTHER,MINE)];self.save()
        status=self.run_cli('status','--packet',MINE)
        self.assertFalse([b for b in status['blockers'] if 'packet' in b],status['blockers'])
    def test_two_active_packets_in_diff_rejected(self):
        self.configure_packet();self.phase(OTHER,'implementing');self.diff(('added',MINE),('modified',OTHER))
        self.assertIn(TOUCH,self.run_cli('status','--packet',MINE,expected=1))
    def test_diff_across_pages_rejected(self):
        self.configure_packet();self.phase(OTHER,'implementing')
        self.state['file_pages']=[[dict(filename='docs/example.md',status='modified'),dict(filename=MINE,status='added')],[dict(filename=OTHER,status='modified')]]
        self.save()
        self.assertIn(TOUCH,self.run_cli('status','--packet',MINE,expected=1))
    def test_packet_argument_mismatch_rejected(self):
        self.configure_packet();self.phase(OTHER,'implementing');self.diff(('added',OTHER))
        self.assertIn(TOUCH,self.run_cli('status','--packet',MINE,expected=1))
    def test_r2_archiving_other_lane_packet_rejected(self):
        self.configure_packet();self.phase(self.archive(OTHER),'archive')
        self.diff(('added',MINE),('renamed',self.archive(OTHER),OTHER))
        self.assertIn(TOUCH,self.run_cli('status','--packet',MINE,expected=1))
    def test_rename_inside_plans_counts_both_paths(self):
        self.configure_packet();self.diff(('renamed',MINE,OTHER))
        self.assertIn(TOUCH,self.run_cli('status','--packet',MINE,expected=1))
    def test_r0_closeout_archive_move_passes(self):
        x,y,z='docs/plans/2026-09-10-x.md','docs/plans/2026-09-11-y.md','docs/plans/2026-09-12-z.md'
        for path in (x,y):self.phase(self.archive(path),'archive')
        self.phase(z,'implementing')
        self.state['packets']=[dict(type='file',name=Path(z).name,path=z)]
        self.diff(('renamed',self.archive(x),x),('renamed','docs/archive/plans/test-matrices/2026-09-10-x.md','docs/plans/test-matrices/2026-09-10-x.md'),
                  ('removed',y),('added',self.archive(y)),('modified','docs/Plans.md'))
        self.assertEqual(self.run_cli('status')['blockers'],[])
        self.run_cli('ready');self.run_cli('merge')
        self.assertTrue(self.load()['pr']['merged'])
        self.assertTrue(self.fetched(self.archive(x)) and self.fetched(self.archive(y)))
    def test_r0_closeout_reported_as_remove_and_add_passes(self):
        self.phase(self.archive(OTHER),'archive');self.diff(('removed',OTHER),('added',self.archive(OTHER)))
        self.assertEqual(self.run_cli('status')['blockers'],[])
    def test_r0_edit_of_active_packet_rejected(self):
        self.phase(OTHER,'implementing');self.diff(('modified',OTHER))
        self.assertIn('R2+ active packet requires --packet',self.run_cli('status',expected=1))
    def test_r0_packet_deletion_without_archive_rejected(self):
        self.state['http_error_path']='/contents/'+self.archive(OTHER)  # GitHub 404: the archive is absent.
        self.diff(('removed',OTHER))
        self.assertIn(LEAVE,self.run_cli('status',expected=1))
        self.assertFalse(self.fetched(self.archive(OTHER)))
    def test_r0_removal_with_preexisting_archive_rejected(self):
        a,b='docs/plans/2026-01-01-a.md','docs/plans/2026-01-02-b.md'
        self.phase(self.archive(a),'archive');self.phase(b,'implementing');self.diff(('removed',a))
        for action in ('status','ready'):
            self.assertIn(LEAVE,self.run_cli(action,expected=1))
        self.assertFalse(self.fetched(self.archive(a)))
    def test_r0_archive_move_without_phase_archive_rejected(self):
        self.phase(self.archive(OTHER),'implementing');self.diff(('renamed',self.archive(OTHER),OTHER))
        self.assertIn('moved packet is not Phase archive',self.run_cli('status',expected=1))
    def test_archive_contents_http_failure_is_error(self):
        self.state['http_error_path']='/contents/'+self.archive(OTHER)
        self.diff(('renamed',self.archive(OTHER),OTHER))
        self.run_cli('status',expected=2)
    def test_packet_scope_does_not_list_docs_or_read_plans(self):
        self.run_cli('status')
        self.configure_packet();self.run_cli('status','--packet',MINE)
        calls=[' '.join(call) for call in self.load()['calls']]
        for path in ('/contents/docs?','/contents/docs/plans?','/contents/docs/Plans.md'):
            self.assertFalse([c for c in calls if path in c],path)
    def test_unknown_file_status_is_input_error(self):
        self.diff(('moved','docs/plans/2026-09-13-other.md'))
        self.assertIn('unknown PR file status',self.run_cli('status',expected=2))
    def test_truncated_diff_rejected(self):
        for count,expected in ((3000,1),(2999,0)):
            with self.subTest(count=count):
                self.state['files']=[dict(filename=f'docs/x{i}.md',status='modified') for i in range(count)];self.save()
                result=self.run_cli('status',expected=expected)
                if expected:self.assertIn('PR diff unavailable or truncated',result)

if __name__=='__main__':unittest.main()
