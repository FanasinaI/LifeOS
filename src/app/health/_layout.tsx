import { Stack } from 'expo-router';

export default function HealthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sport" options={{ headerShown: true, title: 'Sport' }} />
      <Stack.Screen name="nutrition" options={{ headerShown: true, title: 'Nutrition' }} />
    </Stack>
  );
}
