import { Stack } from 'expo-router';

export default function AiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="memory" options={{ headerShown: true, title: 'Mémoire IA' }} />
      <Stack.Screen name="notes/index" options={{ headerShown: true, title: 'Notes' }} />
      <Stack.Screen name="notes/[id]" options={{ headerShown: true, title: 'Note' }} />
      <Stack.Screen name="audit" options={{ headerShown: true, title: "Journal d'audit" }} />
    </Stack>
  );
}
