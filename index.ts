export type UserRole = 'child' | 'admin';

export type ScenarioCategory =
  | 'fake_login'
  | 'fake_prize'
  | 'fake_school_message'
  | 'fake_account_warning'
  | 'fake_password_reset'
  | 'suspicious_email'
  | 'suspicious_sms'
  | 'social_media_scam';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CategoryStat {
  attempted: number;
  correct: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  lastLoginAt: any;
  totalScore: number;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  categoryStats: Record<string, CategoryStat>;
  lastActiveAt?: any;
}

export interface AnswerOption {
  optionId: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
  scoreValue: number;
}

export interface ScenarioContent {
  sender: string;
  subject?: string;
  body: string;
  url?: string;
  contentType: 'email' | 'sms' | 'chat_message' | 'popup';
}

export interface PhishingScenario {
  scenarioId: string;
  title: string;
  description: string;
  category: ScenarioCategory;
  difficulty: DifficultyLevel;
  content: ScenarioContent;
  correctSafeAction: string;
  explanation: string;
  learningObjective: string;
  options: AnswerOption[];
  isActive: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserResponse {
  responseId: string;
  userId: string;
  scenarioId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  scoreObtained: number;
  timeTakenSeconds?: number;
  attemptNumber: number;
  timestamp: any;
}

export interface UserFeedback {
  feedbackId: string;
  userId: string;
  scenarioId?: string;
  feedbackText: string;
  rating: number;
  category: 'scenario_content' | 'app_bug' | 'suggestion' | 'safety_question';
  createdAt: any;
  status: 'pending' | 'reviewed' | 'resolved';
  adminResponse?: string;
}

export interface AiResult {
  aiResultId: string;
  userId: string;
  relatedScenarioIds: string[];
  performanceSummary: string;
  identifiedWeaknesses: string[];
  recommendedTopics: string[];
  personalizedAdvice: string;
  aiModel: string;
  createdAt: any;
}

export interface ProgressSummary {
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracyPercentage: number;
  totalScore: number;
  completionPercentage: number;
  categoryBreakdown: Record<string, { attempted: number; correct: number; accuracy: number }>;
  currentSafetyTier: 'Cyber Apprentice' | 'Junior Shield' | 'Cyber Sentinel' | 'Phishing Master';
}
