// Initialises a single Groq client for the whole server.
// Imported by AiController nowhere else.

import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not set in environment variables.");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default groq;
