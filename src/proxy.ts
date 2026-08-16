import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'ib_session_id';
const USER_COOKIE_NAME = 'ib_user_id';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const userId = request.cookies.get(USER_COOKIE_NAME)?.value;

    // Redirect unauthenticated requests to login in non-test runtime environments
    if (!userId && process.env.NODE_ENV !== 'test' && process.env.USE_IN_MEMORY_DB !== 'true') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

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