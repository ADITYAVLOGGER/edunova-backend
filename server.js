require("dotenv").config();

console.log("CHECK ENV:", process.env.API_KEY);

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Render compatible port
const PORT = process.env.PORT || 3000;


// 🔥 COMMON FUNCTION (repeat code hata diya)
async function callGroq(prompt) {
    try {
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 400
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        const text = response?.data?.choices?.[0]?.message?.content;

        if (!text) throw new Error("Empty response");

        return text;

    } catch (err) {
    console.log("❌ FULL ERROR:", JSON.stringify(err.response?.data, null, 2));
    console.log("❌ MESSAGE:", err.message);
    return null;
}
}


// ================= NOTES =================
app.post("/notes", async (req, res) => {
    const { topic } = req.body;

    if (!topic) return res.json({ result: "Enter topic" });

    const result = await callGroq(
        `Create simple exam-ready notes in points for: ${topic}`
    );

    if (!result) {
        return res.json({ result: "⚠️ Server busy, try again" });
    }

    res.json({ result });
});


// ================= QUIZ =================
app.post("/quiz", async (req, res) => {
    const { topic } = req.body;

    const result = await callGroq(
        `Generate 5 MCQ quiz on ${topic} with question, options, correct answer and explanation`
    );

    if (!result) {
        return res.json({ result: "⚠️ Quiz failed, try again" });
    }

    res.json({ result });
});


// ================= DOUBT =================
app.post("/doubt", async (req, res) => {
    const { question } = req.body;

    const result = await callGroq(
        `Explain in simple student friendly way: ${question}`
    );

    if (!result) {
        return res.json({ result: "⚠️ Try again" });
    }

    res.json({ result });
});


// ================= SERVER =================
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// require("dotenv").config();
// console.log("CHECK ENV:", process.env.API_KEY);
// const express = require("express");
// const axios = require("axios");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = 3000;

// // ================= NOTES =================
// app.post("/notes", async (req, res) => {
//     try {
//         const { topic } = req.body

//         const response = await axios.post(
//             "https://api.groq.com/openai/v1/chat/completions",
//             {
//                model: "llama3-8b-8192",
//                 messages: [{
//                     role: "user",
//                     content: `Create simple exam-ready notes in points for: ${topic}`
//                 }]
//             },
//             {
//                headers: {
//                     "Authorization": `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         )

//         res.json({ result: response.data.choices[0].message.content })

//     } catch (err) {
//         res.status(500).json({ error: "Notes failed" })
//     }
// })


// // ---------------- QUIZ ----------------
// app.post("/quiz", async (req, res) => {
//     try {
//         const { topic } = req.body

//         const response = await axios.post(
//            "https://api.groq.com/openai/v1/chat/completions",
//             {
//                 model: "llama3-8b-8192",
//                 messages: [{
//                     role: "user",
//                     content: `Generate 5 MCQ quiz on ${topic} with:
//                     question, 4 options, correct answer index, and explanation in JSON format`
//                 }]
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         )

//         res.json({ result: response.data.choices[0].message.content })

//     } catch (err) {
//         res.status(500).json({ error: "Quiz failed" })
//     }
// })


// // ---------------- STUDY PLAN ----------------


// // ---------------- DOUBT SOLVER ----------------
// app.post("/doubt", async (req, res) => {
//     try {
//         const { question } = req.body

//         const response = await axios.post(
//             "https://api.groq.com/openai/v1/chat/completions",
//             {
//                 model: "llama3-8b-8192",
//                 messages: [{
//                     role: "user",
//                     content: `Solve this doubt in simple student friendly way: ${question}`
//                 }]
//             },
//             {
//                 headers: {
//                     "Authorization": `Bearer ${process.env.API_KEY}`,
//                     "Content-Type": "application/json"
//                 }
//             }
//         )

//         res.json({ result: response.data.choices[0].message.content })

//     } catch (err) {
//         res.status(500).json({ error: "Doubt failed" })
//     }
// })

// app.listen(PORT, "0.0.0.0", () => {
//     console.log(`🚀 Server running on port ${PORT}`);
// });
