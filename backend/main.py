"""
Luminary — FastAPI Backend
Full pipeline: Quantum Encoding → FL → QAOA
Run: python -m uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import uuid
import zipfile
import io

import numpy as np

from rag import rag_search, get_query_embedding, RESEARCHERS, reload_researchers
from qaoa import qaoa_rank, query_to_profile
from federated import run_federated_round, encrypt_all_researchers
from fl_model import get_fl_model

BASE = os.path.dirname(os.path.abspath(__file__))
RESEARCHERS_JSON_PATH = os.path.join(BASE, "researchers.json")

app = FastAPI(title="Luminary API", version="2.0.0")

# ── CORS — explicit headers required for multipart/form-data preflight ─────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,          # must be False when allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],              # allow Content-Type, etc.
    expose_headers=["*"],
)

# ── Global state ──
federated_state       = {}
encrypted_researchers = []
fl_model              = None


@app.on_event("startup")
async def startup():
    global federated_state, encrypted_researchers, fl_model

    print("\n" + "="*65)
    print("  LUMINARY STARTUP PIPELINE")
    print("="*65)

    print("\n🔄 Step 1: Running federated learning round...")
    federated_state       = run_federated_round(RESEARCHERS)
    encrypted_researchers = encrypt_all_researchers(RESEARCHERS)
    print(f"✅ {federated_state['global_model']['n_nodes']} university nodes trained")
    print(f"✅ {len(encrypted_researchers)} researcher embeddings encrypted")

    print("\n🔄 Step 2: Training FL collaboration models (RF + GB + Ridge)...")
    fl_model = get_fl_model()
    print(f"✅ FL models trained — summary: {fl_model.summary}")

    print("\n✅ Luminary ready — Full FL + QAOA pipeline active\n")


# ── Request models ──
class SearchRequest(BaseModel):
    query: str
    university_filter: Optional[str] = None
    irb_filter: Optional[bool] = None
    status_filter: Optional[str] = None
    top_k: Optional[int] = 8


@app.get("/")
def root():
    return {
        "name":            "Luminary API",
        "version":         "2.0.0",
        "pipeline":        "Quantum Encoding → Federated Learning → QAOA",
        "status":          "running",
        "fl_trained":      fl_model.trained if fl_model else False,
        "federated_nodes": federated_state.get("global_model", {}).get("n_nodes", 0),
        "fl_summary":      fl_model.summary if fl_model else {},
    }


@app.post("/search")
def search(req: SearchRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    rag_results = rag_search(req.query, top_k=req.top_k)

    filtered = rag_results
    if req.university_filter and req.university_filter != "All Universities":
        filtered = [r for r in filtered
                    if req.university_filter.lower() in r["university"].lower()]
    if req.irb_filter:
        filtered = [r for r in filtered if r.get("irb_status") == "approved"]
    if req.status_filter and req.status_filter != "all":
        filtered = [r for r in filtered if r.get("status") == req.status_filter]

    if not filtered:
        return {"query": req.query, "total": 0, "results": []}

    query_emb     = get_query_embedding(req.query).tolist()
    query_profile = query_to_profile(req.query, query_emb)
    ranked        = qaoa_rank(query_profile, filtered, fl_model=fl_model)

    for r in ranked:
        r["embedding_status"] = "encrypted"
        r["pipeline"]         = "FL+QAOA"
        r["fl_informed"]      = r.get("breakdown", {}).get("fl_informed", False)

    return {
        "query":           req.query,
        "total":           len(ranked),
        "pipeline":        "Quantum Encoding → Federated Learning → QAOA",
        "fl_trained":      fl_model.trained if fl_model else False,
        "federated_nodes": federated_state.get("global_model", {}).get("n_nodes", 0),
        "results":         ranked,
    }


# ══════════════════════════════════════════════════════════════════════════════
# DATASET / MODEL UPLOAD ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

IMAGE_EXTS   = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
CSV_EXTS     = {".csv"}
MODEL_EXTS   = {".h5", ".keras", ".pt", ".pth", ".pkl", ".onnx", ".bin"}
ENCODED_EXTS = {".npz"}


def _ext(filename: str) -> str:
    return os.path.splitext(filename.lower())[1]


def _file_category(filename: str) -> str:
    e = _ext(filename)
    if e in IMAGE_EXTS:   return "image"
    if e in CSV_EXTS:     return "csv"
    if e in MODEL_EXTS:   return "model"
    if e in ENCODED_EXTS: return "encoded"
    return "unknown"


def _inspect_zip(data: bytes) -> dict:
    buckets = {"image": [], "csv": [], "model": [], "encoded": [], "unknown": []}
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            for info in z.infolist():
                if info.is_dir():
                    continue
                name = os.path.basename(info.filename)
                if not name or name.startswith(".") or name.startswith("__"):
                    continue
                cat = _file_category(name)
                buckets[cat].append(name)
    except Exception:
        pass
    return buckets


def _detect_methodology(description: str) -> list:
    desc  = description.lower()
    rules = [
        (["federated learning", "federated", " fl "],                     "Federated Learning"),
        (["quantum", "qaoa", "qubo", "annealing"],                        "Quantum Computing"),
        (["transformer", "attention", "bert", "gpt", "llm", "t5"],        "Transformer"),
        (["cnn", "convolutional", "resnet", "vgg", "yolo", "unet"],       "CNN"),
        (["gnn", "graph neural", "graph network"],                        "Graph Neural Network"),
        (["diffusion", "stable diffusion", "denoising diffusion"],        "Diffusion Model"),
        (["gan", "generative adversarial"],                               "GAN"),
        (["reinforcement learning", "rl", "policy gradient", "q-learn"], "Reinforcement Learning"),
        (["nlp", "natural language", "text classification", " ner "],     "NLP"),
        (["split learning"],                                              "Split Learning"),
        (["differential privacy", "dp-sgd"],                             "Differential Privacy"),
        (["random forest", "gradient boost", "xgboost", "lightgbm"],     "Gradient Boosting"),
        (["deep learning", "neural network", " mlp ", "dense layer"],    "Deep Learning"),
        (["statistical", "regression", "bayesian", "logistic"],          "Statistical Analysis"),
        (["transfer learning", "fine-tun", "pretrained"],                "Transfer Learning"),
        (["segmentation", "object detection", "semantic seg"],           "Computer Vision"),
        (["clustering", "k-means", "dbscan", "unsupervised"],            "Unsupervised Learning"),
    ]
    found = []
    for keywords, label in rules:
        if any(kw in desc for kw in keywords):
            found.append(label)
    return found if found else ["Machine Learning"]


def _detect_domain(description: str) -> list:
    desc  = description.lower()
    rules = [
        (["genomic", "genome", "exome", "snp", "variant", "dna", "rna-seq"],   "Genomics"),
        (["rare disease", "orphan disease", "mendelian"],                        "Rare Disease"),
        (["multi-omics", "proteomics", "metabolomics", "transcriptomics"],      "Multi-Omics"),
        (["cancer", "tumor", "oncology", "malignant", "carcinoma"],             "Cancer"),
        (["mri", "fmri", "ct scan", "radiology", "neuroimaging"],               "Medical Imaging"),
        (["clinical note", "ehr", "electronic health record", "discharge sum"], "Clinical NLP"),
        (["drug discovery", "molecular docking", "protein fold", "ligand"],     "Drug Discovery"),
        (["bioinformatics", "sequence align", "blast", "phylo"],                "Bioinformatics"),
        (["neuroscience", "brain", "neural circuit", "eeg", "seizure"],         "Neuroscience"),
        (["privacy", "security", "encryption", "federated"],                   "Privacy"),
        (["healthcare", "hospital", "clinical", "patient outcome", "icu"],     "Healthcare"),
        (["medical image", "x-ray", "ultrasound", "pathology slide"],          "Medical Imaging"),
        (["speech", "audio", "ecg", "biosignal", "waveform"],                  "Biomedical Signal"),
    ]
    found = []
    for keywords, label in rules:
        if any(kw in desc for kw in keywords):
            found.append(label)
    return found if found else ["Biomedical"]


def _build_dataset_labels(buckets: dict) -> list:
    labels = []
    if buckets["image"]:
        count = len(buckets["image"])
        labels.append(f"Image Dataset ({count} file{'s' if count > 1 else ''})")
    if buckets["csv"]:
        for n in buckets["csv"][:3]:
            labels.append(n)
    if buckets["model"]:
        labels.append("Trained Model Weights")
    if buckets["encoded"]:
        labels.append("Quantum-Encoded Research Data (.npz)")
    return labels if labels else ["Research Dataset"]


@app.post("/upload/dataset")
async def upload_dataset(
    files:        List[UploadFile] = File(...),
    description:  str = Form(...),
    name:         str = Form(...),
    university:   str = Form(...),
    dept:         str = Form(""),
    email:        str = Form(""),
    irb_approved: str = Form("false"),
    status:       str = Form("ongoing"),
    stage:        str = Form("early"),
):
    # ── 1. Validate text fields ────────────────────────────────────────────────
    if not name.strip():
        raise HTTPException(status_code=400, detail="Researcher name is required.")
    if not university.strip():
        raise HTTPException(status_code=400, detail="University name is required.")
    if len(description.strip()) < 30:
        raise HTTPException(
            status_code=400,
            detail="Description must be at least 30 characters."
        )

    # ── 2. Classify files ──────────────────────────────────────────────────────
    buckets = {"image": [], "csv": [], "model": [], "encoded": [], "unknown": []}

    for f in files:
        fname = (f.filename or "").strip()
        if not fname:
            continue
        ext = _ext(fname)

        if ext == ".zip":
            raw   = await f.read()
            inner = _inspect_zip(raw)
            for cat, names in inner.items():
                buckets[cat].extend(names)
        else:
            cat = _file_category(fname)
            if cat == "unknown":
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Unsupported file: '{fname}'. "
                        "Accepted: images (.jpg .png .bmp .tiff .webp), "
                        ".csv, .zip, model files (.h5 .keras .pt .pth .pkl .onnx .bin), .npz"
                    )
                )
            buckets[cat].append(fname)

    total = sum(len(v) for v in buckets.values())
    if total == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid files found. Upload images, CSVs, model files, or .npz files."
        )

    # ── 3. Generate embedding + auto-detect tags ───────────────────────────────
    embedding   = get_query_embedding(description).tolist()
    methodology = _detect_methodology(description)
    domain      = _detect_domain(description)

    # ── 4. Sanitise enum fields ────────────────────────────────────────────────
    irb_status = "approved" if irb_approved.lower() == "true" else "pending"
    if stage  not in {"early", "mid", "published", "dataset_available"}:
        stage  = "early"
    if status not in {"ongoing", "published", "dataset_available"}:
        status = "ongoing"

    # ── 5. Build researcher record ─────────────────────────────────────────────
    new_id         = str(uuid.uuid4())[:8]
    first_sentence = description.strip().split(".")[0].strip()
    title          = first_sentence[:120] if first_sentence else description.strip()[:120]

    new_researcher = {
        "id":          new_id,
        "name":        name.strip(),
        "university":  university.strip(),
        "dept":        dept.strip() or "Research Department",
        "title":       title,
        "status":      status,
        "stage":       stage,
        "irb_status":  irb_status,
        "methodology": methodology,
        "domain":      domain,
        "datasets":    _build_dataset_labels(buckets),
        "abstract":    description.strip(),
        "email":       email.strip(),
        "embedding":   embedding,
    }

    # ── 6. Persist ─────────────────────────────────────────────────────────────
    try:
        with open(RESEARCHERS_JSON_PATH, "r") as fh:
            data = json.load(fh)

        data["researchers"].append(new_researcher)

        with open(RESEARCHERS_JSON_PATH, "w") as fh:
            json.dump(data, fh, indent=2)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database write failed: {exc}")

    # ── 7. Hot-reload in-memory list ───────────────────────────────────────────
    reload_researchers()

    print(f"✅ Upload: {name} | {university} | id={new_id} | files={total}")

    return {
        "success":    True,
        "researcher": new_researcher,
        "upload_summary": {
            "total_files": total,
            "images":      len(buckets["image"]),
            "csvs":        len(buckets["csv"]),
            "models":      len(buckets["model"]),
            "encoded_npz": len(buckets["encoded"]),
        },
        "message": (
            f"'{name}' from {university} added to Luminary. "
            f"{total} file(s) detected. Searchable immediately."
        ),
    }


# ── Existing endpoints ─────────────────────────────────────────────────────────

@app.get("/fl/summary")
def fl_summary():
    if not fl_model or not fl_model.trained:
        return {"status": "not trained"}
    return {
        "status":   "trained",
        "models":   fl_model.summary,
        "weights":  {
            "RF":    fl_model.best_weights[0],
            "GB":    fl_model.best_weights[1],
            "Ridge": fl_model.best_weights[2],
        },
        "pipeline": "FL score weighted {:.0f}% + QAOA {:.0f}%".format(40, 60),
        "nodes": list(set(r["university"] for r in RESEARCHERS)),
    }


@app.get("/federated/status")
def federated_status():
    return {
        "status":            "active",
        "round":             federated_state.get("round", 1),
        "nodes":             federated_state.get("nodes", []),
        "global_model":      federated_state.get("global_model", {}),
        "privacy_guarantee": federated_state.get("privacy_guarantee", ""),
        "compliance":        federated_state.get("compliance", []),
    }


@app.get("/researcher/{researcher_id}")
def get_researcher(researcher_id: str):
    for r in encrypted_researchers:
        if r["id"] == researcher_id:
            safe = {k: v for k, v in r.items() if k != "embedding"}
            safe["embedding_status"] = "encrypted"
            return safe
    raise HTTPException(status_code=404, detail="Researcher not found")


@app.get("/researchers")
def get_all():
    return {"researchers": RESEARCHERS, "total": len(RESEARCHERS)}


@app.get("/health")
def health():
    return {
        "status":      "ok",
        "fl_trained":  fl_model.trained if fl_model else False,
        "fl_summary":  fl_model.summary if fl_model else {},
        "researchers": len(RESEARCHERS),
        "nodes":       federated_state.get("global_model", {}).get("n_nodes", 0),
    }
