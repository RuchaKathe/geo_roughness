from geo_roughness.roughness.surface import compute_top_surface_roughness_glb
from geo_roughness.visualization.vtk_viewer import show_roughness_vtk
import trimesh

def main():
    mesh_file = "sample_1.glb"

    result = compute_top_surface_roughness_glb(mesh_file)

    Sa = result["Sa"]
    Sz = result["Sz"]

    print("\n=== Surface Roughness Results ===")
    print(f"Sa = {Sa:.6e}")
    print(f"Sz = {Sz:.6e}")
    print("================================\n")

    mesh = trimesh.load(mesh_file, force="mesh")
    vertices_top = mesh.vertices[result["top_indices"]]

    show_roughness_vtk(
        mesh_file=mesh_file,
        vertices_top=vertices_top,
        residuals=result["residuals"],
        Sa=Sa,
        Sz=Sz,
    )



if __name__ == "__main__":
    main()

