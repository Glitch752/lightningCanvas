import { courseGradesDataRegistry } from "$lib/server/canvas/grades";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
	grades: await courseGradesDataRegistry.get([params.instanceId, params.courseId]).load()
});