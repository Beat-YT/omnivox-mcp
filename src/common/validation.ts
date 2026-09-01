import { z } from "zod";

export const termIdSchema = z.string()
    .regex(/^\d{5}$/, {
        message: "term_id must be a 5-digit string in YYYYN format (4-digit year + cycle number, e.g. '20263'). Use get-terms to find valid term IDs.",
    })
    .describe("Academic term ID in YYYYN format (e.g. '20263').");

export const messageIdSchema = z.uuid({
    message: "message_id must be a valid UUID v4 (e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'). Use get-mio-messages to find message IDs.",
});

export const recipientIdSchema = z.uuid({
    message: "recipient_id must be a valid UUID v4 (e.g. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'). Use search-people or get-course-people to find recipient IDs.",
});

export const courseIdSchema = z.string().refine(
    (val) => val.includes("."),
    {
        message: "course_id must be the full ID including the group number (e.g. '2433C5EM.1012'), not just the course code. Use get-courses-summary to find full course IDs.",
    }
).describe("Full course ID including group number (e.g. '2433C5EM.1012').");
