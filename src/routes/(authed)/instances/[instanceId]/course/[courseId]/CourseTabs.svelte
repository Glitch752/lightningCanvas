<script lang="ts">
    import { page } from "$app/state";
    import type { DynamicDataState } from "$lib/dynamicData.svelte";
    import type { CanvasCourseGlobal, CanvasCourseTab } from "$lib/server/canvas/courses";
    import type { CanvasInstance } from "$lib/settings";

    const { instance, courseId, courseGlobal }: {
        instance: CanvasInstance,
        courseId: string,
        courseGlobal: DynamicDataState<CanvasCourseGlobal>,
    } = $props();

    const course = $derived(courseGlobal.value?.course);
    const tabs = $derived(courseGlobal.value?.tabs.filter((tab) => !tab.hidden && tab.visibility !== "none") ?? []);
    const localTabPaths: Record<string, string> = {
        home: "",
        modules: "/modules",
        grades: "/grades"
    };

    function makeAbsolute(url: string): string {
        if(url.startsWith("http")) return url;
        if(instance.hostname) return `${instance.hostname}${url}`;
        return url;
    }

    function localTabHref(tabId: string): string {
        return `/instances/${instance.id}/course/${courseId}${localTabPaths[tabId]}`;
    }

    function getGroup(tab: CanvasCourseTab): number {
        // we sort by ones we handle internally first, then normal canvas tabs, then external links
        if(tab.id in localTabPaths) return 0;
        if(tab.type === "external") return 2;
        return 1;
    }

    // const internalTabs = $derived(tabs.filter((tab) => tab.id in localTabPaths));
    // const externalTabs = $derived(tabs.filter((tab) => !(tab.id in localTabPaths)));
    const tabGroups = $derived(
        tabs.reduce((groups, tab) => {
            const group = getGroup(tab);
            if(!groups[group]) groups[group] = [];
            groups[group].push(tab);
            return groups;
        }, [] as CanvasCourseTab[][])
    );
</script>

<aside class="course-tabs -vflex">
    <h1>{course?.displayedName ?? `Course ${courseId}`}</h1>
    {#if course?.courseCode}
        <p class="course-code">{course.courseCode}</p>
    {/if}
    <nav class="-vflex">
        {#each tabGroups as group}
            {#each group as tab}
                {#if tab.id in localTabPaths}
                    <a
                        href={localTabHref(tab.id)}
                        class:active={page.route.id === `/(authed)/instances/[instanceId]/course/[courseId]${localTabPaths[tab.id]}`}
                    >{tab.label}</a>
                {:else}
                    <a href={makeAbsolute(tab.html_url ?? "")} target="_blank" rel="noreferrer">{tab.label}</a>
                {/if}
            {/each}
            <div class="spacer"></div>
        {/each}
    </nav>
    {#if courseGlobal.error}
        <p class="-empty">Error loading course: {courseGlobal.error}</p>
    {/if}
</aside>

<style lang="scss">
.course-tabs {
    gap: 0.5rem;

    h1 { font-size: var(--font-lg); }
    .course-code {
        color: var(--text-muted);
        font-size: var(--font-xs);
        margin-bottom: 1rem;
    }
    .spacer {
        height: 1rem;
    }
    nav {
        gap: 0.25rem;
        position: sticky;
        top: 0rem;
    }
    nav a {
        padding: 0.4rem 0.5rem;
        border-radius: 0 var(--radius) var(--radius) 0;

        &.active {
            background-color: var(--bg-elevated);
            color: var(--text);
            font-weight: bold;
            border-left: 1px solid var(--primary);
        }
    }
}
</style>