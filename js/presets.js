export const PRESETS = [
  { name: "Ink", dots: "square", eyes: "square", fg: "#16171a", eye: "#16171a", bg: "#ffffff" },
  { name: "Tomato", dots: "rounded", eyes: "rounded", fg: "#1b1b1f", eye: "#ff5b35", bg: "#fff3ee" },
  { name: "Bubble", dots: "dots", eyes: "circle", fg: "#2c2fc2", eye: "#2c2fc2", bg: "#eef0ff" },
  { name: "Midnight", dots: "bars", eyes: "rounded", fg: "#e6ff6a", eye: "#e6ff6a", bg: "#15161a" },
  { name: "Forest", dots: "rounded", eyes: "square", fg: "#0f3d2e", eye: "#0f3d2e", bg: "#eef4ea" },
  { name: "Confetti", dots: "dots", eyes: "rounded", fg: "#16171a", eye: "#e0457b", bg: "#fff8d6" },
];

export const DOT_OPTIONS = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Blobby" },
  { value: "dots", label: "Dots" },
  { value: "bars", label: "Bars" },
];

export const EYE_OPTIONS = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Soft" },
  { value: "circle", label: "Round" },
];

// Example payloads for the "Not just links" section. Made up, not real accounts.
export const SAMPLES = {
  wifi: { type: "wifi", fields: { ssid: "Guest Wi-Fi", password: "tacotuesday", security: "WPA" }, style: PRESETS[0] },
  contact: { type: "contact", fields: { first: "Maya", last: "Okafor", phone: "+1 480 555 0142", email: "maya@okafor.studio" }, style: PRESETS[1] },
  link: { type: "link", fields: { url: "github.com/vjadh07/squint" }, style: PRESETS[4] },
};
