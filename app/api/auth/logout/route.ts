import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/session'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    const session = await getIronSession(await cookies(), sessionOptions)

    // Destroy the session
    session.destroy()

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
}
