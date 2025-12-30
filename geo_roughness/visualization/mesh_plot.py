# geo_roughness/visualization/mesh_plot.py

import os
import numpy as np
import matplotlib
# Force Tkinter backend for Windows to show interactive plots
matplotlib.use("tkagg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import trimesh

def _load_glb_as_trimesh(mesh_file):
    """Load GLB/GLTF mesh as a single Trimesh object"""
    mesh = trimesh.load(mesh_file)
    if isinstance(mesh, trimesh.Trimesh):
        return mesh
    if isinstance(mesh, trimesh.Scene):
        return trimesh.util.concatenate([g for g in mesh.geometry.values()])
    raise TypeError("Unsupported mesh type")

def visualize_roughness_glb(data_file, mesh_file):
    """
    Visualize top-surface roughness on a GLB mesh.
    
    - data_file: .npz file containing 'residuals' and 'vertices'
    - mesh_file: original GLB mesh file
    """
    if not os.path.exists(data_file):
        print(f"❌ Data file not found: {data_file}")
        return
    if not os.path.exists(mesh_file):
        print(f"❌ Mesh file not found: {mesh_file}")
        return

    # Load roughness data
    data = np.load(data_file)
    residuals = data["residuals"]
    vertices_top = data["vertices"]

    # Load full mesh
    mesh = _load_glb_as_trimesh(mesh_file)
    verts = mesh.vertices
    faces = mesh.faces

    # Normalize residuals for color mapping
    res_min, res_max = residuals.min(), residuals.max()
    norm = (residuals - res_min) / (res_max - res_min) if res_max > res_min else np.zeros_like(residuals)

    # Create 3D plot
    fig = plt.figure(figsize=(10, 8))
    ax = fig.add_subplot(111, projection='3d')

    # Plot full mesh in light grey
    triangles = verts[faces]
    mesh_collection = Poly3DCollection(triangles, alpha=0.15, linewidths=0.2)
    mesh_collection.set_edgecolor((0.6, 0.6, 0.6))
    mesh_collection.set_facecolor((0.8, 0.8, 0.8))
    ax.add_collection3d(mesh_collection)

    # Overlay top-surface points colored by residuals
    x, y, z = vertices_top[:, 0], vertices_top[:, 1], vertices_top[:, 2]
    sc = ax.scatter(x, y, z, c=norm, cmap="seismic", s=8)

    # Labels & title
    ax.set_title("3D Geometry + Top Surface Roughness")
    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    ax.set_zlabel("Z")

    # Colorbar
    cbar = plt.colorbar(sc, ax=ax, shrink=0.6)
    cbar.set_label("Normalized roughness residual")

    # Equal aspect ratio
    all_pts = np.vstack((verts, vertices_top))
    x_min, y_min, z_min = all_pts.min(axis=0)
    x_max, y_max, z_max = all_pts.max(axis=0)
    max_range = max(x_max - x_min, y_max - y_min, z_max - z_min) / 2
    mid_x, mid_y, mid_z = (x_max + x_min)/2, (y_max + y_min)/2, (z_max + z_min)/2
    ax.set_xlim(mid_x - max_range, mid_x + max_range)
    ax.set_ylim(mid_y - max_range, mid_y + max_range)
    ax.set_zlim(mid_z - max_range, mid_z + max_range)

    # Keep layout tight
    plt.tight_layout()

    # Show interactive plot and block until closed
    plt.show(block=True)

    return True

