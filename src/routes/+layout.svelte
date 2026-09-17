<script lang="ts">
    import { pageDataStore } from '$lib/pageData.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<title>{$pageDataStore.title} 🗲 Canvas</title>
</svelte:head>

{@render children()}
