<script lang="ts" module>
    export function getPlannerLink(instances: CanvasInstance[], item: CanvasPlannerItem): string {
        const instance = instances.find(i => i.id === item.instanceId);
        if(!instance) return `/instances/${item.instanceId}/course/${item.courseId}`;
        const canvasHostname = instance.hostname;
        
        switch(item.plannableType) {
            case "assignment":
                return `/instances/${item.instanceId}/course/${item.courseId}/assignments/${item.plannableId}`;
            case "announcement":
                return `/instances/${item.instanceId}/course/${item.courseId}/announcements/${item.plannableId}`;
            case "quiz":
                return `${canvasHostname}/courses/${item.courseId}/quizzes/${item.plannableId}`;
            default:
                return `/instances/${item.instanceId}/course/${item.courseId}`;
        }
    }
    export function isPlannerLinkExternal(item: CanvasPlannerItem): boolean {
        return item.plannableType === "quiz";
    }
    export function isPlannerItemCompleted(item: CanvasPlannerItem): boolean {
        if(item.plannerOverride?.markedComplete) return true;
        if(item.plannableType !== "assignment") return false;
        return item.submissions?.submitted ?? false;
    }
</script>

<script lang="ts">
    import { type DynamicDataState } from "$lib/dynamicData.svelte";
	import Clock from "@lucide/svelte/icons/clock";
	import RotateCcwClock from "@lucide/svelte/icons/rotate-ccw-clock";
    import CircleCheck from "@lucide/svelte/icons/circle-check";
    import Circle from "@lucide/svelte/icons/circle";
    import { formatRelative } from "$lib/datetime";
    import type { CanvasCourse, CanvasPlannerItem } from "$lib/server/canvas/courses";
    import type { Snippet } from "svelte";
    import type { CanvasInstance } from "$lib/settings";
    import { SvelteSet } from "svelte/reactivity";
    import CourseItemIcon from "$lib/components/CourseItemIcon.svelte";

    const { plannerItems, courseItems, instances }: {
        plannerItems: DynamicDataState<CanvasPlannerItem[] | null>,
        courseItems: (CanvasCourse & { color: string })[] | null | undefined,
        instances: CanvasInstance[]
    } = $props();

    const recentFeedbackItems = $derived(plannerItems.value
        ?.filter(item => item.submissions?.feedback?.comment)
        .sort((a, b) => {
            const aDate = new Date(a.submissions?.feedback?.comment ? (a.plannable.dueAt ?? a.plannableDate) : 0);
            const bDate = new Date(b.submissions?.feedback?.comment ? (b.plannable.dueAt ?? b.plannableDate) : 0);
            return bDate.getTime() - aDate.getTime();
        }));

    let showCompletedItems = $state(false);

    const todoGroupedByDate = $derived.by(() => {
        // TODO: manually dismissing items
        const items = showCompletedItems ? plannerItems.value :
            plannerItems.value?.filter(i => !isPlannerItemCompleted(i));
        if(!items) return null;

        const grouped: Record<string, typeof items> = {};
        for(const item of items) {
            const date = new Date(item.plannable.dueAt ?? item.plannableDate).toDateString();
            if(!grouped[date]) grouped[date] = [];
            grouped[date].push(item);
        }
        return grouped;
    });

    /** planner items that are currently being updated */
    const pendingPlannerItems = $state(new SvelteSet<string>());
    /** without a specific key function, we could have duplicates across instances and stuff */
    const plannerItemKey = (item: CanvasPlannerItem) => `${item.instanceId}:${item.plannableType}:${item.plannableId}`;

    async function togglePlannerItem(item: CanvasPlannerItem) {
        const key = plannerItemKey(item);
        // don't make a second request while the first one may still be creating the override
        if(pendingPlannerItems.has(key)) return;
        pendingPlannerItems.add(key);

        const oldCompleted = isPlannerItemCompleted(item);
        const oldPlannerOverride = item.plannerOverride;

        const markedComplete = !oldCompleted;
        plannerItems.update(items => items?.map(current => current === item ? {
            ...current,
            plannerOverride: { id: item.plannerOverride?.id, markedComplete }
        } : current));

        try {
            const response = await fetch("/planner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instanceId: item.instanceId,
                    courseId: item.courseId,
                    plannableType: item.plannableType,
                    plannableId: item.plannableId,
                    plannerOverrideId: item.plannerOverride?.id,
                    markedComplete
                })
            });
            if(!response.ok) throw new Error(await response.text());

            const result = await response.json() as { plannerOverrideId: number; markedComplete: boolean };
            // save the new planner override id if it was created
            plannerItems.update(items => {
                return items?.map(current => plannerItemKey(current) === key ? {
                    ...current,
                    plannerOverride: {
                        id: result.plannerOverrideId,
                        markedComplete: result.markedComplete
                    }
                } : current);
            });
        } catch(error) {
            plannerItems.update(items => items?.map(current => current === item ? {
                ...current,
                plannerOverride: oldPlannerOverride
            } : current));
            
            console.error("Failed to update planner item", error);
        } finally {
            pendingPlannerItems.delete(key);
        }
    }
</script>

<h1 class="-hflex">
    Todo

    <!-- TODO: more advanced controls and persistence here -->
    <button class:-selected={showCompletedItems} onclick={() => showCompletedItems = !showCompletedItems} title="Show completed">
        <RotateCcwClock />
    </button>
</h1>

{#snippet plannerItem(classes: string[], item: CanvasPlannerItem, content: Snippet)}
    {@const course = courseItems?.find(c => parseInt(c.id) === item.courseId)}
    <li class={[...classes, "-card -hover-hl"]} style="--highlight: {course?.color}">
        <a
            href={getPlannerLink(instances, item)}
            class="-vflex"
            target={isPlannerLinkExternal(item) ? "_blank" : undefined}
            rel={isPlannerLinkExternal(item) ? "noreferrer" : undefined}
        >
            <span class="course-name">{course?.displayedName}</span>
            <span class="plannable-title" title={item.plannable.title}>
                <!-- this is very much a personal preference thing, but i don't want the icons to show for normal assignments -->
                {#if item.plannableType !== "assignment"}
                    <CourseItemIcon type={item.plannableType} title={item.plannable.title} /><!--
                i long for the day when white-space-trim is well-supported
                -->{/if}{item.plannable.title}
            </span>
            {@render content()}
        </a>
        <button
            class="toggle-complete"
            title={isPlannerItemCompleted(item) ? "Mark incomplete" : "Mark complete"}
            aria-label={isPlannerItemCompleted(item) ? "Mark incomplete" : "Mark complete"}
            disabled={pendingPlannerItems.has(plannerItemKey(item))}
            onclick={(event) => { event.preventDefault(); event.stopPropagation(); togglePlannerItem(item); }}
        >
            {#if isPlannerItemCompleted(item)}<CircleCheck />{:else}<Circle />{/if}
        </button>
    </li>
{/snippet}

{#if plannerItems.value?.length === 0 || !todoGroupedByDate}
    <p class="-empty">No upcoming items.</p>
{:else}
    {@const timeFormatter = new Intl.DateTimeFormat([], { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })}
    {@const dateFormatter = new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric" })}
    {#each Object.entries(todoGroupedByDate).toSorted((a, b) =>
        new Date(a[0]).getTime() - new Date(b[0]).getTime()
    ) as [date, items]}
        {@const hasIncompleteItems = items.some(item => !isPlannerItemCompleted(item))}
        <h2
            class="time-header -hflex"
            class:completed={!hasIncompleteItems}
            class:today={new Date(date).toDateString() === new Date().toDateString()}
        >
            {dateFormatter.format(new Date(date))}
            <!-- if before today, show a little overdue icon -->
            {#if new Date(date + 24 * 60 * 60 * 1000) < new Date() && hasIncompleteItems}
                <span title="Overdue" class="icon -error"><Clock /></span>
            {/if}
        </h2>
        <ul class="planner-items -vflex">
            {#each items as item}
                <!-- TODO: special styles for overridden completion -->
                {@const completed = isPlannerItemCompleted(item)}
                {#snippet content()}
                    {#if !completed && item.plannable.dueAt}
                        {@const dueDate = new Date(item.plannable.dueAt)}
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
                    <span class="feedback">"{item.submissions?.feedback?.comment}"</span>
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
    &.today {
        color: color-mix(in srgb, var(--primary) 30%, var(--text));
    }
}
li {
    position: relative;
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

    .toggle-complete {
        position: absolute;
        top: 0.25rem;
        right: 0.35rem; /* looks a little more balanced with the border */
        padding: 0;
        line-height: 0;
        border: 0;
        background: transparent;
        color: var(--text-muted);
        opacity: 0;
        transition: opacity 120ms ease, color 120ms ease;

        :global(svg) {
            width: 1.25rem;
            height: 1.25rem;
        }
        &:hover {
            color: var(--primary);
        }
    }
    &:hover .toggle-complete, &:focus-within .toggle-complete {
        opacity: 1;
    }

    .course-name {
        color: var(--highlight);
        font-size: var(--font-xs);
    }
    .plannable-title {
        /* best-effort limit to 2 lines with webkit weirdness. this works in firefox too */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;

        > :global(span) {
            padding-right: 0.35em;
        }
        :global(svg) {
            width: 0.9rem;
            height: 0.9rem;
            color: var(--highlight);
        }
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