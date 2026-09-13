<script lang="ts">
    import { page } from "$app/state";
    import type { PageData } from "./$types";
    import { pageData } from "../../../+layout.svelte";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import TodoList from "../../TodoList.svelte";

    let { data }: { data: PageData } = $props();
    const courseHome = dynamicDataState(() => data.courseHome);
    const courses = dynamicDataState(() => data.courses);

    const courseId = $derived(page.params.courseId);
    const course = $derived(courseHome.value?.course ?? courses.value?.find((item) => item.id === courseId));
    const courseItems = $derived(courses.value?.map((item, index) => ({
        ...item,
        color: `var(--misc-${(index % 6) + 1})`
    })));
    const tabs = $derived(courseHome.value?.tabs.filter((tab) => !tab.hidden && tab.visibility !== "none") ?? []);
    const localTabPaths: Record<string, string> = {
        home: "",
        modules: "/modules",
        grades: "/grades"
    };
    const internalTabs = $derived(tabs.filter((tab) => tab.id in localTabPaths));
    const externalTabs = $derived(tabs.filter((tab) => !(tab.id in localTabPaths)));

    function makeAbsolute(url: string): string {
        if(url.startsWith("http")) return url;
        if(data.settings.canvasHostname) return `${data.settings.canvasHostname}${url}`;
        return url;
    }

    function localTabHref(tabId: string): string {
        return `/course/${courseId}${localTabPaths[tabId]}`;
    }

    pageData({
        get title() { return course?.displayedName ?? "Course"; },
        get canvasUrl() { return course ? `${data.settings.canvasHostname}/courses/${course.id}` : null; }
    });

    function transformCourseHtml(html: string): string {
        // personal preference, but default pt fonts look wayyy too big here
        // (they look smaller on canvas so maybe it's a font thing?)
        // scale `font-size: xxpt` down a little
        return html.replace(/font-size:\s*(\d+)pt/g, (_, size) => `font-size: ${Math.round(parseInt(size) * 0.8 * 10) / 10}pt`);
    }
</script>

<div class="course-page">
    <aside class="course-tabs -vflex">
        <h1>{course?.displayedName ?? `Course ${courseId}`}</h1>
        {#if course?.courseCode}<p class="course-code">{course.courseCode}</p>{/if}
        <nav class="-vflex">
            {#each internalTabs as tab}
                <a href={localTabHref(tab.id)}>{tab.label}</a>
            {/each}
            {#each externalTabs as tab}
                <a href={makeAbsolute(tab.html_url ?? "")} target="_blank" rel="noreferrer">{tab.label}</a>
            {/each}
        </nav>
        {#if courseHome.error}<p class="-empty">Error loading course: {courseHome.error}</p>{/if}
    </aside>

    <article class="home-content -vflex">
        {#if courseHome.value?.page}
            <h1 class="course-content-header">
                <!-- home page titles are often basically useless so we just show the full course name -->
                <!-- {courseHome.value.page.title ?? "Home"} -->
                {course?.fullName ?? `Course ${courseId}`}
            </h1>
            {#if courseHome.value.page.body}
                {@html transformCourseHtml(courseHome.value.page.body)}
            {:else}
                <p class="-empty">This course does not have a home page.</p>
            {/if}
        {:else}
            <p class="-empty">Loading course home...</p>
        {/if}
    </article>

    <aside class="course-todo -vflex">
        <TodoList
            plannerItems={{
                value: courseHome.value?.plannerItems,
                loading: courseHome.loading,
                error: courseHome.error
            }}
            {courseItems}
        />
    </aside>
</div>

<style lang="scss">
.course-page {
    display: grid;
    grid-template-columns: 14rem minmax(0, 1fr) 20rem;
    grid-template-areas: "tabs content todo";
    min-height: 100%;
}

.course-tabs {
    grid-area: tabs;
    padding: 1rem;
    gap: 0.5rem;

    h1 {
        font-size: var(--font-lg);
    }
    .course-code {
        color: var(--text-muted);
        font-size: var(--font-xs);
        margin-bottom: 1rem;
    }

    nav { gap: 0.25rem; }
    nav a { padding: 0.4rem 0.5rem; }
}

.home-content {
    grid-area: content;
    padding: 1rem;
    gap: 0.5rem;

    min-width: 0;
    justify-self: center;
    max-width: 120ch;
    width: 100%;
    overflow: hidden;

    .course-content-header {
        margin-bottom: 3rem;
    }

    :global(img) {
        max-width: 100%;
        height: auto;
        border-radius: var(--radius);
    }
    :global(iframe) {
        max-width: 100%;
        border: none;
        border-radius: var(--radius);
        /* of course doesn't apply to every type of content but tends to look best imo */
        aspect-ratio: 16/10;
        height: auto !important;
    }
    :global(table) {
        max-width: 100%;
        overflow: auto;
        display: block;
        overflow: visible;
        
        /* some courses have reeeeally weird table layouts and this makes them at least slightly readable */
        &:not([cellspacing]) {
            border-spacing: 1rem;
        }
    }
    :global(p) {
        margin: 0.5rem 0;
    }
}

.course-todo {
    grid-area: todo;
    padding: 1rem;
    gap: 1rem;
}

@media (max-width: 1000px) {
    .course-page {
        grid-template-columns: 16rem 1fr;
        grid-template-areas:
            "tabs content"
            "todo content";
    }
}
</style>