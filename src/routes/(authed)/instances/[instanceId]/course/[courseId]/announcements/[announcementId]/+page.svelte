<script lang="ts">
    import { page as currentPage } from "$app/state";
    import UserContentViewer from "$lib/components/UserContentViewer.svelte";
    import { getInstanceContext } from "$lib/context/instance";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { pageData } from "$lib/pageData.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const announcement = dynamicDataState(() => data.announcement);
    const announcementId = $derived(currentPage.params.announcementId);
    const instance = getInstanceContext().instance;

    pageData(() => ({
        title: announcement.value?.title ?? `Announcement ${announcementId}`,
        canvasUrl: `${instance.hostname}/courses/${currentPage.params.courseId}/discussion_topics/${announcementId}`
    }));

    function formatDate(value: string): string {
        const date = new Date(value);
        if(Number.isNaN(date.getTime())) return "";
        return date.toLocaleString(undefined, {
            month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
        });
    }
</script>

<div class="announcement-page">
    {#if announcement.value}
        <header class="announcement-meta -vflex">
            {#if announcement.value.author?.display_name}
                <span>{announcement.value.author.display_name}</span>
            {/if}
            {#if announcement.value.posted_at}
                <time datetime={announcement.value.posted_at}>{formatDate(announcement.value.posted_at)}</time>
            {/if}
        </header>
        <UserContentViewer title={announcement.value.title} body={announcement.value.message} />
    {:else if announcement.error}
        <p class="-empty">Error loading announcement: {announcement.error}</p>
    {:else}
        <p class="-empty">Loading announcement...</p>
    {/if}
</div>

<style lang="scss">
.announcement-page {
    padding-bottom: 10rem;
}
.announcement-meta {
    margin: 0 auto;
    padding: 1rem 1rem 0;
    gap: 0.25rem;
    color: var(--text-muted);
    font-size: var(--font-sm);
}
</style>
