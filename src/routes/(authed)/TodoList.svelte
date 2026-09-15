<script lang="ts" module>
    export function getPlannableLink(canvasHostname: string, item: PlannerItem): string {
        switch(item.plannable_type) {
            case "assignment":
                return `/course/${item.course_id}/assignments/${item.plannable_id}`;
            case "quiz":
                return `${canvasHostname}/courses/${item.course_id}/quizzes/${item.plannable_id}`;
            default:
                return `/course/${item.course_id}`;
        }
    }
    export function isPlannableLinkExternal(item: PlannerItem): boolean {
        return item.plannable_type === "quiz";
    }
</script>

<script lang="ts">
    import { type DynamicDataState } from "$lib/dynamicData.svelte";
    import { Clock, RotateCcwClock } from "@lucide/svelte";
    import { formatRelative } from "$lib/datetime";
    import type { CanvasCourse, PlannerItem } from "$lib/server/canvas/courses";
    import type { Snippet } from "svelte";

    const { plannerItems, courseItems, canvasHostname }: {
        plannerItems: DynamicDataState<PlannerItem[] | null | undefined>,
        courseItems: (CanvasCourse & { color: string })[] | null | undefined,
        canvasHostname: string
    } = $props();

    function plannerItemCompleted(item: PlannerItem): boolean {
        return item.submissions.submitted || (item.planner_override?.marked_complete ?? false);
    }

    const todoGroupedByDate = $derived.by(() => {
        // TODO: manually dismissing items
        const items = showCompletedItems ? plannerItems.value :
            plannerItems.value?.filter(i => !plannerItemCompleted(i));
        if(!items) return null;

        const grouped: Record<string, typeof items> = {};
        for(const item of items) {
            const date = new Date(item.plannable.due_at).toDateString();
            if(!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        }
        return grouped;
    });

    const recentFeedbackItems = $derived(plannerItems.value
        ?.filter(item => item.submissions.feedback?.comment)
        .sort((a, b) => {
            const aDate = new Date(a.submissions.feedback?.comment ? a.plannable.due_at : 0);
            const bDate = new Date(b.submissions.feedback?.comment ? b.plannable.due_at : 0);
            return bDate.getTime() - aDate.getTime();
        }));

    let showCompletedItems = $state(false);
</script>

<h1 class="-hflex">
    Todo

    <!-- TODO: more advanced controls and persistence here -->
    <button class:-selected={showCompletedItems} onclick={() => showCompletedItems = !showCompletedItems} title="Show completed">
        <RotateCcwClock />
    </button>
</h1>

{#snippet plannerItem(classes: string[], item: PlannerItem, content: Snippet)}
    {@const course = courseItems?.find(c => parseInt(c.id) === item.course_id)}
    <li class={[...classes, "-card -hover-hl"]} style="--highlight: {course?.color}">
        <a
            href={getPlannableLink(canvasHostname, item)}
            class="-vflex"
            target={isPlannableLinkExternal(item) ? "_blank" : undefined}
            rel={isPlannableLinkExternal(item) ? "noreferrer" : undefined}
        >
            <span class="course-name">{item.context_name}</span>
            <span class="plannable-title">{item.plannable.title}</span>
            {@render content()}
        </a>
    </li>
{/snippet}

{#if plannerItems.value?.length === 0 || !todoGroupedByDate}
    <p class="-empty">No upcoming items.</p>
{:else}
    {@const timeFormatter = new Intl.DateTimeFormat([], { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })}
    {@const dateFormatter = new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric" })}
    {#each Object.entries(todoGroupedByDate) as [date, items]}
        {@const hasIncompleteItems = items.some(item => !item.submissions.submitted)}
        <h2 class="time-header -hflex" class:completed={!hasIncompleteItems}>
            {dateFormatter.format(new Date(date))}
            <!-- if before today, show a little overdue icon -->
            {#if new Date(date + 24 * 60 * 60 * 1000) < new Date() && hasIncompleteItems}
                <span title="Overdue" class="icon -error"><Clock /></span>
            {/if}
        </h2>
        <ul class="planner-items -vflex">
            {#each items as item}
                {@const dueDate = new Date(item.plannable.due_at)}
                <!-- TODO: special styles for overridden completion -->
                {@const completed = plannerItemCompleted(item)}
                {#snippet content()}
                    {#if !completed}
                        <span class="due-date">
                            Due {timeFormatter.format(dueDate)}
                            <span class:-error={dueDate < new Date()}>({formatRelative(dueDate)})</span>
                        </span>
                    {/if}
                {/snippet}
                {@render plannerItem([completed ? "completed" : ""], item, content)}
            {/each}
        </ul>
    {/each}

    <br />
    <h2>Recent feedback</h2>
    {#if recentFeedbackItems?.length === 0}
        <p class="-empty">No recent feedback.</p>
    {:else}
        <ul class="planner-items -vflex">
            {#each recentFeedbackItems as item}
                {#snippet content()}
                    <span class="feedback">"{item.submissions.feedback?.comment}"</span>
                {/snippet}
                {@render plannerItem(["completed-feedback"], item, content)}
            {/each}
        </ul>
    {/if}
{/if}
{#if plannerItems.error}
    <p class="-empty">Error loading planner items: {plannerItems.error}</p>
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
h2 {
    font-size: var(--font-md);
    font-weight: normal;
    color: var(--text);

    /* kind of hacky but whatever */
    margin: -0.25rem 0 -0.65rem 0;
}

.planner-items {
    gap: 0.5rem;
    padding: 0;
    margin: 0;
}
h2.time-header {
    font-size: var(--font-sm);
    font-weight: normal;
    color: var(--text-muted);

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
    border-radius: var(--radius) 0 0 var(--radius);
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

    .feedback {
        color: var(--text-muted);
        font-size: var(--font-xs);
        font-style: italic;

        /* best-effort limit to 4 lines */
        display: -webkit-box;
        -webkit-line-clamp: 4;
        line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &.completed {
        opacity: 0.5;
        text-decoration: line-through;
        border-right-color: var(--text-muted);
    }
    &.completed-feedback {
        opacity: 0.9;
        /* make feedback items stand out less to make it obvious they're not actionable */
        border-color: transparent;
        box-shadow: none;
        border-right-color: var(--text-muted);
    }
}
</style>