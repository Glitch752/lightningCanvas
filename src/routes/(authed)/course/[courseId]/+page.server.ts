import { courseHomeDataRegistry } from "$lib/server/canvas/home";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
	courseHome: await courseHomeDataRegistry.get(params.courseId).load()
});