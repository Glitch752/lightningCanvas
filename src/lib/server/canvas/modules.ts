import { canvasFetch } from "../canvas";
import { DynamicDataRegistry, DynamicData } from "../dynamicData";

export type CanvasCourseModules = { modules: CanvasModule[]; };
export type CanvasModuleItemType = "File" | "Page" | "Discussion" | "Assignment" | "Quiz" | "ExternalUrl" | "SubHeader";
export type CanvasModuleItem = {
    id: number;
    title: string;
    type: CanvasModuleItemType | string;
    content_id?: number;
    page_url?: string;
    external_url?: string;
    url?: string;
    indent: number;
    position: number;
    completion_requirement?: { type: string; completed?: boolean; };
};
export type CanvasModule = {
    id: number;
    name: string;
    position: number;
    items_count: number;
    state?: string;
    items: CanvasModuleItem[];
};

/** dynamic data for course modules */
export const courseModulesDataRegistry = new DynamicDataRegistry<[instanceId: string, courseId: string], CanvasCourseModules>(([instanceId, courseId]) => new DynamicData<CanvasCourseModules>({
	key: `instances/${instanceId}/courses/${courseId}/modules`,
    ttlMs: 1000 * 60 * 60 * 24 * 30,
    requireInitialFetch: false,
	refreshThresholdMs: 1000 * 60 * 15,
    refreshIntervalMs: 1000 * 60 * 60 * 24,
	fetch: async () => {
		const modules = await canvasFetch<CanvasModule[]>(
            instanceId, `/api/v1/courses/${encodeURIComponent(courseId)}/modules?include[]=items&per_page=500`
        );
		return { modules: (modules ?? []).toSorted((a, b) => a.position - b.position) };
	}
}));