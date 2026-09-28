import { buildPayload } from "./payload.js";
import { encode, renderSvg, scanWarning, QUIET_ZONE, DEFAULT_STYLE } from "./render.js";
import { PRESETS, DOT_OPTIONS, EYE_OPTIONS, SAMPLES } from "./presets.js";

const PLACEHOLDER = "https://github.com/vjadh07/squint";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const STORAGE_KEY = "squint-style";
const TOAST_MS = 2600;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- state ---------- */

const initialFields = {
  link: { url: "" },
  text: { text: "" },
  wifi: { ssid: "", password: "", security: "WPA", hidden: false },
  email: { to: "", subject: "", body: "" },
  phone: { number: "" },
  sms: { number: "", body: "" },
  contact: { first: "", last: "", phone: "", email: "", org: "", url: "" },
};

let state = {
  type: "link",
  fields: initialFields,
  style: { ...DEFAULT_STYLE, eye: DEFAULT_STYLE.fg, ...loadStyle() },
  ecc: "M",
  pngSize: 1024,
};

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

const setStyle = (patch) => {
  setState({ style: { ...state.style, ...patch } });
  saveStyle();
};

const setField = (type, key, value) =>
  setState({ type, fields: { ...state.fields, [type]: { ...state.fields[type], [key]: value } } });

function loadStyle() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const { logo, ...rest } = saved; // logos are too big to keep around
    return rest;
  } catch {
    return {};
  }
}

function saveStyle() {
  try {
    const { logo, ...rest } = state.style;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    /* private mode or storage blocked, not worth bothering the user */
  }
}

/* ---------- derived ---------- */

const effectiveEcc = () => (state.style.logo ? "H" : state.ecc);

function currentCode() {
  const payload = buildPayload(state.type, state.fields[state.type]);
  const isEmpty = !payload;
  try {
    const matrix = encode(window.qrcode, isEmpty ? PLACEHOLDER : payload, effectiveEcc());
    return { matrix, payload, isEmpty, error: "" };
  } catch {
    return { matrix: null, payload, isEmpty, error: "That's too much for one QR code. Try a shorter link or less text." };
  }
}

/* ---------- render ---------- */

let lastCode = null;

function render() {
  const code = currentCode();
  if (code.matrix) lastCode = code;

  const svg = lastCode ? renderSvg(lastCode.matrix, state.style) : "";
  for (const slot of $$("#hero-sticker [data-qr], #studio-sticker [data-qr]")) {
    slot.innerHTML = svg;
    slot.classList.toggle("is-empty", code.isEmpty);
    slot.classList.toggle("checker", state.style.transparent && !state.style.frame);
  }

  renderBackStickers();
  renderStatus(code);
  renderMeta(code);
  syncControls();
}

function renderBackStickers() {
  if (!lastCode) return;
  for (const el of $$(".sticker-back")) {
    const preset = PRESETS[+el.dataset.preset];
    el.innerHTML = renderSvg(lastCode.matrix, { ...DEFAULT_STYLE, ...preset });
  }
}

function renderStatus(code) {
  const el = $("#status");
  const s = state.style;
  let text = "", kind = "";
  if (code.error) { text = code.error; kind = "error"; }
  else if (code.isEmpty) { text = "Fill in the details and your code shows up here."; }
  else {
    const warning = scanWarning(s.fg, s.bg, s.transparent && !s.frame) || scanWarning(s.eye || s.fg, s.bg, false);
    if (warning) { text = warning; kind = "warn"; }
    else if (s.logo) text = "Logo on. Damage tolerance is set to Max so it still scans.";
    else text = "Looks scannable. Test it with your phone camera before printing.";
  }
  el.textContent = text;
  el.className = `status ${kind}`;
}

function renderMeta(code) {
  if (!code.matrix || code.isEmpty) { $("#meta").textContent = ""; return; }
  const n = code.matrix.length;
  $("#meta").textContent = `${n} x ${n} modules, level ${effectiveEcc()}, ${code.payload.length} characters`;
}

function syncControls() {
  const s = state.style;
  for (const tab of $$("#type-tabs [role=tab]")) {
    const on = tab.dataset.type === state.type;
    tab.setAttribute("aria-selected", on);
    tab.tabIndex = on ? 0 : -1;
  }
  for (const panel of $$("[data-fields]")) panel.hidden = panel.dataset.fields !== state.type;

  for (const btn of $$("#dot-options .swatch")) btn.setAttribute("aria-pressed", btn.dataset.value === s.dots);
  for (const btn of $$("#eye-options .swatch")) btn.setAttribute("aria-pressed", btn.dataset.value === s.eyes);

  setValue($("#c-fg"), s.fg);
  setValue($("#c-eye"), s.eye || s.fg);
  setValue($("#c-bg"), s.bg);
  for (const hex of $$(".hex")) setValue(hex, $(`#${hex.dataset.hexFor}`).value);

  $("#c-transparent").checked = s.transparent;
  $("#c-transparent").disabled = s.frame;
  $("#frame-toggle").checked = s.frame;
  $("#frame-text").disabled = !s.frame;
  $("#ecc").value = effectiveEcc();
  $("#ecc").disabled = !!s.logo;
  $("#logo-remove").hidden = !s.logo;
  $("#logo-label").textContent = s.logo ? "Change image" : "Upload image";

  for (const b of $$(".sizes button")) b.setAttribute("aria-checked", +b.dataset.size === state.pngSize);
  renderSwatchColors();
}

// Don't stomp on a field the user is typing in.
function setValue(el, value) {
  if (document.activeElement !== el && el.value !== value) el.value = value;
}

/* ---------- swatches ---------- */

const sampleMatrix = () => encode(window.qrcode, "squint", "M");
const crop = (svg, x, y, size) => svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${size} ${size}"`);

function buildSwatches() {
  const m = QUIET_ZONE;
  const make = (container, options, key, cropBox) => {
    container.innerHTML = "";
    for (const opt of options) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch";
      btn.dataset.value = opt.value;
      btn.dataset.crop = cropBox.join(" ");
      btn.innerHTML = `<span class="swatch-art" aria-hidden="true"></span>${opt.label}`;
      btn.addEventListener("click", () => setStyle({ [key]: opt.value }));
      container.append(btn);
    }
  };
  make($("#dot-options"), DOT_OPTIONS, "dots", [m + 5, m + 5, 11]);
  make($("#eye-options"), EYE_OPTIONS, "eyes", [m - 1, m - 1, 9]);

  const presets = $("#presets");
  const matrix = sampleMatrix();
  presets.innerHTML = "";
  for (const p of PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.innerHTML = `<span class="swatch-art" aria-hidden="true">${renderSvg(matrix, { ...DEFAULT_STYLE, ...p })}</span>${p.name}`;
    btn.addEventListener("click", () => applyPreset(p));
    presets.append(btn);
  }
}

function renderSwatchColors() {
  const matrix = sampleMatrix();
  const s = state.style;
  for (const btn of $$("#dot-options .swatch, #eye-options .swatch")) {
    const key = btn.parentElement.dataset.styleKey;
    const svg = renderSvg(matrix, { ...s, logo: "", frame: false, transparent: false, [key]: btn.dataset.value });
    const [x, y, size] = btn.dataset.crop.split(" ").map(Number);
    btn.firstElementChild.innerHTML = crop(svg, x, y, size);
  }
}

function applyPreset(p) {
  const { name, ...style } = p;
  setStyle({ ...style, transparent: false });
  pop();
}

function pop() {
  const el = $("#studio-sticker");
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}

/* ---------- export ---------- */

function exportSvg() {
  const code = currentCode();
  if (code.isEmpty || !code.matrix) {
    toast(code.error ? "Fix the error first." : "Type something first.");
    focusCurrentField();
    return null;
  }
  return renderSvg(code.matrix, state.style);
}

function svgToPngBlob(svg, width) {
  return new Promise((resolve, reject) => {
    const [, , w, h] = svg.match(/viewBox="([^"]*)"/)[1].split(" ").map(Number);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.round(width * (h / w));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not draw the image")); };
    img.src = url;
  });
}

function saveBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function downloadPng() {
  const svg = exportSvg();
  if (!svg) return;
  try {
    saveBlob(await svgToPngBlob(svg, state.pngSize), `squint-${state.type}.png`);
    toast("Saved. Scan it once before you print it.");
  } catch (err) {
    console.error(err);
    toast("Couldn't make the PNG. Try the SVG instead.");
  }
}

function downloadSvg() {
  const svg = exportSvg();
  if (!svg) return;
  saveBlob(new Blob([svg], { type: "image/svg+xml" }), `squint-${state.type}.svg`);
  toast("SVG saved. It scales to any size.");
}

async function copyPng() {
  const svg = exportSvg();
  if (!svg) return;
  if (!navigator.clipboard || !window.ClipboardItem) { toast("Your browser can't copy images. Download it instead."); return; }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": svgToPngBlob(svg, state.pngSize) })]);
    toast("Copied. Paste it anywhere.");
  } catch (err) {
    console.error(err);
    toast("Copy didn't work here. Download it instead.");
  }
}

/* ---------- ui helpers ---------- */

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, TOAST_MS);
}

function focusCurrentField() {
  const input = $(`[data-fields="${state.type}"] [data-key]`);
  if (state.type === "link" && document.activeElement === $("#quick-url")) return;
  input?.focus({ preventScroll: false });
}

function readLogo(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) { $("#logo-hint").textContent = "That file type won't work. Use PNG, JPG, SVG or WebP."; return; }
  if (file.size > MAX_LOGO_BYTES) { $("#logo-hint").textContent = "That image is over 2 MB. Try a smaller one."; return; }
  const reader = new FileReader();
  reader.onload = () => {
    $("#logo-hint").textContent = file.name;
    setState({ style: { ...state.style, logo: reader.result } });
  };
  reader.onerror = () => { $("#logo-hint").textContent = "Couldn't read that file."; };
  reader.readAsDataURL(file);
}

/* ---------- events ---------- */

function bindEvents() {
  const quick = $("#quick-url");
  quick.addEventListener("input", () => {
    setField("link", "url", quick.value);
    $("#f-link-url").value = quick.value;
  });
  $("#quick-form").addEventListener("submit", (e) => { e.preventDefault(); downloadPng(); });

  $("#type-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest("[role=tab]");
    if (tab) setState({ type: tab.dataset.type });
  });
  $("#type-tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const tabs = $$("#type-tabs [role=tab]");
    const i = tabs.findIndex((t) => t.dataset.type === state.type);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    setState({ type: next.dataset.type });
    next.focus();
  });

  for (const panel of $$("[data-fields]")) {
    const type = panel.dataset.fields;
    panel.addEventListener("input", (e) => {
      const key = e.target.dataset.key;
      if (!key) return;
      setField(type, key, e.target.type === "checkbox" ? e.target.checked : e.target.value);
      if (type === "link" && key === "url") quick.value = e.target.value;
    });
  }

  for (const picker of $$("input[type=color]")) {
    picker.addEventListener("input", () => setStyle({ [picker.dataset.styleKey]: picker.value }));
  }
  for (const hex of $$(".hex")) {
    hex.addEventListener("input", () => {
      const v = hex.value.trim();
      const full = v.startsWith("#") ? v : `#${v}`;
      if (!/^#[0-9a-f]{6}$/i.test(full)) return;
      setStyle({ [$(`#${hex.dataset.hexFor}`).dataset.styleKey]: full.toLowerCase() });
    });
    hex.addEventListener("blur", () => { hex.value = $(`#${hex.dataset.hexFor}`).value; });
  }

  $("#c-transparent").addEventListener("change", (e) => setStyle({ transparent: e.target.checked }));
  $("#frame-toggle").addEventListener("change", (e) => setStyle({ frame: e.target.checked }));
  $("#frame-text").addEventListener("input", (e) => setStyle({ frameText: e.target.value || " " }));
  $("#ecc").addEventListener("change", (e) => setState({ ecc: e.target.value }));

  $("#logo-input").addEventListener("change", (e) => { readLogo(e.target.files[0]); e.target.value = ""; });
  $("#logo-remove").addEventListener("click", () => {
    $("#logo-hint").textContent = "PNG, JPG, SVG or WebP, up to 2 MB.";
    setState({ style: { ...state.style, logo: "" } });
  });

  $(".sizes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-size]");
    if (b) setState({ pngSize: +b.dataset.size });
  });
  $("#dl-png").addEventListener("click", downloadPng);
  $("#dl-svg").addEventListener("click", downloadSvg);
  $("#copy-png").addEventListener("click", copyPng);

  for (const back of $$(".sticker-back")) {
    back.addEventListener("click", () => applyPreset(PRESETS[+back.dataset.preset]));
  }

  for (const btn of $$("[data-jump]")) {
    btn.addEventListener("click", () => {
      setState({ type: btn.dataset.jump });
      $("#studio").scrollIntoView();
      $(`[data-fields="${btn.dataset.jump}"] [data-key]`)?.focus({ preventScroll: true });
    });
  }
}

function bindTilt() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  if (reduce || !fine) return;
  const fan = $(".fan");
  const card = $("#hero-sticker");
  let frame = 0;
  fan.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = fan.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--rx", `${(x * 14).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(-y * 14).toFixed(2)}deg`);
    });
  });
  fan.addEventListener("pointerleave", () => {
    cancelAnimationFrame(frame);
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
}

function bindReveal() {
  const els = $$("[data-reveal]");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("in");
      io.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
}

function renderSamples() {
  for (const slot of $$("[data-sample]")) {
    const sample = SAMPLES[slot.dataset.sample];
    const matrix = encode(window.qrcode, buildPayload(sample.type, sample.fields), "M");
    slot.innerHTML = renderSvg(matrix, { ...DEFAULT_STYLE, ...sample.style });
  }
}

/* ---------- boot ---------- */

function boot() {
  if (!window.qrcode) {
    $("#status").textContent = "The QR library didn't load. Refresh the page to try again.";
    return;
  }
  $("#hero-sticker [data-qr]").dataset.empty = "Type a link to start";
  $("#studio-sticker [data-qr]").dataset.empty = "Waiting for details";
  buildSwatches();
  bindEvents();
  bindTilt();
  bindReveal();
  renderSamples();
  render();
}

// app.js is a module (deferred), and vendor/qrcode.js is deferred before it, so both are ready here.
boot();
