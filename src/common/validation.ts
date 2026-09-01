import { z } from "zod";

export const recipientIdSchema = z.string().uuid({
    message: "recipient_id must be a valid UUID v4 (e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'). Use search-people or get-course-people to find recipient IDs.",
});

export const courseIdSchema = z.string().refine(
    (val) => val.includes("."),
    {
        message: "course_id must be the full ID including the group number (e.g. '2433C5EM.1012'), not just the course code. Use get-courses-summary to find full course IDs.",
    }
);
