import { courseHomeDataRegistry } from "$lib/server/canvas/home";
import type { PageServerLoad } from "./$types";

// todo: preload a bunch of stuff if it's uncached here

export const load: PageServerLoad = async ({ params }) => ({
	courseHome: await courseHomeDataRegistry.get([params.instanceId, params.courseId]).load()
});