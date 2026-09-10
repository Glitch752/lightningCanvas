<script lang="ts">
    import type { PageData } from "./$types";
    import { pageData } from "../+layout.svelte";
    import { dynamicDataState } from "$lib/dynamicData.svelte";

	let { data }: { data: PageData } = $props();

    pageData({
		title: "Dashboard",
		// svelte-ignore state_referenced_locally
		canvasUrl: data.settings.canvasHostname
	});

    const courses = dynamicDataState(() => data.courses);
</script>

<h1>Dashboard</h1>

{#if courses.value?.length === 0}
	<p>No courses found.</p>
{:else}
	<h2>Courses</h2>
	<ul>
		{#each courses.value as course}
			<li>{course.name}{course.course_code ? ` (${course.course_code})` : ""}</li>
		{/each}
	</ul>
{/if}

{#if courses.loading}
    <p>Loading courses...</p>
{/if}

{#if courses.error}
    <p>Error loading courses: {courses.error}</p>
{/if}