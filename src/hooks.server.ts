import { redirect, type Handle, type ServerInit } from "@sveltejs/kit";
import { cookieName, createSessionCookie, isAuthenticated } from "$lib/server/auth";
import { applyNewMigrations } from "$lib/server/migrations";
import type { HandleServerError } from "@sveltejs/kit";

// migrations
export const init: ServerInit = async () => {
	await applyNewMigrations();
};

// handle simple auth
export const handle: Handle = ({ event, resolve }) => {
	if(event.url.pathname === '/login') return resolve(event);

	if(isAuthenticated(event.cookies.get(cookieName))) {
		// refresh the token if logged in so it doesn't repeatedly expire
		const session = createSessionCookie();
		event.cookies.set(session.name, session.value, session.options);
		return resolve(event);
	}

	const redirectTo = `${event.url.pathname}${event.url.search}`;
	const loginUrl = new URL('/login', event.url);
	loginUrl.searchParams.set('redirectTo', redirectTo);

	throw redirect(303, loginUrl);
};

export const handleError: HandleServerError = ({ error, message }) => {
    return {
        message: error instanceof Error ? error.message : message,
		stack: error instanceof Error ? error.stack : undefined
    };
};