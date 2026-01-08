import numpy as np
from sklearn.linear_model import LinearRegression
import trimesh


def load_glb_as_trimesh(mesh_file: str) -> trimesh.Trimesh:
    """
    Load a GLB file and return a single Trimesh object.
    Handles both Trimesh and Scene.
    """
    mesh = trimesh.load(mesh_file)

    if isinstance(mesh, trimesh.Trimesh):
        return mesh

    if isinstance(mesh, trimesh.Scene):
        if len(mesh.geometry) == 0:
            raise ValueError("GLB scene contains no geometry")
        return trimesh.util.concatenate(
            [g for g in mesh.geometry.values()]
        )

    raise TypeError("Unsupported GLB type")


def compute_top_surface_roughness_glb(
    mesh_file: str,
    z_threshold: float = 0.85,
    units: str = "mm",
):
    mesh = load_glb_as_trimesh(mesh_file)
    vertices = mesh.vertices

    if vertices.size == 0:
        raise ValueError("Mesh contains no vertices")

    z = vertices[:, 2]

    # Identify top surface
    z_cut = z.min() + z_threshold * (z.max() - z.min())
    mask = z > z_cut
    top_vertices = vertices[mask]
    top_indices = np.where(mask)[0]

    if top_vertices.shape[0] < 20:
        raise ValueError("Too few top-surface points for roughness analysis")

    # Fit reference plane
    X = top_vertices[:, :2]
    Z = top_vertices[:, 2]

    model = LinearRegression()
    model.fit(X, Z)
    Z_fit = model.predict(X)

    residuals = Z - Z_fit

    # Roughness metrics
    Sa = float(np.mean(np.abs(residuals)))
    Sq = float(np.sqrt(np.mean(residuals ** 2)))
    Sz = float(np.max(residuals) - np.min(residuals))

    # Unit conversion
    if units == "mm":
        scale = 1.0 / 1000.0
        Sa *= scale
        Sz *= scale
        residuals = residuals * scale

    return {
        "Sa": Sa,
        "Sq": Sq,
        "Sz": Sz,
        "residuals": residuals,
        "top_indices": np.where(mask)[0].tolist(),  # ✅ CRITICAL ADDITION
    }
