import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { PhishingScenario, UserProfile, UserResponse, UserFeedback, AiResult } from '../types';

export const SAMPLE_USERS: UserProfile[] = [
  {
    uid: 'user_child_leo_101',
    email: 'leo.defender@cyberkid.test',
    displayName: 'Leo Spark',
    role: 'child',
    createdAt: new Date('2026-09-01T10:00:00Z'),
    lastLoginAt: new Date('2026-09-12T09:30:00Z'),
    totalScore: 20,
    totalAttempted: 2,
    totalCorrect: 2,
    totalIncorrect: 0,
    categoryStats: {
      fake_prize: { attempted: 1, correct: 1 },
      fake_school_message: { attempted: 1, correct: 1 },
    },
    lastActiveAt: new Date('2026-09-12T09:45:00Z'),
  },
  {
    uid: 'user_child_maya_202',
    email: 'maya.shield@cyberkid.test',
    displayName: 'Maya Chen',
    role: 'child',
    createdAt: new Date('2026-09-05T14:20:00Z'),
    lastLoginAt: new Date('2026-09-11T16:10:00Z'),
    totalScore: 0,
    totalAttempted: 1,
    totalCorrect: 0,
    totalIncorrect: 1,
    categoryStats: {
      fake_prize: { attempted: 1, correct: 0 },
    },
    lastActiveAt: new Date('2026-09-11T16:15:00Z'),
  },
];

export const SAMPLE_ADMIN: UserProfile = {
  uid: 'user_admin_sarah_001',
  email: 'sarah.director@cyberkidsafety.org',
  displayName: 'Inspector Sarah',
  role: 'admin',
  createdAt: new Date('2026-08-15T08:00:00Z'),
  lastLoginAt: new Date('2026-09-12T08:00:00Z'),
  totalScore: 0,
  totalAttempted: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  categoryStats: {},
  lastActiveAt: new Date('2026-09-12T08:00:00Z'),
};

export const SAMPLE_SCENARIOS: PhishingScenario[] = [
  {
    scenarioId: 'scen_free_game_coins_01',
    title: 'The Free 10,000 Game Coins Giveaway',
    description: 'A direct chat message promising instant game currency if you click a countdown link.',
    category: 'fake_prize',
    difficulty: 'beginner',
    content: {
      sender: 'Discord-Bot-Rewards#9921',
      body: 'CONGRATS! You won 10,000 Free V-Bucks/Robux! Click within 5 minutes or forfeit your prize: http://freerobux-rewardz-instant.xyz/claim',
      url: 'http://freerobux-rewardz-instant.xyz/claim',
      contentType: 'chat_message',
    },
    correctSafeAction: 'Close the chat window, never click unknown giveaway links, and report the bot account.',
    explanation: 'Legitimate game platforms never distribute free in-game currency through unsolicited direct messages or shady unofficial domain extensions (.xyz). Artificial urgency (5-minute countdown) is a classic phishing hook.',
    learningObjective: 'Recognize that "too good to be true" prize promises paired with ticking countdown clocks are malicious credential harvesting traps.',
    options: [
      {
        optionId: 'opt_prize_1',
        text: 'Click the link right away before the 5-minute timer expires so you don’t lose your coins.',
        isCorrect: false,
        feedback: 'Dangerous! The countdown is fake and designed to make you act without thinking. The link leads to a fake login page that steals your account password.',
        scoreValue: 0,
      },
      {
        optionId: 'opt_prize_2',
        text: 'Do not click the link. Block and report the bot to the platform moderators.',
        isCorrect: true,
        feedback: 'Spot on! Real gaming platforms never hand out free currency via random bots. Blocking and reporting protects you and your friends.',
        scoreValue: 10,
      },
      {
        optionId: 'opt_prize_3',
        text: 'Forward the message to your school friends to check if it worked for them first.',
        isCorrect: false,
        feedback: 'Unsafe! Forwarding spam spreads dangerous links to your friends and could compromise their accounts too.',
        scoreValue: 0,
      },
    ],
    isActive: true,
    createdBy: 'user_admin_sarah_001',
    createdAt: new Date('2026-09-01T12:00:00Z'),
    updatedAt: new Date('2026-09-01T12:00:00Z'),
  },
  {
    scenarioId: 'scen_school_urgent_portal_02',
    title: 'Urgent School Principal Attendance Warning',
    description: 'An official-looking email claiming you have an unexcused absence and must verify your password.',
    category: 'fake_school_message',
    difficulty: 'intermediate',
    content: {
      sender: 'principal.office@oakridge-academy-portal.net',
      subject: 'URGENT: Unexcused Absence & Immediate Disciplinary Action',
      body: 'Dear student, our morning attendance check marked you absent for all classes today. You will receive an immediate weekend detention unless you verify your identity on this portal within 1 hour: https://oakridge.parentportal-verify.cc/login',
      url: 'https://oakridge.parentportal-verify.cc/login',
      contentType: 'email',
    },
    correctSafeAction: 'Do not click the link. Verify directly with your parents or school administration in person or via verified phone.',
    explanation: 'Scammers frequently impersonate school principals, teachers, or administrators to induce fear and panic. Notice the sender domain (.net) and the login link (.cc) differ from your genuine school district portal.',
    learningObjective: 'Learn to detect fear-based authority impersonation and verify urgent disciplinary notices out-of-band.',
    options: [
      {
        optionId: 'opt_school_1',
        text: 'Panic and type your school ID and password into the link immediately to avoid detention.',
        isCorrect: false,
        feedback: 'Unsafe! Phishers rely on panic. Entering credentials on this fake page gives attackers full access to your school files.',
        scoreValue: 0,
      },
      {
        optionId: 'opt_school_2',
        text: 'Close the email. Tell your parent or teacher directly, and log into your real school app from your bookmarks.',
        isCorrect: true,
        feedback: 'Brilliant move! You identified the fake domain (.cc) and used out-of-band verification instead of trusting the email link.',
        scoreValue: 10,
      },
      {
        optionId: 'opt_school_3',
        text: 'Reply to the sender with your home address and student ID number to clear up the confusion.',
        isCorrect: false,
        feedback: 'Dangerous! Replying confirms your email is active and hands sensitive personal information directly to the scammer.',
        scoreValue: 0,
      },
    ],
    isActive: true,
    createdBy: 'user_admin_sarah_001',
    createdAt: new Date('2026-09-02T10:00:00Z'),
    updatedAt: new Date('2026-09-02T10:00:00Z'),
  },
  {
    scenarioId: 'scen_fake_security_alert_03',
    title: 'Suspicious Password Reset for Video Sharing App',
    description: 'An SMS message alleging unauthorized foreign login activity with a shortened bit.ly link.',
    category: 'suspicious_sms',
    difficulty: 'advanced',
    content: {
      sender: '+1 (800) 555-0199',
      body: '[SECURITY ALERT] Someone from Moscow attempted to access your video account. If this was NOT you, secure your account immediately: https://bit.ly/secure-my-video-account',
      url: 'https://bit.ly/secure-my-video-account',
      contentType: 'sms',
    },
    correctSafeAction: 'Ignore the SMS link. Open the official video app on your device and check Security Activity in settings.',
    explanation: 'Shortened URLs (such as bit.ly) are heavily used in SMS phishing ("Smishing") because they mask the real fraudulent destination URL. Legitimate security alerts can always be viewed directly inside the verified app.',
    learningObjective: 'Identify SMS phishing (smishing) mechanisms and shortlink masking techniques.',
    options: [
      {
        optionId: 'opt_sec_1',
        text: 'Click the shortened bit.ly link and type your current password to cancel the foreign login.',
        isCorrect: false,
        feedback: 'Dangerous! The bit.ly link hides a malicious phishing mirror that captures whatever password you type.',
        scoreValue: 0,
      },
      {
        optionId: 'opt_sec_2',
        text: 'Text "STOP" and reply with your username.',
        isCorrect: false,
        feedback: 'Unsafe! Replying to fraudulent numbers lets cybercriminals know your phone number is monitored by an active user.',
        scoreValue: 0,
      },
      {
        optionId: 'opt_sec_3',
        text: 'Do not click. Open the actual video app independently, go to Account Settings, and review recent devices.',
        isCorrect: true,
        feedback: 'Excellent cybersecurity hygiene! Always inspect account security through official apps rather than inbound text links.',
        scoreValue: 10,
      },
    ],
    isActive: true,
    createdBy: 'user_admin_sarah_001',
    createdAt: new Date('2026-09-03T15:00:00Z'),
    updatedAt: new Date('2026-09-03T15:00:00Z'),
  },
];

export const SAMPLE_RESPONSES: UserResponse[] = [
  {
    responseId: 'resp_101_prize',
    userId: 'user_child_leo_101',
    scenarioId: 'scen_free_game_coins_01',
    selectedOptionId: 'opt_prize_2',
    isCorrect: true,
    scoreObtained: 10,
    timeTakenSeconds: 12,
    attemptNumber: 1,
    timestamp: new Date('2026-09-12T09:35:00Z'),
  },
  {
    responseId: 'resp_101_school',
    userId: 'user_child_leo_101',
    scenarioId: 'scen_school_urgent_portal_02',
    selectedOptionId: 'opt_school_2',
    isCorrect: true,
    scoreObtained: 10,
    timeTakenSeconds: 18,
    attemptNumber: 1,
    timestamp: new Date('2026-09-12T09:42:00Z'),
  },
  {
    responseId: 'resp_202_prize',
    userId: 'user_child_maya_202',
    scenarioId: 'scen_free_game_coins_01',
    selectedOptionId: 'opt_prize_1',
    isCorrect: false,
    scoreObtained: 0,
    timeTakenSeconds: 6,
    attemptNumber: 1,
    timestamp: new Date('2026-09-11T16:12:00Z'),
  },
];

export const SAMPLE_FEEDBACK: UserFeedback[] = [
  {
    feedbackId: 'fb_101_suggestion',
    userId: 'user_child_leo_101',
    scenarioId: 'scen_free_game_coins_01',
    feedbackText: 'The fake Discord bot message was super realistic! My friend almost fell for something like that last week.',
    rating: 5,
    category: 'scenario_content',
    createdAt: new Date('2026-09-12T09:44:00Z'),
    status: 'reviewed',
    adminResponse: 'Great catch Leo! That is one of the most common scams targeting young gamers today.',
  },
  {
    feedbackId: 'fb_202_question',
    userId: 'user_child_maya_202',
    scenarioId: 'scen_free_game_coins_01',
    feedbackText: 'Can we have a scenario about Instagram follower giveaway bots and fake streaming links next?',
    rating: 4,
    category: 'suggestion',
    createdAt: new Date('2026-09-11T16:15:00Z'),
    status: 'pending',
  },
];

export const SAMPLE_AI_RESULTS: AiResult[] = [
  {
    aiResultId: 'ai_result_leo_01',
    userId: 'user_child_leo_101',
    relatedScenarioIds: ['scen_free_game_coins_01', 'scen_school_urgent_portal_02'],
    performanceSummary: 'Outstanding 100% defensive accuracy. Demonstrates sharp instinct against fake urgency and gaming giveaways.',
    identifiedWeaknesses: ['Advanced Smishing & shortlink obfuscation'],
    recommendedTopics: ['SMS Shortlink Verification', 'Multi-Factor Authentication Basics'],
    personalizedAdvice: 'Leo, you are doing fantastic! Keep reminding your friends that free game currency links are always fake.',
    aiModel: 'gemini-3.8-flash',
    createdAt: new Date('2026-09-12T09:45:00Z'),
  },
  {
    aiResultId: 'ai_result_maya_01',
    userId: 'user_child_maya_202',
    relatedScenarioIds: ['scen_free_game_coins_01'],
    performanceSummary: 'Rushed decision in 6 seconds resulted in falling for a timer countdown scam.',
    identifiedWeaknesses: ['Urgency pressure countdowns', 'Too-good-to-be-true giveaways'],
    recommendedTopics: ['Understanding Artificial Urgency in Cyber Scams', 'Domain Inspection Techniques'],
    personalizedAdvice: 'Maya, whenever you see a 5-minute countdown clock offering free prizes, take a deep breath! Real prizes never vanish in 5 minutes.',
    aiModel: 'gemini-3.8-flash',
    createdAt: new Date('2026-09-11T16:14:00Z'),
  },
];

/**
 * Seeder function to populate Firestore with the exact sample data
 */
export async function seedFirestoreDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Seed Users
    for (const u of [...SAMPLE_USERS, SAMPLE_ADMIN]) {
      await setDoc(doc(db, 'users', u.uid), {
        ...u,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    }

    // 2. Seed Scenarios
    for (const s of SAMPLE_SCENARIOS) {
      await setDoc(doc(db, 'scenarios', s.scenarioId), {
        ...s,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Seed Responses
    for (const r of SAMPLE_RESPONSES) {
      await setDoc(doc(db, 'responses', r.responseId), {
        ...r,
        timestamp: serverTimestamp(),
      });
    }

    // 4. Seed Feedback
    for (const f of SAMPLE_FEEDBACK) {
      await setDoc(doc(db, 'feedback', f.feedbackId), {
        ...f,
        createdAt: serverTimestamp(),
      });
    }

    // 5. Seed AI Results
    for (const a of SAMPLE_AI_RESULTS) {
      await setDoc(doc(db, 'ai_results', a.aiResultId), {
        ...a,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true, message: 'Successfully seeded 3 users, 3 scenarios, 3 responses, 2 feedbacks, and 2 AI coaching results into Firestore!' };
  } catch (error: any) {
    console.error('Failed to seed database:', error);
    return { success: false, message: error.message || 'Error seeding Firestore' };
  }
}
