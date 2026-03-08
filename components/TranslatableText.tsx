import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getFlashCardByWord,
  isFlashCardSaved,
  removeFlashCard,
  saveFlashCard,
} from '../src/db/repositories/flashCardsRepository';
import {
  findKeywordsInText,
  getEcosiaSearchUrl,
  getKeywordInfo,
  getWikipediaUrl,
  type KeywordEntry,
} from '../src/services/keywordService';
import { translateWord } from '../src/services/translationService';
import TranslateIcon from './TranslateIcon';

interface TranslatableTextProps {
  text: string;
  className?: string;
}

interface WordPopoverState {
  word: string;
  translation: string | null;
  loading: boolean;
  error: string | null;
  keywordInfo: KeywordEntry | null;
}

interface TextSegment {
  text: string;
  isKeyword: boolean;
  term?: string; // original keyword term for lookup
}

function segmentText(text: string): TextSegment[] {
  const matches = findKeywordsInText(text);
  if (matches.length === 0) {
    return [{ text, isKeyword: false }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({ text: text.slice(cursor, match.start), isKeyword: false });
    }
    segments.push({
      text: text.slice(match.start, match.end),
      isKeyword: true,
      term: match.term,
    });
    cursor = match.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isKeyword: false });
  }

  return segments;
}

function renderWords(
  text: string,
  isGerman: boolean,
  isKeyword: boolean,
  onWordPress: (word: string) => void,
  keyOffset: number
) {
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (/^\s+$/.test(part)) {
      return <Text key={keyOffset + index}>{part}</Text>;
    }
    const underlineColor = isKeyword ? '#E63946' : '#3ea5e6';
    return (
      <Text
        key={keyOffset + index}
        onPress={() => onWordPress(part)}
        className="underline-offset-2"
        style={
          !isGerman
            ? {
                textDecorationLine: 'underline',
                textDecorationStyle: 'dotted',
                textDecorationColor: underlineColor,
              }
            : undefined
        }
        accessibilityRole="button"
        accessibilityLabel={`Translate: ${part}`}
      >
        {part}
      </Text>
    );
  });
}

export default function TranslatableText({ text, className }: TranslatableTextProps) {
  const { i18n, t } = useTranslation();
  const [popover, setPopover] = useState<WordPopoverState | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const targetLanguage = i18n.language;
  const isGerman = targetLanguage === 'de';

  const segments = useMemo(() => segmentText(text), [text]);

  // Check if word is saved when modal opens
  useEffect(() => {
    if (popover?.word && !isGerman) {
      isFlashCardSaved(popover.word).then(setIsSaved);
    }
  }, [popover?.word, isGerman]);

  const handleWordPress = useCallback(
    async (word: string) => {
      if (isGerman) return;

      const kwInfo = getKeywordInfo(word);
      setPopover({ word, translation: null, loading: true, error: null, keywordInfo: kwInfo });

      try {
        const result = await translateWord(word, targetLanguage);
        setPopover({
          word,
          translation: result.translatedText,
          loading: false,
          error: null,
          keywordInfo: kwInfo,
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
          keywordInfo: kwInfo,
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

  const handleOpenLink = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  // Build flat list of rendered elements across all segments
  let keyOffset = 0;

  return (
    <View>
      <Text className={className}>
        {segments.map((segment, segIdx) => {
          const elements = renderWords(
            segment.text,
            isGerman,
            segment.isKeyword,
            handleWordPress,
            keyOffset
          );
          keyOffset += segment.text.split(/(\s+)/).length;
          return elements;
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
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-lg font-bold text-primary">
                    {popover.word}
                  </Text>
                  <TranslateIcon size={18} color="#1D3557" />
                </View>
                {popover.loading ? (
                  <Text className="text-gray-500">{t('common.loading')}</Text>
                ) : popover.error ? (
                  <Text className="text-red-500">{popover.error}</Text>
                ) : (
                  <Text className="text-base text-gray-700">
                    {popover.translation}
                  </Text>
                )}

                {/* Learn More links for keywords */}
                {popover.keywordInfo && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
                      {t('translation.learn_more')}
                    </Text>
                    {popover.keywordInfo.wikipedia && (
                      <>
                        <Pressable
                          onPress={() =>
                            handleOpenLink(
                              getWikipediaUrl(popover.keywordInfo!.wikipedia!, 'de')
                            )
                          }
                          className="flex-row items-center gap-2 py-1.5"
                        >
                          <Ionicons name="book-outline" size={16} color="#457B9D" />
                          <Text className="text-secondary text-sm">
                            Wikipedia (DE)
                          </Text>
                          <Ionicons name="open-outline" size={12} color="#9ca3af" />
                        </Pressable>
                        {targetLanguage !== 'de' && (
                          <Pressable
                            onPress={() =>
                              handleOpenLink(
                                getWikipediaUrl(
                                  popover.keywordInfo!.wikipedia!,
                                  targetLanguage
                                )
                              )
                            }
                            className="flex-row items-center gap-2 py-1.5"
                          >
                            <Ionicons name="book-outline" size={16} color="#457B9D" />
                            <Text className="text-secondary text-sm">
                              Wikipedia ({targetLanguage.toUpperCase()})
                            </Text>
                            <Ionicons name="open-outline" size={12} color="#9ca3af" />
                          </Pressable>
                        )}
                      </>
                    )}
                    <Pressable
                      onPress={() =>
                        handleOpenLink(
                          getEcosiaSearchUrl(popover.keywordInfo!.term)
                        )
                      }
                      className="flex-row items-center gap-2 py-1.5"
                    >
                      <Ionicons name="search-outline" size={16} color="#457B9D" />
                      <Text className="text-secondary text-sm">
                        Ecosia
                      </Text>
                      <Ionicons name="open-outline" size={12} color="#9ca3af" />
                    </Pressable>
                  </View>
                )}

                <View className="flex-row gap-2 mt-4">
                  {!isGerman && popover.translation && !isSaved && (
                    <Pressable
                      onPress={handleSaveFlashCard}
                      disabled={saving}
                      className={`flex-1 py-2 rounded-lg items-center justify-center ${
                        saving ? 'bg-primary/50' : 'bg-primary active:bg-primary/80'
                      }`}
                    >
                      <Text className="text-white text-center font-medium">
                        {t('flashcards.save')}
                      </Text>
                    </Pressable>
                  )}
                  {isSaved && (
                    <Pressable
                      onPress={handleRemoveFlashCard}
                      disabled={saving}
                      className={`flex-1 py-2 rounded-lg items-center justify-center ${
                        saving ? 'bg-gray-300' : 'bg-gray-200 active:bg-gray-300'
                      }`}
                    >
                      <Text className="text-gray-700 text-center font-medium">
                        {t('flashcards.remove')}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={dismissPopover}
                    className="flex-1 py-2 rounded-lg bg-gray-100 items-center justify-center active:bg-gray-200"
                  >
                    <Text className="text-gray-600 font-medium">{t('common.close')}</Text>
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
