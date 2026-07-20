require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// 🔥 FIXED AI FUNCTION WITH RETRY
async function callAI(prompt) {

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {

            console.log("📤 Calling AI... Attempt:", attempt);
console.log("KEY:", process.env.API_KEY);
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "mistralai/mistral-7b-instruct", // 🔥 more stable free model
                    messages: [
                        {
                            role: "system",
                            content: "You are a smart study assistant. Give short Hinglish notes."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 700
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 20000
                }
            );

            const text = response.data?.choices?.[0]?.message?.content;

            if (text) {
                console.log("✅ AI SUCCESS");
                return text;
            }

        } catch (err) {
            console.log("❌ AI ERROR:", err.response?.data || err.message);
        }
    }

    return null;
}

// ================= NOTES =================
app.post("/notes", async (req, res) => {

    const { topic, exam } = req.body;
    console.log("📥 REQUEST:", topic, exam);

    if (!topic) {
        return res.status(400).json({ result: "Enter topic" });
    }

    const prompt = `
Generate study notes:

Topic: ${topic}
Exam: ${exam}

Rules:
- Hinglish
- 6-8 bullet points
- Short + exam focused
`;

    const result = await callAI(prompt);

    // 🔥 FALLBACK (IMPORTANT)
    if (!result) {
        return res.status(200).json({
            result: `
⚠️ Server busy but don't stop studying 💪

Topic: ${topic}

Quick Notes:
• Definition samjho
• Important formulas yaad karo
• Concepts clear rakho
• PYQs practice karo
• Short revision notes banao

👉 Retry after few seconds for detailed notes
`
        });
    }

    res.json({ result });
});

// ================= QUIZ =================
app.post("/quiz", async (req, res) => {

    const { topic } = req.body;

    const prompt = `
Generate 5 MCQs on "${topic}"

Return JSON only:
{
 "quiz":[
  {
   "question":"string",
   "options":["A","B","C","D"],
   "correct_answer_index":0,
   "explanation":"string"
  }
 ]
}
`;

    const raw = await callAI(prompt);

    if (!raw) return res.json({ quiz: [] });

    try {
        const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        return res.json(JSON.parse(clean));
    } catch {
        return res.json({ quiz: [] });
    }
});

// ================= DOUBT =================
app.post("/doubt", async (req, res) => {

    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ result: "Enter question" });
    }

    const prompt = `
Explain in simple Hinglish:

${question}

- step by step
- short
`;

    const result = await callAI(prompt);

    if (!result) {
        return res.json({ result: "⚠️ Try again later" });
    }

    res.json({ result });
});

app.get("/test", async (req, res) => {

    const result = await callAI("Hello, test message");

    if (result) {
        res.send("✅ API WORKING: " + result);
    } else {
        res.send("❌ API NOT WORKING");
    }

});

// ================= SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Server running on ${PORT}`);
});
