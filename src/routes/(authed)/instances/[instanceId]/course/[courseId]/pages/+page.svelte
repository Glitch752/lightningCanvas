<script lang="ts">
    import { page } from "$app/state";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { getGlobalCourse } from "../+layout.svelte";
    import { pageData } from "$lib/pageData.svelte";
    import { getInstanceContext } from "$lib/context/instance";
    import type { CanvasPageSummary } from "$lib/server/canvas/pages";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const instance = getInstanceContext().instance;
    const pages = dynamicDataState(() => data.pages);
    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);

    pageData(() => ({
        title: `${course?.displayedName ?? course?.fullName ?? "Unknown course"} - Pages`,
        canvasUrl: `${instance.hostname}/courses/${page.params.courseId}/pages`
    }));

    function formatDate(value: string): string {
        const date = new Date(value);
        if(Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    function pageHref(coursePage: CanvasPageSummary): string {
        return `/instances/${page.params.instanceId}/course/${page.params.courseId}/pages/${coursePage.url}`;
    }
</script>

<div class="pages-page">
    <header class="page-header -hflex">
        <h1>Pages</h1>
        {#if pages.value}<span class="count">({pages.value.pages.length})</span>{/if}
    </header>

    {#if pages.value}
        {#if pages.value.pages.length}
            <article class="pages-card -card">
                <div class="pages-table" role="table">
                    <div class="table-row table-header" role="row">
                        <span role="columnheader">Page</span>
                        <span role="columnheader">Created</span>
                        <span role="columnheader">Last edit</span>
                    </div>
                    {#each pages.value.pages as coursePage (coursePage.page_id)}
                        <a class="table-row page-row -input -flat" role="row" href={pageHref(coursePage)}>
                            <span class="page-title" role="cell">{coursePage.title}</span>
                            <span role="cell">{formatDate(coursePage.created_at)}</span>
                            <span role="cell">{formatDate(coursePage.updated_at)}</span>
                        </a>
                    {/each}
                </div>
            </article>
        {:else}
            <p class="-empty">No pages found.</p>
        {/if}
    {:else if pages.error}
        <p class="-empty">Error loading pages: {pages.error}</p>
    {:else}
        <p class="-empty">Loading pages...</p>
    {/if}
</div>

<style lang="scss">
.pages-page {
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
.pages-card {
    overflow-x: auto;
}
.pages-table {
    min-width: 38rem;

    .table-row {
        display: grid;
        grid-template-columns: minmax(16rem, 1fr) 8rem 8rem;
        gap: 1.25rem;
        padding: 0.6rem 0.75rem;
        text-align: left;
        white-space: nowrap;
    }
    .table-header {
        background: var(--surface);
        color: var(--text-muted);
        font-size: var(--font-sm);
    }
    .page-row {
        ---bg: transparent;
        text-decoration: none;
        font-size: var(--font-sm);

        &:not(:first-child) {
            border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
        }
        &:hover {
            background: var(--surface-hover);
            color: var(--text-hover);
        }
    }
    .page-title {
        color: var(--primary);
        text-decoration: underline;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
    }
}
</style>
