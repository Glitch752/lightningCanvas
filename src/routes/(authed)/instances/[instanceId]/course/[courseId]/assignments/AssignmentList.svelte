<script lang="ts">
    import { page } from "$app/state";
    import type { CanvasAssignment } from "$lib/server/canvas/assignments";
    import CourseItemIcon from "$lib/components/CourseItemIcon.svelte";
    import ExpandableSection from "$lib/components/ExpandableSection.svelte";

    let { assignments }: { assignments: CanvasAssignment[] } = $props();

    const AssignmentCategory = { NoDueDate: "No due date", Past: "Past", Upcoming: "Upcoming", DueToday: "Due today" } as const;
    const assignmentCategories = $derived(assignments
        .toSorted((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
        .reduce((categories, assignment) => {
            const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
            const now = new Date();
            let category: string;

            if(!dueDate) {
                category = AssignmentCategory.NoDueDate;
            } else if(dueDate < now) {
                category = AssignmentCategory.Past;
            } else if(dueDate > now) {
                category = AssignmentCategory.Upcoming;
            } else {
                category = AssignmentCategory.DueToday;
            }

            if(!categories[category]) categories[category] = [];
            categories[category].push(assignment);
            return categories;
        }, {} as Record<string, CanvasAssignment[]>));

    function formatDue(value: string | null): string {
        if(!value) return "No due date";
        const date = new Date(value);
        if(Number.isNaN(date.getTime())) return "No due date";
        return date.toLocaleString(undefined, {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
        });
    }

    function assignmentType(assignment: CanvasAssignment): string {
        if(assignment.submission_types.includes("online_quiz")) return "Quiz";
        if(assignment.submission_types.includes("discussion_topic")) return "Discussion";
        return "Assignment";
    }

    function assignmentHref(assignment: CanvasAssignment): string {
        return `/instances/${page.params.instanceId}/course/${page.params.courseId}/assignments/${assignment.id}`;
    }
</script>

<ExpandableSection
    sections={[
        { title: AssignmentCategory.DueToday, assignments: assignmentCategories[AssignmentCategory.DueToday] ?? [] },
        { title: AssignmentCategory.Upcoming, assignments: assignmentCategories[AssignmentCategory.Upcoming] ?? [] },
        { title: AssignmentCategory.Past, assignments: assignmentCategories[AssignmentCategory.Past] ?? [] },
        { title: AssignmentCategory.NoDueDate, assignments: assignmentCategories[AssignmentCategory.NoDueDate] ?? [] }
    ].filter(section => section.assignments.length > 0)}
    getId={(section) => section.title}
    getTitle={(section) => section.title}
    getCount={(section) => `${section.assignments.length} assignment${section.assignments.length === 1 ? "" : "s"}`}
>
    {#snippet children(section)}
        <div class="assignment-list -vflex">
            {#each (section as { assignments: CanvasAssignment[] }).assignments as assignment (assignment.id)}
                <a class="assignment -hflex -input -flat" href={assignmentHref(assignment)}>
                    <CourseItemIcon type={assignmentType(assignment)} />
                    <span class="assignment-title">{assignment.name}</span>
                    <span class="assignment-due">{formatDue(assignment.due_at)}</span>
                </a>
            {/each}
        </div>
    {/snippet}
</ExpandableSection>

<style lang="scss">
.assignment-list {
    gap: 0;
    overflow: hidden;
    border-radius: var(--radius);
}
.assignment {
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    min-width: 0;
    text-decoration: none;
    ---bg: transparent;

    &:not(:first-child) {
        border-top: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
    }
    &:hover {
        background: var(--surface-hover);
        color: var(--text-hover);
    }
}
.assignment-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--primary);
    text-decoration: underline;
}
.assignment-type, .assignment-due {
    color: var(--text-muted);
    font-size: var(--font-xs);
}
.assignment-due {
    flex-shrink: 0;
    text-align: right;
}
</style>
