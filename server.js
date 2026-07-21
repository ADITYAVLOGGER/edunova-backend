require("dotenv").config()
const express = require("express")
const axios = require("axios")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

// ---------------- NOTES ----------------
// app.post("/notes", async (req, res) => {
//     try {
//         const { topic, subject, exam, level } = req.body

//         if (!topic) {
//             return res.status(400).json({ error: "Topic is required" })
//         }

//         // 🔥 fallback values (safety)
//         const safeExam = exam || "General"
//         const safeSubject = subject || "General"
//         const safeLevel = level || "Beginner"

//         // 🔥 SMART PROMPT
//         const prompt = `
// Create ${safeLevel} level exam-ready notes.

// Exam: ${safeExam}
// Subject: ${safeSubject}
// Topic: ${topic}

// Rules:
// - Use bullet points
// - Keep it simple and easy to revise
// - Include formulas if needed
// - No long paragraphs
// - No extra explanation

// Format:
// 📌 Definition
// 📌 Key Points
// 📌 Formula (if any)
// 📌 Example (if needed)
// `

//         // FIX: Added missing comma after URL string below
//         const response = await axios.post(
//             "https://api.groq.com/openai/v1/chat/completions",
//             {
//                model: "llama-3.1-8b-instant",
//                 messages: [
//                     {
//                         role: "user",
//                         content: prompt
//                     }
//                 ]
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         )

//         const result = response.data.choices[0].message.content

//         res.json({
//             result,
//             meta: {
//                 exam: safeExam,
//                 subject: safeSubject,
//                 topic: topic,
//                 level: safeLevel
//             }
//         })

//     } catch (err) {
//         console.error(err.response?.data || err.message)
//         res.status(500).json({ error: "Notes failed" })
//     }
// })

app.post("/notes", async (req, res) => {
    try {
        const { topic, subject, exam, level, standard, stream } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        // 🔥 SAFE FALLBACKS
        const safeExam = exam || "General";
        const safeSubject = subject || "General";
        const safeStream = stream || "";
        
        // 🔥 LEVEL AUTO INTELLIGENCE (VERY IMPORTANT)
        let finalLevel = level;

        if (!finalLevel) {
            if (["6","7","8"].includes(standard)) finalLevel = "Beginner";
            else if (["9","10"].includes(standard)) finalLevel = "Intermediate";
            else if (["11","12"].includes(standard)) finalLevel = "Advanced";
            else finalLevel = "Beginner";
        }

        // 🔥 SMART PROMPT ENGINE
        const prompt = `
You are a strict academic subject expert.

IMPORTANT RULE:
- Do NOT change the subject.
- Do NOT mix subjects.
- Only generate content strictly from the given subject.

Subject: ${safeSubject}
Exam: ${safeExam}
Class: ${standard || ""}
Level: ${finalLevel}

Topic: ${topic}

INSTRUCTION:
If the topic belongs to ${safeSubject}, explain it.
If it seems confusing, STILL interpret it within ${safeSubject} only.

Example:
- "Indian Number System" → Mathematics
- NOT Civics or History

Rules:
- Short bullet points
- No long paragraphs
- Simple language
- Add formulas if needed
- Add examples
- Focus on exam preparation

Format:
📌 Definition
📌 Key Points
📌 Concepts
📌 Formula (if any)
📌 Example
📌 Exam Tips
`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
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
            result,
            meta: {
                exam: safeExam,
                subject: safeSubject,
                level: finalLevel,
                standard,
                stream: safeStream,
                topic
            }
        });

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ error: "Notes failed" });
    }
});


---------------- QUIZ ----------------
app.post("/quiz", async (req, res) => {
    try {
        const { topic } = req.body

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" })
        }

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [{
                    role: "system",
                    content: "You are a quiz generator. Always respond in pure JSON format."
                }, {
                    role: "user",
                    content: `Generate 5 MCQ quiz on ${topic}

Return ONLY valid JSON in this format:

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

NO extra text. NO markdown. ONLY JSON.`
                }],
                // Enforce JSON output mode for Groq/OpenAI APIs
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )
        console.log("QUIZ REQUEST:", req.body)
        const resultText = response.data.choices[0].message.content
        res.json({ result: resultText })
        // res.json({ result: JSON.parse(resultText) })

    } catch (err) {
        console.error(err.response?.data || err.message)
        console.error("QUIZ ERROR:", err.response?.data || err.message)
        res.status(500).json({ error: "Quiz failed" })
    }
})

// app.post("/quiz", async (req, res) => {
//     try {
//         const { topic, subject, exam, level, standard, notes } = req.body;

//         if (!topic) {
//             return res.status(400).json({ error: "Topic is required" });
//         }

//         const safeSubject = subject || "General";
//         const safeExam = exam || "General";
//         const safeLevel = level || "easy";

//         // 🔥 SUBJECT LOCK PROMPT (VERY IMPORTANT)
//         const prompt = `
// You are a strict ${safeSubject} teacher.

// IMPORTANT RULES:
// - DO NOT change subject
// - DO NOT mix subjects
// - Stay strictly inside ${safeSubject}

// Topic: ${topic}
// Exam: ${safeExam}
// Class: ${standard || ""}
// Difficulty: ${safeLevel}

// ${notes ? `Use this reference content:\n${notes}` : ""}

// Create 5 MCQ questions.

// Rules:
// - 4 options only
// - Only ONE correct answer
// - Questions must match difficulty level
// - Keep questions exam-oriented
// - Avoid ambiguity
// - Include explanation

// Return ONLY valid JSON:

// {
//   "quiz": [
//     {
//       "question": "string",
//       "options": ["A","B","C","D"],
//       "correct_answer_index": 0,
//       "explanation": "string",
//       "subTopic": "string"
//     }
//   ]
// }
// `;

//         const response = await axios.post(
//             "https://api.groq.com/openai/v1/chat/completions",
//             {
//                 model: "llama-3.1-8b-instant",
//                 messages: [
//                     {
//                         role: "system",
//                         content: "Return ONLY JSON. No markdown. No explanation."
//                     },
//                     {
//                         role: "user",
//                         content: prompt
//                     }
//                 ],
//                 response_format: { type: "json_object" }
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         );

//         const resultText = response.data.choices[0].message.content;

//         // 🔥 SAFE PARSE (VERY IMPORTANT)
//         let parsed;
//         try {
//             parsed = JSON.parse(resultText);
//         } catch {
//             console.error("JSON PARSE FAIL:", resultText);
//             return res.status(500).json({ error: "Invalid JSON from AI" });
//         }

//         res.json({ result: parsed });

//     } catch (err) {
//         console.error("QUIZ ERROR:", err.response?.data || err.message);
//         res.status(500).json({ error: "Quiz failed" });
//     }
// });

// ---------------- DOUBT SOLVER ----------------
app.post("/doubt", async (req, res) => {
    try {
        const { question } = req.body

        if (!question) {
            return res.status(400).json({ error: "Question is required" })
        }

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
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
        console.error(err.response?.data || err.message)
        res.status(500).json({ error: "Doubt failed" })
    }
})


// ---------------- SERVER ----------------
app.listen(3000, () => {
    console.log("EduNova AI Backend running on port 3000")
})
