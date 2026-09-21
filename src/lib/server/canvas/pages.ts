import { canvasFetch } from "../canvas";
import { DynamicData, DynamicDataRegistry } from "../dynamicData";

export type CanvasCoursePage = {
    page: {
        title?: string;
        body?: string;
        url?: string;
    } | null;
};

export type CanvasPageSummary = {
    page_id: number;
    url: string;
    title: string;
    created_at: string;
    updated_at: string;
    published: boolean;
};

export type CanvasCoursePages = { pages: CanvasPageSummary[] };

/** dynamic data for all Canvas pages in a course. */
export const coursePagesDataRegistry = new DynamicDataRegistry<[
    instanceId: string, courseId: string
], CanvasCoursePages>(([instanceId, courseId]) => new DynamicData<CanvasCoursePages>({
    key: `instances/${instanceId}/courses/${courseId}/pages`,
    ttlMs: 1000 * 60 * 60 * 24 * 30,
    requireInitialFetch: true,
    refreshThresholdMs: 1000 * 60 * 15,
    fetch: async () => {
        const pages = await canvasFetch<CanvasPageSummary[]>(
            instanceId,
            `/api/v1/courses/${encodeURIComponent(courseId)}/pages?sort=title&order=asc&per_page=500`
        );
        return { pages: pages ?? [] };
    }
}));

/** dynamic data for an individual Canvas course page. */
export const coursePageDataRegistry = new DynamicDataRegistry<[
    instanceId: string, courseId: string, pageId: string
], CanvasCoursePage>(
    ([instanceId, courseId, pageId]) => {
        return new DynamicData<CanvasCoursePage>({
            key: `instances/${instanceId}/courses/${courseId}/pages/${pageId}`,
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