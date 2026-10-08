"""Generate the HESMAN lion GLB assets with Blender (bpy).

Usage (Blender as a Python module, Python 3.11):
    python build_lions.py --units black,red,green,blue,orange --out ../../public/models
or inside Blender:
    blender --background --python build_lions.py -- --units black --out ../../public/models
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import hs  # noqa: E402
import rig_layout  # noqa: E402
from hs import (  # noqa: E402
    Rig, Rx, Ry, Rz, S, T, beam_matrix, box, cylinder, frustum_y, frustum_z,
    material, prism, star_profile, wheel,
)

PALETTES = {
    "black": {"paint": "#2b2e36", "trim": "#d9a630", "metallic": 0.6},
    "red": {"paint": "#c8161d", "trim": "#e9eaee", "metallic": 0.3},
    "green": {"paint": "#15913b", "trim": "#e9eaee", "metallic": 0.3},
    "blue": {"paint": "#1658c8", "trim": "#f4c21c", "metallic": 0.3},
    "orange": {"paint": "#f28a12", "trim": "#c8161d", "metallic": 0.3},
}


def make_materials(uid):
    p = PALETTES[uid]
    m = {
        "paint": material(f"paint_{uid}", p["paint"], p["metallic"], 0.3),
        "trim": material(f"trim_{uid}", p["trim"], 1.0 if uid == "black" else 0.25, 0.3),
        "silver": material("metal_silver", "#c9ced6", 1.0, 0.22),
        "dark": material("metal_dark", "#3b3f47", 0.85, 0.42),
        "gold": material("metal_gold", "#d9a630", 1.0, 0.28),
        "white": material("armor_white", "#eceef2", 0.05, 0.36),
        "eye": material("glow_eye", "#ffd23f", 0.0, 0.4, emission="#ffc21a", strength=4.0),
    }
    if uid == "black":
        m["red"] = material("paint_red", "#c8161d", 0.3, 0.3)
        m["blue"] = material("paint_blue", "#1658c8", 0.3, 0.3)
        m["green"] = material("paint_green", "#15913b", 0.3, 0.3)
        m["purple"] = material("paint_purple", "#5d2b8a", 0.3, 0.34)
        m["emblem"] = material("glow_emblem", "#ffd23f", 0.3, 0.3, emission="#ffc21a", strength=1.0)
    return m


def V(*a):
    return Vector(a)


# ------------------------------------------------------------------ body

def build_body(rig, lay, m, black):
    cx, cy, cz = lay["body"]["center"]
    W, H, L = lay["body"]["size"]
    yb, yt = cy - H / 2, cy + H / 2
    add = rig.add

    add("body", m["dark"], box(W * 0.82, H * 0.74, L * 0.94), T(cx, cy - 0.02, 0), bevel=0.04)

    side_panels = [((1, 0, 0), 0.07, 0.025), ((-1, 0, 0), 0.07, 0.025)]
    chest_y0 = yb + H * 0.12
    chest_top = yt + 0.1 * H / 0.84
    haunch_top = yt - 0.05
    add("body", m["paint"],
        frustum_y(chest_y0, (0, L * 0.27, W * 0.86, L * 0.34), chest_top, (0, L * 0.29, W, L * 0.42)),
        bevel=0.045, panels=side_panels)
    add("body", m["paint"],
        frustum_y(yb + H * 0.16, (0, -L * 0.28, W * 0.88, L * 0.4), haunch_top,
                  (0, -L * 0.27, W * 0.98, L * 0.44)),
        bevel=0.045, panels=side_panels)

    # Spine: overlapping chevron plates following the chest-to-haunch slope.
    for i in range(5):
        z = L * (0.38 - i * 0.19)
        y = chest_top if z > 0.05 * L else haunch_top if z < -0.05 * L else (chest_top + haunch_top) / 2
        w = W * (0.66 - 0.04 * abs(i - 1))
        d = L * 0.17
        prof = [(-w / 2, -d / 2), (0, -d / 2 + 0.1), (w / 2, -d / 2),
                (w * 0.42, d / 2), (0, d / 2 + 0.07), (-w * 0.42, d / 2)]
        mat = m["trim"] if black and i % 2 == 1 else m["paint"]
        add("body", mat, prism(prof, 0.07), T(0, y + 0.035, z) @ Rx(8) @ Rx(90), bevel=0.02)

    # Flank stripes (profile authored as (u=-z, v=y), extruded along X).
    stripe = [(-0.34 * L, 0.06), (-0.30 * L, 0.15), (0.32 * L, 0.15),
              (0.36 * L, 0.06), (0.32 * L, -0.03), (-0.30 * L, -0.03)]
    for sx in (1, -1):
        add("body", m["trim"], prism(stripe, 0.05),
            T(sx * (W / 2 - 0.005), cy + 0.02, 0) @ Ry(90), bevel=0.015)
        # waist actuators bridging the chest/haunch gap
        mm, ln = beam_matrix((sx * W * 0.4, cy - 0.12, -0.12 * L), (sx * W * 0.4, cy - 0.12, 0.14 * L), up=(0, 1, 0))
        add("body", m["silver"], cylinder(0.045, ln, 12), mm, bevel=0)
        add("body", m["dark"], cylinder(0.07, ln * 0.45, 12), mm @ T(0, -ln * 0.2, 0), bevel=0)

    # Belly plate and hydraulic lines
    add("body", m["dark"], box(W * 0.6, 0.05, L * 0.7), T(0, yb + 0.06, 0))
    for sx in (1, -1):
        mm, ln = beam_matrix((sx * W * 0.22, yb + 0.05, -0.33 * L), (sx * W * 0.22, yb + 0.05, 0.33 * L), up=(0, 1, 0))
        add("body", m["silver"], cylinder(0.035, ln, 10), mm, bevel=0)

    # Chest grille following the slanted chest front
    for i in range(3):
        y = cy - 0.12 + i * 0.12
        t = (y - chest_y0) / (chest_top - chest_y0)
        z = (0.44 + 0.06 * t) * L + 0.012
        add("body", m["dark"], box(W * 0.46, 0.05, 0.05), T(0, y, z), bevel=0.012)

    # Neck collar
    add("body", m["paint"],
        frustum_y(yt - 0.28, (0, 0.44 * L, W * 0.56, 0.13 * L), yt + 0.08, (0, 0.45 * L, W * 0.46, 0.1 * L)),
        bevel=0.03)

    if not black:
        add("body", m["dark"], box(0.62, 0.52, 0.05), T(0, cy - 0.02, -0.49 * L - 0.01), bevel=0.02)


# ------------------------------------------------------------------ head

def build_head(rig, k, m, black):
    base = T(tuple(rig.w("head"))) @ S(k)

    def add(pivot, mat, g, M=None, **kw):
        rig.add(pivot, mat, g, base @ (M if M is not None else Matrix.Identity(4)), **kw)

    trim = m["trim"] if black else m["paint"]
    add("head", m["paint"], frustum_y(-0.12, (0, 0.3, 0.64, 0.62), 0.3, (0, 0.24, 0.5, 0.48)),
        bevel=0.04, panels=[((1, 0, 0), 0.05, 0.015), ((-1, 0, 0), 0.05, 0.015)])
    add("head", m["paint"], frustum_y(0.14, (0, 0.55, 0.68, 0.26), 0.28, (0, 0.47, 0.6, 0.22)), bevel=0.03)
    add("head", trim, box(0.08, 0.05, 0.3), T(0, 0.3, 0.42) @ Rx(-12), bevel=0.012)

    # Mane: a radial collar of angular plates splayed forward around the skull.
    blade = [(-0.13, -0.05), (0.13, -0.05), (0.16, 0.16), (0.0, 0.3), (-0.16, 0.16)]
    for i, ang in enumerate((-150, -105, -60, -20, 20, 60, 105, 150)):
        a = math.radians(ang)
        c = Vector((0, 0.06, 0.06)) + Vector((math.sin(a), math.cos(a), 0)) * 0.33
        mat = trim if i % 2 else m["paint"]
        add("head", mat, prism(blade, 0.06), T(tuple(c)) @ Rz(-ang) @ Rx(-38) @ S(1.1, 1.2, 1), bevel=0.015)
    back = [(math.cos(a) * 0.32, math.sin(a) * 0.28) for a in [i * math.pi / 3 for i in range(6)]]
    add("head", m["paint"], prism(back, 0.08), T(0, 0.06, -0.02) @ Ry(180), bevel=0.02)

    add("head", m["white"], frustum_z(0.42, (0, -0.02, 0.54, 0.36), 0.9, (0, -0.05, 0.42, 0.25)), bevel=0.035)
    add("head", m["paint"], frustum_z(0.5, (0, 0.16, 0.22, 0.06), 0.88, (0, 0.096, 0.16, 0.05)), bevel=0.015)
    add("head", m["dark"], box(0.2, 0.08, 0.06), T(0, 0.05, 0.91), bevel=0.015)
    for sx in (1, -1):
        add("head", m["paint"], frustum_z(0.44, (sx * 0.26, -0.02, 0.08, 0.28), 0.78, (sx * 0.22, -0.04, 0.06, 0.2)), bevel=0.015)
        add("head", m["dark"], box(0.2, 0.09, 0.05), T(sx * 0.17, 0.1, 0.665), bevel=0.01)
        eye = [(-0.08, -0.018 * sx), (0.08, -0.04 * sx), (0.08, 0.018 * sx), (-0.08, 0.04 * sx)]
        eye = [(x * sx, y) for x, y in eye]
        add("head", m["eye"], prism(eye, 0.03), T(sx * 0.17, 0.1, 0.69), bevel=0)
        ear = [(-0.11, 0), (0.11, 0), (0.03, 0.3)]
        add("head", m["paint"], prism(ear, 0.07), T(sx * 0.24, 0.27, 0.12) @ Rz(-sx * 12) @ Ry(sx * 20), bevel=0.015)
        add("head", m["dark"], prism([(-0.06, 0.03), (0.06, 0.03), (0.02, 0.2)], 0.03),
            T(sx * 0.24, 0.27, 0.12) @ Rz(-sx * 12) @ Ry(sx * 20) @ T(0, 0, 0.04), bevel=0)
        add("head", m["white"], prism([(-0.05, 0), (0.05, 0), (0, -0.23)], 0.055), T(sx * 0.19, -0.16, 0.8), bevel=0)
    for x in (-0.08, 0, 0.08):
        add("head", m["white"], prism([(-0.025, 0), (0.025, 0), (0, -0.08)], 0.04), T(x, -0.18, 0.85), bevel=0)
    add("head", m["dark"], box(0.4, 0.1, 0.4), T(0, -0.2, 0.62), bevel=0)

    # Jaw (pivot "jaw" rotates about its hinge to open)
    add("jaw", m["white"], frustum_z(0.36, (0, -0.27, 0.46, 0.13), 0.86, (0, -0.29, 0.36, 0.1)), bevel=0.03)
    add("jaw", m["paint"], frustum_z(0.4, (0, -0.355, 0.42, 0.05), 0.82, (0, -0.36, 0.32, 0.05)), bevel=0.015)
    for sx in (1, -1):
        add("jaw", m["white"], prism([(-0.035, 0), (0.035, 0), (0, 0.13)], 0.04), T(sx * 0.15, -0.22, 0.8), bevel=0)
    add("jaw", m["silver"], cylinder(0.06, 0.5, 12), T(0, -0.2, 0.4) @ Rz(90), bevel=0)


# ------------------------------------------------------------------ legs

def build_legs(rig, g, m):
    for key in ("FL", "FR", "BL", "BR"):
        hip, knee, paw = f"hip_{key}", f"knee_{key}", f"paw_{key}"
        Hp, K, P = rig.w(hip), rig.w(knee), rig.w(paw)
        sx = 1 if Hp.x > 0 else -1
        front = key[0] == "F"
        add = rig.add
        t = g * 1.3  # cross-section scale: chunky mecha limbs

        add(hip, m["silver"], wheel(0.25 * t, 0.12 * g), T(tuple(Hp + V(sx * 0.1 * t, 0, 0))) @ Rz(-90 * sx), bevel=0.01)
        d0 = (0.5 if front else 0.66) * t
        add(hip, m["paint"],
            frustum_y(Hp.y + 0.16 * g, (Hp.x + sx * 0.1 * t, Hp.z, 0.12 * t, d0),
                      Hp.y + 0.44 * g, (Hp.x + sx * 0.07 * t, Hp.z - 0.02, 0.09 * t, d0 * 0.82)),
            bevel=0.025)

        mm, ln = beam_matrix(Hp, K)
        add(hip, m["dark"], box(0.2 * t, ln + 0.1, 0.24 * t), mm, bevel=0.03)
        if front:
            mm2, ln2 = beam_matrix(Hp + V(0, -0.14, 0.1 * t), K + V(0, 0.07, 0.1 * t))
            add(hip, m["paint"], box(0.27 * t, ln2, 0.12 * t), mm2, bevel=0.03,
                panels=[((0, 0, 1), 0.04, 0.015)])
        else:
            mm2, ln2 = beam_matrix(Hp + V(0, -0.06, 0), K + V(0, 0.08, 0))
            add(hip, m["paint"], box(0.31 * t, ln2, 0.34 * t), mm2, bevel=0.04,
                panels=[((1, 0, 0), 0.05, 0.015), ((-1, 0, 0), 0.05, 0.015)])
        mm3, ln3 = beam_matrix(Hp + V(0, -0.1, -0.16 * t), K + V(0, 0.1, -0.15 * t))
        add(hip, m["silver"], cylinder(0.035 * t, ln3, 10), mm3, bevel=0)
        add(hip, m["dark"], cylinder(0.06 * t, ln3 * 0.5, 10), mm3 @ T(0, ln3 * 0.22, 0), bevel=0)

        add(knee, m["silver"], wheel(0.14 * t, 0.1 * g), T(tuple(K + V(sx * 0.12 * t, 0, 0))) @ Rz(-90 * sx), bevel=0.008)
        mm4, ln4 = beam_matrix(K, P + V(0, 0.06, 0))
        add(knee, m["paint"], box(0.22 * t, ln4, 0.24 * t), mm4, bevel=0.03)
        add(knee, m["trim"], box(0.15 * t, ln4 * 0.72, 0.06 * t), mm4 @ T(0, 0, 0.13 * t), bevel=0.015)

        add(paw, m["dark"], box(0.2 * t, 0.12 * g, 0.2 * t), T(tuple(P)), bevel=0.02)
        add(paw, m["paint"],
            frustum_y(P.y - 0.14 * g, (P.x, P.z + 0.08 * t, 0.34 * t, 0.44 * t),
                      P.y + 0.05 * g, (P.x, P.z + 0.03 * t, 0.26 * t, 0.3 * t)),
            bevel=0.03)
        for dx in (-0.1, 0, 0.1):
            add(paw, m["dark"], box(0.085 * t, 0.09 * g, 0.12 * t),
                T(P.x + dx * t, P.y - 0.09 * g, P.z + 0.3 * t), bevel=0.015)
            add(paw, m["silver"], prism([(0, 0.04), (0, -0.04), (0.17, -0.07)], 0.05),
                T(P.x + dx * t, P.y - 0.07 * g, P.z + 0.35 * t) @ Ry(-90) @ S(t), bevel=0)


# ------------------------------------------------------------------ tail

def build_tail(rig, g, m, black):
    T1, T2, T3 = rig.w("tail_1"), rig.w("tail_2"), rig.w("tail_3")
    d3 = (T3 - T2).normalized()
    tip = T3 + d3 * 0.42 * g
    for i, (a, b, piv) in enumerate([(T1, T2, "tail_1"), (T2, T3, "tail_2"), (T3, tip, "tail_3")]):
        mm, ln = beam_matrix(a, b, up=(0, 1, 0))
        rig.add(piv, m["dark"], cylinder(0.075 * g, ln, 12), mm, bevel=0)
        sleeve = m["trim"] if black and i == 1 else m["paint"]
        rig.add(piv, sleeve, box(0.17 * g, ln * 0.62, 0.17 * g), mm, bevel=0.025)
        rig.add(piv, m["silver"], cylinder(0.1 * g, 0.07, 14), T(tuple(a)) @ hs.basis(b - a, (0, 1, 0)), bevel=0.01)
    spade = [(0, 0.42), (0.13, 0.12), (0.05, 0.0), (-0.05, 0.0), (-0.13, 0.12)]
    rig.add("tail_3", m["gold"], prism(spade, 0.06),
            T(tuple(tip - d3 * 0.05)) @ hs.basis(d3, (0, 1, 0)) @ Ry(90) @ S(g), bevel=0.012)


# ------------------------------------------------------------- command unit

def build_command_parts(rig, m):
    """Black Lion: robot head, chest emblem, belt, wings and docking sockets."""
    # Wings lie flat on the back in beast mode and swing up behind the shoulders.
    frame = [(-0.2, 0.12), (0.22, 0.12), (0.3, -0.2), (0.08, -1.75), (-0.06, -1.55), (-0.2, -0.3)]
    blade = [(-0.13, 0.05), (0.16, 0.05), (0.22, -0.22), (0.07, -1.5), (-0.03, -1.38), (-0.13, -0.3)]
    for side, sx in (("L", 1), ("R", -1)):
        F = rig.w(f"fin_{side}")
        M = T(tuple(F)) @ Rx(90) @ S(sx, 1, 1)
        rig.add(f"fin_{side}", m["red"], prism(frame, 0.05), M, bevel=0.012)
        rig.add(f"fin_{side}", m["white"], prism(blade, 0.075), M, bevel=0.012)
        rig.add(f"fin_{side}", m["silver"], cylinder(0.08, 0.32, 12), T(tuple(F)) @ Rz(90), bevel=0.01)

    # Robot head, authored in robot frame (x, y up, z forward) then rotated into
    # the lion frame where robot-up is +Z and robot-forward is -Y.
    hb = T(tuple(rig.w("ext_head"))) @ Rx(90)

    def head(mat, g, M=None, **kw):
        rig.add("ext_head", mat, g, hb @ (M if M is not None else Matrix.Identity(4)), **kw)

    head(m["dark"], cylinder(0.17, 0.36, 16), T(0, 0.18, 0), bevel=0)
    head(m["silver"], cylinder(0.23, 0.07, 20), T(0, 0.34, 0), bevel=0.01)
    head(m["white"], frustum_y(0.36, (0, 0.06, 0.34, 0.3), 0.84, (0, 0.04, 0.48, 0.4)), bevel=0.03)
    head(m["dark"], box(0.2, 0.06, 0.04), T(0, 0.46, 0.24), bevel=0.01)
    head(m["blue"], box(0.5, 0.07, 0.06), T(0, 0.6, 0.22), bevel=0.01)
    for sx in (1, -1):
        eye = [(-0.09, -0.02 * sx), (0.08, -0.035 * sx), (0.08, 0.02 * sx), (-0.09, 0.035 * sx)]
        head(m["eye"], prism([(x * sx, y) for x, y in eye], 0.03), T(sx * 0.11, 0.69, 0.235), bevel=0)
        ear = [(-0.25, 0.45), (0.2, 0.45), (0.12, 0.92), (-0.05, 1.12), (-0.22, 0.9)]
        head(m["paint"], prism(ear, 0.06), T(sx * 0.3, 0, 0) @ Ry(-90), bevel=0.015)
        head(m["gold"], cylinder(0.12, 0.06, 18), T(sx * 0.335, 0.62, -0.02) @ Rz(90), bevel=0.01)
        horn = [(-0.05, 0), (0.05, 0), (0.035, 0.46), (-0.01, 0.5)]
        head(m["gold"], prism([(x * sx, y) for x, y in horn], 0.07), T(sx * 0.19, 0.98, 0.04) @ Rz(-sx * 8), bevel=0.012)
    head(m["paint"], frustum_y(0.42, (0, -0.12, 0.6, 0.42), 1.02, (0, -0.1, 0.5, 0.4)), bevel=0.04)
    head(m["paint"], frustum_y(0.84, (0, 0.02, 0.56, 0.5), 1.06, (0, 0.0, 0.4, 0.36)), bevel=0.03)
    head(m["paint"], box(0.56, 0.1, 0.16), T(0, 0.8, 0.2) @ Rx(12), bevel=0.02)
    head(m["gold"], prism([(-0.08, 0), (0.08, 0), (0.02, 0.16), (0, 0.12), (-0.02, 0.16)], 0.04),
         T(0, 0.83, 0.29), bevel=0)

    # Chest emblem: multicolour H shield on the belly (robot chest).
    eb = T(tuple(rig.w("ext_emblem"))) @ Rx(90)

    def emblem(mat, g, M=None, **kw):
        rig.add("ext_emblem", mat, g, eb @ (M if M is not None else Matrix.Identity(4)), **kw)

    shield = [(-0.5, 0.5), (0.5, 0.5), (0.5, -0.12), (0, -0.56), (-0.5, -0.12)]
    emblem(m["gold"], prism(shield, 0.06), bevel=0.02)
    emblem(m["white"], prism([(x * 0.88, y * 0.88) for x, y in shield], 0.07), T(0, 0, 0.012), bevel=0.012)
    emblem(m["blue"], prism([(-0.42, 0.42), (-0.15, 0.42), (-0.15, -0.3), (-0.42, -0.1)], 0.03), T(0, 0, 0.05), bevel=0)
    emblem(m["green"], prism([(-0.15, 0.42), (0.15, 0.42), (0.15, -0.3), (0, -0.44), (-0.15, -0.3)], 0.03), T(0, 0, 0.05), bevel=0)
    emblem(m["red"], prism([(0.15, 0.42), (0.42, 0.42), (0.42, -0.1), (0.15, -0.3)], 0.03), T(0, 0, 0.05), bevel=0)
    for sx in (1, -1):
        emblem(m["emblem"], box(0.1, 0.6, 0.04), T(sx * 0.16, 0.02, 0.075), bevel=0.01)
    emblem(m["emblem"], box(0.24, 0.1, 0.04), T(0, 0.04, 0.075), bevel=0.01)

    # Robot-front armour on the lion's belly.
    add = rig.add
    for sx in (1, -1):
        add("body", m["paint"], frustum_z(0.0, (sx * 0.6, 1.08, 0.3, 0.08), 1.25, (sx * 0.58, 1.07, 0.34, 0.1)), bevel=0.02)
        # Collar plates stow inside the chest and slide out in robot mode.
        add("ext_collar", m["red"], frustum_z(1.2, (sx * 0.42, 1.27, 0.5, 0.22), 1.48, (sx * 0.4, 1.3, 0.54, 0.26)), bevel=0.03)
        add("ext_collar", m["gold"], box(0.52, 0.05, 0.05), T(sx * 0.42, 1.15, 1.24), bevel=0.01)
        add("body", m["red"], box(0.22, 0.05, 0.14), T(sx * 0.45, 0.94, -0.88), bevel=0.01)
    for i in range(4):
        add("body", m["purple"], box(0.86, 0.06, 0.11), T(0, 1.1, 0.18 - i * 0.16), bevel=0.02)
    add("body", m["white"], box(1.58, 0.5, 0.3), T(0, 1.2, -0.88), bevel=0.03)
    add("body", m["gold"], box(0.38, 0.07, 0.34), T(0, 0.93, -0.88), bevel=0.025)
    add("body", m["gold"], prism(star_profile(0.13, 0.055), 0.04), T(0, 0.89, -0.88) @ Rx(90), bevel=0.006)
    add("body", m["paint"], frustum_z(-1.62, (0, 1.18, 0.5, 0.2), -1.15, (0, 1.12, 0.62, 0.2)), bevel=0.03)
    add("body", m["red"], frustum_z(-1.6, (0, 1.04, 0.22, 0.06), -1.2, (0, 1.02, 0.3, 0.06)), bevel=0.01)

    # Docking hardware at the attachment points.
    for side, sx in (("L", 1), ("R", -1)):
        A = rig.w(f"att_shoulder_{side}")
        add(f"att_shoulder_{side}", m["silver"], wheel(0.25, 0.2), T(tuple(A + V(-sx * 0.12, 0, 0))) @ Rz(-90 * sx), bevel=0.01)
        Hh = rig.w(f"att_hip_{side}")
        add(f"att_hip_{side}", m["silver"], wheel(0.23, 0.16), T(tuple(Hh + V(0, 0, 0.08))) @ Rx(-90), bevel=0.01)


# ------------------------------------------------------------------ driver

REQUIRED = {
    "all": ["root", "body", "neck", "head", "jaw", "tail_1", "tail_2", "tail_3"]
    + [f"{j}_{k}" for j in ("hip", "knee", "paw") for k in ("FL", "FR", "BL", "BR")],
    "torso": ["fin_L", "fin_R", "ext_head", "ext_emblem", "ext_collar", "att_shoulder_L",
              "att_shoulder_R", "att_hip_L", "att_hip_R"],
    "armR": ["ext_fist", "mount"],
    "armL": ["ext_fist", "mount"],
    "legL": ["robot_knee", "ext_thigh", "mount"],
    "legR": ["robot_knee", "ext_thigh", "mount"],
}


def build_unit(uid, out_dir):
    unit = rig_layout.layout_json()[uid]
    hs.reset_scene()
    m = make_materials(uid)
    rig = Rig(uid, unit["pivots"])
    black = unit["role"] == "torso"
    build_body(rig, unit, m, black)
    build_head(rig, unit["headScale"], m, black)
    build_legs(rig, unit["legScale"], m)
    build_tail(rig, unit["legScale"], m, black)
    if black:
        build_command_parts(rig, m)
    elif unit["role"] in ("armR", "armL"):
        raise NotImplementedError("arm role parts not built yet")
    else:
        raise NotImplementedError("leg role parts not built yet")
    rig.build()
    path = os.path.join(out_dir, f"{uid}-lion.glb")
    hs.export_glb(path)
    return path, rig.tris


def validate(uid, path):
    role = rig_layout.UNITS[uid]["role"]
    hs.reset_scene()
    bpy.ops.import_scene.gltf(filepath=path)
    names = {o.name for o in bpy.data.objects}
    missing = [n for n in REQUIRED["all"] + REQUIRED[role] if n not in names]
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    mats = sorted({s.material.name for o in meshes for s in o.material_slots if s.material})
    return {
        "unit": uid,
        "file": os.path.basename(path),
        "bytes": os.path.getsize(path),
        "meshes": len(meshes),
        "triangles": tris,
        "materials": mats,
        "missing_nodes": missing,
        "ok": not missing and tris > 0,
    }


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--units", default="black,red,green,blue,orange")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "../../public/models"))
    args = ap.parse_args(argv)
    os.makedirs(args.out, exist_ok=True)
    report = []
    for uid in [u.strip() for u in args.units.split(",") if u.strip()]:
        path, _ = build_unit(uid, args.out)
        report.append(validate(uid, path))
    print(json.dumps(report, indent=1))
    if not all(r["ok"] for r in report):
        sys.exit(1)


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    main(argv)
