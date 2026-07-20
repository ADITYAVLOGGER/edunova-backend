require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// 🔥 COMMON AI CALL FUNCTION
async function callAI(prompt) {
    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a smart study assistant. Give clear, exam-focused notes."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 800   // 🔥 IMPORTANT (300 se bahut kam aa raha tha)
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://edunova.app",
                    "X-Title": "EduNova AI"
                },
                timeout: 30000 // 🔥 increase timeout
            }
        );

        const text = response.data?.choices?.[0]?.message?.content;

        if (!text) {
            console.log("❌ EMPTY AI RESPONSE");
            return null;
        }

        return text;

    } catch (err) {
        console.log("❌ AI ERROR FULL:", err.response?.data || err.message);
        return null;
    }
}

// ================= NOTES =================
app.post("/notes", async (req, res) => {
    try {
        const { topic, exam } = req.body;

        if (!topic) {
            return res.status(400).json({ result: "Enter topic" });
        }

        const prompt = `
Generate study notes for:

Topic: ${topic}
Exam: ${exam}

Rules:
- Hinglish language
- 8 bullet points
- Each point 1-2 lines
- Simple + exam focused
- Include formula if needed
`;

        const result = await callAI(prompt);

        if (!result) {
            return res.status(200).json({
                result: "⚠️ Server busy, try again"
            });
        }

        res.status(200).json({ result });

    } catch (err) {
        console.log("❌ NOTES ERROR:", err.message);

        res.status(500).json({
            result: "⚠️ Notes generation failed"
        });
    }
});

// ================= QUIZ =================
app.post("/quiz", async (req, res) => {
    try {
        const { topic } = req.body;

        const prompt = `
Generate 5 MCQs on "${topic}"

Return ONLY JSON:

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

        if (!raw) {
            return res.json({ quiz: [] });
        }

        let clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const parsed = JSON.parse(clean);
            return res.json(parsed);
        } catch {
            return res.json({ quiz: [] });
        }

    } catch (err) {
        console.log("❌ QUIZ ERROR:", err.message);
        res.json({ quiz: [] });
    }
});

// ================= DOUBT =================
app.post("/doubt", async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ result: "Enter question" });
        }

        const prompt = `
Explain in simple Hinglish:

${question}

- step by step
- short answer
`;

        const result = await callAI(prompt);

        if (!result) {
            return res.json({ result: "⚠️ Try again later" });
        }

        res.json({ result });

    } catch (err) {
        console.log("❌ DOUBT ERROR:", err.message);

        res.status(500).json({
            result: "Doubt failed"
        });
    }
});

// ================= SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 EduNova backend running on port ${PORT}`);
});


// require("dotenv").config()

// const express = require("express")
// const axios = require("axios")
// const cors = require("cors")

// const app = express()

// app.use(cors())
// app.use(express.json())

// // 🔥 CHECK API KEY ON START
// if (!process.env.API_KEY) {
//     console.log("❌ ERROR: API_KEY missing in .env file")
//     process.exit(1)
// }

// // ================= AI CALL FUNCTION =================
// async function callAI(prompt, system = "You are a helpful AI") {
//     try {
//         const response = await axios.post(
//             "https://openrouter.ai/api/v1/chat/completions",
//             {
//                 model: "openai/gpt-4o-mini",
//                 messages: [
//                     { role: "system", content: system },
//                     { role: "user", content: prompt }
//                 ],
//                 temperature: 0.6,
//                 max_tokens: 600
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json",
//                     "HTTP-Referer": "http://localhost:3000",
//                     "X-Title": "EduNova App"
//                 },
//                 timeout: 20000
//             }
//         )

//         return response.data?.choices?.[0]?.message?.content || null

//     } catch (err) {
//         console.log("❌ AI ERROR:", err.response?.data || err.message)
//         return null
//     }
// }

// // ================= HEALTH CHECK =================
// app.get("/", (req, res) => {
//     res.send("✅ EduNova Backend Running")
// })

// // ================= NOTES =================
// app.post("/notes", async (req, res) => {
//     try {
//         const { topic, exam = "General" } = req.body

//         if (!topic) {
//             return res.status(400).json({ result: "Enter topic" })
//         }

//         const prompt = `
// Generate short study notes on "${topic}" for ${exam}

// Rules:
// - 8 bullet points
// - simple English
// - each point 1-2 lines
// - exam focused
// `

//         const result = await callAI(prompt)

//         if (!result) {
//             return res.json({ result: "⚠️ Server busy, try again" })
//         }

//         res.json({ result })

//     } catch (err) {
//         console.log("❌ NOTES ERROR:", err.message)
//         res.status(500).json({ result: "⚠️ Server error" })
//     }
// })

// // ================= QUIZ =================
// app.post("/quiz", async (req, res) => {
//     try {
//         const { topic } = req.body

//         if (!topic) {
//             return res.json({
//                 result: JSON.stringify({ quiz: [] })
//             })
//         }

//         const prompt = `
// Generate 5 MCQs on "${topic}"

// STRICT RULES:
// - ONLY return JSON
// - NO explanation outside JSON
// - NO markdown

// FORMAT:
// {
//  "quiz":[
//   {
//    "question":"string",
//    "options":["A","B","C","D"],
//    "correct_answer_index":0,
//    "explanation":"string",
//    "subTopic":"string"
//   }
//  ]
// }
// `

//         const aiResponse = await callAI(prompt, "Return ONLY valid JSON.")

//         if (!aiResponse) {
//             return res.json({
//                 result: JSON.stringify({ quiz: [] })
//             })
//         }

//         let raw = aiResponse

//         console.log("RAW QUIZ:", raw)

//         // CLEAN JSON
//         raw = raw.replace(/```json/g, "")
//                  .replace(/```/g, "")
//                  .trim()

//         const start = raw.indexOf("{")
//         const end = raw.lastIndexOf("}")

//         if (start === -1 || end === -1) {
//             throw new Error("Invalid JSON format")
//         }

//         const jsonString = raw.substring(start, end + 1)

//         let parsed

//         try {
//             parsed = JSON.parse(jsonString)
//         } catch (e) {
//             console.log("❌ JSON PARSE FAIL:", jsonString)

//             return res.json({
//                 result: JSON.stringify({ quiz: [] })
//             })
//         }

//         res.json({
//             result: JSON.stringify(parsed)
//         })

//     } catch (err) {
//         console.log("❌ QUIZ ERROR:", err.message)

//         res.json({
//             result: JSON.stringify({ quiz: [] })
//         })
//     }
// })

// // ================= DOUBT =================
// app.post("/doubt", async (req, res) => {
//     try {
//         const { question } = req.body

//         if (!question) {
//             return res.json({ result: "Enter question" })
//         }

//         const prompt = `
// Explain this in simple steps:

// ${question}

// Rules:
// - simple Hinglish
// - step by step
// - short answer
// `

//         const result = await callAI(prompt)

//         if (!result) {
//             return res.json({ result: "⚠️ Try again later" })
//         }

//         res.json({ result })

//     } catch (err) {
//         console.log("❌ DOUBT ERROR:", err.message)
//         res.status(500).json({ result: "Error solving doubt" })
//     }
// })

// // ================= SERVER =================
// const PORT = process.env.PORT || 3000

// app.listen(PORT, () => {
//     console.log(`🚀 EduNova backend running on port ${PORT}`)
// })




