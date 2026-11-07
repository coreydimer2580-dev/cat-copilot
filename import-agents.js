/* Local multi-agent import workflow. No account or network access. */
(() => {
  const QUEUE_KEY = 'cat-copilot-import-agent-queue-v1';
  const TASKS_KEY = 'cat-copilot-tasks-v1';
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_FILES = 10;
  const MAX_DRAFTS = 3000;
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;

  const panel = document.createElement('section');
  panel.className = 'panel import-agents';
  panel.innerHTML = `
    <div class="panel-heading">
      <div><p class="eyebrow">LOCAL IMPORT WORKERS</p><h2>Bring in conversation exports</h2></div>
      <span class="agent-badge">Runs in this browser</span>
    </div>
    <p class="import-agent-note">These helper agents process only files you select: an intake agent reads text/JSON exports, a sentence agent makes one draft per sentence, and a review agent lets you inspect each draft before it enters the task board. They cannot sign into ChatGPT, Grok, OneDrive, Termux, or scan your device.</p>
    <div class="agent-controls">
      <label class="upload-button" for="history-files">Choose export files</label>
      <input id="history-files" type="file" accept=".txt,.md,.json,text/plain,application/json,text/markdown" multiple hidden>
      <button id="process-history" class="primary" type="button" disabled>Process selected exports</button>
      <button id="export-drafts" class="quiet" type="button">Export draft queue</button>
      <button id="clear-drafts" class="quiet" type="button">Clear queue</button>
    </div>
    <p class="hint">Up to ${MAX_FILES} files, ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB each. JSON parsing is best-effort across common chat export shapes; inspect the result against the original. No files are uploaded.</p>
    <p id="import-agent-status" class="import-agent-status" role="status">Choose exports you control to start.</p>
    <div class="agent-progress" aria-hidden="true"><span id="agent-progress-bar"></span></div>
    <div class="queue-heading"><strong>Sentence review queue</strong><span id="queue-count" class="count">0</span></div>
    <ul id="import-drafts" class="import-drafts" aria-live="polite"></ul>
  `;
  const importerAnchor = document.querySelector('.import-panel');
  workspace.insertBefore(panel, importerAnchor || workspace.firstChild);

  const fileInput = panel.querySelector('#history-files');
  const processButton = panel.querySelector('#process-history');
  const status = panel.querySelector('#import-agent-status');
  const queueList = panel.querySelector('#import-drafts');
  const count = panel.querySelector('#queue-count');
  const progressBar = panel.querySelector('#agent-progress-bar');
  let files = [];
  let queue = loadQueue();

  function loadQueue() {
    try {
      const saved = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(item => item && typeof item.sentence === 'string' && ['pending', 'added', 'dismissed'].includes(item.status)) : [];
    } catch { return []; }
  }
  function persistQueue() {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); return true; }
    catch {
      status.textContent = 'Browser storage is full. Export the queue, then clear imported drafts before processing more files.';
      return false;
    }
  }
  function setStatus(message, percent = null) {
    status.textContent = message;
    if (percent !== null) progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }
  function flattenContent(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map(flattenContent).filter(Boolean).join('\n');
    if (!content || typeof content !== 'object') return '';
    if (Array.isArray(content.parts)) return content.parts.map(flattenContent).filter(Boolean).join('\n');
    if (typeof content.text === 'string') return content.text;
    if (typeof content.value === 'string') return content.value;
    if (typeof content.content === 'string' || Array.isArray(content.content)) return flattenContent(content.content);
    return '';
  }
  function extractMessages(root) {
    const found = [];
    const seenObjects = new WeakSet();
    const allowed = new Set(['user', 'assistant', 'human', 'model']);
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (seenObjects.has(node)) return;
      seenObjects.add(node);
      if (Array.isArray(node)) { node.forEach(walk); return; }
      const authorObj = node.author && typeof node.author === 'object' ? node.author : {};
      const rawRole = String(authorObj.role || node.role || node.speaker || '').toLowerCase();
      const content = node.content ?? node.text ?? node.message;
      const body = flattenContent(content).trim();
      if (allowed.has(rawRole) && body) {
        found.push({ role: rawRole, text: body, date: node.create_time || node.created_at || node.timestamp || null });
        return;
      }
      Object.values(node).forEach(walk);
    }
    walk(root);
    return found;
  }
  function sentenceSplit(text) {
    // Avoid claiming linguistic certainty: retain every non-empty fragment using punctuation/newlines as practical boundaries.
    return text.replace(/\r/g, '').split(/(?<=[.!?])\s+|\n+/).map(part => part.trim()).filter(Boolean);
  }
  function makeDrafts(messages, fileName) {
    const output = [];
    messages.forEach((message, messageIndex) => {
      sentenceSplit(message.text).forEach((sentence, sentenceIndex) => {
        const signature = `${fileName}\u0000${messageIndex}\u0000${sentenceIndex}\u0000${sentence}`;
        output.push({
          id: stableId(signature), sentence,
          title: sentence.replace(/[\s.!?]+$/, '').trim() || sentence,
          source: fileName, speaker: message.role || 'unknown', sourceDate: message.date || null,
          importedAt: new Date().toISOString(), status: 'pending'
        });
      });
    });
    return output;
  }
  function stableId(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return `imp-${(hash >>> 0).toString(16)}`;
  }
  function renderQueue() {
    queueList.replaceChildren();
    const pending = queue.filter(item => item.status === 'pending');
    count.textContent = String(pending.length);
    if (!pending.length) {
      const empty = document.createElement('li'); empty.className = 'import-empty';
      empty.textContent = queue.length ? 'No pending drafts. Added and dismissed entries remain in the queue until you clear it.' : 'No sentence drafts yet.';
      queueList.append(empty); return;
    }
    pending.slice(0, 100).forEach(item => {
      const row = document.createElement('li'); row.className = 'import-draft';
      const body = document.createElement('div'); body.className = 'import-draft-body';
      const sentence = document.createElement('p'); sentence.textContent = item.sentence;
      const meta = document.createElement('small'); meta.textContent = `${item.source} · ${item.speaker}${item.sourceDate ? ` · ${item.sourceDate}` : ''}`;
      body.append(sentence, meta);
      const actions = document.createElement('div'); actions.className = 'import-draft-actions';
      const add = document.createElement('button'); add.type = 'button'; add.className = 'small-primary'; add.textContent = 'Add task';
      add.addEventListener('click', () => addToTasks(item));
      const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.className = 'small-quiet'; dismiss.textContent = 'Dismiss';
      dismiss.addEventListener('click', () => { item.status = 'dismissed'; persistQueue(); renderQueue(); });
      actions.append(add, dismiss); row.append(body, actions); queueList.append(row);
    });
    if (pending.length > 100) {
      const note = document.createElement('li'); note.className = 'import-empty'; note.textContent = `Showing first 100 of ${pending.length} pending drafts. Export the queue to review the full set.`; queueList.append(note);
    }
  }
  function addToTasks(item) {
    let tasks = [];
    try { const parsed = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); if (Array.isArray(parsed)) tasks = parsed; }
    catch { setStatus('Could not read the task list. Export a backup before changing browser storage.'); return; }
    if (tasks.some(task => task && task.memory?.importId === item.id)) {
      item.status = 'added'; persistQueue(); renderQueue(); setStatus('This sentence is already on the task board.'); return;
    }
    const task = {
      id: crypto.randomUUID(), title: item.title, done: false, category: 'General', priority: 'normal',
      role: 'General assistant', stage: 'backlog', blocker: 'none', source: item.source, dependsOn: [],
      createdAt: new Date().toISOString(),
      memory: { sentence: item.sentence, sourceText: item.sentence, speaker: item.speaker, sourceDate: item.sourceDate, importId: item.id, reviewState: 'accepted' }
    };
    tasks.unshift(task);
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }
    catch { setStatus('Could not save task; browser storage may be full. Export your data before removing anything.'); return; }
    item.status = 'added'; persistQueue(); renderQueue();
    setStatus('Task added locally. Refresh the planner page to see it in the main board.');
  }
  function parseFile(file, content) {
    if (/\.json$/i.test(file.name) || /json/i.test(file.type)) {
      try {
        const data = JSON.parse(content);
        const messages = extractMessages(data);
        if (messages.length) return messages;
      } catch { /* use plain-text fallback for malformed/nonstandard JSON exports */ }
    }
    return [{ role: 'imported text', text: content, date: null }];
  }

  fileInput.addEventListener('change', () => {
    files = Array.from(fileInput.files || []);
    fileInput.value = '';
    processButton.disabled = !files.length;
    if (files.length > MAX_FILES) {
      files = []; processButton.disabled = true;
      setStatus(`Select no more than ${MAX_FILES} files at a time.`); return;
    }
    const tooLarge = files.find(file => file.size > MAX_FILE_BYTES);
    if (tooLarge) {
      files = []; processButton.disabled = true;
      setStatus(`${tooLarge.name} is too large. Each export must be at most 5 MB.`); return;
    }
    setStatus(`${files.length} selected file${files.length === 1 ? '' : 's'}. Nothing has been uploaded.`);
  });
  processButton.addEventListener('click', async () => {
    if (!files.length) return;
    processButton.disabled = true;
    let added = 0;
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      setStatus(`Intake worker reading ${file.name}…`, index / files.length * 100);
      try {
        const content = await file.text();
        const messages = parseFile(file, content);
        const drafts = makeDrafts(messages, file.name);
        const known = new Set(queue.map(item => item.id));
        const newDrafts = drafts.filter(item => !known.has(item.id));
        if (queue.length + newDrafts.length > MAX_DRAFTS) {
          setStatus(`Draft limit (${MAX_DRAFTS}) reached. Export or clear the review queue before importing more.`); break;
        }
        queue.push(...newDrafts);
        if (!persistQueue()) break;
        added += newDrafts.length;
        setStatus(`Sentence worker processed ${index + 1}/${files.length} files; ${added} sentence drafts queued.`, (index + 1) / files.length * 100);
        renderQueue();
        await new Promise(resolve => setTimeout(resolve, 0));
      } catch (error) {
        setStatus(`Could not process ${file.name}: ${error.message || 'unknown error'}.`);
      }
    }
    files = [];
    processButton.disabled = true;
    setStatus(`Finished local import: ${added} new sentence drafts queued for review. No task is added until you choose Add task.` , 100);
    renderQueue();
  });
  panel.querySelector('#export-drafts').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'C@T Copilot import queue', exportedAt: new Date().toISOString(), drafts: queue }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'cat-copilot-import-drafts.json'; link.click(); URL.revokeObjectURL(url);
  });
  panel.querySelector('#clear-drafts').addEventListener('click', () => {
    if (queue.length && !confirm('Clear all imported sentence drafts, including added and dismissed records? Export first if you need a copy.')) return;
    queue = []; persistQueue(); renderQueue(); setStatus('Import queue cleared from this browser.');
  });
  renderQueue();
})();
