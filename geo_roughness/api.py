import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import tempfile
import shutil
import os

import trimesh

from geo_roughness.io.glb_loader import load_glb_as_trimesh
from geo_roughness.roughness.roughness import compute_surface_deviation_two_pass
from geo_roughness.roughness.orientation import detect_orientation
from geo_roughness.materials.alsi10mg import MaterialAlSi10Mg


# ------------------------
# Create app
# ------------------------
app = FastAPI(title="Geo Roughness API")


# ------------------------
# CORS
# ------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for local dev
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

        # Save uploaded file
        with open(glb_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # ------------------------
        # Load mesh (ONCE)
        # ------------------------
        mesh = load_glb_as_trimesh(glb_path)

        # ------------------------
        # STEP 1: Orientation
        # ------------------------
        orientation = detect_orientation(mesh)
        height_axis = np.array(orientation["height_axis"])

        # ------------------------
        # STEP 2 (current): Roughness
        # (still uses old Z-based logic internally)
        # ------------------------
        result = compute_surface_deviation_two_pass(mesh,height_axis)

        # ------------------------
        # Material metadata
        # ------------------------
        material = MaterialAlSi10Mg()

        # ------------------------
        # Response
        # ------------------------
        return {
            "units": "meters",

            # ------------------------
            # Orientation (NEW & IMPORTANT)
            # ------------------------
            "orientation": orientation,

            # ------------------------
            # Material
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
            # Geometry (for visualization)
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
                "indices": result["indices"],
                "min": float(min(result["residuals"])),
                "max": float(max(result["residuals"])),
            },
        }
