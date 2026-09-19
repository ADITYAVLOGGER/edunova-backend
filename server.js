require("dotenv").config()
const express = require("express")
const axios = require("axios")
const cors = require("cors")
const { Resend } = require("resend")
const admin = require("firebase-admin/app")
const { getAuth } = require("firebase-admin/auth")
const app = express()
// 🔥 Firebase Admin Init
const fs = require("fs")

let serviceAccount;

try {
  const file = fs.readFileSync("/etc/secrets/serviceAccountKey.json", "utf8")
  console.log("SECRET FILE LOADED ✅")
  serviceAccount = JSON.parse(file)
} catch (err) {
  console.error("SECRET FILE ERROR ❌", err.message)
}

const adminApp = admin.initializeApp({
  credential: admin.cert(serviceAccount)
})
app.use(cors())
app.use(express.json())
const resend = new Resend(process.env.RESEND_API_KEY)


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
                model : "openai/gpt-oss-20b",
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
                model : "openai/gpt-oss-20b",
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

app.post("/video", async (req, res) => {
    try {
        const { topic, subject, level, standard } = req.body;

        if (!topic) {
            return res.status(400).json({ error: "Topic is required" });
        }

        let finalLevel = level;
        if (!finalLevel) {
            if (["6","7","8"].includes(standard)) finalLevel = "Beginner";
            else if (["9","10"].includes(standard)) finalLevel = "Intermediate";
            else finalLevel = "Beginner";
        }

        const prompt = `
You are a real Indian school teacher.

GOAL:
Teach deeply so student fully understands like classroom teaching.

Topic: ${topic}
Level: ${finalLevel}

STRICT TEACHING RULES:

- Start with proper definition (school style)
- Then explain meaning in simple words
- Use ONLY ONE example
- Continue SAME example till end
- Explain step-by-step slowly
- Add reasoning (why this happens)
- No random facts
- No multiple examples
- No short lines

VERY IMPORTANT:
- Each scene must be COMPLETE explanation (2–4 sentences)
- Scenes must CONNECT like continuous teaching
- Student should feel flow (not cut-cut)

STYLE:
- Hinglish
- Use: "Socho...", "Ab dekho...", "Dhyaan do..."
- Make student visualize

SCENE RULES:
- Only 3–4 scenes
- Each scene = long explanation
- duration: 10–18 seconds

OUTPUT:

{
  "scenes": [
    {
      "text": "An animal is a living organism. Matlab aise jeev jo saans lete hain, grow karte hain aur move kar sakte hain. Socho ek dog ko, woh khata hai, daudta hai aur react karta hai.",
      "duration": 12
    }
  ]
}

RETURN ONLY JSON
`;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "openai/gpt-oss-20b",
                messages: [
                    { role: "system", content: "Return ONLY JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.API_KEY}`
                }
            }
        );

        const parsed = JSON.parse(response.data.choices[0].message.content);

        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.json({ scenes: [] });
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
                model : "openai/gpt-oss-20b",
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

// ---------------- EMAIL VERIFICATION ----------------

app.post("/send-verification", async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: "Email required" })
        }

        let user;

        // ✅ STEP 1: ensure user exists
        try {
            user = await getAuth().getUserByEmail(email)
        } catch (err) {
            if (err.code === "auth/user-not-found") {
                user = await getAuth().createUser({
                    email: email,
                    emailVerified: false
                })
            } else {
                throw err
            }
        }

        // ✅ STEP 2: delay (important for stability)
        await new Promise(resolve => setTimeout(resolve, 800))

        // ✅ STEP 3: generate link
        const link = await getAuth().generateEmailVerificationLink(email)

        console.log("VERIFY LINK:", link)

        // ✅ STEP 4: SEND EMAIL (FIXED)
        const response = await resend.emails.send({
            from: "EduNova <vloggerindia9999@gmail.com>",   // 🔥 CHANGE THIS
            to: email,
            subject: "Verify your EduNova account",
            html: `
                <h2>Welcome to EduNova 🚀</h2>
                <p>Click below to verify your email:</p>

                <a href="${link}"
                style="padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;">
                Verify Email
                </a>

                <p style="margin-top:10px;font-size:12px;color:gray;">
                If button not working, copy this link:
                </p>
                <p style="font-size:12px;">${link}</p>
            `
        })

        console.log("RESEND RESPONSE:", response)

        // ✅ IMPORTANT: check resend success
        if (response.error) {
            return res.status(500).json({
                error: response.error.message
            })
        }

        res.json({ success: true })

    } catch (err) {
        console.error("EMAIL ERROR FULL:", err)

        res.status(500).json({
            error: err.message
        })
    }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
})
