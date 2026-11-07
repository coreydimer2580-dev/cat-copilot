/* Capability pathway planner: maps unavailable capabilities to explicit, user-controlled setup steps. */
(() => {
  const KEY = 'cat-copilot-pathway-progress-v1';
  const TASKS_KEY = 'cat-copilot-tasks-v1';
  const pathways = [
    {
      id: 'chat-exports', title: 'Import ChatGPT or Grok history', status: 'Available with your export',
      summary: 'C@T cannot search your account. You can export/copy conversations from each service, then select those files in the local import agents.',
      steps: ['Export conversations through the service’s official account controls.', 'Choose the export file in C@T Copilot’s local import agents.', 'Check the extracted sentence queue against the source, then add only the items you want.'],
      next: 'Export your conversations, then use “Choose export files” above.'
    },
    {
      id: 'onedrive', title: 'Use selected OneDrive files', status: 'Connector setup required',
      summary: 'No OneDrive connection exists in this app. A future connector must use Microsoft sign-in and only the permissions you approve; avoid broad access when a file picker or selected folder will work.',
      steps: ['Create/register an app with Microsoft using the official developer portal.', 'Implement OAuth with least-privilege delegated scopes and secure token handling; never put client secrets in browser code.', 'Show the selected files and request consent before importing; support disconnect and revoke.'],
      next: 'A maintainer must implement and test the official OAuth connector. Until then, download specific files yourself and import them locally.'
    },
    {
      id: 'termux', title: 'Connect your own Termux workspace', status: 'Local companion setup required',
      summary: 'A web page cannot open or inspect Termux. A separate local script that you install and start could process only folders and operations you explicitly allow.',
      steps: ['Choose a dedicated export folder; do not grant access to all phone storage by default.', 'Install a reviewed local companion script in Termux and grant only the needed folder permission.', 'Use a visible, authenticated local interface; review each proposed import or command and retain a stop switch.'],
      next: 'This requires implementation and installation on your phone. No Termux process is started by this app.'
    },
    {
      id: 'media', title: 'Turn selected media into notes', status: 'Partly available; transcription needed',
      summary: 'You can select files on the media-notes page and add a transcript or description. C@T does not currently transcribe video/audio or identify people in photos.',
      steps: ['Select only media you own or have permission to use.', 'Transcribe with a method you choose, considering local processing versus cloud privacy/cost.', 'Verify the transcript against the recording, add timestamps/context, then import notes for review.'],
      next: 'Use a trusted transcription workflow, then paste its verified transcript into media notes.'
    },
    {
      id: 'ai-model', title: 'Connect a real AI assistant', status: 'Provider integration required',
      summary: 'The current companion uses local rules and is not generative AI. A model integration needs a provider/local-model choice and clear data-sharing controls.',
      steps: ['Choose a provider or local model and review its privacy, retention, cost, and safety terms.', 'Implement a server-side adapter; keep credentials out of browser code and limit usage.', 'Show exactly what data will be sent and ask before each first-time or sensitive share; log and allow disconnect.'],
      next: 'Select the model and hosting approach before implementation. This app makes no provider calls today.'
    },
    {
      id: 'background', title: 'Run a worker beyond this browser session', status: 'External worker setup required',
      summary: 'Browser workers stop when the page/session ends and cannot do OS-level work. A persistent worker must be installed and operated in an environment you control.',
      steps: ['Choose a host you control (for example, your phone or a private server) and define uptime limits.', 'Run a least-privilege queue worker with visible logs, pause/stop, retries, and resource limits.', 'Require approval for messages, purchases, account changes, file sharing, shell commands, or irreversible actions.'],
      next: 'Deploy and monitor a separate worker; this app cannot start or supervise one remotely.'
    },
    {
      id: 'life-planning', title: 'Build grounded personal routes and goals', status: 'Start locally now',
      summary: 'Use tasks as small, editable next steps. Keep observations, sources, interpretations, uncertainties, and personal goals distinct; do not treat guesses about another person’s motives as established facts.',
      steps: ['Write one goal in your own words and note constraints, supports, and what “good enough” progress means.', 'Create several optional routes with a small first step and a review date.', 'Record evidence and uncertainty separately; revise or delete a route when it stops helping.'],
      next: 'Add a task for one small, practical step you choose.'
    }
  ];

  function loadProgress() {
    try { const data = JSON.parse(localStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' ? data : {}; }
    catch { return {}; }
  }
  let progress = loadProgress();
  function saveProgress() {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); return true; }
    catch { status.textContent = 'Could not save pathway progress in this browser.'; return false; }
  }
  function addTask(text) {
    let tasks;
    try { tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); if (!Array.isArray(tasks)) tasks = []; }
    catch { status.textContent = 'Could not read the task list. Export a backup before changing storage.'; return; }
    tasks.unshift({
      id: crypto.randomUUID(), title: text, done: false, category: 'General', priority: 'normal',
      role: 'General assistant', stage: 'backlog', blocker: 'none', source: 'capability pathway',
      dependsOn: [], createdAt: new Date().toISOString(), memory: { sentence: text, reviewState: 'user-approved' }
    });
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); status.textContent = 'Next-step task added locally. Refresh the planner to update its board.'; }
    catch { status.textContent = 'Could not save the task; browser storage may be full.'; }
  }
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  const panel = node('section', 'panel pathway-panel');
  panel.setAttribute('aria-labelledby', 'pathways-title');
  const heading = node('div', 'panel-heading');
  const headingText = node('div');
  headingText.append(node('p', 'eyebrow', 'CAPABILITY ROUTES'), node('h2', '', 'A path for each next step'));
  const status = node('p', 'pathway-status');
  status.setAttribute('role', 'status');
  status.textContent = 'Capabilities that need access or setup are shown with concrete, user-controlled steps—not claimed as already connected.';
  heading.append(headingText);
  panel.append(heading, status);
  const cards = node('div', 'pathway-grid');

  pathways.forEach(pathway => {
    const card = node('details', 'pathway-card');
    const summary = node('summary', 'pathway-summary');
    const title = node('strong', '', pathway.title);
    const badge = node('span', 'pathway-badge', pathway.status);
    summary.append(title, badge);
    const content = node('div', 'pathway-content');
    content.append(node('p', 'pathway-description', pathway.summary));
    const list = node('ol', 'pathway-steps');
    const complete = new Set(Array.isArray(progress[pathway.id]) ? progress[pathway.id] : []);
    pathway.steps.forEach((step, index) => {
      const li = node('li', 'pathway-step');
      const label = node('label', 'pathway-check');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.checked = complete.has(index);
      checkbox.addEventListener('change', () => {
        const updated = new Set(Array.isArray(progress[pathway.id]) ? progress[pathway.id] : []);
        checkbox.checked ? updated.add(index) : updated.delete(index);
        progress[pathway.id] = [...updated]; saveProgress();
      });
      label.append(checkbox, node('span', '', step)); li.append(label); list.append(li);
    });
    content.append(list, node('p', 'pathway-next', pathway.next));
    const taskButton = node('button', 'small-primary', 'Add next step to my tasks');
    taskButton.type = 'button'; taskButton.addEventListener('click', () => addTask(pathway.next));
    content.append(taskButton); card.append(summary, content); cards.append(card);
  });
  panel.append(cards);
  const anchor = document.querySelector('.agent-panel') || document.querySelector('.import-panel');
  workspace.insertBefore(panel, anchor ? anchor.nextSibling : workspace.firstChild);

  const style = document.createElement('style');
  style.textContent = `
    .pathway-panel { display:grid; gap:12px; }
    .pathway-panel .panel-heading { margin:0; }
    .pathway-status { margin:0; color:var(--muted); font-size:10px; line-height:1.55; }
    .pathway-grid { display:grid; gap:8px; }
    .pathway-card { border:1px solid var(--border); border-radius:10px; background:#10131b; overflow:hidden; }
    .pathway-summary { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:11px 12px; cursor:pointer; }
    .pathway-summary strong { font-size:11px; }
    .pathway-badge { border:1px solid #554f79; border-radius:99px; color:var(--accent); padding:3px 7px; font-size:9px; text-align:center; }
    .pathway-content { padding:0 12px 12px; }
    .pathway-description,.pathway-next { color:#b8bdca; font-size:10px; line-height:1.6; }
    .pathway-steps { display:grid; gap:7px; padding-left:0; list-style:none; }
    .pathway-check { display:flex; gap:8px; align-items:flex-start; color:var(--text); font-size:10px; line-height:1.55; }
    .pathway-check input { accent-color:var(--mint); margin-top:2px; }
    .pathway-next { border-left:2px solid var(--mint); padding-left:8px; }
    @media(max-width:480px){.pathway-summary{align-items:flex-start;flex-direction:column}.pathway-badge{text-align:left}}
  `;
  document.head.append(style);
})();
