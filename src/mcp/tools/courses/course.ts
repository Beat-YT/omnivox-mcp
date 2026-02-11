import { GetNotesDetailWebModel, GetNotesSommaireModel } from "@api/Lea";
import { gradeCourseSummaryItemSchema, GradeSummaryItem } from "@schemas/courses";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";
import { transformGradeItem } from "@transformers/courses/grades-summary";

const input = z.object({
    term_id: z.string().optional(),
    course_id: z.string(),
});

const output = z.object({
    grade: gradeCourseSummaryItemSchema,
    teachers: z.array(z.string()),
});

mcpServer.registerTool('get-course-info',
    {
        title: 'Get Course Info',
        description: 'Retrieve info about a specific course. Includes the teachers names and grade summary.',
        inputSchema: input,
        outputSchema: output,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        }
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetNotesSommaireModel(term);
        const [course_code, course_group] = args.course_id.split('.');

        const gradeWeb = await GetNotesDetailWebModel(course_code, course_group, term);

        const courseModel = model.ListeInfosNotes.find(c =>
            c.NoCours === course_code && c.NoGroupe === course_group
        );

        const grade = transformGradeItem(courseModel);
        const gradeText = mapCourseToText(grade);

        return {
            content: [
                {
                    type: 'text',
                    annotations: {
                        audience: ["assistant"],
                    },
                    text: `Here is the summary of the user's course ${grade.title} for term ID: ${grade.term_id}.`
                },
                {
                    type: 'text',
                    text: 'Teachers for this course: ' + gradeWeb.NoteEvaluationWeb.Enseignants.join(', ')
                },
                {
                    type: 'text',
                    text: gradeText,
                }
            ],
            structuredContent: {
                grade,
                teachers: gradeWeb.NoteEvaluationWeb.Enseignants,
            },
        }
    }
)

function mapCourseToText(course: GradeSummaryItem) {
    const isFinal = course.has_final_grade;
    const hasClassAvg = course.course_average && course.course_median;

    const classStats = [
        `Average=${course.course_average + '%'}`,
        `Median=${course.course_median + '%'}`,
        `Std Deviation=${course.course_std_dev + '%'}`,
    ].join(', ');

    return [
        `Course: ${course.title}`,
        `Code: ${course.course_code}`,
        `Group: ${course.group}`,
        isFinal &&
        `Final Grade Transmitted: ${course.final_grade}%`,
        isFinal && course.class_average_final &&
        `Final Class Average: ${course.class_average_final}%`,
        `Current Grade: ${course.projected_grade}/${course.accumulated_weight} (earned / weight)`,
        `Remaining Weight: ${100 - course.accumulated_weight}%`,
        `Class Stats: ${hasClassAvg ? classStats : 'N/A'}`,
        `New Eval Available: ${bool(course.new_evaluations_count)}`,
        `Status: ${course.status}`,
    ].join('\n');
}

function bool(value: unknown) {
    return value ? 'true' : 'false';
}