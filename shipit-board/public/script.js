const STAGES = ['queued', 'running', 'shipped'];
const NEXT_STAGE = { queued: 'running', running: 'shipped' };
const PREV_STAGE = { running: 'queued', shipped: 'running' };
const ADVANCE_LABEL = { queued: 'Run →', running: 'Ship →' };

const composer = document.getElementById('composer');
const taskInput = document.getElementById('taskInput');
const composerError = document.getElementById('composerError');
const cardTemplate = document.getElementById('cardTemplate');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const statusCounts = document.getElementById('statusCounts');

async function fetchTasks() {
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Failed to load tasks');
  return res.json();
}

async function createTask(title) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Could not queue the task.');
  }
  return res.json();
}

async function updateTask(id, patch) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Could not update the task.');
  return res.json();
}

async function deleteTask(id) {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Could not delete the task.');
}

function relativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTaskCode(id) {
  return `#${String(id).padStart(4, '0')}`;
}

function renderCard(task) {
  const node = cardTemplate.content.cloneNode(true);
  const card = node.querySelector('.card');
  card.dataset.stage = task.stage;
  card.dataset.id = task.id;

  node.querySelector('.card__meta').textContent =
    `${formatTaskCode(task.id)} · ${task.stage} ${relativeTime(task.createdAt)}`;
  node.querySelector('.card__title').textContent = task.title;

  const advanceBtn = node.querySelector('.card__btn--advance');
  const backBtn = node.querySelector('.card__btn--back');
  const deleteBtn = node.querySelector('.card__btn--delete');

  advanceBtn.textContent = ADVANCE_LABEL[task.stage] || 'Shipped';
  if (!NEXT_STAGE[task.stage]) advanceBtn.disabled = true;

  advanceBtn.addEventListener('click', async () => {
    const next = NEXT_STAGE[task.stage];
    if (!next) return;
    await updateTask(task.id, { stage: next });
    await refresh();
  });

  backBtn.addEventListener('click', async () => {
    const prev = PREV_STAGE[task.stage];
    if (!prev) return;
    await updateTask(task.id, { stage: prev });
    await refresh();
  });

  deleteBtn.addEventListener('click', async () => {
    await deleteTask(task.id);
    await refresh();
  });

  return node;
}

function renderEmptyState(stage) {
  const div = document.createElement('div');
  div.className = 'column__empty';
  const copy = {
    queued: 'Nothing queued. Add a task above.',
    running: 'Nothing in progress right now.',
    shipped: 'Nothing shipped yet.',
  };
  div.textContent = copy[stage];
  return div;
}

function updateStatusBar(tasks) {
  const inFlight = tasks.filter((t) => t.stage !== 'shipped').length;
  statusCounts.textContent = `${inFlight} task${inFlight === 1 ? '' : 's'} in flight`;

  if (inFlight === 0) {
    statusDot.classList.remove('dot--busy');
    statusText.textContent = 'All systems operational';
  } else {
    statusDot.classList.add('dot--busy');
    statusText.textContent = 'Pipeline active';
  }
}

async function refresh() {
  let tasks;
  try {
    tasks = await fetchTasks();
  } catch (err) {
    statusText.textContent = 'Could not reach the server';
    return;
  }

  STAGES.forEach((stage) => {
    const col = document.getElementById(`col-${stage}`);
    const count = document.getElementById(`count-${stage}`);
    const stageTasks = tasks
      .filter((t) => t.stage === stage)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    col.innerHTML = '';
    count.textContent = stageTasks.length;

    if (stageTasks.length === 0) {
      col.appendChild(renderEmptyState(stage));
    } else {
      stageTasks.forEach((task) => col.appendChild(renderCard(task)));
    }
  });

  updateStatusBar(tasks);
}

composer.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  composerError.hidden = true;

  if (!title) return;

  try {
    await createTask(title);
    taskInput.value = '';
    await refresh();
  } catch (err) {
    composerError.textContent = err.message;
    composerError.hidden = false;
  }
});

refresh();
// Keep timestamps ("3m ago") fresh without a manual reload.
setInterval(refresh, 30000);
