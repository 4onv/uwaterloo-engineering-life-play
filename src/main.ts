import './game.css';
import { PROGRAM_GUIDE } from './program-guide.ts';
import type { DecisionSpin, Reveal } from './decisions.ts';
import './expansion.css';
import {LOCATION_RULES} from './expansion.ts';
import {travel,locationEffects,livingCost,RULES,hasGuaranteedTronOffer,actionRiskChance} from './engine.ts';
import { gameShell } from './screen.ts';
import { showSpin } from './chance.ts';
import { jobChance } from './engine.ts';
import { ACHIEVEMENTS, EVENTS, FRIENDS, JOBS, PROGRAMS, UPGRADES, schedule } from './data.ts';
import { activeJob, admissionChance, applyToProgram, availableActions, availableJobs, buyUpgrade, currentTerm, finishAssessment, jobReadiness, newGame, nextTerm, program, random, resolveEvent, rollAdmission, takeAction, useBonus, validateSave } from './engine.ts';
import { launchMinigame, MINI_NAMES } from './arcade.ts';
import type { MiniType } from './arcade.ts';
import { Scene } from './art-scene.ts';
import type { GameState, Location, Stat } from './types.ts';

const $=<T extends HTMLElement=HTMLElement>(selector:string)=>document.querySelector<T>(selector)!;
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const odds=(n:number)=>`${(n*100).toFixed(n<.01?3:0)}%`;
const money=(n:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n);
const icon=(name:string,cls='')=>`<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const sprite=`<svg style="display:none" xmlns="http://www.w3.org/2000/svg"><symbol id="i-book" viewBox="0 0 24 24"><path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15"/></symbol><symbol id="i-bolt" viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8L21 9h-8z"/></symbol><symbol id="i-code" viewBox="0 0 24 24"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/></symbol><symbol id="i-tool" viewBox="0 0 24 24"><path d="m14 6 4 4M7 4l3 3-4 4-3-3m4 3 11 11 4-4L11 7M13 4a6 6 0 0 1 7 7l-8 8-4-4 8-8z"/></symbol><symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 4h16v12H9l-5 4zM8 8h8m-8 4h5"/></symbol><symbol id="i-cup" viewBox="0 0 24 24"><path d="M4 8h12v7a5 5 0 0 1-10 0V8m10 1h2a3 3 0 0 1 0 6h-2M3 21h17M8 2v3m5-3v3"/></symbol><symbol id="i-food" viewBox="0 0 24 24"><path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v19M19 3c-4 3-4 8 0 9v10m0-19v9"/></symbol><symbol id="i-cash" viewBox="0 0 24 24"><path d="M2 5h20v14H2zM6 5a4 4 0 0 1-4 4m20 0a4 4 0 0 1-4-4M2 15a4 4 0 0 1 4 4m12 0a4 4 0 0 1 4-4"/><circle cx="12" cy="12" r="3"/></symbol><symbol id="i-people" viewBox="0 0 24 24"><circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4m2-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/></symbol><symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/></symbol><symbol id="i-leaf" viewBox="0 0 24 24"><path d="M20 3C8 2 2 9 6 16s15 1 14-13ZM3 22 16 8"/></symbol><symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 21 3 12C-3 4 8-1 12 6c4-7 15-2 9 6z"/></symbol><symbol id="i-music" viewBox="0 0 24 24"><path d="M4 15V9a8 8 0 0 1 16 0v6M4 11h4v9H4zm12 0h4v9h-4z"/></symbol><symbol id="i-save" viewBox="0 0 24 24"><path d="M4 3h14l3 3v15H3V3h3v7h11V3M7 21v-7h10v7"/></symbol><symbol id="i-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="m9 3 1-2h4l1 2 3 2 3 1v4l-2 2 2 2v4l-3 1-3 2-1 2h-4l-1-2-3-2-3-1v-4l2-2-2-2V6l3-1z"/></symbol><symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13Z"/><circle cx="12" cy="9" r="3"/></symbol><symbol id="i-ring" viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><circle cx="12" cy="13" r="5"/><path d="m9 5 1-3h4l1 3"/></symbol><symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></symbol><symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></symbol><symbol id="i-trophy" viewBox="0 0 24 24"><path d="M7 3h10v7a5 5 0 0 1-10 0zm-1 2H2v4a5 5 0 0 0 6 4m10-8h4v4a5 5 0 0 1-6 4m-4 2v6m-5 0h10"/></symbol></svg>`;

let storageAvailable=true;
function readStorage(key:string):string|null{try{return localStorage.getItem(key);}catch{storageAvailable=false;return null;}}
function writeStorage(key:string,value:string){try{localStorage.setItem(key,value);return true;}catch{storageAvailable=false;return false;}}
let state:GameState;let initialWarning='';
try{const saved=readStorage('wel:autosave');state=saved?validateSave(JSON.parse(saved)):newGame();}catch{state=newGame();initialWarning='Your autosave could not be read. Manual save slots are still available.';}
let settings:{reduced:boolean;sound:boolean}={reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,sound:false};
try{const saved=JSON.parse(readStorage('wel:settings')||'null');if(saved&&typeof saved.reduced==='boolean'&&typeof saved.sound==='boolean')settings=saved;}catch{/* Retain accessible defaults. */}
let allAchievements:string[]=[];
try{const saved:unknown=JSON.parse(readStorage('wel:achievements')||'[]');if(Array.isArray(saved))allAchievements=saved.filter((id):id is string=>typeof id==='string'&&ACHIEVEMENTS.some(a=>a.id===id));}catch{/* Empty collection. */}
let actionFilter='all';
let scene:Scene;let modalCleanup:(()=>void)|null=null;let selectedProgram=hasGuaranteedTronOffer(state.name)&&state.stage==='admissions'?'mechatronics':state.program;let selectedStream:4|8=8;let backend=false;let busy=false;let lastFocus:HTMLElement|null=null;let audioContext:AudioContext|null=null;let toastTimer:ReturnType<typeof setTimeout>;

$('#app').innerHTML=gameShell(sprite);
scene=new Scene($('#world'),state);

const locations:{id:Location;name:string;title:string;subtitle:string;icon:string}[]=[
  {id:'e7',name:'E7',title:'Engineering 7',subtitle:'A little progress, one problem at a time.',icon:'tool'},
  {id:'dana',name:'DC Library',title:'Davis Centre Library',subtitle:'Find a quiet corner. Make the next thing make sense.',icon:'book'},
  {id:'plaza',name:'The Plaza',title:'University Plaza & CPH',subtitle:'There is a life outside the lecture hall.',icon:'cup'},
  {id:'residence',name:'Home',title:'Your residence room',subtitle:'Some days, the best plan is to slow down.',icon:'moon'},
  {id:'work',name:'Co-op',title:'Your co-op workspace',subtitle:'The things you learn here are not on the exam.',icon:'code'},
];
function toast(message:string){const el=$('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4000);}
function sound(){if(!settings.sound)return;try{audioContext??=new AudioContext();void audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.setValueAtTime(520,audioContext.currentTime);osc.frequency.exponentialRampToValueAtTime(780,audioContext.currentTime+.1);gain.gain.setValueAtTime(.025,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.2);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.2);}catch{/* Audio is optional. */}}
function persist(){
  const success=writeStorage('wel:autosave',JSON.stringify(state));
  const fresh=state.achievements.filter(id=>!allAchievements.includes(id));allAchievements=[...new Set([...allAchievements,...state.achievements])];writeStorage('wel:achievements',JSON.stringify(allAchievements));
  $('#save-status').innerHTML=`<i class="${success?'':'warning'}"></i> ${success?'Autosaved':'Save unavailable'}`;
  if(fresh.length&&state.stage!=='admissions'){const a=ACHIEVEMENTS.find(a=>a.id===fresh[0]);if(a)toast(`Achievement unlocked · ${a.name}`);}
}
function mutate(fn:()=>unknown){if(busy)return;fn();persist();render();sound();}
function stat(label:string,value:number|string,key:string,ic:string,percent?:number){return `<div class="stat stat-${key}"><span>${icon(ic)} ${label}</span><strong>${esc(value)}</strong>${percent!==undefined?`<div class="stat-track"><i style="width:${percent}%"></i></div>`:'<div class="stat-foot">CAD</div>'}</div>`;}
function render(){
  document.documentElement.classList.toggle('reduced-motion',settings.reduced);
  const term=currentTerm(state),s=state.stats,admissions=state.stage==='admissions';
  $('.game-screen').classList.toggle('admissions',admissions);
  $('.game-screen').classList.toggle('devil',state.difficulty==='devil');
  $('.game-screen').classList.toggle('danger',state.stats.stress>=75);
  $('.game-screen').classList.add('expanded');
  $('.game-screen').classList.toggle('math-ending',state.ending==='math');
  $('#chapter').innerHTML=admissions?'':state.ending==='math'?'<strong>Math</strong><span>Admissions result</span>':state.ending==='afm'?'<strong>AFM</strong><span>Forced transfer</span>':`<strong>${esc(term.label)}</strong><span>${esc(program(state).short)} · S${state.stream}</span><small>${esc(state.name)}${state.strikes?` · ${state.strikes}/2 strikes`:''}${state.difficulty==='devil'?' · DEVIL':''}</small>`;
  $('#stats').innerHTML=stat(state.ending==='math'?'Grade 12':'Average',`${(state.ending==='math'?state.grade12:state.gpa).toFixed(1)}%`,'gpa','book',state.gpa)+stat('Stress',`${s.stress}%`,'stress','bolt',s.stress)+stat('Energy',`${s.energy}%`,'energy','moon',s.energy)+stat('Morale',`${s.morale}%`,'morale','heart',s.morale)+stat('Savings',money(s.cash),'cash','cash')+stat('Readiness',`${jobReadiness(state)}`,'career','code',Math.min(100,jobReadiness(state)));
  const loc=locations.find(l=>l.id===state.location)!;
  $('#scene-location').innerHTML=`${icon('pin')} ${esc(loc.title)}`;$('#scene-time').textContent=state.week===3?'THE NIGHT BEFORE':admissions?'A NEW BEGINNING':`WEEK ${Math.min(4,state.week+1)} OF 4`;
  $('#scene-caption').innerHTML=`<span class="scene-label">${term.kind==='coop'&&activeJob(state)?esc(activeJob(state)!.place):'WATERLOO, ONTARIO'}</span><p>${esc(loc.subtitle)}</p>`;
  $('#locations').innerHTML=locations.filter(l=>term.kind==='coop'||l.id!=='work').map((l,i)=>`<button data-location="${l.id}" class="${l.id===state.location?'active':''}" ${state.stage!=='choice'?'disabled':''}>${icon(l.icon)}<span>${l.name}</span><kbd>${i+1}</kbd></button>`).join('');
  $('#journey').innerHTML=`<div class="journey-heading"><span class="eyebrow">THE ROAD TO YOUR RING</span><span>${state.grades.length}/8 study · ${state.completedCoops}/6 co-op</span></div><div class="journey-stops">${schedule(state.stream).map((t,i)=>`<span class="stop ${i<state.termIndex||state.ending==='graduated'?'complete':i===state.termIndex&&!admissions?'current':''}" title="${t.kind==='study'?`Study ${t.label}`:t.label}"><i>${i<state.termIndex||state.ending==='graduated'?'✓':t.kind==='study'?t.label:'·'}</i><small>${t.kind==='study'?t.label:`C${t.number}`}</small></span>`).join('')}<span class="ring-stop">${icon('ring')}</span></div>`;
  $('#journal-count').textContent=state.log.length?`${state.log.length}`:'';
  scene.update(state,settings.reduced);renderDecision();
}
function effectsText(effects:Partial<Record<Stat,number>>){return Object.entries(effects).map(([k,v])=>{const positive=k==='stress'?v<0:v>0;return `<span class="effect ${positive?'positive':'negative'}">${v>0?'+':''}${k==='cash'?money(v):v} ${k==='prep'?'prep':k==='reputation'?'rep':k==='network'?'connections':k}</span>`;}).join('');}
function renderDecision(){
  const panel=$('#decision'),term=currentTerm(state);
  panel.classList.toggle('choosing',state.stage==='choice'&&(term.kind==='study'||!!state.selectedJob));
  if(state.stage==='admissions'){
    if(!state.admissionRolled){panel.innerHTML=`<span class="eyebrow">WELCOME TO WATERLOO</span><h2>Waterloo<br><em>Engineering Life</em></h2><p class="panel-intro">8 study terms. 6 co-ops. One iron ring. Let the wheels decide your Waterloo story.</p><form id="start-form"><label for="player-name">WHAT SHOULD WE CALL YOU?</label><input id="player-name" maxlength="24" value="${esc(state.name==='Alex'?'':state.name)}" placeholder="Your first name" autocomplete="given-name"><label for="difficulty">YOUR PACE</label><select id="difficulty"><option value="balanced" ${state.difficulty==='balanced'?'selected':''}>Balanced · the Waterloo experience</option><option value="cozy" ${state.difficulty==='cozy'?'selected':''}>Cozy · a little more breathing room</option><option value="crunch" ${state.difficulty==='crunch'?'selected':''}>Crunch · every choice counts</option></select><button class="primary start-button" type="submit">Spin your Grade 12 average ${icon('arrow')}</button></form><div class="panel-note">${icon('ring')} 8 study terms · 6 co-ops · your own path</div>`;}
    else {const p=PROGRAMS.find(p=>p.id===selectedProgram)!;panel.innerHTML=`<span class="eyebrow">A PLACE TO BEGIN</span><div class="admission-grade"><span>YOUR GRADE 12 AVERAGE</span><strong>${state.grade12.toFixed(1)}<small>%</small></strong></div><h2>Choose your path.</h2><p class="panel-intro">${state.admissionAttempts?'Deferred this round. Spin again or try another program. Every application is a fresh chance.':'Pick an engineering program, then spin for an offer.'}</p><label for="program-select">ENGINEERING PROGRAM</label><select id="program-select">${PROGRAMS.map(p=>`<option value="${p.id}" ${p.id===selectedProgram?'selected':''}>${p.name}</option>`).join('')}</select>${programCard(p.id)}${p.stream==='dual'?`<label for="stream-select">CO-OP STREAM</label><select id="stream-select"><option value="8" ${selectedStream===8?'selected':''}>Stream 8 · first co-op after 1B</option><option value="4" ${selectedStream===4?'selected':''}>Stream 4 · first co-op after 1A</option></select>`:`<div class="info-line">${icon('code')} Stream ${p.stream} · first co-op after ${p.stream===4?'1A':'1B'}</div>`}<button class="primary" id="apply-program">Spin for ${esc(p.short)} admission ${icon('arrow')}</button><p class="fine-print">${odds(admissionChance(state,selectedProgram))} in-game offer chance. These odds are fictional.</p>`;}
    return;
  }
  if(state.stage==='event'){
    const e=EVENTS.find(e=>e.id===state.pendingEvent)!;panel.innerHTML=`<span class="eyebrow event-eyebrow">${state.eventEndsWeek?'Weekly event':'Arrival encounter · no week spent'}</span><div class="event-icon">${icon(e.icon)}</div><h2>${esc(e.title)}</h2><p class="panel-intro">${esc(e.text)}</p><div class="event-place">${icon('pin')} ${esc(e.place)}</div><div class="event-choices">${e.choices.map((c,i)=>`<button class="event-choice" data-event-choice="${i}"><strong>${esc(c.label)}</strong><span>${esc(c.description)}</span>${icon('arrow')}</button>`).join('')}</div>`;return;
  }
  if(state.stage==='assessment'){
    panel.innerHTML=`<span class="eyebrow">${term.kind==='study'?'PENCILS DOWN. DEEP BREATH.':'THE WORK-TERM CHECK-IN'}</span><div class="event-icon">${icon(term.kind==='study'?'book':'tool')}</div><h2>${term.kind==='study'?'Time for finals.':'Show what you learned.'}</h2><p class="panel-intro">${term.kind==='study'?'Your preparation, energy, morale, and stress shape the odds. Spin to find out how finals go.':'Your reputation and skills shape the odds. Spin the wheel for your work-term evaluation.'}</p><div class="assessment-stats"><span>${term.kind==='study'?'Preparation':'Reputation'}<b>${term.kind==='study'?state.stats.prep:state.stats.reputation}%</b></span><span>Energy<b>${state.stats.energy}%</b></span><span>Pressure<b>−${state.termPressure}</b></span><span>Stress<b>${state.stats.stress}%</b></span></div><button class="primary" id="start-assessment">Spin your term result ${icon('arrow')}</button><p class="fine-print">Outcomes are chance-based. Preparation improves your result.</p>`;return;
  }
  if(state.stage==='report'){
    const r=state.report!;panel.innerHTML=`<span class="eyebrow">${esc(r.term)} · ${term.kind==='study'?'TERM RESULTS':'WORK-TERM REVIEW'}</span><div class="report-grade ${(r.grade??0)<60?'low':''}">${r.grade?.toFixed(term.kind==='study'?1:0)}<small>${term.kind==='study'?'%':'/100'}</small></div><h2>${esc(r.title)}</h2><p class="panel-intro">${esc(r.text)}</p><div class="report-detail"><span>${term.kind==='study'?'Term fees':'Total work-term earnings'}</span><strong>${money(r.earned??0)}</strong></div><div class="report-detail"><span>Cumulative average</span><strong>${state.gpa.toFixed(1)}%</strong></div><div class="report-detail"><span>Academic strikes</span><strong>${state.strikes} / 2</strong></div><button class="primary" id="next-term">${state.termIndex===13?'Your ring is waiting':`On to ${schedule(state.stream)[state.termIndex+1].label}`} ${icon('arrow')}</button>`;return;
  }
  if(state.stage==='ended'){
    const graduated=state.ending==='graduated';const math=state.ending==='math';const title=math?'You only got into math.':graduated?'The iron ring.':state.ending==='afm'?'Transferred to AFM.':state.ending==='career'?'The work term did not pass.':state.ending==='burnout'?'Time to step back.':'A financial reset.';
    const text=math?'Markus, your 78.0% average landed you a spot in Mathematics. Engineering did not send an offer. Better luck on the next spin.':graduated?`${state.name}, you did it. Eight study terms, six co-ops, and a cohort of people who made the hard days easier.`:state.ending==='afm'?'Two academic strikes. Your engineering chapter is over: you have been forced to transfer to Accounting and Financial Management. The AFM arc begins.':state.ending==='career'?'Your co-op evaluation fell below 45. The work term was not credited, so this engineering run ends here.':state.ending==='burnout'?`You reached the ${RULES[state.difficulty].burnouts}-burnout limit for ${state.difficulty} difficulty. Your run ends here. Build recovery into the next plan.`:'Your balance fell below −$12,000. A new run is a chance to choose a more sustainable path.';
    panel.innerHTML=`<span class="eyebrow">${math?'ADMISSIONS RESULT':graduated?'CLASS OF '+(2026+5):'THIS CHAPTER CLOSES HERE'}</span><div class="ending-ring">${icon(graduated?'ring':'leaf')}</div><h2>${title}</h2><p class="panel-intro">${esc(text)}</p><div class="ending-grid"><span><b>${(math?state.grade12:state.gpa).toFixed(1)}%</b>${math?'Grade 12 average':'Final average'}</span><span><b>${money(state.stats.cash)}</b>Savings</span><span><b>${state.caliOffers}</b>Cali co-ops</span><span><b>${state.achievements.length}</b>Achievements</span></div><p class="ending-caption">${graduated?(state.achievements.includes('dream')?'THE WHOLE JOURNEY · YOUR CALI DREAM, COMPLETE':state.achievements.includes('balanced')?'MADE IT AS YOURSELF · A LIFE BEYOND THE TRANSCRIPT':'AN ENGINEER’S BEGINNING · THE NEXT CHAPTER IS YOURS'):'Your permanent achievement collection stays with you.'}</p><button class="primary" data-modal="newgame">Start another story ${icon('arrow')}</button><button class="secondary full" data-modal="journal">Look back at your journal</button>`;return;
  }
  if(term.kind==='coop'&&!state.selectedJob){
    const ready=jobReadiness(state),available=availableJobs(state);panel.innerHTML=`<span class="eyebrow">WATERLOOWORKS · ${esc(term.label)}</span><h2>Where to next?</h2><p class="panel-intro">Your skills, connections, and reputation open doors. Pick the experience you want to build on.</p><div class="job-list">${JOBS.map(j=>`<button class="job-card ${j.cali?'cali-job':''}" data-job="${j.id}" ${!available.includes(j)?'disabled':''}><span class="job-city">${esc(j.place)} ${j.cali?'↗':''}</span><strong>${esc(j.name)}</strong><span>${money(j.weekly)} / week · ${odds(jobChance(state,j.id))} offer chance</span><small>${ready>=j.requirement?esc(j.description):`Needs ${j.requirement} readiness${j.cali?' and 2 completed co-ops':''} · you have ${ready}`}</small></button>`).join('')}</div>`;return;
  }
  const allActions=availableActions(state);const actions=allActions.filter(a=>actionFilter==='all'||(actionFilter==='risk'?!!a.risk:actionFilter==='focus'?!!a.kind:!a.kind));const place=LOCATION_RULES[state.location];panel.innerHTML=`<div class="panel-heading"><span class="eyebrow">WEEK ${state.week+1} / 4 <span>·</span> ${esc(locations.find(l=>l.id===state.location)!.name.toUpperCase())}</span><span class="prep-chip">${term.kind==='study'?'PREP':'REP'} <b>${term.kind==='study'?state.stats.prep:state.stats.reputation}%</b></span></div><h2>This week’s draw.</h2><div class="location-rules"><strong>${esc(place.name)}</strong><button class="location-info" data-modal="location" aria-label="Location effects and travel rules">Info</button><p>${esc(place.benefit)}</p><small>${esc(place.tradeoff)}</small><div class="effects">${effectsText(locationEffects(state))}</div></div><div class="campus-condition">${state.campusCondition==='storm'?'Freezing rain: travel costs 3 extra energy.':state.campusCondition==='rush'?'Midterm rush: DC’s study bonus is reduced.':state.campusCondition==='career-fair'?'Career fair: double networking at the Plaza.':'Quiet campus: normal facility bonuses.'}<span>${allActions.length} cards dealt</span></div><div class="action-filters">${[['all','All'],['focus','Focus'],['life','Life'],['risk','Risky']].map(([id,label])=>`<button data-action-filter="${id}" class="${actionFilter===id?'active':''}">${label}</button>`).join('')}<button id="bonus-open" class="break-filter" ${state.bonusPlayed?'disabled':''} title="One free chance game per term">${state.bonusPlayed?'Break ✓':'Break ✦'}</button></div><div class="action-list">${state.week===1 && !state.bonusPlayed ? '<button class="midway-card" id="midway"><strong>EngSoc pop-up arcade ↗</strong><span>Spin for a booth · uses your free term break</span></button>' : ''}${actions.length ? '' : '<p>No matching cards in this draw. Choose All to see your hand.</p>'}${actions.map(a=>`<button class="action-card" data-action="${a.id}"><span class="action-icon">${icon(a.icon)}</span><span class="action-content"><strong>${esc(a.name)}</strong><span class="action-description">${esc(a.description)}</span><span class="effects">${effectsText(a.effects)}</span>${a.risk?`<span class="risk-info">On roll: ${effectsText(a.risk.effects)}</span>`:''}</span>${a.risk?`<span class="risk-tag">${Math.round(actionRiskChance(state,a)*100)}% chance</span>`:''}<span class="action-arrow">↗</span></button>`).join('')}</div><div class="weekly-note">${icon('cash')} Living costs: ${money(livingCost(state))} / week${activeJob(state)?` · Salary: ${money(activeJob(state)!.weekly)}`:''}</div>`;
}

function openDialog(content:string,wide=false,locked=false){
  if(!$('#overlay').hidden) closeDialog();lastFocus=document.activeElement as HTMLElement;
  $('#dialog-content').innerHTML=content;$('.dialog').classList.toggle('wide',wide);$('#dialog-close').hidden=locked;$('#overlay').hidden=false;
  $('.dialog').focus();document.body.classList.add('modal-open');
}
function closeDialog(){if(modalCleanup){modalCleanup();modalCleanup=null;}busy=false;$('#overlay').hidden=true;$('#dialog-content').innerHTML='';document.body.classList.remove('modal-open');render();lastFocus?.focus();}
function heading(kicker:string,title:string,desc=''){return `<span class="eyebrow">${kicker}</span><h2 id="dialog-title">${title}</h2>${desc?`<p class="dialog-intro">${desc}</p>`:''}`;}
function openModal(name:string){
  if(name==='location'){const place=LOCATION_RULES[state.location];openDialog(`${heading('Campus facilities',esc(place.name))}<p>${esc(place.benefit)}</p><p>${esc(place.tradeoff)}</p><p>Changing location costs ${RULES[state.difficulty].travel} energy, plus 3 during freezing rain. Your first visit to each location each week can trigger an arrival encounter. Arrival choices do not spend a week.</p>`);}
  if(name==='menu')openDialog(`${heading('Waterloo Engineering Life','Game menu')}<div class="menu-options"><button class="secondary full" data-modal="saves">Save & load</button><button class="secondary full" data-modal="settings">Settings</button><button class="secondary full" data-modal="help">How to play</button><button class="secondary full" data-modal="about">Credits</button><button class="text-button danger" data-modal="newgame">New game</button></div>`);
  if(name==='help')openDialog(`${heading('A FIELD GUIDE','A life, not just a transcript.','Get from 1A to 4B, finish six co-ops, and find your own version of a good ending.')}<div class="help-grid"><article>${icon('book')}<h3>Four weeks per term</h3><p>Visit campus locations and choose one action per week. Each study term ends in finals; each co-op ends in a review.</p></article><article>${icon('heart')}<h3>Keep yourself in the picture</h3><p>Stress at 100 triggers burnout recovery. The recovery limit is 3 in Balanced, 2 in Crunch, and 1 in Devil. Low energy makes stress worse. Rest and support are free.</p></article><article>${icon('code')}<h3>Build your options</h3><p>Skills, connections, reputation, and grades increase career readiness. A research role is always open for applications. California needs 65 readiness and two completed co-ops.</p></article><article>${icon('ring')}<h3>Make it to your ring</h3><p>Pass with 60% or more. Two academic strikes force you to transfer to AFM. A co-op evaluation below 45 ends your engineering run. Keep your balance above −$12,000. Two Cali co-ops and $20,000 unlock the dream ending.</p></article></div><p class="info-banner">Click a location or use keys 1–5. Escape closes menus. Outcomes are rolled at random. Save automatically after every choice.</p>`,true);
  if(name==='friends')openDialog(`${heading('YOUR COHORT','You don’t do this alone.','Spend time with people in weekly actions and events. Friendships unlock at 25, 50, and 75.')}<div class="friend-list">${FRIENDS.map((f,i)=>`<article class="friend-card"><div class="pixel-avatar avatar-${i}" style="--avatar-color:${f.color}"><span></span></div><div><span class="eyebrow">${f.role}</span><h3>${f.name}</h3><p>${f.description}</p><div class="friend-track"><i style="width:${state.friends[f.id]}%;background:${f.color}"></i></div><small>${state.friends[f.id]}/100 · ${state.friends[f.id]>=75?f.milestones[2]:state.friends[f.id]>=50?f.milestones[1]:state.friends[f.id]>=25?f.milestones[0]:'Every friendship starts somewhere.'}</small></div></article>`).join('')}</div>`);
  if(name==='journal')openDialog(`${heading('THE DAYS ADD UP','Your Waterloo journal.')}${state.admissionRolled && state.stage!=='admissions' && state.ending!=='math' ? programCard(state.program) : ''}<div class="transcript">${state.grades.map((g,i)=>`<span>${['1A','1B','2A','2B','3A','3B','4A','4B'][i]}<strong class="${g<60?'negative':''}">${g.toFixed(1)}%</strong></span>`).join('')||'<p>Your transcript starts after your first term.</p>'}</div><div class="journal-list">${state.log.map(l=>`<article class="journal-entry ${l.tone}"><span>${esc(l.term)}</span><p>${esc(l.text)}</p></article>`).join('')||'<p class="empty-note">A blank page. A whole story ahead.</p>'}</div>`,true);
  if(name==='shop')openDialog(`${heading('SMALL THINGS HELP','Make this corner yours.',`Available savings: ${money(state.stats.cash)}. Upgrades stay with you for this run.`)}<div class="shop-grid">${UPGRADES.map(i=>`<article class="shop-card"><div class="shop-icon">${icon(i.icon)}</div><h3>${i.name}</h3><p>${i.description}</p><button class="secondary full" data-buy="${i.id}" ${state.items.includes(i.id)||state.stats.cash<i.price||state.stage!=='choice'?'disabled':''}>${state.items.includes(i.id)?'✓ On your desk':money(i.price)}</button></article>`).join('')}</div>${state.stage!=='choice'?'<p class="fine-print">You can shop between weekly choices.</p>':''}`,true);
  if(name==='achievements')openDialog(`${heading('THINGS WORTH REMEMBERING','More than a grade.',`${allAchievements.length}/${ACHIEVEMENTS.length} unlocked across all your runs. A fresh story keeps your collection.`)}<div class="achievement-grid">${ACHIEVEMENTS.map(a=>`<article class="achievement ${allAchievements.includes(a.id)?'unlocked':''}"><span>${icon(allAchievements.includes(a.id)?'trophy':'ring')}</span><div><h3>${a.name}</h3><p>${a.description}</p></div>${state.achievements.includes(a.id)?'<small>THIS RUN</small>':''}</article>`).join('')}</div>`,true);
  if(name==='bonus')openDialog(`${heading('A MOMENT BETWEEN DEADLINES','Take a little break.','Pick one free challenge per term. Your score earns cash and helps you recover.')}<div class="minigame-grid">${(['wheel','plinko','scratch','dice','geese','swap'] as MiniType[]).map((t,i)=>`<button class="minigame-card" data-mini="${t}"><span class="mini-symbol">${['✦','⠿','▧','⚄','➜','⚙'][i]}</span><strong>${MINI_NAMES[t]}</strong><small>${['Spin for a prize','Pick a lane, watch it bounce','Reveal your lucky tiles','Let two dice decide','Cross again or bank your score','Keep your part or trade it'][i]}</small></button>`).join('')}</div>`,true);
  if(name==='newgame')openDialog(`${heading('A NEW COHORT. A NEW CHANCE.','Start another story?','Your autosave will be replaced. Save this run to a slot or export it first if you want to come back. Your achievement collection stays.')}<button class="primary" id="confirm-new">Begin a new run ${icon('arrow')}</button><button class="secondary full" data-modal="saves">Save this story first</button>`);
  if(name==='settings')openDialog(`${heading('MAKE YOURSELF COMFORTABLE','Your pace. Your space.')}<label class="setting-row"><span><strong>Reduced motion</strong><small>Quiet scene animation and shorter spin transitions.</small></span><input type="checkbox" id="setting-motion" ${settings.reduced?'checked':''}></label><label class="setting-row"><span><strong>Soft interaction sounds</strong><small>A quiet note after choices. Off by default.</small></span><input type="checkbox" id="setting-sound" ${settings.sound?'checked':''}></label><div class="setting-row"><span><strong>Current run</strong><small>${esc(state.difficulty)} difficulty · seeded, repeatable events</small></span></div><button class="secondary full" data-modal="help">How to play</button><button class="text-button danger" data-modal="newgame">Start a new game</button>`);
  if(name==='saves')renderSaves();
  if(name==='about')openDialog(`${heading('AN UNOFFICIAL FAN GAME','Waterloo Engineering Life','Original code and original generated pixel artwork, inspired by the gameplay of Waterloo Eng Life on Chatforce.')}<p>This is a complete single-player game with a beginning, 14 term chapters, persistent saves, and multiple endings. It is not affiliated with the University of Waterloo, EngSoc, or Chatforce.</p><p>Admission chances, grades, tuition, salaries, campus geography, and academic progression are fictional game mechanics. Stream sequences are simplified. Named campus friends are fictional characters.</p><p>Engineering program names and stream categories reference <a href="https://uwaterloo.ca/engineering/undergraduate-students/co-op-experience/co-op-study-sequences" target="_blank" rel="noopener">Waterloo’s co-op overview ↗</a>. Campus traditions reference <a href="https://www.engsoc.uwaterloo.ca/about-us/traditions/" target="_blank" rel="noopener">EngSoc ↗</a>.</p><p>Gameplay reference: <a href="https://waterloo-eng-life.chatforce.com/?ref=dev" target="_blank" rel="noopener">Waterloo Eng Life ↗</a>. Dialogue and implementation are original. Background art was generated for this game.</p><div class="info-banner">TypeScript game engine & renderer · Python + SQLite save server · local-first, no telemetry.</div>`);
}

function getSlot(id:number):{savedAt:string;state:GameState}|null{try{const data=JSON.parse(readStorage(`wel:slot:${id}`)||'null');return data?{savedAt:String(data.savedAt),state:validateSave(data.state)}:null;}catch{return null;}}
function renderSaves(){openDialog(`${heading('A PLACE TO PICK UP AGAIN','Save your story.',`${backend?'Python + SQLite server connected. Slots are saved on this device and the local server.':'Saves stay in this browser. Export a file to back them up or move devices.'}${storageAvailable?'':' Browser storage is blocked; use Export.'}`)}<div class="save-slots">${[1,2,3].map(id=>{const saved=getSlot(id);return `<article class="save-slot"><span class="slot-number">0${id}</span><div><h3>${saved?`${esc(saved.state.name)} · ${currentTerm(saved.state).label}`:'An empty page'}</h3><small>${saved?`${esc(program(saved.state).short)} · ${new Date(saved.savedAt).toLocaleString()} · ${saved.state.stage==='ended'?'Finished':`Week ${saved.state.week+1}`}`:'Save a run here whenever you like.'}</small></div><button class="secondary" data-save="${id}">${saved?'Overwrite':'Save'}</button><button class="text-button" data-load="${id}" ${!saved?'disabled':''}>Load</button></article>`;}).join('')}</div><div class="save-tools"><button class="secondary" id="export-save">Export save file ↗</button><button class="secondary" id="import-save">Import save file ↙</button>${backend?'<button class="secondary" id="restore-server">Restore server slots</button>':''}</div><p class="fine-print">Autosave updates after every choice. Loading a slot replaces your autosave.</p>`,true);}
function challenge(type:MiniType,assessment=false){
  if(assessment?state.stage!=='assessment':state.stage!=='choice'||state.bonusPlayed)return;
  openDialog('<div id="minigame-host"></div>',false,assessment);busy=true;
  modalCleanup=launchMinigame($('#minigame-host'),type,{reduced:settings.reduced,random:()=>random(state),assessment,done:score=>{busy=false;closeDialog();actionFilter='all';mutate(()=>assessment?finishAssessment(state,score):useBonus(state,score));},cancel:()=>{busy=false;closeDialog();persist();render();}});
}

function spinDialog(options:{title:string;description:string;labels:string[];weights?:number[];result:string;selected:number;onSpin?:()=>void}) {
  openDialog('<div id="chance-host"></div>',false,true);busy=true;
  modalCleanup=showSpin($('#chance-host'),{...options,reduced:settings.reduced,done:()=>{busy=false;closeDialog();persist();render();sound();}});
}
function spinDecision(title: string, resolve: (draft: GameState, reveal: Reveal) => boolean, unavailable?: string) {
  if (busy) return;
  const draft = structuredClone(state);
  let outcome: DecisionSpin | undefined;
  const completed = resolve(draft, spin => { outcome = spin; });
  if (!completed || !outcome) {
    if (unavailable) toast(unavailable);
    return;
  }
  const changes = (Object.keys(state.stats) as Stat[]).flatMap(key => {
    const delta = draft.stats[key] - state.stats[key];
    return delta ? [`${key} ${delta > 0 ? '+' : ''}${delta}`] : [];
  });
  spinDialog({
    ...outcome, title, description:'Spin to resolve your choice.',
    result:[outcome.result, changes.join(' · ')].filter(Boolean).join(' '),
    onSpin:() => { state = draft; actionFilter = 'all'; persist(); },
  });
}
function travelWheel(location: Location) {
  if (state.location === location) return;
  const destination = locations.find(place => place.id === location);
  if (destination) spinDecision('Trip to ' + destination.name, (draft, show) => travel(draft, location, show),
    'Travel needs energy and an active contract during co-op.');
}
function programCard(id: string) {
  const guide = PROGRAM_GUIDE[id];
  return `<div class="program-guide"><p>${esc(guide.summary)}</p><small>Sample first-year course</small><strong>${esc(guide.course)}</strong><a href="${guide.source}" target="_blank" rel="noopener">Waterloo program guide ↗</a></div>`;
}

function spinGrade(){
  if(busy||state.admissionRolled)return;
  rollAdmission(state);
  if(hasGuaranteedTronOffer(state.name)){selectedProgram='mechatronics';selectedStream=8;}
  const labels=['20%','35%','50%','65%','75%','85%','95%','99%'];
  const selected=labels.reduce((best,n,i)=>Math.abs(parseFloat(n)-state.grade12)<Math.abs(parseFloat(labels[best])-state.grade12)?i:best,0);
  labels[selected]=`${state.grade12.toFixed(1)}%`;
  spinDialog({title:'Grade 12 average',description:`${state.name}, your Waterloo story starts with one spin.`,labels,selected,result:`${state.grade12.toFixed(1)}%${state.difficulty==='devil'?' · Devil difficulty awakened':''}${state.ending==='math'?' · You only got into math.':state.program==='mechatronics'&&state.stage==='choice'?' · Mechatronics · Stream 8':''}`});
}
function spinAdmission(){
  if(busy||state.stage!=='admissions')return;
  const chance=admissionChance(state,selectedProgram),p=PROGRAMS.find(p=>p.id===selectedProgram)!;
  const accepted=applyToProgram(state,selectedProgram,selectedStream);
  spinDialog({title:`${p.short} admission`,description:`${odds(chance)} chance of an offer.`,labels:['OFFER','DEFER'],weights:[chance,1-chance],selected:accepted?0:1,result:accepted?`Accepted · ${program(state).name} · Stream ${state.stream}`:'Deferred. Try another spin or choose another program.'});
}
function spinJob(id:string){
  if(busy||state.stage!=='choice')return;
  const j=JOBS.find(j=>j.id===id);if(!j)return;
  const odds=jobChance(state,id),accepted=selectJob(state,id);
  spinDialog({title:'Co-op interview',description:`${j.name} · ${(odds*100).toFixed(1)}% offer chance`,labels:['OFFER','NO OFFER'],weights:[odds,1-odds],selected:accepted?0:1,result:accepted?`Offer received · ${j.place}`:'No offer this round. You can interview again.'});
}

document.addEventListener('click',async e=>{
  const target=(e.target as HTMLElement).closest<HTMLElement>('button,[data-location]');if(!target)return;
  if(target instanceof HTMLButtonElement&&target.disabled)return;
  if(target.dataset.modal){e.preventDefault();openModal(target.dataset.modal);return;}
  if(target.id==='dialog-close'){if(!target.hidden){busy=false;closeDialog();}return;}
  if(target.dataset.actionFilter){actionFilter=target.dataset.actionFilter;renderDecision();return;}
  if(target.dataset.location){travelWheel(target.dataset.location as Location);return;}
  if(target.dataset.action){const id=target.dataset.action!;
    const action=availableActions(state).find(a=>a.id===id);
    if(action)spinDecision(action.name,(draft,show)=>takeAction(draft,id,show),'That choice exceeds your available credit.');return;}
  if(target.dataset.eventChoice!==undefined){const index=Number(target.dataset.eventChoice);
    const event=EVENTS.find(e=>e.id===state.pendingEvent);
    if(event?.choices[index])spinDecision(event.choices[index].label,(draft,show)=>resolveEvent(draft,index,show));return;}
  if(target.dataset.job){spinJob(target.dataset.job!);return;}
  if(target.id==='apply-program'){spinAdmission();return;}
  if(target.id==='next-term'){mutate(()=>nextTerm(state));return;}
  if(target.id==='start-assessment'){challenge('wheel',true);return;}
  if(target.id==='assisted-assessment'){mutate(()=>finishAssessment(state,75));return;}
  if(target.id==='midway' && !busy && state.stage==='choice' && !state.bonusPlayed){
    const booths=['geese','swap'] as const;
    const selected=Math.floor(random(state)*booths.length);
    openDialog('<div id="chance-host"></div>',false,true);busy=true;
    modalCleanup=showSpin($('#chance-host'),{title:'EngSoc pop-up arcade',description:'Two booths are open for the week-two fair.',
      labels:['Geese','Parts'],selected,result:MINI_NAMES[booths[selected]],reduced:settings.reduced,
      done:()=>{closeDialog();challenge(booths[selected]);}});
    return;
  }
  if(target.id==='bonus-open'){openModal('bonus');return;}
  if(target.dataset.mini){challenge(target.dataset.mini as MiniType);return;}
  if(target.dataset.buy){const item=UPGRADES.find(i=>i.id===target.dataset.buy);
    if(item)spinDecision(item.name,(draft,show)=>buyUpgrade(draft,item.id,show));return;}
  if(target.id==='confirm-new'){busy=false;closeDialog();state=newGame();selectedProgram='software';selectedStream=8;persist();render();return;}
  if(target.dataset.save){const id=Number(target.dataset.save);const data={savedAt:new Date().toISOString(),state};if(!writeStorage(`wel:slot:${id}`,JSON.stringify(data))){toast('Browser storage unavailable. Export your save instead.');return;}if(backend){try{const res=await fetch(`/api/saves/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!res.ok)throw new Error();}catch{toast('Saved in browser; Python server copy failed.');renderSaves();return;}}renderSaves();toast(`Saved to slot ${id}.`);return;}
  if(target.dataset.load){const saved=getSlot(Number(target.dataset.load));if(saved){state=saved.state;busy=false;closeDialog();persist();render();toast('Your story is ready to continue.');}return;}
  if(target.id==='export-save'){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`waterloo-life-${state.name.replace(/[^a-z0-9]/gi,'-')}-${currentTerm(state).label.replace(/[^a-z0-9]/gi,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
  if(target.id==='import-save'){$<HTMLInputElement>('#import-file').click();return;}
  if(target.id==='restore-server'){try{const res=await fetch('/api/saves');if(!res.ok)throw new Error();const slots=await res.json() as Record<string,{savedAt:string;state:unknown}>;let count=0;for(const [id,data]of Object.entries(slots)){if(['1','2','3'].includes(id)){const restored=validateSave(data.state);writeStorage(`wel:slot:${id}`,JSON.stringify({savedAt:data.savedAt,state:restored}));count++;}}renderSaves();toast(`Restored ${count} server save slots.`);}catch{toast('Could not restore server saves. Existing browser slots are unchanged.');}return;}
});
// Keep the engine import explicit so every state transition is testable without the DOM.
import { selectJob } from './engine.ts';

document.addEventListener('submit',e=>{if((e.target as HTMLElement).id==='start-form'){e.preventDefault();const name=$<HTMLInputElement>('#player-name').value.trim().slice(0,24)||'Alex';const difficulty=$<HTMLSelectElement>('#difficulty').value as GameState['difficulty'];state=newGame(name,difficulty);spinGrade();}});
document.addEventListener('change',e=>{const el=e.target as HTMLInputElement;if(el.id==='program-select'){selectedProgram=el.value;renderDecision();}if(el.id==='stream-select')selectedStream=Number(el.value) as 4|8;if(el.id==='setting-motion'||el.id==='setting-sound'){settings={reduced:$<HTMLInputElement>('#setting-motion').checked,sound:$<HTMLInputElement>('#setting-sound').checked};writeStorage('wel:settings',JSON.stringify(settings));render();sound();}});
$('#import-file').addEventListener('change',async e=>{const input=e.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>250000)throw new Error('Save files must be smaller than 250 KB.');const next=validateSave(JSON.parse(await file.text()));state=next;busy=false;closeDialog();persist();render();toast('Save file imported. Welcome back.');}catch(error){toast(error instanceof Error?error.message:'That save file could not be read.');}input.value='';});
$('#overlay').addEventListener('click',e=>{if(e.target===$('#overlay')&&!$('#dialog-close').hidden){busy=false;closeDialog();}});
document.addEventListener('keydown',e=>{
  if(!$('#overlay').hidden){if(e.key==='Escape'&&!$('#dialog-close').hidden){busy=false;closeDialog();}if(e.key==='Tab'){const focusable=[...$('.dialog').querySelectorAll<HTMLElement>('button:not(:disabled):not([hidden]),a,input,select,[tabindex="0"]')].filter(el=>el.offsetParent!==null);const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('.dialog'))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}return;}
  if((e.target as HTMLElement).matches('input,select,textarea')||busy)return;
  if(/^[1-5]$/.test(e.key)&&state.stage==='choice'){const list=locations.filter(l=>currentTerm(state).kind==='coop'||l.id!=='work'),loc=list[Number(e.key)-1];if(loc)travelWheel(loc.id);}
});
render();if(initialWarning)toast(initialWarning);
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
  void fetch('/api/health').then(async res => {
    if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
      const body = await res.json();
      backend = body.service === 'waterloo-life';
    }
  }).catch(() => { /* Browser saves also work without the local Python server. */ });
}
