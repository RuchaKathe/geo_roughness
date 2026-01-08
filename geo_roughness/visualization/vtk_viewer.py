import numpy as np
import pyvista as pv
import trimesh
from scipy.spatial import cKDTree


def show_roughness_vtk(
    mesh_file: str,
    vertices_top: np.ndarray,
    residuals: np.ndarray,
    Sa: float,
    Sz: float,
):
    print("Launching VTK viewer...")

    # Load mesh
    tm = trimesh.load(mesh_file, force="mesh")
    mesh = pv.wrap(tm)

    # Prepare scalar field
    roughness = np.zeros(mesh.n_points)

    # Map residuals to nearest mesh vertices
    tree = cKDTree(vertices_top)
    _, idx = tree.query(mesh.points)
    roughness[:] = residuals[idx]

    mesh["roughness"] = roughness

    # Plot
    plotter = pv.Plotter()
    plotter.add_mesh(
        mesh,
        scalars="roughness",
        cmap="seismic",
        show_edges=False,
        scalar_bar_args={"title": "Height deviation"},
    )

    plotter.add_text(
        f"Sa = {Sa:.3e}\nSz = {Sz:.3e}",
        position="upper_left",
        font_size=12,
    )

    plotter.show()
