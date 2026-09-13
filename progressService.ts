import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { ProgressSummary, UserProfile } from '../types';

/**
 * Calculates progress statistics from a user profile document
 */
export function calculateProgressSummary(user: UserProfile, totalScenariosCount: number = 10): ProgressSummary {
  const attempted = user.totalAttempted || 0;
  const correct = user.totalCorrect || 0;
  const incorrect = user.totalIncorrect || 0;
  const totalScore = user.totalScore || 0;

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const completionPercentage = Math.min(100, Math.round((attempted / Math.max(1, totalScenariosCount)) * 100));

  const categoryBreakdown: Record<string, { attempted: number; correct: number; accuracy: number }> = {};
  if (user.categoryStats) {
    Object.entries(user.categoryStats).forEach(([cat, stats]) => {
      const catAtt = stats.attempted || 0;
      const catCorr = stats.correct || 0;
      categoryBreakdown[cat] = {
        attempted: catAtt,
        correct: catCorr,
        accuracy: catAtt > 0 ? Math.round((catCorr / catAtt) * 100) : 0,
      };
    });
  }

  // Determine safety rank based on score and accuracy
  let currentSafetyTier: ProgressSummary['currentSafetyTier'] = 'Cyber Apprentice';
  if (totalScore >= 100 && accuracy >= 80) {
    currentSafetyTier = 'Phishing Master';
  } else if (totalScore >= 50 && accuracy >= 70) {
    currentSafetyTier = 'Cyber Sentinel';
  } else if (totalScore >= 20) {
    currentSafetyTier = 'Junior Shield';
  }

  return {
    totalAttempted: attempted,
    totalCorrect: correct,
    totalIncorrect: incorrect,
    accuracyPercentage: accuracy,
    totalScore,
    completionPercentage,
    categoryBreakdown,
    currentSafetyTier,
  };
}

/**
 * Fetch fresh user progress from Firestore
 */
export async function getUserProgress(userId: string, totalScenariosCount: number = 10): Promise<ProgressSummary | null> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return calculateProgressSummary(snap.data() as UserProfile, totalScenariosCount);
}
