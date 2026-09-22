import { getSettings } from "./settings";
import { ImmutableFetchedData } from "./data";

function stripGQLWhitespace(query: string): string {
	return query.replace(/\s+/g, " ").trim();
}

/** fetch data from the Canvas API */
export type CanvasFetchOptions = {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: Record<string, unknown>;
	headers?: Record<string, string>;
};

export async function canvasFetch<T>(instanceId: string, path: string, options: CanvasFetchOptions | Record<string, string> = {}): Promise<T | null> {
    const settings = await getSettings();
	const instance = settings.canvasInstances.find(i => i.id === instanceId);
	if(!instance || !instance.hostname || !instance.apiKey) return null;

	const isOptions = "method" in options || "body" in options || "headers" in options;
	const fetchOptions = isOptions ? options as CanvasFetchOptions : { headers: options as Record<string, string> };
	const headers = { Authorization: `Bearer ${instance.apiKey}`, ...fetchOptions.headers };
	if(fetchOptions.body) headers["Content-Type"] = "application/x-www-form-urlencoded";

	console.log(`fetching Canvas data from instance ${instanceId}: ${path}`);
	const time = Date.now();
	
    const response = await fetch(`${instance.hostname}${path}`, {
		method: fetchOptions.method,
		body: fetchOptions.body ? new URLSearchParams(
			Object.entries(fetchOptions.body).map(([key, value]) => [key, String(value)])
		).toString() : undefined,
		headers
    });
	console.log(`Canvas fetch ${instanceId}: ${path} took ${Date.now() - time}ms`);

    if(!response.ok) {
		console.error(`Canvas request failed (${response.status}): ${await response.text()}`);
		throw new Error(`Canvas request failed (${response.status})`);
	}
    return await response.json() as T;
}
export async function canvasGraphqlFetch<T>(instanceId: string, query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
	const settings = await getSettings();
	const instance = settings.canvasInstances.find(i => i.id === instanceId);
	if(!instance || !instance.hostname || !instance.apiKey) return null;

	console.log(`fetching Canvas GraphQL data from instance ${instanceId}`);
	const time = Date.now();

	const response = await fetch(`${instance.hostname}/api/graphql`, {
		method: "POST",
		body: JSON.stringify({ query: stripGQLWhitespace(query), variables }),
		headers: { Authorization: `Bearer ${instance.apiKey}`, "Content-Type": "application/json" }
	});
	console.log(`Canvas GraphQL fetch ${instanceId} took ${Date.now() - time}ms`);

	if(!response.ok) throw new Error(`Canvas GraphQL request failed (${response.status})`);
	const json = await response.json() as T;

	if(typeof json === "object" && json !== null && "errors" in json) {
		console.error("Canvas GraphQL errors:", json.errors);
		throw new Error("Canvas GraphQL request failed");
	}

	return json;
}

/** data source for the user's id */
export const userId = new ImmutableFetchedData<{ [id: string]: number | null }, string[]>({
	path: "canvas-user-id.json",
	fetch: async (key) => {
		if(!key) return null;
		
		const userIds = await Promise.all(key.map(async (instanceId) => {
			const user = await canvasFetch<{ id: number }>(instanceId, "/api/v1/users/self");
			return [instanceId, user?.id ?? null];
		}));

		return Object.fromEntries(userIds);
	},
	key: () => getSettings().then((settings) => settings.canvasInstances
		.map(i => i.id)
		.toSorted((a, b) => a.localeCompare(b)))
});
