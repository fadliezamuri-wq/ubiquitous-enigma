// Klien ToyyibPay minimum: cipta bil dan sahkan status bayaran.
// Sandbox: https://dev.toyyibpay.com  ·  Live: https://toyyibpay.com

export function createToyyibPay({ base, secretKey, categoryCode, fetchImpl = fetch }) {
  const root = base.replace(/\/+$/, "");

  async function post(path, fields) {
    const res = await fetchImpl(`${root}/index.php/api/${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields).toString(),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`ToyyibPay ${path} HTTP ${res.status}: ${text.slice(0, 200)}`);
    try { return JSON.parse(text); } catch { throw new Error(`ToyyibPay ${path} balas bukan JSON: ${text.slice(0, 200)}`); }
  }

  return {
    paymentUrl: (billCode) => `${root}/${encodeURIComponent(billCode)}`,

    async createBill({ orderId, amountCents, name, email, phone, returnUrl, callbackUrl }) {
      const data = await post("createBill", {
        userSecretKey: secretKey,
        categoryCode,
        billName: "Akses Penuh BentukBadan", // maks 30 aksara
        billDescription: "Akses penuh panduan kurus dan bina otot", // maks 100 aksara
        billPriceSetting: "1",
        billPayorInfo: "1",
        billAmount: String(amountCents), // dalam sen
        billReturnUrl: returnUrl,
        billCallbackUrl: callbackUrl,
        billExternalReferenceNo: orderId,
        billTo: name,
        billEmail: email,
        billPhone: phone,
        billSplitPayment: "0",
        billSplitPaymentArgs: "",
        billPaymentChannel: "2", // FPX + kad
        billChargeToCustomer: "", // caj ditanggung peniaga
        billExpiryDays: "3",
        billContentEmail: "Terima kasih! Log masuk ke BentukBadan untuk baca semua panduan.",
      });
      const billCode = Array.isArray(data) ? data[0]?.BillCode : undefined;
      if (!billCode) throw new Error(`ToyyibPay createBill gagal: ${JSON.stringify(data).slice(0, 200)}`);
      return billCode;
    },

    // Jangan percaya parameter callback/return. Tanya ToyyibPay terus.
    async isBillPaid(billCode, { orderId, amountCents }) {
      const data = await post("getBillTransactions", { billCode });
      if (!Array.isArray(data)) return false;
      return data.some((t) =>
        String(t.billpaymentStatus) === "1" &&
        (t.billExternalReferenceNo == null || t.billExternalReferenceNo === orderId) &&
        (t.billpaymentAmount == null || Math.round(parseFloat(t.billpaymentAmount) * 100) === amountCents));
    },
  };
}
