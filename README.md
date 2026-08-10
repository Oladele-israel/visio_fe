# Visio Frontend (`visio_fe`)

> Modern, interactive database visualizer, real-time telemetry dashboard, and AI SQL workspace for PostgreSQL.

Visio is a Next.js web application designed to visually navigate complex database schemas, inspect foreign key relationships, execute natural-language and SQL queries, and monitor live database performance metrics. Paired with `visio-agent`, Visio provides instant access to local or cloud databases without exposing sensitive network ports or credentials.

---

## ✨ Features

- **Entity-Relationship Visualizer**: Interactive canvas for visualizing tables, columns, primary keys, and foreign key connections.
- **Data & Row Explorer**: Browse table contents, filter rows, and inspect nested relational data nodes.
- **Real-Time Telemetry**: Live performance dashboards monitoring QPS, connection pool latency, and table sizes.
- **Zero-Trust Connection Tunneling**: Connect seamlessly to local development databases (`127.0.0.1:5432`) via `visio-agent`.
- **Modern Dark-Mode Aesthetic**: Styled with TailwindCSS, Radix UI primitives, Lucide iconography, and Recharts telemetry graphics.
- **Secure Authentication**: Built-in session management using Better-Auth and Prisma ORM.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Styling**: TailwindCSS & Radix UI primitives
- **ORM & Auth**: Prisma & Better-Auth
- **Visualization**: Recharts & Custom SVG Graph Canvas
- **Database Client**: `pg` (node-postgres) & Neon Serverless Driver

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.x or v20.x
- **pnpm** (or `npm` / `yarn`)
- A running PostgreSQL database (or `visio-agent` running locally)

### 2. Environment Setup

Create a `.env` file in `visio_fe/`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/visio_db?sslmode=disable"
BETTER_AUTH_SECRET="your-super-secret-auth-key"
BETTER_AUTH_URL="http://localhost:3000"
```

### 3. Installation & Database Migration

```bash
# Install dependencies
pnpm install

# Generate Prisma Client & Run Migrations
npx prisma migrate dev
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔗 Connecting to Local Databases via `visio-agent`

To connect Visio Frontend to your local development database (`127.0.0.1:5432`):

1. Start `visio-agent` in your terminal:
   ```bash
   npx visio-agent
   ```
2. Navigate to **Connections** in Visio Frontend and click **Add New Connection**.
3. Select **Local Agent Bridge**, enter your agent endpoint (`http://127.0.0.1:4567`), and choose your local database.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts Next.js dev server on port 3000 |
| `pnpm build` | Runs Prisma migrations and builds production bundle |
| `pnpm start` | Runs production server |
| `pnpm lint` | Runs ESLint analysis |

---

## 📄 License

[MIT License](LICENSE) © 2026 Visio Team
