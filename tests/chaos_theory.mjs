import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:8000/api';
const LOG_COLOR = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m"
};

// 🎭 Simulation of INFP User's Chaos Inventory
const CHAOS_INVENTORY = [
  { path: 'Desktop/Stuff/cat_meme.webp', type: 'image', vibe: 'funny' },
  { path: 'Downloads/IMG_9999.HEIC', type: 'image', vibe: 'moment' },
  { path: 'Documents/thoughts/poem_about_rain.txt', type: 'text', vibe: 'melancholy' },
  { path: 'Voice Memos/humming_idea.m4a', type: 'audio', vibe: 'creative' },
  { path: 'DCIM/100APPLE/MOV_0012.mp4', type: 'video', vibe: 'memory' },
  { path: 'Junk/Screen Shot 2023-12-25 at 10.00.00.png', type: 'image', vibe: 'utility', shouldHide: true }
];

async function runChaosTest() {
  console.log(`\n${LOG_COLOR.magenta}🌪️  STARTING CHAOS THEORY TEST SUITE${LOG_COLOR.reset}\n`);
  
  // 1. Extension Agnosticism Test
  // System should accept .webp, .heic, .m4a, .txt not just .jpg/.mp3
  console.log(`${LOG_COLOR.cyan}[System]${LOG_COLOR.reset} Checking Extension Agnosticism...`);
  
  // (In a real test, we would mock these files in the DreamBox, but here we query the logic)
  const stats = await fetch(`${API_BASE}/stats`).then(r => r.json());
  
  // We expect the 'distribution' to NOT be just 'image' and 'audio' eventually
  console.log("  Current Distribution:", stats.distribution);
  
  const supportedTypes = Object.keys(stats.distribution);
  const missingTypes = ['text', 'video'].filter(t => !supportedTypes.includes(t));
  
  if (missingTypes.length > 0) {
    console.log(`${LOG_COLOR.yellow}  ⚠️  Warning: System is blind to: ${missingTypes.join(', ')}${LOG_COLOR.reset}`);
    console.log(`  -> INFP User will feel ignored on these aspects.`);
  } else {
    console.log(`${LOG_COLOR.green}  ✅ System sees all matter.${LOG_COLOR.reset}`);
  }

  // 2. The Sieve Test (Utility vs Memory)
  console.log(`\n${LOG_COLOR.cyan}[Filter]${LOG_COLOR.reset} Checking The Sieve (Screenshot Detection)...`);
  const searchRes = await fetch(`${API_BASE}/search?q=everything`).then(r => r.json());
  const screenshots = searchRes.filter(i => i.path.toLowerCase().includes('screen'));
  
  if (screenshots.length === 0) {
    console.log(`${LOG_COLOR.green}  ✅ Sieve is working. No trash in the main timeline.${LOG_COLOR.reset}`);
  } else {
    console.log(`${LOG_COLOR.red}  ❌ Sieve Leak! Found ${screenshots.length} screenshots in timeline.${LOG_COLOR.reset}`);
  }

  // 3. The Vibe Test (Cross-Modality)
  console.log(`\n${LOG_COLOR.cyan}[Vibe]${LOG_COLOR.reset} Checking Universal Vibe Search...`);
  const sadRes = await fetch(`${API_BASE}/search?q=sad`).then(r => r.json());
  const hasAudio = sadRes.some(i => i.type === 'audio');
  const hasImage = sadRes.some(i => i.type === 'image');
  
  if (hasAudio && hasImage) {
    console.log(`${LOG_COLOR.green}  ✅ Emotional Resonance detected across media types.${LOG_COLOR.reset}`);
  } else {
    console.log(`${LOG_COLOR.yellow}  ⚠️  Fragmented Soul. Emotions only found in one medium.${LOG_COLOR.reset}`);
  }

  console.log(`\n${LOG_COLOR.magenta}🏁 CHAOS AUDIT COMPLETE${LOG_COLOR.reset}`);
}

runChaosTest();
