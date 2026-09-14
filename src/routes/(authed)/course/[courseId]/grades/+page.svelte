<script lang="ts">
    import { page } from "$app/state";
    import { getGlobalCourse } from "../+layout.svelte";
	import { pageData } from "../../../../+layout.svelte";
    import type { PageData } from "./$types";

    const { data }: { data: PageData } = $props();

    const globalCourse = getGlobalCourse();
    const course = $derived(globalCourse.value?.course);
    pageData(() => ({
        title: `${course?.displayedName ?? course?.fullName ?? "Unknown course"} - Grades`,
        canvasUrl: `${data.settings.canvasHostname}/courses/${page.params.courseId}/grades`
    }));
</script>

todo