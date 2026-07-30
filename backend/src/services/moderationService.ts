import axios from 'axios';

export interface ModerationResult {
  flagged: boolean;
  score: number;
  provider: 'openai' | 'perspective' | 'none';
  raw?: any;
}

const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';
const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

export async function moderateContent(text: string): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { flagged: false, score: 0, provider: 'none' };
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const response = await axios.post(
        OPENAI_MODERATION_URL,
        { input: text },
        {
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data?.results?.[0];
      const categoryScores = result?.category_scores || {};
      const scores = Object.values(categoryScores).map((score: any) => Number(score ?? 0));
      const maxScore = scores.length ? Math.max(...scores) : 0;

      return {
        flagged: Boolean(result?.flagged),
        score: Number(maxScore.toFixed(4)),
        provider: 'openai',
        raw: result,
      };
    } catch (error) {
      console.error('OpenAI Moderation API failed:', error);
    }
  }

  const perspectiveKey = process.env.PERSPECTIVE_API_KEY;
  if (perspectiveKey) {
    try {
      const response = await axios.post(
        `${PERSPECTIVE_API_URL}?key=${perspectiveKey}`,
        {
          comment: { text },
          languages: ['en'],
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            IDENTITY_ATTACK: {},
            INSULT: {},
            PROFANITY: {},
            SEXUALLY_EXPLICIT: {},
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const scores = response.data?.attributeScores || {};
      const toxicity = Number(scores.TOXICITY?.summaryValue?.value ?? 0);
      const severeToxicity = Number(scores.SEVERE_TOXICITY?.summaryValue?.value ?? 0);
      const identityAttack = Number(scores.IDENTITY_ATTACK?.summaryValue?.value ?? 0);
      const insult = Number(scores.INSULT?.summaryValue?.value ?? 0);
      const profanity = Number(scores.PROFANITY?.summaryValue?.value ?? 0);
      const sexuallyExplicit = Number(scores.SEXUALLY_EXPLICIT?.summaryValue?.value ?? 0);

      const flagged =
        toxicity > 0.8 ||
        severeToxicity > 0.7 ||
        identityAttack > 0.7 ||
        insult > 0.75 ||
        profanity > 0.8 ||
        sexuallyExplicit > 0.7;

      return {
        flagged,
        score: Number(toxicity.toFixed(4)),
        provider: 'perspective',
        raw: response.data,
      };
    } catch (error) {
      console.error('Perspective API failed:', error);
    }
  }

  return { flagged: false, score: 0, provider: 'none' };
}
