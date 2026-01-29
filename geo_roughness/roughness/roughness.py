import numpy as np
from sklearn.linear_model import LinearRegression
import trimesh

from geo_roughness.roughness.orientation import detect_orientation
from geo_roughness.roughness.surface import select_top_surface_vertices_two_pass

def build_local_frame(normal: np.ndarray):
    """
    Build an orthonormal (t1, t2, n) frame from a normal vector.
    """
    n = normal / np.linalg.norm(normal)

    # Choose a vector not parallel to n
    ref = np.array([1, 0, 0]) if abs(n[0]) < 0.9 else np.array([0, 1, 0])

    t1 = np.cross(n, ref)
    t1 /= np.linalg.norm(t1)

    t2 = np.cross(n, t1)

    return t1, t2, n


def compute_surface_deviation_two_pass(mesh, height_axis):
    """
    Mesh-derived surface deviation using two-pass selection.
    """

    selection = select_top_surface_vertices_two_pass(
        mesh,
        height_axis,
    )

    vertices = mesh.vertices

    # ----------------------
    # PASS 1 — Fit reference plane
    # ----------------------
    ref_pts = vertices[selection["reference_indices"]]

    # Build local tangent frame
    n = height_axis / np.linalg.norm(height_axis)

    ref = np.array([1, 0, 0])
    if abs(np.dot(ref, n)) > 0.9:
        ref = np.array([0, 1, 0])

    t1 = np.cross(n, ref)
    t1 /= np.linalg.norm(t1)
    t2 = np.cross(n, t1)

    U = ref_pts @ t1
    V = ref_pts @ t2
    W = ref_pts @ n

    plane = LinearRegression().fit(
        np.column_stack([U, V]),
        W
    )

    # ----------------------
    # PASS 2 — Measure deviation
    # ----------------------
    meas_pts = vertices[selection["measurement_indices"]]

    U_m = meas_pts @ t1
    V_m = meas_pts @ t2
    W_m = meas_pts @ n

    W_fit = plane.predict(np.column_stack([U_m, V_m]))
    residuals = W_m - W_fit

    # ----------------------
    # Metrics
    # ----------------------
    Sa = float(np.mean(np.abs(residuals)))
    Sq = float(np.sqrt(np.mean(residuals ** 2)))
    Sz = float(residuals.max() - residuals.min())

    return {
        "Sa": Sa,
        "Sq": Sq,
        "Sz": Sz,
        "residuals": residuals,
        "indices": selection["measurement_indices"],
    }