import {
  collection,
  doc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import { UserResponse, PhishingScenario } from '../types';

export interface SubmitResponsePayload {
  userId: string;
  scenario: PhishingScenario;
  selectedOptionId: string;
  timeTakenSeconds?: number;
}

export interface SubmissionResult {
  response: UserResponse;
  isCorrect: boolean;
  scoreObtained: number;
  explanation: string;
  correctSafeAction: string;
  optionFeedback: string;
}

/**
 * Submit user response and atomically update user progress statistics
 */
export async function submitUserResponse(payload: SubmitResponsePayload): Promise<SubmissionResult> {
  const { userId, scenario, selectedOptionId, timeTakenSeconds = 0 } = payload;

  const chosenOption = scenario.options.find((opt) => opt.optionId === selectedOptionId);
  if (!chosenOption) {
    throw new Error(`Invalid option ID "${selectedOptionId}" for scenario ${scenario.scenarioId}`);
  }

  const isCorrect = chosenOption.isCorrect;
  const scoreObtained = isCorrect ? chosenOption.scoreValue || 10 : 0;

  // Query existing attempts count for this user + scenario safely
  let attemptNumber = 1;
  try {
    const existingAttemptsQuery = query(
      collection(db, 'responses'),
      where('userId', '==', userId),
      where('scenarioId', '==', scenario.scenarioId)
    );
    const existingAttemptsSnap = await getDocs(existingAttemptsQuery);
    attemptNumber = existingAttemptsSnap.size + 1;
  } catch (err) {
    console.warn('Could not query prior attempts, defaulting to attempt 1:', err);
  }

  // Generate unique response ID
  const responseDocRef = doc(collection(db, 'responses'));
  const responseId = responseDocRef.id;

  const userDocRef = doc(db, 'users', userId);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);

    const newResponseData = {
      responseId,
      userId,
      scenarioId: scenario.scenarioId,
      selectedOptionId,
      isCorrect,
      scoreObtained,
      timeTakenSeconds,
      attemptNumber,
      timestamp: serverTimestamp(),
    };

    transaction.set(responseDocRef, newResponseData);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const prevTotalScore = Number(userData.totalScore || 0);
      const prevTotalAttempted = Number(userData.totalAttempted || 0);
      const prevTotalCorrect = Number(userData.totalCorrect || 0);
      const prevTotalIncorrect = Number(userData.totalIncorrect || 0);

      const categoryStats = { ...(userData.categoryStats || {}) };
      const currentCat = categoryStats[scenario.category] || { attempted: 0, correct: 0 };
      categoryStats[scenario.category] = {
        attempted: currentCat.attempted + 1,
        correct: currentCat.correct + (isCorrect ? 1 : 0),
      };

      transaction.update(userDocRef, {
        totalScore: prevTotalScore + scoreObtained,
        totalAttempted: prevTotalAttempted + 1,
        totalCorrect: prevTotalCorrect + (isCorrect ? 1 : 0),
        totalIncorrect: prevTotalIncorrect + (isCorrect ? 0 : 1),
        categoryStats,
        lastActiveAt: serverTimestamp(),
      });
    } else {
      // Auto-initialize user profile in Firestore
      transaction.set(userDocRef, {
        uid: userId,
        email: `${userId}@cyberkid.test`,
        displayName: 'Junior Defender',
        role: 'child',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        totalScore: scoreObtained,
        totalAttempted: 1,
        totalCorrect: isCorrect ? 1 : 0,
        totalIncorrect: isCorrect ? 0 : 1,
        categoryStats: {
          [scenario.category]: {
            attempted: 1,
            correct: isCorrect ? 1 : 0,
          },
        },
        lastActiveAt: serverTimestamp(),
      });
    }
  });

  const response: UserResponse = {
    responseId,
    userId,
    scenarioId: scenario.scenarioId,
    selectedOptionId,
    isCorrect,
    scoreObtained,
    timeTakenSeconds,
    attemptNumber,
    timestamp: new Date(),
  };

  return {
    response,
    isCorrect,
    scoreObtained,
    explanation: scenario.explanation,
    correctSafeAction: scenario.correctSafeAction,
    optionFeedback: chosenOption.feedback,
  };
}

/**
 * Fetch all responses for a given user
 */
export async function getUserResponses(userId: string): Promise<UserResponse[]> {
  const responsesRef = collection(db, 'responses');
  const q = query(responsesRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const list = snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    responseId: docSnap.id,
  })) as UserResponse[];

  // Sort descending by timestamp in memory to guarantee stability without extra index if missing
  return list.sort((a, b) => {
    const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
    const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
    return timeB - timeA;
  });
}
