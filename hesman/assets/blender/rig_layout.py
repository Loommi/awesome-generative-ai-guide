"""Rig layout: pivot hierarchy for every lion, in three.js space.

Coordinates are three.js conventions (Y up, lion faces +Z, lion's own left is +X),
in metres, relative to the lion root (ground level under the body centre).
build_lions.py builds geometry around these pivots; `python rig_layout.py`
writes ../../src/three/rig/rigLayout.json for the app's procedural fallback.
"""

import json
import os

STANDARD = {
    "body": {"center": [0.0, 1.2, 0.0], "size": [1.1, 0.84, 2.4]},
    "headScale": 1.2,
    "legScale": 1.0,
}

COMMAND = {
    "body": {"center": [0.0, 1.55, 0.0], "size": [1.5, 1.1, 3.2]},
    "headScale": 1.5,
    "legScale": 1.22,
}


def _jaw(hs):
    return [0, -0.17 * hs, 0.4 * hs]


def _p(name, parent, pos):
    return {"name": name, "parent": parent, "pos": [round(v, 4) for v in pos]}


def _legs(dims, hip_front, hip_rear, front_knee, front_paw, rear_knee, rear_paw):
    out = []
    for side, sx in (("L", 1.0), ("R", -1.0)):
        fx, fy, fz = hip_front
        rx, ry, rz = hip_rear
        out += [
            _p(f"hip_F{side}", "root", [fx * sx, fy, fz]),
            _p(f"knee_F{side}", f"hip_F{side}", front_knee),
            _p(f"paw_F{side}", f"knee_F{side}", front_paw),
            _p(f"hip_B{side}", "root", [rx * sx, ry, rz]),
            _p(f"knee_B{side}", f"hip_B{side}", rear_knee),
            _p(f"paw_B{side}", f"knee_B{side}", rear_paw),
        ]
    return out


def standard_pivots():
    c = STANDARD["body"]["center"]
    piv = [
        _p("root", None, [0, 0, 0]),
        _p("body", "root", c),
        _p("neck", "root", [0, 1.68, 1.15]),
        _p("head", "neck", [0, 0, 0]),
        _p("jaw", "head", _jaw(STANDARD["headScale"])),
        _p("tail_1", "root", [0, 1.48, -1.18]),
        _p("tail_2", "tail_1", [0, 0.12, -0.5]),
        _p("tail_3", "tail_2", [0, 0.16, -0.45]),
    ]
    piv += _legs(
        STANDARD,
        hip_front=[0.6, 1.15, 0.8],
        hip_rear=[0.6, 1.2, -0.85],
        front_knee=[0, -0.55, -0.06],
        front_paw=[0, -0.46, 0.08],
        rear_knee=[0, -0.55, 0.12],
        rear_paw=[0, -0.51, -0.15],
    )
    return piv


def command_pivots():
    c = COMMAND["body"]["center"]
    piv = [
        _p("root", None, [0, 0, 0]),
        _p("body", "root", c),
        _p("neck", "root", [0, 2.18, 1.55]),
        _p("head", "neck", [0, 0, 0]),
        _p("jaw", "head", _jaw(COMMAND["headScale"])),
        _p("tail_1", "root", [0, 1.92, -1.58]),
        _p("tail_2", "tail_1", [0, 0.15, -0.6]),
        _p("tail_3", "tail_2", [0, 0.2, -0.55]),
    ]
    piv += _legs(
        COMMAND,
        hip_front=[0.8, 1.45, 1.05],
        hip_rear=[0.8, 1.5, -1.1],
        front_knee=[0, -0.72, -0.06],
        front_paw=[0, -0.55, 0.08],
        rear_knee=[0, -0.72, 0.14],
        rear_paw=[0, -0.6, -0.18],
    )
    piv += [
        _p("fin_L", "root", [0.62, 2.2, 1.1]),
        _p("fin_R", "root", [-0.62, 2.2, 1.1]),
        # Retracted robot head hides inside the chassis; extends along +Z (robot "up").
        _p("ext_head", "root", [0, 1.5, 0.1]),
        _p("ext_emblem", "root", [0, 1.18, 0.5]),
        _p("ext_collar", "root", [0, 1.26, 1.32]),
        _p("att_shoulder_L", "root", [1.05, 1.5, 1.05]),
        _p("att_shoulder_R", "root", [-1.05, 1.5, 1.05]),
        _p("att_hip_L", "root", [0.62, 1.45, -1.72]),
        _p("att_hip_R", "root", [-0.62, 1.45, -1.72]),
    ]
    return piv


def arm_pivots():
    # Arms dock belly-first against the torso's shoulder socket.
    return standard_pivots() + [
        _p("ext_fist", "root", [0, 1.2, -0.35]),
        _p("mount", "root", [0, 0.74, 0.7]),
    ]


def leg_pivots():
    return standard_pivots() + [
        _p("robot_knee", "root", [0, 1.2, -0.95]),
        _p("ext_thigh", "robot_knee", [0, 0, 1.25]),
        _p("mount", "ext_thigh", [0, 0, -1.42]),
    ]


UNITS = {
    "black": {"role": "torso", "layout": "command", "pivots": command_pivots},
    "red": {"role": "armR", "layout": "standard", "pivots": arm_pivots},
    "green": {"role": "armL", "layout": "standard", "pivots": arm_pivots},
    "blue": {"role": "legL", "layout": "standard", "pivots": leg_pivots},
    "orange": {"role": "legR", "layout": "standard", "pivots": leg_pivots},
}

LAYOUTS = {"standard": STANDARD, "command": COMMAND}


def layout_json():
    return {
        uid: {
            "role": u["role"],
            "layout": u["layout"],
            "body": LAYOUTS[u["layout"]]["body"],
            "headScale": LAYOUTS[u["layout"]]["headScale"],
            "legScale": LAYOUTS[u["layout"]]["legScale"],
            "pivots": u["pivots"](),
        }
        for uid, u in UNITS.items()
    }


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.normpath(os.path.join(here, "../../src/three/rig/rigLayout.json"))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        json.dump(layout_json(), f, indent=1)
    print("wrote", out)
