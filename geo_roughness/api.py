from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import tempfile
import shutil
import os
import trimesh

from geo_roughness.roughness.surface import compute_top_surface_roughness_glb
from geo_roughness.materials.alsi10mg import MaterialAlSi10Mg


# ------------------------
# Create app
# ------------------------
app = FastAPI(title="Geo Roughness API")


# ------------------------
# CORS (simple & correct)
# ------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for local development
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------
# Health check
# ------------------------
@app.get("/")
def root():
    return {"status": "Geo Roughness API running"}


# ------------------------
# Analyze endpoint
# ------------------------
@app.post("/analyze")
def analyze_glb(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".glb"):
        raise HTTPException(status_code=400, detail="Only .glb files supported")

    with tempfile.TemporaryDirectory() as tmpdir:
        glb_path = os.path.join(tmpdir, file.filename)

        with open(glb_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # --- Load full mesh ---
        mesh = trimesh.load(glb_path, force="mesh")

        # --- Compute roughness on top surface ---
        result = compute_top_surface_roughness_glb(glb_path)

        # --- Material metadata (engineering context) ---
        material = MaterialAlSi10Mg()

        return {
            "units": "meters",

            # ------------------------
            # Material information
            # ------------------------
            "material": {
                "name": "AlSi10Mg",
                "density": material.density,
                "elastic_modulus": material.elastic_modulus,
                "yield_strength": material.yield_strength,
                "tensile_strength": material.tensile_strength,
                "poisson_ratio": material.poisson_ratio,
            },

            # ------------------------
            # Roughness metrics
            # ------------------------
            "metrics": {
                "Sa": result["Sa"],
                "Sq": result["Sq"],
                "Sz": result["Sz"],
            },

            # ------------------------
            # Geometry
            # ------------------------
            "mesh": {
                "vertices": mesh.vertices.tolist(),
                "faces": mesh.faces.tolist(),
            },

            # ------------------------
            # Roughness field (top surface only)
            # ------------------------
            "roughness": {
                "mapping": "vertex",
                "values": result["residuals"].tolist(),
                "indices": result["top_indices"],
                "min": float(min(result["residuals"])),
                "max": float(max(result["residuals"])),
            },
        }
