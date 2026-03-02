import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const MODES = [
  {
    id: 'practice',
    titleKey: 'practice.practice_mode',
    descKey: 'practice.practice_desc',
    icon: '\u270F\uFE0F',
  },
  {
    id: 'exam',
    titleKey: 'practice.exam_mode',
    descKey: 'practice.exam_desc',
    icon: '\u23F1\uFE0F',
  },
  {
    id: 'review',
    titleKey: 'practice.review_mode',
    descKey: 'practice.review_desc',
    icon: '\uD83D\uDD04',
  },
] as const;

export default function PracticeModeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleModeSelect = (mode: string) => {
    router.push({ pathname: '/practice/question', params: { mode } } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-4">
        <Text className="text-base text-gray-500 mb-8">
          {t('practice.choose_mode')}
        </Text>

        <View className="gap-4">
          {MODES.map((mode) => (
            <Pressable
              key={mode.id}
              onPress={() => handleModeSelect(mode.id)}
              className="flex-row items-center p-5 rounded-2xl bg-light border border-gray-100 active:bg-secondary/10"
              accessibilityRole="button"
              accessibilityLabel={t(mode.titleKey)}
            >
              <Text className="text-3xl mr-4">{mode.icon}</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-primary">
                  {t(mode.titleKey)}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {t(mode.descKey)}
                </Text>
              </View>
              <Text className="text-gray-400 text-xl">{'\u203A'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
