import { userId, canvasFetch } from "../canvas";
import { DynamicDataRegistry, DynamicData } from "../dynamicData";
import type { PlannerItem } from "./courses";

export type CanvasCourseHome = {
    page: { title?: string; body?: string; } | null;
    plannerItems: PlannerItem[] | null;
};

/** dynamic data for a course home page and its course-scoped todo/feedback. */
export const courseHomeDataRegistry = new DynamicDataRegistry<string, CanvasCourseHome>((courseId) => new DynamicData<CanvasCourseHome>({
	key: `courses/${courseId}/home`, ttlMs: 1000 * 60 * 60 * 24 * 30, requireInitialFetch: true,
	refreshThresholdMs: 1000 * 60 * 5,
	fetch: async () => {
		const uid = await userId.get();
		if (uid === null) return { page: null, plannerItems: null };
		const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
		const [page, planner] = await Promise.all([
			canvasFetch<{ title?: string; body?: string; }>(`/api/v1/courses/${encodeURIComponent(courseId)}/front_page`),
			canvasFetch<PlannerItem[]>(`/api/v1/planner/items?start_date=${encodeURIComponent(startDate)}&order=asc&per_page=30&context_codes[]=course_${encodeURIComponent(courseId)}&context_codes[]=user_${encodeURIComponent(String(uid))}`)
		]);
		return { page, plannerItems: planner?.map((item) => ({ ...item, context_image: undefined, html_url: undefined })) ?? null };
	}
}));
