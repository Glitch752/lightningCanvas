<script lang="ts">
    import type { PageData } from "./$types";
    import { pageData } from "../+layout.svelte";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { goto } from "$app/navigation";
    import TodoList from "./TodoList.svelte";

	let { data }: { data: PageData } = $props();

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
</script>

<div class="page">
    <div class="courses -vflex">
        <h1>Courses <span class="count">({courseItems?.length ?? 0})</span></h1>
        {#if courseItems?.length === 0}
            <p>No courses found.</p>
        {:else}
            <div class="course-list">
                {#each courseItems as course, i}
                    <!-- svelte-ignore a11y_click_events_have_key_events,a11y_no_static_element_interactions -
                        we have ""better"" links for accessibility below, this is just for a full card clickable
                        area without nesting interactive elements -->
                    <div
                        class="course -card -hover-hl"
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
                    </div>
                {/each}
            </div>
        {/if}
        {#if courses.error}
            <p>Error loading courses: {courses.error}</p>
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
        margin: 0.5rem 1rem 1rem 1rem;
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
}
</style>