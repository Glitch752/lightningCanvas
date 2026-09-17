<script lang="ts">
	import { page as currentPage } from "$app/state";
    import UserContentViewer from "$lib/components/UserContentViewer.svelte";
	import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { pageData } from "$lib/pageData.svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	const coursePage = dynamicDataState(() => data.page);

	const pageId = $derived(currentPage.params.pageId);

    pageData(() => ({
        title: coursePage.value?.page?.title ?? pageId ?? "",
        canvasUrl: `${data.settings.canvasHostname}/courses/${currentPage.params.courseId}/pages/${pageId}`
    }));
</script>

<div class="page">
    {#if coursePage.value?.page}
        <UserContentViewer title={coursePage.value.page.title ?? pageId} body={coursePage.value.page.body} />
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
}
</style>