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
Topic: ${topic}
Exam: ${exam}

TASK:
Generate COMPLETE, FULL-LENGTH STUDY NOTES as if you are teaching the entire chapter.

IMPORTANT:
- DO NOT create short notes
- DO NOT summarize
- Explain EVERYTHING in detail
- Output must feel like reading a full chapter, not notes

DEPTH RULE:
- If exam is competitive → go DEEP (concept + derivation + reasoning)
- If exam is school → clear but still detailed explanation

STRUCTURE (natural, not forced sections):
Start from basics and go step-by-step like a teacher explaining from zero.

COVER EVERYTHING:
- Basic idea
- Full explanation of all concepts
- All types and classifications
- Why concepts work (logic)
- Real-life examples
- All formulas with explanation
- Units and conditions
- Important points
- Common mistakes
- Exam-level tricks (if needed)

VERY IMPORTANT RULES:
- Minimum 80–150 lines of explanation
- Each concept must be deeply explained
- No skipping any concept
- No one-line explanation
- Avoid too many headings — keep flow natural like a chapter
- Use paragraphs + bullet points

OUTPUT STYLE:
- Looks like a full textbook explanation
- Easy English but deep understanding
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
                max_tokens: 1500
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
        console.error("NOTES ERROR:", err.message);

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
You are a helpful teacher.

Explain the answer in:
- Very simple language
- Step by step
- Use examples if needed
- Keep it short but clear

Question:
${question}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
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
