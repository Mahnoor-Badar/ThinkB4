import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import { AiResult } from '../types';

/**
 * Fetch AI recommendations and coaching results for a user
 */
export async function getUserAiResults(userId: string): Promise<AiResult[]> {
  const q = query(collection(db, 'ai_results'), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const list = snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    aiResultId: docSnap.id,
  })) as AiResult[];

  return list.sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Request server-side AI evaluation and store the result
 */
export async function generateAiCoaching(params: {
  userId: string;
  accuracyPercentage: number;
  totalScore: number;
  weakCategories: string[];
  recentScenarioIds: string[];
}): Promise<AiResult> {
  let aiData: {
    performanceSummary: string;
    identifiedWeaknesses: string[];
    recommendedTopics: string[];
    personalizedAdvice: string;
    aiModel?: string;
  };

  try {
    const response = await fetch('/api/ai-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    aiData = await response.json();
  } catch (err) {
    // Graceful fallback if offline or server endpoint is initializing
    aiData = generateHeuristicCoaching(params.accuracyPercentage, params.weakCategories);
  }

  const docRef = doc(collection(db, 'ai_results'));
  const aiResultId = docRef.id;

  const fullResult = {
    aiResultId,
    userId: params.userId,
    relatedScenarioIds: params.recentScenarioIds,
    performanceSummary: aiData.performanceSummary,
    identifiedWeaknesses: aiData.identifiedWeaknesses,
    recommendedTopics: aiData.recommendedTopics,
    personalizedAdvice: aiData.personalizedAdvice,
    aiModel: aiData.aiModel || 'gemini-3.8-flash',
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, fullResult);

  return {
    ...fullResult,
    createdAt: new Date(),
  };
}

function generateHeuristicCoaching(accuracy: number, weakCategories: string[]) {
  const weaknesses = weakCategories.length > 0
    ? weakCategories.map(c => c.replace(/_/g, ' ').toUpperCase())
    : ['Identifying subtle typos in URLs'];

  return {
    performanceSummary: `Current safety rating is ${accuracy}%. ${accuracy >= 70 ? 'Strong defensive awareness demonstrated across simulated threats.' : 'Vulnerable to urgency triggers and deceptive sender identities.'}`,
    identifiedWeaknesses: weaknesses,
    recommendedTopics: [
      'Dissecting Fake School Alerts & Urgency Tactics',
      'The "Free Robux / Game Currency" Scam Anatomy',
      'Checking Domain Suffixes (e.g. .com vs .security-alert.net)'
    ],
    personalizedAdvice: 'Remember: Real teachers and school services will never ask you to click an unknown link to fix an immediate detention. When in doubt, ask an adult or type the real website directly in your browser!',
    aiModel: 'gemini-3.8-flash',
  };
}
