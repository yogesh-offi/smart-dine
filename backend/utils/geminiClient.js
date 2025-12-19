import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function askGroq(prompt) {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "No response";
  } catch (err) {
    console.error("❌ Groq Error:", err.message);
    return "Groq error";
  }
}
