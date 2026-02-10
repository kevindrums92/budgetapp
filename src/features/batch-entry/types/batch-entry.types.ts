/**
 * AI Batch Entry Types
 * Types for the AI-powered batch transaction entry feature
 */

/** Input type for batch entry */
export type BatchInputType = "text" | "image" | "audio";

/** A draft transaction extracted by AI, pending user confirmation */
export type TransactionDraft = {
  /** Temporary UUID for UI tracking */
  id: string;
  /** Transaction type */
  type: "income" | "expense";
  /** Description extracted by AI */
  name: string;
  /** Category ID (must match existing category) */
  category: string;
  /** Amount in COP (always positive) */
  amount: number;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Optional notes */
  notes?: string;
  /** Flag if AI is uncertain and needs user review */
  needsReview: boolean;
  /** AI confidence score (0-1) */
  confidence: number;
};

/**
 * A transaction pattern from user's history
 * Used to improve AI category matching and fill missing amounts
 */
export type HistoryPattern = {
  /** Normalized transaction name */
  name: string;
  /** Most common category ID for this name */
  category: string;
  /** Average amount for this transaction */
  avgAmount: number;
  /** Number of times this pattern was seen */
  occurrences: number;
  /** Transaction type */
  type: "income" | "expense";
};

/** Request payload sent to Edge Function */
export type BatchEntryRequest = {
  /** Type of input being sent */
  inputType: BatchInputType;
  /** Free-form text input */
  data?: string;
  /** Base64-encoded compressed image */
  imageBase64?: string;
  /** Base64-encoded audio recording */
  audioBase64?: string;
  /** MIME type of the audio recording (e.g., "audio/webm", "audio/aac", "audio/mp4") */
  audioMimeType?: string;
  /** User's local date in YYYY-MM-DD format (to handle timezone correctly) */
  localDate?: string;
  /** User's transaction history patterns for better matching */
  historyPatterns?: HistoryPattern[];
};

/** Response from Edge Function */
export type BatchEntryResponse = {
  /** Whether processing succeeded */
  success: boolean;
  /** Extracted transactions */
  transactions: TransactionDraft[];
  /** Overall confidence of the extraction */
  confidence: number;
  /** Raw AI interpretation for debugging */
  rawInterpretation?: string;
  /** Error message if failed */
  error?: string;
};

/** State for the batch entry UI */
export type BatchEntryState = {
  /** Selected input type */
  inputType: BatchInputType | null;
  /** Whether currently recording audio */
  isRecording: boolean;
  /** Whether processing with AI */
  isProcessing: boolean;
  /** Extracted transaction drafts */
  drafts: TransactionDraft[];
  /** Error message if any */
  error: string | null;
};

/** Recording state for voice input */
export type RecordingState = {
  /** Whether recording is in progress */
  isRecording: boolean;
  /** Duration in seconds */
  duration: number;
  /** Error message */
  error: string | null;
};

/** Image capture state */
export type ImageCaptureState = {
  /** Base64 preview of selected/captured image */
  imagePreview: string | null;
  /** Whether image is being compressed */
  isCompressing: boolean;
  /** Error message */
  error: string | null;
};
