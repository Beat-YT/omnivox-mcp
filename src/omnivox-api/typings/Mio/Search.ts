export namespace MioSearch {
    export interface IndividuItem {
        OID: string;
        Numero: string;
        TitreAffiche: string;
        TypeIndividu: number;
        NoProgDept: string | null;
        NomProgDept: string | null;
        DateFinAbsence: number;
        IsAbsent: boolean;
        NomCompletAvecAbsence: string;
    }
}
