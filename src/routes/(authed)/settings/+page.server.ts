import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { updateVisualSettings } from "$lib/settings";
import { getSettings, saveSettings } from "$lib/server/settings";

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const canvasHostname = formData.get("canvasHostname");
		const canvasApiKey = formData.get("canvasApiKey");

		if(typeof canvasHostname !== "string" || typeof canvasApiKey !== "string") {
			return fail(400, { error: "All settings are required" });
		}

		try {
			const hostname = new URL(canvasHostname);
			if(hostname.protocol !== 'https:') throw new Error("Canvas hostname must start with 'https://'");

			const currentSettings = await getSettings();
			await saveSettings({
				canvasHostname: canvasHostname.replace(/\/$/, ""),
				canvasApiKey,
				visual: updateVisualSettings(formData, currentSettings)
			});
			return { saved: true };
		} catch(error) {
			return fail(400, { error: error instanceof Error ? error.message : "Invalid Canvas hostname" });
		}
	}
};