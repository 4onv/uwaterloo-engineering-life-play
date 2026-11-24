import type { Action, Effects, GameState } from './types.ts';

type Slice = {label: string; text: string; effects: Effects};
type WheelKind = 'weekly' | 'event' | 'travel' | 'shop';
const wheels: Record<WheelKind, Slice[]> = {
  weekly: [
    {label:'Snag', text:'An unexpected delay costs 6 energy.', effects:{energy:-6}},
    {label:'Steady', text:'You carry out the plan as written.', effects:{}},
    {label:'Break', text:'Everything clicks. Gain 5 morale and 4 skill.', effects:{morale:5,skill:4}},
  ],
  event: [
    {label:'Friction', text:'An awkward moment adds 5 stress.', effects:{stress:5}},
    {label:'As planned', text:'Your choice plays out as planned.', effects:{}},
    {label:'Ally', text:'Someone backs you up. Gain 6 connections.', effects:{network:6}},
  ],
  travel: [
    {label:'Crowd', text:'A crowd at the doors adds 3 stress.', effects:{stress:3}},
    {label:'Clear', text:'The route is clear.', effects:{}},
    {label:'Friend', text:'A familiar face along the way lifts morale by 5.', effects:{morale:5}},
  ],
  shop: [
    {label:'Queue', text:'A long checkout line costs 3 energy.', effects:{energy:-3}},
    {label:'List price', text:'You pay the listed price.', effects:{}},
    {label:'Rebate', text:'A student rebate puts $40 back in your pocket.', effects:{cash:40}},
  ],
};
export interface DecisionSpin {labels: string[]; weights: number[]; selected: number; result: string}
export type Reveal = (spin: DecisionSpin) => void;

export function decisionOutcome(kind: WheelKind, difficulty: GameState['difficulty'], draw: number) {
  const weights = difficulty === 'devil' ? [.45,.45,.10] : [.25,.50,.25];
  const selected = draw < weights[0] ? 0 : draw < weights[0]+weights[1] ? 1 : 2;
  const slices = wheels[kind];
  return {effects:slices[selected].effects, spin:{
    labels:slices.map(slice => slice.label), weights, selected, result:slices[selected].text,
  }};
}

// Exclude the previous hand, then shuffle using a seed specific to this draw.
// Reading the board (including after a reload) never consumes the campaign RNG.
export function deal(pool: Action[], state: GameState) {
  const count = Math.min(3, Math.max(1, Math.floor(pool.length / 2)));
  let seed = (state.dealSeed ^ Math.imul(state.termIndex + 1, 0x9e3779b1) ^ Math.imul(state.dealRound + 1, 0x85ebca6b) ^ state.location.charCodeAt(0)) >>> 0;
  const deck = pool.filter(card => !state.previousHand.includes(card.id));
  for (let i = deck.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((seed / 0x100000000) * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}
