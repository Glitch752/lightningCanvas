<script lang="ts">
    import { page } from "$app/state";
    import type { PageData } from "./$types";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import TodoList from "../../TodoList.svelte";
    import UserContentViewer from "$lib/components/UserContentViewer.svelte";
    import { pageData } from "../../../+layout.svelte";
    import { getGlobalCourse } from "./+layout.svelte";

    let { data }: { data: PageData } = $props();
    const courseHome = dynamicDataState(() => data.courseHome);
    const courseId = $derived(page.params.courseId);

    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);
    pageData(() => ({
        title: course?.displayedName ?? course?.fullName ?? `Course ${courseId}`,
        canvasUrl: course ? `${data.settings.canvasHostname}/courses/${course.id}` : null
    }));
</script>

<div class="course-page">
    <div class="home-content">
        {#if courseHome.value?.page}    
            <!-- home page titles are often basically useless so we just show the full course name -->    
            <UserContentViewer
                title={course?.fullName ?? `Course ${courseId}`}
                body={courseHome.value.page.body}
            />
        {:else}
            <p class="-empty">Loading course home...</p>
        {/if}
    </div>

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