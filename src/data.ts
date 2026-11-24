import type { Action, GameEvent, Job, Program, Term, Upgrade } from './types.ts';
import studios from './studios.json' with { type: 'json' };
import {EXTRA_ACTIONS,EXTRA_EVENTS} from './expansion.ts';

export const PROGRAMS: Program[] = [
  {id:'software',name:'Software Engineering',short:'SE',stream:8,difficulty:3,focus:'Build something people use.',color:'#8dbfb6'},
  {id:'computer',name:'Computer Engineering',short:'CE',stream:'dual',difficulty:3,focus:'From silicon to software.',color:'#a0bfe5'},
  {id:'electrical',name:'Electrical Engineering',short:'EE',stream:'dual',difficulty:3,focus:'Keep the electrons moving.',color:'#e3be7d'},
  {id:'mechanical',name:'Mechanical Engineering',short:'ME',stream:'dual',difficulty:2,focus:'Make it move. Make it last.',color:'#bcada2'},
  {id:'mechatronics',name:'Mechatronics Engineering',short:'TRON',stream:'dual',difficulty:3,focus:'A little bit of everything.',color:'#d59fa3'},
  {id:'biomedical',name:'Biomedical Engineering',short:'BME',stream:8,difficulty:3,focus:'Engineering for human life.',color:'#c9a3d5'},
  {id:'systems',name:'Systems Design Engineering',short:'SYDE',stream:8,difficulty:2,focus:'See the whole system.',color:'#9dc9ae'},
  {id:'chemical',name:'Chemical Engineering',short:'CHE',stream:'dual',difficulty:2,focus:'Small reactions. Big changes.',color:'#e4ab87'},
  {id:'civil',name:'Civil Engineering',short:'CIVE',stream:8,difficulty:2,focus:'Build the world around you.',color:'#adc1cc'},
  {id:'architectural',name:'Architectural Engineering',short:'AE',stream:4,difficulty:2,focus:'Where structures meet people.',color:'#d0b38e'},
  {id:'management',name:'Management Engineering',short:'MGTE',stream:8,difficulty:2,focus:'Make complex systems work.',color:'#b8c598'},
  {id:'geological',name:'Geological Engineering',short:'GEOE',stream:4,difficulty:1,focus:'Start from the ground up.',color:'#c9ae89'},
  {id:'environmental',name:'Environmental Engineering',short:'ENVE',stream:4,difficulty:1,focus:'Design a more livable planet.',color:'#99b998'},
  {id:'nano',name:'Nanotechnology Engineering',short:'NANO',stream:8,difficulty:2,focus:'Think on a smaller scale.',color:'#b3a8ce'},
];
export const FRIENDS = [
  {id:'maya',name:'Maya',role:'Your lab partner',color:'#a5c5b0',description:'Builds robots. Brings snacks. Has your back.', milestones:['A lab partner becomes a friend.','Maya invites you onto her design team.','You promise to be at each other’s ring ceremony.']},
  {id:'leo',name:'Leo',role:'The co-op strategist',color:'#e2bb80',description:'Too many browser tabs. A surprisingly good listener.',milestones:['You trade résumés over coffee.','Leo puts your name forward for an interview.','The group chat survives every time zone.']},
  {id:'sam',name:'Sam',role:'Your residence friend',color:'#b8a7d1',description:'Reminds you that you exist outside your transcript.',milestones:['A late-night walk becomes a weekly thing.','Sam knows when you need a break before you do.','Five years later, this still feels like home.']},
];
export const ACTIONS: Action[] = [
  ...studios.map((card): Action => ({
    ...card, location: card.location === 'e7' ? 'e7' : 'dana', kind: 'study',
    icon: card.location === 'e7' ? 'tool' : 'book',
    effects: card.location === 'e7'
      ? {prep:20,skill:9,energy:-11,stress:4}
      : {prep:18,skill:3,energy:-6,stress:-3},
  })),
  ...EXTRA_ACTIONS,
  {id:'lecture',name:'Go to lecture',description:'Show up, take notes, ask the question.',icon:'book',location:'e7',effects:{prep:12,skill:2,stress:5,energy:-9},kind:'study'},
  {id:'cram',name:'Cram the problem set',description:'Your desk. A deadline. One more integral.',icon:'bolt',location:'e7',effects:{prep:23,stress:18,energy:-22,morale:-6},kind:'study'},
  {id:'lab',name:'Build with Maya',description:'A design team is a good kind of chaos.',icon:'tool',location:'e7',effects:{prep:13,skill:7,stress:9,energy:-13,morale:3},kind:'study',friend:'maya'},
  {id:'office',name:'Office hours',description:'Get unstuck before the exam gets closer.',icon:'chat',location:'e7',effects:{prep:17,stress:-3,energy:-8},kind:'study'},
  {id:'library',name:'Deep work at DC',description:'Headphones on. One thing at a time.',icon:'book',location:'dana',effects:{prep:18,skill:3,stress:8,energy:-13},kind:'study'},
  {id:'interview',name:'Practice interviews',description:'Leo plays interviewer. You try to breathe.',icon:'code',location:'dana',effects:{skill:12,network:3,stress:10,energy:-13},friend:'leo'},
  {id:'project',name:'Ship a side project',description:'Something real for your portfolio.',icon:'code',location:'dana',effects:{skill:16,reputation:5,stress:15,energy:-19,cash:-45}},
  {id:'coffee',name:'Coffee with Leo',description:'Talk co-op, compare notes, decompress.',icon:'cup',location:'plaza',effects:{network:12,morale:12,stress:-13,energy:6,cash:-18},friend:'leo'},
  {id:'lazeez',name:'Lazeez with the group',description:'Extra lines. Extra time with your people.',icon:'food',location:'plaza',effects:{morale:20,stress:-18,energy:12,cash:-24},friend:'maya'},
  {id:'shift',name:'Pick up a café shift',description:'A few hours behind the counter.',icon:'cash',location:'plaza',effects:{cash:340,network:3,stress:8,energy:-17}},
  {id:'engsoc',name:'Hang out at POETS',description:'Find your people at CPH.',icon:'people',location:'plaza',effects:{network:9,morale:18,stress:-15,energy:-5,cash:-12},friend:'sam'},
  {id:'sleep',name:'Actually get some sleep',description:'Yes, the assignment will still be there.',icon:'moon',location:'residence',effects:{energy:42,stress:-24,morale:8,prep:-3}},
  {id:'walk',name:'Walk around campus',description:'Take the long way past the geese.',icon:'leaf',location:'residence',effects:{energy:14,stress:-20,morale:15},friend:'sam'},
  {id:'budget',name:'Meal prep & budget',description:'Future you will appreciate this.',icon:'food',location:'residence',effects:{cash:150,energy:22,stress:-12,morale:8}},
  {id:'counsellor',name:'Ask for support',description:'Make space. Talk it through.',icon:'heart',location:'residence',effects:{stress:-35,morale:25,energy:10}},
  {id:'deliver',name:'Deliver your work',description:'Small commits. Useful engineering.',icon:'tool',location:'work',effects:{reputation:13,skill:7,stress:11,energy:-16},kind:'coop'},
  {id:'mentor',name:'Learn from a mentor',description:'Ask why, then ask how.',icon:'chat',location:'work',effects:{reputation:8,skill:11,network:8,stress:6,energy:-10},kind:'coop'},
  {id:'overtime',name:'Take on a stretch task',description:'High visibility. A longer evening.',icon:'bolt',location:'work',effects:{reputation:22,skill:10,cash:550,stress:23,energy:-26},kind:'coop'},
  {id:'network',name:'Meet the team',description:'There are people behind the job titles.',icon:'people',location:'work',effects:{network:15,reputation:8,morale:10,stress:-8,energy:-5},kind:'coop',friend:'leo'},
];
export const JOBS: Job[] = [
  {id:'research',name:'Campus research assistant',place:'Waterloo, ON',weekly:650,requirement:0,stress:3,cali:false,description:'A supportive lab that always accepts applications.'},
  {id:'local',name:'Junior engineering co-op',place:'Kitchener, ON',weekly:1050,requirement:22,stress:5,cali:false,description:'A local team. Real projects. A shorter commute.'},
  {id:'startup',name:'Product engineering co-op',place:'Toronto, ON',weekly:1550,requirement:42,stress:8,cali:false,description:'More ownership, more moving parts.'},
  {id:'cali',name:'West Coast engineering co-op',place:'California, US',weekly:2200,requirement:65,stress:11,cali:true,description:'The Cali arc. Strong skills and connections help.'},
];
export const UPGRADES: Upgrade[] = [
  {id:'planner',name:'A decent planner',icon:'book',price:180,description:'−2 stress after every action.',effects:{stress:-5}},
  {id:'bike',name:'Secondhand bicycle',icon:'leaf',price:420,description:'+3 energy after every action.',effects:{energy:10}},
  {id:'laptop',name:'Reliable laptop',icon:'code',price:1450,description:'+3 preparation or reputation on productive actions.',effects:{skill:8}},
  {id:'mealplan',name:'Meal prep kit',icon:'food',price:320,description:'Weekly living costs drop by $35.',effects:{energy:8}},
  {id:'headphones',name:'Noise-cancelling headphones',icon:'music',price:260,description:'+3 preparation on study actions.',effects:{morale:6}},
  {id:'plant',name:'A tiny desk plant',icon:'leaf',price:45,description:'+2 morale after every action. A good listener.',effects:{morale:5}},
];
export const ACHIEVEMENTS = [
  {id:'welcome',name:'Welcome to Waterloo',description:'Accept an engineering offer.'},
  {id:'first-term',name:'You belong here',description:'Pass your first study term.'},
  {id:'deans',name:'Dean’s list energy',description:'Earn a term grade of at least 90.'},
  {id:'first-coop',name:'Work term one',description:'Complete your first co-op.'},
  {id:'cali',name:'Cali or …',description:'Complete a California co-op.'},
  {id:'cali2',name:'West Coast regular',description:'Complete two California co-ops.'},
  {id:'friends',name:'Your people',description:'Reach 75 friendship with someone.'},
  {id:'community',name:'It takes a cohort',description:'Reach 50 friendship with all three friends.'},
  {id:'savings',name:'Financial breathing room',description:'Save $20,000.'},
  {id:'perfect',name:'In the zone',description:'Score at least 95 in an assessment.'},
  {id:'collector',name:'A place of your own',description:'Buy all six upgrades.'},
  {id:'comeback',name:'The comeback',description:'Pass a term after an academic strike.'},
  {id:'ring',name:'The iron ring',description:'Finish all eight study terms and six co-ops.'},
  {id:'balanced',name:'Made it as yourself',description:'Graduate with morale ≥65 and stress ≤50.'},
  {id:'dream',name:'The whole journey',description:'Graduate with two Cali co-ops and $20,000.'},
];
export function schedule(stream: 4 | 8): Term[] {
  const study = ['1A','1B','2A','2B','3A','3B','4A','4B'];
  const result: Term[] = []; let coop=0;
  study.forEach((label,i) => {
    result.push({label,kind:'study',number:i+1});
    if ((stream===4 && i<6) || (stream===8 && i>=1 && i<=6)) result.push({label:`Co-op ${++coop}`,kind:'coop',number:coop});
  }); return result;
}

export const EVENTS: GameEvent[] = [
  ...EXTRA_EVENTS,
  {id:'geese',title:'The path belongs to the geese',text:'A goose has established a very firm boundary between you and your next lecture.',place:'Ring Road',icon:'leaf',kind:'study',choices:[{label:'Take the scenic route',description:'A little air does you good.',effects:{stress:-8,energy:-5,morale:6}},{label:'Wait with your classmates',description:'An unexpected conversation.',effects:{network:5,morale:5},friend:'sam'}]},
  {id:'lab-partner',title:'One last bug',text:'Maya’s circuit works. Yours makes an interesting smell. The lab closes in an hour.',place:'E7 design lab',icon:'tool',kind:'study',choices:[{label:'Debug it together',description:'+12 prep · +8 skill · −12 energy',effects:{prep:12,skill:8,energy:-12},friend:'maya'},{label:'Ask the TA for a hint',description:'+8 prep · −6 stress',effects:{prep:8,stress:-6}},{label:'Document what failed',description:'+6 skill · +4 reputation',effects:{skill:6,reputation:4}}]},
  {id:'integrity',title:'A suspiciously familiar solution',text:'The group chat drops a complete lab solution. The deadline is tonight. Your work is still your responsibility.',place:'E7 computer lab',icon:'code',kind:'study',choices:[{label:'Write your own and cite your sources',description:'+12 prep · +6 reputation · −10 energy',effects:{prep:12,reputation:6,energy:-10}},{label:'Ask for an extension',description:'A smaller gain and a calmer evening.',effects:{prep:5,stress:-12}},{label:'Submit without checking',description:'Risk: lose 20 prep and 10 reputation.',effects:{energy:6},risk:{chance:.8,effects:{prep:-20,reputation:-10,stress:15},text:'The submission is returned for an integrity review. You redo it properly.'}}]},
  {id:'midnight',title:'The DC closing-time dilemma',text:'Your notes have stopped making sense. Outside, the last bus is pulling up.',place:'Davis Centre library',icon:'moon',kind:'study',choices:[{label:'Take the bus home',description:'+20 energy · −10 stress',effects:{energy:20,stress:-10}},{label:'One more chapter',description:'+14 prep · +12 stress · −15 energy',effects:{prep:14,stress:12,energy:-15}}]},
  {id:'design-team',title:'Something bigger than the assignment',text:'A student design team needs someone who is willing to learn. Maya saved you a seat.',place:'Engineering student design centre',icon:'tool',kind:'study',choices:[{label:'Join the build',description:'+12 skill · +6 network · −15 energy',effects:{skill:12,network:6,energy:-15},friend:'maya'},{label:'Help for one afternoon',description:'+6 skill · +5 morale',effects:{skill:6,morale:5},friend:'maya'},{label:'Protect your study time',description:'+10 prep · −5 stress',effects:{prep:10,stress:-5}}]},
  {id:'snow',title:'First real Waterloo snow',text:'Campus looks like a postcard. Your shoes were a poor choice.',place:'South Campus',icon:'leaf',kind:'any',choices:[{label:'Hot chocolate with Sam',description:'−$12 · +15 morale · −10 stress',effects:{cash:-12,morale:15,stress:-10},friend:'sam'},{label:'Head straight home',description:'+16 energy',effects:{energy:16}}]},
  {id:'coop-rejection',title:'“We went with another candidate”',text:'The email is polite. It still stings. Leo sends you a résumé review link and a very bad meme.',place:'WaterlooWorks',icon:'chat',kind:'study',choices:[{label:'Review your application together',description:'+10 skill · +8 network · −8 energy',effects:{skill:10,network:8,energy:-8},friend:'leo'},{label:'Take tonight off',description:'+12 morale · −15 stress',effects:{morale:12,stress:-15}},{label:'Apply to five more',description:'+8 network · +10 stress',effects:{network:8,stress:10}}]},
  {id:'bursary',title:'An email worth opening',text:'There is a small student bursary available. The application asks what you have learned this term.',place:'Student awards',icon:'cash',kind:'study',choices:[{label:'Write a thoughtful application',description:'−10 energy · 75% chance of $900',effects:{energy:-10},risk:{chance:.75,effects:{cash:900,morale:8},text:'Your application was successful. A little more room to breathe.'}},{label:'Help a friend apply too',description:'+$350 · +10 network',effects:{cash:350,network:10},friend:'sam'}]},
  {id:'lazeez-lines',title:'How many lines?',text:'The plaza is busy. Someone in your cohort insists the secret to passing calculus is extra sauce.',place:'University Plaza',icon:'food',kind:'any',choices:[{label:'The usual, with friends',description:'−$18 · +15 morale · +8 energy',effects:{cash:-18,morale:15,energy:8},friend:'maya'},{label:'Try the very spicy order',description:'−$20 · +20 morale · risk: −15 energy',effects:{cash:-20,morale:20},risk:{chance:.4,effects:{energy:-15},text:'A memorable meal. A less productive afternoon.'}}]},
  {id:'group-project',title:'The group project group chat',text:'Three people have three different versions of the same file. The presentation is tomorrow.',place:'E5 project room',icon:'people',kind:'study',choices:[{label:'Get everyone on the same page',description:'+12 prep · +8 network · +5 stress',effects:{prep:12,network:8,stress:5}},{label:'Quietly do it all yourself',description:'+18 prep · −22 energy · +15 stress',effects:{prep:18,energy:-22,stress:15}},{label:'Ask Maya to split the work',description:'+10 prep · −5 stress',effects:{prep:10,stress:-5},friend:'maya'}]},
  {id:'poets',title:'An open seat at POETS',text:'A familiar face waves you over. Nobody is talking about grades for once.',place:'Carl Pollock Hall',icon:'people',kind:'study',choices:[{label:'Stay for a while',description:'+15 morale · −12 stress',effects:{morale:15,stress:-12},friend:'sam'},{label:'Say hello, then head to DC',description:'+5 network · +8 prep',effects:{network:5,prep:8}}]},
  {id:'purpling',title:'A very purple afternoon',text:'EngSoc has a charity purpling event. Your calendar is full, but so is the courtyard.',place:'CPH courtyard',icon:'people',kind:'study',choices:[{label:'Join in and donate',description:'−$35 · +18 morale · +8 network',effects:{cash:-35,morale:18,network:8},friend:'sam'},{label:'Volunteer at the table',description:'+10 network · +8 reputation · −8 energy',effects:{network:10,reputation:8,energy:-8}}]},
  {id:'rent',title:'The sublet conversation',text:'Your landlord sends a message about next term. You can negotiate now or find a room with friends.',place:'Residence',icon:'cash',kind:'any',choices:[{label:'Negotiate early',description:'+$280 · +5 stress',effects:{cash:280,stress:5}},{label:'Room with Sam',description:'+$160 · +12 morale',effects:{cash:160,morale:12},friend:'sam'},{label:'Pay for the easy option',description:'−$220 · −15 stress',effects:{cash:-220,stress:-15}}]},
  {id:'laptop-crash',title:'The laptop makes a new noise',text:'Your screen freezes halfway through a project. The autosave timestamp is not reassuring.',place:'Your desk',icon:'code',kind:'any',choices:[{label:'Repair it',description:'−$220 · +8 energy',effects:{cash:-220,energy:8}},{label:'Use a campus computer',description:'+5 skill · −10 energy',effects:{skill:5,energy:-10}},{label:'Ask the cohort for help',description:'+8 network · +5 morale',effects:{network:8,morale:5},friend:'maya'}]},
  {id:'homesick',title:'A familiar voice',text:'You call home intending to ask one question. An hour later, you realize you needed the conversation.',place:'Residence common room',icon:'heart',kind:'any',choices:[{label:'Stay on the call',description:'+18 morale · −12 stress',effects:{morale:18,stress:-12}},{label:'Plan a visit',description:'−$65 · +25 morale',effects:{cash:-65,morale:25}}]},
  {id:'hackathon',title:'A weekend to make something',text:'There is a hackathon on campus. Leo has an idea. Maya has already made a parts list.',place:'E7 atrium',icon:'code',kind:'study',minTerm:2,choices:[{label:'Build with the team',description:'+15 skill · +10 network · −20 energy',effects:{skill:15,network:10,energy:-20,stress:7},friend:'maya'},{label:'Go for the workshops',description:'+9 skill · +5 network',effects:{skill:9,network:5},friend:'leo'},{label:'Use the quiet library',description:'+14 prep · −5 stress',effects:{prep:14,stress:-5}}]},
  {id:'capstone',title:'Your capstone takes shape',text:'The first prototype is on the table. It is imperfect, and it is yours.',place:'E7 design centre',icon:'tool',kind:'study',minTerm:6,choices:[{label:'Test it with real people',description:'+15 prep · +10 reputation · −10 energy',effects:{prep:15,reputation:10,energy:-10},friend:'maya'},{label:'Polish the demo',description:'+18 prep · +7 stress',effects:{prep:18,stress:7}},{label:'Write down what you learned',description:'+12 skill · −8 stress',effects:{skill:12,stress:-8}}]},
  {id:'first-standup',title:'Your first stand-up',text:'Everyone seems to know what they are doing. Your mentor asks how your first task is going.',place:'The office',icon:'chat',kind:'coop',choices:[{label:'Be honest about the blocker',description:'+12 reputation · +8 skill',effects:{reputation:12,skill:8}},{label:'Ask for a pairing session',description:'+14 skill · +6 network · −8 energy',effects:{skill:14,network:6,energy:-8}},{label:'Say it is almost done',description:'+5 stress · risk: −12 reputation',effects:{stress:5},risk:{chance:.65,effects:{reputation:-12,stress:10},text:'The blocker grows. Your mentor reminds you that asking early is part of the job.'}}]},
  {id:'prod',title:'It worked on your machine',text:'A small release causes a very visible bug. Your teammate opens the incident channel.',place:'Engineering office',icon:'bolt',kind:'coop',choices:[{label:'Own it and help roll back',description:'+15 reputation · +8 skill · +8 stress',effects:{reputation:15,skill:8,stress:8}},{label:'Ask your mentor to lead',description:'+8 reputation · +10 skill',effects:{reputation:8,skill:10}},{label:'Write the regression test',description:'+12 reputation · +12 skill · −12 energy',effects:{reputation:12,skill:12,energy:-12}}]},
  {id:'lunch',title:'Someone saves you a seat',text:'The team is heading out for lunch. You almost say you have too much work.',place:'Office kitchen',icon:'food',kind:'coop',choices:[{label:'Go with them',description:'−$22 · +14 network · +10 morale',effects:{cash:-22,network:14,morale:10}},{label:'Invite a teammate for a walk',description:'+10 network · −12 stress',effects:{network:10,stress:-12}}]},
  {id:'scope',title:'“One small extra feature”',text:'The request is reasonable. The deadline is not. Your manager asks what you think.',place:'Project meeting',icon:'tool',kind:'coop',choices:[{label:'Propose a smaller release',description:'+14 reputation · −6 stress',effects:{reputation:14,stress:-6}},{label:'Take it on with support',description:'+18 reputation · −16 energy · +10 stress',effects:{reputation:18,energy:-16,stress:10}},{label:'Explain the tradeoffs',description:'+10 reputation · +8 network',effects:{reputation:10,network:8}}]},
  {id:'referral',title:'A door opens',text:'A teammate knows someone hiring next term. They offer to make an introduction.',place:'Co-op check-in',icon:'people',kind:'coop',choices:[{label:'Send a thoughtful introduction',description:'+18 network · +5 reputation',effects:{network:18,reputation:5},friend:'leo'},{label:'Ask what skills to work on',description:'+15 skill · +8 network',effects:{skill:15,network:8}}]},
  {id:'distance',title:'Different time zones, same group chat',text:'The photo from campus makes you miss the ordinary afternoons. Sam is still awake.',place:'Your sublet',icon:'heart',kind:'coop',choices:[{label:'Call the group',description:'+18 morale · −12 stress',effects:{morale:18,stress:-12},friend:'sam'},{label:'Plan the reunion',description:'−$60 · +22 morale · +5 network',effects:{cash:-60,morale:22,network:5},friend:'maya'}]},
  {id:'demo',title:'Show, then tell',text:'Your mentor offers you five minutes in the team demo. The thing you built finally works.',place:'Team demo',icon:'code',kind:'coop',choices:[{label:'Present it yourself',description:'+18 reputation · +10 network · +8 stress',effects:{reputation:18,network:10,stress:8}},{label:'Present with your mentor',description:'+12 reputation · +8 skill · −5 stress',effects:{reputation:12,skill:8,stress:-5}}]},
  {id:'payday',title:'The first proper paycheque',text:'The deposit lands. Tuition is still real, but this feels like progress.',place:'Your banking app',icon:'cash',kind:'coop',choices:[{label:'Put a little extra aside',description:'+$350 · −5 stress',effects:{cash:350,stress:-5}},{label:'Buy dinner for your friends',description:'−$90 · +20 morale · +10 network',effects:{cash:-90,morale:20,network:10},friend:'sam'}]},
  {id:'review',title:'Feedback that actually helps',text:'Your midterm review has one clear strength and one clear thing to improve. You can work with that.',place:'Manager’s office',icon:'book',kind:'coop',choices:[{label:'Make a plan for next week',description:'+14 reputation · +10 skill',effects:{reputation:14,skill:10}},{label:'Ask for a new challenge',description:'+18 skill · +10 stress · −10 energy',effects:{skill:18,stress:10,energy:-10}}]},
  {id:'rain',title:'A rainy afternoon',text:'The windows are fogged up. For a moment, there is nowhere else you need to be.',place:'Campus café',icon:'cup',kind:'any',choices:[{label:'Sit with it for a while',description:'+12 energy · −12 stress',effects:{energy:12,stress:-12}},{label:'Text Sam to join you',description:'−$8 · +16 morale',effects:{cash:-8,morale:16},friend:'sam'}]},
  {id:'exam-rumor',title:'The exam rumour mill',text:'Someone says the final is all proofs. Someone else says no proofs. Nobody has read the review sheet.',place:'Cohort group chat',icon:'book',kind:'study',choices:[{label:'Read the actual review sheet',description:'+14 prep · −8 stress',effects:{prep:14,stress:-8}},{label:'Organize a review session',description:'+12 prep · +8 network · −8 energy',effects:{prep:12,network:8,energy:-8},friend:'maya'}]},
  {id:'network-night',title:'The room full of name tags',text:'An alumni networking night is underway. You recognize absolutely nobody. Leo waves from the door.',place:'E7 event space',icon:'people',kind:'study',minTerm:3,choices:[{label:'Ask someone about their work',description:'+18 network · +5 stress',effects:{network:18,stress:5},friend:'leo'},{label:'Volunteer to help set up',description:'+10 network · +8 reputation',effects:{network:10,reputation:8}}]},
  {id:'tiny-win',title:'It finally clicks',text:'The concept that made no sense last week suddenly connects to everything else. You draw it three different ways.',place:'Your notebook',icon:'bolt',kind:'study',choices:[{label:'Explain it to your study group',description:'+16 prep · +6 network',effects:{prep:16,network:6},friend:'maya'},{label:'Try a harder problem',description:'+18 prep · +6 skill · −8 energy',effects:{prep:18,skill:6,energy:-8}}]},
];
