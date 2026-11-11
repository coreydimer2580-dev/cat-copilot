const STORAGE_KEY = 'cat-copilot-tasks-v1';
const stages = ['backlog', 'in-progress', 'waiting', 'done'];
const stageLabels = { backlog: 'Backlog', 'in-progress': 'In progress', waiting: 'Waiting', done: 'Done' };
const roles = ['Human review', 'Local/private work', 'Coding assistant', 'Research assistant', 'Writing assistant', 'General assistant'];
const blockers = ['none', 'waiting-for-approval', 'waiting-for-evidence', 'waiting-for-input', 'blocked'];
const blockerLabels = { none: 'None', 'waiting-for-approval': 'Waiting for approval', 'waiting-for-evidence': 'Waiting for evidence', 'waiting-for-input': 'Waiting for input', blocked: 'Blocked' };
const textInput = document.querySelector('#conversation');
const fileInput = document.querySelector('#file-input');
const taskList = document.querySelector('#tasks');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#task-count');
const suggestionsPanel = document.querySelector('#suggestions-panel');
const suggestionsList = document.querySelector('#suggestions');
const suggestionCount = document.querySelector('#suggestion-count');
const board = document.querySelector('#board');
const timeline = document.querySelector('#timeline');
const dependencySummary = document.querySelector('#dependency-summary');
const roleFilter = document.querySelector('#role-filter');
const categoryFilter = document.querySelector('#category-filter');
const terminalInput = document.querySelector('#terminal-input');
const terminalForm = document.querySelector('#terminal-form');
const terminalOutput = document.querySelector('#terminal-output');
let tasks = loadTasks();
let suggestions = [];

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(t => t && typeof t.title === 'string').map(t => ({
      id: t.id || crypto.randomUUID(), title: t.title, done: Boolean(t.done),
      category: t.category || categorize(t.title),
      priority: ['low', 'normal', 'high'].includes(t.priority) ? t.priority : 'normal',
      role: roles.includes(t.role) ? t.role : recommendRole(t.title),
      stage: stages.includes(t.stage) ? t.stage : (t.done ? 'done' : 'backlog'),
      blocker: blockers.includes(t.blocker) ? t.blocker : 'none',
      source: typeof t.source === 'string' ? t.source : 'manual',
      dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
      createdAt: t.createdAt || new Date().toISOString(),
      memory: t.memory && typeof t.memory === 'object' ? t.memory : { sentence: t.title }
    })) : [];
  } catch { return []; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); return true; }
  catch { alert('Could not save tasks. Browser storage may be full; export your tasks before clearing anything.'); return false; }
}
function sentenceList(text) {
  return text.replace(/\r/g, '').split(/(?<=[.!?])(?:[\s]+|(?=["”’)]))|\n+/).map(s => s.trim().replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
}
function taskTitle(sentence) { return sentence.replace(/[\s.!?]+$/, '').trim() || sentence.trim(); }
function categorize(title) {
  if (/\b(import|export|data|history|recover|restore|evidence|claim|email|attachment|document|source|photo|video|transcript)\b/i.test(title)) return 'Data';
  if (/\b(secur|privacy|approval|consent|guard|permission|sensitive|human review|safety)\b/i.test(title)) return 'Safety';
  if (/\b(test|fix|bug|review|validate|quality)\b/i.test(title)) return 'Quality';
  if (/\b(build|create|design|interface|chat|app|assistant|code|implement|automate|script)\b/i.test(title)) return 'Product';
  if (/\b(goal|objective|plan|future|support|wellbeing|well-being)\b/i.test(title)) return 'Personal goals';
  return 'General';
}
function recommendRole(title) {
  if (/\b(send|submit|pay|delete|approve|legal|claim|insurance|medical|financial|external action|consent|sensitive)\b/i.test(title)) return 'Human review';
  if (/\b(code|coding|build|debug|implement|software|app|test|deploy|automate|script)\b/i.test(title)) return 'Coding assistant';
  if (/\b(research|find|search|compare|verify|source|investigate|evidence|history|facts|proof)\b/i.test(title)) return 'Research assistant';
  if (/\b(write|draft|summarize|letter|document|report|explain|email)\b/i.test(title)) return 'Writing assistant';
  if (/\b(private|local|sensitive|personal|data|history|recover|storage)\b/i.test(title)) return 'Local/private work';
  return 'General assistant';
}
function suggestedPriority(title) { return /\b(critical|urgent|security|privacy|recover|restore|block|prevent)\b/i.test(title) ? 'high' : 'normal'; }
function makeButton(label, className, action, ariaLabel = label) {
  const button = document.createElement('button'); button.type = 'button'; button.className = className; button.textContent = label;
  button.setAttribute('aria-label', ariaLabel); button.addEventListener('click', action); return button;
}
function makeSelect(className, values, selected, labels, ariaLabel) {
  const select = document.createElement('select'); select.className = className; select.setAttribute('aria-label', ariaLabel);
  values.forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = labels?.[value] || value; option.selected = value === selected; select.append(option); });
  return select;
}
function refreshFilters() {
  if (!roleFilter || !categoryFilter) return;
  const previousRole = roleFilter.value, previousCategory = categoryFilter.value;
  roleFilter.replaceChildren(new Option('All roles', 'all'));
  [...new Set(tasks.map(t => t.role))].sort().forEach(role => roleFilter.add(new Option(role, role)));
  categoryFilter.replaceChildren(new Option('All categories', 'all'));
  [...new Set(tasks.map(t => t.category))].sort().forEach(category => categoryFilter.add(new Option(category, category)));
  roleFilter.value = [...roleFilter.options].some(o => o.value === previousRole) ? previousRole : 'all';
  categoryFilter.value = [...categoryFilter.options].some(o => o.value === previousCategory) ? previousCategory : 'all';
}
function appendTerminalLine(text, tone = '') {
  if (!terminalOutput) return;
  const line = document.createElement('div'); line.className = `terminal-line${tone ? ` ${tone}` : ''}`; line.textContent = text;
  terminalOutput.append(line); terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
function buildSentencePlan(sentence) {
  const title = taskTitle(sentence), normalized = title.toLowerCase();
  let intent = 'task';
  if (/\b(build|create|implement|design|launch|set up|make)\b/.test(normalized)) intent = 'build';
  else if (/\b(test|check|validate|review|verify)\b/.test(normalized)) intent = 'verify';
  else if (/\b(find|research|compare|investigate|look up)\b/.test(normalized)) intent = 'research';
  else if (/\b(write|summarize|draft|email|document)\b/.test(normalized)) intent = 'write';
  const sequence = [];
  if (/\b(build|create|design|implement|make|setup|launch|app)\b/.test(normalized)) sequence.push('scope');
  if (/\b(research|find|compare|investigate|evidence|proof|facts)\b/.test(normalized)) sequence.push('research');
  if (/\b(test|validate|review|check|verify|bug|fix)\b/.test(normalized)) sequence.push('verify');
  if (/\b(write|summarize|draft|email|document|report)\b/.test(normalized)) sequence.push('write');
  if (!sequence.length) sequence.push('capture');
  return { title, role: recommendRole(title), category: categorize(title), priority: suggestedPriority(title), intent, sequence };
}

const analyzeButton = document.querySelector('#analyze');
if (analyzeButton) analyzeButton.textContent = 'Draft from every sentence →';
analyzeButton?.addEventListener('click', () => {
  const sentences = sentenceList(textInput?.value || '');
  if (!sentences.length) { alert('Paste or upload conversation text first.'); return; }
  const existing = new Set([...tasks.map(t => t.title.toLocaleLowerCase()), ...suggestions.map(t => t.title.toLocaleLowerCase())]);
  let duplicates = 0;
  const sourceName = document.querySelector('#source-label')?.value.trim() || 'pasted conversation';
  suggestions = [];
  sentences.forEach(sentence => {
    const title = taskTitle(sentence), key = title.toLocaleLowerCase();
    if (existing.has(key)) { duplicates++; return; }
    existing.add(key);
    suggestions.push({ id: crypto.randomUUID(), title, category: categorize(title), priority: suggestedPriority(title), role: recommendRole(title), stage: 'backlog', blocker: 'none', source: sourceName, dependsOn: [], createdAt: new Date().toISOString(), memory: { sentence, sourceText: sentence, importedFrom: sourceName, reviewState: 'unreviewed' } });
  });
  renderSuggestions();
  if (!suggestions.length) alert(`No new sentence drafts. ${duplicates} sentence${duplicates === 1 ? ' was' : 's were'} already represented in your tasks.`);
});
document.querySelector('#dismiss-all')?.addEventListener('click', () => { suggestions = []; renderSuggestions(); });
fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Please choose a file smaller than 5 MB.'); fileInput.value = ''; return; }
  try { textInput.value = await file.text(); const label = document.querySelector('#source-label'); if (label) label.value = file.name; }
  catch { alert('Could not read that file. Please try a plain text or JSON export.'); }
  fileInput.value = '';
});
roleFilter?.addEventListener('change', render);
categoryFilter?.addEventListener('change', render);
terminalForm?.addEventListener('submit', event => {
  event.preventDefault();
  const input = terminalInput?.value.trim();
  if (!input) { appendTerminalLine('No sentence received. Try again with a single task sentence.', 'warn'); return; }
  const plan = buildSentencePlan(input);
  appendTerminalLine(`$ cat build "${plan.title}"`);
  appendTerminalLine(`> intent: ${plan.intent}`, 'muted');
  appendTerminalLine(`> role: ${plan.role}`, 'muted');
  appendTerminalLine(`> category: ${plan.category}`, 'muted');
  appendTerminalLine(`> priority: ${plan.priority}`, 'muted');
  appendTerminalLine(`> sequence: ${plan.sequence.join(' → ')}`, 'muted');
  if (tasks.some(task => task.title.toLowerCase() === plan.title.toLowerCase())) {
    appendTerminalLine('> task already exists in backlog. No new task created.', 'warn'); terminalInput.value = ''; return;
  }
  tasks.unshift({ id: crypto.randomUUID(), title: plan.title, done: false, category: plan.category, priority: plan.priority, role: plan.role, stage: 'backlog', blocker: 'none', source: 'auto-terminal', dependsOn: [], createdAt: new Date().toISOString(), memory: { sentence: input, intent: plan.intent, sequence: plan.sequence, autoBuilt: true } });
  if (save()) { refreshFilters(); render(); appendTerminalLine(`> built task: "${plan.title}"`, 'ok'); }
  terminalInput.value = '';
});
document.querySelector('#add-form')?.addEventListener('submit', event => {
  event.preventDefault(); const input = document.querySelector('#new-task'); const title = input.value.trim(); if (!title) return;
  tasks.unshift({ id: crypto.randomUUID(), title, done: false, category: categorize(title), priority: 'normal', role: recommendRole(title), stage: 'backlog', blocker: 'none', source: 'manual', dependsOn: [], createdAt: new Date().toISOString(), memory: { sentence: title } });
  input.value = ''; save(); refreshFilters(); render();
});
document.querySelector('#task-search')?.addEventListener('input', render);
document.querySelector('#task-filter')?.addEventListener('change', render);
document.querySelector('#clear')?.addEventListener('click', () => { if (!tasks.length || confirm('Clear all saved tasks from this browser?')) { tasks = []; save(); refreshFilters(); render(); } });
document.querySelector('#export')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'C@T Copilot', exportedAt: new Date().toISOString(), tasks }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = Object.assign(document.createElement('a'), { href: url, download: 'cat-copilot-tasks.json' }); link.click(); URL.revokeObjectURL(url);
});
function renderSuggestions() {
  if (!suggestionsList || !suggestionsPanel) return;
  suggestionsList.replaceChildren();
  suggestions.forEach(item => {
    const li = document.createElement('li'); li.className = 'suggestion';
    const body = document.createElement('div'); body.className = 'suggestion-body';
    const title = document.createElement('p'); title.className = 'suggestion-title'; title.textContent = item.title;
    const meta = document.createElement('span'); meta.className = 'metadata'; meta.textContent = `${item.category} · ${item.priority} priority · ${item.source}`;
    const role = makeSelect('role-select', roles, item.role, null, `Suggested assistant role for ${item.title}`); role.addEventListener('change', () => { item.role = role.value; });
    body.append(title, meta);
    const actions = document.createElement('div'); actions.className = 'suggestion-actions'; actions.append(role);
    actions.append(makeButton('Add task', 'small-primary', () => { item.memory.reviewState = 'accepted'; tasks.unshift({ ...item, done: false }); suggestions = suggestions.filter(s => s.id !== item.id); save(); refreshFilters(); render(); renderSuggestions(); }));
    actions.append(makeButton('Dismiss', 'small-quiet', () => { suggestions = suggestions.filter(s => s.id !== item.id); renderSuggestions(); }));
    li.append(body, actions); suggestionsList.append(li);
  });
  if (suggestionCount) suggestionCount.textContent = String(suggestions.length);
  suggestionsPanel.hidden = suggestions.length === 0;
}
function renderBoard() {
  if (!board) return; board.replaceChildren();
  const role = roleFilter?.value || 'all', category = categoryFilter?.value || 'all';
  const filtered = tasks.filter(task => (role === 'all' || task.role === role) && (category === 'all' || task.category === category));
  stages.forEach(stage => {
    const column = document.createElement('div'); column.className = 'board-column';
    const header = document.createElement('div'); header.className = 'board-header';
    const title = document.createElement('strong'); title.textContent = stageLabels[stage];
    const badge = document.createElement('span'); badge.textContent = String(filtered.filter(t => t.stage === stage).length); header.append(title, badge);
    const body = document.createElement('div'); body.className = 'board-body';
    const rows = filtered.filter(t => t.stage === stage);
    if (!rows.length) { const empty = document.createElement('div'); empty.className = 'board-empty'; empty.textContent = 'No tasks'; body.append(empty); }
    rows.forEach(task => {
      const card = document.createElement('div'); card.className = 'board-card';
      const text = document.createElement('div'); text.className = 'board-card-text';
      const name = document.createElement('strong'); name.textContent = task.title;
      const meta = document.createElement('small'); meta.textContent = `${task.category} · ${task.role}`; text.append(name, meta);
      const controls = document.createElement('div'); controls.className = 'board-card-controls';
      const priority = document.createElement('span'); priority.className = `pill ${task.priority}`; priority.textContent = task.priority;
      const stageSelect = makeSelect('stage-select', stages, task.stage, stageLabels, `Stage for ${task.title}`);
      stageSelect.addEventListener('change', () => { task.stage = stageSelect.value; task.done = task.stage === 'done'; save(); render(); });
      controls.append(priority, stageSelect); card.append(text, controls); body.append(card);
    });
    column.append(header, body); board.append(column);
  });
}
function renderTimeline() {
  if (!timeline) return; timeline.replaceChildren();
  const entries = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  if (!entries.length) { const empty = document.createElement('li'); empty.className = 'timeline-empty'; empty.textContent = 'No memory yet. Add reviewed tasks to build a history.'; timeline.append(empty); return; }
  entries.forEach(task => {
    const li = document.createElement('li'); li.className = 'timeline-item'; const dot = document.createElement('span'); dot.className = 'timeline-dot';
    const content = document.createElement('div'); content.className = 'timeline-content'; const title = document.createElement('strong'); title.textContent = task.title;
    const meta = document.createElement('small'); meta.textContent = `${new Date(task.createdAt).toLocaleString()} · ${task.source} · ${task.category} · ${task.role}`;
    content.append(title, meta); li.append(dot, content); timeline.append(li);
  });
}
function renderDependencies() {
  if (!dependencySummary) return; dependencySummary.replaceChildren();
  const active = tasks.filter(t => t.blocker !== 'none' || t.dependsOn.length);
  if (!active.length) { const empty = document.createElement('div'); empty.className = 'dependency-empty'; empty.textContent = 'No blockers or dependencies yet.'; dependencySummary.append(empty); return; }
  active.slice(0, 10).forEach(task => {
    const card = document.createElement('div'); card.className = 'dependency-card'; const title = document.createElement('strong'); title.textContent = task.title;
    const detail = document.createElement('div'); detail.className = 'dependency-detail'; detail.textContent = `Stage: ${stageLabels[task.stage]} · Blocker: ${blockerLabels[task.blocker]}`;
    const deps = document.createElement('small'); deps.textContent = task.dependsOn.length ? `Depends on: ${task.dependsOn.join(', ')}` : 'No direct dependency';
    card.append(title, detail, deps); dependencySummary.append(card);
  });
}
function render() {
  if (!taskList) return; taskList.replaceChildren();
  const query = document.querySelector('#task-search')?.value.trim().toLowerCase() || '';
  const filter = document.querySelector('#task-filter')?.value || 'all';
  const visible = tasks.filter(task => (!query || `${task.title} ${task.category} ${task.role} ${task.source}`.toLowerCase().includes(query)) && (filter === 'all' || (filter === 'done') === task.done));
  visible.forEach(task => {
    const li = document.createElement('li'); li.className = `task${task.done ? ' completed' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done; checkbox.setAttribute('aria-label', `Mark ${task.title} ${task.done ? 'not done' : 'done'}`);
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; if (task.done) task.stage = 'done'; save(); render(); });
    const body = document.createElement('div'); body.className = 'task-body'; const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
    const meta = document.createElement('span'); meta.className = 'metadata'; meta.textContent = `${task.category} · ${task.role} · ${stageLabels[task.stage]}`;
    const source = document.createElement('small'); source.className = 'source'; source.textContent = `From: ${task.source}`; body.append(title, meta, source);
    const role = makeSelect('role-select', roles, task.role, null, `Assistant role for ${task.title}`); role.addEventListener('change', () => { task.role = role.value; save(); refreshFilters(); render(); });
    const stage = makeSelect('stage-select', stages, task.stage, stageLabels, `Stage for ${task.title}`); stage.addEventListener('change', () => { task.stage = stage.value; task.done = stage.value === 'done'; save(); render(); });
    const blocker = makeSelect('blocker-select', blockers, task.blocker, blockerLabels, `Blocker state for ${task.title}`); blocker.addEventListener('change', () => { task.blocker = blocker.value; save(); render(); });
    const priority = makeSelect('priority', ['low', 'normal', 'high'], task.priority, { low: 'Low', normal: 'Normal', high: 'High' }, `Priority for ${task.title}`); priority.addEventListener('change', () => { task.priority = priority.value; save(); render(); });
    const remove = makeButton('×', 'remove', () => { tasks = tasks.filter(t => t.id !== task.id); save(); refreshFilters(); render(); }, `Remove ${task.title}`);
    li.append(checkbox, body, role, stage, blocker, priority, remove); taskList.append(li);
  });
  if (emptyState) { emptyState.hidden = visible.length > 0; emptyState.textContent = tasks.length ? 'No tasks match this search or filter.' : 'Your tasks will appear here. Analyze text above or add a task manually.'; }
  if (count) count.textContent = String(tasks.length);
  const total = document.querySelector('#total-stat'), open = document.querySelector('#open-stat'), done = document.querySelector('#done-stat');
  if (total) total.textContent = String(tasks.length); if (open) open.textContent = String(tasks.filter(t => !t.done).length); if (done) done.textContent = String(tasks.filter(t => t.done).length);
  renderBoard(); renderTimeline(); renderDependencies(); refreshFilters();
}
refreshFilters(); render();
