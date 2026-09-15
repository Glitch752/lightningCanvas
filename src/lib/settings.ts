/** miscellaneous ui-related settings that don't belong to backend logic */
export type VisualSettings = {
	useCourseImages: boolean;
	showBackgroundEffects: boolean;
};

/** visual settings with labels and defaults */
export const visualSettings: {
	[key in keyof VisualSettings]: { label: string, default: VisualSettings[key] }
} = {
	useCourseImages: { label: "Show instructor-defined course images", default: true },
	showBackgroundEffects: { label: "Show background effects", default: true }
}

/** application-wide settings */
export type Settings = {
	canvasHostname: string;
	canvasApiKey: string;
	visual: VisualSettings;
};

export const defaultSettings: Settings = {
	canvasHostname: "",
	canvasApiKey: "",
	visual: Object.fromEntries(Object.entries(visualSettings).map(([key, value]) => [key, value.default])) as VisualSettings
};

/** check if a value is a valid Settings object. */
export function isSettings(value: unknown): value is Settings {
	if(typeof value !== "object" || value === null) return false;

	const settings = value as Record<string, unknown>;
	if(typeof settings.canvasHostname !== "string" || typeof settings.canvasApiKey !== "string") return false;
	if(settings.visual === undefined) return true;
	if(typeof settings.visual !== "object" || settings.visual === null) return false;

	return Object.values(settings.visual).every((setting) =>
		typeof setting === "string" || typeof setting === "number" || typeof setting === "boolean"
	);
}

/** fill in missing settings values with defaults */
export function normalizeSettings(value: Settings): Settings {
	return {
		...defaultSettings,
		...value,
		visual: { ...defaultSettings.visual, ...value.visual }
	};
}

/** apply visual settings form fields to the current settings */
export function updateVisualSettings(formData: FormData, current: Settings): VisualSettings {
	const visual = { ...current.visual };

	for(const key in visualSettings) {
		const field = formData.get(`visual.${key}`);

		const defaultValue = visualSettings[key as keyof VisualSettings].default;
		if(typeof defaultValue === "boolean") {
			visual[key as keyof VisualSettings] = field === "on";
		} else if(typeof defaultValue === "number") {
			if(field === null) continue;
			const parsed = Number(field);
			if(!Number.isNaN(parsed)) visual[key as keyof VisualSettings] = parsed as any;
		} else if(typeof defaultValue === "string") {
			if(field === null) continue;
			visual[key as keyof VisualSettings] = String(field) as any;
		}
	}

	return visual;
}
