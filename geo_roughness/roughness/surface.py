import numpy as np
from sklearn.linear_model import LinearRegression
import trimesh

def load_glb_as_trimesh(mesh_file):
    """Load GLB and return single Trimesh object"""
    mesh = trimesh.load(mesh_file)
    if isinstance(mesh, trimesh.Trimesh):
        return mesh
    if isinstance(mesh, trimesh.Scene):
        return trimesh.util.concatenate([g for g in mesh.geometry.values()])
    raise TypeError("Unsupported GLB type")

def compute_top_surface_roughness_glb(mesh_file, z_threshold=0.85,
                                      save_results=True, units="mm"):
    """
    Compute top-surface roughness (Sa, Sz) from GLB mesh
    """
    mesh = load_glb_as_trimesh(mesh_file)
    vertices = mesh.vertices
    z = vertices[:, 2]

    z_cut = z.min() + z_threshold * (z.max() - z.min())
    top_vertices = vertices[z > z_cut]

    if len(top_vertices) < 20:
        print("⚠️ Too few top-surface points")
        return None

    X = top_vertices[:, :2]
    Z = top_vertices[:, 2]
    model = LinearRegression().fit(X, Z)
    residuals = Z - model.predict(X)

    Sa = np.mean(np.abs(residuals))
    Sz = np.max(residuals) - np.min(residuals)

    if units == "mm":
        Sa /= 1000
        Sz /= 1000

    if save_results:
        np.savez("roughness_data_top.npz",
                 residuals=residuals,
                 vertices=top_vertices)

    return {"Sa": Sa, "Sz": Sz}

