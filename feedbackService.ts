import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import { UserFeedback } from '../types';

export interface SubmitFeedbackPayload {
  userId: string;
  scenarioId?: string;
  feedbackText: string;
  rating: number;
  category: 'scenario_content' | 'app_bug' | 'suggestion' | 'safety_question';
}

/**
 * Submit user feedback to the feedback collection
 */
export async function submitUserFeedback(payload: SubmitFeedbackPayload): Promise<UserFeedback> {
  const feedbackDocRef = doc(collection(db, 'feedback'));
  const feedbackId = feedbackDocRef.id;

  const data = {
    feedbackId,
    userId: payload.userId,
    scenarioId: payload.scenarioId || '',
    feedbackText: payload.feedbackText,
    rating: payload.rating,
    category: payload.category,
    status: 'pending' as const,
    createdAt: serverTimestamp(),
  };

  await setDoc(feedbackDocRef, data);

  return {
    ...data,
    createdAt: new Date(),
  };
}

/**
 * Fetch feedback submitted by a specific user
 */
export async function getUserFeedback(userId: string): Promise<UserFeedback[]> {
  const q = query(collection(db, 'feedback'), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const list = snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    feedbackId: docSnap.id,
  })) as UserFeedback[];

  return list.sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Admin: Fetch all feedback items
 */
export async function getAllFeedback(): Promise<UserFeedback[]> {
  const snapshot = await getDocs(collection(db, 'feedback'));
  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    feedbackId: docSnap.id,
  })) as UserFeedback[];
}

/**
 * Admin: Update feedback status and reply
 */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'pending' | 'reviewed' | 'resolved',
  adminResponse?: string
): Promise<void> {
  const docRef = doc(db, 'feedback', feedbackId);
  await updateDoc(docRef, {
    status,
    ...(adminResponse ? { adminResponse } : {}),
  });
}
