import { getSettings } from "./settings";
import { DynamicData } from "./dynamicData";
import { ImmutableFetchedData } from "./data";
import coursesQuery from "./queries/courses.gql?raw";

export type CanvasCourse = {
	id: string;

	displayedName: string;
	courseCode: string;
	fullName: string;

	termName: string;
	
	dashboardPosition: number;
	imageUrl?: string;
	
	grade: {
		currentGrade: string | null;
		currentScore: number | null;
	}
};
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
					}
				};
				grades: {
					currentGrade: string | null;
					currentScore: number | null;
				};
			}[]
		}
	}
};

export type PlannerItem = {
	context_type: "Course" | string;
	context_name: string;
	course_id: number;

	submissions: {
		submitted: boolean;
		feedback?: {
			comment?: string;
		}
	};

	plannable_id: string;
	plannable_type: "assignment" | string;
	plannable_date: string;
	plannable: {
		id: string;
		title: string;
		points_possible: number;
		due_at: string;
	};
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

export type CanvasCourseHome = {
	course: CanvasCourse | null;
	tabs: CanvasCourseTab[];
	page: { title?: string; body?: string } | null;
	plannerItems: PlannerItem[] | null;
};

function stripGQLWhitespace(query: string): string {
	return query.replace(/\s+/g, " ").trim();
}

/** fetch data from the Canvas API */
async function canvasFetch<T>(path: string, headers: Record<string, string> = {}): Promise<T | null> {
    const settings = await getSettings();
    if(!settings.canvasHostname || !settings.canvasApiKey) return null;

	console.log("fetching Canvas data", path);
	let time = Date.now();
    const response = await fetch(`${settings.canvasHostname}${path}`, {
        headers: { Authorization: `Bearer ${settings.canvasApiKey}`, ...headers }
    });
	console.log(`Canvas fetch ${path} took ${Date.now() - time}ms`);

    if(!response.ok) throw new Error(`Canvas request failed (${response.status})`);
    return await response.json() as T;
}
async function canvasGraphqlFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
	const settings = await getSettings();
	if(!settings.canvasHostname || !settings.canvasApiKey) return null;

	const response = await fetch(`${settings.canvasHostname}/api/graphql`, {
		method: "POST",
		body: JSON.stringify({ query: stripGQLWhitespace(query), variables }),
		headers: { Authorization: `Bearer ${settings.canvasApiKey}`, "Content-Type": "application/json" }
	});

	if(!response.ok) throw new Error(`Canvas GraphQL request failed (${response.status})`);
	return await response.json() as T;
}

/** data source for user data */
export const userId = new ImmutableFetchedData<number | null, string>({
	path: "canvas-user-id.json",
	fetch: async (key) => {
		if(!key) return null;
		
		const user = await canvasFetch<{ id: number }>("/api/v1/users/self");
		return user?.id ?? null;
	},
	key: () => getSettings().then((settings) => settings.canvasApiKey ?? "")
});

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
	refreshThresholdMs: 1000 * 60 * 5, // likely to change pretty often
	fetch: async () => {
		const uid = await userId.get();
		if(uid === null) return null;

		// 5 days ago is arbitrary but meh
		const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
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

const courseHomeDataSources = new Map<string, DynamicData<CanvasCourseHome>>();

/** Dynamic data for a course home page and its course-scoped todo/feedback. */
export function courseHomeData(courseId: string): DynamicData<CanvasCourseHome> {
	let source = courseHomeDataSources.get(courseId);
	if(source) return source;

	source = new DynamicData<CanvasCourseHome>({
		key: `canvas-course-home-${courseId}`,
		ttlMs: 1000 * 60 * 60 * 24 * 30,
		requireInitialFetch: true,
		refreshThresholdMs: 1000 * 60 * 5,
		refreshIntervalMs: 1000 * 60 * 60,
		fetch: async () => {
			const uid = await userId.get();
			const courses = await courseData.get();
			const course = courses?.value?.find((item) => item.id === courseId) ?? null;
			if(uid === null) return { course, tabs: [], page: null, plannerItems: null };

			const startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();
			const [tabs, page, planner] = await Promise.all([
				canvasFetch<CanvasCourseTab[]>(`/api/v1/courses/${encodeURIComponent(courseId)}/tabs`),
				canvasFetch<{ title?: string; body?: string }>(`/api/v1/courses/${encodeURIComponent(courseId)}/front_page`),
				canvasFetch<PlannerItem[]>(
					`/api/v1/planner/items?start_date=${encodeURIComponent(startDate)}&order=asc&per_page=30&context_codes[]=course_${encodeURIComponent(courseId)}&context_codes[]=user_${encodeURIComponent(String(uid))}`
				)
			]);

			return {
				course,
				tabs: tabs ?? [],
				page,
				plannerItems: planner?.map((item) => ({ ...item, context_image: undefined, html_url: undefined })) ?? null
			};
		}
	});
	courseHomeDataSources.set(courseId, source);
	return source;
}
