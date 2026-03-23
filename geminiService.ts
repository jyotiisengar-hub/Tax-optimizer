
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType, Category, BehavioralProfile } from "./types";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'ISO date string (YYYY-MM-DD). Use the statement period to determine the correct year if the year is missing from the transaction line.' },
          merchant: { type: Type.STRING },
          person: { type: Type.STRING, description: 'The account holder name found in the statement' },
          amount: { type: Type.NUMBER },
          currency: { type: Type.STRING, description: 'The ISO currency code (e.g., USD, INR)' },
          type: { type: Type.STRING, enum: ['INCOME', 'EXPENSE'] },
          category: { type: Type.STRING, enum: Object.values(Category) },
          rawDescription: { type: Type.STRING }
        },
        required: ['date', 'merchant', 'person', 'amount', 'currency', 'type', 'category']
      }
    }
  }
};

interface ParseOptions {
  base64Data?: string;
  mimeType?: string;
  textData?: string;
}

export const parseStatement = async (options: ParseOptions): Promise<Transaction[]> => {
  // Use process.env.API_KEY directly and initialize right before use
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { base64Data, mimeType, textData } = options;
  
  const parts: any[] = [];
  
  if (textData) {
    parts.push({ text: `Below is the content of a financial statement extracted as text:\n\n${textData}` });
  } else if (base64Data && mimeType) {
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    });
  } else {
    throw new Error("Missing data for statement parsing");
  }

  parts.push({
    text: `Extract all financial transactions from the provided document data. 
    
    DATE EXTRACTION RULES (CRITICAL):
    - Be extremely accurate with dates. DO NOT hallucinate dates or years.
    - If a transaction only shows 'Oct 22', look at the statement header to determine the correct YEAR (e.g., 2024). 
    - DO NOT default to 2022 or any other year unless it is explicitly written or clearly implied by the statement period.
    - If the statement is for a period in 2024, all transactions must reflect that year.
    - Double check that every transaction date returned actually exists in the source document.

    OTHER RULES:
    - Detect the currency (e.g., INR, USD). 
    - Identify the person/account holder for each transaction. 
    
    IMPORTANT CATEGORIZATION RULES:
    1. Categories: Groceries, Utilities, Rent, Mortgage, Transport, Dining, Shopping, Health, Entertainment, Car Payment, Salary, Interest, Investment, Self Transfer, or Others.
    
    3. SPECIFIC IDENTIFICATION:
       - MORTGAGE: Any transaction related to mortgage payments, home loans, or property financing MUST be categorized as 'Mortgage' and its type MUST be 'EXPENSE'. It is NEVER an income.
       - INTEREST: Any credit transaction from the bank labeled as "Interest", "Savings Interest", "Int. Paid", usually occurring at month-end.
       - INVESTMENT: Any transaction involving Mutual Funds, SIPs, Brokerage transfers (e.g., Zerodha, Vanguard, Charles Schwab), or purchases of Stocks/Bonds.
    
    3. SELF TRANSFER IDENTIFICATION (BE CONSERVATIVE):
       - ONLY categorize as 'Self Transfer' if the description explicitly mentions 'Self', 'Internal Transfer', 'Account Transfer', or indicates a transfer between accounts owned by the EXACT SAME person.
       - DO NOT categorize payments to other individuals as 'Self Transfer' at this stage unless they are clearly internal movements. 
       - If it's a payment to a merchant or another person, use other categories or 'Others'.
    
    Return as JSON.`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    // Correctly structured contents object for multiple parts
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      thinkingConfig: { thinkingBudget: 0 } 
    },
  });

  // Accessing text as a property, not a method
  const json = JSON.parse(response.text || "{\"transactions\": []}");
  return json.transactions.map((t: any) => ({
    ...t,
    id: crypto.randomUUID(),
    type: t.type as TransactionType,
    category: t.category as Category,
    currency: t.currency || 'USD' 
  }));
};

export const queryKnowledgeBase = async (transactions: Transaction[], query: string, history: { role: 'user' | 'assistant', content: string }[] = [], country: string = 'USA'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a condensed version of transactions to save tokens while providing enough info
  const transactionContext = transactions.map(t => ({
    d: t.date,
    m: t.merchant,
    p: t.person,
    a: t.amount,
    c: t.currency,
    t: t.type,
    cat: t.category
  }));

  const systemInstruction = `
    You are a professional financial analyst for a household in ${country}. 
    You have access to the user's transaction history. 
    Your goal is to answer questions accurately based ONLY on the provided data, the recent conversation history, and ${country} taxation laws.
    
    DATA FORMAT:
    d: date, m: merchant, p: person, a: amount, c: currency, t: type (INCOME/EXPENSE), cat: category.
    
    TERMINOLOGY:
    - Use "Earnings" instead of "Inflow" or "Income".
    - Use "Expenses" instead of "Outflow" or "Spending".
    
    GUIDELINES:
    - If asked for totals, calculate them precisely.
    - If asked for trends, identify patterns over months.
    - If asked about a specific person, filter the data for that person.
    - If the data doesn't contain the answer, say so politely.
    - Keep responses concise but helpful.
    - Use bullet points for lists.
    - Use currency symbols where appropriate.
    - FORMATTING: 
      - Start a new line after every full sentence to improve readability.
      - If displaying multiple line items, transactions, or data points, ALWAYS use a Markdown table format.
    - GROUNDING: Use ${country} tax rules for any tax-related advice.
    - Current date is ${new Date().toISOString().split('T')[0]}.
  `;

  const contents: any[] = [
    { text: `Context (Transactions): ${JSON.stringify(transactionContext)}` }
  ];

  // Add history (last 2 questions/answers)
  history.forEach(h => {
    contents.push({ text: `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}` });
  });

  contents.push({ text: `User Query: ${query}` });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      systemInstruction,
      temperature: 0.2, // Low temperature for factual accuracy
    },
  });

  return response.text || "I couldn't generate a response. Please try again.";
};

export const getTaxSuggestions = async (transactions: Transaction[], country: string = 'USA'): Promise<{ id: string, title: string, description: string, category: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const transactionContext = transactions.map(t => ({
    d: t.date,
    m: t.merchant,
    p: t.person,
    a: t.amount,
    c: t.currency,
    t: t.type,
    cat: t.category
  }));

  const systemInstruction = `
    You are a senior tax consultant specializing in ${country} taxation. Analyze the household financial data and provide a list of specific, actionable tax-saving items relevant to ${country} tax laws.
    Each item must be a concrete action the user can take.
    
    Return the response as a JSON object with a "suggestions" array.
    Each suggestion should have:
    - id: a unique string ID (slug format)
    - title: short action-oriented title
    - description: clear explanation of why and how, referencing ${country} tax rules
    - category: e.g., "Investment", "Deduction", "Family", "Business"
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { text: `Data: ${JSON.stringify(transactionContext)}` },
      { text: "Provide a list of actionable tax-saving items." }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ['id', 'title', 'description', 'category']
            }
          }
        },
        required: ['suggestions']
      }
    },
  });

  try {
    const data = JSON.parse(response.text || '{"suggestions": []}');
    return data.suggestions;
  } catch (e) {
    return [];
  }
};

export const getBehavioralProfile = async (transactions: Transaction[]): Promise<BehavioralProfile | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const transactionContext = transactions.map(t => ({
    d: t.date,
    m: t.merchant,
    a: t.amount,
    c: t.currency,
    t: t.type,
    cat: t.category
  }));

  const systemInstruction = `
    You are a world-class behavioral finance AI embedded inside "Household CFO".
    Your task is to analyze a user's financial transaction data and assign them scores (0–100) across multiple financial archetypes.
    
    Archetypes to evaluate and their detection heuristics:
    1. Impulse Spender: Many small transactions, frequent discretionary categories.
    2. Security Seeker: Consistent savings, low risk in spending.
    3. Optimizer: High value-for-money, efficient spending.
    4. Avoider: Lack of structured spending categories or financial engagement.
    5. Status Spender: High-end brands, luxury categories.
    6. Convenience Buyer: High share of delivery, cab, quick commerce.
    7. Emotional Spender: Clusters of transactions within short time windows, late night spending patterns.
    8. Aspirational Investor: Irregular investments.
    9. Over-Optimizer: Frequent transfers, multiple accounts, reward chasing.
    10. Lifestyle Inflator: Increase in monthly spend after income increase.
    11. Social Spender: Weekend spikes, group expense categories.
    12. Safety Hoarder: High balance retention, low investment outflows.
    13. Goal-Oriented Planner: Structured saving and spending towards goals.
    14. Subscription Drifter: Recurring payments across multiple services.

    Scoring guidelines:
    - 0–30: weak presence
    - 31–60: moderate tendency
    - 61–100: strong behavioral pattern

    You must:
    1. Detect behavioral signals from transaction patterns (frequency, categories, merchant types, timing).
    2. Assign a score (0–100) for EACH of the 14 archetypes.
    3. Provide a concise reasoning for each score based on the data.
    4. Generate a short, insightful narrative (2-3 sentences) explaining the user's overall financial personality.
    5. Suggest 2–3 actionable behavioral nudges (title and description) to improve their financial health.

    Tone: Professional, insightful, and non-judgmental.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      { text: `Data: ${JSON.stringify(transactionContext)}` },
      { text: "Analyze the transaction data and provide a comprehensive behavioral profile across all 14 archetypes." }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          archetypes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                archetype: { type: Type.STRING },
                score: { type: Type.NUMBER },
                reasoning: { type: Type.STRING }
              },
              required: ['archetype', 'score', 'reasoning']
            }
          },
          narrative: { type: Type.STRING },
          nudges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['title', 'description']
            }
          }
        },
        required: ['archetypes', 'narrative', 'nudges']
      }
    },
  });

  try {
    return JSON.parse(response.text || 'null');
  } catch (e) {
    return null;
  }
};
