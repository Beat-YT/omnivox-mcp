import { ResponseEnvelope } from "../ResponseEnvelope";

export namespace TravauxSommaireModel {
    export interface ResponseModel extends ResponseEnvelope {
        ListeSommaire: ListeSommaire[];
        AnSession: string;
        AnSessionDisponible: AnSessionDisponible;
    }

    export interface AnSessionDisponible {
        AnSessionDisponible: string[];
        AnSessionDefault: string;
    }

    export interface ListeSommaire {
        ListeTitreTravauxARemettre: any[];
        IdCoursGroupe: number;
        NoCours: string;
        NoGroupe: string;
        NomCours: string;
        NbEnoncesTotal: number;
        NouvellesCorrections: number;
        NbNouveaute: number;
        IndicateurNouveauTravaux: boolean;
        DepotEnLigne: number;
    }
}