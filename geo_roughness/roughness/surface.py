import numpy as np
import trimesh


def select_top_surface_vertices_two_pass(
    mesh: trimesh.Trimesh,
    height_axis: np.ndarray,
    height_percentile_ref: float = 85.0,
    height_percentile_meas: float = 75.0,
    normal_thresh_ref: float = 0.9,
    normal_thresh_meas: float = 0.75,
):
    """
    Two-pass top surface selection for irregular / rough surfaces.

    Pass 1 (STRICT):
        - Stable core region
        - Used ONLY for reference plane fitting

    Pass 2 (RELAXED):
        - Includes most of the real rough surface
        - Used for roughness measurement & visualization
    """

    vertices = mesh.vertices
    normals = mesh.vertex_normals

    # --- Project heights along detected height axis ---
    heights = vertices @ height_axis

    # --- Normal alignment with height axis ---
    normal_alignment = np.abs(normals @ height_axis)

    # ======================
    # PASS 1 — Reference core
    # ======================
    h_cut_ref = np.percentile(heights, height_percentile_ref)

    ref_mask = (
        (heights >= h_cut_ref) &
        (normal_alignment >= normal_thresh_ref)
    )

    ref_indices = np.where(ref_mask)[0]

    if ref_indices.size < 20:
        raise ValueError(
            "Pass 1 failed: not enough vertices for reference plane fitting"
        )

    # ======================
    # PASS 2 — Measurement surface
    # ======================
    h_cut_meas = np.percentile(heights, height_percentile_meas)

    meas_mask = (
        (heights >= h_cut_meas) &
        (normal_alignment >= normal_thresh_meas)
    )

    meas_indices = np.where(meas_mask)[0]

    if meas_indices.size < 50:
        raise ValueError(
            "Pass 2 failed: not enough vertices for surface measurement"
        )

    return {
        # Used ONLY to fit reference plane
        "reference_indices": ref_indices.tolist(),

        # Used for roughness computation & visualization
        "measurement_indices": meas_indices.tolist(),

        # Optional debug outputs
        "height_range": [float(heights.min()), float(heights.max())],
        "normal_alignment_range": [
            float(normal_alignment.min()),
            float(normal_alignment.max()),
        ],
    }

