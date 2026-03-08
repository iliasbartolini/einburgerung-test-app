import type { QuestionStats } from '../types';

/**
 * Calculate difficulty tier based on accuracy and attempt count.
 * This matches the logic in the question_stats SQL view.
 */
export function calculateDifficultyTier(
  correctCount: number,
  totalAttempts: number
): QuestionStats['difficulty_tier'] {
  if (totalAttempts === 0) return 'unseen';
  const accuracy = correctCount / totalAttempts;
  if (accuracy >= 0.9) return 'mastered';
  if (accuracy >= 0.7) return 'comfortable';
  return 'struggling';
}

/**
 * Get status icon name (Ionicons) for a question based on its stats.
 */
export function getStatusIconName(stats: QuestionStats | null | undefined): string | null {
  if (!stats || stats.total_attempts === 0) return null;
  if (stats.difficulty_tier === 'mastered') return 'checkmark';
  if (stats.difficulty_tier === 'struggling') return 'close';
  return 'ellipse';
}

/**
 * Get status color class for a question based on its stats.
 */
export function getStatusColor(stats: QuestionStats | null | undefined): string {
  if (!stats || stats.total_attempts === 0) return 'text-gray-300';
  if (stats.difficulty_tier === 'mastered') return 'text-green-500';
  if (stats.difficulty_tier === 'struggling') return 'text-red-500';
  return 'text-yellow-500';
}

/**
 * Get navigator background color class for a question based on its stats.
 */
export function getNavigatorColor(stats: QuestionStats | null | undefined): string {
  if (!stats || stats.difficulty_tier === 'unseen') return 'bg-gray-100';
  switch (stats.difficulty_tier) {
    case 'mastered': return 'bg-green-200';
    case 'comfortable': return 'bg-amber-200';
    case 'struggling': return 'bg-red-200';
    default: return 'bg-gray-100';
  }
}
