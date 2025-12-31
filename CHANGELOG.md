# 🌌 DreamTheater Changelog

All notable changes to the **DreamTheater** multiverse will be documented in this file.

## [7.7.0] - 2025-12-27
### 🗿 The Face & Video Revolution
- **Face Engine:** Migrated to **MediaPipe** (Google) for lightning-fast face detection on Apple Silicon.
    - *Why:* InsightFace/Dlib proved unstable on Python 3.13 + macOS.
    - *Capability:* Now detects faces in both images and video frames.
- **Identity System:** Implemented **Hybrid Identity** (MediaPipe Detect + CLIP Embed).
    - Teaches the AI to recognize specific faces by cropping and embedding them into the semantic vector space.
- **Video Scanner:** Added Multi-Frame Analysis.
    - Extracts 3 frames (Start, Middle, End) per video to maximize face detection chances.
- **UI Features:**
    - **Hall of Faces:** New `/faces` view to cluster and tag unknown people (Mass Tagging).
    - **LightBox 2.0:** Full-screen theater mode with "Apple Photos" style info panel.
    - **Native Video:** LightBox now plays `.mp4/.mov` files natively with loop/autoplay.
    - **Micro-Feedback:** Added toast notifications and optimistic UI updates for tagging/untagging.
    - **Omniscient Console:** Added God Mode debug console (Press `~`).

## [7.6.0] - 2025-12-27
### 🎭 The Rebranding & Cinema Engine
- **Branding:** Officially renamed the project from **DreamOS** to **DreamTheater**.
- **Video Engine:** Integrated **OpenCV** for video asset indexing.
    - System now extracts the middle frame (50% mark) for visual embedding and thumbnail generation.
    - Added support for `.mp4`, `.mov`, `.webm`, and `.mkv`.
- **UI/UX:** Major layout overhaul to "Glassmorphism 2.0".
    - **Floating Sidebar:** Now detached from edge with neon glow effects.
    - **Monolith Inspector:** Redesigned Info Panel in LightBox with "Neural DNA" visualization.
    - **Telemetry HUD:** Added detailed asset breakdown (Images, Audio, Video).
- **Audio:** Enabled "Voice of God" (macOS native `say`) to announce recognized identities during scanning.

## [7.5.2] - 2025-12-27
### 🚀 MPS Acceleration & Core Stabilization
- **AI Engine:** Successfully integrated **MPS (Metal Performance Shaders)** for macOS.