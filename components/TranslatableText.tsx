import { View, Text, Pressable, Modal } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateWord } from '../src/services/translationService';
import {
  isFlashCardSaved,
  saveFlashCard,
  removeFlashCard,
  getFlashCardByWord,
} from '../src/db/repositories/flashCardsRepository';

interface TranslatableTextProps {
  text: string;
  className?: string;
}

interface WordPopoverState {
  word: string;
  translation: string | null;
  loading: boolean;
  error: string | null;
}

export default function TranslatableText({ text, className }: TranslatableTextProps) {
  const { i18n, t } = useTranslation();
  const [popover, setPopover] = useState<WordPopoverState | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const targetLanguage = i18n.language;
  const isGerman = targetLanguage === 'de';

  // Check if word is saved when modal opens
  useEffect(() => {
    if (popover?.word && !isGerman) {
      isFlashCardSaved(popover.word).then(setIsSaved);
    }
  }, [popover?.word, isGerman]);

  const handleWordPress = useCallback(
    async (word: string) => {
      if (isGerman) return;

      setPopover({ word, translation: null, loading: true, error: null });

      try {
        const result = await translateWord(word, targetLanguage);
        setPopover({
          word,
          translation: result.translatedText,
          loading: false,
          error: null,
        });
      } catch (error: any) {
        const errorKey =
          error.message === 'TRANSLATION_OFFLINE'
            ? 'translation.translation_unavailable'
            : 'common.error';
        setPopover({
          word,
          translation: null,
          loading: false,
          error: t(errorKey),
        });
      }
    },
    [targetLanguage, isGerman, t]
  );

  const dismissPopover = () => setPopover(null);

  const handleSaveFlashCard = useCallback(async () => {
    if (!popover?.word || !popover?.translation) return;
    try {
      setSaving(true);
      await saveFlashCard(popover.word, popover.translation, targetLanguage);
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save flash card:', error);
    } finally {
      setSaving(false);
    }
  }, [popover, targetLanguage]);

  const handleRemoveFlashCard = useCallback(async () => {
    if (!popover?.word) return;
    try {
      setSaving(true);
      const card = await getFlashCardByWord(popover.word);
      if (card) {
        await removeFlashCard(card.id);
        setIsSaved(false);
      }
    } catch (error) {
      console.error('Failed to remove flash card:', error);
    } finally {
      setSaving(false);
    }
  }, [popover]);

  // Split text into words preserving whitespace
  const parts = text.split(/(\s+)/);

  return (
    <View>
      <Text className={className}>
        {parts.map((part, index) => {
          if (/^\s+$/.test(part)) {
            return <Text key={index}>{part}</Text>;
          }
          return (
            <Text
              key={index}
              onPress={() => handleWordPress(part)}
              className="underline-offset-2"
              style={!isGerman ? { textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: '#ccc' } : undefined}
              accessibilityRole="button"
              accessibilityLabel={`Translate: ${part}`}
            >
              {part}
            </Text>
          );
        })}
      </Text>

      {/* Word Translation Popover */}
      <Modal
        visible={!!popover}
        transparent
        animationType="fade"
        onRequestClose={dismissPopover}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/30"
          onPress={dismissPopover}
        >
          <Pressable
            className="bg-white rounded-2xl p-5 mx-8 w-72 shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            {popover && (
              <>
                <Text className="text-lg font-bold text-primary mb-1">
                  {popover.word}
                </Text>
                {popover.loading ? (
                  <Text className="text-gray-500">{t('common.loading')}</Text>
                ) : popover.error ? (
                  <Text className="text-red-500">{popover.error}</Text>
                ) : (
                  <Text className="text-base text-gray-700">
                    {popover.translation}
                  </Text>
                )}
                <View className="flex-row gap-2 mt-4">
                  {!isGerman && popover.translation && !isSaved && (
                    <Pressable
                      onPress={handleSaveFlashCard}
                      disabled={saving}
                      className={`flex-1 py-2 rounded-lg items-center ${
                        saving ? 'bg-primary/50' : 'bg-primary active:bg-primary/80'
                      }`}
                    >
                      <Text className="text-white font-medium">
                        {t('flashcards.save')}
                      </Text>
                    </Pressable>
                  )}
                  {isSaved && (
                    <Pressable
                      onPress={handleRemoveFlashCard}
                      disabled={saving}
                      className={`flex-1 py-2 rounded-lg items-center ${
                        saving ? 'bg-gray-300' : 'bg-gray-200 active:bg-gray-300'
                      }`}
                    >
                      <Text className="text-gray-700 font-medium">
                        {t('flashcards.remove')}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={dismissPopover}
                    className="flex-1 py-2 rounded-lg bg-gray-100 items-center active:bg-gray-200"
                  >
                    <Text className="text-gray-600 font-medium">{t('common.ok')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
