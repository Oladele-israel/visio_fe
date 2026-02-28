export interface Column {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  value: string | number | boolean
}

export interface Row {
  id: number
  [key: string]: string | number | boolean | undefined
  _relations?: Record<string, number>
  _relationData?: Record<string, Row[]>
}

export interface Table {
  name: string
  columns: Array<{ name: string; type: 'string' | 'number' | 'date' | 'boolean' }>
  rows: Row[]
  relations: Record<string, string> // column -> related table
}

export const sampleDatabase: Record<string, Table> = {
  users: {
    name: 'users',
    columns: [
      { name: 'id', type: 'number' },
      { name: 'name', type: 'string' },
      { name: 'email', type: 'string' },
      { name: 'created_at', type: 'date' },
      { name: 'active', type: 'boolean' },
    ],
    rows: [
      {
        id: 1,
        name: 'Alice Chen',
        email: 'alice@example.com',
        created_at: '2024-01-15',
        active: true,
        _relations: { posts: 8, comments: 23 },
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob@example.com',
        created_at: '2024-01-16',
        active: true,
        _relations: { posts: 5, comments: 12 },
      },
      {
        id: 3,
        name: 'Charlie Davis',
        email: 'charlie@example.com',
        created_at: '2024-01-17',
        active: false,
        _relations: { posts: 0, comments: 3 },
      },
      {
        id: 4,
        name: 'Diana Wilson',
        email: 'diana@example.com',
        created_at: '2024-01-18',
        active: true,
        _relations: { posts: 12, comments: 45 },
      },
      {
        id: 5,
        name: 'Eve Johnson',
        email: 'eve@example.com',
        created_at: '2024-01-19',
        active: true,
        _relations: { posts: 3, comments: 8 },
      },
    ],
    relations: {
      posts: 'posts',
      comments: 'comments',
    },
  },

  posts: {
    name: 'posts',
    columns: [
      { name: 'id', type: 'number' },
      { name: 'user_id', type: 'number' },
      { name: 'title', type: 'string' },
      { name: 'created_at', type: 'date' },
      { name: 'views', type: 'number' },
    ],
    rows: [
      {
        id: 1,
        user_id: 1,
        title: 'My First Blog Post',
        created_at: '2024-02-01',
        views: 234,
        _relations: { comments: 8, user: 1 },
      },
      {
        id: 2,
        user_id: 1,
        title: 'Reflections on Design',
        created_at: '2024-02-05',
        views: 567,
        _relations: { comments: 12, user: 1 },
      },
      {
        id: 3,
        user_id: 2,
        title: 'Getting Started with Node.js',
        created_at: '2024-02-03',
        views: 1200,
        _relations: { comments: 45, user: 2 },
      },
      {
        id: 4,
        user_id: 4,
        title: 'Advanced React Patterns',
        created_at: '2024-02-06',
        views: 892,
        _relations: { comments: 34, user: 4 },
      },
      {
        id: 5,
        user_id: 4,
        title: 'Database Optimization Tips',
        created_at: '2024-02-07',
        views: 456,
        _relations: { comments: 23, user: 4 },
      },
    ],
    relations: {
      user_id: 'users',
      comments: 'comments',
    },
  },

  comments: {
    name: 'comments',
    columns: [
      { name: 'id', type: 'number' },
      { name: 'post_id', type: 'number' },
      { name: 'user_id', type: 'number' },
      { name: 'text', type: 'string' },
      { name: 'created_at', type: 'date' },
    ],
    rows: [
      {
        id: 1,
        post_id: 1,
        user_id: 2,
        text: 'Great post! Very helpful.',
        created_at: '2024-02-02',
        _relations: { post: 1, user: 2 },
      },
      {
        id: 2,
        post_id: 1,
        user_id: 3,
        text: 'I disagree with your approach',
        created_at: '2024-02-03',
        _relations: { post: 1, user: 3 },
      },
      {
        id: 3,
        post_id: 3,
        user_id: 1,
        text: 'Thanks for the tutorial!',
        created_at: '2024-02-04',
        _relations: { post: 3, user: 1 },
      },
      {
        id: 4,
        post_id: 4,
        user_id: 5,
        text: 'Could you explain this more?',
        created_at: '2024-02-07',
        _relations: { post: 4, user: 5 },
      },
      {
        id: 5,
        post_id: 2,
        user_id: 4,
        text: 'Excellent insights!',
        created_at: '2024-02-06',
        _relations: { post: 2, user: 4 },
      },
    ],
    relations: {
      post_id: 'posts',
      user_id: 'users',
    },
  },
}


export const dashboardStats = {
  totalTables: 12,
  totalRows: 145820,
  activeConnections: 3,
  queriesLastMinute: 48,
  failedQueries: 2,
  uptime: "14 days 6 hours",
}

export const activityLogs = [
  {
    id: 1,
    action: "Query Executed",
    table: "users",
    time: "2 mins ago",
  },
  {
    id: 2,
    action: "Table Scanned",
    table: "orders",
    time: "5 mins ago",
  },
  {
    id: 3,
    action: "Row Updated",
    table: "products",
    time: "12 mins ago",
  },
]

export const activeConnections = [
  {
    id: "conn-1",
    database: "sample_db",
    user: "admin",
    status: "active",
    ip: "192.168.1.10",
  },
  {
    id: "conn-2",
    database: "sample_db",
    user: "viewer",
    status: "idle",
    ip: "192.168.1.12",
  },
]



export interface MetricPoint {
  time: string
  queries: number
  activeConnections: number
  failedQueries: number
}

let listeners: ((data: MetricPoint) => void)[] = []

// Simulate live streaming
export function startMetricStream() {
  setInterval(() => {
    const newPoint: MetricPoint = {
      time: new Date().toLocaleTimeString(),
      queries: Math.floor(Math.random() * 100),
      activeConnections: Math.floor(Math.random() * 10),
      failedQueries: Math.floor(Math.random() * 5),
    }

    listeners.forEach(listener => listener(newPoint))
  }, 3000) // every 3 seconds
}

export function subscribeToMetrics(callback: (data: MetricPoint) => void) {
  listeners.push(callback)

  return () => {
    listeners = listeners.filter(l => l !== callback)
  }
}