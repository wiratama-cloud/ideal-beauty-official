import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'ib_session_id';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    const sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};