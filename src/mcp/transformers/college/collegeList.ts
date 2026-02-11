import { CollegeDef } from "@typings/college";
import { collegeItemSchema } from "@schemas/college/collegeList";

export function transformCollegeList(
    response: CollegeDef[]
) {
    const list = response.map(college => {
        return collegeItemSchema.parse({
            code: college.CodeCollege,
            name: college.NomCollege,
            omnivoxUrl: college.UrlCollege
        });
    })

    return list;
}