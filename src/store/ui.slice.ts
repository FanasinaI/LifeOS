import type { StateCreator } from 'zustand';

import type { AppState, UISlice } from './types';

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  activeAccountId: null,
  setActiveAccountId: (id) => set({ activeAccountId: id }),
  primaryCurrency: 'MGA',
  setPrimaryCurrency: (currency) => set({ primaryCurrency: currency }),
});
