require("dotenv").config()
const express = require("express")
const axios = require("axios")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

// 🔥 FIXED AI FUNCTION
async function callAI(prompt, system = "You are a helpful AI") {
    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: prompt }
                ],
                temperature: 0.6,
                max_tokens: 300
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 10000
            }
        )

        const result = response.data?.choices?.[0]?.message?.content

        return result || null

    } catch (err) {
        console.log("❌ AI ERROR:", err.response?.data || err.message)
        return null
    }
}

// ---------------- NOTES ----------------
app.post("/notes", async (req, res) => {
    
        const { topic, exam = "General" } = req.body

        if (!topic) {
            return res.json({ result: "Enter topic" })
        }

        const prompt = `
Generate short study notes on "${topic}" for ${exam}

Rules:
- 8 bullet points
- simple Hinglish
- each point 1-2 lines
- exam focused
`

        const result = await callAI(prompt)

        if (!result) {
            return res.json({ result: "⚠️ Server busy, try again" })
        }

        res.json({ result })

    } catch {
        res.status(500).json({ error: "Notes failed" })
    }
})

// ---------------- QUIZ ----------------

app.post("/quiz", async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.json({
                result: JSON.stringify({ quiz: [] })
            });
        }

        const prompt = `
Generate 5 MCQs on "${topic}"

STRICT RULES:
- ONLY return JSON
- NO explanation outside JSON
- NO markdown
- NO text before/after JSON

FORMAT:
{
 "quiz":[
  {
   "question":"string",
   "options":["A","B","C","D"],
   "correct_answer_index":0,
   "explanation":"string",
   "subTopic":"string"
  }
 ]
}
`;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a JSON generator. ONLY return valid JSON."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 15000
            }
        );

        let raw = response.data?.choices?.[0]?.message?.content || "";

        console.log("RAW:", raw);

        // CLEAN
        raw = raw.replace(/```json/g, "")
                 .replace(/```/g, "")
                 .trim();

        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");

        if (start === -1 || end === -1) {
            throw new Error("Invalid JSON from AI");
        }

        const jsonString = raw.substring(start, end + 1);

        const parsed = JSON.parse(jsonString);

        res.json({
            result: JSON.stringify(parsed)
        });

    } catch (err) {
        console.log("❌ QUIZ ERROR:", err.message);

        res.json({
            result: JSON.stringify({
                quiz: []
            })
        });
    }
});


// ---------------- DOUBT ----------------
app.post("/doubt", async (req, res) => {
    try {
        const { question } = req.body

        if (!question) {
            return res.json({ result: "Enter question" })
        }

        const prompt = `
Explain this in simple steps:

${question}

- simple Hinglish
- step by step
- short answer
`

        const result = await callAI(prompt)

        if (!result) {
            return res.json({ result: "⚠️ Try again later" })
        }

        res.json({ result })

    } catch {
        res.status(500).json({ error: "Doubt failed" })
    }
})

// ---------------- SERVER ----------------
app.listen(3000, () => {
    console.log("🚀 EduNova backend running on port 3000")
})

// require("dotenv").config()
// const express = require("express")
// const axios = require("axios")
// const cors = require("cors")

// const app = express()
// app.use(cors())
// app.use(express.json())

// // ---------------- NOTES ----------------
// // app.post("/notes", async (req, res) => {
// //     try {
// //         const { topic, exam = "General" } = req.body;

// //         if (!topic) {
// //             return res.status(400).json({ error: "Topic is required" });
// //         }

// //         const prompt = `
// // Generate clear and exam-focused study notes on "${topic}" for ${exam}.

// // Rules:
// // - Explain in simple Hinglish
// // - Use bullet points
// // - 8-10 important points only
// // - Each point max 2 lines
// // - Include formula if needed
// // - Keep it short but complete
// // `;

// //         const response = await axios.post(
// //             "https://openrouter.ai/api/v1/chat/completions",
// //             {
// //                 model: "qwen/qwen2.5-7b-instruct:free",
// //                 messages: [
// //                     { role: "user", content: prompt }
// //                 ],
// //                 temperature: 0.6,
// //                 max_tokens: 200
// //             },
// //             {
// //                 headers: {
// //                     Authorization: `Bearer ${process.env.API_KEY}`,
// //                     "Content-Type": "application/json"
// //                 }
// //             }
// //         );

// //         const result = response.data.choices[0].message.content;

// //         res.json({ result });

// //     } catch (err) {
// //         console.error("NOTES ERROR:", err.response?.data || err.message);

// //         res.status(500).json({
// //             error: "Notes generation failed"
// //         });
// //     }
// // });


// const MODELS = [
//     "qwen/qwen2.5-7b-instruct:free",
//     "mistralai/mistral-7b-instruct:free"
// ];

// async function generateNotes(prompt) {

//     for (let model of MODELS) {
//         try {
//             console.log("Trying model:", model);

//             const response = await axios.post(
//                 "https://openrouter.ai/api/v1/chat/completions",
//                 {
//                     model: model,
//                     messages: [
//                         { role: "user", content: prompt }
//                     ],
//                     max_tokens: 200,
//                     temperature: 0.6
//                 },
//                 {
//                     headers: {
//                         Authorization: `Bearer ${process.env.API_KEY}`,
//                         "Content-Type": "application/json"
//                     },
//                     timeout: 10000
//                 }
//             );

//             const result = response.data?.choices?.[0]?.message?.content;

//             if (result) {
//                 console.log("✅ Success with:", model);
//                 return result;
//             }

//         } catch (err) {
//             console.log("❌ Failed model:", model);
//             console.log(err.response?.data || err.message);
//         }
//     }

//     return null;
// }


// // ---------------- QUIZ ----------------
// // const express = require("express");
// // const axios = require("axios");

// // const app = express();
// // app.use(express.json());

// app.post("/quiz", async (req, res) => {
//     try {
//         const { topic, level = "easy", notes = "" } = req.body;

//         let difficultyInstruction = "";

//         if (level === "easy") {
//             difficultyInstruction = "Basic conceptual, direct questions";
//         } else if (level === "hard") {
//             difficultyInstruction = "Concept-based and application questions";
//         } else if (level === "harder") {
//             difficultyInstruction = "Multi-concept and logical reasoning questions";
//         } else if (level === "hardest") {
//             difficultyInstruction = "Exam-level tricky and deep conceptual questions";
//         }

//         // 🔥 LIMIT NOTES (important for tokens)
//         const shortNotes = notes.substring(0, 800);

//         const prompt = `
// Generate 5 MCQs on "${topic}"

// Difficulty: ${difficultyInstruction}

// Use context:
// ${shortNotes}

// Rules:
// - Questions clear and exam-focused
// - 4 options only
// - Keep explanation short (1-2 lines)
// - Return ONLY JSON (no text, no markdown)

// FORMAT:
// {
//   "quiz": [
//     {
//       "question": "string",
//       "options": ["A", "B", "C", "D"],
//       "correct_answer_index": 0,
//       "explanation": "string",
//       "subTopic": "string"
//     }
//   ]
// }
// `;

//         const response = await axios.post(
//             "https://openrouter.ai/api/v1/chat/completions",
//             {
//                 model: "qwen/qwen2.5-7b-instruct:free", 
//                 messages: [
//                     {
//                         role: "system",
//                         content: "You are a quiz generator that ONLY returns valid JSON."
//                     },
//                     {
//                         role: "user",
//                         content: prompt
//                     }
//                 ],
//                 temperature: 0.5,
//                 max_tokens: 300 
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         );

//         let raw = response.data.choices[0].message.content;

//         // 🔥 CLEAN RESPONSE
//         raw = raw
//             .replace(/```json/g, "")
//             .replace(/```/g, "")
//             .trim();

//         let parsed;

//         try {
//             parsed = JSON.parse(raw);
//         } catch (e) {
//             console.log("❌ JSON Parse Failed:", raw);

//             // 🔥 FALLBACK
//             return res.json({
//                 quiz: [
//                     {
//                         question: `Basic question on ${topic}?`,
//                         options: ["Option A", "Option B", "Option C", "Option D"],
//                         correct_answer_index: 0,
//                         explanation: "Fallback explanation",
//                         subTopic: topic
//                     }
//                 ]
//             });
//         }

//         res.json(parsed);

//     } catch (err) {
//         console.log("❌ SERVER ERROR:", err.response?.data || err.message);

//         res.status(500).json({ error: "Quiz failed" });
//     }
// });
// module.exports = app;

// // ---------------- DOUBT SOLVER ----------------
// app.post("/doubt", async (req, res) => {
//     try {
//         const { question } = req.body;

//         if (!question) {
//             return res.status(400).json({ error: "Question is required" });
//         }

//         const prompt = `
// Explain the following question in simple steps:

// "${question}"

// Rules:
// - Use very simple Hinglish
// - Explain step by step
// - Keep answer short and clear
// - Max 5-6 steps
// - Give final answer clearly at the end
// `;

//         const response = await axios.post(
//             "https://openrouter.ai/api/v1/chat/completions",
//             {
//                 model: "qwen/qwen2.5-7b-instruct:free", // ✅ FREE MODEL
//                 messages: [
//                     {
//                         role: "system",
//                         content: "You are a helpful teacher who explains doubts simply."
//                     },
//                     {
//                         role: "user",
//                         content: prompt
//                     }
//                 ],
//                 temperature: 0.4,
//                 max_tokens: 200 // ✅ SAFE LIMIT
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json"
//                 },
//                 timeout: 10000
//             }
//         );

//         const reply = response.data.choices[0].message.content;

//         res.json({ result: reply });

//     } catch (err) {
//         console.log("❌ DOUBT ERROR:", err.response?.data || err.message);

//         res.status(500).json({
//             error: "Doubt failed"
//         });
//     }
// });


// ---------------- SERVER ----------------
// app.listen(3000, () => {
//     console.log("EduNova AI Backend running on port 3000")
// })
