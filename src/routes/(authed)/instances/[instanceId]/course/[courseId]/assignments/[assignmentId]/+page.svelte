<script lang="ts">
	import { dynamicDataState } from "$lib/dynamicData.svelte";
	import ExternalLink from "@lucide/svelte/icons/external-link";
	import UserContentViewer from "$lib/components/UserContentViewer.svelte";
	import type { PageData } from "./$types";
    import { pageData } from "$lib/pageData.svelte";
    import PageHeader from "$lib/components/PageHeader.svelte";
    import { formatRelative } from "$lib/datetime";

	let { data }: { data: PageData } = $props();
	const assignment = dynamicDataState(() => data.assignment);
	const canvasAssignment = $derived(assignment.value);
	const submission = $derived(canvasAssignment?.submission);
	const isSubmitted = $derived(Boolean(submission?.submitted_at) || submission?.workflow_state === "submitted" || submission?.workflow_state === "graded");
	
	pageData(() => ({
		title: canvasAssignment?.name ?? "Assignment",
		canvasUrl: canvasAssignment?.html_url ?? null
	}));

	function formatDate(value: string | null): string | undefined {
		if(!value) return undefined;
		const date = new Date(value);
		if(Number.isNaN(date.getTime())) return value;
		return date.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit"
		});
	}

	function submissionTypeLabel(type: string): string {
		return {
			online_url: "a website url",
			online_text_entry: "a text entry",
			online_upload: "a file upload",
			media_recording: "a media recording",
			online_quiz: "an online quiz",
			discussion_topic: "a discussion",
			external_tool: "an external tool",
			on_paper: "on paper",
			none: "nothing"
		}[type] ?? type.replaceAll("_", " ");
	}

	function commentAuthor(
        // what a type...
        comment: NonNullable<NonNullable<typeof submission>['submission_comments']>[number]
    ): string {
		return comment.author_name || comment.author?.display_name || comment.author?.name || "Unknown author";
	}
</script>

{#if canvasAssignment}
	<div class="assignment-page">
		<header class="assignment-header -vflex">
			<!-- technically this nests <header> elements but eehhhhh -->
			<PageHeader category="Assignments" title={canvasAssignment.name ?? "Assignment"} />
            
			<div class="metadata">
				{#if canvasAssignment.due_at}<span title={formatRelative(new Date(canvasAssignment.due_at))}>
					<strong>Due</strong> {formatDate(canvasAssignment.due_at)}
				</span>{/if}
				{#if canvasAssignment.points_possible !== null}<span>
					<strong>Points</strong> {canvasAssignment.points_possible}
				</span>{/if}
				{#if canvasAssignment.submission_types.length}<span>
					<strong>Submitting</strong> {canvasAssignment.submission_types.map(submissionTypeLabel).join(", ")}
				</span>{/if}
				{#if canvasAssignment.lock_at}<span title={formatRelative(new Date(canvasAssignment.lock_at))}>
					<strong>Available</strong> until {formatDate(canvasAssignment.lock_at)}
				</span>{/if}
            </div>
            
            {#if canvasAssignment.locked_for_user}
			    <p class="notice -warning">{canvasAssignment.lock_explanation ?? "This assignment is locked."}</p>
            {/if}
			{#if canvasAssignment.omit_from_final_grade}
			    <p class="notice -info">This assignment does not count toward the final grade.</p>
            {/if}
		</header>

		<div class="assignment-content">
			<UserContentViewer body={canvasAssignment.description ?? undefined} />
		</div>

		<aside class="submission-sidebar -vflex">
			<a class="canvas-link -input" href={canvasAssignment.html_url} target="_blank" rel="noreferrer">
				Open in Canvas <ExternalLink />
			</a>

			{#if isSubmitted && submission}
				<section class="sidebar-card -card -vflex">
					<h2>Submission</h2>
					{#if submission.submitted_at}<p>Submitted {formatDate(submission.submitted_at)}</p>{/if}
					{#if submission.attempt !== null}<p>Attempt {submission.attempt}</p>{/if}
                    {#if submission.url}
                        <a class="submission-link" href={submission.url} target="_blank" rel="noreferrer">
                            Open submission <ExternalLink />
                        </a>
                    {/if}
                    {#if submission.preview_url}
                        <a class="submission-link" href={submission.preview_url} target="_blank" rel="noreferrer">
                            Submission preview <ExternalLink />
                        </a>
                    {/if}
				</section>

				{#if submission.grade !== null || submission.score !== null}
					<section class="sidebar-card -card -vflex">
						<h2>Grade</h2>
                        <p>
                            <strong class="grade">
                                {submission.grade ?? submission.score}
                            </strong>
                            {#if (submission.grade === null || parseInt(submission.grade) === submission.score) &&
                                canvasAssignment.points_possible !== null}
                                ({canvasAssignment.points_possible} pts possible)
                            {/if}
                        </p>
					</section>
				{/if}

				{#if submission.submission_comments?.length}
					<section class="sidebar-card -card -vflex">
						<h2>Comments</h2>
						<div class="comments -vflex">
							{#each submission.submission_comments as comment (comment.id)}
								<article class="comment -vflex">
                                    <strong>{commentAuthor(comment)}</strong>
									<p>{comment.comment}</p>
                                    <time datetime={comment.created_at}>{formatDate(comment.created_at)}</time>
								</article>
							{/each}
						</div>
					</section>
				{/if}
			{:else}
				<section class="sidebar-card placeholder -card -vflex">
					<h2>No submission</h2>
					<p class="-empty">You have not submitted this assignment yet.</p>
				</section>
			{/if}
		</aside>
	</div>
{:else if assignment.error}
	<p class="-empty">Error loading assignment: {assignment.error}</p>
{:else}
	<p class="-empty">Loading assignment...</p>
{/if}

<style lang="scss">
.assignment-page {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 19rem;
    grid-template-rows: auto 1fr;
	grid-template-areas:
		"header sidebar"
		"content sidebar";
    
	gap: 0 1.5rem;
	max-width: 140ch;
	margin: 0 auto;

    .assignment-content {
        grid-area: content;
        min-width: 0;
    }

    .submission-sidebar {
        grid-area: sidebar;
        gap: 0.5rem;
        min-width: 0;
    }
}

.assignment-header {
    gap: 1rem;
    flex-grow: 0;

    h1 { grid-area: title; }
    .metadata {
        grid-area: metadata;

        width: 100%;
        display: flex;
        flex-wrap: wrap;
		gap: 0.35rem 2rem;
        color: var(--text-muted);

        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        padding: 0.5rem;

		strong { color: var(--text); }
    }
    .canvas-link {
        grid-area: submit;
        align-self: start;
    }
    .notice {
        grid-area: notice;

        padding: 0.5rem 0.75rem;
        border-radius: var(--radius);

		&.-warning { border: 1px solid var(--warning); }
		&.-info { border: 1px solid var(--info); }
    }
}

.sidebar-card {
	padding: 0.5rem 0.75rem;
	gap: 0.25rem;

	h2 { font-size: var(--font-lg); }
	p { font-size: var(--font-sm); }

    &.placeholder {
        gap: 0.5rem;
    }
}

.submission-link {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	margin-top: 0.35rem;

	:global(svg) { width: 1rem; height: 1rem; }
}

.grade {
    font-size: var(--font-lg);
    color: var(--success);
}

.comments {
    gap: 0.5rem;
}
.comment {
	padding-top: 0.5rem;
	border-top: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
    gap: 0.25rem;

	p {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font-size: var(--font-xs);
    }
	time { color: var(--text-muted); font-size: var(--font-xs); }
}

.canvas-link {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	flex-shrink: 0;
	text-decoration: none;
	---bg: var(--surface);
	---text: var(--text);

	:global(svg) { width: 1rem; height: 1rem; }
}

@media (max-width: 1000px) {
	.assignment-header {
        flex-direction: column;
    }
	.assignment-page {
		grid-template-columns: 1fr;
		grid-template-areas:
			"header"
			"content"
			"sidebar";
		padding-right: 2rem;
	}
}
</style>