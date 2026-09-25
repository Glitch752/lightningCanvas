import { browser } from "$app/env";
import type { SKLoadDynamicData } from "$lib/server/dynamicData";
import { writable } from "svelte/store";

/** true if at least one dynamic data refresh is in progress */
export const dynamicDataLoading = writable(false);

let activeLoads = 0;
function startLoad() {
	activeLoads += 1;
	dynamicDataLoading.set(true);

	let finished = false;
	return () => {
		if(finished) return;
		finished = true;

		activeLoads = Math.max(0, activeLoads - 1);
		dynamicDataLoading.set(activeLoads > 0);
	};
}

export type DynamicDataState<T> = {
	/** the current value, either cached or updated */
	value: T | undefined;
	/** true if the data is currently being refreshed */
	loading: boolean;
	/** any error that occurred during the refresh */
	error: unknown;
	/** update the current value without waiting for a server refresh */
	update: (update: (value: T | undefined) => T | undefined) => void;
};

/**
 * a reactive wrapper for sveltekit-loaded dynamic data that shows an initial value then changes to
 * the updated value when the background refresh completes.
 */
export function dynamicDataState<T>(v: () => SKLoadDynamicData<T>): DynamicDataState<T> {
    const data = v();
	let value = $state(data.cached?.value);
	let loading = $state(true);
	let error = $state<unknown>();

	// ignore loading the update if on the server
	if(browser) {
		const finishLoad = startLoad();
		$effect(() => {
			value = data.cached?.value;
			loading = true;
			error = undefined;
	
			data.updated
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
	}

	return {
		get value() { return value; },
		get loading() { return loading; },
		get error() { return error; },
		update: (update: (current: T | undefined) => T | undefined) => {
			console.log(value, update);
			value = update(value);
		}
	};
}