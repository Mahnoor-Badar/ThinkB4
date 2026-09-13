import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './config';
import { PhishingScenario } from '../types';

/**
 * Fetch all active phishing scenarios for children/users
 */
export async function getActiveScenarios(): Promise<PhishingScenario[]> {
  const scenariosRef = collection(db, 'scenarios');
  const q = query(scenariosRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    scenarioId: docSnap.id,
  })) as PhishingScenario[];
}

/**
 * Fetch all scenarios including inactive (for Admin panel)
 */
export async function getAllScenarios(): Promise<PhishingScenario[]> {
  const scenariosRef = collection(db, 'scenarios');
  const snapshot = await getDocs(scenariosRef);

  return snapshot.docs.map((docSnap) => ({
    ...docSnap.data(),
    scenarioId: docSnap.id,
  })) as PhishingScenario[];
}

/**
 * Get single scenario by ID
 */
export async function getScenarioById(scenarioId: string): Promise<PhishingScenario | null> {
  const docRef = doc(db, 'scenarios', scenarioId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return {
      ...snap.data(),
      scenarioId: snap.id,
    } as PhishingScenario;
  }
  return null;
}

/**
 * Admin: Create or replace a scenario
 */
export async function createScenario(
  scenario: Omit<PhishingScenario, 'createdAt' | 'updatedAt'>,
  adminUid: string
): Promise<void> {
  const docRef = doc(db, 'scenarios', scenario.scenarioId);
  await setDoc(docRef, {
    ...scenario,
    createdBy: adminUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Admin: Toggle active status
 */
export async function toggleScenarioStatus(scenarioId: string, isActive: boolean): Promise<void> {
  const docRef = doc(db, 'scenarios', scenarioId);
  await updateDoc(docRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });
}
