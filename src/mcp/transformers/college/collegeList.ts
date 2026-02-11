import { CollegeDef } from "@typings/college";
import { CollegeItemSchema, CollegeListResponse } from "@schemas/college/collegeList";

export function transformCollegeList(
    response: CollegeDef[]
): CollegeListResponse {
    const colleges = response.map(college => {
        return CollegeItemSchema.parse({
            code: college.CodeCollege,
            name: college.NomCollege,
        });
    })

    return { count: colleges.length, colleges };
}