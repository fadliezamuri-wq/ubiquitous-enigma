import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp, loadConfig } from "../server.mjs";

// ---- ToyyibPay palsu ----
const fake = { bills: [], paid: new Map(), down: false };
const gateway = http.createServer((req, res) => {
  let body = ""; req.on("data", (c) => (body += c));
  req.on("end", () => {
    const f = Object.fromEntries(new URLSearchParams(body));
    res.setHeader("content-type", "application/json");
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
    TOYYIBPAY_BASE: gw, TOYYIBPAY_SECRET_KEY: "rahsia", TOYYIBPAY_CATEGORY_CODE: "kat1" });
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
