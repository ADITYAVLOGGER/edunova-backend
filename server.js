require("dotenv").config()
const express = require("express")
const axios = require("axios")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())



app.post("/notes", async (req, res) => {
    try {
        const { topic, subject, exam, level, standard, stream } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        const safeExam = exam || "General";
        const safeSubject = subject || "General";
        const safeStream = stream || "";

        let finalLevel = level;

        if (!finalLevel) {
            if (["6","7","8"].includes(standard)) finalLevel = "Beginner";
            else if (["9","10"].includes(standard)) finalLevel = "Intermediate";
            else if (["11","12"].includes(standard)) finalLevel = "Advanced";
            else finalLevel = "Beginner";
        }

        const prompt = `
You are a strict academic subject expert.

STRICT RULES:
- DO NOT show subject name in output
- DO NOT show exam name in output
- DO NOT show level in output
- DO NOT show topic in output
- DO NOT write words like CBSE, Intermediate, Mathematics
- ONLY generate notes content

Subject (internal): ${safeSubject}
Exam (internal): ${safeExam}
Level (internal): ${finalLevel}

Topic: ${topic}

Rules:
- Short bullet points
- No long paragraphs
- Simple student-friendly language
- Add formulas if needed
- Add examples
- Exam-oriented explanation

Format:

📌 Definition  
📌 Key Points  
📌 Concepts  
📌 Formula (if any)  
📌 Example  
📌 Exam Tips  

Return ONLY notes content.
No extra headings like "Subject:" or "Level:".
`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "Return clean notes only. No metadata."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const result = response.data.choices[0].message.content;

        res.json({
            result
        });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Notes failed" });
    }
});

// ---------------- QUIZ ----------------

app.post("/quiz", async (req, res) => {
    try {
        const { topic, subject, exam, level, standard, notes } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        const safeSubject = subject || "General";
        const safeExam = exam || "General";
        const safeLevel = level || "easy";

        // 🔥 SMART PROMPT (SUBJECT LOCK + CONTEXT)
        const prompt = `
You are a strict ${safeSubject} teacher.

IMPORTANT:
- Stay ONLY in ${safeSubject}
- Do NOT mix subjects
- Generate accurate exam-level questions

Topic: ${topic}
Exam: ${safeExam}
Class: ${standard || ""}
Difficulty: ${safeLevel}

${notes ? `Reference Notes:\n${notes}` : ""}

Generate 5 MCQ questions.

Rules:
- 4 options only
- One correct answer
- Include explanation
- Add subTopic
- Keep questions exam-focused

Return ONLY JSON:

{
  "quiz": [
    {
      "question": "string",
      "options": ["A","B","C","D"],
      "correct_answer_index": 0,
      "explanation": "string",
      "subTopic": "string"
    }
  ]
}
`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "Return ONLY JSON. No markdown."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;

        // 🔥 SAFE PARSE
        let parsed;
        try {
            parsed = JSON.parse(aiResponse);
        } catch (err) {
            console.error("JSON PARSE FAIL:", aiResponse);

            return res.json({
                result: JSON.stringify({
                    quiz: []
                })
            });
        }

        // 🔥 IMPORTANT FIX (STRING RETURN)
        res.json({
            result: JSON.stringify(parsed)   // ✅ ALWAYS STRING
        });

    } catch (err) {
        console.error("QUIZ ERROR:", err.response?.data || err.message);

        res.json({
            result: JSON.stringify({
                quiz: []
            })
        });
    }
});

// ---------------- DOUBT SOLVER ----------------
app.post("/doubt", async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        // 🔥 STEP 1: BLOCK UNSAFE QUESTIONS
        const blockedKeywords = [
            "dark web", "hack", "hacking", "crack password",
            "piracy", "torrent", "illegal", "drugs",
            "bomb", "weapon", "cheat exam", "bypass",
            "exploit", "carding", "phishing"
        ];

        const lowerQ = question.toLowerCase();

        if (blockedKeywords.some(word => lowerQ.includes(word))) {
            return res.json({
                result: "⚠️ This question is not allowed. Please ask study-related doubts only."
            });
        }

        // 🔥 STEP 2: SAFE PROMPT
        const prompt = `
You are a helpful student tutor.

STRICT RULES:
- Only answer educational questions
- Do NOT answer illegal, harmful, hacking, piracy, or unethical topics
- If question is unsafe, politely refuse
- Explain in simple language
- Use steps if needed

Question: ${question}
`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are a safe educational AI tutor." },
                    { role: "user", content: prompt }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({
            result: response.data.choices[0].message.content
        });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Doubt failed" });
    }
});

// ---------------- SERVER ----------------
app.listen(3000, () => {
    console.log("EduNova AI Backend running on port 3000")
})
