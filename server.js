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

Rules:
- Clear explanation from basics
- Include key concepts, formulas, examples
- Use bullet points + short paragraphs
- Keep it structured and readable
- Length: 40–60 lines max

Make it exam-focused and easy to revise.
`;
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert teacher who creates detailed study notes."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
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

        let result = response.data.choices[0].message.content;

        // 🔥 CLEAN RESPONSE (important)
        result = result
            .replace(/```/g, "")
            .replace(/json/gi, "")
            .trim();

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
        const { topic, level, notes } = req.body;

    
        let difficultyInstruction = "";

        if (level === "easy") {
            difficultyInstruction = `
            - Basic conceptual questions
            - Direct theory based
            - Easy to understand
            `;
        } else if (level === "hard") {
            difficultyInstruction = `
            - Concept-based tricky questions
            - Application of concepts
            - Moderate difficulty
            `;
        } else if (level === "harder") {
            difficultyInstruction = `
            - Multi-concept questions
            - Logical reasoning required
            - Confusing options
            `;
        } else if (level === "hardest") {
            difficultyInstruction = `
            - Exam level questions (JEE/NEET/UPSC style)
            - Highly tricky and conceptual
            - Close answer options (very confusing)
            - Requires deep understanding
            `;
        }

    
        const prompt = `
Generate 5 MCQ quiz on topic: "${topic}"

Difficulty Level: ${level}

Instructions:
${difficultyInstruction}

Use these notes for context:
${notes}

⚠ STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No explanation outside JSON
- No extra text

Format:
{
  "quiz": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correct_answer_index": 0,
      "explanation": "",
      "subTopic": ""
    }
  ]
}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let raw = response.data.choices[0].message.content;

      
        raw = raw
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

    
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.log("JSON Parse Failed:", raw);
            return res.status(500).json({ error: "Invalid JSON from AI" });
        }

    
        res.json(parsed);

    } catch (err) {
        console.log(" Server Error:", err.message);
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
