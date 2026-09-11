import type { PageServerLoad } from "./$types";
import { courseData, plannerItems as plannerItemData } from "$lib/server/canvas";

export const load: PageServerLoad = async () => {
	const [courses, plannerItems] = await Promise.all([
		courseData.load(),
		plannerItemData.load()
	]);
	return { courses, plannerItems };
};
