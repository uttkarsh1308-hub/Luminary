/**
 * Luminary API client
 */

const BASE_URL = "http://localhost:8000";

/**
 * Search researchers — RAG + FL + QAOA pipeline
 */
export async function searchResearchers({
  query,
  universityFilter = null,
  irbFilter = false,
  statusFilter = null,
}) {
  try {
    const res = await fetch(`${BASE_URL}/search`, {
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
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.results;
  } catch (err) {
    console.warn("Backend offline — using local data", err);
    return null;
  }
}

/**
 * Upload a dataset or model with researcher metadata.
 *
 * Accepted file types:
 *   Images  — .jpg .jpeg .png .bmp .tiff .webp
 *   Tabular — .csv
 *   Models  — .h5 .keras .pt .pth .pkl .onnx .bin
 *   Encoded — .npz  (from Quantum Encoder notebook)
 *   Archive — .zip  (folder of any of the above)
 *
 * NOTE: Do NOT set Content-Type manually.
 * The browser sets multipart/form-data + correct boundary automatically.
 *
 * @param {FileList|File[]} files       - one or more files
 * @param {string} description          - research description (min 30 chars) — REQUIRED
 * @param {string} name                 - researcher full name — REQUIRED
 * @param {string} university           - institution name — REQUIRED
 * @param {string} dept                 - department (optional)
 * @param {string} email                - contact email (optional)
 * @param {boolean} irbApproved         - whether IRB is approved
 * @param {string} status               - "ongoing" | "published" | "dataset_available"
 * @param {string} stage                - "early" | "mid" | "published" | "dataset_available"
 *
 * @returns {{ success, researcher, upload_summary, message }}
 * @throws  Error with .message = backend error detail string
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

  // Append every file under the key "files" (FastAPI List[UploadFile])
  const fileList = Array.from(files);
  for (const f of fileList) {
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

  const res = await fetch(`${BASE_URL}/upload/dataset`, {
    method: "POST",
    body:   formData,
    // No Content-Type — browser sets multipart/form-data + boundary
  });

  if (!res.ok) {
    let detail = `Upload failed (${res.status})`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  return await res.json();
}

/**
 * Get single researcher profile
 */
export async function getResearcher(id) {
  try {
    const res = await fetch(`${BASE_URL}/researcher/${id}`);
    if (!res.ok) throw new Error(`Not found: ${id}`);
    return await res.json();
  } catch (err) {
    console.warn("Could not fetch researcher", err);
    return null;
  }
}

/**
 * Health check
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
