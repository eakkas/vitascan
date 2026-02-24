const { createClient } = require("@supabase/supabase-js");
const { analyzeLimit } = require("./_ratelimit");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
  process.env.GEMINI_API_KEY;

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Raise Vercel's default 4.5 MB body limit — PDFs as base64 can exceed it
module.exports.config = { api: { bodyParser: { sizeLimit: "20mb" } } };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // Verify auth
  var token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  var { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  // Rate limit: 10 analyses per user per hour
  var { success, remaining } = await analyzeLimit.limit(user.id);
  if (!success) return res.status(429).json({ error: "You've reached the limit of 10 report analyses per hour. Please try again later." });

  var { base64Data, mediaType, profileText, sectionLabels } = req.body;
  if (!base64Data || !mediaType) return res.status(400).json({ error: "Missing fields" });
  // Approx 10 MB file limit (base64 is ~33% larger than binary)
  if (base64Data.length > 14 * 1024 * 1024) return res.status(400).json({ error: "File too large (max 10 MB)" });

  var validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
  if (!validTypes.includes(mediaType)) return res.status(400).json({ error: "Unsupported file type" });

  var sections = Array.isArray(sectionLabels) ? sectionLabels : [];
  var sectionEnum = sections.concat(["Other"]).map(function(l) { return "\"" + l + "\""; }).join(", ");
  var profilePrefix = profileText ? profileText + "\n\n" : "";
  var systemPrompt =
    profilePrefix +
    "You are a clinical health data analyst. Extract every single lab marker from the uploaded report without skipping any. " +
    "Return ONLY a valid JSON object with no markdown, no preamble, no extra text. " +
    "Structure: {\"patientName\":\"string\",\"labName\":\"string or null\",\"reportDate\":\"string\",\"markers\":[{\"name\":\"string\",\"value\":number,\"unit\":\"string\",\"low\":number,\"high\":number,\"category\":\"string\"}],\"lifestyle\":[{\"emoji\":\"string\",\"label\":\"string\",\"desc\":\"string\"}],\"interpretation\":\"string\"}. " +
    "For labName extract the laboratory or clinic name from the report header (e.g. 'Quest Diagnostics', 'LabCorp', 'Mayo Clinic'). Set to null if not found. " +
    "For each marker's 'category' field use exactly one of these values: " + sectionEnum + ". " +
    "Rules: you MUST include every marker printed on the report — do not skip, summarise, or group any. " +
    "The report may be in any language — always output marker names in English using standard international clinical terminology (e.g. 'Glucose' not 'Glikoz', 'Hemoglobin' not 'Hemoglobin A', 'TSH' not 'TSH (Tiroid Stimülan Hormon)'). " +
    "If a reference range is missing, estimate a standard clinical range. Keep lifestyle to 4 items max with one sentence each. Keep interpretation to 2 sentences max. Output ONLY the raw JSON object.";

  var geminiRes = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: mediaType, data: base64Data } },
          { text: "Analyze this blood test report and return the JSON." }
        ]
      }],
      generationConfig: { maxOutputTokens: 16000, thinkingConfig: { thinkingBudget: 0 } }
    })
  });

  var data = await geminiRes.json();
  if (!geminiRes.ok) {
    var msg = (data.error && data.error.message) ? data.error.message : JSON.stringify(data);
    return res.status(geminiRes.status).json({ error: "Gemini error: " + msg });
  }

  res.status(200).json(data);
};
