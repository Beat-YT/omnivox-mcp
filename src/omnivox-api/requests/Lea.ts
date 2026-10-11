import { omnivox } from "../puppet";
import { DefaultModel } from "@typings/Lea/DefaultModel";
import { DocumentsListeModel } from "@typings/Lea/DocumentsListeModel";
import { CommuniquesListeModel } from "@typings/Lea/CommuniquesListeModel";
import { TravauxSommaireModel } from "@typings/Lea/TravauxSommaireModel";
import { TravauxListeModel } from "@typings/Lea/TravauxListeModel";
import { TravauxDetailModel } from "@typings/Lea/TravauxDetailModel";
import { NotesSommaireModel } from "@typings/Lea/NotesSommaireModel";
import { NotesDetailWebModel } from "@typings/Lea/NotesDetailWebModel";
import { NotesDetailModel } from "@typings/Lea/NotesDetailModel";
import { AbsencesSommaireModel } from "@typings/Lea/AbsencesSommaireModel";
import { EnseignantsDetailModel } from "@typings/Lea/EnseignantsDetail";
import { EnseignantsSommaireModel } from "@typings/Lea/EnseignantsSommaire";

export function GetDefaultModel(term?: string) {
    return omnivox.postJson<DefaultModel.ResponseModel>(
        '/Mobl/LeaCommun/GetDefaultModel',
        { AnSession: term || '' }
    );
}

export function GetTravauxSommaireModel(term: string) {
    return omnivox.postJson<TravauxSommaireModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetTravauxSommaireModel',
        { AnSession: term }
    );
}

export function GetNotesSommaireModel(term: string) {
    return omnivox.postJson<NotesSommaireModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetNotesSommaireModel',
        { AnSession: term }
    );
}

export function GetAbsencesSommaireModel(term: string) {
    return omnivox.postJson<AbsencesSommaireModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetAbsencesSommaireModel',
        { AnSession: term }
    );
}

export function GetTravauxListeModel(courseId: string, term: string) {
    return omnivox.postJson<TravauxListeModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetTravauxListeModel',
        { AnSession: term, idClasse: courseId }
    );
}

export function GetTravauxDetailModel(course_id: string, assignment_id: string, term: string) {
    return omnivox.postJson<TravauxDetailModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetTravauxDetailModel',
        { AnSession: term, idClasse: course_id, idTravail: assignment_id, isAddConsultation: true }
    );
}


export function GetDocumentsListeModel(courseId: string, term: string) {
    return omnivox.postJson<DocumentsListeModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetDocumentsListeModel',
        { AnSession: term, idClasse: courseId }
    );
}

export function GetCommuniquesListeModel(courseId: string, term: string) {
    const [noCours, noGroupe] = courseId.split('.');
    return omnivox.postJson<CommuniquesListeModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetCommuniquesListeModel',
        { AnSession: term, noCours, noGroupe }
    );
}

export function GetNotesDetailModel(courseCode: string, groupCode: string, term: string) {
    return omnivox.postJson<NotesDetailModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetNotesDetailModel',
        { AnSession: term, noCours: courseCode, noGroupe: groupCode }
    );
}

export function GetNotesDetailWebModel(courseCode: string, groupCode: string, term: string) {
    return omnivox.postJson<NotesDetailWebModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetNotesDetailWebModel',
        { AnSession: term, noCours: courseCode, noGroupe: groupCode }
    );
}

export function GetEnseignantsDetailModel(oid: string, term: string) {
    return omnivox.postJson<EnseignantsDetailModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetEnseignantsDetailModel',
        {
            oidProfesseur: oid,
            anSession: term
        }
    );
}

export function GetEnseignantsSommaireModel(term: string) {
    return omnivox.postJson<EnseignantsSommaireModel.ResponseModel>(
        '/Mobl/LeaEtudiant/GetEnseignantsSommaireModel',
        { anSession: term }
    );
}
