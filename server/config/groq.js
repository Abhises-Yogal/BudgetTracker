// Initialises a single Groq client for the whole server.
// If GROQ_API_KEY is missing, export a safe stub so the app can start.

import Groq from "groq-sdk";

let groq;

if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  // mark as available so callers can check
  groq.available = true;
} else {
  // Safe stub exposes the same shape used by controllers but throws when used.
  groq = {
    available: false,
    chat: {
      completions: {
        create: async () => {
          const err = new Error("GROQ_API_KEY is not set in environment variables.");
          err.status = 503;
          throw err;
        }
      }
    }
  };
}

export default groq;
