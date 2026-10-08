"""Render turnaround previews of a generated lion GLB with Cycles (CPU).

    python preview.py ../../public/models/black-lion.glb /tmp/black.png
"""

import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hs  # noqa: E402

VIEWS = {
    "front34": (35, 18),
    "side": (90, 8),
    "rear34": (150, 22),
    "top": (20, 70),
}


def main(glb, out, views):
    hs.reset_scene()
    for w in list(bpy.data.worlds):
        bpy.data.worlds.remove(w)
    bpy.ops.import_scene.gltf(filepath=glb)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in meshes:
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, p))
            hi = Vector(map(max, hi, p))
    center = (lo + hi) / 2
    radius = (hi - lo).length / 2

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 640
    scene.view_settings.view_transform = "AgX"

    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.32, 0.36, 0.42, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
    scene.world = world

    for name, rot, energy in (("key", (50, 0, 35), 4.0), ("fill", (60, 0, -120), 1.5), ("rim", (35, 0, 180), 2.5)):
        ld = bpy.data.lights.new(name, "SUN")
        ld.energy = energy
        lo_ = bpy.data.objects.new(name, ld)
        lo_.rotation_euler = [math.radians(a) for a in rot]
        scene.collection.objects.link(lo_)

    bpy.ops.mesh.primitive_plane_add(size=40, location=(center.x, center.y, lo.z))

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 50
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    base, ext = os.path.splitext(out)
    for vname in views:
        az, el = VIEWS[vname]
        d = radius * 3.1
        a, e = math.radians(az), math.radians(el)
        # Blender space: lion faces -Y.
        cam.location = center + Vector((math.sin(a) * math.cos(e) * d, -math.cos(a) * math.cos(e) * d, math.sin(e) * d))
        cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = f"{base}-{vname}{ext}"
        bpy.ops.render.render(write_still=True)
        print("rendered", scene.render.filepath)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    views = argv[2].split(",") if len(argv) > 2 else list(VIEWS)
    main(argv[0], argv[1], views)
