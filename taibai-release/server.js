const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3456;

// ---------- middleware ----------
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- paths ----------
const DATA_DIR = path.join(__dirname, 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ENGINE_EXE = 'taibai_engine.exe';

// ---------- init ----------
// auto-create data/
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ensure history.json / settings.json exist
[DATA_DIR, HISTORY_FILE, SETTINGS_FILE].forEach((p, i) => {
  if (i === 0) return; // DATA_DIR already handled
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, JSON.stringify(i === 1 ? [] : {}, null, 2), 'utf-8');
  }
});

// ---------- helpers ----------
function loadJSON(file) {
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return file === HISTORY_FILE ? [] : {};
  }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

/** Spawn taibai_engine.exe, write JSON on stdin, collect stdout -> parsed JSON */
function runEngine(payload) {
  return new Promise((resolve, reject) => {
    const enginePath = path.join(__dirname, ENGINE_EXE);
    const child = spawn(enginePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Engine exited code=${code} stderr=${stderr.slice(0, 500)}`));
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`JSON parse error: ${e.message}. Raw: ${stdout.slice(0, 300)}`));
      }
    });

    child.on('error', (err) => reject(new Error(`Failed to spawn engine: ${err.message}`)));

    // send payload as single line JSON
    setTimeout(() => {
      child.stdin.write(JSON.stringify(payload) + '\n');
      child.stdin.end();
    }, 50);
  });
}

/** Load LM Studio system prompt from file or use default */
function getSystemPrompt() {
  const promptPath = 'E:\\obsidian\\taibai-命理全栈\\提示词注入\\对话注入.md';
  try {
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf-8');
    }
  } catch { /* fall through */ }
  return '你是太白，一位精通中国传统命理的专家助手。请用中文回答用户关于命理、占卜、玄学的问题。';
}

// ---------- readable-timestamp helper ----------
function nowISO() {
  return new Date().toISOString();
}

// ---------- routes ----------

// GET /api/ping
app.get('/api/ping', (req, res) => {
  res.json({ success: true, server: 'taibai', time: nowISO() });
});

// POST /api/bazi
app.post('/api/bazi', async (req, res) => {
  try {
    const { year, month, day, hour, gender } = req.body;
    const result = await runEngine({ type: 'bazi', year, month, day, hour, gender });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/liuyao
app.post('/api/liuyao', async (req, res) => {
  try {
    const result = await runEngine({ type: 'liuyao', seed: Date.now() });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ziwei
app.post('/api/ziwei', async (req, res) => {
  try {
    const { year, month, day, hour, gender } = req.body;
    const result = await runEngine({ type: 'ziwei', year, month, day, hour, gender });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/qimen
app.post('/api/qimen', async (req, res) => {
  try {
    const { year, month, day, hour } = req.body;
    const result = await runEngine({ type: 'qimen', year, month, day, hour });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/route — keyword-based classification
const ROUTE_KEYWORDS = {
  bazi:    ['八字', 'bazi', 'Bazi', '排盘'],
  liuyao:  ['六爻', 'liuyao', 'Liuyao'],
  ziwei:   ['紫微', 'ziwei', 'Ziwei', '紫微斗数'],
  qimen:   ['奇门', 'qimen', 'Qimen', '奇门遁甲'],
  lingti:  ['灵体', 'lingti', 'Lingti'],
  settings:['设置', '设定', 'settings'],
};

app.post('/api/route', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'text field required' });
    }
    for (const [route, keywords] of Object.entries(ROUTE_KEYWORDS)) {
      if (keywords.some((kw) => text.includes(kw))) {
        return res.json({ success: true, route });
      }
    }
    res.json({ success: true, route: 'bazi' }); // default
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dialog — forward to LM Studio
app.post('/api/dialog', async (req, res) => {
  try {
    const systemPrompt = getSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(req.body.messages || []),
    ];

    const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.body.model || 'local-model',
        messages,
        temperature: req.body.temperature ?? 0.7,
        max_tokens: req.body.max_tokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.status(response.status).json({ success: false, error: `LM Studio error: ${errText}` });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/embed — forward to LM Studio embeddings
app.post('/api/embed', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:1234/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.body.model || 'local-model',
        input: req.body.input || '',
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return res.status(response.status).json({ success: false, error: `LM Studio error: ${errText}` });
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- history routes ----------

// GET /api/history
app.get('/api/history', (req, res) => {
  try {
    const history = loadJSON(HISTORY_FILE);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/history
app.post('/api/history', (req, res) => {
  try {
    const history = loadJSON(HISTORY_FILE);
    const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...req.body, createdAt: nowISO() };
    history.push(entry);
    saveJSON(HISTORY_FILE, history);
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/history/:id
app.delete('/api/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const history = loadJSON(HISTORY_FILE);
    const idx = history.findIndex((e) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'History entry not found' });
    }
    const removed = history.splice(idx, 1)[0];
    saveJSON(HISTORY_FILE, history);
    res.json({ success: true, data: removed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- settings routes ----------

// GET /api/settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = loadJSON(SETTINGS_FILE);
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings
app.post('/api/settings', (req, res) => {
  try {
    const existing = loadJSON(SETTINGS_FILE);
    const merged = { ...existing, ...req.body };
    saveJSON(SETTINGS_FILE, merged);
    res.json({ success: true, data: merged });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- static fallback (already handled by express.static) ----------

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`[taibai-server] running on http://127.0.0.1:${PORT}`);
});
