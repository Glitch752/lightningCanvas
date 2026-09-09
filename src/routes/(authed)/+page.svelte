<script lang="ts">
    import type { PageData } from "./$types";
    import { pageData } from "../+layout.svelte";

	let { data }: { data: PageData } = $props();

    pageData({
		title: "Dashboard",
		// svelte-ignore state_referenced_locally
		canvasUrl: data.settings.canvasHostname
	});
</script>

<p>dashboard todo</p>