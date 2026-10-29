// 이용권 코드(Lemon Squeezy 라이선스 키)로 소재 원본 폴더 열기
// POST { key, item, instanceId? } → { url, instanceId, usage, limit, variant }
// 유료 폴더 주소는 저장소가 공개라 코드에 두지 않고 Vercel 환경변수 PAID_FOLDERS({"<id>":"<driveFolderId>"})에만 둔다.
const STORE_ID = 497344;
const PRODUCT_ID = 1462706; // 라이브 상품(테스트 모드 상품은 1442962)
const LS = "https://api.lemonsqueezy.com/v1/licenses/";

async function ls(action, params) {
  const r = await fetch(LS + action, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  return r.json().catch(() => ({}));
}

function folders() {
  // PAID_FOLDERS: 기존 소재(민감 값이라 수정·열람 불가), PAID_FOLDERS_2·_3·_4·_5·_6·_7·_8·_9·_10·_11·_12·_13·_14·_15·_16·_17·_18·_19·_20: 이후 추가한 소재({"<id>":"<driveFolderId>"}; 값을 읽을 수 없어 소재를 더할 때는 새 변수를 만든다)
  const read = (k) => { try { return JSON.parse(process.env[k] || "{}"); } catch { return {}; } };
  return { ...read("PAID_FOLDERS"), ...read("PAID_FOLDERS_2"), ...read("PAID_FOLDERS_3"), ...read("PAID_FOLDERS_4"), ...read("PAID_FOLDERS_5"), ...read("PAID_FOLDERS_6"), ...read("PAID_FOLDERS_7"), ...read("PAID_FOLDERS_8"), ...read("PAID_FOLDERS_9"), ...read("PAID_FOLDERS_10"), ...read("PAID_FOLDERS_11"), ...read("PAID_FOLDERS_12"), ...read("PAID_FOLDERS_13"), ...read("PAID_FOLDERS_14"), ...read("PAID_FOLDERS_15"), ...read("PAID_FOLDERS_16"), ...read("PAID_FOLDERS_17"), ...read("PAID_FOLDERS_18"), ...read("PAID_FOLDERS_19"), ...read("PAID_FOLDERS_20"), ...read("PAID_FOLDERS_21"), ...read("PAID_FOLDERS_22"), ...read("PAID_FOLDERS_23"), ...read("PAID_FOLDERS_24") };
}

const ours = (d) => d && d.meta && d.meta.store_id === STORE_ID && d.meta.product_id === PRODUCT_ID;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const key = String(body.key || "").trim();
  const item = String(body.item || "").trim();
  const instanceId = String(body.instanceId || "").trim();
  if (!key || !item) return res.status(400).json({ error: "missing" });

  const folder = folders()[item];
  if (!folder) return res.status(404).json({ error: "item" });
  const url = `https://drive.google.com/drive/folders/${folder}`;

  // 이미 이 코드로 받은 소재면 횟수를 다시 쓰지 않는다
  if (instanceId) {
    const v = await ls("validate", { license_key: key, instance_id: instanceId });
    if (v.valid && ours(v) && v.instance && v.instance.name === item) {
      const k = v.license_key || {};
      return res.json({ url, instanceId, usage: k.activation_usage, limit: k.activation_limit, again: true });
    }
  }

  const v = await ls("validate", { license_key: key });
  if (!v.license_key || !ours(v)) return res.status(403).json({ error: "invalid" });
  const k = v.license_key;
  if (k.status === "disabled" || k.status === "expired") return res.status(403).json({ error: "invalid" });
  if (k.activation_limit && k.activation_usage >= k.activation_limit) {
    return res.status(403).json({ error: "used_up", usage: k.activation_usage, limit: k.activation_limit });
  }

  const a = await ls("activate", { license_key: key, instance_name: item });
  if (!a.activated || !a.instance) {
    const lk = a.license_key || k;
    const used = lk.activation_limit && lk.activation_usage >= lk.activation_limit;
    return res.status(403).json({ error: used ? "used_up" : "invalid", usage: lk.activation_usage, limit: lk.activation_limit });
  }
  const lk = a.license_key || {};
  return res.json({ url, instanceId: a.instance.id, usage: lk.activation_usage, limit: lk.activation_limit, variant: (a.meta || {}).variant_name });
}
