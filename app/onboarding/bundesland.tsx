import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAppStore } from '../../src/stores/useAppStore';
import { setSetting } from '../../src/db/repositories/settingsRepository';
import { BUNDESLAENDER } from '../../src/types';

export default function BundeslandScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { uiLanguage, setBundeslandId, setOnboarded } = useAppStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleContinue = async () => {
    if (selectedId === null) return;
    await setSetting('ui_language', uiLanguage);
    await setSetting('bundesland_id', String(selectedId));
    setBundeslandId(selectedId);
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-primary mb-2">
          {t('onboarding.select_bundesland')}
        </Text>
        <Text className="text-base text-gray-500 mb-6">
          {t('onboarding.bundesland_subtitle')}
        </Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="gap-2 pb-4">
            {BUNDESLAENDER.map((land) => (
              <Pressable
                key={land.id}
                onPress={() => setSelectedId(land.id)}
                className={`flex-row items-center px-4 py-4 rounded-xl border-2 ${
                  selectedId === land.id
                    ? 'border-secondary bg-secondary/10'
                    : 'border-gray-200 bg-white'
                }`}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedId === land.id }}
                accessibilityLabel={land.name}
              >
                <View className="flex-1">
                  <Text
                    className={`text-lg font-medium ${
                      selectedId === land.id ? 'text-primary' : 'text-gray-800'
                    }`}
                  >
                    {land.name}
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    selectedId === land.id
                      ? 'border-secondary'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedId === land.id && (
                    <View className="w-3.5 h-3.5 rounded-full bg-secondary" />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View className="py-4">
          <Pressable
            onPress={handleContinue}
            disabled={selectedId === null}
            className={`py-4 rounded-xl items-center ${
              selectedId !== null
                ? 'bg-primary active:bg-primary/80'
                : 'bg-gray-300'
            }`}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.continue')}
          >
            <Text
              className={`text-lg font-semibold ${
                selectedId !== null ? 'text-white' : 'text-gray-500'
              }`}
            >
              {t('onboarding.continue')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
