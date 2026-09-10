import { getSettings } from "./settings";
import { DynamicData } from "./dynamicData";

export type CanvasCourse = {
	id: number;
	name: string;
	course_code?: string;
	workflow_state?: string;

	original_name?: string;
};

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

/** dynamic data source for course data */
export const courseData = new DynamicData<CanvasCourse[] | null>({
	key: "canvas-courses",
	ttlMs: 1000 * 60 * 60 * 24 * 30,
	refreshIntervalMs: 1000 * 60 * 60 * 24 * 7,
	fetch: () => canvasFetch("/api/v1/courses?enrollment_state=active&per_page=100")
});
