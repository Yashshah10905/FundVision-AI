import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Simple in-memory cache for financial advice to reduce API calls
const adviceCache: { [key: string]: { text: string, timestamp: number } } = {};
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

/**
 * Helper to handle retries with exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 500));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function categorizeTransaction(description: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key missing. Defaulting to 'Other'.");
    return "Other";
  }

  try {
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Categorize this bank transaction description into one of these categories: Dining, Transport, Utilities, Lifestyle, Shopping, Health, Income, Other. 
        Description: "${description}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "The category name",
              },
            },
            required: ["category"],
          },
        },
      });

      const result = JSON.parse(response.text || '{"category": "Other"}');
      return result.category || "Other";
    });
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return "Other";
  }
}

export async function getFinancialAdvice(transactions: any[], budget: any, currency: string = 'USD'): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return "AI insights are currently unavailable. Please configure your Gemini API key.";
  }

  // Generate a cache key based on data signature
  const cacheKey = `${currency}-${JSON.stringify(transactions.slice(0, 5))}-${JSON.stringify(budget)}`;
  const cached = adviceCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.text;
  }

  try {
    const advice = await withRetry(async () => {
      const prompt = `As a financial advisor, analyze this data and give a short, actionable insight (max 2 sentences).
      Current Month Transactions: ${JSON.stringify(transactions)}
      Monthly Budget: ${JSON.stringify(budget)}
      User Currency: ${currency}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: `You are a concise financial advisor. Focus on spending patterns and budget adherence. Always use the user's preferred currency (${currency}) when mentioning amounts.`
        }
      });

      return response.text || "Keep tracking your expenses to see insights!";
    });

    // Update cache
    adviceCache[cacheKey] = { text: advice, timestamp: Date.now() };
    return advice;
  } catch (error: any) {
    console.error("Error getting financial advice:", error);
    if (error?.message?.includes('429') || error?.status === 429) {
      return "The AI is currently busy processing many requests. Please check back in a few minutes for fresh insights.";
    }
    return "Unable to generate insights at this time.";
  }
}

export async function startFinancialChat(history: any[], transactions: any[], budget: any, currency: string = 'USD') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key missing");
  }

  const context = `You are the core financial analysis engine for FundVision. Your role is to analyze user transaction data and provide clear, actionable budgeting insights.

  CRITICAL INSTRUCTION: You must never use Markdown, asterisks, or raw text tables. You must strictly output your entire response as a valid JSON object.

  Structure your JSON response with the following keys:
  summary: A short, 1-2 sentence overview of the user's financial health.
  budgetData: An array of objects comparing budget limits to actual spending. Each object must have category, budgetLimit, actualSpending, and status (e.g., "Under Budget", "Over Budget").
  actionableTips: An array of 2-3 specific string recommendations based on their spending.

  User Data Context:
  Recent Transactions: ${JSON.stringify(transactions.slice(0, 20))}
  Current Budget: ${JSON.stringify(budget)}
  Preferred Currency: ${currency}

  When mentioning amounts in the JSON values, always use the user's preferred currency (${currency}).`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: context
    },
    history: history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
  });

  return chat;
}
