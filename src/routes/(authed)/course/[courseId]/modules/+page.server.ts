import type { PageServerLoad } from "./$types";
import { courseModulesData } from "$lib/server/canvas";

export const load: PageServerLoad = async ({ params }) => ({
	modules: await courseModulesData(params.courseId).load()
});