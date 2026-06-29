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
app.post("/quiz", async (req, res) => {
    try {
        const { topic } = req.body

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
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
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
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
