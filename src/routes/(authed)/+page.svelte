<script lang="ts">
    import type { PageData } from "./$types";
    import { pageData } from "../+layout.svelte";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import TodoList from "./TodoList.svelte";
    import CourseCard from "./CourseCard.svelte";

	let { data }: { data: PageData } = $props();

    pageData(() => ({
		title: "Dashboard",
		canvasUrl: data.settings.canvasHostname
	}));

    const courses = dynamicDataState(() => data.courses);
    const plannerItems = dynamicDataState(() => data.plannerItems);

    const courseItems = $derived(courses.value
        ?.toSorted((a, b) => a.dashboardPosition - b.dashboardPosition)
        ?.map((c, i) => ({ ...c, color: `var(--misc-${(i % 6) + 1})`}))
    );

    const plannerItemsByCourse = $derived(
        plannerItems.value
        ?.filter(item => item.context_type === "Course" && item.course_id && !item.submissions.submitted)
        ?.reduce((acc, item) => {
            if(!acc[item.course_id]) acc[item.course_id] = [];
            acc[item.course_id].push(item);
            return acc;
        }, {} as Record<number, typeof plannerItems.value>)
    );
</script>

<div class="page">
    <div class="courses -vflex">
        <h1>Courses <span class="count">({courseItems?.length ?? 0})</span></h1>
        {#if courseItems?.length === 0}
            <p class="-empty">No courses found.</p>
        {:else}
            <!-- we could use a masonry layout here, but it's whatever. looks clean enough as is -->
            <div class="course-list">
                {#each courseItems as course, i (course.id)}
                    <CourseCard
                        {course} {i}
                        plannerItemsForCourse={plannerItemsByCourse?.[parseInt(course.id)] ?? []}
                        {data}
                    />
                {/each}
            </div>
        {/if}
        {#if courses.error}
            <p class="-empty">Error loading courses: {courses.error}</p>
        {/if}
    </div>
    
    <div class="todo -vflex">
        <TodoList {plannerItems} {courseItems} />
    </div>
</div>

<style lang="scss">
.page {
    display: grid;
    grid-template-columns: 1fr 20rem;
    gap: 1rem;
}
.courses, .todo {
    gap: 1rem;

    h1 .count {
        color: var(--text-muted);
        font-size: var(--font-md);
    }
}
.courses {
    padding-right: 0.5rem;

    .course-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem 0.75rem;
    }
}
</style>