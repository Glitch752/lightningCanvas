<script lang="ts">
    import { page } from "$app/state";
    import { dynamicDataState } from "$lib/dynamicData.svelte";
    import { getGlobalCourse } from "../+layout.svelte";
    import type { CanvasGradeAssignment } from "$lib/server/canvas/grades";
    import type { PageData } from "./$types";
    import { pageData } from "$lib/pageData.svelte";
    import { getInstanceContext } from "$lib/context/instance";
    import PageHeader from "$lib/components/PageHeader.svelte";

    const { data }: { data: PageData } = $props();
    const instance = getInstanceContext().instance;
    
    const grades = dynamicDataState(() => data.grades);

    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);
    pageData(() => ({
        title: `${course?.displayedName ?? course?.fullName ?? "Unknown course"} - Grades`,
        canvasUrl: `${instance.hostname}/courses/${page.params.courseId}/grades`
    }));

    const assignments = $derived(grades.value?.groups.flatMap((group) => group.assignments.map((assignment) => ({
        assignment,
        groupWeight: group.group_weight,
        groupName: group.name
    }))).toSorted((a, b) => {
        const aDate = a.assignment.due_at ?? a.assignment.created_at;
        const bDate = b.assignment.due_at ?? b.assignment.created_at;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
    }) ?? []);

    function assignmentScore(assignment: CanvasGradeAssignment): string {
        const score = assignment.submission?.score;
        if(score === null || score === undefined) {
            return assignment.points_possible === null ? "-" : `- / ${assignment.points_possible}`;
        }
        return assignment.points_possible === null ? `${score}` : `${score} / ${assignment.points_possible}`;
    }

    function formatDate(value: string | null | undefined): string {
        if(!value) return "-";
        const date = new Date(value);
        if(Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
</script>

<div class="grades-page -vflex">
    <PageHeader title="Grades" />

    {#if grades.value}
        <div class="grades-layout">
            <article class="assignment-card -card">
                {#if assignments.length}
                    <div class="assignment-table" role="table">
                        <div class="table-row table-header" role="row">
                            <span role="columnheader">Assignment</span>
                            <span role="columnheader">Due</span>
                            <span role="columnheader">Submit</span>
                            <span role="columnheader">Grade</span>
                        </div>
                        {#each assignments as item (item.assignment.id)}
                            <a
                                class="table-row assignment-row -input -flat" role="row"
                                href={`/instances/${page.params.instanceId}/course/${page.params.courseId}/assignments/${item.assignment.id}`}
                            >
                                <span role="cell">
                                    <span class="name">{item.assignment.name}</span>
                                    <span class="group">{item.groupName} ({item.groupWeight}%)</span>
                                </span>
                                <span role="cell">{formatDate(item.assignment.due_at)}</span>
                                <span role="cell">{formatDate(item.assignment.submission?.submitted_at)}</span>
                                <span role="cell">{assignmentScore(item.assignment)}</span>
                            </a>
                        {/each}
                    </div>
                {:else}
                    <p class="-empty">No assignments found.</p>
                {/if}
            </article>

            <aside class="sidebar -vflex">
                <section class="grade-summary -card -vflex">
                    <h2>Total grade</h2>
                    <div class="total-grade">
                        <strong>{grades.value.currentScore === null ?
                            "-" : `${Math.round(grades.value.currentScore * 100) / 100}%`
                        }</strong>
                        <span>({grades.value.currentGrade ?? "-"})</span>
                    </div>
                </section>
                <section class="weight-summary -card -vflex">
                    <h2>Weighting groups</h2>
                    <div class="weight-list -vflex">
                        {#each grades.value.groups as group (group.id)}
                            <div class="weight-row -hflex"><span>{group.name}</span><strong>{group.group_weight}%</strong></div>
                        {/each}
                    </div>
                </section>
            </aside>
        </div>
    {:else if grades.error}
        <p class="-empty">Error loading grades: {grades.error}</p>
    {:else}
        <p class="-empty">Loading grades...</p>
    {/if}
</div>

<style lang="scss">
.grades-page {
    max-width: 120ch;
    margin: 0 auto;
    gap: 1rem;
}

.grades-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 16rem;
    gap: 1rem;
    align-items: start;
}
.assignment-card {
    overflow-x: auto;
}
.assignment-table {
    min-width: 42rem;

    .table-row {
        display: grid;
        grid-template-columns: minmax(16rem, 1fr) 4rem 4rem 5rem;
        gap: 1.25rem;
        padding: 0.5rem 0.75rem;
        text-align: left;
        white-space: nowrap;
    }
    .table-header {
        background: var(--surface);
        color: var(--text-muted);
        font-size: var(--font-sm);
    }
    .assignment-row {
        ---bg: transparent;
        text-decoration: none;
        font-size: var(--font-sm);

        .name {
            font-size: var(--font-md);
            color: var(--primary);
            text-decoration: underline;
        }

        &:not(:first-child) {
            border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
        }
        &:hover {
            background: var(--surface-hover);
            color: var(--text-hover);
        }
        > span:first-child {
            white-space: normal;
        }
    }
    .group {
        display: block;
        color: var(--text-muted);
        font-size: var(--font-xs);
    }
}

.sidebar {
    position: sticky;
    top: 1rem;
    gap: 0.5rem;

    section {
        gap: 0.25rem;
        padding: 0.75rem;
    }
    .total-grade {
        align-items: baseline;
        display: flex;
        gap: 0.5rem;

        strong {
            color: var(--success);
            font-size: 2rem;
        }
        span {
            color: var(--text-muted);
            font-size: var(--font-xl);
        }
    }
    .weight-list {
        gap: 0.25rem;
    }
    .weight-row {
        gap: 0.5rem;
        justify-content: space-between;
        font-size: var(--font-sm);

        span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

@media (max-width: 1000px) {
    .grades-layout {
        grid-template-columns: 1fr;
    }
    .sidebar {
        position: static;
        /* first time i've actually had a use for this omg */
        order: -1;
    }
}
</style>