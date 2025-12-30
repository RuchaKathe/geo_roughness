import argparse
from geo_roughness.io.glb_loader import load_glb_as_trimesh
from geo_roughness.roughness.surface import compute_top_surface_roughness_glb
from geo_roughness.visualization.mesh_plot import visualize_roughness_glb

def main():
    parser = argparse.ArgumentParser(
        description="Compute geometric surface roughness from a GLB mesh"
    )
    parser.add_argument("glb_path", help="Path to GLB file")
    parser.add_argument("--z-threshold", type=float, default=0.85,
                        help="Top surface Z percentile (default: 0.85)")
    parser.add_argument("--plot", action="store_true",
                        help="Visualize roughness")
    args = parser.parse_args()

    print(f"📂 Loading mesh: {args.glb_path}")
    mesh = load_glb_as_trimesh(args.glb_path)

    print("🔍 Computing top surface roughness...")
    result = compute_top_surface_roughness_glb(
        args.glb_path,
        z_threshold=args.z_threshold,
        save_results=True,
        units="mm"
    )

    if result is None:
        print("❌ Roughness computation failed.")
        return

    print("\n📊 Roughness results (meters):")
    print(f"Sa = {result['Sa']:.6e} m")
    print(f"Sz = {result['Sz']:.6e} m")

    if args.plot:
        print("🎨 Plotting roughness map...")
        visualize_roughness_glb("roughness_data_top.npz", args.glb_path)

    print("✅ Done")

if __name__ == "__main__":
    main()
