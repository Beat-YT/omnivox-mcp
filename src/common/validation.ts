import { z } from "zod";

export const courseIdSchema = z.string().refine(
    (val) => val.includes("."),
    {
        message: "course_id must be the full ID including the group number (e.g. '2433C5EM.1012'), not just the course code. Use get-courses-summary to find full course IDs.",
    }
);
