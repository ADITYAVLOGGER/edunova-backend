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
Generate COMPLETE, well-structured, and high-quality study notes.

DEPTH CONTROL:
- If exam is competitive (JEE, NEET, UPSC, etc.) → explain concepts deeply with logic, reasoning, and examples.
- If exam is school/boards → explain in simple and clear language.
- Always match explanation level with exam.

FORMAT (IMPORTANT):
Do NOT use "PART 1, PART 2" or similar.

Use proper headings like:

Introduction  
Definition  
Types / Classification  
Detailed Explanation  
Formulas / Key Points  
Exam Tips / Summary  

CONTENT RULES:
- Introduction → concept ko clearly samjhao (8–10 lines)
- Definition → proper + keywords highlight
- Types → ALL types cover karo (skip mat karo)
- Detailed Explanation → sabse important  
  → step-by-step  
  → WHY + HOW explain karo  
  → examples do  
  → competitive exam ke liye deep logic do  
- Formulas → formulas + units + conditions
- Summary → tricks + mistakes + quick revision

STRICT RULES:
- Short notes mat banana 
- Explanation compress mat karna 
- Har section detailed hona chahiye
- Output textbook jaisa feel hona chahiye
- Clean headings use karo
- Bullet points + paragraphs dono use karo
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
