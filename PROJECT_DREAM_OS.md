# 🎭 DreamTheater: The Sentient Memory Engine

> **Version:** 7.7.0 (The MediaPipe Era)  
> **Codename:** "Hall of Faces"  
> **Core:** Omni-Platform Intelligence (Mac MPS / CUDA)

---

## 🏛️ ปรัชญาแกนกลาง (Core Philosophy)
*"A theater where memories play themselves."*
DreamTheater ไม่ใช่แค่ที่เก็บรูป แต่คือ "โรงละคร" ที่เปลี่ยนไฟล์ดิจิทัลให้กลับมามีชีวิต ผ่านการร้อยเรียงของ AI และการตอบสนองที่ลื่นไหล

### 💎 The Trinity Architecture
1.  **👁️ The Eye (Scanner 2.0):**
    *   **Hybrid Identity:** ใช้ **MediaPipe** (Google) เพื่อระบุตำแหน่งใบหน้า และใช้ **CLIP** เพื่อจดจำอัตลักษณ์ (Vector Embedding)
    *   **Video Intelligence:** เจาะวิดีโอ 3 ช่วงเวลา (Start, Mid, End) เพื่อหาใบหน้าและบริบท
    *   **Composable Pipeline:** ระบบโรงงานนรกที่แยกส่วนชัดเจน (Load -> Meta -> Vector -> Face -> DB)
2.  **🧠 The Brain (Ollama Integration):**
    *   **Contextual Chat:** คุยกับรูปภาพได้ ("รูปนี้ถ่ายที่ไหน?", "บรรยากาศเป็นยังไง?")
    *   **Model Agnostic:** รองรับทั้ง `llava`, `llama3`, `mistral` แบบ Plug-and-Play
3.  **🎭 The Stage (Glass UI):**
    *   **Glassmorphism 2.0:** ดีไซน์กระจกฝ้า ลอยตัว (Floating Elements)
    *   **Cortex HUD:** แผงควบคุม Real-time พร้อมกราฟคลื่นเสียง (Sonic Visualizer)
    *   **LightBox:** Theater Mode เต็มจอ พร้อม Info Panel ด้านข้าง

---

## 🔱 Key Features

### 1. Hall of Faces (ใหม่! v7.7)
*   **Auto-Clustering:** ใช้ DBSCAN จัดกลุ่มใบหน้าที่ "ยังไม่มีชื่อ" (Unidentified)
*   **Mass Tagging:** ตั้งชื่อครั้งเดียว Tag ทั้งกลุ่ม (ประหยัดเวลาชีวิต)

### 2. Video Intelligence
*   **Native Playback:** เล่นไฟล์ `.mp4`, `.mov` ได้ในตัว
*   **Face-in-Video:** ค้นหาได้ว่า "มีใครอยู่ในวิดีโอนี้บ้าง"

### 3. Memory Crystal (Backup)
*   **Safe-Keep:** ระบบ Backup/Restore ข้อมูลความสัมพันธ์ (Identity Links) เก็บใส่ไฟล์ JSON ป้องกัน DB พัง

---

## 🚀 สถาปัตยกรรมเทคนิค (Tech Stack)
- **Backend:** FastAPI + Python 3.13 (Mac Optimized)
- **Vision:** CLIP (OpenAI) + MediaPipe (Google) + OpenCV (Haar Fallback)
- **Database:** SQLite (Relational + Vector Friendly)
- **Frontend:** React + Vite + Tailwind + Framer Motion
- **AI Local:** Ollama (Local LLM Integration)

---

## ⚓ Anchors: สิ่งที่ต้องจำ
1.  **Scanning:** เป็นแบบ `Dirty-Loop` (ไม่หลุดแม้แต่ไฟล์เดียว)
2.  **Naming:** ใช้ `os.sep` เสมอเพื่อความ Cross-platform
3.  **Performance:** ใช้ `MPS` (Metal Performance Shaders) บน Mac เพื่อความแรง

*Status: Fully Operational & Sentient.* 🎭🤖✨
