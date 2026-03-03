import { View, Text, Pressable, SafeAreaView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import {
  getFlashCardsForReview,
  recordFlashCardReview,
  removeFlashCard,
} from '../../../src/db/repositories/flashCardsRepository';
import type { FlashCard } from '../../../src/types';

export default function FlashCardsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const targetLanguage = i18n.language;

  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await getFlashCardsForReview(targetLanguage);
      setCards(loaded);
    } catch (e) {
      console.error('Failed to load flash cards:', e);
    }
    setLoading(false);
  }, [targetLanguage]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentCard) return;

    try {
      await recordFlashCardReview(currentCard.id, isCorrect);
    } catch (error) {
      console.error('Failed to record review:', error);
    }

    // Move to next card or show completion
    if (isLastCard) {
      setShowCompletion(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setRevealed(false);
    }
  };

  const handleRemoveCard = async () => {
    if (!currentCard) return;

    try {
      await removeFlashCard(currentCard.id);
      const newCards = cards.filter((_, i) => i !== currentIndex);
      setCards(newCards);
      setShowRemoveConfirm(false);

      if (newCards.length === 0) {
        setShowCompletion(true);
      } else if (currentIndex >= newCards.length) {
        setCurrentIndex(newCards.length - 1);
      }
      setRevealed(false);
    } catch (error) {
      console.error('Failed to remove flash card:', error);
    }
  };

  const handleContinue = () => {
    router.back();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setRevealed(false);
    setShowCompletion(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-6">📚</Text>
        <Text className="text-2xl font-bold text-primary mb-3 text-center">
          {t('flashcards.empty_title')}
        </Text>
        <Text className="text-base text-gray-500 text-center mb-8">
          {t('flashcards.empty_message')}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-primary px-8 py-4 rounded-xl"
        >
          <Text className="text-white font-semibold text-lg">{t('common.ok')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-lg text-gray-600">
          {t('practice.question')} {currentIndex + 1} {t('practice.of')} {cards.length}
        </Text>
        <Pressable
          onPress={() => setShowRemoveConfirm(true)}
          className="p-2"
        >
          <Text className="text-2xl">🗑️</Text>
        </Pressable>
      </View>

      {/* Flash Card */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="bg-white rounded-3xl shadow-lg p-8 w-full min-h-80 items-center justify-center border border-gray-100">
          <Text className="text-4xl font-bold text-primary text-center mb-6">
            {currentCard.german_word}
          </Text>

          {revealed ? (
            <>
              <View className="h-px w-20 bg-gray-300 mb-6" />
              <Text className="text-2xl text-gray-700 text-center mb-8">
                {currentCard.translated_text}
              </Text>
              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => handleAnswer(false)}
                  className="flex-1 bg-accent py-4 rounded-xl active:bg-accent/80"
                >
                  <Text className="text-white font-semibold text-lg text-center">
                    ✗ {t('flashcards.i_didnt_know')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAnswer(true)}
                  className="flex-1 bg-green-500 py-4 rounded-xl active:bg-green-600"
                >
                  <Text className="text-white font-semibold text-lg text-center">
                    ✓ {t('flashcards.i_knew_it')}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              onPress={handleReveal}
              className="bg-secondary py-4 px-8 rounded-xl active:bg-secondary/80"
            >
              <Text className="text-white font-semibold text-lg">
                {t('flashcards.show_answer')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        {revealed && (
          <View className="flex-row gap-4 mt-6">
            <View className="items-center">
              <Text className="text-sm text-gray-500">{t('flashcards.correct')}</Text>
              <Text className="text-2xl font-bold text-green-600">
                {currentCard.correct_count}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500">{t('flashcards.incorrect')}</Text>
              <Text className="text-2xl font-bold text-accent">
                {currentCard.wrong_count}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Remove Confirmation Modal */}
      <Modal
        visible={showRemoveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRemoveConfirm(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/30"
          onPress={() => setShowRemoveConfirm(false)}
        >
          <Pressable
            className="bg-white rounded-2xl p-5 mx-8 w-72 shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-primary mb-1">
              {t('flashcards.remove_confirm_title')}
            </Text>
            <Text className="text-base text-gray-700 mb-4">
              {t('flashcards.remove_confirm')}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowRemoveConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-gray-100 items-center"
              >
                <Text className="text-gray-600 font-medium">{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={handleRemoveCard}
                className="flex-1 py-2 rounded-lg bg-accent items-center"
              >
                <Text className="text-white font-medium">{t('flashcards.remove')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Completion Modal */}
      <Modal
        visible={showCompletion}
        transparent
        animationType="fade"
        onRequestClose={handleContinue}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/30"
          onPress={handleContinue}
        >
          <Pressable
            className="bg-white rounded-2xl p-6 mx-8 w-80 shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-6xl text-center mb-4">🎉</Text>
            <Text className="text-2xl font-bold text-primary text-center mb-2">
              {t('flashcards.completed_title')}
            </Text>
            <Text className="text-base text-gray-700 text-center mb-6">
              {t('flashcards.completed_message', { count: cards.length })}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleRestart}
                className="flex-1 py-3 rounded-xl bg-secondary items-center active:bg-secondary/80"
              >
                <Text className="text-white font-semibold">
                  {t('flashcards.review_again')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleContinue}
                className="flex-1 py-3 rounded-xl bg-primary items-center active:bg-primary/80"
              >
                <Text className="text-white font-semibold">
                  {t('flashcards.continue')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
