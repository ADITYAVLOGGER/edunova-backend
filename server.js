const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ======================= NOTES API =======================
app.post("/notes", async (req, res) => {
    try {
        const { topic, exam = "NEET" } = req.body;

        const prompt = `
Topic: ${topic}
Exam: ${exam}

TASK:
Create COMPLETE textbook-style notes in EASY ENGLISH so that a beginner student can understand in one reading.

STRICT FORMAT (VERY IMPORTANT):

PART 1: Introduction
- Explain basic idea in simple words
- Add real-life example

PART 2: Definition
- Clear definition
- Highlight keywords

PART 3: Types / Classification
- List all types
- Explain briefly

PART 4: Detailed Explanation
- Step-by-step explanation
- Add examples

PART 5: Formulas / Important Points
- All formulas
- Important facts

PART 6: PYQ Tricks / Summary
- Exam tricks
- Common mistakes

RULES:
- Very simple English
- Use bullet points
- Do NOT skip any PART
- Each PART must be complete
- Output ONLY text (no markdown, no extra text)
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a NEET tutor. Always follow PART format strictly."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
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
        console.error("NOTES ERROR:", err.message);
        res.status(500).json({ error: "Notes failed" });
    }
});


// ======================= QUIZ API =======================
app.post("/quiz", async (req, res) => {
    try {
        const { topic, level, notes = "", seenQuestions = [] } = req.body;

        // 🎯 LEVEL LOGIC
        let levelInstruction = "";
        switch (level) {
            case "easy":
                levelInstruction = "very basic, definition-based MCQs";
                break;
            case "hard":
                levelInstruction = "concept-based tricky MCQs";
                break;
            case "harder":
                levelInstruction = "application-based multi-step MCQs";
                break;
            case "hardest":
                levelInstruction = "exam-level toughest MCQs like NEET/JEE";
                break;
            default:
                levelInstruction = "balanced difficulty MCQs";
        }

        const prompt = `
Generate 5 UNIQUE MCQ questions.

TOPIC: ${topic}
LEVEL: ${levelInstruction}

VERY IMPORTANT:

1. ONLY generate questions from THIS content:
${notes}

2. DO NOT go outside this content
3. DO NOT repeat these questions:
${seenQuestions.join("\n")}

4. Questions must be different from each other

5. Output ONLY VALID JSON:

{
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_answer_index": 0,
      "explanation": "simple explanation",
      "subTopic": "topic name"
    }
  ]
}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a strict JSON generator. Only return valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.6
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        let result = response.data.choices[0].message.content;

        // 🔥 CLEAN JSON (IMPORTANT FIX)
        result = result
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        res.json({ result });

    } catch (err) {
        console.error("QUIZ ERROR:", err.message);
        res.status(500).json({ error: "Quiz failed" });
    }
});


// ======================= SERVER =======================
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
