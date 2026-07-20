require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// 🔥 SAFE AI FUNCTION (Max Tokens increased for complete notes)
async function callAI(prompt, retry = 3) {
    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openchat/openchat-7b",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 400
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 60000 // 🔥 60 sec
            }
        );

        const content = response?.data?.choices?.[0]?.message?.content;

        if (!content) throw new Error("Empty response");

        return content;

    } catch (err) {
        console.log("❌ AI ERROR:", err.response?.data || err.message);

        // 🔁 RETRY LOGIC
        if (retry > 0) {
            console.log("🔁 Retrying...", retry);
            await new Promise(r => setTimeout(r, 2000));
            return callAI(prompt, retry - 1);
        }

        return null;
    }
}

// ================= NOTES =================
app.post("/notes", async (req, res) => {
    try {
        const { topic, exam } = req.body;
        console.log("📥 REQUEST:", topic, exam);

        if (!topic) {
            return res.json({ result: "Enter topic" });
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

        if (!result) {
            return res.json({
                result: `⚠️ Server busy. Try again.\n\nTopic: ${topic}`
            });
        }

        return res.json({ result });

    } catch (err) {
        console.log("❌ NOTES ERROR:", err);
        return res.json({
            result: "⚠️ Notes generation failed, try again"
        });
    }
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

// ================= TEST =================
app.get("/test", async (req, res) => {
    const result = await callAI("Hello, test message");
    if (result) {
        res.send("✅ API WORKING: " + result);
    } else {
        res.send("❌ API NOT WORKING");
    }
});

// ================= SERVER (ONLY ONE LISTENER) =================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
