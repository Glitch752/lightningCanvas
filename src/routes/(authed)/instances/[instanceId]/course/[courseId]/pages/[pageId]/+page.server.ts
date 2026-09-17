import { coursePageDataRegistry } from "$lib/server/canvas/pages";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
    page: await coursePageDataRegistry.get([params.instanceId, params.courseId, params.pageId]).load()
});