import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserWithJunior } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { session } = await getSession(req);

    if (!session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user with juniorId from database
    const userWithJunior = await getUserWithJunior(session.user.id);

    if (!userWithJunior) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: userWithJunior.id,
      email: userWithJunior.email,
      name: userWithJunior.name,
      role: userWithJunior.role,
      juniorId: userWithJunior.juniorId,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
