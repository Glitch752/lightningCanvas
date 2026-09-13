import { courseData, plannerItems } from "$lib/server/canvas/courses";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const [courses, plannerItemData] = await Promise.all([
		courseData.load(),
		plannerItems.load()
	]);
	return { courses, plannerItems: plannerItemData };
};
