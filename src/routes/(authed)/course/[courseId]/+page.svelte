<script lang="ts">
    import { page } from "$app/state";
    import type { PageData } from "./$types";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import TodoList from "../../TodoList.svelte";

    let { data }: { data: PageData } = $props();
    const courseHome = dynamicDataState(() => data.courseHome);
    const courseGlobal = dynamicDataState(() => data.courseGlobal);

    const courseId = $derived(page.params.courseId);
    const course = $derived(courseGlobal.value?.course);

    function transformCourseHtml(html: string): string {
        // personal preference, but default pt fonts look wayyy too big here
        // (they look smaller on canvas so maybe it's a font thing?)
        // scale `font-size: xxpt` down a little
        return html.replace(/font-size:\s*(\d+)pt/g, (_, size) =>
            `font-size: ${Math.round(parseInt(size) * 0.8 * 10) / 10}pt`
        );
    }
</script>

<div class="course-page">
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
            courseItems={course ? [{ ...course, color: "var(--primary)" }] : undefined}
        />
    </aside>
</div>

<style lang="scss">
.course-page {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 20rem;
    grid-template-areas: "content todo";
    min-height: 100%;
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
        grid-template-columns: 1fr;
        grid-template-areas:
            "content"
            "todo";
    }
}
</style>