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
Teach this topic like a FULL CHAPTER from a textbook.

DEPTH RULE:
- Competitive exams → deep + conceptual + reasoning + derivations
- School exams → simple but still detailed

IMPORTANT:
- Do NOT summarize
- Do NOT shorten explanation
- Explain everything step-by-step from basics

CONTENT REQUIREMENTS:
You MUST cover:

1. Basic Concept (start from zero)
2. Full Explanation of all ideas
3. All types / classifications
4. Why the concept works (logic)
5. Real-life examples
6. All formulas (with explanation + units)
7. Common mistakes
8. Important exam tricks

STRICT RULES:
- Minimum 120+ lines
- No skipping any concept
- Each point must be explained clearly
- Avoid 1-line answers
- Make it feel like reading a full chapter

STYLE:
- Natural flow like a teacher explaining
- Use paragraphs + bullet points
- Keep it readable and engaging
`;
        const response = await axios.post(
             "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
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
                max_tokens: 3000
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
        console.error("FULL ERROR:", err.response?.data || err.message);
        res.status(500).json({
            error: "Notes generation failed"
        });
    }
});


// ---------------- QUIZ ----------------
app.post("/quiz", async (req, res) => {
    try {
        const { topic } = req.body

        const response = await axios.post(
             "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [{
                    role: "user",
                    content: `Generate 5 MCQ quiz on ${topic} with:
                    question, 4 options, correct answer index, and explanation in JSON format`
                }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        res.json({ result: response.data.choices[0].message.content })

    } catch (err) {
        res.status(500).json({ error: "Quiz failed" })
    }
})

// ---------------- DOUBT SOLVER ----------------
app.post("/doubt", async (req, res) => {
    try {
        const { question } = req.body

        const response = await axios.post(
             "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [{
                    role: "user",
                    content: `Solve this doubt in simple student friendly way: ${question}`
                }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        res.json({ result: response.data.choices[0].message.content })

    } catch (err) {
        res.status(500).json({ error: "Doubt failed" })
    }
})


// ---------------- SERVER ----------------
app.listen(3000, () => {
    console.log("EduNova AI Backend running on port 3000")
})
