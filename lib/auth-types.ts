export interface User {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
  token?: string
}

export interface DatabaseConnection {
  id: string
  name: string
  type: 'postgresql' | 'mysql' | 'sqlite'
  host: string
  port: number
  database: string
  username: string
  // Password is never sent to client after initial creation
  createdAt: string
  updatedAt: string
}

export interface ConnectionListResponse {
  success: boolean
  connections: DatabaseConnection[]
}

export interface CreateConnectionRequest {
  name: string
  type: 'postgresql' | 'mysql' | 'sqlite'
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface DeleteConnectionResponse {
  success: boolean
  message: string
}
