import { userId, canvasFetch } from "../canvas";
import { DynamicDataRegistry, DynamicData } from "../dynamicData";
import { transformAPIPlannerItem, type CanvasAPIPlannerItemResponse, type CanvasPlannerItem } from "./courses";
import { courseModulesDataRegistry, type CanvasModule } from "./modules";

export type CanvasCourseHome = {
    home:
		{ page: { title?: string; body?: string; } } |
		{ modules: CanvasModule[] } |
		null;
    plannerItems: CanvasPlannerItem[] | null;
};

async function loadHomeOrModules(instanceId: string, courseId: string): Promise<CanvasCourseHome["home"]> {
	const home = await canvasFetch<{ title?: string; body?: string; }>(
		instanceId, `/api/v1/courses/${encodeURIComponent(courseId)}/front_page`
	).catch(() => null); // assume no front page if the request fails. technically we should check for 404 but wtv

	if(!home || !home.body) {
		// no front page, so load modules instead
		const moduleData = await courseModulesDataRegistry.get([instanceId, courseId]).getOrRefresh();
		const modules = moduleData?.value.modules;
		if(!modules || modules.length === 0) return null;
		return { modules };
	}

	return { page: home };
}

/** dynamic data for a course home page and its course-scoped todo/feedback. */
export const courseHomeDataRegistry = new DynamicDataRegistry<[instanceId: string, courseId: string], CanvasCourseHome>(
	([instanceId, courseId]) => new DynamicData<CanvasCourseHome>({
		key: `instances/${instanceId}/courses/${courseId}/home`,
		ttlMs: 1000 * 60 * 60 * 24 * 30,
		requireInitialFetch: false,
		refreshThresholdMs: 1000 * 60 * 5, // likely to change often
		fetch: async () => {
			const uid = await userId.get();
			if(uid === null) return { home: null, plannerItems: null };

			const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
			const [page, planner] = await Promise.all([
				loadHomeOrModules(instanceId, courseId),
				canvasFetch<CanvasAPIPlannerItemResponse[]>(instanceId, `/api/v1/planner/items?start_date=${encodeURIComponent(startDate)}&order=asc&per_page=30&context_codes[]=course_${encodeURIComponent(courseId)}&context_codes[]=user_${encodeURIComponent(String(uid))}`)
			]);

			return {
				home: page,
				plannerItems: planner?.map((item) => transformAPIPlannerItem(item, instanceId)) ?? null
			};
		},
		schemaVersion: 2
	})
);
