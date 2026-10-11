import { CoursAnnuleModel } from "@typings/CoursAnnuleModel";
import { omnivox } from "../puppet";

export function GetCoursAnnuleModel() {
    return omnivox.postJson<CoursAnnuleModel.ResponseModel>(
        '/Mobl/CoursAnnule/GetCoursAnnuleModel',
        {}
    );
}
