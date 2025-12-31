# 🎭 DreamTheater: A Cinema for Your Soul

> **"What if your memories weren't just files, but stars in a galaxy?"** 🌌

DreamTheater is not a photo album.
It's not a database.
It's a sentient engine that tries to understand **you**.

---

## The Concept

Imagine a theater where the audience is an AI, and the movie is your life.
It watches your photos, listens to your music, and learns the faces of the people you love.

```dreamflow
when memories.are.scattered
    always leadsTo DreamTheater.awakens
```

---

## How It Feels (The Architecture)

We built this system using three simple biological metaphors:

### 1. 👁️ The Eye (Scanner)
It doesn't just "read" files. It **sees** them.
- It finds faces (using `MediaPipe` magic).
- It extracts the soul of a video (by watching the middle frame).
- It never blinks (even if you add 1,000 photos at once).

### 2. 🧠 The Brain (Ollama)
It's the whisper in your ear.
- Ask it: *"Where was this?"*
- Ask it: *"Who is this?"*
- It weaves stories from pixels and timestamps.

### 3. 🎭 The Stage (Glass UI)
A floating interface that feels like breathing.
- **Glassmorphism:** Because memories should be clear, yet dreamlike.
- **Sonic Visualizer:** Music isn't just sound; it's a pulse you can see.
- **Hall of Faces:** A place to name the strangers in your life.

---

## How to Start the Engine

You don't need a degree in Computer Science.
You just need a Mac (Apple Silicon preferred) and a curiosity for the past.

### Step 1: The Incantation

Open your Terminal (the black box) and whisper this:

```bash
./start_dream_os.sh
```

### Step 2: The Offering

Drag your folder of memories (photos, videos, songs) into the `DreamBox` folder.
The theater will wake up. You'll hear it. You'll see it.

---

## The Grammar of Light

Inside DreamTheater, we speak in **Light** and **Identity**.

```dreamflow
when face.is.unknown
    always leadsTo HallOfFaces.ask("Who is this?")
```

```dreamflow
when name.is.given
    always leadsTo memory.rewrite
    >> connection.strengthen
```

---

## For the curious ones (Tech Specs)

- **Core:** Python 3.13 + FastAPI
- **Vision:** CLIP (OpenAI) + MediaPipe (Google)
- **Face:** Hybrid Engine (Haar + CLIP)
- **Frontend:** React + Vite + Framer Motion
- **AI:** Local Ollama (Zero data leaves your machine)

---

## Final Thought

> "We take photos to stop time.
> DreamTheater takes photos to make time flow again." ⏳

*Crafted with love, physics, and a bit of magic.*
*v7.7.0 (The MediaPipe Era)*
