import { GoogleGenAI } from '@google/genai';

export interface AiCoachingRequest {
  userId: string;
  accuracyPercentage: number;
  totalScore: number;
  weakCategories: string[];
  recentScenarioIds: string[];
}

export interface AiCoachingResponse {
  performanceSummary: string;
  identifiedWeaknesses: string[];
  recommendedTopics: string[];
  personalizedAdvice: string;
  aiModel: string;
}

export function getFallbackAiResponse(data: AiCoachingRequest): AiCoachingResponse {
  const weaknesses = data.weakCategories.length > 0
    ? data.weakCategories.map((c) => c.replace(/_/g, ' ').toUpperCase())
    : ['Identifying spoofed sender domains and shortlinks'];

  return {
    performanceSummary: `Your current cyber defense accuracy is ${data.accuracyPercentage}%. You have earned ${data.totalScore} safety points so far!`,
    identifiedWeaknesses: weaknesses,
    recommendedTopics: [
      'Spotting Fake Countdown Timers & Artificial Urgency',
      'The "Free In-Game Currency" Phishing Trap',
      'Verifying School & Authority Notices Out-of-Band',
    ],
    personalizedAdvice: 'Rule of Thumb: If a message demands you click within minutes to avoid a penalty or claim a prize, pause immediately. Real organizations never force split-second decisions.',
    aiModel: 'gemini-3.8-flash (heuristic fallback)',
  };
}

export async function generateCoachingAdvice(data: AiCoachingRequest): Promise<AiCoachingResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return getFallbackAiResponse(data);
  }

  try {
    const ai = new GoogleGenAI({});
    const prompt = `You are an expert child cybersecurity mentor in an educational phishing simulator.
The child has the following stats:
- Accuracy: ${data.accuracyPercentage}%
- Total Score: ${data.totalScore}
- Challenging areas: ${data.weakCategories.join(', ') || 'None - doing well'}

Analyze their performance and return ONLY a valid JSON object matching this schema:
{
  "performanceSummary": "A 2-sentence encouraging, clear summary of their phishing detection readiness",
  "identifiedWeaknesses": ["Specific weakness 1", "Specific weakness 2"],
  "recommendedTopics": ["Targeted topic 1", "Targeted topic 2"],
  "personalizedAdvice": "A punchy, memorable golden rule for this child"
}`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (res.text) {
      const parsed = JSON.parse(res.text);
      return {
        performanceSummary: parsed.performanceSummary || 'Great job defending your accounts!',
        identifiedWeaknesses: Array.isArray(parsed.identifiedWeaknesses) ? parsed.identifiedWeaknesses : ['Urgency traps'],
        recommendedTopics: Array.isArray(parsed.recommendedTopics) ? parsed.recommendedTopics : ['URL inspection'],
        personalizedAdvice: parsed.personalizedAdvice || 'Always ask a trusted adult before clicking suspicious links!',
        aiModel: 'gemini-3.8-flash',
      };
    }
  } catch (error) {
    console.error('Gemini API call failed, falling back to rule-based coach:', error);
  }

  return getFallbackAiResponse(data);
}
