import '../global.css';
import '../src/i18n';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useAppStore } from '../src/stores/useAppStore';
import { initDatabase, seedQuestions } from '../src/db/database';
import questionsData from '../assets/data/questions.json';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isOnboarded, isDbReady, setDbReady, setOnboarded, setUiLanguage, setBundeslandId } =
    useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Initialize database
  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        await seedQuestions(questionsData as any);
        setDbReady(true);
      } catch (e) {
        console.error('Failed to initialize database:', e);
      }
    }
    init();
  }, []);

  // Load user settings from DB once ready
  useEffect(() => {
    if (!isDbReady) return;
    async function loadSettings() {
      const { getDatabase } = await import('../src/db/database');
      const db = await getDatabase();
      const langRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'ui_language'"
      );
      const landRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM user_settings WHERE key = 'bundesland_id'"
      );
      if (langRow && landRow) {
        setUiLanguage(langRow.value as any);
        setBundeslandId(parseInt(landRow.value, 10));
        setOnboarded(true);
        const i18n = (await import('../src/i18n')).default;
        await i18n.changeLanguage(langRow.value);
      }
    }
    loadSettings();
  }, [isDbReady]);

  useEffect(() => {
    if (loaded && isDbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isDbReady]);

  // Redirect based on onboarding state
  useEffect(() => {
    if (!loaded || !isDbReady) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!isOnboarded && !inOnboarding) {
      router.replace('/onboarding/welcome');
    } else if (isOnboarded && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isOnboarded, segments, loaded, isDbReady]);

  if (!loaded || !isDbReady) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
