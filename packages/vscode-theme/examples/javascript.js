// Rajzik Dark — JavaScript syntax sample

const MAX_ITEMS = 100;
const API_BASE = "https://api.example.com/v1";

/**
 * Fetches paginated items and maps them to a display label.
 * @param {string} endpoint
 * @param {number} page
 * @returns {Promise<string[]>}
 */
async function fetchLabels(endpoint, page = 1) {
  const url = `${API_BASE}/${endpoint}?page=${page}&limit=${MAX_ITEMS}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items.map((item) => item.label ?? item.id);
}

class EventBus {
  #listeners = new Map();

  on(event, handler) {
    const set = this.#listeners.get(event) ?? new Set();
    set.add(handler);
    this.#listeners.set(event, set);
  }

  emit(event, payload) {
    for (const handler of this.#listeners.get(event) ?? []) {
      handler(payload);
    }
  }
}

// String interpolation in template literals
const greeting = `Hello, ${process.env.USER ?? "developer"}!`;
const multiline = `
  Theme: Rajzik Dark
  Items: ${MAX_ITEMS}
  Ready: ${true}
`;

// Object keys and computed property
const settings = {
  theme: "rajzik-dark",
  fontSize: 14,
  ["lineHeight"]: 1.5,
  features: {
    bracketPairColorization: true,
    semanticHighlighting: true,
  },
};

// Control flow and logical operators
function classify(score) {
  if (score >= 90) {
    return "excellent";
  } else if (score >= 70 && score < 90) {
    return "good";
  } else {
    return "needs-work";
  }
}

// Regex: groups, anchors, character classes
const EMAIL_RE = /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i;
const SLUG_RE = /[a-z0-9]+(?:-[a-z0-9]+)*/g;

// Array methods and arrow functions
const scores = [88, 72, 95, 61];
const labels = scores.map((s) => `${classify(s)} (${s})`);

export { EventBus, fetchLabels, greeting, settings, labels, EMAIL_RE };
