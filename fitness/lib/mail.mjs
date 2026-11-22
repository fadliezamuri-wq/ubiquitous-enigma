// Penghantar e-mel melalui API Resend (https://resend.com). Tiada pakej luar.
// Jika RESEND_API_KEY tiada, e-mel hanya dicetak ke log server (sesuai untuk ujian di komputer).

export function createMailer({ apiKey, from, base = "https://api.resend.com", fetchImpl = fetch, log = console }) {
  const enabled = Boolean(apiKey && from);
  return {
    enabled,
    async send({ to, subject, html, text }) {
      if (!enabled) {
        log.log(`[e-mel tidak dihantar: RESEND_API_KEY tiada]\n  Kepada: ${to}\n  Tajuk: ${subject}\n  ${text}`);
        return false;
      }
      const res = await fetchImpl(`${base.replace(/\/+$/, "")}/emails`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html, text }),
      });
      if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return true;
    },
  };
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f4;font-family:Arial,sans-serif;color:#15201a">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<div style="font-size:22px;font-weight:800;margin-bottom:20px">Bentuk<span style="color:#1f8a4c">Badan</span></div>
<div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #dde3da">
<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>${bodyHtml}</div>
<p style="color:#5d6b62;font-size:12px;margin-top:16px">Anda terima e-mel ini kerana ada akaun di BentukBadan.</p>
</div></body></html>`;
}
const button = (href, label) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#1f8a4c;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block">${escapeHtml(label)}</a></p>`;

export function resetEmail({ name, link }) {
  return {
    subject: "Tetapkan semula kata laluan BentukBadan",
    text: `Hai ${name}, tekan pautan ini untuk tetapkan kata laluan baharu (sah 1 jam): ${link}\nJika anda tak minta, abaikan e-mel ini.`,
    html: layout("Tetapkan semula kata laluan",
      `<p>Hai ${escapeHtml(name)},</p><p>Kami terima permintaan untuk tetapkan semula kata laluan akaun anda. Pautan ini sah selama 1 jam.</p>
${button(link, "Tetapkan kata laluan baharu")}
<p style="color:#5d6b62;font-size:14px">Jika anda tak minta, abaikan e-mel ini. Kata laluan anda tak akan berubah.</p>`),
  };
}

export function welcomeEmail({ name, link }) {
  return {
    subject: "Akses Penuh BentukBadan dah dibuka 🎉",
    text: `Terima kasih ${name}! Bayaran anda berjaya. Log masuk untuk baca semua panduan: ${link}`,
    html: layout("Terima kasih! Akses Penuh dah dibuka",
      `<p>Hai ${escapeHtml(name)},</p><p>Bayaran anda berjaya. Semua 6 modul panduan dan resepi premium kini dibuka dalam akaun anda.</p>
${button(link, "Mula baca panduan")}
<p style="color:#5d6b62;font-size:14px">Log masuk dengan e-mel ini dari mana-mana peranti.</p>`),
  };
}
