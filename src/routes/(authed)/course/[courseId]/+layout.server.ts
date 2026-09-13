import { courseGlobalDataRegistry } from "$lib/server/canvas/courses";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params }) => ({
	courseGlobal: await courseGlobalDataRegistry.get(params.courseId).load()
});