import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp, loadConfig } from "../server.mjs";

// ---- ToyyibPay palsu ----
const fake = { bills: [], paid: new Map(), down: false, emails: [] };
const gateway = http.createServer((req, res) => {
  let body = ""; req.on("data", (c) => (body += c));
  req.on("end", () => {
    const f = Object.fromEntries(new URLSearchParams(body));
    res.setHeader("content-type", "application/json");
    if (req.url === "/emails") {
      assert.equal(req.headers.authorization, "Bearer re_test");
      fake.emails.push(JSON.parse(body));
      return res.end(JSON.stringify({ id: "em_" + fake.emails.length }));
    }
    if (fake.down) { res.statusCode = 500; return res.end("down"); }
    if (req.url.endsWith("/createBill")) {
      const code = "bill" + (fake.bills.length + 1);
      fake.bills.push({ code, ...f });
      return res.end(JSON.stringify([{ BillCode: code }]));
    }
    if (req.url.endsWith("/getBillTransactions")) {
      const bill = fake.bills.find((b) => b.code === f.billCode);
      const amt = fake.paid.get(f.billCode);
      if (!bill || amt == null) return res.end(JSON.stringify([{ billpaymentStatus: "3" }]));
      return res.end(JSON.stringify([{ billpaymentStatus: "1", billpaymentAmount: amt, billExternalReferenceNo: bill.billExternalReferenceNo }]));
    }
    res.statusCode = 404; res.end("[]");
  });
});

let app, base, dataDir;
const listen = (srv) => new Promise((r) => srv.listen(0, "127.0.0.1", () => r(`http://127.0.0.1:${srv.address().port}`)));

before(async () => {
  const gw = await listen(gateway);
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "bb-"));
  const cfg = loadConfig({ SESSION_SECRET: "x".repeat(32), DATA_DIR: dataDir, PRICE_RM: "49", BASE_URL: "https://contoh.my",
    TOYYIBPAY_BASE: gw, TOYYIBPAY_SECRET_KEY: "rahsia", TOYYIBPAY_CATEGORY_CODE: "kat1",
    RESEND_API_KEY: "re_test", MAIL_FROM: "BentukBadan <hai@contoh.my>", RESEND_BASE: gw, ADMIN_EMAILS: "Admin@Contoh.my, bos@contoh.my" });
  app = createApp(cfg);
  base = await listen(app);
});
after(() => { app.close(); gateway.close(); fs.rmSync(dataDir, { recursive: true, force: true }); });

async function call(p, { body, cookie, form, method } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  let payload;
  if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
  if (form) { headers["content-type"] = "application/x-www-form-urlencoded"; payload = new URLSearchParams(form).toString(); }
  const res = await fetch(base + p, { method: method || (payload ? "POST" : "GET"), headers, body: payload, redirect: "manual" });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, cookie: (res.headers.get("set-cookie") || "").split(";")[0], location: res.headers.get("location") };
}

const user = { name: "Ali Bakar", email: "ali@contoh.my", phone: "012-345 6789", password: "kuatsekali" };
let sid;

test("halaman utama dihidangkan tanpa kandungan premium", async () => {
  const r = await call("/");
  assert.equal(r.status, 200);
  assert.match(r.data, /BentukBadan/);
  assert.doesNotMatch(r.data, /double progression/);
});

test("katalog tak bocorkan bahan resepi premium atau isi modul", async () => {
  const { data } = await call("/api/catalog");
  assert.equal(data.recipes.length, 20);
  for (const r of data.recipes) assert.equal("ing" in r, r.free, r.id);
  for (const m of data.modules) assert.equal(m.body, undefined);
});

test("premium perlukan log masuk", async () => {
  assert.equal((await call("/api/premium")).status, 401);
});

test("daftar: validasi dan cookie sesi", async () => {
  assert.equal((await call("/api/register", { body: { ...user, password: "pendek" } })).status, 400);
  assert.equal((await call("/api/register", { body: { ...user, email: "bukan-emel" } })).status, 400);
  const r = await call("/api/register", { body: user });
  assert.equal(r.status, 201);
  assert.deepEqual(r.data.user, { name: "Ali Bakar", email: "ali@contoh.my", paid: false });
  assert.match(r.cookie, /^sid=/);
  sid = r.cookie;
  assert.equal((await call("/api/register", { body: user })).status, 409);
  const db = fs.readFileSync(path.join(dataDir, "db.json"), "utf8");
  assert.doesNotMatch(db, /kuatsekali/, "kata laluan tak boleh disimpan sebagai teks biasa");
});

test("log masuk: salah dan betul", async () => {
  assert.equal((await call("/api/login", { body: { email: user.email, password: "salah123" } })).status, 401);
  assert.equal((await call("/api/login", { body: { email: "tiada@contoh.my", password: "salah123" } })).status, 401);
  const r = await call("/api/login", { body: { email: "ALI@contoh.my", password: user.password } });
  assert.equal(r.status, 200);
  assert.equal((await call("/api/me", { cookie: r.cookie })).data.user.email, user.email);
});

test("cookie yang diubah ditolak", async () => {
  const forged = sid.slice(0, -3) + "abc";
  assert.equal((await call("/api/me", { cookie: forged })).data.user, null);
});

test("belum bayar → premium 403", async () => {
  assert.equal((await call("/api/premium", { cookie: sid })).status, 403);
});

test("checkout tolak permintaan bukan JSON (CSRF) dan tanpa log masuk", async () => {
  assert.equal((await call("/api/checkout", { form: { a: 1 }, cookie: sid })).status, 415);
  assert.equal((await call("/api/checkout", { body: {} })).status, 401);
});

test("checkout cipta bil ToyyibPay dengan maklumat betul", async () => {
  const r = await call("/api/checkout", { body: {}, cookie: sid });
  assert.equal(r.status, 200);
  assert.match(r.data.url, /\/bill1$/);
  const b = fake.bills[0];
  assert.equal(b.userSecretKey, "rahsia");
  assert.equal(b.categoryCode, "kat1");
  assert.equal(b.billAmount, "4900");
  assert.equal(b.billEmail, user.email);
  assert.equal(b.billPhone, "0123456789");
  assert.equal(b.billReturnUrl, "https://contoh.my/bayaran/kembali");
  assert.equal(b.billCallbackUrl, "https://contoh.my/api/toyyibpay/callback");
  assert.ok(b.billName.length <= 30);
});

test("callback palsu (status=1) tanpa bayaran sebenar TIDAK buka akses", async () => {
  await call("/api/toyyibpay/callback", { form: { billcode: "bill1", status: "1", order_id: "x" } });
  const ret = await call("/bayaran/kembali?status_id=1&billcode=bill1&order_id=x");
  assert.equal(ret.status, 303);
  assert.equal(ret.location, "/?bayar=gagal");
  assert.equal((await call("/api/premium", { cookie: sid })).status, 403);
});

test("bayaran dengan jumlah salah tidak diterima", async () => {
  fake.paid.set("bill1", "1.00");
  await call("/api/toyyibpay/callback", { form: { billcode: "bill1" } });
  assert.equal((await call("/api/premium", { cookie: sid })).status, 403);
});

test("bayaran sah disahkan melalui API ToyyibPay → akses dibuka", async () => {
  fake.paid.set("bill1", "49.00");
  const r = await call("/api/toyyibpay/callback", { form: { billcode: "bill1", status: "1" } });
  assert.equal(r.data, "OK");
  const me = await call("/api/me", { cookie: sid });
  assert.equal(me.data.user.paid, true);
  const prem = await call("/api/premium", { cookie: sid });
  assert.equal(prem.status, 200);
  assert.equal(Object.keys(prem.data.modules).length, 6);
  assert.ok(prem.data.recipes["oat-pisang"].ing.length > 0);
  const ret = await call("/bayaran/kembali?status_id=1&billcode=bill1");
  assert.equal(ret.location, "/?bayar=berjaya");
  assert.equal((await call("/api/checkout", { body: {}, cookie: sid })).data.paid, true);
  const welcome = await waitForEmail((m) => m.to[0] === user.email && /dibuka/.test(m.subject));
  assert.match(welcome.html, /https:\/\/contoh\.my\/#panduan/);
});

test("gateway rosak → ralat 502 yang jelas", async () => {
  const r2 = await call("/api/register", { body: { ...user, email: "siti@contoh.my" } });
  fake.down = true;
  const r = await call("/api/checkout", { body: {}, cookie: r2.cookie });
  fake.down = false;
  assert.equal(r.status, 502);
});

test("path traversal disekat", async () => {
  const r = await call("/..%2Fserver.mjs");
  assert.notEqual(r.status, 200);
});

test("mod demo hanya jika tiada gateway dan tidak dalam production", () => {
  assert.throws(() => loadConfig({ NODE_ENV: "production", SESSION_SECRET: "s", DEMO_MODE: "1" }));
  assert.throws(() => loadConfig({ NODE_ENV: "production" }), /SESSION_SECRET/);
});

async function waitForEmail(pred) {
  for (let i = 0; i < 50; i++) {
    const m = fake.emails.find(pred); if (m) return m;
    await new Promise((r) => setTimeout(r, 20));
  }
  assert.fail("e-mel tidak dihantar");
}

/* ---------- Lupa kata laluan ---------- */
test("lupa kata laluan: e-mel tak berdaftar dapat balasan sama, tiada e-mel dihantar", async () => {
  const before = fake.emails.length;
  const a = await call("/api/forgot", { body: { email: "tiada@contoh.my" } });
  const b = await call("/api/forgot", { body: { email: user.email } });
  assert.equal(a.status, 200); assert.deepEqual(a.data, b.data);
  await waitForEmail((m) => m.to[0] === user.email && /kata laluan/i.test(m.subject));
  assert.equal(fake.emails.filter((m) => m.to[0] === "tiada@contoh.my").length, 0);
  assert.ok(fake.emails.length > before);
});

test("tetapkan semula kata laluan: token sekali guna, sesi lama terbatal", async () => {
  const mail = [...fake.emails].reverse().find((m) => m.to[0] === user.email && /kata laluan/i.test(m.subject));
  const token = mail.text.match(/\?reset=([\w-]+)/)[1];
  const oldSid = (await call("/api/login", { body: { email: user.email, password: user.password } })).cookie;
  assert.equal((await call("/api/reset", { body: { token, password: "pendek" } })).status, 400);
  assert.equal((await call("/api/reset", { body: { token: "salah", password: "baharu12345" } })).status, 400);
  const r = await call("/api/reset", { body: { token, password: "baharu12345" } });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.paid, true);
  assert.equal((await call("/api/me", { cookie: r.cookie })).data.user.email, user.email);
  assert.equal((await call("/api/me", { cookie: oldSid })).data.user, null, "sesi lama mesti terbatal");
  assert.equal((await call("/api/reset", { body: { token, password: "lagisekali1" } })).status, 400, "token tak boleh guna dua kali");
  assert.equal((await call("/api/login", { body: { email: user.email, password: user.password } })).status, 401);
  sid = (await call("/api/login", { body: { email: user.email, password: "baharu12345" } })).cookie;
  user.password = "baharu12345";
});

test("token tamat tempoh ditolak", async () => {
  await call("/api/forgot", { body: { email: "siti@contoh.my" } });
  const mail = await waitForEmail((m) => m.to[0] === "siti@contoh.my");
  const token = mail.text.match(/\?reset=([\w-]+)/)[1];
  const realNow = Date.now;
  Date.now = () => realNow() + 2 * 60 * 60 * 1000;
  try { assert.equal((await call("/api/reset", { body: { token, password: "baharu12345" } })).status, 400); }
  finally { Date.now = realNow; }
});

/* ---------- Admin ---------- */
let adminSid;
test("admin: bukan admin ditolak, admin (ADMIN_EMAILS) diterima", async () => {
  assert.equal((await call("/api/admin/summary")).status, 401);
  assert.equal((await call("/api/admin/summary", { cookie: sid })).status, 403);
  const r = await call("/api/register", { body: { name: "Pemilik", email: "admin@contoh.my", phone: "0199999999", password: "adminkuat123" } });
  adminSid = r.cookie;
  assert.equal(r.data.user.admin, true);
  const s = await call("/api/admin/summary", { cookie: adminSid });
  assert.equal(s.status, 200);
  assert.equal(s.data.stats.users, 3);
  assert.equal(s.data.stats.paidUsers, 1);
  assert.equal(s.data.stats.revenueRm, 49);
  assert.equal(s.data.users[0].hash, undefined, "hash kata laluan tak boleh didedahkan");
  assert.equal(s.data.users[0].salt, undefined);
  assert.equal((await call("/admin")).status, 200);
});

test("admin: beri dan tarik balik akses secara manual", async () => {
  const s = await call("/api/admin/summary", { cookie: adminSid });
  const siti = s.data.users.find((u) => u.email === "siti@contoh.my");
  assert.equal((await call(`/api/admin/users/${siti.id}/access`, { body: { paid: true }, cookie: sid })).status, 403);
  const g = await call(`/api/admin/users/${siti.id}/access`, { body: { paid: true, amountRm: 49, note: "Pindahan bank" }, cookie: adminSid });
  assert.equal(g.data.user.paid, true);
  let st = (await call("/api/admin/summary", { cookie: adminSid })).data.stats;
  assert.equal(st.revenueRm, 98);
  await call(`/api/admin/users/${siti.id}/access`, { body: { paid: false, refunded: true }, cookie: adminSid });
  st = (await call("/api/admin/summary", { cookie: adminSid })).data.stats;
  assert.equal(st.revenueRm, 49);
  assert.equal(st.paidUsers, 1);
});

test("admin: pautan kata laluan manual berfungsi", async () => {
  const s = await call("/api/admin/summary", { cookie: adminSid });
  const siti = s.data.users.find((u) => u.email === "siti@contoh.my");
  const r = await call(`/api/admin/users/${siti.id}/reset-link`, { body: {}, cookie: adminSid });
  const token = r.data.link.match(/\?reset=([\w-]+)/)[1];
  assert.equal((await call("/api/reset", { body: { token, password: "sitibaharu1" } })).status, 200);
});

test("admin: eksport CSV selamat daripada formula Excel", async () => {
  await call("/api/register", { body: { name: "=HYPERLINK(\"x\")", email: "jahat@contoh.my", phone: "0111111111", password: "abcdefgh1" } });
  const r = await call("/api/admin/export.csv", { cookie: adminSid });
  assert.equal(r.status, 200);
  assert.match(r.data, /"'=HYPERLINK\(""x""\)"/);
  assert.equal((await call("/api/admin/export.csv", { cookie: sid })).status, 403);
});

test("admin: semak status pesanan tertunda dengan ToyyibPay", async () => {
  const s = await call("/api/admin/summary", { cookie: adminSid });
  const jahat = s.data.users.find((u) => u.email === "jahat@contoh.my");
  const login = await call("/api/login", { body: { email: "jahat@contoh.my", password: "abcdefgh1" } });
  const co = await call("/api/checkout", { body: {}, cookie: login.cookie });
  const code = co.data.url.split("/").pop();
  const order = (await call("/api/admin/summary", { cookie: adminSid })).data.orders.find((o) => o.billCode === code);
  assert.equal((await call(`/api/admin/orders/${order.id}/verify`, { body: {}, cookie: adminSid })).data.status, "pending");
  fake.paid.set(code, "49.00");
  assert.equal((await call(`/api/admin/orders/${order.id}/verify`, { body: {}, cookie: adminSid })).data.status, "paid");
  assert.ok((await call("/api/admin/summary", { cookie: adminSid })).data.users.find((u) => u.id === jahat.id).paid);
});

test("pesanan yang dipulangkan wang tak dibuka semula oleh callback lewat", async () => {
  const s = await call("/api/admin/summary", { cookie: adminSid });
  const jahat = s.data.users.find((u) => u.email === "jahat@contoh.my");
  await call(`/api/admin/users/${jahat.id}/access`, { body: { paid: false, refunded: true }, cookie: adminSid });
  const order = s.data.orders.find((o) => o.userId === jahat.id);
  await call("/api/toyyibpay/callback", { form: { billcode: order.billCode, status: "1" } });
  assert.equal((await call("/api/admin/summary", { cookie: adminSid })).data.users.find((u) => u.id === jahat.id).paid, false);
});

test("buku PDF hanya untuk pembeli", async () => {
  assert.equal((await call("/api/premium/buku")).status, 401);
  const unpaid = await call("/api/register", { body: { name: "Belum Bayar", email: "belum@contoh.my", phone: "0122222222", password: "abcdefgh1" } });
  assert.equal((await call("/api/premium/buku", { cookie: unpaid.cookie })).status, 403);
  const r = await fetch(base + "/api/premium/buku", { headers: { cookie: sid } });
  assert.ok([200, 404].includes(r.status));
  if (r.status === 200) assert.equal(r.headers.get("content-type"), "application/pdf");
  assert.notEqual((await call("/buku/keluaran/BentukBadan-100-Hidangan.pdf")).status, 200, "PDF tak boleh dicapai secara terus");
});
