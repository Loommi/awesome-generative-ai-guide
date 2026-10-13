"""Turn a sculpted / AI-generated lion mesh (single fused shell) into a rig GLB.

The source is decimated, cut into the same named pivots the procedural lions
use (hip/knee/paw x4, neck/head/jaw, tail_1..3, body), painted by region, and
combined with the hidden robot-mode parts so the app's manifest, timelines and
docking keep working unchanged.

    python mesh_lion.py --unit black --out ../../public/models
"""

import argparse
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import build_lions  # noqa: E402
import hs  # noqa: E402
from hs import Rig  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


class Source:
    """Mesh-space (three.js axes, as exported) → rig-space mapping."""

    def __init__(self, scale, ground_y):
        self.s = scale
        self.g = ground_y

    def p(self, x, y, z):
        return [round(x * self.s, 4), round((y - self.g) * self.s, 4), round(z * self.s, 4)]


# ------------------------------------------------------------- black lion

BLACK_SRC = Source(scale=3.0, ground_y=-0.381)

# Old procedural chassis box -> this mesh's body volume, for the belly armour.
BLACK_FIT = Matrix((
    (0.8, 0, 0, 0),
    (0, 1.0, 0, -0.4),
    (0, 0, 0.703, 0.375),
    (0, 0, 0, 1),
))


def black_pivots():
    m = BLACK_SRC.p
    fit = lambda x, y, z: [round(v, 4) for v in (BLACK_FIT @ Vector((x, y, z)))]  # noqa: E731
    absolute = {
        "root": (None, [0, 0, 0]),
        "body": ("root", m(0, 0.02, 0.05)),
        "neck": ("root", m(0, 0.12, 0.6)),
        "head": ("neck", None),
        "jaw": ("head", m(0, -0.07, 0.68)),
        "tail_1": ("root", m(0, 0.09, -0.38)),
        "tail_2": ("tail_1", m(0, 0.13, -0.62)),
        "tail_3": ("tail_2", m(0, 0.2, -0.82)),
        # Wings stow inside the back in beast mode and swing out in robot mode.
        "fin_L": ("root", [0.59, 1.35, 1.15]),
        "fin_R": ("root", [-0.59, 1.35, 1.15]),
        "ext_head": ("root", fit(0, 1.5, 0.1)),
        "ext_emblem": ("root", fit(0, 1.18, 0.5)),
        "ext_collar": ("root", fit(0, 1.26, 1.32)),
        "att_shoulder_L": ("root", [1.38, m(0, 0.08, 0)[1], m(0, 0, 0.5)[2]]),
        "att_shoulder_R": ("root", [-1.38, m(0, 0.08, 0)[1], m(0, 0, 0.5)[2]]),
        "att_hip_L": ("root", [0.5, 1.1, -1.0]),
        "att_hip_R": ("root", [-0.5, 1.1, -1.0]),
    }
    for side, sx in (("L", 1), ("R", -1)):
        absolute[f"hip_F{side}"] = ("root", m(0.34 * sx, 0.08, 0.5))
        absolute[f"knee_F{side}"] = (f"hip_F{side}", m(0.37 * sx, -0.15, 0.62))
        absolute[f"paw_F{side}"] = (f"knee_F{side}", m(0.37 * sx, -0.3, 0.7))
        absolute[f"hip_B{side}"] = ("root", m(0.27 * sx, 0.0, -0.08))
        absolute[f"knee_B{side}"] = (f"hip_B{side}", m(0.3 * sx, -0.17, -0.2))
        absolute[f"paw_B{side}"] = (f"knee_B{side}", m(0.3 * sx, -0.3, -0.18))
    absolute["head"] = ("neck", absolute["neck"][1])

    order = ["root", "body", "neck", "head", "jaw", "tail_1", "tail_2", "tail_3"]
    order += [f"{j}_{k}" for k in ("FL", "FR", "BL", "BR") for j in ("hip", "knee", "paw")]
    order += ["fin_L", "fin_R", "ext_head", "ext_emblem", "ext_collar",
              "att_shoulder_L", "att_shoulder_R", "att_hip_L", "att_hip_R"]
    out = []
    for name in order:
        parent, pos = absolute[name]
        base = absolute[parent][1] if parent else [0, 0, 0]
        out.append({"name": name, "parent": parent, "pos": [round(a - b, 4) for a, b in zip(pos, base)]})
    return out


def black_classify(c, n):
    """Face centroid c / normal n in mesh space -> (pivot, material key)."""
    x, y, z = c
    ax = abs(x)
    side = "L" if x > 0 else "R"
    if z < -0.38 and y > -0.2:
        piv = "tail_1" if z > -0.62 else "tail_2" if z > -0.82 else "tail_3"
        band = int((z + 2) / 0.07) % 2
        return piv, "gold" if band else "paint"
    if z > 0.56 and ax < 0.235 and y > -0.24:
        if z > 0.66 and y < -0.07:
            return "jaw", "white" if z > 0.76 else "paint"
        if z > 0.8 and y < 0.06:
            return "head", "white"
        if ax < 0.05 and y > 0.1 and 0.66 < z < 0.9:
            return "head", "crest"
        return "head", "gold" if (ax > 0.13 and z < 0.8) else "paint"
    if z > 0.3 and ax >= 0.235:
        seg = "hip" if y > -0.12 else "knee" if y > -0.27 else "paw"
        return f"{seg}_F{side}", leg_material(seg, c, n, front=True)
    if z < 0.2 and ax > 0.17 and y < 0.1:
        seg = "hip" if y > -0.14 else "knee" if y > -0.28 else "paw"
        return f"{seg}_B{side}", leg_material(seg, c, n, front=False)
    if n[1] > 0.88 and y > 0.16:
        return "body", "gold"
    return "body", "paint"


def leg_material(seg, c, n, front):
    x, y, z = c
    if seg == "hip" and abs(n[0]) > 0.75 and abs(x) > (0.28 if front else 0.24):
        return "silver"
    if seg == "paw":
        tip = 0.74 if front else -0.08
        return "gold" if z > tip else "paint"
    return "paint"


UNITS = {
    "black": {
        "source": os.path.join(HERE, "..", "sources", "black-lion-hunyuan.glb"),
        "src": BLACK_SRC,
        "pivots": black_pivots,
        "classify": black_classify,
        "decimate": 0.25,
        "fit": BLACK_FIT,
        "eyes": [(0.065, 0.07), (-0.065, 0.07)],
    },
}


# ------------------------------------------------------------------ build

def load_source(path, ratio):
    hs.reset_scene()
    bpy.ops.import_scene.gltf(filepath=path)
    ob = [o for o in bpy.data.objects if o.type == "MESH"][0]
    if ratio < 1:
        mod = ob.modifiers.new("decimate", "DECIMATE")
        mod.ratio = ratio
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    me.transform(ob.matrix_world)
    me.calc_loop_triangles()
    n = len(me.vertices)
    co = np.empty(n * 3)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    verts = np.stack([co[:, 0], co[:, 2], -co[:, 1]], 1)  # Blender -> three axes
    tris = np.empty(len(me.loop_triangles) * 3, dtype=np.int64)
    me.loop_triangles.foreach_get("vertices", tris)
    return verts, tris.reshape(-1, 3)


def smooth_labels(tris, labels, passes=3):
    """Majority filter over edge-adjacent faces sharing a pivot: removes speckle."""
    e = np.sort(np.concatenate([tris[:, [0, 1]], tris[:, [1, 2]], tris[:, [2, 0]]]), axis=1)
    fid = np.tile(np.arange(len(tris)), 3)
    order = np.lexsort((e[:, 1], e[:, 0]))
    e, fid = e[order], fid[order]
    same = np.all(e[1:] == e[:-1], axis=1)
    pairs = np.stack([fid[:-1][same], fid[1:][same]], 1)
    nbrs = [[] for _ in range(len(tris))]
    for a, b in pairs:
        nbrs[a].append(b)
        nbrs[b].append(a)
    for _ in range(passes):
        new = list(labels)
        for i, ns in enumerate(nbrs):
            piv = labels[i][0]
            votes = {}
            for j in ns + [i]:
                if labels[j][0] == piv:
                    votes[labels[j][1]] = votes.get(labels[j][1], 0) + (1.5 if j == i else 1)
            new[i] = (piv, max(votes, key=votes.get))
        labels = new
    return labels


def add_eyes(rig, m, verts, src, spots):
    """Glowing eye slits placed on the sculpted face surface."""
    for (ex, ey) in spots:
        near = verts[(np.abs(verts[:, 0] - ex) < 0.02) & (np.abs(verts[:, 1] - ey) < 0.02) & (verts[:, 2] > 0.6)]
        if not len(near):
            continue
        z = near[:, 2].max()
        sx = 1 if ex > 0 else -1
        eye = [(-0.08, -0.018 * sx), (0.08, -0.04 * sx), (0.08, 0.018 * sx), (-0.08, 0.04 * sx)]
        eye = [(x * sx, y) for x, y in eye]
        rig.add("head", m["eye"], build_lions.prism(eye, 0.05),
                hs.T(*src.p(ex, ey, z + 0.004)) @ hs.Ry(sx * 18) @ hs.S(1.5), bevel=0)


def build(uid, out_dir):
    cfg = UNITS[uid]
    verts, tris = load_source(cfg["source"], cfg["decimate"])
    a, b, c = verts[tris[:, 0]], verts[tris[:, 1]], verts[tris[:, 2]]
    cent = (a + b + c) / 3
    nrm = np.cross(b - a, c - a)
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12

    labels = smooth_labels(tris, [cfg["classify"](cent[i], nrm[i]) for i in range(len(tris))])
    groups = {}
    for i, lab in enumerate(labels):
        groups.setdefault(lab, []).append(i)

    hs.reset_scene()
    m = build_lions.make_materials(uid)
    rig = Rig(uid, cfg["pivots"]())
    src = cfg["src"]
    final = np.stack([verts[:, 0] * src.s, (verts[:, 1] - src.g) * src.s, verts[:, 2] * src.s], 1)

    for (pivot, matkey), faces in groups.items():
        sub = tris[faces]
        used, inv = np.unique(sub, return_inverse=True)
        local_v = final[used].tolist()
        local_f = inv.reshape(-1, 3).tolist()

        def builder(bm, local_v=local_v, local_f=local_f):
            vs = [bm.verts.new(v) for v in local_v]
            for f in local_f:
                try:
                    bm.faces.new([vs[k] for k in f])
                except ValueError:
                    pass

        rig.add(pivot, m[matkey], builder, bevel=0)

    add_eyes(rig, m, verts, src, cfg["eyes"])
    build_lions.build_command_parts(rig, m, fit=cfg["fit"], kx=1.0, sockets=False)
    rig.build()
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{uid}-lion.glb")
    hs.export_glb(path)
    summary = {(p, k): len(f) for (p, k), f in groups.items()}
    return path, rig.tris, summary


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--unit", default="black", choices=sorted(UNITS))
    ap.add_argument("--out", default=os.path.join(HERE, "../../public/models"))
    args = ap.parse_args(argv)
    path, tris, summary = build(args.unit, args.out)
    report = build_lions.validate(args.unit, path)
    report["parts"] = {f"{p}:{k}": n for (p, k), n in sorted(summary.items())}
    print(json.dumps(report, indent=1))
    if not report["ok"]:
        sys.exit(1)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    main(argv)
