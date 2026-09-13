import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Award,
  Sparkles,
  MessageSquare,
  User,
  LogOut,
  Send,
  Lock,
  Mail,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Database,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Clock,
  Flame,
  ArrowRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  UserProfile,
  PhishingScenario,
  UserResponse,
  UserFeedback,
  AiResult,
  ProgressSummary
} from './types';
import {
  registerUser,
  loginUser,
  logout,
  onAuthChanged,
  getUserProfile
} from './firebase/authService';
import {
  getActiveScenarios,
  getAllScenarios,
  toggleScenarioStatus,
  createScenario
} from './firebase/scenarioService';
import {
  submitUserResponse,
  getUserResponses,
  SubmissionResult
} from './firebase/responseService';
import {
  calculateProgressSummary,
  getUserProgress
} from './firebase/progressService';
import {
  submitUserFeedback,
  getUserFeedback,
  getAllFeedback,
  updateFeedbackStatus
} from './firebase/feedbackService';
import {
  getUserAiResults,
  generateAiCoaching
} from './firebase/aiService';
import {
  seedFirestoreDatabase,
  SAMPLE_USERS,
  SAMPLE_ADMIN,
  SAMPLE_SCENARIOS
} from './firebase/seedData';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'scenarios' | 'progress' | 'coach' | 'feedback' | 'admin'>('scenarios');

  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(SAMPLE_USERS[0]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'child' | 'admin'>('child');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Scenarios state
  const [scenarios, setScenarios] = useState<PhishingScenario[]>(SAMPLE_SCENARIOS);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Data state
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [userFeedbackList, setUserFeedbackList] = useState<UserFeedback[]>([]);
  const [allFeedbackList, setAllFeedbackList] = useState<UserFeedback[]>([]);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [seedingStatus, setSeedingStatus] = useState<{ loading: boolean; message: string | null; success?: boolean }>({
    loading: false,
    message: null,
  });

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState<'scenario_content' | 'app_bug' | 'suggestion' | 'safety_question'>('scenario_content');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Calculate user progress
  const progress: ProgressSummary = currentUser
    ? calculateProgressSummary(currentUser, scenarios.length || 3)
    : {
        totalAttempted: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        accuracyPercentage: 0,
        totalScore: 0,
        completionPercentage: 0,
        categoryBreakdown: {},
        currentSafetyTier: 'Cyber Apprentice',
      };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setCurrentUser(profile);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch data on user/tab change
  useEffect(() => {
    async function loadData() {
      try {
        const loadedScenarios = await getActiveScenarios();
        if (loadedScenarios.length > 0) {
          setScenarios(loadedScenarios);
        }
      } catch (err) {
        console.warn('Using local scenarios fallback:', err);
      }

      if (currentUser) {
        try {
          const [responses, feedbacks, aiData] = await Promise.all([
            getUserResponses(currentUser.uid),
            getUserFeedback(currentUser.uid),
            getUserAiResults(currentUser.uid),
          ]);
          setUserResponses(responses);
          setUserFeedbackList(feedbacks);
          setAiResults(aiData);

          if (currentUser.role === 'admin') {
            const allFb = await getAllFeedback();
            setAllFeedbackList(allFb);
          }
        } catch (err) {
          console.warn('Firestore fetch failed (may need database seeding):', err);
        }
      }
    }

    loadData();
  }, [currentUser, activeTab]);

  const currentScenario = scenarios[selectedScenarioIndex] || scenarios[0];

  // Handle Response Submission
  const handleAnswerSubmit = async () => {
    if (!selectedOptionId || !currentUser || !currentScenario) return;

    setIsSubmitting(true);
    try {
      const result = await submitUserResponse({
        userId: currentUser.uid,
        scenario: currentScenario,
        selectedOptionId,
        timeTakenSeconds: 10,
      });

      setSubmissionResult(result);

      // Refresh user profile and responses
      const updatedProfile = await getUserProfile(currentUser.uid);
      if (updatedProfile) {
        setCurrentUser(updatedProfile);
      } else {
        // Local state update fallback
        setCurrentUser((prev) => {
          if (!prev) return prev;
          const isCorr = result.isCorrect;
          return {
            ...prev,
            totalScore: prev.totalScore + result.scoreObtained,
            totalAttempted: prev.totalAttempted + 1,
            totalCorrect: prev.totalCorrect + (isCorr ? 1 : 0),
            totalIncorrect: prev.totalIncorrect + (isCorr ? 0 : 1),
          };
        });
      }

      const updatedResponses = await getUserResponses(currentUser.uid);
      setUserResponses(updatedResponses);
    } catch (error: any) {
      console.error('Error submitting response:', error);
      // Fallback for demo without Firestore connection
      const chosen = currentScenario.options.find((o) => o.optionId === selectedOptionId);
      if (chosen) {
        setSubmissionResult({
          response: {
            responseId: 'temp_resp_' + Date.now(),
            userId: currentUser.uid,
            scenarioId: currentScenario.scenarioId,
            selectedOptionId,
            isCorrect: chosen.isCorrect,
            scoreObtained: chosen.scoreValue,
            attemptNumber: 1,
            timestamp: new Date(),
          },
          isCorrect: chosen.isCorrect,
          scoreObtained: chosen.scoreValue,
          explanation: currentScenario.explanation,
          correctSafeAction: currentScenario.correctSafeAction,
          optionFeedback: chosen.feedback,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextScenario = () => {
    setSelectedOptionId(null);
    setSubmissionResult(null);
    setSelectedScenarioIndex((prev) => (prev + 1) % scenarios.length);
  };

  // Submit Feedback
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !feedbackText.trim()) return;

    try {
      const fb = await submitUserFeedback({
        userId: currentUser.uid,
        scenarioId: currentScenario?.scenarioId,
        feedbackText,
        rating: feedbackRating,
        category: feedbackCategory,
      });

      setUserFeedbackList((prev) => [fb, ...prev]);
      setFeedbackSubmitted(true);
      setFeedbackText('');
      setTimeout(() => setFeedbackSubmitted(false), 4000);
    } catch (err: any) {
      console.error('Feedback submit failed:', err);
    }
  };

  // Trigger AI Guidance
  const handleGenerateAiGuidance = async () => {
    if (!currentUser) return;
    setIsGeneratingAi(true);
    try {
      const weakCats = Object.entries(currentUser.categoryStats || {})
        .filter(([_, stat]: [string, any]) => stat && stat.attempted > 0 && stat.correct < stat.attempted)
        .map(([cat]) => cat);

      const aiRes = await generateAiCoaching({
        userId: currentUser.uid,
        accuracyPercentage: progress.accuracyPercentage,
        totalScore: currentUser.totalScore,
        weakCategories: weakCats,
        recentScenarioIds: [currentScenario?.scenarioId || ''],
      });

      setAiResults((prev) => [aiRes, ...prev]);
    } catch (err) {
      console.error('AI Guidance generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Seed Firestore
  const handleSeedDatabase = async () => {
    setSeedingStatus({ loading: true, message: 'Seeding sample documents into Firestore...' });
    const res = await seedFirestoreDatabase();
    setSeedingStatus({
      loading: false,
      message: res.message,
      success: res.success,
    });

    if (res.success) {
      const loaded = await getActiveScenarios();
      if (loaded.length > 0) setScenarios(loaded);
    }
  };

  // Handle Auth
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'register') {
        const profile = await registerUser(authEmail, authPassword, authDisplayName, authRole);
        setCurrentUser(profile);
      } else {
        const profile = await loginUser(authEmail, authPassword);
        if (profile) setCurrentUser(profile);
      }
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSwitchDemoUser = (user: UserProfile) => {
    setCurrentUser(user);
    setSelectedOptionId(null);
    setSubmissionResult(null);
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-2">
                CyberKid Shield
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold uppercase tracking-wider">
                  Firebase Safe
                </span>
              </span>
              <p className="text-xs text-slate-500 hidden sm:block">Child Phishing Awareness &amp; Threat Defense</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav id="nav-tabs" className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              id="tab-btn-scenarios"
              onClick={() => setActiveTab('scenarios')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'scenarios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scenarios ({scenarios.length})
            </button>
            <button
              id="tab-btn-progress"
              onClick={() => setActiveTab('progress')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'progress' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Progress
            </button>
            <button
              id="tab-btn-coach"
              onClick={() => setActiveTab('coach')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'coach' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Coach
            </button>
            <button
              id="tab-btn-feedback"
              onClick={() => setActiveTab('feedback')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'feedback' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Feedback
            </button>
            <button
              id="tab-btn-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              Admin &amp; DB
            </button>
          </nav>

          {/* User Profile Bar & Demo Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100/80 pl-2.5 pr-1.5 py-1 rounded-full border border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold leading-tight text-slate-800">{currentUser.displayName}</span>
                  <span className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold">
                    {currentUser.role} • {progress.totalScore} pts
                  </span>
                </div>
                <button
                  id="btn-user-options"
                  onClick={() => setShowAuthModal(true)}
                  title="Switch or manage account"
                  className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                >
                  <User className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={() => setShowAuthModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex border-b border-slate-200 bg-white overflow-x-auto px-2 py-1.5 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${activeTab === 'scenarios' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
        >
          Scenarios
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${activeTab === 'progress' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
        >
          Progress
        </button>
        <button
          onClick={() => setActiveTab('coach')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${activeTab === 'coach' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
        >
          AI Coach
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${activeTab === 'feedback' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
        >
          Feedback
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-2.5 py-1 rounded-md shrink-0 ${activeTab === 'admin' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
        >
          Admin &amp; DB
        </button>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* TAB 1: SCENARIOS / INTERACTIVE PHISHING SIMULATOR */}
        {activeTab === 'scenarios' && (
          <div id="tab-content-scenarios" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Scenario Index & Filter */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Phishing Challenges</h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    {scenarios.length} Available
                  </span>
                </div>
                <div className="space-y-2">
                  {scenarios.map((scen, idx) => (
                    <button
                      key={scen.scenarioId}
                      id={`scenario-card-${scen.scenarioId}`}
                      onClick={() => {
                        setSelectedScenarioIndex(idx);
                        setSelectedOptionId(null);
                        setSubmissionResult(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedScenarioIndex === idx
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                          {scen.category.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            scen.difficulty === 'beginner'
                              ? 'bg-emerald-100 text-emerald-800'
                              : scen.difficulty === 'intermediate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {scen.difficulty}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 text-sm line-clamp-1">{scen.title}</div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scen.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Child Safety Badge Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-4 text-white shadow-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-amber-300" />
                  <div>
                    <h3 className="font-bold text-sm">Child Cyber Defense</h3>
                    <p className="text-xs text-blue-100">{progress.currentSafetyTier}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-100 mb-3">
                  Score +10 for identifying traps safely. Never enter passwords or download files from unknown links!
                </p>
                <div className="bg-white/10 rounded-lg p-2.5 flex items-center justify-between text-xs font-medium">
                  <span>Current Accuracy:</span>
                  <span className="font-bold text-white">{progress.accuracyPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Right Column: Active Phishing Simulator Canvas */}
            <div className="lg:col-span-8 space-y-4">
              {currentScenario ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Scenario Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {currentScenario.category.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-slate-500">ID: {currentScenario.scenarioId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span>Worth 10 Safety Points</span>
                      </div>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 mb-1">{currentScenario.title}</h1>
                    <p className="text-sm text-slate-600">{currentScenario.description}</p>
                  </div>

                  {/* Simulated Phishing Message Box (Email/SMS/Chat Mockup) */}
                  <div className="p-5">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Incoming Suspicious Message Mockup
                    </div>

                    <div
                      id="phishing-preview-canvas"
                      className="rounded-xl border border-slate-300 bg-slate-100/50 p-4 shadow-inner"
                    >
                      {/* Sender header */}
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-3 text-xs">
                        {currentScenario.content.contentType === 'sms' ? (
                          <Smartphone className="w-4 h-4 text-blue-600" />
                        ) : currentScenario.content.contentType === 'email' ? (
                          <Mail className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                        )}
                        <span className="font-semibold text-slate-700">From:</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                          {currentScenario.content.sender}
                        </span>
                      </div>

                      {currentScenario.content.subject && (
                        <div className="text-xs font-bold text-slate-800 mb-2">
                          Subject: {currentScenario.content.subject}
                        </div>
                      )}

                      {/* Message body */}
                      <div className="bg-white rounded-lg p-4 border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans shadow-xs">
                        {currentScenario.content.body}
                        {currentScenario.content.url && (
                          <div className="mt-3 p-2 bg-red-50 rounded border border-red-200 font-mono text-xs text-red-700 break-all flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span>Link: {currentScenario.content.url}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multiple Choice Options */}
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-slate-800 mb-2">
                        What is the safest action for you to take?
                      </label>
                      <div className="space-y-2.5">
                        {currentScenario.options.map((opt) => (
                          <button
                            key={opt.optionId}
                            id={`option-btn-${opt.optionId}`}
                            disabled={submissionResult !== null}
                            onClick={() => setSelectedOptionId(opt.optionId)}
                            className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 ${
                              selectedOptionId === opt.optionId
                                ? 'border-blue-600 bg-blue-50/70 font-medium text-blue-900 ring-2 ring-blue-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                            } ${submissionResult !== null ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                                selectedOptionId === opt.optionId
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white text-slate-400'
                              }`}
                            >
                              {opt.optionId.slice(-1)}
                            </div>
                            <span className="flex-1">{opt.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    {!submissionResult ? (
                      <div className="mt-6 flex justify-end">
                        <button
                          id="btn-submit-answer"
                          disabled={!selectedOptionId || isSubmitting}
                          onClick={handleAnswerSubmit}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition shadow-xs flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            <>
                              Check My Decision
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Evaluation Result Banner */
                      <div
                        id="submission-result-card"
                        className={`mt-6 p-5 rounded-2xl border transition-all ${
                          submissionResult.isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {submissionResult.isCorrect ? (
                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-base">
                              {submissionResult.isCorrect
                                ? 'Safe Decision! You defended your account!'
                                : 'Unsafe Choice! That link was a phishing trap.'}
                            </h3>
                            <p className="text-xs opacity-90">
                              {submissionResult.isCorrect
                                ? `+${submissionResult.scoreObtained} Safety Points awarded to your profile`
                                : '0 points awarded. Learn from the breakdown below.'}
                            </p>
                          </div>
                        </div>

                        {/* Explanation & Learning Objective */}
                        <div className="bg-white/80 rounded-xl p-4 my-3 text-xs leading-relaxed space-y-2 border border-slate-200/60 text-slate-800">
                          <div>
                            <strong className="text-slate-900 block mb-0.5">Decision Feedback:</strong>
                            {submissionResult.optionFeedback}
                          </div>
                          <div>
                            <strong className="text-slate-900 block mb-0.5">Why this is dangerous:</strong>
                            {submissionResult.explanation}
                          </div>
                          <div className="pt-1 border-t border-slate-200 text-blue-900 font-medium">
                            <strong>Golden Rule:</strong> {submissionResult.correctSafeAction}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            id="btn-next-scenario"
                            onClick={handleNextScenario}
                            className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center gap-2"
                          >
                            Next Scenario
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-500">No active scenarios found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PROGRESS & DEFENSE METRICS */}
        {activeTab === 'progress' && (
          <div id="tab-content-progress" className="space-y-6">
            {/* Overview Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Points
                </span>
                <span className="text-2xl font-bold text-blue-600 mt-1 block">{progress.totalScore}</span>
                <span className="text-[11px] text-slate-400">Recorded in Firestore</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Accuracy</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                  {progress.accuracyPercentage}%
                </span>
                <span className="text-[11px] text-slate-400">
                  {progress.totalCorrect} of {progress.totalAttempted} safe
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Scenarios Done
                </span>
                <span className="text-2xl font-bold text-indigo-600 mt-1 block">
                  {progress.totalAttempted}
                </span>
                <span className="text-[11px] text-slate-400">{progress.completionPercentage}% completion</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Safety Rank
                </span>
                <span className="text-base font-bold text-amber-600 mt-2 block line-clamp-1">
                  {progress.currentSafetyTier}
                </span>
                <span className="text-[11px] text-slate-400">Level 2 Defender</span>
              </div>
            </div>

            {/* Category Performance Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                Threat Category Mastery
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['fake_prize', 'fake_school_message', 'suspicious_sms', 'fake_login'].map((cat) => {
                  const stat = progress.categoryBreakdown[cat] || { attempted: 0, correct: 0, accuracy: 0 };
                  return (
                    <div key={cat} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-slate-700 capitalize">
                          {cat.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-slate-900">{stat.accuracy}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${stat.accuracy}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {stat.correct} correct / {stat.attempted} attempted
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Response History */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                Saved User Responses ({userResponses.length})
              </h3>
              {userResponses.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No responses recorded in Firestore yet. Answer a scenario or click &quot;Admin &amp; DB&quot; to seed sample
                  documents.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {userResponses.map((resp) => (
                    <div key={resp.responseId} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {resp.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-800">{resp.scenarioId}</span>
                          <span className="text-slate-400 ml-2">Option: {resp.selectedOptionId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-600">
                          {resp.isCorrect ? `+${resp.scoreObtained} pts` : '0 pts'}
                        </span>
                        <span className="text-slate-400">Attempt #{resp.attemptNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AI COACH & EDUCATIONAL GUIDANCE */}
        {activeTab === 'coach' && (
          <div id="tab-content-coach" className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" />
                  Gemini Safety Engine
                </div>
                <h2 className="text-xl font-bold">Personalized Cyber Coaching</h2>
                <p className="text-xs text-blue-100 max-w-xl mt-1">
                  Analyzes your response history from Firestore to pinpoint which phishing psychological tricks
                  (urgency, authority, prize greed) fool you most, and provides customized study topics.
                </p>
              </div>
              <button
                id="btn-generate-ai-coach"
                disabled={isGeneratingAi}
                onClick={handleGenerateAiGuidance}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Responses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Weaknesses with AI
                  </>
                )}
              </button>
            </div>

            {/* AI Results Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Saved AI Coaching Reports ({aiResults.length})
              </h3>
              {aiResults.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
                  <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No AI evaluations saved yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click &quot;Analyze Weaknesses with AI&quot; above or load sample documents in the Admin tab.
                  </p>
                </div>
              ) : (
                aiResults.map((ai) => (
                  <div
                    key={ai.aiResultId}
                    id={`ai-card-${ai.aiResultId}`}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        AI Analysis ({ai.aiModel})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Doc ID: {ai.aiResultId}</span>
                    </div>

                    <p className="text-sm text-slate-800 font-medium leading-relaxed">{ai.performanceSummary}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-100">
                        <span className="text-xs font-bold text-rose-800 block mb-1">Identified Weaknesses</span>
                        <ul className="list-disc list-inside text-xs text-rose-700 space-y-0.5">
                          {ai.identifiedWeaknesses.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-100">
                        <span className="text-xs font-bold text-blue-800 block mb-1">Recommended Learning Topics</span>
                        <ul className="list-disc list-inside text-xs text-blue-700 space-y-0.5">
                          {ai.recommendedTopics.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Golden Safety Advice:</strong> {ai.personalizedAdvice}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FEEDBACK SUBMISSION */}
        {activeTab === 'feedback' && (
          <div id="tab-content-feedback" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-1">Submit Safety Feedback</h2>
              <p className="text-xs text-slate-500 mb-4">
                Did you encounter a confusing link, or have an idea for a new scam scenario? Let us know!
              </p>

              {feedbackSubmitted && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
                  Thank you! Your feedback was saved to Firestore with status &apos;pending&apos;.
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Category</label>
                  <select
                    id="feedback-category-select"
                    value={feedbackCategory}
                    onChange={(e: any) => setFeedbackCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="scenario_content">Scenario Content / Link Quality</option>
                    <option value="suggestion">Suggest a New Scam Scenario</option>
                    <option value="safety_question">Ask a Cybersecurity Question</option>
                    <option value="app_bug">Application Issue / Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold border transition ${
                          feedbackRating >= star
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        ★{star}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Feedback Message</label>
                  <textarea
                    id="feedback-text-area"
                    rows={4}
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="E.g., I saw a fake Roblox card giveaway on TikTok that looked just like Scenario #1..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-submit-feedback"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save Feedback to Firestore
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                My Submitted Feedback ({userFeedbackList.length})
              </h3>
              {userFeedbackList.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                  You have not submitted any feedback yet.
                </div>
              ) : (
                userFeedbackList.map((fb) => (
                  <div key={fb.feedbackId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 capitalize">
                        {fb.category.replace(/_/g, ' ')} • {'★'.repeat(fb.rating)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          fb.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fb.status === 'reviewed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {fb.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800">{fb.feedbackText}</p>
                    {fb.adminResponse && (
                      <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-900 border border-blue-100">
                        <strong className="block text-[11px] text-blue-950 font-bold mb-0.5">Admin Response:</strong>
                        {fb.adminResponse}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN & DATABASE MANAGEMENT */}
        {activeTab === 'admin' && (
          <div id="tab-content-admin" className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    Firestore Database Administration
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Database State &amp; Sample Data Loader</h2>
                  <p className="text-xs text-slate-500 max-w-xl mt-1">
                    Instantly seed Firestore with the exact hackathon test dataset (3 realistic scenarios with
                    options, 2 users, 3 responses, 2 feedback documents, and 2 AI coaching reports).
                  </p>
                </div>
                <button
                  id="btn-seed-database"
                  disabled={seedingStatus.loading}
                  onClick={handleSeedDatabase}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {seedingStatus.loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Seeding Firestore...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Populate Hackathon Sample Data
                    </>
                  )}
                </button>
              </div>

              {seedingStatus.message && (
                <div
                  className={`mt-4 p-3 rounded-lg text-xs font-medium border ${
                    seedingStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {seedingStatus.message}
                </div>
              )}

              {/* Demo Persona Switcher for Evaluation */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quick Switch Test Personas (Audit &amp; Testing)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSwitchDemoUser(SAMPLE_USERS[0])}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      currentUser?.uid === SAMPLE_USERS[0].uid
                        ? 'border-blue-600 bg-blue-50/60 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{SAMPLE_USERS[0].displayName} (Child User)</div>
                    <div className="text-[11px] text-slate-500">{SAMPLE_USERS[0].email}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-1">Score: 20 pts • 100% Safe</div>
                  </button>

                  <button
                    onClick={() => handleSwitchDemoUser(SAMPLE_USERS[1])}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      currentUser?.uid === SAMPLE_USERS[1].uid
                        ? 'border-blue-600 bg-blue-50/60 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{SAMPLE_USERS[1].displayName} (Child User)</div>
                    <div className="text-[11px] text-slate-500">{SAMPLE_USERS[1].email}</div>
                    <div className="text-[10px] text-rose-700 font-semibold mt-1">Score: 0 pts • 0% Safe</div>
                  </button>

                  <button
                    onClick={() => handleSwitchDemoUser(SAMPLE_ADMIN)}
                    className={`p-3 rounded-xl border text-left text-xs transition ${
                      currentUser?.uid === SAMPLE_ADMIN.uid
                        ? 'border-blue-600 bg-blue-50/60 font-bold'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{SAMPLE_ADMIN.displayName} (Admin Role)</div>
                    <div className="text-[11px] text-slate-500">{SAMPLE_ADMIN.email}</div>
                    <div className="text-[10px] text-blue-700 font-semibold mt-1">Role: Admin • Full Access</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Scenario Management for Admins */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Active Scenarios Management</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {scenarios.map((scen) => (
                  <div key={scen.scenarioId} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{scen.title}</div>
                      <div className="text-slate-400">
                        {scen.category} • {scen.options.length} options • Created by: {scen.createdBy}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          scen.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {scen.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={async () => {
                            await toggleScenarioStatus(scen.scenarioId, !scen.isActive);
                            setScenarios((prev) =>
                              prev.map((s) => (s.scenarioId === scen.scenarioId ? { ...s, isActive: !s.isActive } : s))
                            );
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                        >
                          Toggle Active
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Feedback Review Queue */}
            {currentUser?.role === 'admin' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">User Feedback Review Queue (Admin)</h3>
                <div className="space-y-3">
                  {allFeedbackList.length === 0 ? (
                    <p className="text-xs text-slate-500">No feedback entries found in Firestore.</p>
                  ) : (
                    allFeedbackList.map((fb) => (
                      <div key={fb.feedbackId} className="p-3 border border-slate-200 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800">From User: {fb.userId}</span>
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {fb.status}
                          </span>
                        </div>
                        <p className="text-slate-700">{fb.feedbackText}</p>
                        {fb.status === 'pending' && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={async () => {
                                await updateFeedbackStatus(
                                  fb.feedbackId,
                                  'reviewed',
                                  'Thank you for reporting this phishing tactic!'
                                );
                                setAllFeedbackList((prev) =>
                                  prev.map((f) =>
                                    f.feedbackId === fb.feedbackId
                                      ? { ...f, status: 'reviewed', adminResponse: 'Thank you for reporting this!' }
                                      : f
                                  )
                                );
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-[11px] font-bold"
                            >
                              Mark Reviewed &amp; Reply
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {authMode === 'login' ? 'Firebase Sign In' : 'Create Child Account'}
                </h2>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cyber Leo"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                    <select
                      value={authRole}
                      onChange={(e: any) => setAuthRole(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="child">Child / User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="child@safe-email.org"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : authMode === 'login' ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="text-center pt-2 text-xs text-slate-500">
              {authMode === 'login' ? (
                <>
                  Need an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign In here
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
