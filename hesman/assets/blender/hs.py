"""Hard-surface modelling toolkit for the HESMAN lion rigs (Blender 4.2+/5.x, bpy).

All geometry and pivots are authored in three.js space (Y up, +Z forward) and
converted to Blender space (Z up, -Y forward) when meshes are written, so the
glTF exporter's Y-up conversion lands every node back in three.js coordinates
with identity rest rotations.
"""

import math

import bmesh
import bpy
from mathutils import Matrix, Vector

# three.js (x, y, z) -> Blender (x, -z, y)
B = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))


def to_blender(v):
    return Vector((v[0], -v[2], v[1]))


# ---------------------------------------------------------------- matrices

def T(x, y=0.0, z=0.0):
    if not isinstance(x, (int, float)):
        x, y, z = x
    return Matrix.Translation((x, y, z))


def Rx(deg):
    return Matrix.Rotation(math.radians(deg), 4, "X")


def Ry(deg):
    return Matrix.Rotation(math.radians(deg), 4, "Y")


def Rz(deg):
    return Matrix.Rotation(math.radians(deg), 4, "Z")


def S(x, y=None, z=None):
    y = x if y is None else y
    z = x if z is None else z
    return Matrix.Diagonal((x, y, z, 1.0))


def basis(primary, up_hint):
    """Rotation whose local +Y points along `primary`, local +Z toward `up_hint`."""
    y = Vector(primary).normalized()
    u = Vector(up_hint).normalized()
    if abs(y.dot(u)) > 0.98:
        u = Vector((1, 0, 0)) if abs(y.x) < 0.9 else Vector((0, 0, 1))
    x = y.cross(u).normalized()
    z = x.cross(y).normalized()
    m = Matrix.Identity(4)
    for i in range(3):
        m[i][0], m[i][1], m[i][2] = x[i], y[i], z[i]
    return m


# --------------------------------------------------------------- materials

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4))


def material(name, color, metallic=0.0, roughness=0.5, emission=None, strength=0.0):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*hex_rgb(color), 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*hex_rgb(emission), 1.0)
        bsdf.inputs["Emission Strength"].default_value = strength
    return mat


# ------------------------------------------------------- geometry builders
# Each builder returns fn(bm) that adds geometry in local three.js units.

def _faces_from_verts(bm, vs, quads):
    for q in quads:
        try:
            bm.faces.new([vs[i] for i in q])
        except ValueError:
            pass


def hull(corners):
    """Hexahedron from 8 corners: bottom ring (0-3) then top ring (4-7), same winding."""
    def fn(bm):
        vs = [bm.verts.new(c) for c in corners]
        _faces_from_verts(bm, vs, [
            (0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
            (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
        ])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return fn


def frustum_y(y0, r0, y1, r1):
    """Box lofted along Y between rects r=(cx, cz, w, d) at heights y0 and y1."""
    def ring(y, r):
        cx, cz, w, d = r
        return [(cx - w / 2, y, cz - d / 2), (cx + w / 2, y, cz - d / 2),
                (cx + w / 2, y, cz + d / 2), (cx - w / 2, y, cz + d / 2)]
    return hull(ring(y0, r0) + ring(y1, r1))


def frustum_z(z0, r0, z1, r1):
    """Box lofted along Z between rects r=(cx, cy, w, h) at depths z0 and z1."""
    def ring(z, r):
        cx, cy, w, h = r
        return [(cx - w / 2, cy - h / 2, z), (cx + w / 2, cy - h / 2, z),
                (cx + w / 2, cy + h / 2, z), (cx - w / 2, cy + h / 2, z)]
    return hull(ring(z0, r0) + ring(z1, r1))


def box(sx, sy, sz):
    return frustum_y(-sy / 2, (0, 0, sx, sz), sy / 2, (0, 0, sx, sz))


def prism(profile, depth):
    """Polygon in the XY plane extruded symmetrically along Z."""
    def fn(bm):
        vs = [bm.verts.new((x, y, -depth / 2)) for x, y in profile]
        face = bm.faces.new(vs)
        ext = bmesh.ops.extrude_face_region(bm, geom=[face])
        moved = [e for e in ext["geom"] if isinstance(e, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, vec=(0, 0, depth), verts=moved)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return fn


def cylinder(r, h, n=24, r2=None):
    """Cylinder/cone along +Y, centred on the origin."""
    def fn(bm):
        res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n,
                                    radius1=r, radius2=r if r2 is None else r2, depth=h)
        bmesh.ops.rotate(bm, verts=res["verts"], cent=(0, 0, 0),
                         matrix=Matrix.Rotation(math.radians(-90), 3, "X"))
    return fn


def wheel(r, t, n=28):
    """Machined disc along +Y: recessed ring with a raised hub on the +Y face."""
    def fn(bm):
        res = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n,
                                    radius1=r, radius2=r, depth=t)
        top = [f for f in bm.faces if f.normal.z > 0.9 and f.calc_center_median().z > 0]
        bmesh.ops.inset_region(bm, faces=top, thickness=r * 0.2, depth=-t * 0.3)
        bmesh.ops.inset_region(bm, faces=top, thickness=r * 0.28, depth=t * 0.45)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0),
                         matrix=Matrix.Rotation(math.radians(-90), 3, "X"))
    return fn


def sphere(r, seg=16):
    def fn(bm):
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    return fn


def beam_matrix(a, b, up=(0, 0, 1)):
    a, b = Vector(a), Vector(b)
    return T(tuple((a + b) / 2)) @ basis(b - a, up), (b - a).length


def star_profile(r_out, r_in, points=5):
    pts = []
    for i in range(points * 2):
        ang = math.pi / 2 + i * math.pi / points
        r = r_out if i % 2 == 0 else r_in
        pts.append((math.cos(ang) * r, math.sin(ang) * r))
    return pts


# ------------------------------------------------------------- mesh ops

def _bevel(bm, offset, segments, min_angle_deg=30.0):
    if offset <= 0:
        return
    bm.edges.ensure_lookup_table()
    edges = []
    for e in bm.edges:
        if len(e.link_faces) == 2 and e.calc_face_angle(0.0) > math.radians(min_angle_deg):
            edges.append(e)
    if edges:
        bmesh.ops.bevel(bm, geom=edges, offset=offset, offset_type="OFFSET",
                        segments=segments, profile=0.5, affect="EDGES", clamp_overlap=True)


def _panel(bm, normal, inset, depth):
    """Recess every face facing `normal` (three space, pre-transform) as a panel."""
    n = Vector(normal)
    faces = [f for f in bm.faces if f.normal.dot(n) > 0.85 and f.calc_area() > (inset * 3) ** 2]
    if faces:
        bmesh.ops.inset_individual(bm, faces=faces, thickness=inset, depth=-depth)


# ------------------------------------------------------------------ rig

class Rig:
    """Collects parts per (pivot, material) and writes a glTF-ready hierarchy."""

    def __init__(self, prefix, pivots):
        self.prefix = prefix
        self.pivots = {p["name"]: p for p in pivots}
        self.order = [p["name"] for p in pivots]
        self.world = {}
        for name in self.order:
            p = self.pivots[name]
            base = self.world[p["parent"]] if p["parent"] else Vector((0, 0, 0))
            self.world[name] = base + Vector(p["pos"])
        self.acc = {}
        self.tris = 0

    def w(self, name):
        return self.world[name].copy()

    def add(self, pivot, mat, builder, M=None, bevel=0.025, segments=1, panels=None):
        """Add a part. M places the part in lion-root space (three.js)."""
        tmp = bmesh.new()
        builder(tmp)
        bmesh.ops.remove_doubles(tmp, verts=tmp.verts, dist=1e-5)
        _bevel(tmp, bevel, segments)
        for normal, inset, depth in panels or []:
            _panel(tmp, normal, inset, depth)
        M = Matrix.Identity(4) if M is None else M
        local = T(tuple(-self.world[pivot])) @ M
        bmesh.ops.transform(tmp, matrix=B @ local, verts=tmp.verts)
        if local.determinant() < 0:
            bmesh.ops.reverse_faces(tmp, faces=tmp.faces)
        key = (pivot, mat.name)
        if key not in self.acc:
            self.acc[key] = (bmesh.new(), mat)
        me = bpy.data.meshes.new("_tmp")
        tmp.to_mesh(me)
        tmp.free()
        self.acc[key][0].from_mesh(me)
        bpy.data.meshes.remove(me)

    def mirror_add(self, pivot_fmt, mat, builder, M_fn, **kw):
        for side, sx in (("L", 1), ("R", -1)):
            self.add(pivot_fmt.format(side=side), mat, builder, M_fn(sx), **kw)

    def build(self):
        coll = bpy.context.scene.collection
        objs = {}
        for name in self.order:
            p = self.pivots[name]
            emp = bpy.data.objects.new(name, None)
            emp.empty_display_type = "PLAIN_AXES"
            emp.empty_display_size = 0.15
            coll.objects.link(emp)
            if p["parent"]:
                emp.parent = objs[p["parent"]]
            emp.location = to_blender(p["pos"])
            objs[name] = emp
        for (pivot, matname), (bm, mat) in self.acc.items():
            me = bpy.data.meshes.new(f"{self.prefix}_{pivot}_{matname}")
            bm.to_mesh(me)
            bm.free()
            me.materials.append(mat)
            for poly in me.polygons:
                poly.use_smooth = True
            me.set_sharp_from_angle(angle=math.radians(38))
            me.validate()
            self.tris += sum(len(p.vertices) - 2 for p in me.polygons)
            ob = bpy.data.objects.new(me.name, me)
            coll.objects.link(ob)
            ob.parent = objs[pivot]
        self.acc = {}
        return objs


def reset_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for item in list(coll):
            coll.remove(item)


def export_glb(path):
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        use_selection=False,
        export_texcoords=False,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
