import express from "express";
import { askGroq } from "../utils/geminiClient.js";
import { getRagContext } from "../utils/ragContext.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { message, healthProfile } = req.body;

  const context = await getRagContext(message);

  const prompt = `
You are Smart Dine, a food recommendation assistant.
Use ONLY the menu items below.

MENU CONTEXT:
${context}

User health profile:
${JSON.stringify(healthProfile)}

User query:
"${message}"

Respond with:
- Dish name
- Restaurant suitability
- Health reasoning
Mention restaurant name explicitly.
`;

  const reply = await askGroq(prompt);
  res.json({ reply });
});

export default router;