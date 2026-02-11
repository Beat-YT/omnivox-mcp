import { toIso } from "@common/transformHelpers";
import {
    assignmentDetailSchema,
    assignmentSubmissionSchema,
    assignmentFileSchema,
    AssignmentDetail
} from "@schemas/courses/assignment-detail"
import { TravauxDetailModel } from "@typings/Lea/TravauxDetailModel"


export function transformAssignmentDetail(
    response: TravauxDetailModel.ResponseModel
): AssignmentDetail | null {

    const travail = response.Travail;
    if (!travail?.IDTravail || !travail?.Titre) return null

    const deadline = travail.TimeStampDateHeureRemise || travail.DateHeureRemise || 0;

    const student_submissions = travail.ListeDepotsTravail?.map(depot => {
        const depotDate = depot.TimeStampDateDepotEtudiant || depot.DateDepotEtudiant || 0;
        const isLate = deadline > 0 && depotDate > deadline;

        return assignmentSubmissionSchema.parse({
            submission_id: depot.IDDepotEtudiant,
            role: "submission",

            file_name: depot.NomFichierDepotEtudiant,
            file_size_bytes: depot.TailleOctetDepotEtudiant,

            mime_type: depot.ContentTypeDepotEtudiant,
            extension: depot.Extension,

            student_comment: depot.CommentaireDepotEtudiant || undefined,

            submitted_at: toIso(depot.DateDepotEtudiant)!,
            downloaded_by_teacher_at: toIso(depot.DateHeureTelechargementEnseignant),
            is_late_submission: isLate,
        })
    })

    const teacher_documents = travail.ListeDocumentsTravail?.map(doc =>
        assignmentFileSchema.parse({
            file_id: doc.IDDocumentTravail ?? undefined,
            role: "teacher_document",

            file_name: doc.NomFichier,
            file_size_bytes: doc.TailleOctet,

            mime_type: doc.ContentType,
            extension: doc.Extension,

            uploaded_at: toIso(doc.DateDepot),
            first_viewed_at: toIso(doc.DatePremConsultDocEtudiant),
        })
    )

    const grading_files = travail.ListeCopieCorigee?.map(doc =>
        assignmentFileSchema.parse({
            file_id: doc.IDDepotEtudiant ?? undefined,
            role: "correction",

            file_name: doc.NomFichier,
            file_size_bytes: doc.TailleOctet,

            mime_type: doc.ContentType,
            extension: doc.Extension,

            uploaded_at: toIso(doc.DateDepot),
            first_viewed_at: toIso(doc.DatePremConsultDocEtudiant),
        })
    )

    return assignmentDetailSchema.parse({
        id: travail.IDTravail,
        title: travail.Titre,
        category: travail.NomCategorie ?? undefined,

        published_at: toIso(travail.DateHeureDiffusion),
        due_at: toIso(travail.DateHeureRemise),

        allow_multiple_submissions: !!travail.AutorisePlusieursRemises,
        allow_late_submission: !!travail.RetardAccepte,

        is_visible: !!travail.IsPeutVisualiser,
        is_submission_open: !!travail.IsRemisePermise,
        is_submitted: !!travail.EstRemis,

        instructions_html: travail.Enonce ?? undefined,

        student_submissions: student_submissions?.length ? student_submissions : undefined,
        teacher_documents: teacher_documents?.length ? teacher_documents : undefined,
        correction_files: grading_files?.length ? grading_files : undefined,
    })
}
