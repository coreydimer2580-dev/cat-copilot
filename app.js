const STORAGE_KEY = 'cat-copilot-tasks-v1';
const textInput = document.querySelector('#conversation');
const fileInput = document.querySelector('#file-input');
const taskList = document.querySelector('#tasks');
const emptyState = document.querySelector('#empty-state');
const count = document.querySelector('#task-count');

let tasks = loadTasks();
render();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(t => t && typeof t.title === 'string') : [];
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
  if (!clean) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
function isActionable(sentence) {
  return /\b(build|create|make|add|implement|fix|restore|recover|import|export|connect|integrate|automate|set up|setup|install|write|design|test|review|secure|prevent|support|enable|update|change|track|organize|turn|generate|develop|please|need to|want to|should|todo|task)\b/i.test(sentence);
}
document.querySelector('#analyze').addEventListener('click', () => {
  const sentences = sentenceList(textInput.value);
  const existing = new Set(tasks.map(t => t.title.toLowerCase()));
  const suggestions = sentences.filter(isActionable).map(taskTitle).filter(Boolean).filter(title => !existing.has(title.toLowerCase()));
  if (!suggestions.length) {
    alert(sentences.length ? 'No new task-like sentences were found. You can add a task manually.' : 'Paste or upload conversation text first.');
    return;
  }
  suggestions.forEach(title => tasks.unshift({ id: crypto.randomUUID(), title, done: false, reviewed: false, createdAt: new Date().toISOString() }));
  save(); render();
});
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Please choose a file smaller than 5 MB.'); fileInput.value = ''; return; }
  textInput.value = await file.text();
  fileInput.value = '';
});
document.querySelector('#add-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#new-task');
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({ id: crypto.randomUUID(), title, done: false, reviewed: true, createdAt: new Date().toISOString() });
  input.value = ''; save(); render();
});
document.querySelector('#clear').addEventListener('click', () => {
  if (!tasks.length || confirm('Clear all saved tasks from this browser?')) { tasks = []; save(); render(); }
});
document.querySelector('#export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ app: 'C@T Copilot', exportedAt: new Date().toISOString(), tasks }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: 'cat-copilot-tasks.json' });
  link.click(); URL.revokeObjectURL(url);
});
function render() {
  taskList.replaceChildren();
  tasks.forEach(task => {
    const li = document.createElement('li'); li.className = `task${task.done ? ' completed' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = !!task.done; checkbox.setAttribute('aria-label', `Mark ${task.title} ${task.done ? 'not done' : 'done'}`);
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; save(); render(); });
    const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
    const remove = document.createElement('button'); remove.className = 'remove'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${task.title}`);
    remove.addEventListener('click', () => { tasks = tasks.filter(t => t.id !== task.id); save(); render(); });
    li.append(checkbox, title, remove); taskList.append(li);
  });
  emptyState.hidden = tasks.length > 0;
  count.textContent = String(tasks.length);
}
