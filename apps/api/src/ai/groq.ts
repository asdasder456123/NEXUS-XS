import Groq from "groq-sdk";

export const GROQ_MODEL =
  process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

console.log("[AI] GROQ_API_KEY configured:", Boolean(process.env.GROQ_API_KEY));
console.log("[AI] GROQ_MODEL:", GROQ_MODEL);

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing or empty");
  }

  return new Groq({
    apiKey,
  });
}
