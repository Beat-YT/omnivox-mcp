import { GetNotesSommaireModel } from "@api/Lea";
import { getDefaultTermId } from "@common/omnivoxHelper";
import { gradesSummary, GradeSummaryItem } from "@schemas/courses";
import { transformGradesSummary } from "@transformers/courses/grades-summary";
import { mcpServer } from "src/mcp/server";
import { z } from "zod";

const input = z.object({
    term_id: z.string().optional(),
});

mcpServer.registerTool('get-grades-summary',
    {
        title: 'Get Grades Summary',
        description: 'Retrieve a list of grades summaries for the user\'s courses in a given term or the current term.',
        inputSchema: input,
        outputSchema: gradesSummary,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
        }
    },
    async (args) => {
        const term = args.term_id || await getDefaultTermId();
        const model = await GetNotesSommaireModel(term);
        const grades = transformGradesSummary(model, term);

        const gradesTexts = grades.courses.map(c => ({
            type: 'text' as const,
            text: mapCourseToText(c)
        }));

        return {
            content: [
                {
                    type: 'text',
                    text: `Here is the summary of the user's courses on for term ID: ${grades.term_id} (${grades.courses.length} courses total)`
                },
                ...gradesTexts,
            ],
            structuredContent: grades,
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