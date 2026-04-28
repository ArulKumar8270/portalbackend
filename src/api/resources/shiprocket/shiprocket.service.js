const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

// Ensure env vars are loaded even if app bootstrap forgot dotenv.config()
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const dotenv = require("dotenv");
  const path = require("path");
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
} catch {
  // ignore (dotenv may already be loaded)
}

let cachedToken = null;
let cachedAtMs = 0;

function getCreds() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("Missing SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD env vars");
  }
  return { email, password };
}

async function shiprocketFetch(path, { method = "GET", token, body, query } = {}) {
  const url = new URL(`${SHIPROCKET_BASE}${path}`);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Shiprocket ${method} ${path} failed (${res.status})`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

async function getToken({ force = false } = {}) {
  // Token valid for ~10 days; refresh a bit early (9 days)
  const ageMs = Date.now() - cachedAtMs;
  if (!force && cachedToken && ageMs < 9 * 24 * 60 * 60 * 1000) return cachedToken;

  const { email, password } = getCreds();
  const out = await shiprocketFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!out?.token) {
    throw new Error("Shiprocket auth did not return token");
  }
  cachedToken = out.token;
  cachedAtMs = Date.now();
  return cachedToken;
}

async function authed(path, { method = "GET", body, query } = {}) {
  const token = await getToken();
  try {
    return await shiprocketFetch(path, { method, token, body, query });
  } catch (e) {
    // Retry once on auth failure
    if (e?.status === 401) {
      const fresh = await getToken({ force: true });
      return shiprocketFetch(path, { method, token: fresh, body, query });
    }
    throw e;
  }
}

module.exports = {
  getToken,
  serviceability: (query) => authed("/courier/serviceability/", { method: "GET", query }),
  createOrderAdhoc: (body) => authed("/orders/create/adhoc", { method: "POST", body }),
  assignAwb: (body) => authed("/courier/assign/awb", { method: "POST", body }),
  generatePickup: (body) => authed("/courier/generate/pickup", { method: "POST", body }),
  generateManifest: (body) => authed("/manifests/generate", { method: "POST", body }),
  printManifest: (body) => authed("/manifests/print", { method: "POST", body }),
  generateLabel: (body) => authed("/courier/generate/label", { method: "POST", body }),
  printInvoice: (body) => authed("/orders/print/invoice", { method: "POST", body }),
  trackAwb: (awb) => authed(`/courier/track/awb/${encodeURIComponent(awb)}`, { method: "GET" }),
};

