/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getProceduralQuestions } from "./server/generator";
import { ADIBand, ADIDifficulty, ADIQuestion } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy-initialize Gemini API to safely protect against start-up crashes if the key is missing.
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        console.log("Successfully initialized Gemini API client.");
      } catch (e) {
        console.error("Failed to initialize Gemini API client:", e);
      }
    } else {
      console.warn("No valid GEMINI_API_KEY provided in env variables. Operating with Procedural engine fallback.");
    }
  }
  return aiClient;
}

// 1. HEALTH ENDPOINT
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasAiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
    timestamp: new Date().toISOString()
  });
});

// 2. RETRIEVE OR GENERATE ADI PART 1 QUESTIONS
app.post("/api/questions", async (req, res) => {
  try {
    const {
      mode,
      count = 10,
      band,
      gdeLevel,
      instructionalTopic,
      weakQuestionIds = []
    } = req.body;

    console.log(`Received request for Mode: ${mode}, Count: ${count}, Band: ${band}, GDE: ${gdeLevel}`);

    const ai = getGeminiClient();

    // If Gemini is active, let's attempt to synthesize custom DVSA-style questions with rich context!
    if (ai) {
      try {
        let topicFilterText = "";
        let filterBandInstruction = "";

        if (band) {
          filterBandInstruction = `Generate questions ONLY from: "${band}".`;
        } else if (mode === "gde") {
          filterBandInstruction = "Generate questions ONLY covering Band 4 - Instructional Techniques, focusing specifically on the GDE Matrix levels (Level 1 Vehicle Control, Level 2 Traffic Situations, Level 3 Goals and Context, Level 4 Goals for Life and Skills for Living).";
          if (gdeLevel) {
            topicFilterText = `Focus exactly on: ${gdeLevel}.`;
          }
        } else if (mode === "instructional") {
          filterBandInstruction = "Generate questions ONLY covering Band 4 - Instructional Techniques (Coaching, client-centred learning, risk management, National Standards, reflective practice).";
          if (instructionalTopic) {
            topicFilterText = `Focus exactly on: ${instructionalTopic}.`;
          }
        }

        const promptText = `
          Generate exactly ${count} original, challenging UK Approved Driving Instructor (ADI) Part 1 theory questions.
          ${filterBandInstruction}
          ${topicFilterText}

          Follow these rules:
          - Ensure questions resemble the exact style, tone, and difficulty of the official DVSA ADI Part 1 test.
          - Offer 4 options: A, B, C, D. Only one option can be correct.
          - Specify the exact correct_answer option key (e.g. "A").
          - Write a helpful expert driving instructor coaching explanation justifying why the correct option is correct.
          - Categorize with a corresponding difficulty: "Easy", "Medium", or "Hard".
          - Distribute across the following official UK ADI Bands as appropriate:
            1. "Band 1 – Road Procedure"
            2. "Band 2 – Traffic Signs and Signals"
            3. "Band 3 – Driving Test, Disabilities, Law and Documents"
            4. "Band 4 – Instructional Techniques"

          You are trained directly on the following three Ground-Truth ADI Part 1 Reference Volumes:
          
          [VOLUME 1 - ROAD PROCEDURE GROUND-TRUTH EXAMPLE]
          - Question: "When approaching a developing hazard, what should be your primary consideration as a driver?"
          - Correct Option: "C" ("Safety and planning: anticipate early and adjust speed/position securely")
          - Topic/Explanation: "When dealing with a developing hazard, safety and planning must be the primary driver consideration. Early anticipation allows you to adjust speeds safely before critical braking is needed."
          
          [VOLUME 2 - TRAFFIC SIGNS & SIGNALS GROUND-TRUTH EXAMPLE]
          - Question: "What does a triangular road sign normally indicate?"
          - Correct Option: "B" ("Warning of an upcoming hazard on the road ahead")
          - Topic/Explanation: "Triangular road signs are warning signs designed to draw your attention to upcoming hazards (e.g., bends, crossings, junctions)."
          
          [VOLUME 3 - VEHICLE CONTROL & SAFETY GROUND-TRUTH EXAMPLES]
          - Question: "Why is regular tyre pressure checking important?"
          - Correct Option: "A" ("It improves safety, vehicle handling, and overall fuel efficiency")
          - Question: "What is the primary purpose of an Anti-lock Braking System (ABS)?"
          - Correct Option: "B" ("To prevent wheel lock during heavy braking, allowing steering control to be maintained")
          - Question: "What should you do if an unfamiliar warning light appears on your instrument panel while driving?"
          - Correct Option: "B" ("Assess the risk and take action according to the vehicle handbook instructions")
          - Question: "How can you reduce your overall stopping distance?"
          - Correct Option: "A" ("Reduce speed and maintain safe, increased following distances")

          Format the output strictly as a JSON array matching our target schema, mimicking the high-fidelity expertise and options of these exact examples. Keep scenario situations highly randomized with different weather conditions, speeds, driving errors, and pupil profiles to avoid repetition.
        `;

        const generateWithConfig = async (modelName: string) => {
          return await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction: "You are an expert UK Approved Driving Instructor (ADI) Part 1 Theory Test Coach. Only return a valid JSON array of questions strictly conforming to the requested schema. Do not include markdown tags like ```json in the textual reply.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                description: "List of driving theory questions",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The theory test question based on DVSA standards" },
                    options: {
                      type: Type.OBJECT,
                      properties: {
                        A: { type: Type.STRING },
                        B: { type: Type.STRING },
                        C: { type: Type.STRING },
                        D: { type: Type.STRING }
                      },
                      required: ["A", "B", "C", "D"]
                    },
                    correct_answer: { type: Type.STRING, description: "Must be 'A', 'B', 'C', or 'D'" },
                    explanation: { type: Type.STRING, description: "Expert ADI training explanation detailing why this is correct" },
                    topic: { type: Type.STRING, description: "Specific topic in the DVSA syllabus" },
                    difficulty: { type: Type.STRING, description: "Must be 'Easy', 'Medium', or 'Hard'" },
                    band: {
                      type: Type.STRING,
                      description: "Must be exactly one of the four: 'Band 1 – Road Procedure', 'Band 2 – Traffic Signs and Signals', 'Band 3 – Driving Test, Disabilities, Law and Documents', 'Band 4 – Instructional Techniques'"
                    }
                  },
                  required: ["question", "options", "correct_answer", "explanation", "topic", "difficulty", "band"]
                }
              }
            }
          });
        };

        let response;
        let selectedModel = "gemini-3.5-flash";
        try {
          console.log("Attempting question generation with gemini-3.5-flash...");
          response = await generateWithConfig("gemini-3.5-flash");
        } catch (firstError: any) {
          console.warn(`gemini-3.5-flash high demand/error: ${firstError.message || firstError}. Falling back to gemini-3.1-flash-lite...`);
          selectedModel = "gemini-3.1-flash-lite";
          response = await generateWithConfig("gemini-3.1-flash-lite");
        }

        let rawText = response.text ? response.text.trim() : "";
        // Clean JSON formatting in case of stray markdown code block markers
        if (rawText.startsWith("```")) {
          rawText = rawText.replace(/^```(?:json)?\n?/, "");
        }
        if (rawText.endsWith("```")) {
          rawText = rawText.replace(/\s*```$/, "");
        }
        rawText = rawText.trim();

        if (rawText) {
          const parsedQuestions: any[] = JSON.parse(rawText);
          const sanitized: ADIQuestion[] = parsedQuestions.map((q, idx) => ({
            id: `ai-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
            question: q.question,
            options: q.options,
            correct_answer: (q.correct_answer || "A") as "A" | "B" | "C" | "D",
            explanation: q.explanation || "No explanation provided.",
            topic: q.topic || "General Study Topic",
            difficulty: (q.difficulty || "Medium") as ADIDifficulty,
            band: (q.band || ADIBand.Band1) as ADIBand
          }));

          if (sanitized.length > 0) {
            console.log(`Successfully generated ${sanitized.length} questions utilizing ${selectedModel}.`);
            return res.json({ questions: sanitized, source: "gemini" });
          }
        }
      } catch (gemError) {
        console.error("Gemini Generation failed completely. Falling back smoothly to the high fidelity procedural engine:", gemError);
      }
    }

    // --- FALLBACK EXQUISITE PROCEDURAL ENGINE ---
    // If Gemini fails, is disabled, or doesn't yield formatted data, let's fall back to our procedural generator.
    console.log("Serving questions using the procedural driving theory engine.");

    if (mode === "exam") {
      // 25 questions from each band (Total 100)
      const q1 = getProceduralQuestions(25, { band: ADIBand.Band1 });
      const q2 = getProceduralQuestions(25, { band: ADIBand.Band2 });
      const q3 = getProceduralQuestions(25, { band: ADIBand.Band3 });
      const q4 = getProceduralQuestions(25, { band: ADIBand.Band4 });
      const combined = [...q1, ...q2, ...q3, ...q4].sort(() => 0.5 - Math.random());
      return res.json({ questions: combined, source: "procedural" });
    }

    if (mode === "weak") {
      const idsToFetch = Array.isArray(weakQuestionIds) ? weakQuestionIds : [];
      if (idsToFetch.length > 0) {
        const fetched = getProceduralQuestions(count, { ids: idsToFetch });
        if (fetched.length > 0) {
          return res.json({ questions: fetched, source: "procedural" });
        }
      }
      // If none or not matched, fall back to random
      const fetchedRandom = getProceduralQuestions(count);
      return res.json({ questions: fetchedRandom, source: "procedural-random-fallback" });
    }

    let filters: any = {};
    if (band) filters.band = band;
    if (mode === "gde") filters.gdeMatrixOnly = true;
    if (mode === "instructional") filters.instructionalOnly = true;

    const questions = getProceduralQuestions(count, filters);
    return res.json({ questions, source: "procedural" });

  } catch (error: any) {
    console.error("General Failure in serving questions api:", error);
    res.status(500).json({ error: "Failed to generate questions. Please retry.", details: error.message });
  }
});

// Setup Express-Vite dynamic serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ADI Practice App Backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
