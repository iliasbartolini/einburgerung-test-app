import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { getBookmarkedIds } from '../../../src/db/repositories/bookmarksRepository';
import {
  getAllQuestionStats,
  getBookmarkedQuestions,
  getIncorrectQuestions,
  getQuestionsByBundesland,
  getQuestionsByTopic,
  getUnansweredQuestions,
  searchQuestions,
} from '../../../src/db/repositories/questionsRepository';
import { useAppStore } from '../../../src/stores/useAppStore';
import type { Question, QuestionStats } from '../../../src/types';

type Filter = 'all' | 'politik' | 'geschichte' | 'gesellschaft' | 'bundesland' | 'bookmarked' | 'incorrect' | 'unanswered';

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'all', labelKey: 'catalog.all' },
  { key: 'politik', labelKey: 'catalog.politik' },
  { key: 'geschichte', labelKey: 'catalog.geschichte' },
  { key: 'gesellschaft', labelKey: 'catalog.gesellschaft' },
  { key: 'bundesland', labelKey: 'catalog.bundesland' },
  { key: 'bookmarked', labelKey: 'catalog.bookmarked' },
  { key: 'incorrect', labelKey: 'catalog.incorrect' },
  { key: 'unanswered', labelKey: 'catalog.unanswered' },
];

export default function CatalogScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { bundeslandId } = useAppStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<Record<number, QuestionStats>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  const loadQuestions = useCallback(async () => {
    if (!bundeslandId) return;

    let loaded: Question[];

    if (searchQuery.trim()) {
      loaded = await searchQuestions(searchQuery.trim());
    } else {
      switch (filter) {
        case 'politik':
        case 'geschichte':
        case 'gesellschaft':
          loaded = await getQuestionsByTopic(filter);
          break;
        case 'bundesland':
          loaded = (await getQuestionsByBundesland(bundeslandId)).filter(
            (q) => q.bundesland_id !== null
          );
          break;
        case 'bookmarked':
          loaded = await getBookmarkedQuestions();
          break;
        case 'incorrect':
          loaded = await getIncorrectQuestions(bundeslandId);
          break;
        case 'unanswered':
          loaded = await getUnansweredQuestions(bundeslandId);
          break;
        default:
          loaded = await getQuestionsByBundesland(bundeslandId);
          break;
      }
    }

    setQuestions(loaded);

    // Get total count for display
    const all = await getQuestionsByBundesland(bundeslandId);
    setTotalCount(all.length);
  }, [bundeslandId, filter, searchQuery]);

  const loadStats = useCallback(async () => {
    const allStats = await getAllQuestionStats();
    const map: Record<number, QuestionStats> = {};
    for (const s of allStats) {
      map[s.question_id] = s;
    }
    setStats(map);
    const ids = await getBookmarkedIds();
    setBookmarkedIds(new Set(ids));
  }, []);

  useEffect(() => {
    loadQuestions();
    loadStats();
  }, [loadQuestions, loadStats]);

  const getStatusIcon = (questionId: number) => {
    const stat = stats[questionId];
    if (!stat || stat.total_attempts === 0) return '\u2014'; // —
    if (stat.difficulty_tier === 'mastered') return '\u2713';
    if (stat.difficulty_tier === 'difficult' || stat.difficulty_tier === 'struggling') return '\u2717';
    return '\u00B7'; // middle dot
  };

  const getStatusColor = (questionId: number) => {
    const stat = stats[questionId];
    if (!stat || stat.total_attempts === 0) return 'text-gray-300';
    if (stat.difficulty_tier === 'mastered') return 'text-green-500';
    if (stat.difficulty_tier === 'difficult' || stat.difficulty_tier === 'struggling') return 'text-red-500';
    return 'text-yellow-500';
  };

  const renderItem = ({ item }: { item: Question }) => (
    <Pressable
      onPress={() => router.push(`/catalog/${item.id}` as any)}
      className="flex-row items-center px-4 py-3 border-b border-gray-100 active:bg-gray-50"
      accessibilityRole="button"
    >
      <Text className="text-sm text-gray-400 w-10 font-mono">{item.id}</Text>
      <View className="flex-1 mx-3">
        <Text className="text-base text-gray-800" numberOfLines={2}>
          {item.question_text}
        </Text>
        <Text className="text-xs text-secondary mt-1 capitalize">{item.topic}</Text>
      </View>
      <Text className={`text-lg font-bold mr-2 ${getStatusColor(item.id)}`}>
        {getStatusIcon(item.id)}
      </Text>
      <Text className="text-lg">
        {bookmarkedIds.has(item.id) ? '\u2605' : ''}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Search */}
      <View className="px-4 pt-2 pb-2">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('catalog.search')}
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholderTextColor="#999"
          autoCapitalize="none"
          accessibilityLabel={t('catalog.search')}
        />
      </View>

      {/* Filter chips */}
      <View className="px-4 pb-2">
        <FlashList
          data={FILTERS}
          horizontal

          showsHorizontalScrollIndicator={false}
          renderItem={({ item: f }) => (
            <Pressable
              onPress={() => { setFilter(f.key); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-full mr-2 ${
                filter === f.key ? 'bg-primary' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  filter === f.key ? 'text-white' : 'text-gray-600'
                }`}
              >
                {t(f.labelKey)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Count */}
      <View className="px-4 pb-2">
        <Text className="text-sm text-gray-500">
          {t('catalog.showing', { count: questions.length, total: totalCount })}
        </Text>
      </View>

      {/* Questions list */}
      <View className="flex-1">
        <FlashList
          data={questions}
          renderItem={renderItem}

          keyExtractor={(item) => String(item.id)}
        />
      </View>
    </SafeAreaView>
  );
}
