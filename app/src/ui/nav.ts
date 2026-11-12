import type { ISODate, Slot } from '../model/types';

export type Origin = 'today' | 'week' | 'search';
export interface PlanRef { date: ISODate; slot: Slot; index: number }
/** Open the Dish screen. `plan` is present only when the dish was opened from a plan. */
export type OpenDish = (id: string, origin: Origin, plan?: PlanRef) => void;
