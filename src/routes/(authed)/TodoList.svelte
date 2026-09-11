<script lang="ts">
    import { type DynamicDataState } from "$lib/dynamicData.svelte";
    import type { CanvasCourse, PlannerItem } from "$lib/server/canvas";
    import { Clock, RotateCcwClock } from "@lucide/svelte";
    import { formatRelative } from "$lib/datetime";

    const { plannerItems, courseItems }: {
        plannerItems: DynamicDataState<PlannerItem[] | null | undefined>,
        courseItems: (CanvasCourse & { color: string })[] | null | undefined
    } = $props();

    const todoGroupedByDate = $derived.by(() => {
        // TODO: manually dismissing items
        const items = showCompletedItems ?
            plannerItems.value : plannerItems.value?.filter(item => !item.submissions.submitted);
        if(!items) return null;

        const grouped: Record<string, typeof items> = {};
        for(const item of items) {
            const date = new Date(item.plannable.due_at).toDateString();
            if(!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        }
        return grouped;
    });

    let showCompletedItems = $state(false);
</script>

<h1 class="-hflex">
    Todo

    <!-- TODO: more advanced controls and persistence here -->
    <button class:-selected={showCompletedItems} onclick={() => showCompletedItems = !showCompletedItems} title="Show completed">
        <RotateCcwClock />
    </button>
</h1>

{#if plannerItems.value?.length === 0 || !todoGroupedByDate}
    <p>No upcoming items.</p>
{:else}
    {@const timeFormatter = new Intl.DateTimeFormat([], { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })}
    {@const dateFormatter = new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric" })}
    {#each Object.entries(todoGroupedByDate) as [date, items]}
        {@const hasIncompleteItems = items.some(item => !item.submissions.submitted)}
        <h2 class="-hflex" class:completed={!hasIncompleteItems}>
            {dateFormatter.format(new Date(date))}
            <!-- if before today, show a little overdue icon -->
            {#if new Date(date) < new Date() && hasIncompleteItems}
                <span title="Overdue" class="icon -error"><Clock /></span>
            {/if}
        </h2>
        <ul class="planner-items -vflex">
            {#each items as item}
                {@const course = courseItems?.find(c => parseInt(c.id) === item.course_id)}
                {@const dueDate = new Date(item.plannable.due_at)}
                {@const completed = item.submissions.submitted}
                <li class="-card -hover-hl" style="--highlight: {course?.color}" class:completed={completed}>
                    <a href={`/course/${item.course_id}/assignments/${item.plannable.id}`} class="-vflex">
                        <span class="course-name">{item.context_name}</span>
                        <span class="plannable-title">{item.plannable.title}</span>
                        {#if !completed}
                            <span class="due-date">
                                Due {timeFormatter.format(dueDate)}
                                <span class:-error={dueDate < new Date()}>({formatRelative(dueDate)})</span>
                            </span>
                        {/if}
                    </a>
                </li>
            {/each}
        </ul>
    {/each}
{/if}
{#if plannerItems.error}
    <p>Error loading planner items: {plannerItems.error}</p>
{/if}

<style lang="scss">
h1 {
    align-items: center;
    justify-content: space-between;

    button {
        padding: 0.125rem;
        line-height: 0;
    }
}

.planner-items {
    gap: 0.5rem;
    padding: 0;
    margin: 0;
}
h2 {
    font-size: var(--font-sm);
    font-weight: var(--font-weight-bold);
    color: var(--text-muted);
    /* kind of hacky but whatever */
    margin: -0.25rem 0 -0.65rem 0;

    justify-content: space-between;

    .icon {
        line-height: 0;
    }
    :global(svg) {
        width: 1rem;
        height: 1rem;
    }

    &.completed {
        opacity: 0.5;
    }
}
li {
    list-style: none;
    padding: 0.35rem 0.35rem 0.35rem 0.5rem;
    border-right-color: var(--highlight);
    gap: 0.25rem;

    a {
        text-decoration: none;
        color: var(--text);
        gap: 0.25rem;
    }
    .course-name {
        color: var(--highlight);
        font-size: var(--font-xs);
    }
    .plannable-title {
        /* best-effort limit to 2 lines with webkit weirdness */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .due-date {
        color: var(--text-muted);
        font-size: var(--font-sm);
    }

    &.completed {
        opacity: 0.5;
        text-decoration: line-through;
        border-right-color: var(--text-muted);
    }
}
</style>