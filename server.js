require("dotenv").config();
console.log("CHECK ENV:", process.env.GROQ_API_KEY);
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// ================= NOTES =================
app.post("/notes", async (req, res) => {
    try {
        const { topic } = req.body

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
               model: "llama3-8b-8192",
                messages: [{
                    role: "user",
                    content: `Create simple exam-ready notes in points for: ${topic}`
                }]
            },
            {
               headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        res.json({ result: response.data.choices[0].message.content })

    } catch (err) {
        res.status(500).json({ error: "Notes failed" })
    }
})


// ---------------- QUIZ ----------------
app.post("/quiz", async (req, res) => {
    try {
        const { topic } = req.body

        const response = await axios.post(
           "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [{
                    role: "user",
                    content: `Generate 5 MCQ quiz on ${topic} with:
                    question, 4 options, correct answer index, and explanation in JSON format`
                }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        res.json({ result: response.data.choices[0].message.content })

    } catch (err) {
        res.status(500).json({ error: "Quiz failed" })
    }
})


// ---------------- STUDY PLAN ----------------


// ---------------- DOUBT SOLVER ----------------
app.post("/doubt", async (req, res) => {
    try {
        const { question } = req.body

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [{
                    role: "user",
                    content: `Solve this doubt in simple student friendly way: ${question}`
                }]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        res.json({ result: response.data.choices[0].message.content })

    } catch (err) {
        res.status(500).json({ error: "Doubt failed" })
    }
})
