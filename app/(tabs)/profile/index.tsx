import { View, Text, Pressable, ScrollView, Modal, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../../src/stores/useAppStore';
import { SUPPORTED_LANGUAGES } from '../../../src/i18n';
import { BUNDESLAENDER } from '../../../src/types';
import { setSetting } from '../../../src/db/repositories/settingsRepository';
import { clearAllAttempts } from '../../../src/db/repositories/attemptsRepository';
import { clearExamHistory } from '../../../src/db/repositories/examRepository';
import { clearTranslationCache, getCacheSize } from '../../../src/db/repositories/translationRepository';
import { clearAllBookmarks } from '../../../src/db/repositories/bookmarksRepository';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { uiLanguage, bundeslandId, setUiLanguage, setBundeslandId } = useAppStore();

  const [draftLanguage, setDraftLanguage] = useState(uiLanguage);
  const [draftBundeslandId, setDraftBundeslandId] = useState(bundeslandId);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showBundeslandPicker, setShowBundeslandPicker] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    getCacheSize().then(setCacheSize);
  }, []);

  const hasChanges = draftLanguage !== uiLanguage || draftBundeslandId !== bundeslandId;

  const handleSave = async () => {
    if (draftLanguage !== uiLanguage) {
      await i18n.changeLanguage(draftLanguage);
      setUiLanguage(draftLanguage as any);
      await setSetting('ui_language', draftLanguage);
    }
    if (draftBundeslandId !== bundeslandId && draftBundeslandId != null) {
      setBundeslandId(draftBundeslandId);
      await setSetting('bundesland_id', String(draftBundeslandId));
    }
  };

  const handleClearCache = async () => {
    await clearTranslationCache();
    setCacheSize(0);
  };

  const handleDeleteProgress = async () => {
    await clearAllAttempts();
    await clearExamHistory();
    await clearAllBookmarks();
    setShowDeleteModal(false);
  };

  const currentDraftLang = SUPPORTED_LANGUAGES.find((l) => l.code === draftLanguage);
  const currentDraftLand = BUNDESLAENDER.find((l) => l.id === draftBundeslandId);

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
            {currentDraftLang?.nativeName} ({currentDraftLang?.name})
          </Text>
          <Ionicons name={showLanguagePicker ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
        </Pressable>
        {showLanguagePicker && (
          <View className="bg-gray-50 rounded-xl mb-4 overflow-hidden">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => {
                  setDraftLanguage(lang.code);
                  setShowLanguagePicker(false);
                }}
                className={`p-4 border-b border-gray-100 ${
                  draftLanguage === lang.code ? 'bg-secondary/10' : ''
                }`}
              >
                <Text
                  className={`text-base ${
                    draftLanguage === lang.code ? 'text-primary font-semibold' : 'text-gray-700'
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
          <Text className="text-base text-gray-800">{currentDraftLand?.name || '-'}</Text>
          <Ionicons name={showBundeslandPicker ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
        </Pressable>
        {showBundeslandPicker && (
          <View className="bg-gray-50 rounded-xl mb-4 overflow-hidden">
            {BUNDESLAENDER.map((land) => (
              <Pressable
                key={land.id}
                onPress={() => {
                  setDraftBundeslandId(land.id);
                  setShowBundeslandPicker(false);
                }}
                className={`p-4 border-b border-gray-100 ${
                  draftBundeslandId === land.id ? 'bg-secondary/10' : ''
                }`}
              >
                <Text
                  className={`text-base ${
                    draftBundeslandId === land.id ? 'text-primary font-semibold' : 'text-gray-700'
                  }`}
                >
                  {land.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          disabled={!hasChanges}
          className={`p-4 rounded-xl mt-4 items-center ${
            hasChanges ? 'bg-primary active:bg-primary/80' : 'bg-gray-300'
          }`}
        >
          <Text className={`text-base font-semibold ${hasChanges ? 'text-white' : 'text-gray-500'}`}>
            {t('settings.save')}
          </Text>
        </Pressable>

        {/* Translation cache */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">
          {t('settings.cache')}
        </Text>
        <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
          <View>
            <Text className="text-base text-gray-800">
              {t('settings.translations_cached', { count: cacheSize })}
            </Text>
          </View>
          <Pressable
            onPress={handleClearCache}
            className="px-4 py-2 bg-gray-200 rounded-lg active:bg-gray-300"
          >
            <Text className="text-sm text-gray-700">{t('settings.clear_cache')}</Text>
          </Pressable>
        </View>

        {/* Delete all progress */}
        <Pressable
          onPress={() => setShowDeleteModal(true)}
          className="p-4 bg-red-50 rounded-xl mt-4 items-center active:bg-red-100"
        >
          <Text className="text-base font-semibold text-red-600">
            {t('settings.delete_progress')}
          </Text>
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
              <Text className="text-sm text-gray-500">{t('settings.license')}</Text>
              <Text className="text-sm text-gray-700">MIT</Text>
            </View>
            <Pressable
              className="flex-row justify-between"
              onPress={() => {
                const url = 'https://github.com/iliasbartolini/einburgerung-test-app';
                if (Platform.OS === 'web') {
                  window.open(url, '_blank');
                } else {
                  Linking.openURL(url);
                }
              }}
            >
              <Text className="text-sm text-gray-500">{t('settings.source_code')}</Text>
              <Text className="text-sm text-secondary">GitHub <Ionicons name="open-outline" size={12} color="#457B9D" /></Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={() => setShowDeleteModal(false)}>
          <Pressable className="bg-white rounded-2xl p-5 mx-8 w-72 shadow-lg" onPress={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-gray-900 mb-2">
              {t('settings.delete_confirm_title')}
            </Text>
            <Text className="text-base text-gray-600 mb-5">
              {t('settings.delete_confirm')}
            </Text>
            <View className="gap-3">
              <Pressable
                onPress={handleDeleteProgress}
                className="p-3 bg-accent rounded-xl items-center active:bg-accent/80"
              >
                <Text className="text-base font-semibold text-white">
                  {t('settings.delete')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                className="p-3 bg-gray-100 rounded-xl items-center active:bg-gray-200"
              >
                <Text className="text-base font-semibold text-gray-700">
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
