#!/usr/bin/env python3
"""SPEC-MERGE-EVIDENCE / MG-D5..D8: synthetic API/CLI/git fixtures, no GitHub mutation."""
import argparse
import copy
import importlib.util
import json
import os
from pathlib import Path
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
REQ=dict(risk='R3',mode='codex-only',plan_commit=P,amendments=[],minimum=2,manual=True,r4=True)

def good_record():
    return dict(version=1,repo=g.REPO,pr=7,head=H,base=B,
                review=dict(outcome='pass',broad=dict(head=H,base=B,plan_commit=P,amendments=[],
                    audits=[dict(model=m,run_ref=m,evidence=[f'https://example.invalid/{m}']) for m in ('sonnet','opus')]),closure=None),
                manual=dict(outcome='pass',evidence=['https://example.invalid/manual']),
                r4=dict(outcome='pass',evidence=['https://example.invalid/approval']))

def args(**kw):
    value=dict(repo=g.REPO,pr=7,packet=None,risk='R0',manual='not-required',capture=None,
               kind='review',outcome='pass',review_stage='broad',pass_model='sonnet',run_ref='new',
               evidence=['https://example.invalid/result'],reuse_from=None,reuse_approval=None)
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
        text='## Workflow State\n'+''.join(f'- {k}: {v}\n' for k,v in {
            'Evidence Mode':'github','Phase':'implementing','Risk':'R3','Execution Mode':'codex-only',
            'Plan Commit':P,'Amendments':'none','Coordinator':'owner','Writer':'codex',
            'Plan Reviewer':'opus','Final Reviewer':'sonnet','Final Review Minimum':'2','Human Gate':'ready,merge,manual'}.items())+'\n## Risk\nRisk: R3\n'
        self.assertEqual(g.parse_packet(text)['minimum'],2)
        for source,dest in [('Evidence Mode: github','Evidence Mode: legacy'),('Phase: implementing','Phase: local-verified'),('Final Review Minimum: 2','Final Review Minimum: 0'),('Human Gate: ready,merge,manual','Human Gate: none'),(P,'pending')]:
            with self.assertRaises(g.GateError):g.parse_packet(text.replace(source,dest))

class RecordLifecycle(unittest.TestCase):
    setUp = Records.setUp
    # MG-D6 / GA1: server pass -> reused manual -> fresh capture -> current closure.
    def exercise(self, old, kind='manual', outcome='pass', source=OLD, values=None, mutate_capture=False):
        with tempfile.TemporaryDirectory() as tmp:
            self.gate.root=Path(tmp)
            folder=Path(tmp)/'.local/pr-gate';folder.mkdir(parents=True)
            server=None if old is None else dict(id=1,body='previous',updated_at='before',record=copy.deepcopy(old))
            snap=dict(version=1,repo=g.REPO,pr=7,head=H,base=B,packet=None,requirements=REQ,server=server)
            capture=folder/'capture.json';capture.write_text(json.dumps(snap))
            if mutate_capture and server:server['updated_at']='changed'
            self.gate.args=args(capture=str(capture),kind=kind,outcome=outcome,review_stage='closure',
                reuse_from=source if kind=='manual' else None,reuse_approval='https://example.invalid/owner' if source and kind=='manual' else None,
                evidence=values if values is not None else ['https://example.invalid/manual'])
            pr=dict(head=dict(sha=H),base=dict(sha=B))
            state={'server':server}
            def transport(path,method='GET',payload=None,**kwargs):
                if path=='user':return dict(login=g.OWNER)
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
if method!='GET':
    assert '/issues/' in path and '/comments' in path
    payload=json.load(sys.stdin);assert list(payload)==['body']
    s['comments']=[dict(id=1,user=dict(login=s['owner']),body=payload['body'],updated_at='now')]
    save();print(json.dumps(s['comments'][0]));sys.exit(0)
if path=='user':value={'login':s['owner']}
elif '/pulls/7/files' in path:value=[s['files']]
elif path.endswith('/pulls/7'):
    s['reads']=s.get('reads',0)+1
    if s.get('head_race_at')==s['reads']:s['pr']['head']['sha']='e'*40
    save();value=s['pr']
elif '/issues/7/comments' in path:value=[s['comments']]
elif '/contents/' in path:
    import base64
    name=path.split('/contents/')[1].split('?')[0]
    if name=='docs/plans':value=s.get('packets',[])
    else:value={'encoding':'base64','content':base64.b64encode(s['contents'][name].encode()).decode()}
elif '/rules/branches/main' in path:value=[s['effective']]
elif '/rulesets/1' in path:value=s['policy']
elif '/actions/workflows/ci.yml/runs' in path:value=[{'workflow_runs':s['runs']}]
elif '/check-suites/2/check-runs' in path:value=[{'check_runs':s['checks']}]
else:raise AssertionError(path)
print(json.dumps(value))
'''

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
            'files':[dict(filename='docs/example.md')], 'comments':[], 'policy':policy,
            'contents':{'scripts/ci/classify-changes.sh':(ROOT/'scripts/ci/classify-changes.sh').read_text(),g.POLICY:json.dumps(policy)},
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
    def test_status_capture_ready_merge(self):
        self.assertEqual(self.run_cli('status')['blockers'],[])
        self.assertTrue(all(c[0]=='api' and 'GET' in c for c in self.load()['calls']))
        capture=self.run_cli('capture')['capture'];self.assertTrue(Path(capture).is_file())
        self.run_cli('ready');self.run_cli('merge')
        self.assertTrue(self.load()['pr']['merged'])
    def test_packet_double_audit_cli(self):
        packet='docs/plans/2026-09-14-fixture.md'
        self.state['packets']=[dict(type='file',name=Path(packet).name,path=packet)]
        self.state['files']=[dict(filename='scripts/pr-gate.py')]
        fields={'Evidence Mode':'github','Phase':'implementing','Risk':'R3','Execution Mode':'codex-only',
                'Plan Commit':self.head,'Amendments':'none','Coordinator':'owner','Writer':'codex','Plan Reviewer':'opus',
                'Final Reviewer':'sonnet+opus','Final Review Minimum':'2','Human Gate':'ready,merge'}
        self.state['contents'][packet]='## Workflow State\n'+''.join(f'- {k}: {v}\n' for k,v in fields.items())+'\n## Risk\nRisk: R3\n'
        self.state['contents']['docs/Plans.md']=f'## 次の行動\n[packet](plans/{Path(packet).name})\n'
        self.save()
        common=('--packet',packet)
        capture=self.run_cli('capture',*common)['capture']
        self.run_cli('record',*common,'--capture',capture,'--kind','review','--review-stage','broad','--pass-model','sonnet','--run-ref','sonnet-audit','--evidence','https://example.invalid/sonnet','--outcome','pending')
        self.run_cli('ready',*common,expected=1)
        capture=self.run_cli('capture',*common)['capture']
        self.run_cli('record',*common,'--capture',capture,'--kind','review','--review-stage','broad','--pass-model','opus','--run-ref','opus-audit','--evidence','https://example.invalid/opus','--outcome','pass')
        self.run_cli('ready',*common)
        self.run_cli('status',*common,*common,expected=2)
        self.load()
        self.state['contents'][packet]=self.state['contents'][packet].replace('Phase: implementing','Phase: plan-gate').replace('Plan Commit: '+self.head,'Plan Commit: pending')
        self.state['comments']=[]
        self.state['pr']['draft']=True
        self.save()
        waiting=self.run_cli('status',*common)
        self.assertIn('Plan Gate incomplete',waiting['blockers'])
        self.run_cli('ready',*common,expected=1)
        self.run_cli('capture',*common,expected=1)
        self.run_cli('merge',*common,expected=1)


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
        self.state['files']=[dict(filename='scripts/pr-gate.py')];self.save();self.run_cli('status',expected=1)
    def test_multiple_packet_and_missing_manual(self):
        self.state['packets']=[dict(type='file',name='2026-09-14-one.md',path='docs/plans/2026-09-14-one.md'),dict(type='file',name='2026-09-14-two.md',path='docs/plans/2026-09-14-two.md')];self.save()
        self.run_cli('status','--packet','docs/plans/2026-09-14-one.md',expected=1)

if __name__=='__main__':unittest.main()
