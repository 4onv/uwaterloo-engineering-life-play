export type Stat = 'stress' | 'energy' | 'morale' | 'cash' | 'skill' | 'network' | 'prep' | 'reputation';
export type Effects = Partial<Record<Stat, number>>;
export type Location = 'e7' | 'dana' | 'plaza' | 'residence' | 'work';
export type Stage = 'admissions' | 'choice' | 'event' | 'assessment' | 'report' | 'ended';
export interface Program { id: string; name: string; short: string; stream: 4 | 8 | 'dual'; difficulty: number; focus: string; color: string }
export interface Action { program?: string; id: string; name: string; description: string; icon: string; location: Location; effects: Effects; kind?: 'study' | 'coop'; friend?: string; risk?: {chance:number;effects:Effects;text:string}; cost?:number }
export interface EventChoice { label: string; description: string; effects: Effects; risk?: { chance: number; effects: Effects; text: string }; friend?: string }
export interface GameEvent { id: string; title: string; text: string; place: string; icon: string; kind: 'study' | 'coop' | 'any'; minTerm?: number; location?:Location; arrival?:boolean; choices: EventChoice[] }
export interface Term { label: string; kind: 'study' | 'coop'; number: number }
export interface Job { id: string; name: string; place: string; weekly: number; requirement: number; stress: number; cali: boolean; description: string }
export interface Report { title: string; text: string; grade?: number; earned?: number; term: string; score: number }
export interface LogEntry { term: string; text: string; tone: 'good' | 'bad' | 'neutral' }
export interface GameState {
  version: 1; rng: number; name: string; difficulty: 'balanced' | 'cozy' | 'crunch' | 'devil';
  program: string; stream: 4 | 8; grade12: number; admissionRolled: boolean; admissionAttempts: number;
  stage: Stage; termIndex: number; week: number; stats: Record<Stat, number>; gpa: number;
  grades: number[]; coopRatings: number[]; completedCoops: number; caliOffers: number;
  strikes: number; recoveries: number; location: Location; selectedJob: string | null;
  bonusPlayed: boolean; assessmentScore: number | null; pendingEvent: string | null;
  seenEvents: string[]; friends: Record<string, number>; items: string[]; achievements: string[];
  log: LogEntry[]; report: Report | null; ending: string | null; totalActions: number;
  termIncome: number; bestStreak: number; streak: number; createdAt: string;
  dealSeed: number; dealRound: number; previousHand: string[];
  termPressure:number; visitedLocations:Location[]; eventEndsWeek:boolean; campusCondition:'quiet'|'rush'|'storm'|'career-fair'; lastAction:string|null;
}
export interface Upgrade { id: string; name: string; icon: string; price: number; description: string; effects: Effects }
