require("dotenv").config()
const express = require("express")
const axios = require("axios")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

// ---------------- NOTES ----------------
app.post("/notes", async (req, res) => {
    try {
        const { topic, exam = "General" } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        const prompt = `
Generate detailed study notes on "${topic}" for ${exam}.

- Start from basics
- Explain concepts clearly
- Add formulas and examples
- Use bullet points
- Keep it exam focused
- 40–60 lines max
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.6,
                max_tokens: 800
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const result = response.data.choices[0].message.content;

        res.json({ result });

    } catch (err) {
        console.error("NOTES ERROR:", err.response?.data || err.message);

        res.status(500).json({
            error: "Notes generation failed"
        });
    }
});

// ---------------- QUIZ ----------------
// const express = require("express");
// const axios = require("axios");

// const app = express();
// app.use(express.json());

app.post("/quiz", async (req, res) => {
    try {
        const { topic, level = "easy", notes = "" } = req.body;

        let difficultyInstruction = "";

        if (level === "easy") {
            difficultyInstruction = "Basic conceptual, direct questions";
        } else if (level === "hard") {
            difficultyInstruction = "Concept-based and application questions";
        } else if (level === "harder") {
            difficultyInstruction = "Multi-concept and logical reasoning questions";
        } else if (level === "hardest") {
            difficultyInstruction = "Exam-level tricky and deep conceptual questions";
        }

        // 🔥 LIMIT NOTES (VERY IMPORTANT)
        const shortNotes = notes.substring(0, 1200);

        const prompt = `
Generate 5 MCQs on "${topic}"

Difficulty: ${difficultyInstruction}

Use context:
${shortNotes}

Return ONLY valid JSON.

FORMAT:
{
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_answer_index": 0,
      "explanation": "string",
      "subTopic": "string"
    }
  ]
}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini", // ✅ FIXED MODEL
                messages: [
                    {
                        role: "system",
                        content: "You are a quiz generator that ONLY returns valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 800 // ✅ SAFE LIMIT
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let raw = response.data.choices[0].message.content;

        // 🔥 CLEAN RESPONSE
        raw = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let parsed;

        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.log("❌ JSON Parse Failed:", raw);

            // 🔥 FALLBACK (VERY IMPORTANT)
            return res.json({
                quiz: [
                    {
                        question: `Basic question on ${topic}?`,
                        options: ["Option A", "Option B", "Option C", "Option D"],
                        correct_answer_index: 0,
                        explanation: "Fallback explanation",
                        subTopic: topic
                    }
                ]
            });
        }

        res.json(parsed);

    } catch (err) {
        console.log("❌ SERVER ERROR:", err.response?.data || err.message);

        res.status(500).json({ error: "Quiz failed" });
    }
});

module.exports = app;

// ---------------- DOUBT SOLVER ----------------
app.post("/doubt", async (req, res) => {
    try {
        const { question } = req.body;

        const prompt = `
Explain this question in simple steps with a short answer:

${question}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                max_tokens: 300
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 10000
            }
        );

        const reply = response.data.choices[0].message.content;

        res.json({ result: reply });

    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Doubt failed" });
    }
});


// ---------------- SERVER ----------------
app.listen(3000, () => {
    console.log("EduNova AI Backend running on port 3000")
})
