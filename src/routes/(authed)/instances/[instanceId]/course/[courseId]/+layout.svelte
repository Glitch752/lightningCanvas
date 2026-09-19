<script lang="ts" module>
    export const [getGlobalCourse, setGlobalCourse] = createContext<DynamicDataState<CanvasCourseGlobal>>();
</script>

<script lang="ts">
    import { page } from "$app/state";
    import type { LayoutData } from "./$types";
    import { dynamicDataState, type DynamicDataState } from "$lib/dynamicData.svelte";
    import type { CanvasCourseGlobal } from "$lib/server/canvas/courses";
    import { createContext, type Snippet } from "svelte";
    import { getInstanceContext } from "$lib/context/instance";
    import CourseTabs from "./CourseTabs.svelte";

    let { children, data }: { children: Snippet; data: LayoutData } = $props();
    const instance = getInstanceContext().instance;
    const courseId = $derived(page.params.courseId);

    const courseGlobal = dynamicDataState(() => data.courseGlobal);
    setGlobalCourse(courseGlobal);
</script>

<div class="course-layout">
    {#if courseId}
        <CourseTabs {instance} {courseId} {courseGlobal} />
    {/if}

    <div class="course-content">
        {@render children()}
    </div>
</div>

<style lang="scss">
.course-layout {
    display: grid;
    grid-template-columns: 14rem minmax(0, 1fr);
    min-height: 100%;
    gap: 1rem;
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