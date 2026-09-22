import { canvasFetch } from "../canvas";
import { DynamicData, DynamicDataRegistry } from "../dynamicData";

export type CanvasAnnouncement = {
    id: number;
    title: string;
    message: string;
    posted_at: string;
    updated_at?: string;
    author?: { id: number; display_name: string; avatar_image_url?: string };
    html_url?: string;
    read_state?: "read" | "unread";
};

export type CanvasCourseAnnouncements = { announcements: CanvasAnnouncement[] };

/** dynamic data for course announcements */
export const courseAnnouncementsDataRegistry = new DynamicDataRegistry<[
    instanceId: string, courseId: string
], CanvasCourseAnnouncements>(([instanceId, courseId]) => new DynamicData<CanvasCourseAnnouncements>({
    key: `instances/${instanceId}/courses/${courseId}/announcements`,
    ttlMs: 1000 * 60 * 60 * 24 * 30,
    requireInitialFetch: true,
    refreshThresholdMs: 1000 * 60 * 15,
    fetch: async () => {
        const announcements = await canvasFetch<CanvasAnnouncement[]>(
            instanceId,
            `/api/v1/courses/${encodeURIComponent(courseId)}/discussion_topics?only_announcements=true&per_page=500`
        );
        return {
            announcements: (announcements ?? []).toSorted((a, b) =>
                new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
            )
        };
    }
}));

/** dynamic data for an individual course announcement */
export const courseAnnouncementDataRegistry = new DynamicDataRegistry<[
    instanceId: string, courseId: string, announcementId: string
], CanvasAnnouncement | null>(([instanceId, courseId, announcementId]) => new DynamicData<CanvasAnnouncement | null>({
    key: `instances/${instanceId}/courses/${courseId}/announcements/${announcementId}`,
    ttlMs: 1000 * 60 * 60 * 24 * 30,
    requireInitialFetch: true,
    refreshThresholdMs: 1000 * 60 * 15,
    fetch: () => canvasFetch<CanvasAnnouncement>(
        instanceId,
        `/api/v1/courses/${encodeURIComponent(courseId)}/discussion_topics/${encodeURIComponent(announcementId)}`
    )
}));
