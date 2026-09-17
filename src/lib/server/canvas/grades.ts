import { canvasFetch } from "../canvas";
import { DynamicData, DynamicDataRegistry } from "../dynamicData";

/** only the subset we need; canvas sends a lot of data */
export type CanvasGradeAssignment = {
	id: number;
	name: string;
	html_url?: string;
	due_at: string | null;
	created_at: string;
	points_possible: number | null;
	assignment_group_id: number;
	submission?: {
		score: number | null;
		grade: string | null;
		submitted_at: string | null;
		workflow_state?: string;
	} | null;
};

export type CanvasAssignmentGroup = {
	id: number;
	name: string;
	group_weight: number;
	assignments: CanvasGradeAssignment[];
};

export type CanvasGrades = {
	currentGrade: string | null;
	currentScore: number | null;
	groups: CanvasAssignmentGroup[];
};

/** dynamic data for the grades and assignment groups */
export const courseGradesDataRegistry = new DynamicDataRegistry<[instanceId: string, courseId: string], CanvasGrades>(
	([instanceId, courseId]) => new DynamicData<CanvasGrades>({
		key: `instances/${instanceId}/courses/${courseId}/grades`,
		ttlMs: 1000 * 60 * 60 * 24 * 30,
		requireInitialFetch: false,
		refreshThresholdMs: 1000 * 60 * 15,
		refreshIntervalMs: 1000 * 60 * 60 * 6,
		fetch: async () => {
			const [enrollments, groups] = await Promise.all([
				canvasFetch<Array<{ type: string; grades?: { current_grade: string | null; current_score: number | null } }>>(
					instanceId, `/api/v1/courses/${encodeURIComponent(courseId)}/enrollments?user_id=self&type[]=StudentEnrollment&include[]=grades`
				),
				canvasFetch<CanvasAssignmentGroup[]>(
					instanceId, `/api/v1/courses/${encodeURIComponent(courseId)}/assignment_groups?include[]=assignments&include[]=submission&per_page=500`
				)
			]);
			const enrollment = enrollments?.find((item) => item.type === "StudentEnrollment");
			return {
				currentGrade: enrollment?.grades?.current_grade ?? null,
				currentScore: enrollment?.grades?.current_score ?? null,
				groups: groups ?? []
			};
		}
	})
);