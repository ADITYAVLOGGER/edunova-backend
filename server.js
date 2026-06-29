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
const { topic, exam = "NEET" } = req.body


    const prompt = 

Topic: ${topic}
Exam: ${exam}

TASK:
Create COMPLETE textbook-style notes in EASY ENGLISH so that a beginner student can understand in one reading.

STRICT FORMAT (VERY IMPORTANT):

PART 1: Introduction

* Explain basic idea in simple words
* Add real-life example if possible

PART 2: Definition

* Clear and exam-ready definition
* Highlight important keywords

PART 3: Types / Classification

* List all types
* Explain each type briefly
* DO NOT cut any type

PART 4: Detailed Explanation

* Explain concept step-by-step
* Add examples
* Cover full logic (no skipping)

PART 5: Formulas / Important Points

* All formulas (if any)
* Important facts
* Units if required

PART 6: PYQ Tricks / Summary

* Exam tricks
* Common mistakes
* Quick revision points

RULES:

* Use very simple English (class 10 level)
* Use bullet points
* DO NOT skip any section
* DO NOT leave any PART incomplete
* DO NOT mix parts
* Each PART must be fully complete
* Keep flow like a real textbook

IMPORTANT:
Output must ALWAYS follow PART structure exactly.
`

```
    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful NEET tutor." },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    )

    const result = response.data.choices[0].message.content

    res.json({
        result: result
    })

} catch (err) {
    console.error(err)
    res.status(500).json({ error: "Notes failed" })
}


})



// ---------------- QUIZ ----------------
app.post("/quiz", async (req, res) => {
    try {
        const { topic, level, notes, seenQuestions = [] } = req.body;

        // 🔥 Difficulty instruction
        let levelInstruction = "";

        switch (level) {
            case "easy":
                levelInstruction = "very basic, definition-based MCQs";
                break;
            case "hard":
                levelInstruction = "concept-based tricky MCQs";
                break;
            case "harder":
                levelInstruction = "application-based multi-step MCQs";
                break;
            case "hardest":
                levelInstruction = "exam-level toughest MCQs like JEE/NEET";
                break;
            default:
                levelInstruction = "balanced difficulty MCQs";
        }

        const prompt = 
Generate 5 unique MCQ questions on "${topic}"

Level: ${levelInstruction}

IMPORTANT RULES:
1. Questions must NOT repeat these:
${seenQuestions.join("\n")}

2. Questions should be based on these notes (if available):
${notes || "No notes provided"}

3. Output ONLY JSON (no extra text) in this format:

{
  "quiz": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_answer_index": 0,
      "explanation": "simple explanation"
    }
  ]
}
;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a strict JSON generator. Always return valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": Bearer ${process.env.API_KEY},
                    "Content-Type": "application/json"
                }
            }
        );

        let result = response.data.choices[0].message.content;

    
        result = result.replace(/json|/g, "").trim();

        res.json({ result });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Quiz failed" });
    }
});

// ---------------- STUDY PLAN ----------------
app.post("/plan", async (req, res) => {
    try {
        const { examType, examDate, subjects, level } = req.body

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: 
Create a COMPLETE structured study planner in JSON.

Exam: ${examType}
Level: ${level}
Subjects: ${subjects}
Exam Date: ${examDate || "not provided"}

Rules:
1. Give full syllabus for each subject
2. Divide into chapters
3. Each chapter must have:
   - chapterName
   - subtopics (array)
   - estimatedHours
4. Arrange in best study order (easy → hard)
5. If examDate given → distribute time smartly

Return STRICT JSON ONLY like:

{
  "subjects": [
    {
      "name": "Physics",
      "chapters": [
        {
          "chapterName": "Kinematics",
          "estimatedHours": 5,
          "subtopics": ["Motion", "Velocity", "Acceleration"]
        }
      ]
    }
  ]
}

                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        )

        const raw = response.data.choices[0].message.content

        res.json({ result: raw })

    } catch (err) {
        res.status(500).json({ error: "Plan failed" })
    }
})



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
                    "Authorization": Bearer ${process.env.API_KEY},
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
