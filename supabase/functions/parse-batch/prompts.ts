/**
 * AI Prompts for Batch Entry parsing
 * Used by Gemini 2.0 Flash to extract transactions from text, images, or transcribed audio
 */

import { generateCategoryKeywordsForPrompt, ALL_CATEGORY_IDS } from "./categories.ts";

/**
 * Get the system prompt with current date injected
 */
export function getSystemPrompt(currentDate: string): string {
  const categoryKeywords = generateCategoryKeywordsForPrompt();

  return `You are a financial assistant specialized in extracting transactions from text, transcribed audio, or receipt images for a personal budget app.

CONTEXT:
- The app supports multiple languages: English, Spanish, French, Portuguese
- User input may be in ANY of these languages
- User may mention multiple transactions in a single input
- Current date: ${currentDate}

CURRENCY INTERPRETATION:
The user's currency is determined by context. Common patterns:

Colombian Peso (COP):
- "mil" or "lucas" = multiply by 1,000 (e.g., "50 mil" = 50000, "una luca" = 1000)
- "palo" or "millón" = multiply by 1,000,000 (e.g., "2 palos" = 2000000)
- "barras" = multiply by 1,000 (e.g., "50 barras" = 50000)
- Numbers with dots as thousands: "50.000" = 50000

Brazilian Real (BRL):
- "conto" or "pau" = 1,000 (e.g., "2 contos" = 2000)
- "real", "reais", "R$"

Euro (EUR):
- "euros", "€"

US Dollar (USD):
- "dollars", "bucks", "$"

General rule: Small numbers without units in expense context likely mean the local equivalent of hundreds or thousands.
Always return amounts as positive integers.

DATE INTERPRETATION (Multi-language):
English: today, yesterday, last week, Monday/Tuesday/etc
Spanish: hoy, ayer, anteayer, la semana pasada, el lunes/martes/etc
French: aujourd'hui, hier, avant-hier, la semaine dernière, lundi/mardi/etc
Portuguese: hoje, ontem, anteontem, semana passada, segunda/terça/etc

- If no date specified, use current date
- Output format always: YYYY-MM-DD

${categoryKeywords}

EXTRACTION RULES:
1. Extract ALL transactions mentioned, no limit
2. Amounts are ALWAYS positive numbers ("type" indicates expense/income)
3. If amount is missing or ambiguous, use 0 and set "needsReview": true
4. If category is unclear, use "miscellaneous" for expenses or "other_income" for income
5. "confidence" is your certainty level from 0.0 to 1.0 for each transaction
6. Payments or purchases are "expense"; receiving money is "income"
7. The "name" field should be a SHORT description (1-3 words) IN THE SAME LANGUAGE as the input
8. The "rawInterpretation" should summarize what you understood IN THE SAME LANGUAGE as the input

CRITICAL LANGUAGE RULE:
All text fields (name, notes, rawInterpretation) MUST be in the SAME LANGUAGE as the user's input.
- If user speaks Spanish → respond in Spanish (e.g., "Inversión Bitcoin", not "Bitcoin investment")
- If user speaks Portuguese → respond in Portuguese
- If user speaks French → respond in French
- If user speaks English → respond in English

OUTPUT FORMAT:
- Respond ONLY with valid JSON
- Do NOT include markdown, explanations, or additional text
- Do NOT use \`\`\`json or any wrapper`;
}

/**
 * Get category enum for JSON schema
 */
export function getCategoryEnum(): string[] {
  return ALL_CATEGORY_IDS;
}

/**
 * JSON Schema for structured output
 * Used with Gemini's responseSchema feature
 */
export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    transactions: {
      type: "array",
      description: "List of extracted transactions",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Transaction type"
          },
          name: {
            type: "string",
            description: "Short description (1-3 words) in the SAME LANGUAGE as user input"
          },
          category: {
            type: "string",
            enum: [
              // Expense categories
              "food_drink",
              "home_utilities",
              "transport",
              "health",
              "shopping",
              "entertainment",
              "education",
              "travel",
              "financial",
              "family",
              "pets",
              "gifts",
              "personal_care",
              "subscriptions",
              "miscellaneous",
              // Income categories
              "primary_income",
              "secondary_income",
              "investment_income",
              "business_income",
              "government",
              "other_income"
            ],
            description: "Category ID"
          },
          amount: {
            type: "number",
            description: "Amount (always positive integer)"
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format"
          },
          notes: {
            type: "string",
            description: "Optional additional notes"
          },
          needsReview: {
            type: "boolean",
            description: "True if AI is uncertain about any field"
          },
          confidence: {
            type: "number",
            description: "Confidence score from 0.0 to 1.0"
          }
        },
        required: ["type", "name", "category", "amount", "date", "needsReview", "confidence"]
      }
    },
    overallConfidence: {
      type: "number",
      description: "Overall confidence of the extraction (0.0 to 1.0)"
    },
    rawInterpretation: {
      type: "string",
      description: "Brief summary of what was understood from the input (same language as input)"
    }
  },
  required: ["transactions", "overallConfidence"]
};

/**
 * Example few-shot prompts for better accuracy
 */
export const FEW_SHOT_EXAMPLES = [
  {
    input: "Gasté 50 mil en almuerzo y 30 mil en uber",
    output: {
      transactions: [
        {
          type: "expense",
          name: "Almuerzo",
          category: "food_drink",
          amount: 50000,
          date: "2026-02-03",
          needsReview: false,
          confidence: 0.95
        },
        {
          type: "expense",
          name: "Uber",
          category: "transport",
          amount: 30000,
          date: "2026-02-03",
          needsReview: false,
          confidence: 0.95
        }
      ],
      overallConfidence: 0.95,
      rawInterpretation: "Dos gastos: almuerzo por 50,000 COP y transporte Uber por 30,000 COP"
    }
  },
  {
    input: "Me pagaron el sueldo, 2 palos",
    output: {
      transactions: [
        {
          type: "income",
          name: "Salario",
          category: "primary_income",
          amount: 2000000,
          date: "2026-02-03",
          needsReview: false,
          confidence: 0.98
        }
      ],
      overallConfidence: 0.98,
      rawInterpretation: "Ingreso de salario por 2,000,000 COP"
    }
  },
  {
    input: "Invertí 200 mil en bitcoin",
    output: {
      transactions: [
        {
          type: "expense",
          name: "Inversión Bitcoin",
          category: "financial",
          amount: 200000,
          date: "2026-02-03",
          needsReview: false,
          confidence: 0.95
        }
      ],
      overallConfidence: 0.95,
      rawInterpretation: "Inversión de 200,000 COP en Bitcoin"
    }
  }
];
