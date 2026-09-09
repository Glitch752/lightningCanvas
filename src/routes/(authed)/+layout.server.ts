import type { LayoutServerLoad } from "./$types";
import { getSettings } from "$lib/server/settings";

// just always load settings since we need them for the layout anyway
export const load: LayoutServerLoad = async () => ({
	settings: await getSettings()
});
