import { courseAssignmentDataRegistry } from "$lib/server/canvas/assignments";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
    assignment: await courseAssignmentDataRegistry.get(`${params.courseId}/${params.assignmentId}`).load()
});
