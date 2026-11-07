const CHAT_KEY = 'cat-copilot-local-chat-v1';
const TASKS_KEY = 'cat-copilot-tasks-v1';
const messagesEl = document.querySelector('#chat-messages');
const form = document.querySelector('#chat-form');
const input = document.querySelector('#chat-input');
const voiceButton = document.querySelector('#voice-input');
const voiceStatus = document.querySelector('#voice-status');
const speakReplies = document.querySelector('#speak-replies');
let history = loadHistory();
let recognition = null;

function loadHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(message =>
      message && ['user', 'agent'].includes(message.role) && typeof message.text === 'string'
    ).slice(-100) : [];
  } catch { return []; }
}

function saveHistory() {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-100))); }
  catch { voiceStatus.textContent = 'Could not save chat history in this browser.'; }
}

function getTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(task => task && typeof task.title === 'string') : [];
  } catch { return []; }
}

function addMessage(role, text, shouldSpeak = false) {
  const message = { role, text, at: new Date().toISOString() };
  history.push(message);
  history = history.slice(-100);
  saveHistory();
  renderMessage(message);
  if (role === 'agent' && shouldSpeak && speakReplies.checked) speak(text);
}

function renderMessage(message) {
  const item = document.createElement('article');
  item.className = `chat-message ${message.role === 'user' ? 'from-user' : 'from-agent'}`;
  const label = document.createElement('span');
  label.className = 'chat-author';
  label.textContent = message.role === 'user' ? 'You' : 'C@T local companion';
  const text = document.createElement('p');
  text.textContent = message.text;
  item.append(label, text);
  messagesEl.append(item);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function taskSnapshot() {
  const tasks = getTasks();
  const completed = tasks.filter(task => task.done || task.stage === 'done').length;
  const waiting = tasks.filter(task => task.stage === 'waiting' || (task.blocker && task.blocker !== 'none')).length;
  return { tasks, completed, waiting, open: tasks.length - completed };
}

function localReply(text) {
  const message = text.toLowerCase();
  const { tasks, completed, waiting, open } = taskSnapshot();
  if (/\b(hello|hi|hey|hiya|howdy)\b/.test(message)) {
    return 'Hey! I’m your local C@T companion. I can chat about the tasks saved in this browser. What would you like to work on?';
  }
  if (/\b(help|what can you do|commands)\b/.test(message)) {
    return 'I can give a simple task-board summary, find task titles by keyword, and explain how this local demo works. I can’t contact other AI services, fetch private history, or perform external actions.';
  }
  if (/\b(how many|status|progress|summary|what tasks|my tasks|task list)\b/.test(message)) {
    if (!tasks.length) return 'There are no tasks saved in this browser yet. Add one manually or paste conversation text and review the task suggestions.';
    const next = tasks.filter(task => !task.done && task.stage !== 'done').slice(0, 3).map(task => `“${task.title}”`).join('; ');
    return `Your board has ${tasks.length} task${tasks.length === 1 ? '' : 's'}: ${open} open, ${completed} completed, and ${waiting} waiting or blocked.${next ? ` Here are up to three open items: ${next}.` : ''}`;
  }
  if (/\b(search|find|look for)\b/.test(message) && tasks.length) {
    const terms = message.replace(/\b(search|find|look for|tasks?|about|for|in|my|please|can you|could you)\b/g, ' ').split(/\s+/).filter(word => word.length > 2);
    const matches = tasks.filter(task => terms.some(term => task.title.toLowerCase().includes(term)));
    return matches.length ? `I found ${matches.length} matching task${matches.length === 1 ? '' : 's'}: ${matches.slice(0, 5).map(task => `“${task.title}”`).join('; ')}.` : 'I didn’t find a matching task in this browser’s saved task list.';
  }
  if (/\b(build|upgrade|improve|feature|add)\b/.test(message)) {
    return 'I can help plan the next improvement. This demo agent only replies locally; it does not edit code or send tasks to a model. Add the idea to your task list if you want to track it.';
  }
  if (/\b(thanks|thank you|cheers)\b/.test(message)) return 'You’re welcome! I’m here in this browser whenever you want to organize the next step.';
  return 'I hear you. I’m a simple local companion, so I can’t generate open-ended AI replies yet. I can summarize or search your saved task list; no message is sent outside this browser.';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addMessage('user', text);
  input.value = '';
  const reply = localReply(text);
  window.setTimeout(() => addMessage('agent', reply, true), 250);
});

document.querySelector('#clear-chat').addEventListener('click', () => {
  if (!history.length || confirm('Clear the local chat history from this browser?')) {
    history = [];
    saveHistory();
    messagesEl.replaceChildren();
    addMessage('agent', 'Chat cleared. I’m ready when you are.');
  }
});

history.forEach(renderMessage);
if (!history.length) {
  addMessage('agent', 'Hi! I’m the C@T local companion. Try “What tasks are open?” or “Help”. This is a local demo, not a connected AI model.');
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = navigator.language || 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.addEventListener('start', () => { voiceStatus.textContent = 'Listening… use your browser prompt to allow microphone access.'; });
  recognition.addEventListener('result', event => {
    input.value = event.results[0][0].transcript;
    input.focus();
    voiceStatus.textContent = 'Voice captured. Press Send when you’re ready.';
  });
  recognition.addEventListener('error', event => { voiceStatus.textContent = `Voice input unavailable: ${event.error}. You can type instead.`; });
  recognition.addEventListener('end', () => {
    if (voiceStatus.textContent === 'Listening… use your browser prompt to allow microphone access.') voiceStatus.textContent = 'Voice capture ended.';
  });
  voiceButton.addEventListener('click', () => {
    try { recognition.start(); }
    catch { voiceStatus.textContent = 'Voice capture is already active. Try again in a moment.'; }
  });
} else {
  voiceButton.disabled = true;
  voiceStatus.textContent = 'Voice input is not supported in this browser. You can type instead.';
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    voiceStatus.textContent = 'Spoken replies are not supported in this browser.';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = navigator.language || 'en-US';
  window.speechSynthesis.speak(utterance);
}
