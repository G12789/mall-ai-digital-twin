"""
Blender script: extrude a floor slab from a GeoJSON boundary polygon.

Usage:
    blender --background --python extrude_from_geojson.py -- \
        input.geojson output.glb 4.5

Arguments:
    input.geojson   - GeoJSON file with a Polygon defining the floor boundary
    output.glb      - Output path for the compressed .glb file
    height          - Extrusion height in meters (default: 4.5)
    --no-compress   - Skip Draco compression (larger file, faster export)

The script:
    1. Reads the GeoJSON boundary
    2. Creates a flat polygon mesh from the outer ring
    3. Extrudes it upward by `height` meters
    4. Exports as .glb (optionally Draco-compressed via gltf-pipeline post-step)
"""

import sys
import json
import os
import argparse
from math import radians

# --- Blender init -----------------------------------------------------------
# When run inside Blender, bpy is automatically available.
# When imported outside Blender (e.g. for linting), the import will fail silently.
try:
    import bpy
    import bmesh
    from mathutils import Vector, Matrix
    IN_BLENDER = True
except ImportError:
    IN_BLENDER = False


def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse CLI args from the `--` separator onwards.  Blender swallows
    everything before `--` as its own flags."""
    # Find the -- marker
    try:
        idx = argv.index("--")
        rest = argv[idx + 1 :]
    except ValueError:
        rest = []

    parser = argparse.ArgumentParser(description="GeoJSON boundary → extruded floor .glb")
    parser.add_argument("input", help="Path to input GeoJSON file")
    parser.add_argument("output", help="Path to output .glb file")
    parser.add_argument(
        "height", type=float, nargs="?", default=4.5, help="Extrusion height in meters"
    )
    parser.add_argument(
        "--no-compress", action="store_true", help="Skip Draco compression hint"
    )
    return parser.parse_args(rest)


def load_geojson_polygon(filepath: str) -> list[list[tuple[float, float]]]:
    """Return list of rings from a GeoJSON Polygon feature or geometry."""
    with open(filepath, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    # Support FeatureCollection → Feature → geometry, or raw geometry
    geom = data
    if data.get("type") == "FeatureCollection":
        features = data.get("features", [])
        if not features:
            raise ValueError("GeoJSON FeatureCollection has no features")
        geom = features[0].get("geometry", features[0])
    elif data.get("type") == "Feature":
        geom = data.get("geometry", data)

    if geom.get("type") != "Polygon":
        raise ValueError(f"Expected Polygon geometry, got {geom.get('type')}")

    coords = geom["coordinates"]
    rings: list[list[tuple[float, float]]] = []
    for ring in coords:
        rings.append([(pt[0], pt[1]) for pt in ring])
    return rings


def extrude_polygon(
    rings: list[list[tuple[float, float]]],
    height: float,
) -> str:
    """Build a polygon mesh from rings, extrude it, return the object name.

    GeoJSON uses [x, y] (or [lon, lat]).  In our local coordinate system
    x ≈ easting, y ≈ northing.  The resulting slab sits on the XY plane
    and extrudes along Z.
    """
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    outer = rings[0]

    # Build vertices for the base face
    verts = [Vector((pt[0], pt[1], 0.0)) for pt in outer]
    # last vertex in GeoJSON ring duplicates first – drop it
    if len(verts) > 1 and (verts[0] - verts[-1]).length < 0.0001:
        verts.pop()

    n = len(verts)
    if n < 3:
        raise ValueError("Outer ring has fewer than 3 unique vertices")

    faces: list[list[int]] = [list(range(n))]  # base face

    mesh = bpy.data.meshes.new("FloorSlabMesh")
    obj = bpy.data.objects.new("FloorSlab", mesh)
    bpy.context.collection.objects.link(obj)

    mesh.from_pydata(verts, [], faces)
    mesh.update()

    # Extrude along Z
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(mesh)

    # Select all faces and extrude
    for face in bm.faces:
        face.select = True

    ret = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    verts_extruded = [elem for elem in ret["geom"] if isinstance(elem, bmesh.types.BMVert)]

    # Move extruded verts up
    translate_vec = Vector((0.0, 0.0, height))
    bmesh.ops.translate(bm, vec=translate_vec, verts=verts_extruded)

    bmesh.update_edit_mesh(mesh)
    bpy.ops.object.mode_set(mode="OBJECT")

    # Smooth normals
    bpy.ops.object.shade_smooth()

    return obj.name


def apply_material(obj_name: str) -> None:
    """Assign a simple grey PBR-ish material."""
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        return

    mat = bpy.data.materials.new("FloorMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.85, 0.85, 0.85, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.7
        bsdf.inputs["Metallic"].default_value = 0.05

    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def export_glb(obj_name: str, output_path: str, compress: bool) -> None:
    """Export the object as .glb with optional Draco compression."""
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        raise RuntimeError(f"Object '{obj_name}' not found")
    obj.select_set(True)

    # Make sure the output directory exists
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    export_kwargs: dict = {
        "filepath": output_path,
        "use_selection": True,
        "export_format": "GLB",
        "export_apply": True,
        "export_image_format": "NONE",
    }

    # Draco is available only when the Blender build ships with it
    if compress:
        try:
            bpy.ops.object.select_all(action="DESELECT")
            obj.select_set(True)
            bpy.ops.export_scene.gltf(
                **export_kwargs,
                export_draco_mesh_compression_enable=True,
                export_draco_mesh_compression_level=6,
            )
            print(f"[OK] Exported (Draco) → {output_path}")
            return
        except TypeError:
            print("[WARN] Draco not available in this Blender build – falling back to uncompressed")

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(**export_kwargs)
    print(f"[OK] Exported → {output_path}")


def main() -> None:
    if not IN_BLENDER:
        print("This script must be run inside Blender.")
        print("Usage: blender --background --python extrude_from_geojson.py -- input.geojson output.glb 4.5")
        sys.exit(1)

    # Blender passes its own args first, then our args after --
    args = parse_args(sys.argv)

    rings = load_geojson_polygon(args.input)
    obj_name = extrude_polygon(rings, args.height)
    apply_material(obj_name)
    export_glb(obj_name, args.output, compress=not args.no_compress)

    print(f"Done. Floor slab written to {args.output}")


if __name__ == "__main__":
    main()
