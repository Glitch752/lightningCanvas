import { getSettings } from "./settings";
import { ImmutableFetchedData } from "./data";

function stripGQLWhitespace(query: string): string {
	return query.replace(/\s+/g, " ").trim();
}

/** fetch data from the Canvas API */
export async function canvasFetch<T>(path: string, headers: Record<string, string> = {}): Promise<T | null> {
    const settings = await getSettings();
    if(!settings.canvasHostname || !settings.canvasApiKey) return null;

	console.log("fetching Canvas data", path);
	let time = Date.now();
    const response = await fetch(`${settings.canvasHostname}${path}`, {
        headers: { Authorization: `Bearer ${settings.canvasApiKey}`, ...headers }
    });
	console.log(`Canvas fetch ${path} took ${Date.now() - time}ms`);

    if(!response.ok) throw new Error(`Canvas request failed (${response.status})`);
    return await response.json() as T;
}
export async function canvasGraphqlFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
	const settings = await getSettings();
	if(!settings.canvasHostname || !settings.canvasApiKey) return null;

	const response = await fetch(`${settings.canvasHostname}/api/graphql`, {
		method: "POST",
		body: JSON.stringify({ query: stripGQLWhitespace(query), variables }),
		headers: { Authorization: `Bearer ${settings.canvasApiKey}`, "Content-Type": "application/json" }
	});

	if(!response.ok) throw new Error(`Canvas GraphQL request failed (${response.status})`);
	return await response.json() as T;
}

/** data source for the user's id */
export const userId = new ImmutableFetchedData<number | null, string>({
	path: "canvas-user-id.json",
	fetch: async (key) => {
		if(!key) return null;
		
		const user = await canvasFetch<{ id: number }>("/api/v1/users/self");
		return user?.id ?? null;
	},
	key: () => getSettings().then((settings) => settings.canvasApiKey ?? "")
});
