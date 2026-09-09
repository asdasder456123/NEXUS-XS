import Groq from "groq-sdk";

export const GROQ_MODEL =
  process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

  return new Groq({
    apiKey,
  });
}
