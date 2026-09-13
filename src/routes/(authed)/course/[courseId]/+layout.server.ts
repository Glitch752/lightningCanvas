import type { LayoutServerLoad } from "./$types";
import { courseGlobalData } from "$lib/server/canvas";

export const load: LayoutServerLoad = async ({ params }) => ({
	courseGlobal: await courseGlobalData(params.courseId).load()
});