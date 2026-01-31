import 'iron-session'

export interface SessionData {
  user?: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'RJE'
  }
}

declare module 'iron-session' {
  interface IronSessionData extends SessionData {}
}