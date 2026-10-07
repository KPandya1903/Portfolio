# 05 — Avatar pipeline (Kunj's to-do list)

> **Dropped on 2026-10-06** ([00-overview](00-overview.md) D11): the CC0 robot stays and nothing below is scheduled. Kept in case the decision is reversed. Where this doc says the avatar stands in a rail or points from there, read "rests in the bottom-left corner" ([02-layout](02-layout.md)).

Goal: one file, `web/public/guide/kunj.glb`, at most 2.5 MB, holding Kunj's look-alike avatar and six animation
clips. Until it exists the site runs on the CC0 robot placeholder, so none of this blocks development.

Steps marked **Kunj** need his face, his accounts or his judgment. Steps marked **Claude** can be done for him.

## Step 1: Photo (Kunj, 5 min)

- Front-facing, eyes to the lens, neutral or slight smile, phone at eye level.
- Even daylight from the front; no strong side shadow, no backlight.
- Hair and ears visible. Glasses on only if you usually wear them.
- Plain background.

## Step 2: Create the avatar in MetaPerson Creator (Kunj, 20–30 min)

1. Open https://metaperson.avatarsdk.com and sign up (free personal avatar, [R7.2](01-references.md)).
2. Create from selfie and upload the photo.
3. Adjust what makes it look like you: skin tone, hairstyle and hair colour, beard or stubble, eyebrows, glasses.
   D1 says "some of my features"; aim for recognisable, not a scan.
4. Outfit: smart casual in browns, cream or navy, so it sits well on the `#FAF8F5` background ([02](02-layout.md) §4).
5. Export as **GLB**. Choose a T-pose or A-pose and textures at 1024 px or 2048 px if offered (the export UI may
   name these differently).
6. Save it as `portfolio-3d/assets/avatar/kunj-metaperson.glb`.
7. Read MetaPerson's terms for personal-website use before the site goes public, since this is a vendor whose
   rules can change (Ready Player Me shut down in January 2026, [R7.1](01-references.md)). The site never calls
   MetaPerson at runtime, so the exported file keeps working regardless.

Check (Claude): open the GLB at https://gltf-viewer.donmccurdy.com, or run
`npx @gltf-transform/cli inspect assets/avatar/kunj-metaperson.glb`, and note the bone names, triangle count and size.

## Step 3: Get Mixamo clips (Kunj, 30 min, free Adobe account)

Mixamo uploads take FBX, OBJ or ZIP, not GLB, so the GLB is converted first.

1. **Claude:** convert with Blender (4.x) headless:
   ```bash
   blender -b --python-expr "import bpy; bpy.ops.wm.read_factory_settings(use_empty=True); \
   bpy.ops.import_scene.gltf(filepath='assets/avatar/kunj-metaperson.glb'); \
   bpy.ops.export_scene.fbx(filepath='assets/avatar/kunj-metaperson.fbx', path_mode='COPY', embed_textures=True, add_leaf_bones=False)"
   ```
2. **Kunj:** go to https://www.mixamo.com, choose Upload Character, and upload `kunj-metaperson.fbx`.
   - If Mixamo recognises the skeleton (MetaPerson is described as Mixamo-ready), it goes straight to preview.
   - If it opens the auto-rigger, place the markers (chin, wrists, elbows, knees, groin) and accept. This is
     **path B**: the Mixamo-rigged character becomes the avatar. Download it once with **FBX Binary, With Skin**
     as `assets/avatar/kunj-mixamo.fbx`.
3. **Kunj:** for each clip below, search, adjust, then **Download → FBX Binary, Without Skin, 30 fps, Keyframe
   Reduction: none**. Tick **In Place** whenever the option appears (walking clips), so the avatar does not drift off
   its anchor; the code moves it ([R1.4](01-references.md) used the same "without skin" method).

| Save as `assets/clips/…` | Mixamo search | Settings | Plays when |
|---|---|---|---|
| `Wave.fbx` | "Waving" (one-hand) | — | Intro hello |
| `Talk.fbx` | "Talking" | Overdrive ~40 for subtle | Intro after the wave, About section |
| `Point.fbx` | "Pointing" | Character Arm-Space ~ +10 if the arm crosses the body | Hero (resume), Journey, Experience, Projects, Skills |
| `Idle.fbx` | "Breathing Idle" or "Standing Idle" | — | Resting |
| `Travel.fbx` | "Walking" (or "Female Walk"/"Catwalk Walk" for a different gait) | **In Place** | Moving between anchors |
| `ThumbsUp.fbx` | "Thumbs Up" | — | Contact |

## Step 4: Merge into one GLB (Claude, 15 min)

`assets/build-guide-glb.py`, run from the `portfolio-3d/` folder with `blender -b -P assets/build-guide-glb.py`:

```python
# Merge avatar + Mixamo clips into one GLB with named actions.
import bpy, pathlib

ROOT = pathlib.Path.cwd() / "assets"               # run from portfolio-3d/
AVATAR = ROOT / "avatar" / "kunj-mixamo.fbx"       # path B; use kunj-metaperson.fbx for path A
CLIPS = ["Wave", "Talk", "Point", "Idle", "Travel", "ThumbsUp"]
OUT = ROOT.parent / "web" / "public" / "guide" / "kunj.raw.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(AVATAR), automatic_bone_orientation=False)
rig = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
rig.animation_data_create()

for name in CLIPS:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(ROOT / "clips" / f"{name}.fbx"), automatic_bone_orientation=False)
    new_objs = set(bpy.data.objects) - before
    clip_rig = next(o for o in new_objs if o.type == "ARMATURE")
    action = clip_rig.animation_data.action
    action.name = name
    action.use_fake_user = True                    # keep it after the clip rig is deleted
    track = rig.animation_data.nla_tracks.new()   # one NLA track per clip so the exporter sees them all
    track.name = name
    track.strips.new(name, int(action.frame_range[0]), action)
    for o in new_objs:
        bpy.data.objects.remove(o, do_unlink=True)

OUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=str(OUT), export_format="GLB",
    export_animations=True, export_animation_mode="NLA_TRACKS",
    export_cameras=False, export_lights=False, export_apply=False,
)
print("wrote", OUT)
```

Verify on the first run: `npx @gltf-transform/cli inspect web/public/guide/kunj.raw.glb` must list six animations
named exactly `Wave Talk Point Idle Travel ThumbsUp`. If a clip's track names carry a `mixamorig:` prefix that the
avatar's bones lack (path A), rename the bones or strip the prefix at load time (see [04](04-system-design.md)).

## Step 5: Compress (Claude, 2 min)

```bash
npx @gltf-transform/cli@4.5.1 optimize web/public/guide/kunj.raw.glb web/public/guide/kunj.glb \
  --compress meshopt --texture-compress webp --texture-size 1024 --simplify false
rm web/public/guide/kunj.raw.glb
ls -l web/public/guide/kunj.glb     # must be ≤ 2,621,440 bytes
```

Meshopt needs no decoder files on the host; drei's `useGLTF` decodes it by default. `--simplify false` keeps the
face mesh intact.

## Step 6: Switch the site to the new avatar (Claude, 5 min)

In `web/src/guide/config.ts` change `MODEL` from the robot to:

```ts
export const MODEL: ModelConfig = {
  url: "/guide/kunj.glb",
  clipMap: { Wave: "Wave", Talk: "Talk", Point: "Point", Idle: "Idle", Travel: "Travel", ThumbsUp: "ThumbsUp" },
  once: ["Wave", "Point", "ThumbsUp"],
};
```

Then check every section in the browser: does the pointing arm read as pointing toward the content? If not, re-download
Point with a different Arm-Space value, or use the upper-body-only layering idea from [R4.2](01-references.md).

## Placeholder used until then

`RobotExpressive.glb` from three.js (CC0, [R7.4](01-references.md)). Its clips map as:

| Logical | RobotExpressive clip |
|---|---|
| Wave | `Wave` |
| Talk | `Yes` |
| Point | `ThumbsUp` (it has no pointing clip) |
| Idle | `Idle` |
| Travel | `Walking` |
| ThumbsUp | `ThumbsUp` |
