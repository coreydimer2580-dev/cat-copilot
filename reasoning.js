(() => {
  'use strict';
  const NOTES_KEY = 'cat-copilot-truth-notes-v1';
  const GLOSSARY_KEY = 'cat-copilot-user-glossary-v1';
  const get = id => document.getElementById(id);
  const safeLoad = (key, predicate) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value.filter(predicate) : [];
    } catch { return []; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { window.alert('Could not save: browser storage may be full. Export or remove local notes first.'); return false; }
  };
  let truthNotes = safeLoad(NOTES_KEY, item => item && typeof item.claim === 'string');
  let glossary = safeLoad(GLOSSARY_KEY, item => item && typeof item.term === 'string' && typeof item.meaning === 'string');

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function renderNotes() {
    const list = get('truth-list');
    list.replaceChildren();
    truthNotes.forEach((note, index) => {
      const row = node('li', 'note');
      const head = node('div', 'note-head');
      const title = node('strong', '', note.claim);
      const remove = node('button', 'remove', 'Remove');
      remove.type = 'button'; remove.setAttribute('aria-label', `Remove truth note: ${note.claim}`);
      remove.addEventListener('click', () => { truthNotes.splice(index, 1); if (save(NOTES_KEY, truthNotes)) renderNotes(); });
      head.append(title, remove);
      row.append(head, node('span', 'status', note.status), node('small', '', `Source: ${note.source || 'Not provided'} · Saved locally`));
      list.append(row);
    });
  }
  function renderGlossary() {
    const list = get('glossary-list');
    list.replaceChildren();
    glossary.forEach((entry, index) => {
      const row = node('li', 'note');
      const head = node('div', 'note-head');
      head.append(node('strong', '', entry.term));
      const remove = node('button', 'remove', 'Remove');
      remove.type = 'button'; remove.setAttribute('aria-label', `Remove glossary entry: ${entry.term}`);
      remove.addEventListener('click', () => { glossary.splice(index, 1); if (save(GLOSSARY_KEY, glossary)) renderGlossary(); });
      head.append(remove); row.append(head, node('p', '', entry.meaning)); list.append(row);
    });
  }

  get('plan-form').addEventListener('submit', event => {
    event.preventDefault();
    const request = get('request').value.trim();
    if (!request) return;
    const lens = get('lens').value;
    const result = get('plan-result');
    result.replaceChildren();
    const title = node('h3', '', 'Reviewable plan (heuristic; not a verified answer)');
    const requestLine = node('p', '', `Goal: ${request}`);
    const lensLine = node('p', '', `Lens: ${get('lens').selectedOptions[0].textContent}`);
    const bullets = node('ul');
    const items = {
      'first-principles': ['State the outcome you want in observable terms.', 'List requirements, constraints, and what is still unknown.', 'Choose the smallest safe next step and check the result.'],
      'pros-cons': ['List likely benefits and who receives them.', 'List costs, risks, and possible unintended effects.', 'Compare options and choose a reversible next step where practical.'],
      evidence: ['Separate the request into checkable claims.', 'Mark each claim as sourced, uncertain, or not checked.', 'Verify important facts with reliable, independent sources before relying on them.'],
      'user-impact': ['Identify who could be affected and what they need.', 'Check consent, accessibility, privacy, and possible harms.', 'Prefer a helpful, proportionate action that the affected person can review.']
    }[lens];
    items.forEach(item => bullets.append(node('li', '', item)));
    result.append(title, requestLine, lensLine, bullets);
    if (/\b(bypass|evade|work around|disable|hide|avoid detection|prohibited|illegal)\b/i.test(request)) {
      result.append(node('p', 'caveat', 'This wording may involve evading a safeguard. C@T will not help disguise or bypass protections. Reframe the goal as an authorized, benign outcome; possible routes include a toy demonstration, approved test environment, public guidance, or a non-sensitive alternative.'));
    }
    result.append(node('p', 'caveat', 'This page has no connected model or external fact-checking. It cannot learn from other AIs automatically. Treat this as a planning template, not proof that the steps are correct or complete.'));
    result.hidden = false;
  });

  get('truth-form').addEventListener('submit', event => {
    event.preventDefault();
    truthNotes.unshift({ claim: get('claim').value.trim(), source: get('source').value.trim(), status: get('confidence').selectedOptions[0].textContent, savedAt: new Date().toISOString() });
    if (save(NOTES_KEY, truthNotes)) { event.target.reset(); renderNotes(); }
  });

  get('glossary-form').addEventListener('submit', event => {
    event.preventDefault();
    const term = get('term').value.trim();
    const meaning = get('meaning').value.trim();
    if (!term || !meaning) return;
    glossary = glossary.filter(item => item.term.toLowerCase() !== term.toLowerCase());
    glossary.unshift({ term, meaning, updatedAt: new Date().toISOString() });
    if (save(GLOSSARY_KEY, glossary)) { event.target.reset(); renderGlossary(); }
  });

  renderNotes();
  renderGlossary();
})();
