import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ACTIONS, EVENTS, PROGRAMS } from '../src/data.ts';
import { activeJob, applyToProgram, availableActions, availableJobs, currentTerm, finishAssessment, newGame, nextTerm, random, resolveEvent, rollAdmission, selectJob, takeAction, travel, useBonus, validateSave } from '../src/engine.ts';
import type { GameState } from '../src/types.ts';

export type Strategy='balanced'|'academic'|'career'|'reckless';
export function simulate(seed:number,programId='software',difficulty:GameState['difficulty']='balanced',strategy:Strategy='balanced'):GameState {
  const s=newGame('Simulation',difficulty,seed);rollAdmission(s);s.grade12=94;while(!applyToProgram(s,programId,seed%2?4:8)){/* Campaign bots isolate gameplay from the separately tested admissions wheel. */}
  let guard=0;
  while(s.stage!=='ended'&&guard++<600){
    if(s.stage==='event'){
      const event=EVENTS.find(e=>e.id===s.pendingEvent)!;
      const scores=event.choices.map(c=>(c.effects.prep??0)*.4+(c.effects.skill??0)*.45+(c.effects.reputation??0)*.4+(c.effects.network??0)*.25+(c.effects.energy??0)*.2-(c.effects.stress??0)*.5+(c.effects.morale??0)*.15+(c.effects.cash??0)*.006);
      resolveEvent(s,scores.indexOf(Math.max(...scores)));continue;
    }
    if(s.stage==='assessment'){finishAssessment(s,strategy==='reckless'?15:[0,15,30,45,60,75,90,100][Math.floor(random(s)*8)]);continue;}
    if(s.stage==='report'){nextTerm(s);continue;}
    const term=currentTerm(s);
    if(term.kind==='coop'&&!s.selectedJob){selectJob(s,availableJobs(s).at(-1)!.id);continue;}
    if(!s.bonusPlayed)useBonus(s,70);
    let id:string;
    if(strategy==='reckless')id=term.kind==='study'?'cram':'overtime';
    else if(s.stats.stress>68)id='sleep';
    else if(s.stats.energy<38)id='napreview';
    else if(s.stats.morale<45)id='walk';
    else if(term.kind==='coop')id=s.stats.reputation<58?'deliver':s.stats.skill<75?'mentor':'network';
    else if(s.stats.prep < (strategy==='academic'?95:strategy==='career'?76:88))id='office';
    else if(s.stats.skill<85)id='interview';
    else id='walk';
    const place = ACTIONS.find(a=>a.id===id)!.location;
    if(s.location !== place) {
      travel(s,place);
      if(s.stage !== 'choice') continue;
    }
    const hand=availableActions(s);
    const priority = (a: typeof hand[number]) => {
      const e=a.effects, study=term.kind==='study';
      if(strategy==='reckless')return (e.stress??0) - (e.energy??0);
      const preparation = study && s.stats.prep < 95 ? (strategy==='academic'?3.6:3) : .25;
      const reputation = !study && s.stats.reputation < 80 ? 2.8 : .25;
      return (e.prep??0)*preparation + (e.reputation??0)*reputation
        + (e.energy??0)*(s.stats.energy<45?1.5:.25) - (e.stress??0)*(s.stats.stress>58?1.5:.5)
        + (e.morale??0)*(s.stats.morale<45?1:.15) + (e.cash??0)*.002
        + (e.skill??0)*(strategy==='career'?.8:.28);
    };
    const action=hand.find(a=>a.id===id) ?? hand.sort((a,b)=>priority(b)-priority(a))[0];
    if(!action||!takeAction(s,action.id)) throw new Error('Bot could not play a dealt card.');
    validateSave(s);
  }
  if(guard>=600)throw new Error(`Simulation did not terminate: ${seed}`);
  if(s.ending==='graduated'&&(s.grades.length!==8||s.completedCoops!==6||s.week!==4))throw new Error('Graduation progress invariant failed.');
  if(activeJob(s)&&!s.selectedJob)throw new Error('Job invariant failed.');
  return s;
}
function main(){
  const args=process.argv.slice(2),runs=Number(args[args.indexOf('--runs')+1])||300,output=args.includes('--output')?args[args.indexOf('--output')+1]:null;
  const records=[];
  for(let i=0;i<runs;i++){
    const difficulty=(['balanced','cozy','crunch','devil'] as const)[i%4];
    const strategy=(['balanced','academic','career','reckless'] as const)[Math.floor(i/4)%4];
    const p=PROGRAMS[Math.floor(i/16)%PROGRAMS.length];const s=simulate(i+1,p.id,difficulty,strategy);
    records.push({seed:i+1,program:p.id,difficulty,strategy,ending:s.ending,gpa:s.gpa,cash:s.stats.cash,cali:s.caliOffers,recoveries:s.recoveries,terms:s.grades.length,coops:s.completedCoops});
  }
  const data=JSON.stringify({version:1,runs,records},null,2);if(output)writeFileSync(output,data);else console.log(data);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main();
