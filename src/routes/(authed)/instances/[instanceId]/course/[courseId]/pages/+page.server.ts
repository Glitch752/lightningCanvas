import { coursePagesDataRegistry } from "$lib/server/canvas/pages";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
    pages: await coursePagesDataRegistry.get([params.instanceId, params.courseId]).load()
});
