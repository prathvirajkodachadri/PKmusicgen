// PKmusicgen - Free Online AI Music Generation Frontend App
const API_BASE = '';

let currentResults = [];
let selectedSampleId = null;
let models = [];
let hardwareInfo = null;
let currentPlayingAudio = null;
let animationFrameId = null;

// Page Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    const titles = {
      'generate': 'AI Music Studio',
      'song-ai': 'Song & Lyrics AI Assistant',
      'fx-studio': 'Audio FX Studio',
      'samples': 'Samples & Stems Generator',
      'film': 'Film Scoring & BGM Studio',
      'horror': 'Horror Sound Design Studio',
      'library': 'Studio Library & History',
      'models': 'AI Model Registry',
      'settings': 'Studio Settings & Hardware'
    };
    document.getElementById('current-page-title').textContent = titles[page] || 'AI Studio';

    if (page === 'library') loadLibrary();
    if (page === 'models') loadModels();
    if (page === 'settings') loadSettings();
    if (page === 'fx-studio') populateFXSampleSelect();
  });
});

// Initialize on Load
async function init() {
  await Promise.all([
    loadHardware(),
    loadModelsList(),
    loadBuilderOptions(),
    loadPresets(),
    loadHorrorPresets(),
    loadSampleCategories()
  ]);
  setupEventListeners();
  loadVariations();
  checkOfflineMode();
}

// Hardware Status
async function loadHardware() {
  try {
    const res = await fetch(`${API_BASE}/api/hardware/`);
    const data = await res.json();
    hardwareInfo = data;
    const mini = document.getElementById('hardware-mini');
    mini.innerHTML = `
      <div class="hw-line"><span class="hw-dot"></span> Engine: ${data.gpu_name ? 'GPU (' + data.gpu_name + ')' : 'DSP CPU (Instant Free)'}</div>
      <div class="hw-line">RAM: ${data.ram_total_gb} GB | CUDA: ${data.cuda_available ? 'Active' : 'CPU Mode'}</div>
    `;
  } catch (e) {
    document.getElementById('hardware-mini').innerHTML = `<div class="hw-line">Engine ready (DSP/Free)</div>`;
  }
}

// Load Models
async function loadModelsList() {
  try {
    const res = await fetch(`${API_BASE}/api/models/`);
    const data = await res.json();
    models = data.models || [];
    const select = document.getElementById('model-select');
    select.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} ${m.installed ? '⚡ Ready' : '⬇️ Download'}`;
      if (m.id === 'procedural-dsp') opt.selected = true;
      select.appendChild(opt);
    });
    updateModelInfo();
  } catch (e) {
    console.error('Failed to load models', e);
  }
}

function updateModelInfo() {
  const modelId = document.getElementById('model-select').value;
  const model = models.find(m => m.id === modelId);
  const infoDiv = document.getElementById('model-info');
  if (!model) {
    infoDiv.innerHTML = '';
    return;
  }
  const badgeClass = model.commercial_use === 'yes' ? 'badge-commercial' : model.commercial_use === 'no' ? 'badge-noncommercial' : 'badge-limited';
  const badgeText = model.commercial_use === 'yes' ? 'Free Commercial' : model.commercial_use === 'yes_under_1M' ? 'Free <$1M' : 'Non-commercial';
  infoDiv.innerHTML = `
    <span class="model-badge ${badgeClass}">${badgeText}</span>
    <span style="margin-left:6px; color:var(--text-dim); font-size:0.75rem;">
      VRAM: ${model.vram_gb}GB • Max: ${model.max_duration}s • ${model.license}
    </span>
  `;
}

// Prompt Builder Options
async function loadBuilderOptions() {
  try {
    const res = await fetch(`${API_BASE}/api/presets/builder/options`);
    const data = await res.json();
    const genreSel = document.getElementById('genre-select');
    const moodSel = document.getElementById('mood-select');
    const textureSel = document.getElementById('texture-select');
    const instrSel = document.getElementById('instrument-select');
    
    data.genres.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g.charAt(0).toUpperCase() + g.slice(1);
      genreSel.appendChild(opt);
    });
    data.moods.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
      moodSel.appendChild(opt);
    });
    data.textures.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      textureSel.appendChild(opt);
    });
    data.instruments.forEach(i => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i.charAt(0).toUpperCase() + i.slice(1);
      instrSel.appendChild(opt);
    });
  } catch (e) {
    console.error('Builder options failed', e);
  }
}

// Presets
async function loadPresets() {
  try {
    const res = await fetch(`${API_BASE}/api/presets/`);
    const data = await res.json();
    const presets = data.presets || {};
    renderPresetCategory('cinematic', presets['cinematic'] || []);
    
    document.querySelectorAll('.preset-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.cat;
        renderPresetCategory(cat, presets[cat] || []);
      });
    });
  } catch (e) {
    console.error('Presets failed', e);
  }
}

function renderPresetCategory(cat, items) {
  const container = document.getElementById('preset-list');
  container.innerHTML = '';
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No presets found for ${cat}</p></div>`;
    return;
  }
  const list = Array.isArray(items) ? items : [items];
  list.forEach(item => {
    if (typeof item === 'string') return;
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.innerHTML = `
      <div class="preset-name">✨ ${item.name || item.id}</div>
      <div class="preset-prompt">${(item.prompt || '').substring(0, 110)}...</div>
    `;
    div.addEventListener('click', () => {
      document.getElementById('prompt-input').value = item.prompt || '';
      updatePromptCount();
    });
    container.appendChild(div);
  });
}

// Horror Presets
async function loadHorrorPresets() {
  try {
    const res = await fetch(`${API_BASE}/api/presets/horror/list`);
    const data = await res.json();
    const presets = data.presets || [];
    const select = document.getElementById('horror-preset');
    const grid = document.getElementById('horror-preset-grid');
    select.innerHTML = '<option value="">-- Custom --</option>';
    grid.innerHTML = '';
    presets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
      
      const card = document.createElement('div');
      card.className = 'preset-grid-item';
      card.innerHTML = `<strong>👻 ${p.name}</strong><br><small style="color:var(--text-dim)">${p.description}</small>`;
      card.addEventListener('click', () => {
        document.getElementById('horror-preset').value = p.id;
        document.getElementById('horror-mood').value = p.mood || 'terrifying';
        document.getElementById('horror-texture').value = p.texture || 'metallic';
        document.getElementById('horror-movement').value = p.movement || 'slowly evolving';
        document.getElementById('horror-freq').value = p.frequency || 'deep';
        buildHorrorPrompt();
      });
      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Horror presets failed', e);
  }
}

// Sample Categories
async function loadSampleCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/presets/sample_generator`);
    let data;
    if (res.ok) {
      const json = await res.json();
      data = json.presets;
    } else {
      data = {
        drums: ["808 kick", "punchy kick", "snare trap", "acoustic snare", "clap", "hi-hat closed", "hi-hat open", "tom drum", "cymbal crash", "drum loop"],
        bass: ["sub bass 808", "reese bass", "acid 303 bass", "cinematic braam", "synth bass"],
        instruments: ["grand piano", "electric rhodes", "orchestral strings", "synth pluck", "lush ambient pad", "synthwave lead", "acoustic guitar"],
        cinematic: ["massive trailer impact", "tension riser", "sub drop downer", "transition whoosh", "dark horror drone", "suspense pulse"],
        indian_folk: ["tabla groove", "tamate folk drum", "chende drum", "dollu bass drum", "mridangam rhythm", "dholak beat"]
      };
    }
    
    const renderCat = (catId, items) => {
      const container = document.getElementById(`cat-${catId}`);
      if (!container) return;
      container.innerHTML = '';
      items.forEach(item => {
        const span = document.createElement('span');
        span.className = 'cat-item';
        span.textContent = item;
        span.addEventListener('click', () => {
          document.getElementById('prompt-input').value = `${item}, professional audio sample, high fidelity, 4 seconds`;
          updatePromptCount();
          document.querySelector('[data-page="generate"]').click();
        });
        container.appendChild(span);
      });
    };
    
    if (data.drums) renderCat('drums', data.drums);
    if (data.bass) renderCat('bass', data.bass);
    if (data.instruments) renderCat('instruments', data.instruments);
    if (data.cinematic) renderCat('cinematic', data.cinematic);
    if (data.indian_folk) renderCat('indian', data.indian_folk);
    
  } catch (e) {
    console.error('Sample categories failed', e);
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Prompt typing & clear
  document.getElementById('prompt-input').addEventListener('input', updatePromptCount);
  document.getElementById('clear-prompt-btn').addEventListener('click', () => {
    document.getElementById('prompt-input').value = '';
    updatePromptCount();
  });

  // Prompt Builder Toggle
  document.getElementById('builder-toggle-btn').addEventListener('click', () => {
    const panel = document.getElementById('builder-panel');
    panel.classList.toggle('collapsed');
  });

  // Model change
  document.getElementById('model-select').addEventListener('change', updateModelInfo);

  // Sliders
  document.getElementById('duration-slider').addEventListener('input', e => {
    document.getElementById('duration-value').textContent = e.target.value + 's';
  });
  document.getElementById('guidance-slider').addEventListener('input', e => {
    document.getElementById('guidance-value').textContent = e.target.value;
  });

  // Random Seed
  document.getElementById('random-seed-btn').addEventListener('click', () => {
    document.getElementById('seed-input').value = Math.floor(Math.random() * 2**31);
  });

  // Surprise Me Button
  document.getElementById('surprise-me-btn').addEventListener('click', getSurprisePrompt);

  // Quick Style Chips
  document.querySelectorAll('.style-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const style = chip.dataset.style;
      applyQuickStyle(style);
    });
  });

  // Build Structured Prompt
  document.getElementById('build-prompt-btn').addEventListener('click', async () => {
    const genre = document.getElementById('genre-select').value;
    const mood = document.getElementById('mood-select').value;
    const texture = document.getElementById('texture-select').value;
    const instrSelect = document.getElementById('instrument-select');
    const instrumentation = Array.from(instrSelect.selectedOptions).map(o => o.value);
    const duration = document.getElementById('duration-slider').value;
    
    try {
      const res = await fetch(`${API_BASE}/api/presets/builder/build`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({genre, mood, texture, instrumentation, duration: parseFloat(duration), custom_prompt: document.getElementById('prompt-input').value})
      });
      const data = await res.json();
      document.getElementById('prompt-input').value = data.prompt;
      updatePromptCount();
    } catch (e) {
      console.error('Build prompt failed', e);
    }
  });

  // Generate Audio
  document.getElementById('generate-btn').addEventListener('click', generateAudio);
  document.getElementById('batch-generate-btn').addEventListener('click', generateBatch);

  // Song AI Assistant
  document.getElementById('generate-song-plan-btn').addEventListener('click', generateSongPlan);

  // Audio FX Studio
  document.getElementById('fx-reverb').addEventListener('input', e => {
    document.getElementById('fx-reverb-val').textContent = `${Math.round(e.target.value * 100)}%`;
  });
  document.getElementById('fx-bass').addEventListener('input', e => {
    document.getElementById('fx-bass-val').textContent = `+${e.target.value} dB`;
  });
  document.getElementById('fx-fadein').addEventListener('input', e => {
    document.getElementById('fx-fadein-val').textContent = `${e.target.value}s`;
  });
  document.getElementById('fx-fadeout').addEventListener('input', e => {
    document.getElementById('fx-fadeout-val').textContent = `${e.target.value}s`;
  });
  document.getElementById('render-fx-btn').addEventListener('click', renderAudioFX);

  // Film BGM
  document.getElementById('film-build-btn').addEventListener('click', buildFilmPrompt);
  document.getElementById('film-generate-btn').addEventListener('click', generateFilmBGM);

  // Horror
  document.getElementById('horror-build-btn').addEventListener('click', buildHorrorPrompt);
  document.getElementById('horror-generate-btn').addEventListener('click', generateHorror);

  // Library
  document.getElementById('library-refresh').addEventListener('click', loadLibrary);
  document.getElementById('library-search').addEventListener('input', debounce(loadLibrary, 400));
  document.getElementById('library-fav').addEventListener('change', loadLibrary);

  // Offline Mode
  document.getElementById('offline-mode-toggle').addEventListener('change', toggleOffline);
  document.getElementById('settings-offline').addEventListener('change', toggleOffline);
}

function updatePromptCount() {
  const count = document.getElementById('prompt-input').value.length;
  document.getElementById('prompt-count').textContent = count;
}

// Quick Styles Implementation
function applyQuickStyle(style) {
  const map = {
    'lofi': 'Lofi hip hop chill study beat, warm rhodes piano chords, smooth sub bass, laidback boom bap drum groove, vinyl crackle, 80 bpm',
    'synthwave': '80s retro synthwave, driving analog bassline, punchy gated drums, bright neon lead arpeggios, nostalgic cyberpunk highway, 120 bpm',
    'cinematic': 'Massive cinematic orchestral soundtrack, deep brass braams, dramatic strings ostinato, heavy percussion hits, epic trailer build',
    'trap': '808 trap beat, deep booming sub bass, crisp snapping snare, fast hi-hat rolls, dark atmospheric bells, 140 bpm',
    'cyberpunk': 'High energy industrial cyberpunk electronic track, heavy distorted synthesizer bass, driving 4-on-the-floor kick, futuristic glitch textures, 130 bpm',
    'folk': 'Energetic South Indian folk percussion ensemble, powerful Tamate frame drums, crisp Chende strokes, festive rhythm, 128 bpm',
    'piano': 'Lush emotional solo piano melody with gentle cello backing, melancholic and inspiring chord progression, dynamic cinematic warmth',
    'ambient': 'Deep soothing ambient meditation soundscape, Tibetan singing bowl overtones, warm evolving pads, zero beat, deep relaxation',
    'chiptune': 'Retro 8-bit chiptune arcade game music, cheerful square wave melodies, bouncy triangle bassline, nostalgic retro gaming'
  };
  if (map[style]) {
    document.getElementById('prompt-input').value = map[style];
    updatePromptCount();
  }
}

// Surprise Me / Random Prompt
async function getSurprisePrompt() {
  const btn = document.getElementById('surprise-me-btn');
  btn.textContent = '🎲 Picking...';
  try {
    const res = await fetch(`${API_BASE}/api/generate/random_prompt`);
    const data = await res.json();
    document.getElementById('prompt-input').value = data.prompt;
    updatePromptCount();
    document.querySelector('[data-page="generate"]').click();
  } catch (e) {
    console.error('Failed random prompt', e);
  } finally {
    btn.textContent = '🎲 Surprise Me';
  }
}

// Generate Audio Core
async function generateAudio() {
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) {
    alert('Please enter a music prompt or select a quick style above!');
    return;
  }
  
  const payload = {
    prompt: prompt,
    negative_prompt: document.getElementById('negative-prompt').value || null,
    duration: parseFloat(document.getElementById('duration-slider').value),
    seed: parseInt(document.getElementById('seed-input').value),
    num_variations: parseInt(document.getElementById('variations-input').value),
    model_id: document.getElementById('model-select').value,
    guidance_scale: parseFloat(document.getElementById('guidance-slider').value),
    sample_rate: parseInt(document.getElementById('sr-select').value),
    bit_depth: 16,
    normalize: document.getElementById('normalize-check').checked,
    fade_in: parseFloat(document.getElementById('fadein-input').value),
    fade_out: parseFloat(document.getElementById('fadeout-input').value),
    genre: document.getElementById('genre-select').value || null,
    mood: document.getElementById('mood-select').value || null,
    texture: document.getElementById('texture-select').value || null,
  };
  
  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> Synthesizing AI Music...';
  
  const statusBox = document.getElementById('generation-status');
  statusBox.className = 'status-box generating visible';
  statusBox.textContent = '✨ Processing neural & DSP synthesis... Generating your audio track now.';
  
  try {
    const res = await fetch(`${API_BASE}/api/generate/sync`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Audio generation failed');
    }
    
    const data = await res.json();
    statusBox.className = 'status-box completed visible';
    statusBox.textContent = `✅ Success! Generated ${data.results.length} audio track(s).`;
    
    renderResults(data.results);
    populateFXSampleSelect();
    
  } catch (e) {
    statusBox.className = 'status-box failed visible';
    statusBox.textContent = `❌ Error: ${e.message}`;
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">⚡</span> Generate Free AI Music';
  }
}

// Render Results with Interactive Waveform Canvas
function renderResults(results) {
  const container = document.getElementById('results-container');
  container.innerHTML = '';
  currentResults = results;
  
  document.getElementById('results-count-badge').textContent = `${results.length} Track${results.length === 1 ? '' : 's'}`;
  
  results.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    
    const canvasId = `waveform-canvas-${r.id || idx}`;
    
    div.innerHTML = `
      <div class="result-header">
        <div class="result-title">🎵 ${r.filename}</div>
        <div class="result-meta">${r.duration.toFixed(1)}s • ${r.sample_rate}Hz • Seed: ${r.seed}</div>
      </div>
      <div class="result-prompt">${r.prompt}</div>
      
      <canvas id="${canvasId}" class="waveform-canvas" width="600" height="60"></canvas>
      
      <div class="audio-controls-row">
        <audio id="audio-el-${r.id || idx}" controls class="audio-player-custom" src="${r.file_url}"></audio>
      </div>

      <div class="result-meta">
        Peak: ${r.analysis?.peak_db?.toFixed(1) || 0} dB | RMS: ${r.analysis?.rms_db?.toFixed(1) || 0} dB | Synth: ${r.generation_time?.toFixed(2)}s
      </div>

      <div class="result-actions">
        <button class="btn small primary" onclick="downloadFile('${r.file_url}', '${r.filename}')">⬇️ Download WAV</button>
        <button class="btn small glow-btn" onclick="openInFXStudio(${r.id})">🎚️ Send to FX Studio</button>
        <button class="btn small secondary" onclick="selectForVariation(${r.id})">🔀 1-Click Variations</button>
        <button class="btn small ghost-btn" onclick="toggleFavorite(${r.id})">⭐ Favorite</button>
        <button class="btn small ghost-btn" onclick="deleteSample(${r.id})">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(div);

    // Draw Waveform onto Canvas
    setTimeout(() => {
      drawWaveform(canvasId, r.analysis?.waveform || generateDummyWaveform());
      attachAudioWaveformSync(`audio-el-${r.id || idx}`, canvasId, r.analysis?.waveform || generateDummyWaveform());
    }, 50);
  });
}

function generateDummyWaveform() {
  return Array.from({length: 120}, () => Math.random() * 0.7 + 0.1);
}

function drawWaveform(canvasId, waveformData, progress = 0) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  ctx.clearRect(0, 0, w, h);
  
  const numBars = Math.min(waveformData.length, 120);
  const barWidth = w / numBars;
  const midY = h / 2;

  for (let i = 0; i < numBars; i++) {
    const val = Math.min(1.0, Math.max(0.08, waveformData[i] || 0.2));
    const barHeight = val * (h * 0.85);
    const x = i * barWidth;
    const isPlayed = (i / numBars) <= progress;

    if (isPlayed) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#ec4899');
      grad.addColorStop(1, '#6366f1');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
    }

    ctx.fillRect(x + 1, midY - barHeight / 2, barWidth - 2, barHeight);
  }
}

function attachAudioWaveformSync(audioId, canvasId, waveformData) {
  const audio = document.getElementById(audioId);
  const canvas = document.getElementById(canvasId);
  if (!audio || !canvas) return;

  audio.addEventListener('timeupdate', () => {
    const progress = audio.duration ? audio.currentTime / audio.duration : 0;
    drawWaveform(canvasId, waveformData, progress);
  });

  audio.addEventListener('ended', () => {
    drawWaveform(canvasId, waveformData, 0);
  });

  // Click on canvas to seek
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    if (audio.duration) {
      audio.currentTime = pct * audio.duration;
      audio.play();
    }
  });
}

// 1-Click Variations
async function loadVariations() {
  try {
    const res = await fetch(`${API_BASE}/api/generate/variations`);
    const data = await res.json();
    const grid = document.getElementById('variation-grid');
    grid.innerHTML = '';
    data.forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'variation-btn';
      btn.innerHTML = `${v.icon} ${v.label}`;
      btn.addEventListener('click', () => generateVariation(v.id));
      grid.appendChild(btn);
    });
  } catch (e) {
    console.error('Variations failed', e);
  }
}

async function generateVariation(type) {
  if (!selectedSampleId) {
    if (currentResults.length > 0) {
      selectedSampleId = currentResults[0].id;
    } else {
      alert('Please select or generate a track first!');
      return;
    }
  }
  
  const statusBox = document.getElementById('generation-status');
  statusBox.className = 'status-box generating visible';
  statusBox.textContent = `Applying variation '${type}'...`;

  try {
    const res = await fetch(`${API_BASE}/api/generate/variation/${selectedSampleId}/${type}`, {method: 'POST'});
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail);
    }
    const data = await res.json();
    statusBox.className = 'status-box completed visible';
    statusBox.textContent = `Variation '${type}' created!`;
    renderResults(data.results);
  } catch (e) {
    statusBox.className = 'status-box failed visible';
    statusBox.textContent = `Variation failed: ${e.message}`;
  }
}

function selectForVariation(id) {
  selectedSampleId = id;
  const statusBox = document.getElementById('generation-status');
  statusBox.className = 'status-box generating visible';
  statusBox.textContent = `Track #${id} selected. Now click any variation button (Darker, Brighter, Heavier Bass, etc.)`;
}

// Batch Generator
async function generateBatch() {
  const prompt = document.getElementById('batch-prompt').value.trim();
  const count = parseInt(document.getElementById('batch-count').value);
  if (!prompt) {
    alert('Please enter a sound description for batch generation');
    return;
  }
  document.getElementById('prompt-input').value = prompt;
  document.getElementById('variations-input').value = count;
  document.querySelector('[data-page="generate"]').click();
  generateAudio();
}

// Song & Lyrics AI Plan Generator
async function generateSongPlan() {
  const theme = document.getElementById('song-theme-input').value.trim();
  const genre = document.getElementById('song-genre-select').value;
  const mood = document.getElementById('song-mood-select').value;

  if (!theme) {
    alert('Please enter a song concept or theme!');
    return;
  }

  const output = document.getElementById('song-plan-output');
  output.innerHTML = '<div class="empty-state"><span class="loading"></span><h4>Generating complete song plan and lyrics...</h4></div>';

  try {
    const res = await fetch(`${API_BASE}/api/generate/song_assistant`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({prompt: theme, genre, mood})
    });
    const data = await res.json();

    output.innerHTML = `
      <div class="song-plan-card">
        <div class="song-plan-header">
          <div class="song-title-display">🎵 ${data.title}</div>
          <div class="song-meta-row">
            <span><strong>Key:</strong> ${data.key}</span>
            <span><strong>BPM:</strong> ${data.bpm}</span>
            <span><strong>Chords:</strong> ${data.chords}</span>
          </div>
          <div style="font-size:0.82rem; color:var(--text-dim); margin-top:4px;">${data.vibe}</div>
        </div>

        <button class="btn primary full-width" onclick="generateFromSongPlan('${escape(data.suggested_generation_prompt)}')">
          ⚡ Generate AI Audio for this Song
        </button>

        <div class="song-sections-list">
          ${data.structure.map(s => `
            <div class="song-section-box">
              <div class="song-section-title">[${s.section}] (${s.bars} bars)</div>
              <div style="font-size:0.75rem; color:var(--text-dim)">${s.description}</div>
              <div class="song-section-lyrics">${s.lyrics}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (e) {
    output.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Failed to generate song plan: ${e.message}</p></div>`;
  }
}

function generateFromSongPlan(escapedPrompt) {
  const prompt = unescape(escapedPrompt);
  document.getElementById('prompt-input').value = prompt;
  updatePromptCount();
  document.querySelector('[data-page="generate"]').click();
  generateAudio();
}

// Audio FX Studio
async function populateFXSampleSelect() {
  try {
    const res = await fetch(`${API_BASE}/api/library/?limit=50`);
    const data = await res.json();
    const select = document.getElementById('fx-sample-select');
    select.innerHTML = '<option value="">-- Choose track to apply FX --</option>';
    data.samples.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.filename} (${s.duration.toFixed(1)}s)`;
      select.appendChild(opt);
    });
    if (selectedSampleId) {
      select.value = selectedSampleId;
    }
  } catch (e) {
    console.error('Failed to populate FX samples', e);
  }
}

function openInFXStudio(id) {
  selectedSampleId = id;
  document.querySelector('[data-page="fx-studio"]').click();
  setTimeout(() => {
    document.getElementById('fx-sample-select').value = id;
  }, 200);
}

async function renderAudioFX() {
  const sampleId = document.getElementById('fx-sample-select').value;
  if (!sampleId) {
    alert('Please select a sample track from the dropdown first!');
    return;
  }

  const payload = {
    sample_id: parseInt(sampleId),
    reverb: parseFloat(document.getElementById('fx-reverb').value),
    bass_boost: parseFloat(document.getElementById('fx-bass').value),
    spatial_8d: document.getElementById('fx-8d').checked,
    normalize: document.getElementById('fx-normalize').checked,
    fade_in: parseFloat(document.getElementById('fx-fadein').value),
    fade_out: parseFloat(document.getElementById('fx-fadeout').value)
  };

  const btn = document.getElementById('render-fx-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> Rendering Studio Effects...';

  const container = document.getElementById('fx-result-container');
  container.innerHTML = '<div class="empty-state"><span class="loading"></span><h4>Rendering audio effects...</h4></div>';

  try {
    const res = await fetch(`${API_BASE}/api/generate/effects`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'FX rendering failed');
    }

    const data = await res.json();
    container.innerHTML = `
      <div class="result-item">
        <div class="result-header">
          <div class="result-title">✨ ${data.filename}</div>
          <div class="result-meta">${data.duration.toFixed(1)}s • Processed</div>
        </div>
        <audio controls src="${data.file_url}" class="audio-player-custom" style="margin:10px 0;"></audio>
        <div class="result-actions">
          <button class="btn small primary" onclick="downloadFile('${data.file_url}', '${data.filename}')">⬇️ Download WAV</button>
          <button class="btn small secondary" onclick="toggleFavorite(${data.id})">⭐ Save to Favorites</button>
        </div>
      </div>
    `;
    populateFXSampleSelect();

  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Effects error: ${e.message}</p></div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Render & Save FX Track';
  }
}

// Film BGM
async function buildFilmPrompt() {
  const payload = {
    scene_description: document.getElementById('film-scene').value,
    emotion: document.getElementById('film-emotion').value,
    genre: document.getElementById('film-genre').value,
    duration: parseFloat(document.getElementById('film-duration').value),
    bpm: document.getElementById('film-bpm').value ? parseInt(document.getElementById('film-bpm').value) : null,
    key: document.getElementById('film-key').value || null,
    intensity: document.getElementById('film-intensity').value,
    instrumentation: document.getElementById('film-instruments').value ? document.getElementById('film-instruments').value.split(',').map(s=>s.trim()) : null,
    reference_mood: document.getElementById('film-ref').value || null,
    variations: 3
  };
  
  try {
    const res = await fetch(`${API_BASE}/api/presets/film_bgm/build`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('film-prompt-preview').value = data.prompt;
  } catch (e) {
    console.error('Film build failed', e);
  }
}

async function generateFilmBGM() {
  await buildFilmPrompt();
  const prompt = document.getElementById('film-prompt-preview').value;
  if (!prompt) {
    alert('Please build the prompt first');
    return;
  }
  document.getElementById('prompt-input').value = prompt;
  document.getElementById('variations-input').value = 3;
  document.querySelector('[data-page="generate"]').click();
  generateAudio();
}

// Horror Sound Design
async function buildHorrorPrompt() {
  const payload = {
    mood: document.getElementById('horror-mood').value,
    texture: document.getElementById('horror-texture').value,
    movement: document.getElementById('horror-movement').value,
    frequency: document.getElementById('horror-freq').value,
    duration: parseFloat(document.getElementById('horror-duration').value),
    preset: document.getElementById('horror-preset').value || null
  };
  
  try {
    const res = await fetch(`${API_BASE}/api/presets/horror/build`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('horror-prompt-preview').value = data.prompt;
  } catch (e) {
    console.error('Horror build failed', e);
  }
}

async function generateHorror() {
  await buildHorrorPrompt();
  const prompt = document.getElementById('horror-prompt-preview').value;
  if (!prompt) {
    alert('Please build the horror prompt first');
    return;
  }
  document.getElementById('prompt-input').value = prompt;
  document.querySelector('[data-page="generate"]').click();
  generateAudio();
}

// Library & History
async function loadLibrary() {
  const search = document.getElementById('library-search').value;
  const category = document.getElementById('library-category').value;
  const model = document.getElementById('library-model').value;
  const fav = document.getElementById('library-fav').checked;
  
  try {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (model) params.set('model_id', model);
    if (fav) params.set('favorite_only', 'true');
    params.set('limit', '100');
    
    const res = await fetch(`${API_BASE}/api/library/?${params}`);
    const data = await res.json();
    
    const list = document.getElementById('library-list');
    list.innerHTML = '';
    
    document.getElementById('library-stats').textContent = `📊 Total Stored: ${data.total} audio files`;

    if (data.samples.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>No samples found matching your search</p></div>';
      return;
    }
    
    data.samples.forEach(s => {
      const div = document.createElement('div');
      div.className = `library-item ${s.favorite ? 'favorite' : ''}`;
      div.innerHTML = `
        <div class="library-item-main">
          <strong>${s.filename}</strong> ${s.favorite ? '⭐' : ''}<br>
          <small style="color:var(--text-muted);">${s.prompt.substring(0,110)}...</small><br>
          <small style="color:var(--text-dim); font-family:var(--font-mono);">${s.model_id} • ${s.duration.toFixed(1)}s • ${s.creation_date}</small>
        </div>
        <div class="library-item-actions">
          <audio controls src="${s.file_url}" style="width:140px; height:32px;"></audio>
          <button class="btn small primary" onclick="downloadFile('${s.file_url}', '${s.filename}')">⬇️</button>
          <button class="btn small glow-btn" onclick="openInFXStudio(${s.id})">🎚️</button>
          <button class="btn small ghost-btn" onclick="toggleFavorite(${s.id})">${s.favorite ? '⭐' : '☆'}</button>
          <button class="btn small ghost-btn" onclick="deleteSample(${s.id})">🗑️</button>
        </div>
      `;
      list.appendChild(div);
    });
    
  } catch (e) {
    console.error('Library load failed', e);
  }
}

// Models Page
async function loadModels() {
  try {
    const res = await fetch(`${API_BASE}/api/models/`);
    const data = await res.json();
    const container = document.getElementById('models-list');
    container.innerHTML = '';
    
    data.models.forEach(m => {
      const badgeClass = m.commercial_use === 'yes' ? 'badge-commercial' : m.commercial_use === 'no' ? 'badge-noncommercial' : 'badge-limited';
      const badgeText = m.commercial_use === 'yes' ? 'Free Commercial' : m.commercial_use === 'yes_under_1M' ? 'Free <$1M' : 'Non-commercial';
      
      const div = document.createElement('div');
      div.className = 'model-card';
      div.innerHTML = `
        <div class="model-header">
          <div class="model-name">${m.name}</div>
          <span class="model-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="model-meta">${m.description}</div>
        <div class="model-meta">
          <strong>ID:</strong> <code>${m.id}</code> • <strong>License:</strong> ${m.license} • <strong>VRAM:</strong> ${m.vram_gb}GB • <strong>Max:</strong> ${m.max_duration}s<br>
          <strong>Status:</strong> ${m.installed ? '⚡ Ready to generate' : '⬇️ Downloadable'}
        </div>
        <div class="model-actions">
          ${!m.installed && m.huggingface_repo ? `<button class="btn small primary" onclick="downloadModel('${m.id}')">⬇️ Download Weights</button>` : ''}
          <button class="btn small secondary" onclick="loadModel('${m.id}')">📥 Load</button>
          <button class="btn small ghost-btn" onclick="unloadModel('${m.id}')">📤 Unload</button>
          ${m.license_url ? `<a class="btn small ghost-btn" href="${m.license_url}" target="_blank">📄 License Info</a>` : ''}
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error('Models load failed', e);
  }
}

async function downloadModel(id) {
  if (!confirm(`Download model weights for ${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/models/download`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({model_id: id})
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail);
    }
    alert(`Model ${id} downloaded successfully!`);
    loadModels();
    loadModelsList();
  } catch (e) {
    alert(`Download failed: ${e.message}`);
  }
}

async function loadModel(id) {
  try {
    const res = await fetch(`${API_BASE}/api/models/${id}/load`, {method: 'POST'});
    if (!res.ok) throw new Error((await res.json()).detail);
    alert(`Model ${id} loaded into memory.`);
  } catch (e) {
    alert(`Load failed: ${e.message}`);
  }
}

async function unloadModel(id) {
  try {
    const res = await fetch(`${API_BASE}/api/models/${id}/unload`, {method: 'POST'});
    if (!res.ok) throw new Error((await res.json()).detail);
    alert(`Model ${id} unloaded.`);
  } catch (e) {
    alert(`Unload failed: ${e.message}`);
  }
}

// Settings Page
async function loadSettings() {
  try {
    const hwRes = await fetch(`${API_BASE}/api/hardware/check`);
    const hwData = await hwRes.json();
    document.getElementById('settings-hardware').innerHTML = `
      <p><strong>OS:</strong> ${hwData.hardware.os_name} ${hwData.hardware.os_version}</p>
      <p><strong>CPU:</strong> ${hwData.hardware.cpu} (${hwData.hardware.cpu_count} cores)</p>
      <p><strong>RAM:</strong> ${hwData.hardware.ram_total_gb} GB</p>
      <p><strong>GPU Engine:</strong> ${hwData.hardware.gpu_name || 'DSP CPU Fallback (Instant Free)'}</p>
      <p><strong>CUDA Acceleration:</strong> ${hwData.hardware.cuda_available ? '✅ Available' : '⚡ CPU Optimized Synthesis'}</p>
      <p><strong>Python Engine:</strong> ${hwData.hardware.python_version}</p>
    `;
    
    const cfgRes = await fetch(`${API_BASE}/api/config`);
    const cfg = await cfgRes.json();
    document.getElementById('settings-config').innerHTML = `
      <p><strong>Output Audio Directory:</strong> ${cfg.paths.output_dir}</p>
      <p><strong>Database Path:</strong> ${cfg.paths.db_path}</p>
      <p><strong>Default Engine:</strong> ${cfg.generation.default_model}</p>
    `;
    
    document.getElementById('settings-offline').checked = cfg.app.offline_mode;
    document.getElementById('offline-mode-toggle').checked = cfg.app.offline_mode;
    
  } catch (e) {
    console.error('Settings load failed', e);
  }
}

async function toggleOffline(e) {
  const checked = e.target.checked;
  try {
    const res = await fetch(`${API_BASE}/api/config/offline`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({offline_mode: checked})
    });
    const data = await res.json();
    document.getElementById('settings-offline').checked = data.offline_mode;
    document.getElementById('offline-mode-toggle').checked = data.offline_mode;
  } catch (err) {
    console.error('Toggle offline failed', err);
  }
}

async function checkOfflineMode() {
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    const cfg = await res.json();
    document.getElementById('offline-mode-toggle').checked = cfg.app.offline_mode;
    document.getElementById('settings-offline').checked = cfg.app.offline_mode;
  } catch (e) {}
}

function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function toggleFavorite(id) {
  try {
    await fetch(`${API_BASE}/api/library/${id}/favorite`, {method: 'POST'});
    loadLibrary();
  } catch (e) {
    console.error('Favorite failed', e);
  }
}

async function deleteSample(id) {
  if (!confirm('Are you sure you want to delete this track?')) return;
  try {
    await fetch(`${API_BASE}/api/library/${id}`, {method: 'DELETE'});
    loadLibrary();
    currentResults = currentResults.filter(r => r.id !== id);
    if (currentResults.length > 0) renderResults(currentResults);
    else document.getElementById('results-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎵</div>
        <h4>Your generated tracks will appear here</h4>
      </div>
    `;
  } catch (e) {
    console.error('Delete failed', e);
  }
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Kickoff
init();
