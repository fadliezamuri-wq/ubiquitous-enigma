// Pangkalan data fail JSON ringkas. Sesuai untuk satu server dan ratusan/ribuan pelanggan.
// Untuk skala besar, tukar kepada Postgres/SQLite dengan antara muka yang sama.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function createStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "db.json");
  let db = { users: [], orders: [] };
  if (fs.existsSync(file)) db = JSON.parse(fs.readFileSync(file, "utf8"));

  function save() {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
  }

  return {
    userByEmail: (email) => db.users.find((u) => u.email === email),
    userById: (id) => db.users.find((u) => u.id === id),
    addUser(u) {
      const user = { id: crypto.randomUUID(), paid: false, createdAt: new Date().toISOString(), ...u };
      db.users.push(user); save(); return user;
    },
    addOrder(o) {
      const order = { id: "BB" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString("hex").toUpperCase(),
        status: "pending", createdAt: new Date().toISOString(), ...o };
      db.orders.push(order); save(); return order;
    },
    updateOrder(order, patch) { Object.assign(order, patch); save(); return order; },
    orderByBillCode: (code) => db.orders.find((o) => o.billCode === code),
    orderById: (id) => db.orders.find((o) => o.id === id),
    markPaid(order) {
      if (order.status === "paid") return;
      const now = new Date().toISOString();
      order.status = "paid"; order.paidAt = now;
      const user = db.users.find((u) => u.id === order.userId);
      if (user) { user.paid = true; user.paidAt = now; }
      save();
    },
  };
}
