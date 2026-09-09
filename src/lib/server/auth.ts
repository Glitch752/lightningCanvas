import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const cookieName = 'auth';
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;

/** fallback to password if no secret is set */
const secret = () => env.AUTH_SECRET || env.AUTH_PASSWORD;

function sign(value: string) {
	return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function isAuthenticated(token: string | undefined) {
	if(!token) return false;

	const [expiresAt, signature] = token.split('.');
	if(!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;

	const expected = sign(expiresAt);
	const actualBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expected);

	// like below, timingSafeEqual probably isn't required here but it's just as easy
	return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function passwordIsValid(password: string) {
	// _technically_ this is susceptible to timing attacks, but it really doesn't matter for this project and
	// probably isn't exploitable from network latency and whatever.
	return Boolean(env.AUTH_PASSWORD) && password === env.AUTH_PASSWORD;
}

export function createSessionCookie(): {
	name: string,
	value: string,
	options: import('cookie').CookieSerializeOptions & { path: string }
} {
	const expiresAt = String(Date.now() + sessionLifetimeSeconds * 1000);

	return {
		name: cookieName,
		value: `${expiresAt}.${sign(expiresAt)}`,
		options: {
			httpOnly: true, // we don't care about it in js really
			secure: env.NODE_ENV === 'production', // meh insecure in dev
			sameSite: 'lax' as const,
			path: '/',
			maxAge: sessionLifetimeSeconds
		}
	};
}

export { cookieName };