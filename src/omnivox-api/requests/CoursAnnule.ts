import { CoursAnnuleModel } from "@typings/CoursAnnuleModel";
import { makeSkytechRequest } from "../puppet/index";

export function GetCoursAnnuleModel() {
    return makeSkytechRequest<CoursAnnuleModel.ResponseModel>(
        '/Mobl/CoursAnnule/GetCoursAnnuleModel',
        {}
    );
}
