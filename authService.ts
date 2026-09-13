import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './config';
import { UserProfile, UserRole } from '../types';

/**
 * Register a new user account with Firebase Auth and initialize Firestore profile
 */
export async function registerUser(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole = 'child'
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  // Set Auth display name
  await updateProfile(user, { displayName });

  const profileData: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || 'Junior Defender',
    role,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    totalScore: 0,
    totalAttempted: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    categoryStats: {},
    lastActiveAt: serverTimestamp(),
  };

  // Write profile doc keyed by UID
  await setDoc(doc(db, 'users', user.uid), profileData);

  return profileData;
}

/**
 * Sign in with email and password
 */
export async function loginUser(email: string, pass: string): Promise<UserProfile | null> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
    return userSnap.data() as UserProfile;
  } else {
    // If auth exists without doc, self-heal doc
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName: user.displayName || 'Cyber Defender',
      role: 'child',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      totalScore: 0,
      totalAttempted: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      categoryStats: {},
      lastActiveAt: serverTimestamp(),
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

/**
 * Sign out
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Get current user profile document
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

/**
 * Auth state listener
 */
export function onAuthChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
