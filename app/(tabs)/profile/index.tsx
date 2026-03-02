import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../../src/stores/useAppStore';
import { SUPPORTED_LANGUAGES } from '../../../src/i18n';
import { BUNDESLAENDER } from '../../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { uiLanguage, bundeslandId } = useAppStore();

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === uiLanguage);
  const currentLand = BUNDESLAENDER.find((l) => l.id === bundeslandId);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Current settings summary */}
        <View className="bg-light rounded-2xl p-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-500">{t('settings.language')}</Text>
            <Text className="text-base font-medium text-primary">
              {currentLang?.nativeName || uiLanguage}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-500">{t('settings.bundesland')}</Text>
            <Text className="text-base font-medium text-primary">
              {currentLand?.name || '-'}
            </Text>
          </View>
        </View>

        {/* Settings link */}
        <Pressable
          onPress={() => router.push('/profile/settings' as any)}
          className="flex-row items-center justify-between p-4 rounded-xl bg-gray-50 active:bg-gray-100 mb-3"
          accessibilityRole="button"
        >
          <Text className="text-base font-medium text-gray-800">
            {t('settings.title')}
          </Text>
          <Text className="text-gray-400 text-xl">{'\u203A'}</Text>
        </Pressable>

        {/* About section */}
        <View className="mt-8">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            {t('settings.about')}
          </Text>
          <View className="bg-gray-50 rounded-xl p-4 gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">{t('settings.version')}</Text>
              <Text className="text-sm text-gray-700">1.0.0</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-500">License</Text>
              <Text className="text-sm text-gray-700">MIT</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
