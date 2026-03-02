import { Stack } from 'expo-router';

export default function PracticeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Practice' }} />
      <Stack.Screen name="question" options={{ title: 'Question' }} />
      <Stack.Screen name="results" options={{ title: 'Results' }} />
    </Stack>
  );
}
