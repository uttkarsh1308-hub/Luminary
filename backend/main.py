"""
Luminary — FastAPI Backend
Full pipeline: Quantum Encoding → FL → QAOA
Run: python -m uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import uuid

from rag import rag_search, get_query_embedding, RESEARCHERS, reload_researchers
from qaoa import qaoa_rank, query_to_profile
from federated import run_federated_round, encrypt_all_researchers
from fl_model import get_fl_model

BASE = os.path.dirname(os.path.abspath(__file__))
RESEARCHERS_JSON_PATH = os.path.join(BASE, "researchers.json")

app = FastAPI(title="Luminary API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
    irb_filter:        Optional[bool] = None
    status_filter:     Optional[str]  = None
    top_k:             Optional[int]  = 8


class UploadRequest(BaseModel):
    name:         str
    university:   str
    dept:         Optional[str]  = ""
    email:        Optional[str]  = ""
    description:  str
    data_types:   Optional[List[str]] = []   # ["Images", "CSV", "Model Weights", etc.]
    irb_approved: Optional[bool] = False
    status:       Optional[str]  = "ongoing"
    stage:        Optional[str]  = "early"


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
# UPLOAD — no files saved, only metadata written to researchers.json
# ══════════════════════════════════════════════════════════════════════════════

def _detect_methodology(desc: str) -> list:
    d = desc.lower()
    rules = [
        (["federated learning", "federated"],          "Federated Learning"),
        (["quantum", "qaoa", "qubo"],                  "Quantum Computing"),
        (["transformer", "bert", "gpt", "llm"],        "Transformer"),
        (["cnn", "convolutional", "resnet", "yolo"],   "CNN"),
        (["graph neural", "gnn"],                      "Graph Neural Network"),
        (["gan", "generative adversarial"],            "GAN"),
        (["diffusion"],                                "Diffusion Model"),
        (["reinforcement learning"],                   "Reinforcement Learning"),
        (["nlp", "natural language"],                  "NLP"),
        (["differential privacy"],                     "Differential Privacy"),
        (["random forest", "gradient boost", "xgboost"], "Gradient Boosting"),
        (["deep learning", "neural network"],          "Deep Learning"),
        (["transfer learning", "fine-tun"],            "Transfer Learning"),
        (["segmentation", "object detection"],         "Computer Vision"),
        (["statistical", "regression", "bayesian"],    "Statistical Analysis"),
    ]
    found = [label for kws, label in rules if any(kw in d for kw in kws)]
    return found if found else ["Machine Learning"]


def _detect_domain(desc: str) -> list:
    d = desc.lower()
    rules = [
        (["genomic", "genome", "exome", "dna", "rna"],  "Genomics"),
        (["rare disease", "orphan"],                     "Rare Disease"),
        (["multi-omics", "proteomics", "metabolomics"],  "Multi-Omics"),
        (["cancer", "tumor", "oncology"],                "Cancer"),
        (["mri", "fmri", "ct scan", "radiology"],        "Medical Imaging"),
        (["clinical note", "ehr", "electronic health"],  "Clinical NLP"),
        (["drug discovery", "molecular", "protein fold"],"Drug Discovery"),
        (["bioinformatics", "sequence"],                 "Bioinformatics"),
        (["neuroscience", "brain", "eeg"],               "Neuroscience"),
        (["privacy", "security", "encryption"],         "Privacy"),
        (["healthcare", "hospital", "patient"],         "Healthcare"),
        (["x-ray", "ultrasound", "pathology"],          "Medical Imaging"),
    ]
    found = [label for kws, label in rules if any(kw in d for kw in kws)]
    return found if found else ["Biomedical"]


@app.post("/upload/dataset")
def upload_dataset(req: UploadRequest):
    # Validate
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")
    if not req.university.strip():
        raise HTTPException(status_code=400, detail="University is required.")
    if len(req.description.strip()) < 30:
        raise HTTPException(status_code=400, detail="Description must be at least 30 characters.")

    # Sanitise enums
    status = req.status if req.status in {"ongoing", "published", "dataset_available"} else "ongoing"
    stage  = req.stage  if req.stage  in {"early", "mid", "published", "dataset_available"} else "early"

    # Build dataset labels from the data_types the user ticked
    datasets = req.data_types if req.data_types else ["Research Dataset"]

    # Generate embedding from description
    embedding = get_query_embedding(req.description).tolist()

    # First sentence of description → title
    title = req.description.strip().split(".")[0].strip()[:120]

    new_researcher = {
        "id":          str(uuid.uuid4())[:8],
        "name":        req.name.strip(),
        "university":  req.university.strip(),
        "dept":        req.dept.strip() if req.dept else "Research Department",
        "title":       title,
        "status":      status,
        "stage":       stage,
        "irb_status":  "approved" if req.irb_approved else "pending",
        "methodology": _detect_methodology(req.description),
        "domain":      _detect_domain(req.description),
        "datasets":    datasets,
        "abstract":    req.description.strip(),
        "email":       req.email.strip() if req.email else "",
        "embedding":   embedding,
    }

    # Write to researchers.json
    try:
        with open(RESEARCHERS_JSON_PATH) as f:
            data = json.load(f)
        data["researchers"].append(new_researcher)
        with open(RESEARCHERS_JSON_PATH, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save: {e}")

    # Reload in-memory list so it's searchable immediately
    reload_researchers()

    print(f"✅ New researcher: {req.name} | {req.university} | id={new_researcher['id']}")

    return {
        "success":    True,
        "researcher": new_researcher,
        "message":    f"'{req.name}' from {req.university} added. Searchable immediately.",
    }


# ── Existing endpoints (unchanged) ────────────────────────────────────────────

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
        "pipeline": "FL score weighted 40% + QAOA 60%",
        "nodes":    list(set(r["university"] for r in RESEARCHERS)),
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
