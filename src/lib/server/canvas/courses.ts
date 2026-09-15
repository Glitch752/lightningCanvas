import { canvasFetch, canvasGraphqlFetch, userId } from "../canvas";
import { DynamicDataRegistry, DynamicData } from "../dynamicData";
import coursesQuery from "../queries/courses.gql?raw";

type CoursesQueryResponse = {
	data: {
		legacyNode: {
			enrollments: {
				course: {
					_id: string;
					courseCode: string;
					courseNickname?: string;
					name: string;
					term: {
						name: string;
					};
					dashboardCard?: {
						position: number;
						image?: string;
					};
				};
				grades: {
					currentGrade: string | null;
					currentScore: number | null;
				};
			}[];
		};
	};
};

export type CanvasCourse = {
    id: string;
    displayedName: string;
    courseCode: string;
    fullName: string;
    termName: string;
    dashboardPosition: number;
    imageUrl?: string;
    grade: { currentGrade: string | null; currentScore: number | null; };
};
export type CanvasCourseTab = {
	id: string;
	label: string;
	type: string;
	href?: string;
	html_url?: string;
	visibility?: string;
	hidden?: boolean;
};
export type CanvasCourseGlobal = { course: CanvasCourse | null; tabs: CanvasCourseTab[] };

export type PlannerItem = {
    context_type: "Course" | string;
    context_name: string;
    course_id: number;
    submissions: { submitted: boolean; feedback?: { comment?: string; }; };
    plannable_id: string;
    plannable_type: "assignment" | "quiz" | string;
    plannable_date: string;
    plannable: { id: string; title: string; points_possible: number; due_at: string; };
	planner_override: {
		// this type is actually a lot more complicated but for now we'll just care about completion
		marked_complete: boolean;
	} | null;
};

/** dynamic data source for course data */
export const courseData = new DynamicData<CanvasCourse[] | null>({
	key: "canvas-courses",
	ttlMs: 1000 * 60 * 60 * 24 * 30,
	requireInitialFetch: true,
	refreshThresholdMs: 1000 * 60 * 60, // courses don't change often, but we say 1 hour to be safe
	fetch: async () => {
		const uid = await userId.get();
		if(uid === null) return null;

		const data = await canvasGraphqlFetch<CoursesQueryResponse>(coursesQuery, { userId: uid });
		if(!data) {
			console.warn("Canvas GraphQL fetch returned no data");
			return null;
		}
		
		return data.data.legacyNode.enrollments.map((enrollment) => ({
			id: enrollment.course._id,
			displayedName: enrollment.course.courseNickname ?? enrollment.course.name,
			courseCode: enrollment.course.courseCode,
			fullName: enrollment.course.name,
			termName: enrollment.course.term.name,
			dashboardPosition: enrollment.course.dashboardCard?.position ?? 0,
			imageUrl: enrollment.course.dashboardCard?.image ?? undefined,
			grade: {
				currentGrade: enrollment.grades.currentGrade,
				currentScore: enrollment.grades.currentScore
			}
		}));
	}
});

/**
 * dynamic data source for planner items. we unfortunately can't gather this data through GraphQL (it just
 * doesn't support it), so we need to make a few REST requests. oh well.
 */
export const plannerItems = new DynamicData<PlannerItem[] | null>({
	key: "planner-items",
	ttlMs: 1000 * 60 * 60 * 24 * 30,
	requireInitialFetch: false,
	refreshIntervalMs: 1000 * 60 * 60 * 1, // refresh every hour
	refreshThresholdMs: 1000 * 60 * 10, // likely to change pretty often
	fetch: async () => {
		const uid = await userId.get();
		if(uid === null) return null;


		// 7 days ago is arbitrary but meh
		const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
		const data = await canvasFetch<PlannerItem[]>(`/api/v1/planner/items?start_date=${startDate}&order=asc&per_page=30`);
		if(!data) {
			console.warn("Canvas planner items fetch returned no data");
			return null;
		}
		
		return data.map(v => ({
			...v,
			
			// remove some unnecessary data
			context_image: undefined,
			html_url: undefined
		}));
	}
});

/** dynamic data for every page in a course, like navigation tabs. */
export const courseGlobalDataRegistry = new DynamicDataRegistry<string, CanvasCourseGlobal>((courseId) => new DynamicData<CanvasCourseGlobal>({
	key: `courses/${courseId}/global`, ttlMs: 1000 * 60 * 60 * 24 * 30, requireInitialFetch: true,
	refreshThresholdMs: 1000 * 60 * 60,
	fetch: async () => {
		const courses = await courseData.get();
		const course = courses?.value?.find((item) => item.id === courseId) ?? null;
		const tabs = await canvasFetch<CanvasCourseTab[]>(`/api/v1/courses/${encodeURIComponent(courseId)}/tabs`);
		return { course, tabs: tabs ?? [] };
	}
}));
