import { google } from "@ai-sdk/google"

// Initialize Google AI client with API key
export const geminiConfig = {
  apiKey: process.env.GOOGLE_API_KEY,
}

// Export configured models
export const geminiPro = () => google("gemini-1.5-flash") // Use Flash instead of Pro for higher quotas
export const geminiFallback = () => google("gemini-1.0-pro") // Fallback to 1.0 if needed
