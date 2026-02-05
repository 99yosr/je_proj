import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../../../lib/session";
import { SessionData } from "../../../../types/iron-session";

export async function GET(req: NextRequest) {
    try {
        const response = new NextResponse();
        const session = await getIronSession<SessionData>(req, response, sessionOptions);

        if (session.user) {
            return NextResponse.json(session.user);
        } else {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
