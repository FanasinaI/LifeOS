import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { requestNotificationPermissions } from '@/modules/notifications';
import { createAccount, createBudget, createCategory, createTransaction, type AccountType } from '@/modules/finance';
import { createGoal } from '@/modules/goals';
import { markOnboardingComplete, setPrimaryCurrency } from '@/modules/onboarding';
import { setBiometricEnabled, setPin } from '@/security/secure-store';
import { useAppStore } from '@/store';
import { endOfMonth, startOfMonth } from '@/utils/date';

const STEPS = [
  'welcome',
  'currency',
  'accounts',
  'income',
  'goals',
  'budget',
  'security',
  'notifications',
  'ai',
  'done',
] as const;

const CURRENCIES = ['MGA', 'USD', 'EUR', 'GBP'];
const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank', label: 'Banque' },
  { value: 'mvola', label: 'Mvola' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'orange_money', label: 'Orange Money' },
];

export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const setStorePrimaryCurrency = useAppStore((s) => s.setPrimaryCurrency);

  const [currency, setCurrency] = useState('MGA');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [accountCount, setAccountCount] = useState(0);
  const [firstAccountId, setFirstAccountId] = useState<number | null>(null);

  const [incomeAmount, setIncomeAmount] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [pin, setPinValue] = useState('');
  const [busy, setBusy] = useState(false);

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  async function handleCurrencyNext() {
    await setPrimaryCurrency(currency);
    setStorePrimaryCurrency(currency);
    goNext();
  }

  async function handleAddAccount() {
    if (!accountName.trim()) return;
    setBusy(true);
    try {
      const account = await createAccount({ name: accountName.trim(), type: accountType, currency });
      if (!firstAccountId) setFirstAccountId(account.id);
      setAccountCount((c) => c + 1);
      setAccountName('');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddIncome() {
    const parsed = Number(incomeAmount.replace(',', '.'));
    if (!firstAccountId || !Number.isFinite(parsed) || parsed <= 0) return goNext();
    setBusy(true);
    try {
      await createTransaction({
        accountId: firstAccountId,
        type: 'income',
        amount: parsed,
        currency,
        date: new Date(),
        note: 'Revenu initial (onboarding)',
      });
      goNext();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddGoal() {
    if (!goalTitle.trim()) return goNext();
    setBusy(true);
    try {
      await createGoal({ title: goalTitle.trim(), domain: 'personal', currency });
      goNext();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddBudget() {
    const parsed = Number(budgetAmount.replace(',', '.'));
    if (!budgetCategory.trim() || !Number.isFinite(parsed) || parsed <= 0) return goNext();
    setBusy(true);
    try {
      const category = await createCategory({ name: budgetCategory.trim(), kind: 'expense' });
      const now = new Date();
      await createBudget({
        categoryId: category.id,
        period: 'monthly',
        periodStart: startOfMonth(now),
        periodEnd: endOfMonth(now),
        amount: parsed,
      });
      goNext();
    } finally {
      setBusy(false);
    }
  }

  async function handleSetSecurity() {
    if (pin.trim().length >= 4) {
      setBusy(true);
      try {
        await setPin(pin.trim());
        await setBiometricEnabled(true);
      } finally {
        setBusy(false);
      }
    }
    goNext();
  }

  async function handleEnableNotifications() {
    setBusy(true);
    try {
      await requestNotificationPermissions();
    } finally {
      setBusy(false);
      goNext();
    }
  }

  async function handleFinish() {
    await markOnboardingComplete();
    onDone();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {step === 'welcome' && (
          <>
            <ThemedText type="title">Bienvenue sur LifeOS</ThemedText>
            <ThemedText themeColor="textSecondary">
              Un système personnel offline qui centralise finance, organisation et santé — sans
              compte, sans cloud obligatoire, sans connexion requise.
            </ThemedText>
            <PrimaryButton label="Commencer" onPress={goNext} />
          </>
        )}

        {step === 'currency' && (
          <>
            <ThemedText type="subtitle">Devise principale</ThemedText>
            <ChipRow>
              {CURRENCIES.map((c) => (
                <Chip key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} />
              ))}
            </ChipRow>
            <PrimaryButton label="Suivant" onPress={handleCurrencyNext} />
          </>
        )}

        {step === 'accounts' && (
          <>
            <ThemedText type="subtitle">Tes comptes</ThemedText>
            <ThemedText themeColor="textSecondary">
              Ajoute au moins un compte (espèces, banque, mobile money…). {accountCount} ajouté(s).
            </ThemedText>
            <ChipRow>
              {ACCOUNT_TYPES.map((t) => (
                <Chip key={t.value} label={t.label} selected={accountType === t.value} onPress={() => setAccountType(t.value)} />
              ))}
            </ChipRow>
            <TextField value={accountName} onChangeText={setAccountName} placeholder="Nom du compte" />
            <PrimaryButton label="Ajouter" onPress={handleAddAccount} disabled={busy} />
            <PrimaryButton label="Suivant" onPress={goNext} disabled={accountCount === 0} />
          </>
        )}

        {step === 'income' && (
          <>
            <ThemedText type="subtitle">Revenu de départ (optionnel)</ThemedText>
            <TextField
              value={incomeAmount}
              onChangeText={setIncomeAmount}
              placeholder="Montant"
              keyboardType="decimal-pad"
            />
            <PrimaryButton label="Suivant" onPress={handleAddIncome} disabled={busy} />
          </>
        )}

        {step === 'goals' && (
          <>
            <ThemedText type="subtitle">Un premier objectif (optionnel)</ThemedText>
            <TextField value={goalTitle} onChangeText={setGoalTitle} placeholder="Ex: Fonds d'urgence" />
            <PrimaryButton label="Suivant" onPress={handleAddGoal} disabled={busy} />
          </>
        )}

        {step === 'budget' && (
          <>
            <ThemedText type="subtitle">Un premier budget mensuel (optionnel)</ThemedText>
            <TextField value={budgetCategory} onChangeText={setBudgetCategory} placeholder="Catégorie (ex: Nourriture)" />
            <TextField value={budgetAmount} onChangeText={setBudgetAmount} placeholder="Montant" keyboardType="decimal-pad" />
            <PrimaryButton label="Suivant" onPress={handleAddBudget} disabled={busy} />
          </>
        )}

        {step === 'security' && (
          <>
            <ThemedText type="subtitle">Sécurité (optionnel)</ThemedText>
            <ThemedText themeColor="textSecondary">
              Un code PIN d&apos;au moins 4 chiffres verrouille l&apos;app. Laisse vide pour configurer plus tard.
            </ThemedText>
            <TextField
              value={pin}
              onChangeText={setPinValue}
              placeholder="Code PIN"
              keyboardType="number-pad"
              secureTextEntry
            />
            <PrimaryButton label="Suivant" onPress={handleSetSecurity} disabled={busy} />
          </>
        )}

        {step === 'notifications' && (
          <>
            <ThemedText type="subtitle">Notifications</ThemedText>
            <ThemedText themeColor="textSecondary">
              Autorise les notifications locales pour les alertes budget/objectifs/habitudes.
            </ThemedText>
            <PrimaryButton label="Autoriser" onPress={handleEnableNotifications} disabled={busy} />
            <PrimaryButton label="Passer" onPress={goNext} />
          </>
        )}

        {step === 'ai' && (
          <>
            <ThemedText type="subtitle">IA locale (facultative)</ThemedText>
            <ThemedText themeColor="textSecondary">
              LifeOS fonctionne entièrement sans IA. Si tu installes un modèle plus tard, il tourne
              100% sur l&apos;appareil — aucune donnée ne part jamais en ligne.
            </ThemedText>
            <PrimaryButton label="Suivant" onPress={goNext} />
          </>
        )}

        {step === 'done' && (
          <>
            <ThemedText type="title">Prêt !</ThemedText>
            <ThemedText themeColor="textSecondary">Tout peut être ajusté plus tard dans l&apos;app.</ThemedText>
            <PrimaryButton label="Terminer" onPress={handleFinish} />
          </>
        )}

        <ThemedView style={styles.progress}>
          <ThemedText type="small" themeColor="textSecondary">
            Étape {stepIndex + 1} / {STEPS.length}
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  progress: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
