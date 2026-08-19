import { Stack } from 'expo-router';

export default function LifeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="goals" options={{ headerShown: true, title: 'Objectifs' }} />
      <Stack.Screen name="calendar" options={{ headerShown: true, title: 'Calendrier' }} />
      <Stack.Screen name="time-tracking" options={{ headerShown: true, title: 'Time Tracking' }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
    </Stack>
  );
}
