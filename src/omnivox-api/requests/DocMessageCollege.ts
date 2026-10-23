import { DocMessageCollegeModel } from "@typings/DocMessageCollege";
import { omnivox } from "../puppet";

export function GetDocMessageCollegeModel() {
    return omnivox.postJson<DocMessageCollegeModel>(
        '/Mobl/DocMessageCollege/GetDefaultModel',
        {}
    );
}
