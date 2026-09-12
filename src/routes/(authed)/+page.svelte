<script lang="ts">
    import type { PageData } from "./$types";
    import { pageData } from "../+layout.svelte";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { goto } from "$app/navigation";
    import TodoList from "./TodoList.svelte";
    import { ChevronDown, ChevronUp, ListCheck } from "@lucide/svelte";
    import { SvelteSet } from "svelte/reactivity";

	let { data }: { data: PageData } = $props();

    const MAX_COURSE_TASKS_DISPLAYED = 5;

    pageData({
		title: "Dashboard",
		// svelte-ignore state_referenced_locally
		canvasUrl: data.settings.canvasHostname
	});

    // TODO: customizing course colors and images
    const courseImages = [
        // very temporary, but just a list of subtle rainy vibe images because i like it :3
        "1620385019253-b051a26048ce", "1527766833261-b09c3163a791", "1515694346937-94d85e41e6f0",
        "1493314894560-5c412a56c17c", "1567688993206-43c34131b21f", "1496034663057-6245f11be793"
    ].map(u => `https://images.unsplash.com/photo-${u}?q=80&w=512&h=512&auto=format&fit=crop`)

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

    let coursesExpanded = $state<SvelteSet<number>>(new SvelteSet());

    // for testing
    function duplicate<T>(arr: T[], times: number): T[] {
        return Array.from({ length: times }, () => arr).flat();
    }
</script>

<div class="page">
    <div class="courses -vflex">
        <h1>Courses <span class="count">({courseItems?.length ?? 0})</span></h1>
        {#if courseItems?.length === 0}
            <p class="-empty">No courses found.</p>
        {:else}
            <div class="course-list">
                {#each courseItems as course, i}
                    {@const cid = parseInt(course.id)}
                    {@const plannerItemsForCourse = duplicate(plannerItemsByCourse?.[cid] ?? [], 8)}
                    <!-- svelte-ignore a11y_click_events_have_key_events,a11y_no_static_element_interactions -
                        we have ""better"" links for accessibility below, this is just for a full card clickable
                        area without nesting interactive elements -->
                    <div
                        class="course -card -hover-hl -vflex"
                        style="--highlight: {course.color}"
                        onclick={e => {
                            if((e.target as HTMLElement)?.closest("a, button")) return;
                            goto(`/course/${course.id}`)
                        }}
                    >
                        <img src={
                            (data.settings.visual.useCourseImages ? course.imageUrl : null) ??
                            courseImages[i % courseImages.length]
                        } alt="" loading="lazy" />
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
                            {@const maxDisplayed = coursesExpanded.has(cid) ?
                                plannerItemsForCourse.length : MAX_COURSE_TASKS_DISPLAYED}
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
                                <button class="course-task more -input -hflex" onclick={e => {
                                    if(coursesExpanded.has(cid)) coursesExpanded.delete(cid);
                                    else coursesExpanded.add(cid);
                                }}>
                                    <ChevronDown /> {plannerItemsForCourse.length - maxDisplayed} more
                                </button>
                            {/if}
                            {#if coursesExpanded.has(cid) && plannerItemsForCourse.length > MAX_COURSE_TASKS_DISPLAYED}
                                <button class="course-task more -input -hflex" onclick={e => {
                                    coursesExpanded.delete(cid);
                                }}>
                                    <ChevronUp /> Show less
                                </button>
                            {/if}
                        {/if}
                    </div>
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
}
.courses, .todo {
    padding: 0.5rem 1rem 1rem 1rem;
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
                linear-gradient(to top, transparent 0, black 3rem),
                radial-gradient(circle at center, black 0%, rgba(0, 0, 0, 0.5) 100%);
            mask-composite: intersect;
        }
    }
    .course-info {
        margin: 0.5rem 1rem 0.25rem 1rem;
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
        text-decoration: none;

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
        margin: 0.125rem 0.75rem;
        font-size: var(--font-sm);
        text-decoration: none;
        gap: 0.75rem;
        justify-content: space-between;

        .title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
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
}
</style>