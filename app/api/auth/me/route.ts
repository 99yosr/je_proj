import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserWithJunior } from '@/lib/auth';

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user
 *     description: Returns the currently authenticated user's information
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [ADMIN, RJE]
 *                 juniorId:
 *                   type: integer
 *                   nullable: true
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
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
