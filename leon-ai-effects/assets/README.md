# León Beard Engine — canonical topology and procedural materials

## Imported mesh
- `leon-ai-effects/assets/canonical_face_model.obj`: MediaPipe canonical face geometry (468 vertices, 898 faces), originally from https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj
- MediaPipe source is distributed under Apache License 2.0; retain upstream attribution and review repository-wide NOTICE obligations before distributing.
- Original source: Copyright Google LLC. Licensed under Apache License 2.0. https://www.apache.org/licenses/LICENSE-2.0

## Implementation
- The face topology is fetched **locally** when the effect is enabled, parsed into stable triangles, and sampled once to generate follicle barycentric coordinates.
- Hair roots are reprojected through current MediaPipe landmark positions; varying fiber darkness, length and opacity approximate hair materials.
- Canonical coordinates determine an initial beard region; mouth bounds are excluded dynamically.
- Existing WebGL2 adaptive quality and context recovery remain enabled.
- The previous improvised strips are removed from the drawing pipeline.

## Limitations / release gates
- The anatomical mask is approximate and may cover unintended facial regions. Review frontal and side poses with visual evidence before merge.
- This is procedural hair shading, **not** a physically based anisotropic hair BSDF. It has no true skin occlusion, contact shadows or estimated scene lighting.
- GPU render timing and export to captured photos/videos are not verified.
- Face transform matrices are exposed upstream but not yet applied as a calibrated 3D camera projection.
- Verify 468 landmark index correspondence, correct mirror behavior, camera crop, mouth exclusions, performance and fallback on actual Android hardware.
- Disable or revert the effect if stray black lines, facial obstruction or significant frame drops occur.
