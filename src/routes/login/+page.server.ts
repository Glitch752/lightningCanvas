import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSessionCookie, passwordIsValid } from '$lib/server/auth';

/** safely redirect to a given path, ensuring it's relative */
const safeRedirect = (value: string | null) =>
	value && value.startsWith('/') && !value.startsWith('//') ? value : '/';

export const load: PageServerLoad = ({ url }) => ({
	redirectTo: safeRedirect(url.searchParams.get('redirectTo'))
});

export const actions: Actions = {
	default: async ({ cookies, request, url }) => {
		// if successfully authenticated, redirect to redirectTo; otherwise, 401
		
		const formData = await request.formData();
		const password = formData.get('password');
		const redirectTo = safeRedirect(String(formData.get('redirectTo')) || url.searchParams.get('redirectTo') || "/");

		if(typeof password !== 'string' || !passwordIsValid(password)) {
			return fail(401, { incorrect: true, redirectTo });
		}

		const session = createSessionCookie();
		cookies.set(session.name, session.value, session.options);
		throw redirect(303, redirectTo);
	}
};