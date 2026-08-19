import { create } from 'zustand';

import { createAiSlice } from './ai.slice';
import { createSecuritySlice } from './security.slice';
import type { AppState } from './types';
import { createUISlice } from './ui.slice';

/**
 * Ephemeral, in-memory UI state only — active account, current session, lock flag. SQLite via
 * the repositories is always the source of truth; nothing durable belongs in this store.
 */
export const useAppStore = create<AppState>()((...args) => ({
  ...createUISlice(...args),
  ...createSecuritySlice(...args),
  ...createAiSlice(...args),
}));

export type { AISlice, AppState, PendingAiAction, SecuritySlice, UISlice } from './types';
