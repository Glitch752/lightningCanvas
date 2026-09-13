import type { PageServerLoad } from "./$types";
import { courseData, courseHomeData } from "$lib/server/canvas";

export const load: PageServerLoad = async ({ params }) => ({
	courses: await courseData.load(),
	courseHome: await courseHomeData(params.courseId).load()
});