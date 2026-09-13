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
export const coursePageDataRegistry = new DynamicDataRegistry<string, CanvasCoursePage>((key) => {
    const separator = key.indexOf("/");
    const courseId = key.slice(0, separator);
    const pageId = key.slice(separator + 1);

    return new DynamicData<CanvasCoursePage>({
        key: `courses/${courseId}/pages/${pageId}`,
        ttlMs: 1000 * 60 * 60 * 24 * 30,
        requireInitialFetch: true,
        refreshThresholdMs: 1000 * 60 * 15,
        fetch: async () => ({
            page: await canvasFetch<NonNullable<CanvasCoursePage["page"]>>(
                `/api/v1/courses/${encodeURIComponent(courseId)}/pages/${encodeURIComponent(pageId)}`
            )
        })
    });
});