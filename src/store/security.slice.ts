import type { StateCreator } from 'zustand';

import type { AppState, SecuritySlice } from './types';

export const createSecuritySlice: StateCreator<AppState, [], [], SecuritySlice> = (set) => ({
  isLocked: false,
  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),
});
