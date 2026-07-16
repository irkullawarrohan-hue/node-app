# ShipIt Board

A small full-stack Node.js task manager, themed as a CI/CD pipeline: every task
moves through **Queued → Running → Shipped** instead of a generic to-do list.

## Stack

- **Backend:** Node.js + Express, REST API, JSON file storage (`data/tasks.json`)
- **Frontend:** Vanilla HTML/CSS/JS (no build step, no framework)

## Run it

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

To use a different port:

```bash
PORT=4000 npm start
```

## API

| Method | Route             | Body                          | Description                |
|--------|--------------------|--------------------------------|-----------------------------|
| GET    | `/api/tasks`       | —                              | List all tasks              |
| POST   | `/api/tasks`       | `{ "title": "..." }`           | Create a task (starts `queued`) |
| PATCH  | `/api/tasks/:id`   | `{ "stage": "running" }`       | Move a task or rename it    |
| DELETE | `/api/tasks/:id`   | —                               | Delete a task                |

Valid `stage` values: `queued`, `running`, `shipped`.

## Project structure

```
shipit-board/
├── server.js           # Express server + REST API
├── data/tasks.json      # Task storage (flat JSON file)
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── package.json
```

## Notes / possible extensions

- Swap `data/tasks.json` for a real database (SQLite/Postgres) if you want it
  to survive across environments or scale beyond a single instance.
- Add auth if you ever deploy this somewhere public — right now anyone who can
  reach the server can read/write all tasks.
- Could be containerized with a simple Dockerfile + deployed via ECS Fargate
  or EKS, similar to your other portfolio projects.
