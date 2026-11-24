import { ACHIEVEMENTS, ACTIONS, EVENTS, FRIENDS, JOBS, PROGRAMS, UPGRADES, schedule } from './data.ts';
import type { Effects, GameState, Job, Stat, Location, Action } from './types.ts';

import { deal, decisionOutcome } from './decisions.ts';
import type { Reveal } from './decisions.ts';

function campusRoll(s: GameState, kind: Parameters<typeof decisionOutcome>[0], reveal?: Reveal) {
  const {effects, spin} = decisionOutcome(kind, s.difficulty, random(s));
  apply(s, effects);
  log(s, spin.result);
  reveal?.(spin);
}

export const SAVE_VERSION = 1;
export const clamp = (n:number,min=0,max=100) => Math.min(max,Math.max(min,n));
export function random(s:GameState):number { let x=s.rng|0; x^=x<<13; x^=x>>>17; x^=x<<5; s.rng=x>>>0; return s.rng/4294967296; }
export const currentTerm = (s:GameState) => schedule(s.stream)[Math.min(s.termIndex,13)];
export const program = (s:GameState) => PROGRAMS.find(p=>p.id===s.program)!;
const normalizedName = (name:string) => name.trim().replace(/\s+/g,' ').toLowerCase();
export const hasGuaranteedTronOffer = (name:string) => ['cathy','cathy guo'].includes(normalizedName(name));
function assignGuaranteedTronOffer(s:GameState) {
  s.program='mechatronics';s.stream=8;s.stage='choice';
  if(!s.achievements.includes('welcome'))log(s,'Your offer: Mechatronics Engineering, stream 8. Welcome to TRON!','good');
  unlock(s,'welcome');
}
export const isTerry = (name:string) => normalizedName(name)==='terry';
export const RULES={
  cozy:{stress:0.7,gains:1,decay:2,upkeep:0,tuition:2400,pressure:0,burnouts:4,travel:2},
  balanced:{stress:1,gains:1,decay:5,upkeep:3,tuition:3900,pressure:8,burnouts:3,travel:3},
  crunch:{stress:1.25,gains:.95,decay:7,upkeep:5,tuition:4200,pressure:11,burnouts:2,travel:4},
  devil:{stress:1.7,gains:.78,decay:10,upkeep:8,tuition:4700,pressure:21,burnouts:1,travel:6},
} as const;
export function livingCost(s:GameState){return Math.round((s.items.includes('mealplan')?85:120)*(s.difficulty==='devil'?1.9:s.difficulty==='crunch'?1.4:1));}
export function actionRiskChance(s:GameState,action:Action){if(!action.risk)return 0;const harmful=Object.values(action.risk.effects).some(v=>v<0);return Math.min(.9,action.risk.chance*(s.difficulty==='devil'?(harmful?1.6:.65):1));}
export function locationEffects(s:GameState):Effects {
  switch(s.location){
    case 'e7':return {prep:4,skill:3,stress:3};
    case 'dana':return {prep:s.campusCondition==='rush'?3:7,energy:-4};
    case 'plaza':return {network:s.campusCondition==='career-fair'?10:5,cash:-15};
    case 'residence':return {energy:8,stress:-5,prep:-6};
    case 'work':return {reputation:5,stress:4};
  }
}
export function travel(s:GameState,location:Location,reveal?:Reveal):boolean {
  if(s.stage!=='choice'||s.location===location||!['e7','dana','plaza','residence','work'].includes(location)||(location==='work'&&currentTerm(s).kind!=='coop'))return false;
  if(currentTerm(s).kind==='coop'&&!s.selectedJob)return false;
  const cost=RULES[s.difficulty].travel+(s.campusCondition==='storm'?3:0);
  if(s.stats.energy<cost)return false;
  s.location=location;apply(s,{energy:-cost});log(s,`Travelled to ${location==='dana'?'DC Library':location}. −${cost} energy.`);
  campusRoll(s, "travel", reveal);
  refreshHand(s);
  if(!s.visitedLocations.includes(location)){
    s.visitedLocations.push(location);
    const encounter=EVENTS.find(e=>e.arrival&&e.location===location);
    if(encounter&&random(s)<(s.difficulty==='devil'?.75:.5)){
      s.pendingEvent=encounter.id;s.eventEndsWeek=false;s.stage='event';
      if(!s.seenEvents.includes(encounter.id))s.seenEvents.push(encounter.id);
    }
  }
  return true;
}
export function newGame(name='Alex',difficulty:GameState['difficulty']='balanced',seed=Date.now()):GameState {
  if(isTerry(name))difficulty='devil';
  return {version:1,rng:(seed>>>0)||1,name:name.trim().slice(0,24)||'Alex',difficulty,program:'software',stream:8,
    grade12:0,admissionRolled:false,admissionAttempts:0,stage:'admissions',termIndex:0,week:0,
    stats:{stress:difficulty==='devil'?42:25,energy:difficulty==='devil'?75:90,morale:difficulty==='devil'?65:85,cash:difficulty==='devil'?2800:5200,skill:15,network:10,prep:difficulty==='devil'?42:50,reputation:15},gpa:75,
    grades:[],coopRatings:[],completedCoops:0,caliOffers:0,strikes:0,recoveries:0,location:'e7',selectedJob:null,
    bonusPlayed:false,assessmentScore:null,pendingEvent:null,seenEvents:[],friends:{maya:10,leo:10,sam:15},items:[],achievements:[],
    log:[],report:null,ending:null,totalActions:0,termIncome:0,bestStreak:0,streak:0,createdAt:new Date().toISOString(),
    dealSeed:(seed>>>0)||1,dealRound:0,previousHand:[],termPressure:RULES[difficulty].pressure+(seed>>>0)%6,visitedLocations:['e7'],eventEndsWeek:true,campusCondition:'quiet',lastAction:null};
}
export function log(s:GameState,text:string,tone:'good'|'bad'|'neutral'='neutral') {
  s.log.unshift({term:currentTerm(s).label,text,tone}); s.log=s.log.slice(0,100);
}
export function apply(s:GameState,effects:Effects) {
  for(const [key,value] of Object.entries(effects)) {
    const k=key as Stat;
    const rules=RULES[s.difficulty];
    const n = k==='stress'&&value>0?value*rules.stress:k!=='cash'&&k!=='stress'&&value>0?value*rules.gains:value;
    s.stats[k] = k==='cash' ? Math.round(s.stats[k]+n) : Math.round(clamp(s.stats[k]+n));
  }
}
export function unlock(s:GameState,id:string) { if(!s.achievements.includes(id)) { s.achievements.push(id); const a=ACHIEVEMENTS.find(a=>a.id===id); if(a) log(s,`Achievement: ${a.name}`,'good'); } }
export function checkAchievements(s:GameState) {
  if(s.stats.cash>=20000) unlock(s,'savings');
  if(s.caliOffers>=1) unlock(s,'cali'); if(s.caliOffers>=2) unlock(s,'cali2');
  if(Object.values(s.friends).some(v=>v>=75)) unlock(s,'friends');
  if(Object.values(s.friends).every(v=>v>=50)) unlock(s,'community');
  if(s.items.length===UPGRADES.length) unlock(s,'collector');
}
function bond(s:GameState,id:string,amount=9) {
  const before=s.friends[id]; s.friends[id]=clamp(before+amount);
  const friend=FRIENDS.find(f=>f.id===id)!;
  [25,50,75].forEach((threshold,i)=>{ if(before<threshold && s.friends[id]>=threshold) {log(s,`${friend.name}: ${friend.milestones[i]}`,'good');apply(s,{morale:5,network:3});} });
}
export function rollAdmission(s:GameState):number {
  if(s.stage!=='admissions') return s.grade12;
  const name=normalizedName(s.name);
  if(isTerry(name)){s.difficulty='devil';s.termPressure=Math.max(s.termPressure,21);}
  if(!s.admissionRolled){s.grade12=name==='markus'?78:Math.round((20+Math.pow(random(s),.42)*79.8)*10)/10;s.admissionRolled=true;}
  if(name==='markus') { s.stage='ended';s.ending='math';log(s,'You only got into math.','neutral'); }
  return s.grade12;
}
export function admissionChance(s:GameState,id:string) {
  const p=PROGRAMS.find(p=>p.id===id); if(!p||!s.admissionRolled) return 0;
  return clamp(.75*Math.pow(s.grade12/100,6)-(p.difficulty-1)*.07,.00001,.92);
}
export function applyToProgram(s:GameState,id:string,dualStream:4|8):boolean {
  if(s.stage!=='admissions'||!s.admissionRolled) return false;
  const p=PROGRAMS.find(p=>p.id===id); if(!p) return false;
  s.admissionAttempts++;
  if(hasGuaranteedTronOffer(s.name) && id === 'mechatronics' && dualStream === 8){assignGuaranteedTronOffer(s);return true;}
  const accepted = random(s)<admissionChance(s,id);
  if(!accepted) return false;
  s.program=id; s.stream=p.stream==='dual'?dualStream:p.stream;
  s.stage='choice'; log(s,`Welcome to ${p.name}, stream ${s.stream}. Your Waterloo story starts here.`,'good'); unlock(s,'welcome');
  return true;
}
export function availableActions(s:GameState) { return deal(ACTIONS.filter(a=>a.location===s.location && (!a.program || a.program===s.program) && (!a.kind||a.kind===currentTerm(s).kind)), s); }
function refreshHand(s: GameState) {
  s.previousHand = availableActions(s).map(a => a.id);
  s.dealRound++;
}
export function jobReadiness(s:GameState) { return Math.round(s.stats.skill*.5+s.stats.network*.25+s.stats.reputation*.25+(s.gpa-65)*.25); }
export function availableJobs(s:GameState) { const r=jobReadiness(s); return JOBS.filter(j=>r>=j.requirement&&(!j.cali||s.completedCoops>=2)); }
export function selectJob(s:GameState,id:string):boolean {
  if(s.stage!=='choice'||currentTerm(s).kind!=='coop'||s.selectedJob||s.week!==0) return false;
  const j=availableJobs(s).find(j=>j.id===id); if(!j) return false;
  if(random(s)>=jobChance(s,id)){log(s,`No offer from ${j.name} this round. Try another interview.`,'bad');apply(s,{stress:s.difficulty==='devil'?7:4,cash:-60});checkHealth(s);return false;}
  s.selectedJob=j.id; s.location='work'; log(s,`Accepted: ${j.name} · ${j.place}.`,'good');return true;
}
export function jobChance(s:GameState,id:string) { const j=JOBS.find(j=>j.id===id);return j?clamp(.75-(j.requirement*.005)+(jobReadiness(s)-j.requirement)*.003-(s.difficulty==='devil'?.24:0),.04,.88):0; }
export function activeJob(s:GameState):Job|undefined { return JOBS.find(j=>j.id===s.selectedJob); }
export function takeAction(s:GameState,id:string,reveal?:Reveal):boolean {
  if(s.stage!=='choice'||(currentTerm(s).kind==='coop'&&!s.selectedJob)) return false;
  const action=availableActions(s).find(a=>a.id===id); if(!action) return false;
  if(action.effects.cash && action.effects.cash<0 && s.stats.cash<action.effects.cash*-1-12000) return false;
  apply(s,action.effects);
  campusRoll(s, "weekly", reveal);
  apply(s,locationEffects(s));
  s.lastAction=id;
  if(action.risk&&random(s)<actionRiskChance(s,action)){apply(s,action.risk.effects);log(s,action.risk.text,Object.values(action.risk.effects).some(v=>v<0)?'bad':'good');}
  if(action.friend) bond(s,action.friend);
  if(s.items.includes('planner')) apply(s,{stress:-2}); if(s.items.includes('bike')) apply(s,{energy:3});
  if(s.items.includes('plant')) apply(s,{morale:2});
  if(action.kind) {
    if(s.items.includes('laptop')) apply(s,currentTerm(s).kind==='study'?{prep:3}:{reputation:3});
    if(s.items.includes('headphones')&&action.kind==='study') apply(s,{prep:3});
  }
  const living=livingCost(s);
  const job=activeJob(s);
  apply(s,{cash:-living+(job?job.weekly:0),stress:job?job.stress:0});
  if(job) s.termIncome+=job.weekly;
  apply(s,{prep:-RULES[s.difficulty].decay,stress:RULES[s.difficulty].upkeep,morale:-2});
  s.totalActions++;
  log(s,`${action.name}. Week ${s.week+1}/4.`);
  if(!checkHealth(s)) return true;
  const eligible=EVENTS.filter(e=>!e.arrival&&(!e.location||e.location===s.location)&&(e.kind==='any'||e.kind===currentTerm(s).kind)&&(!e.minTerm||e.minTerm<=currentTerm(s).number)&&!s.seenEvents.includes(e.id));
  if(eligible.length && random(s)<(s.difficulty==='devil'?.95:.8)) {
    const e=eligible[Math.floor(random(s)*eligible.length)];s.pendingEvent=e.id;s.seenEvents.push(e.id);s.eventEndsWeek=true;s.stage='event';
  } else { refreshHand(s); finishWeek(s); }
  checkAchievements(s);return true;
}
export function resolveEvent(s:GameState,choice:number,reveal?:Reveal):boolean {
  if(s.stage!=='event') return false;
  const event=EVENTS.find(e=>e.id===s.pendingEvent); const c=event?.choices[choice]; if(!c) return false;
  refreshHand(s);
  campusRoll(s, "event", reveal);
  apply(s,c.effects);if(c.friend) bond(s,c.friend,7);
  log(s,`${event!.title}: ${c.label}.`);
  if(c.risk && random(s)<c.risk.chance) {apply(s,c.risk.effects);log(s,c.risk.text,Object.values(c.risk.effects).some(v=>v<0)?'bad':'good');}
  s.pendingEvent=null;
  if(checkHealth(s)){if(s.eventEndsWeek)finishWeek(s);else s.stage='choice';}
  checkAchievements(s); return true;
}
function checkHealth(s:GameState):boolean {
  if(s.stats.cash < -12000) { end(s,'funding');return false; }
  if(s.stats.energy<=0) { apply(s,{stress:14,energy:25,morale:-8});log(s,'Your body calls time. You take a recovery day.','bad'); }
  if(s.stats.stress>=100) {
    s.recoveries++; apply(s,{cash:s.difficulty==='cozy'?-250:-800,stress:-65,energy:55,morale:-12});
    log(s,'Burnout recovery: your support network helps you step back. Recovery costs time and money.','bad');
    if(s.recoveries>=RULES[s.difficulty].burnouts) {end(s,'burnout');return false;}
  }
  if(s.stats.morale<=0) { apply(s,{morale:30,stress:-15,energy:10});log(s,'You reach out for support. You do not have to do this alone.'); }
  return true;
}
function finishWeek(s:GameState) {s.week++;s.visitedLocations=[s.location];s.campusCondition=(['quiet','rush','storm','career-fair'] as const)[Math.floor(random(s)*4)];s.stage=s.week>=4?'assessment':'choice';}
export function buyUpgrade(s:GameState,id:string,reveal?:Reveal):boolean {
  if(s.stage!=='choice') return false;
  const item=UPGRADES.find(i=>i.id===id); if(!item||s.items.includes(id)||s.stats.cash<item.price) return false;
  refreshHand(s);campusRoll(s, "shop", reveal);s.stats.cash-=item.price;s.items.push(id);apply(s,item.effects);log(s,`Bought ${item.name}.`,'good');checkAchievements(s);return true;
}
export function useBonus(s:GameState,score:number):boolean {
  if(s.stage!=='choice'||s.bonusPlayed||!Number.isFinite(score)) return false;
  refreshHand(s);s.bonusPlayed=true;const value=clamp(score);apply(s,{cash:Math.round(value*4),morale:Math.round(value/10),stress:-Math.round(value/12)});
  log(s,`Term break challenge: ${Math.round(value)} points. +$${Math.round(value*4)}.`,'good');checkAchievements(s);return true;
}
export function finishAssessment(s:GameState,score:number):boolean {
  if(s.stage!=='assessment'||!Number.isFinite(score)) return false;
  const value=clamp(score); s.assessmentScore=value; if(value>=95) unlock(s,'perfect');
  const term=currentTerm(s);
  if(term.kind==='study') {
    const grade=clamp(Math.round((s.stats.prep*.4 + value*.28 + s.stats.energy*.07 + s.stats.morale*.04 + 22 - s.stats.stress*.18 - (program(s).difficulty-1)*2 -s.termPressure+ (s.difficulty==='cozy'?8:s.difficulty==='balanced'?6:s.difficulty==='crunch'?4:0))*10)/10,10,100);
    s.grades.push(grade);s.gpa=Math.round(s.grades.reduce((a,b)=>a+b,0)/s.grades.length*10)/10;
    if(grade<60) { s.strikes++;s.streak=0;log(s,`${term.label}: ${grade}%. Academic strike ${s.strikes}/2.`,'bad'); }
    else {s.streak++;s.bestStreak=Math.max(s.streak,s.bestStreak);log(s,`${term.label}: ${grade}%. Term passed.`,'good');if(s.strikes)unlock(s,'comeback');}
    if(grade>=90) unlock(s,'deans'); if(s.grades.length===1&&grade>=60) unlock(s,'first-term');
    // Fictional, deliberately compressed game economy, not real UW tuition.
    const tuition=RULES[s.difficulty].tuition;s.stats.cash-=tuition;
    s.report={title:grade>=60?'One term closer.':'A difficult term.',text:grade>=60?`You finished ${term.label}. Put the notes away for a moment. You earned it.`:'An academic strike is a setback. Two strikes end this run; your next term is a chance to recover.',grade,term:term.label,score:value,earned:-tuition};
    if(s.strikes>=2) {end(s,'afm');return true;}
  } else {
    const rating=clamp(Math.round(s.stats.reputation*.45+value*.4+s.stats.skill*.15-s.termPressure*.4),0,100);
    s.coopRatings.push(rating);if(rating>=45)s.completedCoops++;
    const job=activeJob(s)!; const bonus=Math.round(job.weekly*(rating/100));s.stats.cash+=bonus;
    if(job.cali&&rating>=55) s.caliOffers++;
    apply(s,{network:8,reputation:rating>=75?6:2});unlock(s,'first-coop');
    s.report={title:rating>=75?'You made an impression.':'Experience that stays with you.',text:`${job.name} · ${job.place}. ${rating>=75?'Your mentor would happily work with you again.':'You leave with new skills and a clearer idea of what comes next.'}`,term:term.label,earned:s.termIncome+bonus,score:value,grade:rating};
    log(s,`${term.label}: ${rating}/100 evaluation. Earned $${s.termIncome+bonus}.`,'good');
    if(rating<45){end(s,'career');return true;}
  }
  s.stage='report';checkAchievements(s);
  if(s.stats.cash < -12000) end(s,'funding');
  return true;
}
export function nextTerm(s:GameState):boolean {
  if(s.stage!=='report') return false;
  if(s.termIndex===13) { end(s,'graduated');return true; }
  s.termIndex++;s.week=0;s.bonusPlayed=false;s.assessmentScore=null;s.selectedJob=null;s.report=null;s.termIncome=0;
  s.stage='choice';s.location=currentTerm(s).kind==='coop'?'work':'e7';
  apply(s,{stress:-10,energy:18,morale:5});s.stats.prep=Math.round(48+(s.gpa-75)*.1);
  s.termPressure=RULES[s.difficulty].pressure+Math.floor(random(s)*6);s.visitedLocations=[s.location];s.campusCondition='quiet';s.lastAction=null;
  if(currentTerm(s).kind==='coop') s.stats.reputation=Math.round(25+s.stats.skill*.2);
  log(s,`A new chapter: ${currentTerm(s).label}.`);return true;
}
function end(s:GameState,reason:string) {
  s.stage='ended';s.ending=reason;s.pendingEvent=null;
  if(reason==='graduated') {
    unlock(s,'ring');if(s.stats.morale>=65&&s.stats.stress<=50)unlock(s,'balanced');
    if(s.caliOffers>=2&&s.stats.cash>=20000)unlock(s,'dream');
    log(s,'Eight study terms. Six co-ops. One iron ring. You made it.','good');
  }
}

// Saves are untrusted input: validate before any state reaches the engine or DOM.
export function validateSave(value:unknown):GameState {
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('This is not a game save.');
  const s=value as GameState;
  if(s.version!==1)throw new Error('This save version is not supported.');
  if(!PROGRAMS.some(p=>p.id===s.program)||![4,8].includes(s.stream))throw new Error('Invalid program or stream.');
  const p=PROGRAMS.find(p=>p.id===s.program)!;
  if(p.stream!=='dual'&&p.stream!==s.stream)throw new Error('The program and stream do not match.');
  if(!['balanced','cozy','crunch','devil'].includes(s.difficulty)||!['admissions','choice','event','assessment','report','ended'].includes(s.stage))throw new Error('Invalid game mode.');
  if(typeof s.name!=='string'||s.name.length>24||typeof s.createdAt!=='string'||s.createdAt.length>40)throw new Error('Invalid player data.');
  for(const k of ['rng','grade12','admissionAttempts','termIndex','week','gpa','completedCoops','caliOffers','strikes','recoveries','totalActions','termIncome','bestStreak','streak'] as const) if(!Number.isFinite(s[k]))throw new Error(`Invalid ${k}.`);
  if(!Number.isInteger(s.termIndex)||s.termIndex<0||s.termIndex>13||!Number.isInteger(s.week)||s.week<0||s.week>4)throw new Error('Invalid progress.');
  if(s.rng<1||s.rng>4294967295||s.grade12<0||s.grade12>100||s.gpa<0||s.gpa>100||s.strikes<0||s.strikes>2||s.completedCoops<0||s.completedCoops>6||s.caliOffers<0||s.caliOffers>6)throw new Error('Invalid game values.');
  for(const k of ['stress','energy','morale','cash','skill','network','prep','reputation'] as const) if(!s.stats||!Number.isFinite(s.stats[k])||(k!=='cash'&&(s.stats[k]<0||s.stats[k]>100))||Math.abs(s.stats[k])>1e8)throw new Error('Invalid stats.');
  for(const k of ['grades','coopRatings'] as const)if(!Array.isArray(s[k])||s[k].length>8||s[k].some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>100))throw new Error('Invalid transcript.');
  if(typeof s.bonusPlayed!=='boolean'||typeof s.admissionRolled!=='boolean'||(s.assessmentScore!==null&&(!Number.isFinite(s.assessmentScore)||s.assessmentScore<0||s.assessmentScore>100)))throw new Error('Invalid challenge data.');
  for(const [key,allowed] of [['items',UPGRADES.map(i=>i.id)],['achievements',ACHIEVEMENTS.map(a=>a.id)],['seenEvents',EVENTS.map(e=>e.id)]] as const)if(!Array.isArray(s[key])||s[key].length>allowed.length||new Set(s[key]).size!==s[key].length||s[key].some(v=>!allowed.includes(v)))throw new Error('Invalid collection.');
  if(!s.friends||FRIENDS.some(f=>!Number.isFinite(s.friends[f.id])||s.friends[f.id]<0||s.friends[f.id]>100))throw new Error('Invalid friendships.');
  if(!['e7','dana','plaza','residence','work'].includes(s.location))throw new Error('Invalid location.');
  if(s.selectedJob!==null&&!JOBS.some(j=>j.id===s.selectedJob))throw new Error('Invalid job.');
  if(currentTerm(s).kind==='coop'&&['event','assessment','report'].includes(s.stage)&&!s.selectedJob)throw new Error('Missing co-op contract.');
  if(s.pendingEvent!==null&&!EVENTS.some(e=>e.id===s.pendingEvent))throw new Error('Invalid event.');
  if(s.stage==='event'&&!s.pendingEvent)throw new Error('Missing event.');
  if(!Array.isArray(s.log)||s.log.length>100||s.log.some(l=>!l||typeof l.text!=='string'||l.text.length>1000||typeof l.term!=='string'||l.term.length>30||!['good','bad','neutral'].includes(l.tone)))throw new Error('Invalid journal.');
  if(s.report!==null&&(!s.report||typeof s.report.title!=='string'||typeof s.report.text!=='string'||typeof s.report.term!=='string'||!Number.isFinite(s.report.score)||[s.report.title,s.report.text,s.report.term].some(t=>t.length>1500)))throw new Error('Invalid term report.');
  if(s.stage==='report'&&!s.report)throw new Error('Missing report.');
  if(s.ending!==null&&!['graduated','academic','afm','career','funding','burnout','math'].includes(s.ending))throw new Error('Invalid ending.');
  if(s.stage==='ended'&&!s.ending)throw new Error('Missing ending.');
  const restored=structuredClone(s);
  if(isTerry(restored.name)){restored.difficulty='devil';restored.termPressure=Math.max(restored.termPressure??0,21);}
  restored.dealSeed ??= restored.rng;
  restored.dealRound ??= restored.totalActions;
  restored.previousHand ??= [];
  if (!Array.isArray(restored.previousHand) || restored.previousHand.length > 3 ||
      restored.previousHand.some(id => !ACTIONS.some(a => a.id === id))) throw new Error('Invalid previous hand.');
  if (!Number.isSafeInteger(restored.dealSeed) || restored.dealSeed < 1 || restored.dealSeed > 0xffffffff ||
      !Number.isSafeInteger(restored.dealRound) || restored.dealRound < 0 || restored.dealRound > 1e8) throw new Error('Invalid campus deal.');
  restored.termPressure??=RULES[restored.difficulty].pressure;
  restored.visitedLocations??=[restored.location];restored.eventEndsWeek??=true;restored.campusCondition??='quiet';restored.lastAction??=null;
  if(!Number.isFinite(restored.termPressure)||restored.termPressure<0||restored.termPressure>40||!Array.isArray(restored.visitedLocations)||restored.visitedLocations.length>5||restored.visitedLocations.some(l=>!['e7','dana','plaza','residence','work'].includes(l))||typeof restored.eventEndsWeek!=='boolean'||!['quiet','rush','storm','career-fair'].includes(restored.campusCondition)||(restored.lastAction!==null&&!ACTIONS.some(a=>a.id===restored.lastAction)))throw new Error('Invalid campus state.');
  if(restored.ending==='academic')restored.ending='afm';
  return restored;
}
