// PKmusicgen Frontend App
const API_BASE = '';

let currentResults = [];
let selectedSampleId = null;
let models = [];
let hardwareInfo = null;

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    // Load page data
    if (page === 'library') loadLibrary();
    if (page === 'models') loadModels();
    if (page === 'settings') loadSettings();
  });
});

// Init
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
  checkOfflineMode();
}

async function loadHardware() {
  try {
    const res = await fetch(`${API_BASE}/api/hardware/`);
    const data = await res.json();
    hardwareInfo = data;
    const mini = document.getElementById('hardware-mini');
    mini.innerHTML = `
      <div class="hw-line">GPU: ${data.gpu_name || 'CPU only'}</div>
      <div class="hw-line">VRAM: ${data.gpu_vram_gb ? data.gpu_vram_gb + ' GB' : 'N/A'}</div>
      <div class="hw-line">CUDA: ${data.cuda_available ? '✅' : '❌ CPU mode'}</div>
      <div class="hw-line">RAM: ${data.ram_total_gb} GB</div>
    `;
  } catch (e) {
    document.getElementById('hardware-mini').innerHTML = `<div class="hw-line">Hardware detection failed</div>`;
  }
}

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
      opt.textContent = `${m.name} (${m.id}) ${m.installed ? '✅' : '⬇️'}`;
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
  const badgeText = model.commercial_use === 'yes' ? 'Commercial OK' : model.commercial_use === 'yes_under_1M' ? 'Commercial <$1M' : 'Non-commercial';
  infoDiv.innerHTML = `
    <span class="model-badge ${badgeClass}">${badgeText}</span>
    <div style="font-size:0.8rem;color:var(--text-dim);margin-top:4px">
      VRAM: ${model.vram_gb}GB | Max: ${model.max_duration}s | ${model.size_gb}GB | ${model.license}
    </div>
  `;
}

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
      opt.textContent = g;
      genreSel.appendChild(opt);
    });
    data.moods.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      moodSel.appendChild(opt);
    });
    data.textures.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      textureSel.appendChild(opt);
    });
    data.instruments.forEach(i => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      instrSel.appendChild(opt);
    });
  } catch (e) {
    console.error('Builder options failed', e);
  }
}

async function loadPresets() {
  try {
    const res = await fetch(`${API_BASE}/api/presets/`);
    const data = await res.json();
    const presets = data.presets || {};
    // Render default category cinematic
    renderPresetCategory('cinematic', presets['cinematic'] || []);
    
    // Setup tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
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
    container.innerHTML = `<div class="empty">No presets for ${cat}</div>`;
    return;
  }
  const list = Array.isArray(items) ? items : [items];
  list.forEach(item => {
    if (typeof item === 'string') return;
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.innerHTML = `
      <div class="preset-name">${item.name || item.id}</div>
      <div class="preset-prompt">${(item.prompt || '').substring(0, 120)}...</div>
    `;
    div.addEventListener('click', () => {
      document.getElementById('prompt-input').value = item.prompt || '';
      updatePromptCount();
    });
    container.appendChild(div);
  });
}

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
      card.innerHTML = `<strong>${p.name}</strong><br><small>${p.description}</small>`;
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

async function loadSampleCategories() {
  // Load sample generator categories from presets/sample_generator.json via API
  try {
    const res = await fetch(`${API_BASE}/api/presets/sample_generator`);
    let data;
    if (res.ok) {
      const json = await res.json();
      data = json.presets;
    } else {
      // Fallback hardcoded
      data = {
        drums: ["kick", "snare", "clap", "hi-hat", "tom", "percussion", "drum loop", "cinematic percussion", "tribal percussion", "folk percussion"],
        bass: ["sub bass", "cinematic bass", "bass hit", "bass drone", "synth bass"],
        instruments: ["piano", "strings", "guitar", "flute", "percussion", "synth", "pads", "plucks"],
        cinematic: ["impact", "whoosh", "riser", "downer", "drone", "tension", "trailer hit", "horror texture", "reverse texture", "metallic texture"],
        indian_folk: ["tamate", "chende", "dollu", "thavil", "mridangam", "tabla", "folk percussion", "yakshagana-inspired percussion", "coastal karnataka folk atmosphere"]
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
          document.getElementById('prompt-input').value = `${item}, professional sample, high quality, one-shot, 3 seconds`;
          updatePromptCount();
          document.querySelector('[data-page="generate"]').click();
        });
        container.appendChild(span);
      });
    };
    
    // Map keys to DOM ids
    if (data.drums) renderCat('drums', data.drums);
    if (data.bass) renderCat('bass', data.bass);
    if (data.instruments) renderCat('instruments', data.instruments);
    if (data.cinematic) renderCat('cinematic', data.cinematic);
    if (data.indian_folk) renderCat('indian', data.indian_folk);
    
  } catch (e) {
    console.error('Sample categories failed', e);
  }
}

function setupEventListeners() {
  // Prompt count
  document.getElementById('prompt-input').addEventListener('input', updatePromptCount);
  
  // Model select
  document.getElementById('model-select').addEventListener('change', updateModelInfo);
  
  // Sliders
  document.getElementById('duration-slider').addEventListener('input', e => {
    document.getElementById('duration-value').textContent = e.target.value + 's';
  });
  document.getElementById('guidance-slider').addEventListener('input', e => {
    document.getElementById('guidance-value').textContent = e.target.value;
  });
  
  // Random seed
  document.getElementById('random-seed-btn').addEventListener('click', () => {
    document.getElementById('seed-input').value = Math.floor(Math.random() * 2**32);
  });
  
  // Build prompt
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
  
  // Generate
  document.getElementById('generate-btn').addEventListener('click', generateAudio);
  document.getElementById('batch-generate-btn').addEventListener('click', generateBatch);
  
  // Film BGM
  document.getElementById('film-build-btn').addEventListener('click', buildFilmPrompt);
  document.getElementById('film-generate-btn').addEventListener('click', generateFilmBGM);
  
  // Horror
  document.getElementById('horror-build-btn').addEventListener('click', buildHorrorPrompt);
  document.getElementById('horror-generate-btn').addEventListener('click', generateHorror);
  
  // Library
  document.getElementById('library-refresh').addEventListener('click', loadLibrary);
  document.getElementById('library-search').addEventListener('input', debounce(loadLibrary, 500));
  
  // Offline toggle
  document.getElementById('offline-mode-toggle').addEventListener('change', toggleOffline);
  document.getElementById('settings-offline').addEventListener('change', toggleOffline);
  
  // Load variations
  loadVariations();
}

function updatePromptCount() {
  const count = document.getElementById('prompt-input').value.length;
  document.getElementById('prompt-count').textContent = count;
}

async function generateAudio() {
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) {
    alert('Enter a prompt');
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
    bit_depth: parseInt(document.getElementById('bitdepth-select').value),
    normalize: document.getElementById('normalize-check').checked,
    fade_in: parseFloat(document.getElementById('fadein-input').value),
    fade_out: parseFloat(document.getElementById('fadeout-input').value),
    genre: document.getElementById('genre-select').value || null,
    mood: document.getElementById('mood-select').value || null,
    texture: document.getElementById('texture-select').value || null,
  };
  
  const btn = document.getElementById('generate-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Generating...';
  const statusDiv = document.getElementById('generation-status');
  statusDiv.className = 'status generating';
  statusDiv.textContent = 'Generating audio, please wait... (may take 10-60 seconds)';
  
  try {
    const res = await fetch(`${API_BASE}/api/generate/sync`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Generation failed');
    }
    
    const data = await res.json();
    statusDiv.className = 'status completed';
    statusDiv.textContent = `Completed! Generated ${data.results.length} variation(s)`;
    renderResults(data.results);
    
  } catch (e) {
    statusDiv.className = 'status failed';
    statusDiv.textContent = `Failed: ${e.message}`;
    console.error(e);
  } finally {
    btn.disabled = false;
    btn.textContent = '🎵 Generate Audio';
  }
}

function renderResults(results) {
  const container = document.getElementById('results-container');
  container.innerHTML = '';
  currentResults = results;
  
  results.forEach(r => {
    const div = document.createElement('div');
    div.className = 'result-item';
    const waveformHtml = r.analysis && r.analysis.waveform ? 
      `<div class="waveform">${r.analysis.waveform.slice(0,100).map(v => `<div class="waveform-bar" style="height:${Math.min(100, v*100*3)}%"></div>`).join('')}</div>` : '';
    
    div.innerHTML = `
      <div class="result-header">
        <div class="result-title">${r.filename}</div>
        <div class="result-meta">${r.duration}s | Seed: ${r.seed} | ${r.model_id}</div>
      </div>
      <div class="result-meta">Prompt: ${r.prompt.substring(0,100)}...</div>
      ${waveformHtml}
      <audio controls src="${r.file_url}"></audio>
      <div class="result-meta">Peak: ${r.analysis?.peak_db} dB | RMS: ${r.analysis?.rms_db} dB | Time: ${r.generation_time?.toFixed(2)}s</div>
      <div class="result-actions">
        <button class="btn small" onclick="downloadFile('${r.file_url}', '${r.filename}')">⬇️ Download</button>
        <button class="btn small" onclick="selectForVariation(${r.id})">🔀 Variations</button>
        <button class="btn small" onclick="toggleFavorite(${r.id})">⭐ Favorite</button>
        <button class="btn small" onclick="deleteSample(${r.id})">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function loadVariations() {
  try {
    const res = await fetch(`${API_BASE}/api/generate/variations`);
    const data = await res.json();
    const grid = document.getElementById('variation-grid');
    grid.innerHTML = '';
    data.forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'btn small variation-btn';
      btn.textContent = `${v.icon} ${v.label}`;
      btn.addEventListener('click', () => generateVariation(v.id));
      grid.appendChild(btn);
    });
  } catch (e) {
    console.error('Variations failed', e);
  }
}

async function generateVariation(type) {
  if (!selectedSampleId) {
    alert('Select a sample first from results or library');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/generate/variation/${selectedSampleId}/${type}`, {method: 'POST'});
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail);
    }
    const data = await res.json();
    renderResults(data.results);
    document.querySelector('[data-page="generate"]').click();
  } catch (e) {
    alert(`Variation failed: ${e.message}`);
  }
}

function selectForVariation(id) {
  selectedSampleId = id;
  alert(`Selected sample ${id} for variation. Now click a variation button like Darker, Brighter etc.`);
}

async function generateBatch() {
  const prompt = document.getElementById('batch-prompt').value.trim();
  const count = parseInt(document.getElementById('batch-count').value);
  if (!prompt) {
    alert('Enter batch prompt');
    return;
  }
  document.getElementById('prompt-input').value = prompt;
  document.getElementById('variations-input').value = count;
  generateAudio();
}

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
    document.getElementById('film-prompt-preview').value = data.prompt + '\n\nVariations:\n' + data.variations.join('\n---\n');
  } catch (e) {
    console.error('Film build failed', e);
  }
}

async function generateFilmBGM() {
  await buildFilmPrompt();
  const prompt = document.getElementById('film-prompt-preview').value.split('\n\nVariations:')[0];
  if (!prompt) {
    alert('Build prompt first');
    return;
  }
  document.getElementById('prompt-input').value = prompt;
  document.getElementById('variations-input').value = 3;
  document.querySelector('[data-page="generate"]').click();
  generateAudio();
}

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
    alert('Build prompt first');
    return;
  }
  document.getElementById('prompt-input').value = prompt;
  document.querySelector('[data-page="generate"]').click();
  generateAudio();
}

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
    
    document.getElementById('library-stats').textContent = `Total: ${data.total} samples`;
    
    data.samples.forEach(s => {
      const div = document.createElement('div');
      div.className = `library-item ${s.favorite ? 'favorite' : ''}`;
      div.innerHTML = `
        <div class="library-item-main">
          <strong>${s.filename}</strong> ${s.favorite ? '⭐' : ''}<br>
          <small>${s.prompt.substring(0,120)}...</small><br>
          <small>Model: ${s.model_id} | Seed: ${s.seed} | ${s.duration}s | ${s.creation_date}</small>
        </div>
        <div class="library-item-actions">
          <audio controls src="${s.file_url}" style="width:150px"></audio>
          <button class="btn small" onclick="downloadFile('${s.file_url}', '${s.filename}')">⬇️</button>
          <button class="btn small" onclick="toggleFavorite(${s.id})">⭐</button>
          <button class="btn small" onclick="selectForVariation(${s.id})">🔀</button>
          <button class="btn small" onclick="deleteSample(${s.id})">🗑️</button>
        </div>
      `;
      list.appendChild(div);
    });
    
  } catch (e) {
    console.error('Library load failed', e);
  }
}

async function loadModels() {
  try {
    const res = await fetch(`${API_BASE}/api/models/`);
    const data = await res.json();
    const container = document.getElementById('models-list');
    container.innerHTML = '';
    
    data.models.forEach(m => {
      const badgeClass = m.commercial_use === 'yes' ? 'badge-commercial' : m.commercial_use === 'no' ? 'badge-noncommercial' : 'badge-limited';
      const badgeText = m.commercial_use === 'yes' ? 'Commercial OK' : m.commercial_use === 'yes_under_1M' ? 'Commercial <$1M' : 'Non-commercial';
      
      const div = document.createElement('div');
      div.className = 'model-card';
      div.innerHTML = `
        <div class="model-header">
          <div class="model-name">${m.name}</div>
          <span class="model-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="model-meta">${m.description}</div>
        <div class="model-meta">
          <strong>ID:</strong> ${m.id} | <strong>License:</strong> ${m.license} | <strong>VRAM:</strong> ${m.vram_gb}GB | <strong>Max:</strong> ${m.max_duration}s | <strong>Size:</strong> ${m.size_gb}GB<br>
          <strong>HF Repo:</strong> ${m.huggingface_repo || 'Built-in'} | <strong>Installed:</strong> ${m.installed ? '✅ Yes' + (m.installed_size_gb ? ` (${m.installed_size_gb}GB)` : '') : '❌ No'}
        </div>
        <div class="model-meta"><em>${m.commercial_note}</em></div>
        <div class="model-actions">
          ${!m.installed && m.huggingface_repo ? `<button class="btn small primary" onclick="downloadModel('${m.id}')">⬇️ Download</button>` : ''}
          ${m.installed && m.id !== 'procedural-dsp' ? `<button class="btn small" onclick="uninstallModel('${m.id}')">🗑️ Uninstall</button>` : ''}
          <button class="btn small" onclick="loadModel('${m.id}')">📥 Load</button>
          <button class="btn small" onclick="unloadModel('${m.id}')">📤 Unload</button>
          <a class="btn small" href="${m.license_url}" target="_blank">📄 License</a>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error('Models load failed', e);
  }
}

async function downloadModel(id) {
  if (!confirm(`Download model ${id}? This requires internet and may be several GB.`)) return;
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
    alert(`Model ${id} downloaded!`);
    loadModels();
    loadModelsList();
  } catch (e) {
    alert(`Download failed: ${e.message}`);
  }
}

async function uninstallModel(id) {
  if (!confirm(`Uninstall model ${id}? This will delete ${id} from disk.`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/models/${id}`, {method: 'DELETE'});
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail);
    }
    alert(`Model ${id} uninstalled`);
    loadModels();
    loadModelsList();
  } catch (e) {
    alert(`Uninstall failed: ${e.message}`);
  }
}

async function loadModel(id) {
  try {
    const res = await fetch(`${API_BASE}/api/models/${id}/load`, {method: 'POST'});
    if (!res.ok) throw new Error((await res.json()).detail);
    alert(`Model ${id} loaded`);
  } catch (e) {
    alert(`Load failed: ${e.message}`);
  }
}

async function unloadModel(id) {
  try {
    const res = await fetch(`${API_BASE}/api/models/${id}/unload`, {method: 'POST'});
    if (!res.ok) throw new Error((await res.json()).detail);
    alert(`Model ${id} unloaded`);
  } catch (e) {
    alert(`Unload failed: ${e.message}`);
  }
}

async function loadSettings() {
  try {
    const hwRes = await fetch(`${API_BASE}/api/hardware/check`);
    const hwData = await hwRes.json();
    document.getElementById('settings-hardware').innerHTML = `
      <p><strong>OS:</strong> ${hwData.hardware.os_name} ${hwData.hardware.os_version}</p>
      <p><strong>CPU:</strong> ${hwData.hardware.cpu} (${hwData.hardware.cpu_count} cores)</p>
      <p><strong>RAM:</strong> ${hwData.hardware.ram_total_gb} GB (available ${hwData.hardware.ram_available_gb} GB)</p>
      <p><strong>GPU:</strong> ${hwData.hardware.gpu_name || 'None'} ${hwData.hardware.gpu_vram_gb ? `(${hwData.hardware.gpu_vram_gb} GB)` : ''}</p>
      <p><strong>CUDA:</strong> ${hwData.hardware.cuda_available ? '✅ Available' : '❌ Not available'} ${hwData.hardware.cuda_version || ''}</p>
      <p><strong>Torch:</strong> ${hwData.hardware.torch_version || 'Not installed'} | CUDA available: ${hwData.hardware.torch_cuda_available}</p>
      <p><strong>FFmpeg:</strong> ${hwData.hardware.ffmpeg_available ? '✅ Found' : '❌ Not found'}</p>
      <p><strong>Python:</strong> ${hwData.hardware.python_version}</p>
      <h4>Recommendations:</h4>
      <ul>${hwData.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
    `;
    
    const cfgRes = await fetch(`${API_BASE}/api/config`);
    const cfg = await cfgRes.json();
    document.getElementById('settings-config').innerHTML = `
      <p><strong>Model Dir:</strong> ${cfg.paths.model_dir}</p>
      <p><strong>Output Dir:</strong> ${cfg.paths.output_dir}</p>
      <p><strong>Presets Dir:</strong> ${cfg.paths.presets_dir}</p>
      <p><strong>DB Path:</strong> ${cfg.paths.db_path}</p>
      <p><strong>Default Model:</strong> ${cfg.generation.default_model}</p>
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
    alert(`Offline mode ${data.offline_mode ? 'enabled' : 'disabled'}`);
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
  if (!confirm('Delete this sample?')) return;
  try {
    await fetch(`${API_BASE}/api/library/${id}`, {method: 'DELETE'});
    loadLibrary();
    // Also remove from current results if present
    currentResults = currentResults.filter(r => r.id !== id);
    if (currentResults.length > 0) renderResults(currentResults);
    else document.getElementById('results-container').innerHTML = '<div class="empty">No generations yet.</div>';
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

// Start
init();
