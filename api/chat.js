const { createClient } = require("@supabase/supabase-js");
const { chatLimit } = require("./_ratelimit");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
  process.env.GEMINI_API_KEY;

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  var token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  var { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  var { success } = await chatLimit.limit(user.id);
  if (!success) return res.status(429).json({ error: "Too many requests. Please try again later." });

  var { messages, context } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ error: "Missing messages" });

  var systemPrompt =
    "You are a health data assistant for VitaScan, a personal blood test tracking app. " +
    "Help users understand their blood test results and health trends in clear, plain English. " +
    "Be specific — always reference the user's actual values when answering. " +
    "Be concise. Use short paragraphs. When listing things, use short bullet points. " +
    "Always recommend consulting a doctor before changing medications, supplements, or for diagnosis. " +
    "Do not invent values or markers that are not in the provided data. " +
    "If asked about something not in the user's data, say so clearly.\n\n";

  if (context) {
    systemPrompt += "USER'S HEALTH DATA:\n" + context;
  }

  // Build multi-turn contents array from conversation history
  var contents = messages.map(function(m) {
    return { role: m.role === "model" ? "model" : "user", parts: [{ text: m.text }] };
  });

  var geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: contents,
      generationConfig: { maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });

  var data = await geminiRes.json();
  if (!geminiRes.ok || !data.candidates || !data.candidates[0]) {
    return res.status(500).json({ error: "AI request failed" });
  }

  var reply = data.candidates[0].content.parts
    .map(function(p) { return p.text || ""; })
    .join("")
    .trim();

  res.status(200).json({ reply: reply });
};
