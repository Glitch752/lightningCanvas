import { courseAssignmentsDataRegistry } from "$lib/server/canvas/assignments";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
    assignments: await courseAssignmentsDataRegistry.get([params.instanceId, params.courseId]).load()
});
