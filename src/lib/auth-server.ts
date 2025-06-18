import { createAuth } from '@convex/auth';
import { getToken as getTokenBetterAuth } from '@convex-dev/better-auth/nextjs';
import { betterAuth } from 'better-auth';
import { createCookieGetter } from 'better-auth/cookies';
import { GenericActionCtx } from 'convex/server';
import { cookies } from 'next/headers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGenericActionCtx = GenericActionCtx<any>;

const getTokenLocalBuild = async (
  createAuth: (ctx: AnyGenericActionCtx) => ReturnType<typeof betterAuth>
) => {
  const cookieStore = await cookies();
  const auth = createAuth({} as AnyGenericActionCtx);
  const createCookie = createCookieGetter(auth.options);
  const cookie = createCookie('convex_jwt');
  const token = cookieStore.get(cookie.name);
  const tokenFromCookie = cookieStore.get("better-auth.convex_jwt");

  return token?.value || tokenFromCookie?.value;
};  

// workaround for local build to work with dev convex server
export const getToken = async (
  createAuthFn: (ctx: AnyGenericActionCtx) => ReturnType<typeof betterAuth> = createAuth
) => {
  if (process.env.LOCAL_BUILD === 'true') return getTokenLocalBuild(createAuthFn);
  return getTokenBetterAuth(createAuthFn);
}; 