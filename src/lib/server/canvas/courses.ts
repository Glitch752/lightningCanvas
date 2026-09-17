import { canvasFetch, canvasGraphqlFetch, userId } from "../canvas";
import { DynamicDataRegistry, DynamicData } from "../dynamicData";
import coursesQuery from "../queries/courses.gql?raw";
import { getSettings } from "../settings";

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
	instanceId: string;
	
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

/** the canvas API response for a planner item */
export type CanvasAPIPlannerItemResponse = {
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

	// blah blah a bunch of other stuff
};

/** the planner item type we send to clients */
export type CanvasPlannerItem = {
	plannerOverride?: { markedComplete: boolean; };
	submissions?: { submitted: boolean; feedback?: { comment?: string; }; };
	
	plannableType: "assignment" | "quiz" | string;
	plannableId: string;
	plannableDate: string;
	plannable: { id: string; title: string; pointsPossible: number; dueAt: string; };
	contextType: "Course" | string;
	
	instanceId: string;
	courseId: number;
}

/** dynamic data source for course data */
export const courseData = new DynamicData<CanvasCourse[] | null>({
	key: "canvas-courses",
	ttlMs: 1000 * 60 * 60 * 24 * 30,
	requireInitialFetch: false,
	refreshThresholdMs: 1000 * 60 * 60, // courses don't change often, but we say 1 hour to be safe
	fetch: async () => {
		const userIds = await userId.get();
		if(userIds === null) return null;

		const settings = await getSettings();
		const instanceResponses = await Promise.all(
			settings.canvasInstances.map(async (instance) => {
				const userId = userIds[instance.id];
				if(!userId) {
					console.warn(`No user ID for instance ${instance.id}, skipping course fetch`);
					return null;
				}
				const data = await canvasGraphqlFetch<CoursesQueryResponse>(instance.id, coursesQuery, { userId });
				if(!data) {
					console.warn(`Canvas GraphQL fetch for instance ${instance.id} returned no data`);
					return null;
				}
				return { id: instance.id, data };
			})
		);
		
		return instanceResponses.filter(i => !!i).flatMap(i =>
			i.data.data.legacyNode.enrollments.map((enrollment) => ({
				id: enrollment.course._id,
				instanceId: i.id,
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
			}))
		);
	}
});

export function transformAPIPlannerItem(item: CanvasAPIPlannerItemResponse, instanceId: string): CanvasPlannerItem {
	return {
		plannerOverride: item.planner_override ? {
			markedComplete: item.planner_override.marked_complete
		} : undefined,
		submissions: item.submissions ? {
			submitted: item.submissions.submitted,
			feedback: item.submissions.feedback ? { comment: item.submissions.feedback.comment } : undefined
		} : undefined,

		plannableType: item.plannable_type,
		plannableId: item.plannable_id,
		plannableDate: item.plannable_date,
		plannable: {
			id: item.plannable.id,
			title: item.plannable.title,
			pointsPossible: item.plannable.points_possible,
			dueAt: item.plannable.due_at
		},
		contextType: item.context_type,
		
		instanceId: instanceId,
		courseId: item.course_id
	};
}

/**
 * dynamic data source for planner items. we unfortunately can't gather this data through GraphQL (it just
 * doesn't support it), so we need to make a few REST requests. oh well.
 */
export const plannerItems = new DynamicData<CanvasPlannerItem[] | null>({
	key: "planner-items",
	ttlMs: 1000 * 60 * 60 * 24 * 30,
	requireInitialFetch: false,
	refreshIntervalMs: 1000 * 60 * 60 * 1, // refresh every hour
	refreshThresholdMs: 1000 * 60 * 10, // likely to change pretty often
	fetch: async () => {
		const uid = await userId.get();
		if(uid === null) {
			console.error("Planner items fetch attempted with no user ID");
			return Promise.reject("No user ID");
		}

		// 7 days ago is arbitrary but meh
		const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
		
		const settings = await getSettings();
		const instanceResponses = await Promise.all(
			settings.canvasInstances.map(async (instance) => {
				const data = await canvasFetch<CanvasAPIPlannerItemResponse[]>(instance.id, `/api/v1/planner/items?start_date=${startDate}&order=asc&per_page=30`);
				if(!data) {
					console.warn(`Canvas planner items fetch for instance ${instance.id} returned no data`);
					return null;
				}
				return { id: instance.id, data };
			})
		);

		return instanceResponses
			.filter(i => !!i)
			.flatMap(i => i.data.map((item) => transformAPIPlannerItem(item, i.id)));
	}
});

/** dynamic data for every page in a course, like navigation tabs. */
export const courseGlobalDataRegistry = new DynamicDataRegistry<[instanceId: string, courseId: string], CanvasCourseGlobal>(
	([instanceId, courseId]) => new DynamicData<CanvasCourseGlobal>({
		key: `instances/${instanceId}/courses/${courseId}/global`, ttlMs: 1000 * 60 * 60 * 24 * 30, requireInitialFetch: true,
		refreshThresholdMs: 1000 * 60 * 60,
		fetch: async () => {
			const courses = await courseData.get();
			const course = courses?.value?.find((item) => item.id === courseId) ?? null;
			const tabs = await canvasFetch<CanvasCourseTab[]>(instanceId, `/api/v1/courses/${encodeURIComponent(courseId)}/tabs`);
			return { course, tabs: tabs ?? [] };
		}
	})
);
