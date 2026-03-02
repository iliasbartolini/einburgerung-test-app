import { View, Text, Pressable, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../src/stores/useAppStore';
import { SUPPORTED_LANGUAGES } from '../../../src/i18n';
import { BUNDESLAENDER } from '../../../src/types';
import { setSetting } from '../../../src/db/repositories/settingsRepository';
import { clearAllAttempts } from '../../../src/db/repositories/attemptsRepository';
import { clearExamHistory } from '../../../src/db/repositories/examRepository';
import { clearTranslationCache, getCacheSize } from '../../../src/db/repositories/translationRepository';
import { getDatabase } from '../../../src/db/database';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { uiLanguage, bundeslandId, setUiLanguage, setBundeslandId } = useAppStore();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showBundeslandPicker, setShowBundeslandPicker] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    getCacheSize().then(setCacheSize);
  }, []);

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    setUiLanguage(code as any);
    await setSetting('ui_language', code);
    setShowLanguagePicker(false);
  };

  const handleBundeslandChange = async (id: number) => {
    setBundeslandId(id);
    await setSetting('bundesland_id', String(id));
    setShowBundeslandPicker(false);
  };

  const handleClearCache = async () => {
    await clearTranslationCache();
    setCacheSize(0);
  };

  const handleResetProgress = () => {
    Alert.alert(
      t('settings.reset_confirm_title'),
      t('settings.reset_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              t('settings.reset_confirm_title'),
              t('settings.reset_confirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.reset'),
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllAttempts();
                    await clearExamHistory();
                    const db = await getDatabase();
                    await db.runAsync('DELETE FROM bookmarks');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === uiLanguage);
  const currentLand = BUNDESLAENDER.find((l) => l.id === bundeslandId);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Language */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          {t('settings.language')}
        </Text>
        <Pressable
          onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-2"
        >
          <Text className="text-base text-gray-800">
            {currentLang?.nativeName} ({currentLang?.name})
          </Text>
          <Text className="text-gray-400">{showLanguagePicker ? '\u25B2' : '\u25BC'}</Text>
        </Pressable>
        {showLanguagePicker && (
          <View className="bg-gray-50 rounded-xl mb-4 overflow-hidden">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => handleLanguageChange(lang.code)}
                className={`p-4 border-b border-gray-100 ${
                  uiLanguage === lang.code ? 'bg-secondary/10' : ''
                }`}
              >
                <Text
                  className={`text-base ${
                    uiLanguage === lang.code ? 'text-primary font-semibold' : 'text-gray-700'
                  }`}
                >
                  {lang.nativeName} - {lang.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Bundesland */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4">
          {t('settings.bundesland')}
        </Text>
        <Pressable
          onPress={() => setShowBundeslandPicker(!showBundeslandPicker)}
          className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-2"
        >
          <Text className="text-base text-gray-800">{currentLand?.name || '-'}</Text>
          <Text className="text-gray-400">{showBundeslandPicker ? '\u25B2' : '\u25BC'}</Text>
        </Pressable>
        {showBundeslandPicker && (
          <View className="bg-gray-50 rounded-xl mb-4 overflow-hidden">
            {BUNDESLAENDER.map((land) => (
              <Pressable
                key={land.id}
                onPress={() => handleBundeslandChange(land.id)}
                className={`p-4 border-b border-gray-100 ${
                  bundeslandId === land.id ? 'bg-secondary/10' : ''
                }`}
              >
                <Text
                  className={`text-base ${
                    bundeslandId === land.id ? 'text-primary font-semibold' : 'text-gray-700'
                  }`}
                >
                  {land.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Translation cache */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
          {t('settings.cache')}
        </Text>
        <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
          <View>
            <Text className="text-base text-gray-800">
              {cacheSize} translations cached
            </Text>
          </View>
          <Pressable
            onPress={handleClearCache}
            className="px-4 py-2 bg-gray-200 rounded-lg active:bg-gray-300"
          >
            <Text className="text-sm text-gray-700">{t('settings.clear_cache')}</Text>
          </Pressable>
        </View>

        {/* Reset progress */}
        <Pressable
          onPress={handleResetProgress}
          className="p-4 bg-red-50 rounded-xl mt-6 items-center active:bg-red-100"
        >
          <Text className="text-base font-semibold text-red-600">
            {t('settings.reset_progress')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
