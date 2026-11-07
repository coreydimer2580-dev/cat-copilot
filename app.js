const STORAGE_KEY = 'cat-copilot-tasks-v1';
const textInput = document.querySelector('#conversation');
const fileInput = document.querySelector('#file-input');
const taskList = document.querySelector('#tasks');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#task-count');
const suggestionsPanel = document.querySelector('#suggestions-panel');
const suggestionsList = document.querySelector('#suggestions');
const suggestionCount = document.querySelector('#suggestion-count');
const roles = ['Human review', 'Local/private work', 'Coding assistant', 'Research assistant', 'Writing assistant', 'General assistant'];
let tasks = loadTasks();
let suggestions = [];

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(t => t && typeof t.title === 'string').map(t => ({
      id: t.id || crypto.randomUUID(), title: t.title, done: Boolean(t.done),
      category: t.category || categorize(t.title), priority: ['low', 'normal', 'high'].includes(t.priority) ? t.priority : 'normal',
      role: roles.includes(t.role) ? t.role : recommendRole(t.title)
    })) : [];
  } catch { return []; }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function sentenceList(text) {
  return text.replace(/\r/g, '').split(/(?<=[.!?])\s+|\n+/).map(s => s.trim().replace(/^[-*•\d.)\s]+/, '')).filter(Boolean);
}
function taskTitle(sentence) {
  let clean = sentence.replace(/^(please\s+)?(can you\s+|could you\s+|would you\s+)?(please\s+)?/i, '').trim();
  clean = clean.replace(/^(i want to|i need to|i'd like to|we need to|we should|let's)\s+/i, '');
  clean = clean.replace(/[.!?]+$/, '').trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : '';
}
function isActionable(sentence) {
  return /\b(build|create|make|add|implement|fix|restore|recover|import|export|connect|integrate|automate|set up|setup|install|write|design|test|review|secure|prevent|support|enable|update|change|track|organize|turn|generate|develop|please|need to|want to|should|todo|task)\b/i.test(sentence);
}
function categorize(title) {
  if (/\b(import|export|data|history|recover|restore)\b/i.test(title)) return 'Data';
  if (/\b(secur|privacy|approval|consent|guard|permission)\b/i.test(title)) return 'Safety';
  if (/\b(test|fix|bug|review|validate)\b/i.test(title)) return 'Quality';
  if (/\b(build|create|design|interface|chat|app|assistant|code|implement)\b/i.test(title)) return 'Product';
  return 'General';
}
function recommendRole(title) {
  if (/\b(send|submit|pay|delete|approve|legal|claim|insurance|medical|financial|external action)\b/i.test(title)) return 'Human review';
  if (/\b(code|coding|build|debug|implement|software|app|test|deploy|automate)\b/i.test(title)) return 'Coding assistant';
  if (/\b(research|find|search|compare|verify|source|investigate|evidence)\b/i.test(title)) return 'Research assistant';
  if (/\b(write|draft|summarize|letter|document|explain)\b/i.test(title)) return 'Writing assistant';
  if (/\b(private|local|sensitive|personal|data|history|recover)\b/i.test(title)) return 'Local/private work';
  return 'General assistant';
}
function suggestedPriority(title) {
  return /\b(critical|urgent|security|privacy|recover|restore|block|prevent)\b/i.test(title) ? 'high' : 'normal';
}
function makeButton(label, className, action, ariaLabel = label) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = className; button.textContent = label;
  button.setAttribute('aria-label', ariaLabel); button.addEventListener('click', action);
  return button;
}
function makeRoleSelect(value, label) {
  const select = document.createElement('select'); select.className = 'role-select';
  select.setAttribute('aria-label', label);
  roles.forEach(role => { const option = document.createElement('option'); option.value = role; option.textContent = role; option.selected = role === value; select.append(option); });
  return select;
}

document.querySelector('#analyze').addEventListener('click', () => {
  const sentences = sentenceList(textInput.value);
  const existing = new Set([...tasks.map(t => t.title.toLowerCase()), ...suggestions.map(t => t.title.toLowerCase())]);
  suggestions = sentences.filter(isActionable).map(taskTitle).filter(Boolean).filter(title => !existing.has(title.toLowerCase()))
    .map(title => ({ id: crypto.randomUUID(), title, category: categorize(title), priority: suggestedPriority(title), role: recommendRole(title) }));
  if (!suggestions.length) {
    alert(sentences.length ? 'No new task-like sentences were found. You can add a task manually.' : 'Paste or upload conversation text first.');
    renderSuggestions(); return;
  }
  renderSuggestions();
});
document.querySelector('#dismiss-all').addEventListener('click', () => { suggestions = []; renderSuggestions(); });
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Please choose a file smaller than 5 MB.'); fileInput.value = ''; return; }
  try { textInput.value = await file.text(); }
  catch { alert('Could not read that file. Please try a plain text or JSON export.'); }
  fileInput.value = '';
});
document.querySelector('#add-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#new-task');
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({ id: crypto.randomUUID(), title, done: false, category: categorize(title), priority: 'normal', role: recommendRole(title) });
  input.value = ''; save(); render();
});
document.querySelector('#task-search').addEventListener('input', render);
document.querySelector('#task-filter').addEventListener('change', render);
document.querySelector('#clear').addEventListener('click', () => {
  if (!tasks.length || confirm('Clear all saved tasks from this browser?')) { tasks = []; save(); render(); }
});
document.querySelector('#export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'C@T Copilot', exportedAt: new Date().toISOString(), tasks }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: 'cat-copilot-tasks.json' });
  link.click(); URL.revokeObjectURL(url);
});
function renderSuggestions() {
  suggestionsList.replaceChildren();
  suggestions.forEach(item => {
    const li = document.createElement('li'); li.className = 'suggestion';
    const body = document.createElement('div'); body.className = 'suggestion-body';
    const title = document.createElement('p'); title.className = 'suggestion-title'; title.textContent = item.title;
    const meta = document.createElement('span'); meta.className = 'metadata'; meta.textContent = `${item.category} · ${item.priority} priority`;
    const role = makeRoleSelect(item.role, `Suggested assistant role for ${item.title}`);
    role.addEventListener('change', () => { item.role = role.value; });
    body.append(title, meta);
    const actions = document.createElement('div'); actions.className = 'suggestion-actions';
    actions.append(role);
    actions.append(makeButton('Add task', 'small-primary', () => {
      tasks.unshift({ ...item, done: false }); suggestions = suggestions.filter(s => s.id !== item.id); save(); render(); renderSuggestions();
    }));
    actions.append(makeButton('Dismiss', 'small-quiet', () => { suggestions = suggestions.filter(s => s.id !== item.id); renderSuggestions(); }));
    li.append(body, actions); suggestionsList.append(li);
  });
  suggestionCount.textContent = String(suggestions.length);
  suggestionsPanel.hidden = suggestions.length === 0;
}
function render() {
  taskList.replaceChildren();
  const query = document.querySelector('#task-search').value.trim().toLowerCase();
  const filter = document.querySelector('#task-filter').value;
  const visible = tasks.filter(task => (!query || `${task.title} ${task.category} ${task.role}`.toLowerCase().includes(query)) && (filter === 'all' || (filter === 'done') === task.done));
  visible.forEach(task => {
    const li = document.createElement('li'); li.className = `task${task.done ? ' completed' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark ${task.title} ${task.done ? 'not done' : 'done'}`);
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; save(); render(); });
    const body = document.createElement('div'); body.className = 'task-body';
    const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
    const meta = document.createElement('span'); meta.className = 'metadata'; meta.textContent = `${task.category} · ${task.role}`;
    body.append(title, meta);
    const role = makeRoleSelect(task.role, `Assistant role for ${task.title}`);
    role.addEventListener('change', () => { task.role = role.value; save(); render(); });
    const priority = document.createElement('select'); priority.className = 'priority'; priority.setAttribute('aria-label', `Priority for ${task.title}`);
    ['low', 'normal', 'high'].forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = `${value[0].toUpperCase()}${value.slice(1)}`; option.selected = task.priority === value; priority.append(option); });
    priority.addEventListener('change', () => { task.priority = priority.value; save(); });
    const remove = makeButton('×', 'remove', () => { tasks = tasks.filter(t => t.id !== task.id); save(); render(); }, `Remove ${task.title}`);
    li.append(checkbox, body, role, priority, remove); taskList.append(li);
  });
  emptyState.hidden = visible.length > 0;
  emptyState.textContent = tasks.length ? 'No tasks match this search or filter.' : 'Your tasks will appear here. Analyze text above or add a task manually.';
  count.textContent = String(tasks.length);
  document.querySelector('#total-stat').textContent = String(tasks.length);
  document.querySelector('#open-stat').textContent = String(tasks.filter(t => !t.done).length);
  document.querySelector('#done-stat').textContent = String(tasks.filter(t => t.done).length);
}
render();
