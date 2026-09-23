<script lang="ts">
    import { page } from "$app/state";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { getGlobalCourse } from "../+layout.svelte";
    import { pageData } from "$lib/pageData.svelte";
    import { getInstanceContext } from "$lib/context/instance";
    import type { PageData } from "./$types";
    import AssignmentList from "./AssignmentList.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";

    let { data }: { data: PageData } = $props();
    const instance = getInstanceContext().instance;
    const assignments = dynamicDataState(() => data.assignments);
    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);

    pageData(() => ({
        title: `${course?.displayedName ?? course?.fullName ?? "Unknown course"} - Assignments`,
        canvasUrl: `${instance.hostname}/courses/${page.params.courseId}/assignments`
    }));
</script>

<div class="assignments-page -vflex">
    <PageHeader title="Assignments" count={assignments.value?.assignments.length} />

    {#if assignments.value}
        {#if assignments.value.assignments.length}
            <AssignmentList assignments={assignments.value.assignments} />
        {:else}
            <p class="-empty">No assignments found.</p>
        {/if}
    {:else if assignments.error}
        <p class="-empty">Error loading assignments: {assignments.error}</p>
    {:else}
        <p class="-empty">Loading assignments...</p>
    {/if}
</div>

<style lang="scss">
.assignments-page {
    max-width: 100ch;
    margin: 0 auto;
    gap: 1rem;
}
</style>
