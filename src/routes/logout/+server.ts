import { redirect } from '@sveltejs/kit';
import { cookieName } from '$lib/server/auth';

// simple logout endpoint to delete the cookie and redirect
export const POST = ({ cookies }) => {
	cookies.delete(cookieName, { path: '/' });
	throw redirect(303, '/login');
};