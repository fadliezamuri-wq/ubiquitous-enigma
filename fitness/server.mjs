// Server BentukBadan: laman statik + akaun + bayaran ToyyibPay + kandungan premium.
// Tiada pakej luar diperlukan (Node 20+).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createStore } from "./lib/store.mjs";
import { createToyyibPay } from "./lib/toyyibpay.mjs";
import { RECIPES, publicRecipe } from "./content/recipes.mjs";
import { MODULES, publicModule } from "./content/modules.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DAYS = 30;
const MAX_BODY = 16 * 1024;

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  let sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) {
    if (production) throw new Error("SESSION_SECRET wajib ditetapkan dalam production.");
    sessionSecret = crypto.randomBytes(32).toString("hex");
    console.warn("[amaran] SESSION_SECRET tiada; sesi log masuk akan hilang bila server restart.");
  }
  const port = Number(env.PORT || 3000);
  const cfg = {
    port,
    baseUrl: (env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, ""),
    dataDir: env.DATA_DIR || path.join(HERE, "data"),
    sessionSecret,
    priceCents: Math.round(Number(env.PRICE_RM || 49) * 100),
    refundDays: Number(env.REFUND_DAYS ?? 14),
    trustProxy: env.TRUST_PROXY === "1",
    secureCookie: env.COOKIE_SECURE ? env.COOKIE_SECURE === "1" : production,
    toyyib: env.TOYYIBPAY_SECRET_KEY && env.TOYYIBPAY_CATEGORY_CODE ? {
      base: env.TOYYIBPAY_BASE || "https://dev.toyyibpay.com",
      secretKey: env.TOYYIBPAY_SECRET_KEY,
      categoryCode: env.TOYYIBPAY_CATEGORY_CODE,
    } : null,
    demoMode: env.DEMO_MODE === "1",
  };
  if (cfg.toyyib && cfg.demoMode) cfg.demoMode = false; // gateway sebenar sentiasa diutamakan
  if (production && cfg.demoMode) throw new Error("DEMO_MODE tidak dibenarkan dalam production.");
  return cfg;
}

/* ---------- utiliti ---------- */
function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return { salt, hash };
}
function verifyPassword(pw, salt, hash) {
  const a = crypto.scryptSync(pw, salt, 64);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const b64 = (s) => Buffer.from(s).toString("base64url");

function json(res, status, data, headers = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });
  res.end(JSON.stringify(data));
}
function redirect(res, to) { res.writeHead(303, { location: to, "cache-control": "no-store" }); res.end(); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error("Badan permintaan terlalu besar"), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
async function readJson(req) {
  if (!(req.headers["content-type"] || "").startsWith("application/json"))
    throw Object.assign(new Error("Content-Type mesti application/json"), { status: 415 });
  try { return JSON.parse((await readBody(req)) || "{}"); }
  catch (e) { if (e.status) throw e; throw Object.assign(new Error("JSON tidak sah"), { status: 400 }); }
}
function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || "").split(";")) {
    const i = part.indexOf("="); if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return true; }
    h.n += 1; return h.n <= limit;
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATIC_TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };

/* ---------- app ---------- */
export function createApp(cfg, { fetchImpl = fetch } = {}) {
  const store = createStore(cfg.dataDir);
  const pay = cfg.toyyib ? createToyyibPay({ ...cfg.toyyib, fetchImpl }) : null;
  const publicDir = path.join(HERE, "public");
  const loginLimit = rateLimiter(10, 15 * 60 * 1000);
  const registerLimit = rateLimiter(10, 60 * 60 * 1000);

  function sign(v) { return crypto.createHmac("sha256", cfg.sessionSecret).update(v).digest("base64url"); }
  function sessionCookie(userId) {
    const exp = Date.now() + SESSION_DAYS * 864e5;
    const v = `${b64(userId)}.${exp}`;
    return `sid=${v}.${sign(v)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${cfg.secureCookie ? "; Secure" : ""}`;
  }
  const clearCookie = `sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cfg.secureCookie ? "; Secure" : ""}`;
  function currentUser(req) {
    const sid = parseCookies(req).sid; if (!sid) return null;
    const parts = sid.split("."); if (parts.length !== 3) return null;
    const [uid, exp, sig] = parts;
    const expected = sign(`${uid}.${exp}`);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Number(exp) < Date.now()) return null;
    return store.userById(Buffer.from(uid, "base64url").toString()) || null;
  }
  const clientIp = (req) => (cfg.trustProxy && String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress;
  const userView = (u) => u && { name: u.name, email: u.email, paid: !!u.paid };

  async function verifyOrder(order) {
    if (!order || order.status === "paid") return order?.status === "paid";
    if (!pay || !order.billCode) return false;
    const paid = await pay.isBillPaid(order.billCode, { orderId: order.id, amountCents: order.amountCents });
    if (paid) store.markPaid(order);
    return paid;
  }

  const routes = {
    "GET /api/config": (req, res) => json(res, 200, {
      priceRm: cfg.priceCents / 100, refundDays: cfg.refundDays,
      payment: pay ? "toyyibpay" : cfg.demoMode ? "demo" : "none",
    }),

    "GET /api/catalog": (req, res) => json(res, 200, {
      recipes: RECIPES.map(publicRecipe), modules: MODULES.map(publicModule),
    }),

    "GET /api/me": (req, res) => json(res, 200, { user: userView(currentUser(req)) }),

    "POST /api/register": async (req, res) => {
      if (!registerLimit(clientIp(req))) return json(res, 429, { error: "Terlalu banyak cubaan. Cuba lagi sebentar." });
      const b = await readJson(req);
      const name = String(b.name || "").trim().slice(0, 80);
      const email = String(b.email || "").trim().toLowerCase();
      const phone = String(b.phone || "").replace(/[^\d+]/g, "");
      const password = String(b.password || "");
      if (name.length < 2) return json(res, 400, { error: "Sila isi nama penuh." });
      if (!EMAIL_RE.test(email) || email.length > 200) return json(res, 400, { error: "E-mel tidak sah." });
      if (!/^\+?\d{9,15}$/.test(phone)) return json(res, 400, { error: "Nombor telefon tidak sah (contoh 0123456789)." });
      if (password.length < 8 || password.length > 200) return json(res, 400, { error: "Kata laluan mesti sekurang-kurangnya 8 aksara." });
      if (store.userByEmail(email)) return json(res, 409, { error: "E-mel ini dah didaftarkan. Sila log masuk." });
      const { salt, hash } = hashPassword(password);
      const user = store.addUser({ name, email, phone, salt, hash });
      json(res, 201, { user: userView(user) }, { "set-cookie": sessionCookie(user.id) });
    },

    "POST /api/login": async (req, res) => {
      const b = await readJson(req);
      const email = String(b.email || "").trim().toLowerCase();
      if (!loginLimit(`${clientIp(req)}|${email}`)) return json(res, 429, { error: "Terlalu banyak cubaan. Cuba lagi dalam 15 minit." });
      const user = store.userByEmail(email);
      // Sentiasa jalankan scrypt supaya masa balasan sama walaupun e-mel tiada.
      const ok = user ? verifyPassword(String(b.password || ""), user.salt, user.hash)
        : (verifyPassword(String(b.password || ""), "0".repeat(32), "0".repeat(128)), false);
      if (!ok) return json(res, 401, { error: "E-mel atau kata laluan salah." });
      json(res, 200, { user: userView(user) }, { "set-cookie": sessionCookie(user.id) });
    },

    "POST /api/logout": (req, res) => json(res, 200, { ok: true }, { "set-cookie": clearCookie }),

    "GET /api/premium": (req, res) => {
      const user = currentUser(req);
      if (!user) return json(res, 401, { error: "Sila log masuk." });
      if (!user.paid) return json(res, 403, { error: "Akses Penuh belum dibeli." });
      json(res, 200, {
        recipes: Object.fromEntries(RECIPES.map((r) => [r.id, { ing: r.ing, steps: r.steps }])),
        modules: Object.fromEntries(MODULES.map((m) => [m.n, m.body])),
      });
    },

    "POST /api/checkout": async (req, res) => {
      await readJson(req); // paksa JSON (perlindungan CSRF)
      const user = currentUser(req);
      if (!user) return json(res, 401, { error: "Sila log masuk dahulu." });
      if (user.paid) return json(res, 200, { paid: true });
      if (pay) {
        const order = store.addOrder({ userId: user.id, amountCents: cfg.priceCents, gateway: "toyyibpay" });
        let billCode;
        try {
          billCode = await pay.createBill({
            orderId: order.id, amountCents: cfg.priceCents, name: user.name, email: user.email, phone: user.phone,
            returnUrl: `${cfg.baseUrl}/bayaran/kembali`, callbackUrl: `${cfg.baseUrl}/api/toyyibpay/callback`,
          });
        } catch (e) {
          console.error(e);
          store.updateOrder(order, { status: "failed" });
          return json(res, 502, { error: "Gateway bayaran tidak dapat dihubungi. Cuba lagi sebentar." });
        }
        store.updateOrder(order, { billCode });
        return json(res, 200, { url: pay.paymentUrl(billCode) });
      }
      if (cfg.demoMode) {
        const order = store.addOrder({ userId: user.id, amountCents: cfg.priceCents, gateway: "demo" });
        store.markPaid(order);
        return json(res, 200, { paid: true, demo: true });
      }
      json(res, 503, { error: "Pembayaran belum disediakan oleh pemilik laman." });
    },

    // ToyyibPay hantar POST (form) ke sini selepas bayaran. Status disahkan semula melalui API.
    "POST /api/toyyibpay/callback": async (req, res) => {
      const form = new URLSearchParams(await readBody(req));
      const order = store.orderByBillCode(form.get("billcode") || "");
      try { await verifyOrder(order); } catch (e) { console.error(e); }
      res.writeHead(200, { "content-type": "text/plain" }); res.end("OK");
    },

    // Pelanggan dibawa balik ke sini: ?status_id=1&billcode=...&order_id=...
    "GET /bayaran/kembali": async (req, res, url) => {
      const order = store.orderByBillCode(url.searchParams.get("billcode") || "");
      let paid = false;
      try { paid = await verifyOrder(order); } catch (e) { console.error(e); }
      if (paid) return redirect(res, "/?bayar=berjaya");
      redirect(res, url.searchParams.get("status_id") === "2" ? "/?bayar=menunggu" : "/?bayar=gagal");
    },
  };

  function serveStatic(req, res, url) {
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.normalize(path.join(publicDir, rel));
    if (!file.startsWith(publicDir + path.sep)) return json(res, 403, { error: "Dilarang" });
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); return res.end("Tidak dijumpai"); }
      res.writeHead(200, { "content-type": STATIC_TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
      res.end(buf);
    });
  }

  return http.createServer(async (req, res) => {
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("x-frame-options", "DENY");
    res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
    const url = new URL(req.url, "http://x");
    const handler = routes[`${req.method} ${url.pathname}`];
    try {
      if (handler) return await handler(req, res, url);
      if (url.pathname.startsWith("/api/")) return json(res, 404, { error: "Tidak dijumpai" });
      if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res, url);
      json(res, 405, { error: "Kaedah tidak dibenarkan" });
    } catch (e) {
      if (!e.status) console.error(e);
      if (!res.headersSent) json(res, e.status || 500, { error: e.status ? e.message : "Ralat server" });
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const cfg = loadConfig();
  createApp(cfg).listen(cfg.port, () => {
    const mode = cfg.toyyib ? `ToyyibPay (${cfg.toyyib.base})` : cfg.demoMode ? "DEMO (tiada bayaran sebenar)" : "TIADA (butang beli dimatikan)";
    console.log(`BentukBadan berjalan di ${cfg.baseUrl}  ·  Bayaran: ${mode}`);
  });
}
