import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../src/i18n';
import { useAppStore } from '../../src/stores/useAppStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { setUiLanguage } = useAppStore();

  const handleLanguageSelect = async (code: string) => {
    await i18n.changeLanguage(code);
    setUiLanguage(code as any);
    router.push('/onboarding/bundesland');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-16">
        <View className="items-center mb-12">
          <Text className="text-4xl font-bold text-primary mb-2">
            Einbürgerungstest
          </Text>
          <Text className="text-lg text-gray-500">
            {t('onboarding.welcome_subtitle')}
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-center gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageSelect(lang.code)}
              className="bg-light border-2 border-gray-200 rounded-2xl px-6 py-4 min-w-[140px] items-center active:bg-secondary/10 active:border-secondary"
              accessibilityRole="button"
              accessibilityLabel={`Select ${lang.name}`}
            >
              <Text className="text-xl font-semibold text-primary">
                {lang.nativeName}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                {lang.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
