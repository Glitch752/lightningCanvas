<script lang="ts">
    import { goto } from "$app/navigation";
    import { ChevronDown, ChevronUp, ListCheck } from "@lucide/svelte";
    import type { PageData } from "./$types";
    import type { CanvasCourse, PlannerItem } from "$lib/server/canvas/courses";

    const MAX_COURSE_TASKS_DISPLAYED = 5;

    // TODO: customizing course colors and images
    const courseImages = [
        // very temporary, but just a list of subtle rainy vibe images because i like it :3
        "1620385019253-b051a26048ce", "1527766833261-b09c3163a791", "1515694346937-94d85e41e6f0",
        "1493314894560-5c412a56c17c", "1567688993206-43c34131b21f", "1496034663057-6245f11be793"
    ].map(u => `https://images.unsplash.com/photo-${u}?q=80&w=512&h=512&auto=format&fit=crop`)

    const {
        course, i, plannerItemsForCourse, data
    }: {
        course: CanvasCourse & { color: string }, i: number,
        plannerItemsForCourse: PlannerItem[],
        data: PageData
    } = $props();
    const cid = $derived(parseInt(course.id));

    let expanded = $state(false);
</script>

<div class="course -card -hover-hl -vflex" style="--highlight: {course.color}">
    <a href={`/course/${course.id}`}>
        <img src={
            (data.settings.visual.useCourseImages ? course.imageUrl : null) ??
            courseImages[i % courseImages.length]
        } alt="" loading="lazy" />
    </a>
    <a href={`/course/${course.id}/grades`} class="course-grade -vflex">
        <span class="grade -card">{course.grade.currentGrade ?? "n/a"}</span>
        {#if course.grade.currentScore}
            <span class="score -card">{course.grade.currentScore}%</span>
        {/if}
    </a>
    <a href={`/course/${course.id}`} class="course-info">
        <span class="course-name" title={course.fullName}>{course.displayedName}</span>
        {#if course.courseCode}
            <span class="course-code" title={course.courseCode}>{course.courseCode}</span>
        {/if}
        {#if course.termName}
            <span class="course-term">{course.termName}</span>
        {/if}
    </a>
    {#if plannerItemsForCourse.length > 0}
        <span class="task-header -hflex">
            <ListCheck /> Tasks <span class="count">({plannerItemsForCourse.length})</span>
        </span>
        
        {@const maxDisplayed = expanded ? plannerItemsForCourse.length : MAX_COURSE_TASKS_DISPLAYED}
        {#each plannerItemsForCourse.slice(0, maxDisplayed) as item}
            {@const dueAtDate = new Date(item.plannable.due_at)}
            <a
                class="course-task -input -hflex"
                href={`/course/${item.course_id}/assignments/${item.plannable.id}`}
                title={item.plannable.title}
            >
                <span class="title">{item.plannable.title}</span>
                <span class="due" class:-error={dueAtDate < new Date()}>
                    {dueAtDate.toLocaleString([], { month: "short", day: "numeric" })}
                </span>
            </a>
        {/each}
        {#if plannerItemsForCourse.length > maxDisplayed}
            <button class="course-task more -input -hflex" onclick={e => expanded = !expanded}>
                <ChevronDown /> {plannerItemsForCourse.length - maxDisplayed} more
            </button>
        {/if}
        {#if expanded && plannerItemsForCourse.length > MAX_COURSE_TASKS_DISPLAYED}
            <button class="course-task more -input -hflex" onclick={e => expanded = !expanded}>
                <ChevronUp /> Show less
            </button>
        {/if}
    {/if}
</div>

<style lang="scss">
.course {
    border-top-color: var(--highlight);
    position: relative;
    align-self: start;
    padding-bottom: 0.5rem;

    img {
        width: 100%;
        height: 6rem;
        object-fit: cover;
        border-radius: var(--radius) var(--radius) 0 0;
        opacity: 0.25;

        /* fade out bottom and vignette */
        mask-image:
            linear-gradient(to top, transparent 0, black 2.5rem),
            radial-gradient(circle at center, black 0%, black 50%, rgba(0, 0, 0, 0.5) 100%);
        mask-composite: intersect;
    }
}
.course-info {
    margin: 0 1rem 0.25rem 1rem;
    text-decoration: underline transparent;
    transition: text-decoration-color 200ms ease-out;
    
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: 1fr auto;
    grid-template-areas:
        "name name"
        "code term";
    gap: 0 0.75rem;
    
    &:hover {
        text-decoration: underline var(--text);
    }

    .course-name {
        grid-area: name;
        color: var(--highlight);
        margin-bottom: 0.25rem;
    }
    .course-code {
        grid-area: code;
        color: var(--text-muted);
        font-size: var(--font-xs);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .course-term {
        grid-area: term;
        color: var(--text-muted);
        font-size: var(--font-xs);
    }
}

.course-grade {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    gap: 0.25rem;
    align-items: start;
    text-decoration: underline transparent;
    transition: text-decoration-color 200ms ease-out;

    &:hover {
        text-decoration: underline var(--highlight);
    }
    .grade {
        font-size: var(--font-xl);
        font-weight: bold;
        padding: 0.25rem 0.75rem;
        color: var(--highlight);
    }
    .score {
        font-size: var(--font-sm);
        color: var(--text-muted);
        padding: 0.125rem 0.25rem;
    }
}

.task-header {
    margin: 0.25rem 0.25rem 0.125rem 1rem;
    font-size: var(--font-sm);
    color: var(--text);
    align-items: center;
    gap: 0.25rem;

    .count {
        color: var(--text-muted);
        font-size: var(--font-xs);
        align-self: end;
    }
}
.course-task {
    padding: 0.125rem 0.5rem;
    margin: 0.25rem 0.75rem;
    font-size: var(--font-sm);
    text-decoration: none;
    gap: 0.75rem;
    justify-content: space-between;
    border-left-color: var(--highlight);
    white-space: nowrap;

    .title {
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .due {
        color: var(--text-muted);
    }
    
    &.more {
        ---bg: transparent;
        align-items: center;
        justify-content: start;
        gap: 0.5rem;
        border: none;
        color: var(--text-muted);
        margin: 0 0.75rem;
    }
}
</style>