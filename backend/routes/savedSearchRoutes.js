// routes/savedSearchRoutes.js
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const SavedSearch = require("../models/SavedSearch");
const Listing = require("../models/Listing");
const { addClient, removeClient } = require("../utils/sseHub");

/** Auth only for CRUD; stream stays query-token based */
function requireAuth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Access token required" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ----- CRUD -----
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = req.user.userId;
    console.log("[SavedSearch] create", { user, body: req.body });
    const search = await SavedSearch.create({ user, ...req.body });
    res.json({ success: true, search });
  } catch (e) {
    console.error("[SavedSearch] create error:", e.message);
    res.status(400).json({ error: e.message });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  const user = req.user.userId;
  const searches = await SavedSearch.find({ user }).sort({ createdAt: -1 });
  res.json({ searches });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const user = req.user.userId;
  const s = await SavedSearch.findOneAndUpdate(
    { _id: req.params.id, user },
    req.body,
    { new: true }
  );
  if (!s) return res.status(404).json({ error: "Not found" });
  res.json({ success: true, search: s });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const user = req.user.userId;
  const r = await SavedSearch.deleteOne({ _id: req.params.id, user });
  res.json({ success: r.deletedCount === 1 });
});

// ----- Preview current matches -----
// Make preview use the same (case-insensitive) logic as the post-save matcher.
router.post("/test/:id", requireAuth, async (req, res) => {
  const user = req.user.userId;
  const s = await SavedSearch.findOne({ _id: req.params.id, user });
  if (!s) return res.status(404).json({ error: "Not found" });

  const norm = (v) => (v == null ? "" : String(v).trim());
  const escape = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const q = {};

  // status: default to "active", match case-insensitively
  const status = norm(s.status) || "active";
  q.status = { $regex: `^${escape(status)}$`, $options: "i" };

  // category: case-insensitive exact match when provided
  const cat = norm(s.category);
  if (cat) {
    q.category = { $regex: `^${escape(cat)}$`, $options: "i" };
  }

  if (typeof s.isService === "boolean") q.isService = s.isService;
  if (s.tags?.length) q.tags = { $in: s.tags };
  if (s.text) q.$text = { $search: s.text };

  const results = await Listing.find(q).sort({ createdAt: -1 }).limit(25);
  res.json({ results });
});

// ----- SSE stream (token via query) -----
router.get("/stream", (req, res) => {
  try {
    const token = req.query.token; // EventSource can't send Authorization header
    if (!token) return res.status(401).end();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.userId;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    addClient(userId, res);

    const ping = setInterval(() => res.write(`:ping\n\n`), 15000);
    req.on("close", () => {
      clearInterval(ping);
      removeClient(userId, res);
      res.end();
    });

    res.write(`event: ready\ndata: {}\n\n`);
    console.log("[SavedSearch] SSE ready for", userId);
  } catch {
    res.status(401).end();
  }
});

module.exports = router;
