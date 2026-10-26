/* =========================================================
   TETAPAN UTAMA — TUKAR MAKLUMAT ANDA DI SINI SAHAJA
   ---------------------------------------------------------
   WHATSAPP_NUMBER:
     - Tulis nombor dengan kod negara 60, TANPA tanda +, sengkang
       atau ruang. Contoh: 0123456789 ditulis sebagai "60123456789".
     - Selagi nilai ini masih "60XXXXXXXXX", butang WhatsApp
       hanya menunjukkan notis (mod demo) dan tidak menghantar
       mesej kepada sesiapa.
   EMAIL:
     - Emel perniagaan anda. Biarkan "" untuk sembunyikan.
   ========================================================= */
const SETTINGS = {
  WHATSAPP_NUMBER: "60XXXXXXXXX",
  EMAIL: "emel@contoh.com",
};

/* ====== Anda tidak perlu ubah apa-apa di bawah ini ====== */

const PLACEHOLDER_NUMBER = "60XXXXXXXXX";
const waReady = /^60\d{8,11}$/.test(SETTINGS.WHATSAPP_NUMBER);

function waLink(message) {
  return "https://wa.me/" + SETTINGS.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
}

/* ---------- Notis kecil (toast) ---------- */
const toast = document.getElementById("toast");
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
}

function demoModeNotice() {
  showToast("Mod demo: nombor WhatsApp belum ditetapkan. Tukar " + PLACEHOLDER_NUMBER + " dalam fail script.js kepada nombor sebenar anda.");
}

/* ---------- Butang WhatsApp ---------- */
document.querySelectorAll(".js-whatsapp").forEach((el) => {
  const message = el.dataset.message || "Hai, saya ingin bertanya tentang servis anda.";
  if (waReady) {
    el.href = waLink(message);
    el.target = "_blank";
    el.rel = "noopener";
  } else {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      demoModeNotice();
    });
  }
});

/* ---------- Emel ---------- */
document.querySelectorAll(".js-email").forEach((el) => {
  if (SETTINGS.EMAIL) {
    el.textContent = SETTINGS.EMAIL;
  } else {
    el.closest("li").remove();
  }
});

/* ---------- Menu telefon ---------- */
const navToggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");
navToggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
});
menu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    menu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Buka menu");
  })
);

/* ---------- Tapis contoh kerja ---------- */
const tabs = document.querySelectorAll(".tab");
const works = document.querySelectorAll(".work");
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", String(t === tab));
    });
    const filter = tab.dataset.filter;
    works.forEach((w) => {
      w.hidden = filter !== "semua" && w.dataset.type !== filter;
    });
  })
);

/* ---------- Butang "Pilih pakej" isi borang secara automatik ---------- */
const servisSelect = document.getElementById("jenis-servis");
document.querySelectorAll(".js-pick").forEach((btn) =>
  btn.addEventListener("click", () => {
    servisSelect.value = btn.dataset.service;
    clearError(servisSelect);
  })
);

/* ---------- Borang pertanyaan ---------- */
const form = document.getElementById("borang");
const statusBox = document.getElementById("form-status");

function setError(input, text) {
  input.classList.add("invalid");
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", input.id + "-error");
  document.getElementById(input.id + "-error").textContent = text;
}
function clearError(input) {
  input.classList.remove("invalid");
  input.removeAttribute("aria-invalid");
  const err = document.getElementById(input.id + "-error");
  if (err) err.textContent = "";
}

// Terima format Malaysia: 012-345 6789, 0123456789, +60123456789, 60123456789
function normalisePhone(raw) {
  let digits = raw.replace(/[\s\-()+]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("60")) digits = "0" + digits.slice(2);
  return /^0\d{8,10}$/.test(digits) ? digits : null;
}

form.querySelectorAll("input, select").forEach((el) =>
  el.addEventListener("input", () => clearError(el))
);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  statusBox.className = "form-status";
  statusBox.textContent = "";

  const nama = form.nama;
  const perniagaan = form.perniagaan;
  const servis = form.servis;
  const telefon = form.telefon;
  let firstInvalid = null;
  const fail = (input, text) => {
    setError(input, text);
    if (!firstInvalid) firstInvalid = input;
  };

  [nama, perniagaan, servis, telefon].forEach(clearError);

  if (nama.value.trim().length < 2) fail(nama, "Sila masukkan nama anda.");
  if (perniagaan.value.trim().length < 2) fail(perniagaan, "Sila masukkan nama perniagaan.");
  if (!servis.value) fail(servis, "Sila pilih jenis servis.");
  const phone = normalisePhone(telefon.value);
  if (!telefon.value.trim()) fail(telefon, "Sila masukkan nombor telefon.");
  else if (!phone) fail(telefon, "Nombor telefon tidak sah. Contoh: 012-345 6789");

  if (firstInvalid) {
    firstInvalid.focus();
    statusBox.classList.add("is-error");
    statusBox.textContent = "Sila betulkan maklumat yang bertanda merah.";
    return;
  }

  const lines = [
    "Hai AI Digital Studio Sarawak, saya ingin membuat pertanyaan.",
    "",
    "Nama: " + nama.value.trim(),
    "Perniagaan: " + perniagaan.value.trim(),
    "Servis: " + servis.value,
    "Telefon: " + phone,
  ];
  const extra = form.mesej.value.trim();
  if (extra) lines.push("Mesej: " + extra);
  const message = lines.join("\n");

  statusBox.classList.add("is-success");
  if (waReady) {
    statusBox.textContent = "Terima kasih, " + nama.value.trim() + "! WhatsApp sedang dibuka. Sila tekan butang hantar di WhatsApp.";
    window.open(waLink(message), "_blank", "noopener");
  } else {
    statusBox.textContent = "Borang berfungsi! (Mod demo: nombor WhatsApp belum ditetapkan, jadi tiada mesej dihantar.)";
    demoModeNotice();
  }
  form.reset();
});

/* ---------- Tahun di bahagian bawah ---------- */
document.getElementById("tahun").textContent = new Date().getFullYear();
