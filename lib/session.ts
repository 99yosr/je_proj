import { SessionOptions } from 'iron-session'

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!, // must be 32+ chars
  cookieName: 'myapp_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

// Type for session user
declare module 'iron-session' {
  interface IronSessionData {
    user?: { id: string; email: string }
  }
}
