import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const API_BASE = 'http://localhost:8000/api';
const LOG_COLOR = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[37m"
};

async function runTest(name, persona, fn) {
  const personaColors = { "Jobs": LOG_COLOR.magenta, "Zuck": LOG_COLOR.cyan, "Satoshi": LOG_COLOR.yellow };
  const color = personaColors[persona] || LOG_COLOR.white;
  
  process.stdout.write(`${color}[${persona}]${LOG_COLOR.reset} ${name.padEnd(45)} `);
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(1);
    console.log(`${LOG_COLOR.green}PASS${LOG_COLOR.reset} (${duration}ms)`);
    return true;
  } catch (e) {
    console.log(`${LOG_COLOR.red}FAIL${LOG_COLOR.reset}\n  ${LOG_COLOR.red}└─> Error: ${e.message}${LOG_COLOR.reset}`);
    return false;
  }
}

async function fetchJSON(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

(async () => {
  console.log(`\n${LOG_COLOR.white}🏛️  DREAM OS: THE PYRAMID OF VERIFICATION (v5.1.1)${LOG_COLOR.reset}`);
  console.log(`${LOG_COLOR.white}----------------------------------------------------${LOG_COLOR.reset}\n`);
  
  let results = { passed: 0, failed: 0 };
  const test = async (n, p, f) => { if (await runTest(n, p, f)) results.passed++; else results.failed++; };

  // --- ₿ SATOSHI NAKAMOTO (Integrity & Structure) ---
  await test("Blockchain Ledger (Scan Status)", "Satoshi", async () => {
    const res = await fetchJSON('/scan/progress');
    if (!res.status) throw new Error("Status is undefined");
  });

  await test("Genesis Stats Consistency", "Satoshi", async () => {
    const stats = await fetchJSON('/stats');
    if (stats.total < 0) throw new Error("Negative mass detected");
    if (!stats.wisdom) throw new Error("Wisdom module offline");
  });

  await test("Zero-Knowledge Directory Integrity", "Satoshi", async () => {
    const res = await fetchJSON('/search?q=everything');
    for (let item of res.slice(0, 10)) {
      if (!item.path || item.path.includes('\\')) throw new Error("Illegal path format found");
    }
  });

  // --- 📘 MARK ZUCKERBERG (Connectivity & Social) ---
  await test("Identity Node Mapping", "Zuck", async () => {
    const ids = await fetchJSON('/identities');
    if (!Array.isArray(ids)) throw new Error("Identity graph is not a collection");
  });

  await test("Semantic Discovery (Bio-Clusters)", "Zuck", async () => {
    const clusters = await fetchJSON('/discovery');
    if (clusters.length > 0 && !clusters[0].label) throw new Error("Unnamed community found");
  });

  await test("Cross-Modality Sync (Audio/Visual)", "Zuck", async () => {
    const res = await fetchJSON('/search?q=everything');
    const types = new Set(res.map(i => i.type));
    if (!types.has('image')) throw new Error("Visual layer disconnected");
  });

  // --- 🍏 STEVE JOBS (UX & Fluidity) ---
  await test("Interface Snappiness (Search < 300ms)", "Jobs", async () => {
    const start = performance.now();
    await fetchJSON('/search?q=test');
    if (performance.now() - start > 300) throw new Error("Latency too high for human thought");
  });

  await test("Typography Safety (Label Sanitization)", "Jobs", async () => {
    const clusters = await fetchJSON('/discovery');
    for (let c of clusters) {
      if (c.label === null || c.label === "null") throw new Error("Visual glitch: null label");
    }
  });

  await test("Thumbnail Aesthetics (Path Integrity)", "Jobs", async () => {
    const res = await fetchJSON('/search?q=everything');
    const imgs = res.filter(i => i.type === 'image');
    if (imgs.length > 0 && !imgs[0].thumb.startsWith('/thumbs/')) throw new Error("Ugly thumbnail paths");
  });

  // --- 🧪 512-DIMENSIONAL STRESS TEST ---
  console.log(`\n${LOG_COLOR.white}🧪 STRESS TESTING ENGINE...${LOG_COLOR.reset}`);
  
  for (let i = 1; i <= 10; i++) {
    await test(`Query Stress Case #${i}`, "Satoshi", async () => {
      const queries = ["มังคุด", "coffee", "sunset", "Rainy Day", "ฉัน", "code", "night", "food", "cat", "nature"];
      const res = await fetchJSON(`/search?q=${encodeURIComponent(queries[i-1])}`);
      if (!Array.isArray(res)) throw new Error("Search crashed on complex query");
    });
  }

  // --- 🎯 FINAL REPORT ---
  const total = results.passed + results.failed;
  console.log(`\n${LOG_COLOR.white}----------------------------------------------------${LOG_COLOR.reset}`);
  console.log(`${LOG_COLOR.white}🏁 THE TRINITY REPORT:${LOG_COLOR.reset}`);
  console.log(`${LOG_COLOR.green}  Passed: ${results.passed}${LOG_COLOR.reset}`);
  console.log(`${results.failed > 0 ? LOG_COLOR.red : LOG_COLOR.green}  Failed: ${results.failed}${LOG_COLOR.reset}`);
  
  if (results.failed === 0) {
    console.log(`\n${LOG_COLOR.magenta}✨ PYRAMID IS ALIGNED. THE UNIVERSE IS STABLE. ✨${LOG_COLOR.reset}\n`);
  } else {
    console.log(`\n${LOG_COLOR.red}⚠️  STRUCTURAL ANOMALIES DETECTED. REPAIR NEEDED. ⚠️${LOG_COLOR.reset}\n`);
  }
})();