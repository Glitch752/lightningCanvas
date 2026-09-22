import { courseAnnouncementDataRegistry } from "$lib/server/canvas/announcements";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => ({
    announcement: await courseAnnouncementDataRegistry.get([params.instanceId, params.courseId, params.announcementId]).load()
});
