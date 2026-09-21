import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { updateVisualSettings } from "$lib/settings";
import { getSettings, saveSettings } from "$lib/server/settings";
import { clearDynamicDataCache } from "$lib/server/dynamicData";

function readString(formData: FormData, key: string): string {
	const value = formData.get(key);
	if(typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
	return value.trim();
}

function getInstances(formData: FormData) {
	const count = Number(formData.get("instanceCount"));
	if(!Number.isInteger(count) || count < 0) throw new Error("Invalid instance list");

	const ids = new Set<string>();
	return Array.from({ length: count }, (_, index) => {
		const name = readString(formData, `instance.${index}.name`);
		const hostnameValue = readString(formData, `instance.${index}.hostname`);
		const apiKey = readString(formData, `instance.${index}.apiKey`);
		const url = new URL(hostnameValue);
		if(url.protocol !== "https:") throw new Error("Canvas hostname must start with 'https://'");

		const hostname = url.origin;
		const baseId = new URL(hostnameValue).hostname.split(".")[0] || "canvas";
		let id = baseId;
		let suffix = 1;
		while(ids.has(id)) id = `${baseId}-${suffix++}`;
		ids.add(id);

		return { name, hostname, apiKey, id };
	});
}

export const actions: Actions = {
	clearCache: async () => {
		await clearDynamicDataCache();
		return { cacheCleared: true, message: "Cleared dynamic data cache" };
	},

	saveSettings: async ({ request }) => {
		const formData = await request.formData();

		try {
			const currentSettings = await getSettings();
			await saveSettings({
				canvasInstances: getInstances(formData),
				visual: updateVisualSettings(formData, currentSettings)
			});
			return { saved: true };
		} catch(error) {
			return fail(400, { error: error instanceof Error ? error.message : "Invalid Canvas hostname" });
		}
	}
};