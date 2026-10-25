import { diffDays } from './date';
import type { PetState, SyncState } from './model';

export const STAGES = [
  { id: 0 as const, name: '幼桃期', minDays: 0, desc: '软软的小桃子，需要每天陪伴' },
  { id: 1 as const, name: '少年桃', minDays: 14, desc: '长高了一点，会戴更多饰品了' },
  { id: 2 as const, name: '大桃', minDays: 42, desc: '圆滚滚的守护桃，为你骄傲' },
];

export function stageFromFedDays(fedDays: number): 0 | 1 | 2 {
  if (fedDays >= 42) return 2;
  if (fedDays >= 14) return 1;
  return 0;
}

export function stageInfo(stage: 0 | 1 | 2) {
  return STAGES[stage];
}

export function nextStage(stage: 0 | 1 | 2) {
  return stage < 2 ? STAGES[stage + 1] : null;
}

export function decayPet(pet: PetState, date: string): PetState {
  if (!pet.lastDecayDate) {
    return { ...pet, lastDecayDate: date };
  }
  const elapsed = diffDays(date, pet.lastDecayDate);
  if (elapsed <= 0) {
    return pet.lastDecayDate === date ? pet : { ...pet, lastDecayDate: date };
  }
  const satiety = Math.max(0, pet.satiety - elapsed * 15);
  return { ...pet, satiety, lastDecayDate: date };
}

export function applyFeed(pet: PetState, date: string, kind: 'food' | 'meal'): PetState {
  const gain = kind === 'food' ? 10 : 30;
  const fedDays = pet.lastFedDate === date ? pet.fedDays : pet.fedDays + 1;
  return {
    ...pet,
    satiety: Math.min(100, pet.satiety + gain),
    fedDays,
    stage: stageFromFedDays(fedDays),
    lastFedDate: date,
  };
}

export type PetMood = 'happy' | 'hungry' | 'sad' | 'normal';

export function petMood(state: SyncState, date: string, hour: number): PetMood {
  const log = state.dailyLogs[date];
  const plan = state.dailyPlans[date];
  const pending = Boolean(plan && plan.tasks.length > 0 && (!log || log.done.length < plan.tasks.length));
  if (state.pet.satiety < 30) return 'hungry';
  if (pending && hour >= state.settings.deadlineHour) return 'sad';
  if (state.pet.lastFedDate === date || (log?.allDone && plan?.tasks.length)) return 'happy';
  return 'normal';
}

export function moodLine(mood: PetMood, nickname: string): string {
  if (mood === 'hungry') return '肚子咕咕叫，完成今天的任务就能换桃粮啦。';
  if (mood === 'sad') return '今天还差一点点，明天我们早点开始，好吗？';
  if (mood === 'happy') return `今天和你一起学习，真开心，${nickname}。`;
  return '我在这里陪你，一点一点把今天学扎实。';
}
