const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');
const VALID_STAGES = ['queued', 'running', 'shipped'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helpers ---
function readTasks() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

function nextId(tasks) {
  return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

// --- Routes ---

// List all tasks
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = readTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Could not read tasks.' });
  }
});

// Create a task
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'A task needs a title.' });
  }

  try {
    const tasks = readTasks();
    const task = {
      id: nextId(tasks),
      title: title.trim(),
      stage: 'queued',
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    writeTasks(tasks);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Could not create the task.' });
  }
});

// Update a task's stage or title
app.patch('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const { stage, title } = req.body;

  if (stage && !VALID_STAGES.includes(stage)) {
    return res.status(400).json({ error: `Stage must be one of: ${VALID_STAGES.join(', ')}` });
  }

  try {
    const tasks = readTasks();
    const task = tasks.find((t) => t.id === id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (stage) task.stage = stage;
    if (title && title.trim()) task.title = title.trim();

    writeTasks(tasks);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Could not update the task.' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);

  try {
    const tasks = readTasks();
    const remaining = tasks.filter((t) => t.id !== id);

    if (remaining.length === tasks.length) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    writeTasks(remaining);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Could not delete the task.' });
  }
});

app.listen(PORT, () => {
  console.log(`ShipIt board running at http://localhost:${PORT}`);
});
