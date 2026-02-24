const { createClient } = require("@supabase/supabase-js");
const { interpretationLimit } = require("./_ratelimit");

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

  var { success } = await interpretationLimit.limit(user.id);
  if (!success) return res.status(429).json({ error: "Too many requests. Please try again later." });

  var { reportId, markersSummary, historySummary, profileText } = req.body;
  if (!reportId || !markersSummary) return res.status(400).json({ error: "Missing fields" });

  var profilePrefix = profileText ? profileText + "\n\n" : "";
  var historyPrefix = historySummary ? "Patient's previous reports for context:\n" + historySummary + "\n\n" : "";
  var trendInstruction = historySummary
    ? "Compare trends with previous reports, explicitly noting improvements or deteriorations (e.g. 'LDL has decreased from X to Y'). Write 3-4 sentences."
    : "Write 2-3 sentences summarising the key findings.";

  var prompt =
    profilePrefix +
    historyPrefix +
    "Current report markers: " + markersSummary + "\n\n" +
    "Write a concise clinical interpretation of these blood test results. " +
    trendInstruction +
    " Plain text only — no JSON, no markdown, no bullet points.";

  var geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 500, thinkingConfig: { thinkingBudget: 0 } }
    })
  });

  var data = await geminiRes.json();
  if (!geminiRes.ok || !data.candidates || !data.candidates[0]) {
    return res.status(500).json({ error: "Gemini request failed" });
  }

  var interpretation = data.candidates[0].content.parts
    .map(function(p) { return p.text || ""; }).join("").trim();

  // Persist and clear stale flag — verify user owns this report via .eq("user_id")
  await supabase
    .from("reports")
    .update({ interpretation: interpretation, interpretation_stale: false })
    .eq("id", reportId)
    .eq("user_id", user.id);

  res.status(200).json({ interpretation: interpretation });
};
