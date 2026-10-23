import { FormulaireModel } from "@typings/Formulaire";
import { omnivox } from "../puppet";

export function GetFormulaireModel() {
    return omnivox.postJson<FormulaireModel>(
        '/Mobl/Formulaire/GetFormulaireModel',
        {}
    );
}
