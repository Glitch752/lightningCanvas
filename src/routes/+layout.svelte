<script lang="ts" module>
  	import { writable, type Writable } from "svelte/store";
	type PageData = {
		title: string;
		canvasUrl: string | null;
	};
	export const pageDataStore: Writable<PageData> = writable({
		title: "LightningCanvas",
		canvasUrl: null
	});

	/** Automatically set the page data for this page */
	export function pageData(data: PageData) {
		$effect(() => {
			pageDataStore.set(data);
		});
	}
</script>

<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<title>{$pageDataStore.title}</title>
</svelte:head>

{@render children()}
