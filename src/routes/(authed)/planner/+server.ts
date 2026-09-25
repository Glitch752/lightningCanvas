import { json } from "@sveltejs/kit";
import { canvasFetch } from "$lib/server/canvas";
import { plannerItems, type CanvasPlannerItem } from "$lib/server/canvas/courses";
import type { RequestHandler } from "./$types";
import { courseHomeDataRegistry } from "$lib/server/canvas/home";

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json() as {
		instanceId?: string;
		courseId?: string;
		plannableType?: string;
		plannableId?: number;
		plannerOverrideId?: number;
		markedComplete?: boolean;
	};
	if(!body.instanceId || !body.courseId || !body.plannableType || !body.plannableId || typeof body.markedComplete !== "boolean")
		return json({ error: "Invalid planner item" }, { status: 400 });

	type OverrideResponse = { id?: number; marked_complete?: boolean; plannable_id?: string | number; plannable_type?: string; };

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
	if(typeof override.id !== "number" || typeof override.marked_complete !== "boolean")
		return json({ error: "Canvas returned an incomplete planner override" }, { status: 502 });

	let updatedItemCount = 0; // for debugging
	const updatePlannerItems = (items: CanvasPlannerItem[] | null | undefined) => items?.map((item) => {
		if(item.instanceId !== body.instanceId || !(
			item.plannerOverride?.id === override.id
			|| (item.plannableType === body.plannableType && item.plannableId === body.plannableId)
		)) return item;

		updatedItemCount += 1;
		return {
            ...item,
            plannerOverride: {
				id: override.id,
				markedComplete: override.marked_complete!
            }
		};
	}) ?? items;
	await plannerItems.updateCachedValue(updatePlannerItems);

	courseHomeDataRegistry.get([body.instanceId, body.courseId]).updateCachedValue((data) => ({
		...data,
		plannerItems: updatePlannerItems(data.plannerItems)
	}));

	return json({ markedComplete: override.marked_complete, plannerOverrideId: override.id, updatedItemCount });
};
