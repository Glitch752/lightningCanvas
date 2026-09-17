import { canvasFetch } from "../canvas";
import { DynamicData, DynamicDataRegistry } from "../dynamicData";

export type CanvasCoursePage = {
    page: {
        title?: string;
        body?: string;
        url?: string;
    } | null;
};

/** dynamic data for an individual Canvas course page. */
export const coursePageDataRegistry = new DynamicDataRegistry<[
    instanceId: string, courseId: string, pageId: string
], CanvasCoursePage>(
    ([instanceId, courseId, pageId]) => {
        return new DynamicData<CanvasCoursePage>({
            key: `courses/${courseId}/pages/${pageId}`,
            ttlMs: 1000 * 60 * 60 * 24 * 30,
            requireInitialFetch: false,
            refreshThresholdMs: 1000 * 60 * 15,
            fetch: async () => ({
                page: await canvasFetch<NonNullable<CanvasCoursePage["page"]>>(
                    instanceId, `/api/v1/courses/${encodeURIComponent(courseId)}/pages/${encodeURIComponent(pageId)}`
                )
            })
        });
    }
);