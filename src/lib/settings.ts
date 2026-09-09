/** application-wide settings */
export type Settings = {
	canvasHostname: string;
	canvasApiKey: string;
};

export const defaultSettings: Settings = {
	canvasHostname: "",
	canvasApiKey: ""
};

/** check if a value is a valid Settings object. */
export function isSettings(value: unknown): value is Settings {
	if(typeof value !== "object" || value === null) return false;

	const settings = value as Record<string, unknown>;
	return typeof settings.canvasHostname === "string" && typeof settings.canvasApiKey === "string";
}
