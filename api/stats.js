// 방문 통계(관리자용): GET /api/stats?key=<STATS_KEY>&days=7
// Vercel Web Analytics 조회 API를 서버에서 대신 호출한다(토큰은 환경변수 VERCEL_API_TOKEN에만 둔다).
const PROJECT = "prj_wKZUng5r01E4CXju9DwsRUO0IQqG";
const TEAM = "team_1lA40DV0lR9QYGgUsIEKJgj3";
const BASE = "https://api.vercel.com/v1/query/web-analytics/visits";

async function q(path, params) {
  const u = new URL(BASE + path);
  u.searchParams.set("projectId", PROJECT);
  u.searchParams.set("teamId", TEAM);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { Authorization: "Bearer " + process.env.VERCEL_API_TOKEN } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || "vercel_" + r.status);
  return j.data;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const need = process.env.STATS_KEY;
  if (!need || req.query.key !== need) return res.status(401).json({ error: "unauthorized" });
  if (!process.env.VERCEL_API_TOKEN) return res.status(503).json({ error: "no_token" });
  const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 7));
  const until = new Date();
  const since = new Date(until.getTime() - days * 86400000);
  const range = { since: since.toISOString(), until: until.toISOString() };
  try {
    const [total, byDay, country, device, referrer, page, os, browser] = await Promise.all([
      q("/count", range),
      q("/aggregate", { ...range, by: "day", limit: 100 }),
      q("/aggregate", { ...range, by: "country", limit: 10 }),
      q("/aggregate", { ...range, by: "deviceType", limit: 10 }),
      q("/aggregate", { ...range, by: "referrerHostname", limit: 10 }),
      q("/aggregate", { ...range, by: "requestPath", limit: 10 }),
      q("/aggregate", { ...range, by: "osName", limit: 10 }),
      q("/aggregate", { ...range, by: "browserName", limit: 10 }),
    ]);
    return res.json({ days, total, byDay, country, device, referrer, page, os, browser });
  } catch (e) {
    return res.status(502).json({ error: String(e.message || e) });
  }
};
