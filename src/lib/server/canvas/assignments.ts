import { canvasFetch } from "../canvas";
import { DynamicData, DynamicDataRegistry } from "../dynamicData";

export type CanvasAssignment = {
    id: number;
    name: string;
    description: string | null;
    due_at: string | null;
    lock_at: string | null;
    unlock_at: string | null;
    html_url: string;
    points_possible: number | null;
    submission_types: string[];
    published: boolean;
    locked_for_user: boolean;
    lock_explanation?: string | null;
    submission?: CanvasSubmission | null;
};

export type CanvasSubmissionComment = {
    id: number;
    author_id: number;
    author_name: string;
    author?: { display_name?: string; name?: string } | null;
    comment: string;
    created_at: string;
};

export type CanvasSubmission = {
    assignment_id: number;
    attempt: number | null;
    body: string | null;
    grade: string | null;
    score: number | null;
    url: string | null;
    preview_url: string | null;
    submitted_at: string | null;
    submission_type: string | null;
    submission_comments?: CanvasSubmissionComment[] | null;
    workflow_state: "submitted" | "unsubmitted" | "graded" | "pending_review" | string;
};

/** Dynamic data for an individual assignment in a course. */
export const courseAssignmentDataRegistry = new DynamicDataRegistry<string, CanvasAssignment | null>((key) => {
    const separator = key.indexOf("/");
    const courseId = key.slice(0, separator);
    const assignmentId = key.slice(separator + 1);

    return new DynamicData<CanvasAssignment | null>({
        key: `courses/${courseId}/assignments/${assignmentId}`,
        ttlMs: 1000 * 60 * 60 * 24 * 30,
        requireInitialFetch: true,
        refreshThresholdMs: 1000 * 60 * 15,
        fetch: () => canvasFetch<CanvasAssignment>(
            `/api/v1/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}?include[]=submission&include[]=submission_comments`
        )
    });
});
