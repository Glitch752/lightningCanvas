<script lang="ts">
    import { pageDataStore } from "../+layout.svelte";
    import { page } from "$app/state";
    import { Calendar, Gauge, LoaderCircle, LogOut, Settings } from "@lucide/svelte";
	import type { LayoutData } from "./$types";
    import type { Snippet } from "svelte";
    import { dynamicDataLoading } from "$lib/dynamicData.svelte";
    import { enhance } from "$app/forms";
  	
	let { children, data }: { children: Snippet, data: LayoutData } = $props();
</script>

<div class="app">
	<nav class="-vflex">
		<a href="/" class="-input -flat -vflex" class:-selected={page.route.id === "/(authed)"}><Gauge /> Home</a>
		<a href="/calendar" class="-input -flat -vflex" class:-selected={page.route.id === "/(authed)/calendar"}><Calendar /> Cal</a>
	</nav>
	<main>
		{@render children()}
	</main>
	<footer class="-hflex">
		{#if $pageDataStore.canvasUrl}
			<a href={$pageDataStore.canvasUrl} target="_blank">Open in Canvas</a>
		{:else}
			<p title="This page isn't set up to map to an equivalent Canvas page">No Canvas page</p>
		{/if}

		<div class="spacer"></div>

		{#if $dynamicDataLoading}
			<div class="icon -spin" title="loading..."><LoaderCircle /></div>
		{/if}
		<a class="-input -flat" href="/settings" title="Settings" class:-selected={page.route.id === "/(authed)/settings"}><Settings /></a>
		<form method="POST" action="/logout">
			<button class="-flat" title="Log out"><LogOut /></button>
		</form>
	</footer>
</div>

<style lang="scss">
.app {
	display: grid;
	grid-template-columns: auto 1fr;
	grid-template-rows: 1fr auto;
	grid-template-areas:
		"nav main"
		"footer footer";
	height: 100%;
}
nav {
	grid-area: nav;
	background-color: var(--bg-elevated);
	width: 3.5rem;

	a {
		padding: 0.25rem;
		/** a bit of extra spacing on non-first items balances the ui more imo */
		&:not(:first-child) { padding-top: 0.5rem; }
		align-items: center;
		font-size: var(--font-xs);
		text-decoration: none;
		color: var(--text-muted);
		background-color: var(--bg-elevated);

		> :global(svg) {
			width: 2rem;
			height: 2rem;
			color: var(--text);
		}

		&:hover {
			color: var(--text);

			> :global(svg) {
				color: var(--text-hover);
			}
		}
	}
}
main {
	grid-area: main;
	overflow-y: auto;
    padding: 1rem;
}
footer {
	grid-area: footer;
	background-color: var(--surface);
	padding: 0 0.5rem;
	font-size: var(--font-sm);
	align-items: center;
	height: 1.5rem;
	gap: 0.25rem;

	.spacer {
		flex: 1;
	}
	a, button, .icon {
		white-space: nowrap;
		height: 100%;
		aspect-ratio: 1;
		padding: 0.25rem;

		:global(svg) {
			width: 100%;
			height: 100%;
		}
	}
	form {
		height: 100%;
	}
}
</style>