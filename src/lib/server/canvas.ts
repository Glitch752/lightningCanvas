import { getSettings } from "./settings";
import { DynamicData } from "./dynamicData";
import { ImmutableFetchedData } from "./data";
import coursesQuery from "./queries/courses.gql?raw";

export type CanvasCourse = {
	id: number;

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
					_id: number;
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
}

function stripGQLWhitespace(query: string): string {
	return query.replace(/\s+/g, " ").trim();
}

/** fetch data from the Canvas API */
async function canvasFetch<T>(path: string, headers: Record<string, string> = {}): Promise<T | null> {
    const settings = await getSettings();
    if(!settings.canvasHostname || !settings.canvasApiKey) return null;

	console.log("fetching Canvas data", path);
    const response = await fetch(`${settings.canvasHostname}${path}`, {
        headers: { Authorization: `Bearer ${settings.canvasApiKey}`, ...headers }
    });

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
	refreshIntervalMs: 1000 * 60 * 60 * 24 * 7,
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
