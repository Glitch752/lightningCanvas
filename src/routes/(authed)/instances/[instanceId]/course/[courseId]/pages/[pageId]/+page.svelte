<script lang="ts">
	import { page as currentPage } from "$app/state";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import UserContentViewer from "$lib/components/UserContentViewer.svelte";
    import { getInstanceContext } from "$lib/context/instance";
	import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { pageData } from "$lib/pageData.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	const coursePage = dynamicDataState(() => data.page);

	const pageId = $derived(currentPage.params.pageId);

    const instance = getInstanceContext().instance;
    pageData(() => ({
        title: coursePage.value?.page?.title ?? pageId ?? "",
        canvasUrl: `${instance.hostname}/courses/${currentPage.params.courseId}/pages/${pageId}`
    }));
</script>

<div class="page -vflex">
    <PageHeader category="Pages" title={coursePage.value?.page?.title ?? pageId ?? "Unknown Page"} />

    {#if coursePage.value?.page}
        <UserContentViewer body={coursePage.value.page.body} />
    {:else}
        <p class="-empty">Loading page...</p>
    {/if}
    
    {#if coursePage.error}
        <p class="-empty">Error loading page: {coursePage.error}</p>
    {/if}
</div>

<style lang="scss">
.page {
    padding-bottom: 10rem;
    padding-right: 2rem;
    gap: 1rem;
}
</style>