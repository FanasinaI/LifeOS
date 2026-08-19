import type { StateCreator } from 'zustand';

import type { AISlice, AppState } from './types';

export const createAiSlice: StateCreator<AppState, [], [], AISlice> = (set) => ({
  activeSessionId: null,
  isGenerating: false,
  pendingAction: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setGenerating: (value) => set({ isGenerating: value }),
  setPendingAction: (action) => set({ pendingAction: action }),
});
