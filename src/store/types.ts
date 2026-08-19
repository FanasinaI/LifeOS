export interface UISlice {
  activeAccountId: number | null;
  setActiveAccountId: (id: number | null) => void;
  primaryCurrency: string;
  setPrimaryCurrency: (currency: string) => void;
}

export interface SecuritySlice {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

/** An AI-proposed write, held here until the user explicitly confirms it (règle absolue du CDC). */
export interface PendingAiAction {
  toolName: string;
  args: Record<string, unknown>;
  description: string;
}

export interface AISlice {
  activeSessionId: number | null;
  isGenerating: boolean;
  pendingAction: PendingAiAction | null;
  setActiveSessionId: (id: number | null) => void;
  setGenerating: (value: boolean) => void;
  setPendingAction: (action: PendingAiAction | null) => void;
}

export type AppState = UISlice & SecuritySlice & AISlice;
