"""Rebuild browser LODs from the supplied GLB; originals are never modified.
Run: Blender --background --python scripts/prepare-scooter.py
"""
import bpy, os
from mathutils import Vector
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for name,ratio in [('near',.13),('far',.025)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(root,'pink-scooter/pink_scooter.glb'))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    for obj in meshes:
        bpy.context.view_layer.objects.active=obj
        mod=obj.modifiers.new('Browser detail','DECIMATE');mod.ratio=ratio
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.export_scene.gltf(filepath=os.path.join(root,f'public/assets/night-market/scooter/{name}.glb'),export_format='GLB',export_cameras=False,export_lights=False)
    print(name, 'triangles',sum(len(o.data.polygons) for o in meshes))
