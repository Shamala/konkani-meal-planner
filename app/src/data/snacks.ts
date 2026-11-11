import type { Snack1Entry, Snack2Entry } from '../model/types';
import snack1Json from './snack1.json';
import snack2Json from './snack2.json';

/** The 60 authored Snack 1 entries (SNACK-LIBRARY.md 1). Generated from that file; do not hand-edit. */
export const SNACK1: Snack1Entry[] = snack1Json as Snack1Entry[];
/** The 12 authored Snack 2 additions (SNACK-LIBRARY.md 2.2). */
export const SNACK2_AUTHORED: Snack2Entry[] = snack2Json as Snack2Entry[];
