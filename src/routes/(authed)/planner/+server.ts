import { json } from "@sveltejs/kit";
import { canvasFetch } from "$lib/server/canvas";
import { plannerItems } from "$lib/server/canvas/courses";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json() as {
		instanceId?: string;
		plannableType?: string;
		plannableId?: string;
		plannerOverrideId?: number;
		markedComplete?: boolean;
	};
	if(!body.instanceId || !body.plannableType || !body.plannableId || typeof body.markedComplete !== "boolean")
		return json({ error: "Invalid planner item" }, { status: 400 });

    type OverrideResponse = { id?: number; marked_complete?: boolean; plannable_id?: string; plannable_type?: string; };

	const override = body.plannerOverrideId
		? await canvasFetch<OverrideResponse>(body.instanceId, `/api/v1/planner/overrides/${encodeURIComponent(String(body.plannerOverrideId))}`, {
			method: "PUT", body: { marked_complete: body.markedComplete }
		}) : await canvasFetch<OverrideResponse>(body.instanceId, "/api/v1/planner/overrides", {
			method: "POST", body: {
				plannable_type: body.plannableType,
				plannable_id: body.plannableId,
				marked_complete: body.markedComplete
			}
		});
	if(!override) return json({ error: "Failed to create/update planner override" }, { status: 502 });

    // update our value locally, but we'll refetch it next time too
	if(typeof override.id !== "number") return json({ error: "Canvas returned an override without an ID" }, { status: 502 });

	await plannerItems.updateCachedValue((items) => items?.map((item) =>
		item.instanceId === body.instanceId && item.plannableType === body.plannableType && item.plannableId === body.plannableId ? {
            ...item,
            plannerOverride: {
				id: override.id,
                markedComplete: body.markedComplete!
            }
        } : item
    ) ?? items);

	return json({ markedComplete: body.markedComplete, plannerOverrideId: override.id });
};
