import { courseModulesDataRegistry } from "$lib/server/canvas/modules";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
	modules: await courseModulesDataRegistry.get([params.instanceId, params.courseId]).load()
});