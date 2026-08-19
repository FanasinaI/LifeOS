import { Stack } from 'expo-router';

export default function MoneyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new-transaction" options={{ presentation: 'modal', headerShown: true, title: 'Nouvelle transaction' }} />
      <Stack.Screen name="budgets" options={{ headerShown: true, title: 'Budgets' }} />
      <Stack.Screen name="debts" options={{ headerShown: true, title: 'Dettes' }} />
      <Stack.Screen name="receivables" options={{ headerShown: true, title: 'Créances' }} />
      <Stack.Screen name="patrimoine" options={{ headerShown: true, title: 'Patrimoine' }} />
    </Stack>
  );
}
