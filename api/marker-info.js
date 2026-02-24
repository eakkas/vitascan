const { createClient } = require("@supabase/supabase-js");
const { markerInfoLimit } = require("./_ratelimit");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
  process.env.GEMINI_API_KEY;

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Verify auth
  var token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  var { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // Rate limit: 100 marker info lookups per user per hour
  var { success } = await markerInfoLimit.limit(user.id);
  if (!success) return res.status(429).json({ error: "Too many requests. Please try again later." });

  var { name } = req.body;
  if (!name || typeof name !== "string" || name.length > 200) {
    return res.status(400).json({ error: "Invalid marker name" });
  }

  var geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: "Explain the blood test marker \"" + name + "\" in simple, patient-friendly language. Return ONLY a JSON object with no markdown: {\"what\": \"1-2 sentences on what this marker measures\", \"implications\": \"1-2 sentences on what high or low levels may indicate\"}." }]
      }],
      generationConfig: { maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } }
    })
  });

  var data = await geminiRes.json();
  if (!geminiRes.ok || !data.candidates || !data.candidates[0]) {
    return res.status(500).json({ error: "Gemini request failed" });
  }

  var raw = data.candidates[0].content.parts.map(function(p) { return p.text || ""; }).join("");
  var info;
  try {
    info = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  } catch (e) {
    return res.status(500).json({ error: "Failed to parse Gemini response" });
  }

  res.status(200).json(info);
};
