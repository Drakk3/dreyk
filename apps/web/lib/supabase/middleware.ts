import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from '@dreyk/shared/types/database';

import { getPublicEnv } from '@/lib/config/env';
import { handleError } from '@/shared/lib/errors';

type RequestCookie = ReturnType<NextRequest['cookies']['getAll']>[number];
type ResponseCookies = ReturnType<typeof NextResponse.next>['cookies'];
type ResponseCookieOptions = Parameters<ResponseCookies['set']>[2];

interface SupabaseMiddlewareCookie {
  name: RequestCookie['name'];
  options?: ResponseCookieOptions;
  value: RequestCookie['value'];
}

interface MiddlewareCookieAdapter {
  getAll: () => RequestCookie[];
  setAll: (cookiesToSet: SupabaseMiddlewareCookie[]) => void;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const env = getPublicEnv();
  let response = NextResponse.next({
    request,
  });

  const cookieAdapter: MiddlewareCookieAdapter = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet: SupabaseMiddlewareCookie[]) {
      cookiesToSet.forEach((cookie) => {
        request.cookies.set(cookie.name, cookie.value);
      });

      response = NextResponse.next({
        request,
      });

      cookiesToSet.forEach((cookie) => {
        if (cookie.options === undefined) {
          response.cookies.set(cookie.name, cookie.value);
          return;
        }

        response.cookies.set(cookie.name, cookie.value, cookie.options);
      });
    },
  };

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: cookieAdapter,
  });

  try {
    await supabase.auth.getUser();
  } catch (error: unknown) {
    handleError(error, 'middleware.updateSession');
  }

  return response;
}
