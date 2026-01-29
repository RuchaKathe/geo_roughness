import numpy as np
import trimesh


def detect_orientation(mesh: trimesh.Trimesh):
    """
    Detect intrinsic geometry orientation using PCA.
    Returns height axis independent of world orientation.
    """

    vertices = mesh.vertices
    if vertices.shape[0] < 50:
        raise ValueError("Not enough vertices for orientation detection")

    # 1. Center geometry
    centered = vertices - vertices.mean(axis=0)

    # 2. PCA via covariance
    cov = np.cov(centered.T)
    eigvals, eigvecs = np.linalg.eigh(cov)

    # 3. Sort by variance (descending)
    order = np.argsort(eigvals)[::-1]
    eigvals = eigvals[order]
    eigvecs = eigvecs[:, order]

    # 4. Height axis = smallest variance
    height_axis = eigvecs[:, 2]

    # 5. Stabilize direction (avoid random flips)
    if np.dot(height_axis, [0, 0, 1]) < 0:
        height_axis = -height_axis

    # 6. Project vertices onto height axis
    heights = centered @ height_axis

    if eigvals[2] / eigvals[0] > 0.5:
        raise ValueError("Geometry is near-isotropic; height axis ambiguous")

    return {
        "principal_axes": eigvecs.tolist(),
        "variances": eigvals.tolist(),
        "height_axis": height_axis.tolist(),
        "height_range": [float(heights.min()), float(heights.max())],
    }