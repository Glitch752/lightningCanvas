<script lang="ts">
    import { page } from "$app/state";
    import { getInstanceContext } from "$lib/context/instance";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { pageData } from "$lib/pageData.svelte";
    import { getGlobalCourse } from "../+layout.svelte";
    import type { CanvasAnnouncement } from "$lib/server/canvas/announcements";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    const instance = getInstanceContext().instance;
    const announcements = dynamicDataState(() => data.announcements);
    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);

    pageData(() => ({
        title: `${course?.displayedName ?? course?.fullName ?? "Unknown course"} - Announcements`,
        canvasUrl: `${instance.hostname}/courses/${page.params.courseId}/announcements`
    }));

    function formatDate(value: string): string {
        const date = new Date(value);
        if(Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString(undefined, {
            month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
        });
    }

    function announcementHref(announcement: CanvasAnnouncement): string {
        return `/instances/${page.params.instanceId}/course/${page.params.courseId}/announcements/${announcement.id}`;
    }
</script>

<div class="announcements-page">
    <header class="page-header -hflex">
        <h1>Announcements</h1>
        {#if announcements.value}<span class="count">({announcements.value.announcements.length})</span>{/if}
    </header>

    {#if announcements.value}
        {#if announcements.value.announcements.length}
            <div class="announcement-list -vflex">
                {#each announcements.value.announcements as announcement (announcement.id)}
                    <a class="announcement-card -card -input" href={announcementHref(announcement)}>
                        <div class="announcement-heading -hflex">
                            <h2>{announcement.title}</h2>
                            <time datetime={announcement.posted_at}>{formatDate(announcement.posted_at)}</time>
                        </div>
                        <p class="author">{announcement.author?.display_name ?? "Course announcement"}</p>
                    </a>
                {/each}
            </div>
        {:else}
            <p class="-empty">No announcements found.</p>
        {/if}
    {:else if announcements.error}
        <p class="-empty">Error loading announcements: {announcements.error}</p>
    {:else}
        <p class="-empty">Loading announcements...</p>
    {/if}
</div>

<style lang="scss">
.announcements-page {
    max-width: 100ch;
    margin: 0 auto;
}
.page-header {
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 1.5rem;

    .count {
        color: var(--text-muted);
        font-size: var(--font-md);
    }
}
.announcement-list {
    gap: 0.5rem;
}
.announcement-card {
    padding: 0.75rem 1rem;
    text-decoration: none;
}
.announcement-heading {
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;

    h2 {
        color: var(--primary);
    }
    time {
        color: var(--text-muted);
        font-size: var(--font-sm);
        white-space: nowrap;
    }
}
.author {
    margin-top: 0.25rem;
    color: var(--text-muted);
    font-size: var(--font-sm);
}

@media (max-width: 600px) {
    .announcement-heading {
        flex-direction: column;
        gap: 0.25rem;
    }
}
</style>
