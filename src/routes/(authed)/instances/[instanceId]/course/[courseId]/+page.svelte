<script lang="ts">
    import { page } from "$app/state";
    import type { PageData } from "./$types";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import UserContentViewer from "$lib/components/UserContentViewer.svelte";
    import { getGlobalCourse } from "./+layout.svelte";
    import { pageData } from "$lib/pageData.svelte";
    import { getInstanceContext } from "$lib/context/instance";
    import TodoList from "../../../../TodoList.svelte";
    import ModuleList from "./modules/ModuleList.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import ErrorBoundary from "$lib/components/ErrorBoundary.svelte";

    let { data }: { data: PageData } = $props();
    const instance = getInstanceContext().instance;

    const courseHome = dynamicDataState(() => data.courseHome);
    const courseId = $derived(page.params.courseId);

    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);
    pageData(() => ({
        title: course?.displayedName ?? course?.fullName ?? `Course ${courseId}`,
        canvasUrl: course ? `${instance.hostname}/courses/${course.id}` : null
    }));
</script>

<div class="course-page">
    <div class="home-content -vflex">
        <PageHeader title={course?.fullName ?? `Course ${courseId}`} />

        {#if courseHome.value}
            {@const home = courseHome.value.home}
            {#if !home}
                <p class="-empty">No home page or modules found.</p>
            {:else if "page" in home}
                <!-- home page titles are often basically useless so we just show the full course name -->    
                <UserContentViewer body={home.page.body} />
            {:else if "modules" in home}
                <div class="home-modules">
                    <ModuleList modules={home.modules} />
                </div>
            {/if}
        {:else}
            <p class="-empty">Loading course home...</p>
        {/if}
    </div>

    <aside class="course-todo -vflex">
        <ErrorBoundary>
            <TodoList
                plannerItems={{
                    value: courseHome.value?.plannerItems,
                    loading: courseHome.loading,
                    error: courseHome.error
                }}
                courseItems={course ? [{ ...course, color: "var(--primary)" }] : undefined}
                instances={[instance]}
            />
        </ErrorBoundary>
    </aside>
</div>

<style lang="scss">
.course-page {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 20rem;
    grid-template-areas: "content todo";
    min-height: 100%;
    gap: 1rem;
}
.home-content {
    grid-area: content;
    gap: 1rem;
}
.course-todo {
    grid-area: todo;
    gap: 1rem;
}

.home-modules {
    padding: 1rem;
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