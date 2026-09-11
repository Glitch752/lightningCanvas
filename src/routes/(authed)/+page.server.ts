import type { PageServerLoad } from "./$types";
import { courseData } from "$lib/server/canvas";

export const load: PageServerLoad = async () => {
	return {
		courses: await courseData.load()
	};
};
