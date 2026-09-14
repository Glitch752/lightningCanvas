<script lang="ts" module>
    export const [getGlobalCourse, setGlobalCourse] = createContext<DynamicDataState<CanvasCourseGlobal>>();
</script>

<script lang="ts">
    import { page } from "$app/state";
    import type { LayoutData } from "./$types";
    import { dynamicDataState, type DynamicDataState } from "$lib/dynamicData.svelte";
    import type { CanvasCourseGlobal } from "$lib/server/canvas/courses";
    import { createContext, type Snippet } from "svelte";

    let { children, data }: { children: Snippet; data: LayoutData } = $props();

    const courseGlobal = dynamicDataState(() => data.courseGlobal);
    const courseId = $derived(page.params.courseId);
    const course = $derived(courseGlobal.value?.course);
    const tabs = $derived(courseGlobal.value?.tabs.filter((tab) => !tab.hidden && tab.visibility !== "none") ?? []);
    const localTabPaths: Record<string, string> = {
        home: "",
        modules: "/modules",
        grades: "/grades"
    };
    const internalTabs = $derived(tabs.filter((tab) => tab.id in localTabPaths));
    const externalTabs = $derived(tabs.filter((tab) => !(tab.id in localTabPaths)));

    setGlobalCourse(courseGlobal);

    function makeAbsolute(url: string): string {
        if(url.startsWith("http")) return url;
        if(data.settings.canvasHostname) return `${data.settings.canvasHostname}${url}`;
        return url;
    }

    function localTabHref(tabId: string): string {
        return `/course/${courseId}${localTabPaths[tabId]}`;
    }
</script>

<div class="course-layout">
    <aside class="course-tabs -vflex">
        <h1>{course?.displayedName ?? `Course ${courseId}`}</h1>
        {#if course?.courseCode}
            <p class="course-code">{course.courseCode}</p>
        {/if}
        <nav class="-vflex">
            {#each internalTabs as tab}
                <a
                    href={localTabHref(tab.id)}
                    class:active={page.route.id === `/(authed)/course/[courseId]${localTabPaths[tab.id]}`}
                >{tab.label}</a>
            {/each}
            {#each externalTabs as tab}
                <a href={makeAbsolute(tab.html_url ?? "")} target="_blank" rel="noreferrer">{tab.label}</a>
            {/each}
        </nav>
        {#if courseGlobal.error}
            <p class="-empty">Error loading course: {courseGlobal.error}</p>
        {/if}
    </aside>

    <div class="course-content">
        {@render children()}
    </div>
</div>

<style lang="scss">
.course-layout {
    display: grid;
    grid-template-columns: 14rem minmax(0, 1fr);
    min-height: 100%;
}

.course-tabs {
    padding: 1rem;
    gap: 0.5rem;

    h1 { font-size: var(--font-lg); }
    .course-code {
        color: var(--text-muted);
        font-size: var(--font-xs);
        margin-bottom: 1rem;
    }
    nav { gap: 0.25rem; }
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

.course-content {
    min-width: 0;
}

@media (max-width: 1000px) {
    .course-layout {
        grid-template-columns: 16rem 1fr;
    }
}
</style>