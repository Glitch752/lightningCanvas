import type { SKLoadDynamicData } from "$lib/server/dynamicData";

/**
 * a reactive wrapper for sveltekit-loaded dynamic data that shows an initial value then changes to
 * the updated value when the background refresh completes.
 */
export function dynamicDataState<T>(v: () => SKLoadDynamicData<T>) {
    const data = v();
	let value = $state(data.cached?.value);
	let loading = $state(true);
	let error = $state<unknown>();

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
			.finally(() => { loading = false; });
	});

	return {
		get value() { return value; },
		get loading() { return loading; },
		get error() { return error; }
	};
}