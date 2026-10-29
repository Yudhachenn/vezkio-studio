# VEZKIO Studio 1.2.0 — Release candidate

> **Pre-release / QA only.** Do not call this release stable until Windows installer testing passes.

## What's inside
- Aurora dark desktop editor: pages, layers, text, shapes, images, local projects.
- Reality Lab, Mutation Engine, Motion Collision Radar, Design Constitution.
- One-Click Repair, Export Guardian, Creative Replay.
- Design DNA, Motion DNA, local backups and PNG/SVG exports.

## Known limitations
- Windows NSIS build requires GitHub Actions Windows runner or local MSVC toolchain.
- Unsigned installer may cause Microsoft Defender SmartScreen warnings.
- Image-heavy files may consume significant RAM; backup .vezkio projects.
- Motion analysis and social UI overlays are heuristics, not guaranteed pixel-accurate.
- Windows runtime / installer QA and code signing have not been verified by this package.

See `QA_CHECKLIST.md` and `RELEASE_GUIDE.md` before publishing.
