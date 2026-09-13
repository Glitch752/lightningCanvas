import type { PageServerLoad } from "./$types";
import { courseHomeData } from "$lib/server/canvas";

export const load: PageServerLoad = async ({ params }) => ({
	courseHome: await courseHomeData(params.courseId).load()
});