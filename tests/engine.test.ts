import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, EVENTS, PROGRAMS, schedule } from '../src/data.ts';
import { admissionChance, apply, applyToProgram, availableActions, buyUpgrade, currentTerm, finishAssessment, newGame, nextTerm, resolveEvent, rollAdmission, selectJob, takeAction, travel, locationEffects, livingCost, actionRiskChance, useBonus, validateSave } from '../src/engine.ts';
import { PROGRAM_GUIDE } from '../src/program-guide.ts';
import { simulate } from '../tools/simulate.ts';

function offer(s: ReturnType<typeof newGame>, id: string) {
  s.previousHand=[];
  for(let i=0;i<50;i++){if(availableActions(s).some(a=>a.id===id))return;s.dealRound++;}
  throw Error('Card unavailable: '+id);
}
function admitted(seed=42){const s=newGame('Quinn','balanced',seed);rollAdmission(s);while(!applyToProgram(s,'software',8)){}return s;}
test('both schedules contain eight study terms and six co-ops in order',()=>{for(const stream of [4,8] as const){const terms=schedule(stream);assert.equal(terms.length,14);assert.equal(terms.filter(t=>t.kind==='study').length,8);assert.equal(terms.filter(t=>t.kind==='coop').length,6);assert.equal(terms[stream===4?1:2].kind,'coop');assert.equal(terms.at(-1)!.label,'4B');}});
test('admissions must be rolled and every ordinary application remains chance-based',()=>{const s=newGame();assert.equal(applyToProgram(s,'software',8),false);rollAdmission(s);const grade=s.grade12;assert.equal(rollAdmission(s),grade);s.admissionAttempts=20;assert.ok(admissionChance(s,'software')<1);while(!applyToProgram(s,'software',4)){}assert.equal(s.stream,8);assert.equal(s.stage,'choice');});
test('Cathy and Cathy Guo always get Mechatronics stream 8 in every difficulty',()=>{for(const name of ['Cathy','cathy',' CATHY ','Cathy Guo','  CATHY   GUO  '])for(const difficulty of ['balanced','cozy','crunch'] as const)for(let seed=1;seed<=100;seed++){const s=newGame(name,difficulty,seed);rollAdmission(s);assert.equal(s.stage,'admissions');assert.equal(s.admissionRolled,true);applyToProgram(s,'mechatronics',8);assert.equal(s.program,'mechatronics');assert.equal(s.stream,8);assert.equal(s.stage,'choice');assert.ok(s.achievements.includes('welcome'));validateSave(s);}});

test('saved Cathy admissions keep their mark and require the rigged admission spin',()=>{const s=newGame('Cathy');s.admissionRolled=true;s.grade12=20;s.stats.cash=4123;const restored=validateSave(s);assert.equal(restored.stage,'admissions');assert.equal(restored.grade12,20);assert.equal(restored.stats.cash,4123);assert.equal(admissionChance(restored,'mechatronics'),.00001);assert.equal(applyToProgram(restored,'mechatronics',8),true);assert.equal(restored.stream,8);assert.equal(restored.program,'mechatronics');});
test('Markus gets a mid grade and only the math result',()=>{for(let seed=1;seed<=100;seed++){const s=newGame('Markus','balanced',seed);assert.equal(rollAdmission(s),78);assert.equal(s.stage,'ended');assert.equal(s.ending,'math');assert.equal(s.log[0].text,'You only got into math.');assert.equal(applyToProgram(s,'software',8),false);validateSave(s);}});
test('seeded runs are reproducible and all programs reach a terminal state',()=>{for(const p of PROGRAMS){const a=simulate(833,p.id);const b=simulate(833,p.id);assert.deepEqual({...a,createdAt:''},{...b,createdAt:''});assert.equal(a.stage,'ended');if(a.ending==='graduated'){assert.equal(a.grades.length,8);assert.equal(a.completedCoops,6);}}});
test('weekly actions cannot be repeated during an event or assessment',()=>{const s=admitted();let attempts=0;while(s.stage==='choice'&&attempts++<4)takeAction(s,availableActions(s)[0].id);const before=structuredClone(s);assert.equal(takeAction(s,'office'),false);assert.deepEqual(s,before);if(s.stage==='event'){const event=EVENTS.find(e=>e.id===s.pendingEvent)!;assert.equal(resolveEvent(s,event.choices.length),false);assert.equal(resolveEvent(s,0),true);assert.equal(s.week,before.week+1);}});
test('travel does not spend a week, and actions require the selected location',()=>{const s=admitted();assert.equal(takeAction(s,'sleep'),false);s.location='residence';offer(s,'sleep');assert.ok(availableActions(s).some(a=>a.id==='sleep'));assert.equal(s.week,0);assert.ok(takeAction(s,'sleep'));assert.equal(s.totalActions,1);});
test('minigame bonus is finite, one per term, and spends no week',()=>{const s=admitted();assert.equal(useBonus(s,NaN),false);assert.ok(useBonus(s,100));assert.equal(s.stats.cash,5600);assert.equal(s.week,0);assert.equal(useBonus(s,100),false);});
test('upgrades cannot be duplicated or purchased on credit',()=>{const s=admitted();assert.ok(buyUpgrade(s,'plant'));const cash=s.stats.cash;assert.equal(buyUpgrade(s,'plant'),false);assert.equal(s.stats.cash,cash);s.stats.cash=1;assert.equal(buyUpgrade(s,'laptop'),false);});
test('co-op has a guaranteed accessible role but locked jobs remain locked',()=>{const s=admitted();s.termIndex=2;s.week=0;s.selectedJob=null;assert.equal(currentTerm(s).kind,'coop');assert.equal(takeAction(s,'deliver'),false);assert.equal(selectJob(s,'cali'),false);assert.ok(selectJob(s,'research'));assert.equal(selectJob(s,'local'),false);offer(s,'deliver');assert.ok(takeAction(s,'deliver'));assert.equal(s.termIncome,650);});
test('health consequences and funding failure end runs predictably',()=>{const s=admitted();s.stats.stress=99;s.recoveries=2;offer(s,'cram');takeAction(s,'cram');assert.equal(s.ending,'burnout');const funded=admitted();funded.stats.cash=-11999;offer(funded,'office');takeAction(funded,'office');assert.equal(funded.ending,'funding');});
test('two failed assessments end a run and cannot be submitted twice',()=>{const s=admitted();s.stage='assessment';s.week=4;s.stats.prep=0;s.stats.energy=10;s.stats.morale=5;s.stats.stress=90;finishAssessment(s,0);assert.equal(s.strikes,1);assert.equal(s.stage,'report');assert.equal(finishAssessment(s,100),false);nextTerm(s);s.stage='assessment';s.week=4;s.stats.prep=0;s.stats.energy=10;s.stats.morale=5;s.stats.stress=90;finishAssessment(s,0);assert.equal(s.ending,'afm');});
test('save roundtrip resumes event and random outcomes exactly',()=>{const a=admitted();offer(a,'office');takeAction(a,'office');const b=validateSave(JSON.parse(JSON.stringify(a)));if(a.stage==='event'){resolveEvent(a,0);resolveEvent(b,0);}assert.deepEqual(a,b);assert.notEqual(a,b);});
test('malformed and malicious saves are rejected before rendering',()=>{const s=admitted();for(const corrupt of [{...s,version:99},{...s,week:99},{...s,stats:{...s.stats,stress:NaN}},{...s,items:['<script>']},{...s,stage:'event',pendingEvent:null},{...s,stream:4},{...s,stage:'report',report:null},{...s,friends:{}},{...s,log:[{text:{},term:'1A',tone:'good'}]}])assert.throws(()=>validateSave(corrupt));});
test('stats are clamped and input effects do not create infinities during normal play',()=>{const s=admitted();apply(s,{energy:999,stress:-999,morale:-200});assert.equal(s.stats.energy,100);assert.equal(s.stats.stress,0);assert.equal(s.stats.morale,0);});
test('cozy mode softens stress and never ends at three burnout recoveries',()=>{const s=admitted();s.difficulty='cozy';s.recoveries=2;s.stats.stress=99;offer(s,'cram');takeAction(s,'cram');assert.equal(s.recoveries,3);assert.notEqual(s.stage,'ended');});
test('one hundred balanced campaigns terminate and preserve progress invariants',()=>{for(let seed=1;seed<=100;seed++){const s=simulate(seed,PROGRAMS[seed%14].id);assert.equal(s.stage,'ended');validateSave(s);if(s.ending==='graduated'){assert.equal(s.completedCoops,6);assert.ok(s.gpa>=60);assert.ok(s.achievements.includes('ring'));}}});


test('Terry forces Devil difficulty regardless of capitalization or selected mode',()=>{for(const name of ['Terry','terry','TERRY',' tErRy '])for(const selected of ['cozy','balanced','crunch'] as const){const s=newGame(name,selected,77);assert.equal(s.difficulty,'devil');assert.equal(s.stats.cash,2800);assert.equal(s.stats.prep,42);assert.ok(s.termPressure>=21);const loaded=validateSave({...s,difficulty:'cozy'});assert.equal(loaded.difficulty,'devil');}});
test('the grade wheel can produce failing marks and still never rejects Cathy',()=>{let lowest=100;for(let seed=1;seed<100;seed++){const s=newGame('Cathy','balanced',seed);lowest=Math.min(lowest,rollAdmission(s));assert.equal(s.stage,'admissions');assert.equal(applyToProgram(s,'mechatronics',8),true);assert.equal(s.stream,8);}assert.ok(lowest<35);});
test('travel changes resources and arrival encounters do not spend a study week',()=>{let seen=false;for(let seed=1;seed<20;seed++){const s=admitted(seed);const energy=s.stats.energy;assert.ok(travel(s,'dana'));assert.ok(s.stats.energy<energy);assert.equal(s.week,0);assert.ok(availableActions(s).every(a=>a.location==='dana'));assert.equal(takeAction(s,'prototype'),false);assert.equal(travel(s,'dana'),false);if(s.stage==='event'){seen=true;assert.equal(s.eventEndsWeek,false);resolveEvent(s,0);assert.equal(s.week,0);assert.equal(s.stage,'choice');}}assert.ok(seen);});
test('each location changes the next action and storm travel costs more',()=>{const s=admitted();const rules=[];for(const loc of ['e7','dana','plaza','residence','work'] as const){s.location=loc;rules.push(JSON.stringify(locationEffects(s)));}assert.equal(new Set(rules).size,5);s.location='e7';s.campusCondition='storm';const energy=s.stats.energy;travel(s,'dana');assert.equal(energy-s.stats.energy,6);assert.ok(livingCost(newGame('Terry'))>livingCost(newGame('Alex')));});
test('an unlucky exam can fail where the same prepared student passes a lucky exam',()=>{const base=admitted();base.stage='assessment';base.week=4;base.stats.prep=85;base.stats.stress=40;base.stats.energy=65;base.stats.morale=70;base.termPressure=10;const low=structuredClone(base),high=structuredClone(base);finishAssessment(low,0);finishAssessment(high,100);assert.ok(low.grades[0]<60);assert.ok(high.grades[0]>=60);});
test('Devil has a single burnout recovery and co-op reviews can fail the run',()=>{const devil=newGame('Terry');rollAdmission(devil);while(!applyToProgram(devil,'geological',4)){}devil.stats.stress=99;offer(devil,'cram');takeAction(devil,'cram');assert.equal(devil.ending,'burnout');const work=admitted();work.termIndex=2;work.stage='assessment';work.week=4;work.selectedJob='research';work.stats.reputation=0;work.stats.skill=0;finishAssessment(work,0);assert.equal(work.ending,'career');});

test('Devil increases harmful action odds and lowers windfall odds',()=>{const ordinary=newGame('Alex'),devil=newGame('Terry');const prototype=ACTIONS.find(a=>a.id==='prototype')!,grant=ACTIONS.find(a=>a.id==='grant')!;assert.ok(actionRiskChance(devil,prototype)>actionRiskChance(ordinary,prototype));assert.ok(actionRiskChance(devil,grant)<actionRiskChance(ordinary,grant));});

test('Cathy uses ordinary rolls on every application except Mechatronics stream 8',()=>{
  for(const candidate of PROGRAMS) for(const stream of [4,8] as const) {
    if(candidate.id==='mechatronics' && stream===8)continue;
    const outcomes=new Set<boolean>();
    for(let seed=1;seed<=60;seed++){
      const regular=newGame('Alex','balanced',seed*10001);
      regular.grade12=95;regular.admissionRolled=true;
      const cathy={...structuredClone(regular),name:' cAtHy  gUo '};
      const expected=applyToProgram(regular,candidate.id,stream);
      assert.equal(applyToProgram(cathy,candidate.id,stream),expected);
      assert.equal(cathy.program,regular.program);assert.equal(cathy.stream,regular.stream);
      assert.equal(cathy.rng,regular.rng);
      outcomes.add(expected);
    }
    assert.equal(outcomes.size,2);
  }
});
test('a played hand is replaced by fresh cards and survives filters, events and saves',()=>{
  for(let seed=1;seed<=60;seed++){
    const s=newGame('Cathy','cozy',seed);
    rollAdmission(s);applyToProgram(s,'mechatronics',8);
    const before=availableActions(s).map(a=>a.id), rng=s.rng;
    assert.deepEqual(availableActions(validateSave(s)).map(a=>a.id),before);
    assert.equal(s.rng,rng);
    let spins=0;
    assert.ok(takeAction(s,before[0],spin=>{spins++;assert.ok(spin.labels[spin.selected]);}));
    if(s.stage==='event')assert.ok(resolveEvent(s,0,()=>spins++));
    assert.ok(spins>=1);
    const next=availableActions(s).map(a=>a.id);
    assert.equal(next.length,3);assert.ok(next.every(id=>!before.includes(id)));
    assert.equal(takeAction(s,before[0]),false);
  }
});

test('all programs have a sourced course and two playable studio cards',()=>{
  for(const p of PROGRAMS){
    const guide=PROGRAM_GUIDE[p.id];
    assert.equal(new URL(guide.source).hostname,'uwaterloo.ca');
    assert.match(guide.course,/^[A-Z]+ [0-9]+/);
    const s=admitted();s.program=p.id;
    for(const location of ['e7','dana'] as const){
      s.location=location;offer(s,'studio-'+p.id+'-'+location);
      assert.ok(availableActions(s).every(a=>!a.program||a.program===p.id));
    }
  }
});
test('old saves migrate to the same stable hand without spending a roll',()=>{
  const s=admitted();
  const {previousHand,dealSeed,dealRound,...old}=s;
  assert.ok(previousHand && dealSeed && dealRound===0);
  const restored=validateSave(old);
  assert.deepEqual(availableActions(restored),availableActions(validateSave(old)));
  assert.equal(restored.rng,s.rng);
});
