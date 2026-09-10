import { readFile, writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { defaultSettings, isSettings, type Settings } from "$lib/settings";
import { dataDirectory } from "./data";

const settingsPath = join(dataDirectory, "settings.json");

/** get the current settings */
export async function getSettings(): Promise<Settings> {
	try {
		const contents = await readFile(settingsPath, "utf8");
		const parsed: unknown = JSON.parse(contents);
		return isSettings(parsed) ? parsed : { ...defaultSettings };
	} catch(error) {
		if((error as NodeJS.ErrnoException).code === "ENOENT") return { ...defaultSettings };
		throw error;
	}
}

/** save the given settings */
export async function saveSettings(settings: Settings): Promise<void> {
	await mkdir(dirname(settingsPath), { recursive: true });
	await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}
