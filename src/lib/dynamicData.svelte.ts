import type { SKLoadDynamicData } from "$lib/server/dynamicData";
import { writable } from "svelte/store";

/** true if at least one dynamic data refresh is in progress */
export const dynamicDataLoading = writable(false);

let activeLoads = 0;
function startLoad() {
	activeLoads += 1;
	dynamicDataLoading.set(true);
	console.log("dynamic loading");

	let finished = false;
	return () => {
		if (finished) return;
		finished = true;

		activeLoads = Math.max(0, activeLoads - 1);
		dynamicDataLoading.set(activeLoads > 0);
		console.log("dynamic loading finished");
	};
}

/**
 * a reactive wrapper for sveltekit-loaded dynamic data that shows an initial value then changes to
 * the updated value when the background refresh completes.
 */
export function dynamicDataState<T>(v: () => SKLoadDynamicData<T>) {
    const data = v();
	let value = $state(data.cached?.value);
	let loading = $state(true);
	let error = $state<unknown>();
	const finishLoad = startLoad();

	$effect(() => {
		value = data.cached?.value;
		loading = true;
		error = undefined;

		void data.updated
			.then((result) => {
                if(result.kind === "updated") value = result.value;
                else console.debug("dynamic data didn't change after initial update");
            })
			.catch((reason: unknown) => { error = reason; })
			.finally(() => {
                loading = false;
                finishLoad();
            });
	});

	return {
		get value() { return value; },
		get loading() { return loading; },
		get error() { return error; }
	};
}