import { extractHtmlPreview, toIso } from "@common/transformHelpers";
import { courseDocumentSchema, CourseDocument, CourseDocumentResponse } from "@schemas/courses/document"
import { DocumentsListeModel } from "@typings/Lea/DocumentsListeModel";

export function transformDocuments(response: DocumentsListeModel.ResponseModel, term_id: string, course_id: string): CourseDocumentResponse {
    const documents = response.ListeDocuments.map(doc => {
        return courseDocumentSchema.parse({
            id: doc.IdDocCoursDocument,
            title: extractHtmlPreview(doc.Titre),
            description: extractHtmlPreview(doc.Description),
            category: doc.TitreCategorie || undefined,
            filename: doc.NomDocument || undefined,
            extension: doc.Extension || undefined,
            size_bytes: doc.TailleOctet || undefined,
            mime_type: doc.ContentType || undefined,
            published_at: toIso(doc.DateDebutDistributionDateTime),
            viewed_at: toIso(doc.DateConsultationDateTime),
            is_viewed: doc.IndicateurDocumentVisualise ?? undefined,
            external_url: doc.UrlLienExterne ? decodeURIComponent(doc.UrlLienExterne) : undefined,
        } as CourseDocument)
    });

    return {
        term_id,
        course_id,
        course_name: response.NomCours || response.ListeDocuments[0]?.NomCours || undefined,
        documents
    } as CourseDocumentResponse
}