import trimesh


def load_glb_as_trimesh(mesh_file: str) -> trimesh.Trimesh:
    mesh = trimesh.load(mesh_file)

    if isinstance(mesh, trimesh.Trimesh):
        return mesh

    if isinstance(mesh, trimesh.Scene):
        if not mesh.geometry:
            raise ValueError("GLB scene contains no geometry.")
        return trimesh.util.concatenate(
            list(mesh.geometry.values())
        )

    raise TypeError(f"Unsupported mesh type: {type(mesh)}")
