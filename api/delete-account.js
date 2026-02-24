const { createClient } = require("@supabase/supabase-js");

// Regular client — used only to verify the user's JWT
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Admin client — service role key required to delete auth users
const supabaseAdmin = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  var token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  var { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

  var userId = user.id;

  // Delete all user data first, then the auth record
  await supabaseAdmin.from("reports").delete().eq("user_id", userId);
  await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

  var { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return res.status(500).json({ error: "Failed to delete account: " + deleteError.message });
  }

  res.status(200).json({ ok: true });
};
