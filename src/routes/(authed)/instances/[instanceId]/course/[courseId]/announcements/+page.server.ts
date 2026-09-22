import { courseAnnouncementsDataRegistry } from "$lib/server/canvas/announcements";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
    announcements: await courseAnnouncementsDataRegistry.get([params.instanceId, params.courseId]).load()
});
