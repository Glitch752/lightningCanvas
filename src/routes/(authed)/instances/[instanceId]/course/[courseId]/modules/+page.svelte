<script lang="ts">
	import { page } from "$app/state";
	import { dynamicDataState } from "$lib/dynamicData.svelte";
	import type { PageData } from "./$types";
    import { getGlobalCourse } from "../+layout.svelte";
    import { pageData } from "$lib/pageData.svelte";
    import { getInstanceContext } from "$lib/context/instance";
    import ModuleList from "./ModuleList.svelte";

	let { data }: { data: PageData } = $props();
    const instance = getInstanceContext().instance;
	
    const modules = dynamicDataState(() => data.modules);

    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);
    pageData(() => ({
        title: `${course?.displayedName ?? course?.fullName ?? "Unknown course"} - Modules`,
        canvasUrl: `${instance.hostname}/courses/${page.params.courseId}/modules`
    }));
</script>

<div class="modules-page">
	<header class="page-header -hflex">
		<h1>Modules</h1>
		{#if modules.value}<span class="count">({modules.value.modules.length})</span>{/if}
	</header>

	{#if modules.value?.modules.length}
		<ModuleList modules={modules.value.modules} />
	{:else if modules.value}
		<p class="-empty">No modules found.</p>
	{:else}
		<p class="-empty">Loading modules...</p>
	{/if}
	{#if modules.error}<p class="-empty">Error loading modules: {modules.error}</p>{/if}
</div>

<style lang="scss">
.modules-page {
	max-width: 100ch;
	margin: 0 auto;
}

.page-header {
	align-items: baseline;
	gap: 0.5rem;
	margin-bottom: 1rem;
	
    .count {
        color: var(--text-muted);
        font-size: var(--font-md);
    }
}
</style>
