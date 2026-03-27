/**
 * Luminary API client
 *
 * LOCAL DEV  (npm run dev):
 *   Vite proxies  /api/*  →  http://localhost:8000/*
 *   So the backend never needs to set CORS for the frontend origin.
 *
 * PRODUCTION (Vercel):
 *   Set VITE_API_URL in Vercel environment variables to your deployed
 *   backend URL, e.g.  https://luminary-api.onrender.com
 *   The build will bake that value in at build time.
 *   Leave it empty to keep using /api (only works if backend is
 *   served from the same origin as the frontend).
 */

const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")   // strip trailing slash
  : "/api";                                             // dev proxy

// ── helper ────────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchResearchers({
  query,
  universityFilter = null,
  irbFilter = false,
  statusFilter = null,
}) {
  try {
    const data = await apiFetch("/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        university_filter: universityFilter,
        irb_filter: irbFilter,
        status_filter: statusFilter,
        top_k: 8,
      }),
    });
    return data.results;
  } catch (err) {
    console.warn("Search failed — using local fallback data.", err.message);
    return null;
  }
}

// ── Dataset / Model Upload ────────────────────────────────────────────────────
/**
 * Upload one or more dataset / model files with researcher metadata.
 *
 * Accepted files:
 *   Images  — .jpg .jpeg .png .bmp .tiff .webp
 *   Tabular — .csv
 *   Models  — .h5 .keras .pt .pth .pkl .onnx .bin
 *   Encoded — .npz  (from Quantum Encoder notebook)
 *   Archive — .zip  (folder of any of the above)
 *
 * Do NOT set Content-Type — the browser sets multipart/form-data
 * with the correct boundary automatically when you pass FormData.
 */
export async function uploadDataset({
  files,
  description,
  name,
  university,
  dept        = "",
  email       = "",
  irbApproved = false,
  status      = "ongoing",
  stage       = "early",
}) {
  const formData = new FormData();

  // FastAPI expects List[UploadFile] under the field name "files"
  for (const f of Array.from(files)) {
    formData.append("files", f);
  }

  formData.append("description",  description);
  formData.append("name",         name);
  formData.append("university",   university);
  formData.append("dept",         dept);
  formData.append("email",        email);
  formData.append("irb_approved", irbApproved ? "true" : "false");
  formData.append("status",       status);
  formData.append("stage",        stage);

  // No Content-Type header — let the browser set multipart/form-data + boundary
  return apiFetch("/upload/dataset", {
    method: "POST",
    body:   formData,
  });
}

// ── Single researcher ─────────────────────────────────────────────────────────
export async function getResearcher(id) {
  try {
    return await apiFetch(`/researcher/${id}`);
  } catch (err) {
    console.warn("Could not fetch researcher", err.message);
    return null;
  }
}

// ── Health check ──────────────────────────────────────────────────────────────
export async function checkHealth() {
  try {
    await apiFetch("/health");
    return true;
  } catch {
    return false;
  }
}
