import * as express from 'express';
import { GetAbsencesSommaireModel, GetCommuniquesListeModel, GetDefaultModel, GetDocumentsListeModel, GetNotesDetailWebModel, GetNotesSommaireModel, GetTravauxDetailModel, GetTravauxListeModel, GetTravauxSommaireModel } from '@api/Lea';
import { GetCopieCorrigeTravailFichier, GetDepotTravailFichier, GetDocumentFichier, GetEnonceTravailFichier, GetWebListeEval } from '@api/LeaDownload';
import { DownloadResult } from 'src/omnivox-api/puppet';

import { transformCoursesSummary } from '@transformers/courses/summary';
import { transformDocuments } from '@transformers/courses/document';
import { transformAnnouncements } from '@transformers/courses/announcements';
import { transformAssignmentsSummary } from '@transformers/courses/assignments-summary';
import { transformAssignmentsList } from '@transformers/courses/assignments-list';
import { transformAssignmentDetail } from '@transformers/courses/assignment-detail';
import { transformGradeItem, transformGradesSummary } from '@transformers/courses/grades-summary';
import { transformLeaAbsences } from '@transformers/courses/absences';
import { transformTerms } from '@transformers/terms';


const router = express.Router();

function getDefaultTerm() {
    return GetDefaultModel().then(model => {
        return model.AnSessionDisponible?.AnSessionDefault || model.AnSession;
    });
}

router.get('/lea/terms', async (req, res) => {
    const model = await GetDefaultModel();
    const termIds = model.AnSessionDisponible?.AnSessionDisponible ?? [];
    const defaultTerm = model.AnSessionDisponible?.AnSessionDefault || model.AnSession;
    const terms = await transformTerms(termIds);
    res.json({ default_term: defaultTerm, terms });
});

router.get('/lea/courses', async (req, res) => {
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : undefined;
    const model = await GetDefaultModel(term);
    const transformed = transformCoursesSummary(model);
    res.json(transformed);
});

router.get('/lea/assignments', async (req, res) => {
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();

    const model = await GetTravauxSommaireModel(term);
    const transformed = transformAssignmentsSummary(model);
    res.json(transformed);
});

router.get('/lea/absences', async (req, res) => {
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();
    const model = await GetAbsencesSommaireModel(term);
    res.json(transformLeaAbsences(model));
});

router.get('/lea/courses/:id', async (req, res) => {
    const courseId = req.params.id;
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();

    const notes = await GetNotesSommaireModel(term);
    const course = notes.ListeInfosNotes.find(c => `${c.NoCours}.${c.NoGroupe}` === courseId);
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }

    const transformedCourse = transformGradeItem(course);
    const notesInfo = await GetNotesDetailWebModel(course.NoCours, course.NoGroupe, term);

    res.json({
        ...transformedCourse,
        teachers: notesInfo.NoteEvaluationWeb.Enseignants
    })
});

router.get('/lea/courses/:id/teachers', async (req, res) => {
    const courseId = req.params.id;
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();
    const [courseCode, groupCode] = courseId.split('.');
    const model = await GetNotesDetailWebModel(courseCode, groupCode, term);
    return res.json({
        term_id: term,
        course_id: courseId,
        teachers: model.NoteEvaluationWeb.Enseignants
    })
});

router.get('/lea/courses/:id/documents', async (req, res) => {
    const courseId = req.params.id;
    const term = typeof req.query.term_id === 'string'
        ? req.query.term_id
        : await getDefaultTerm();

    const model = await GetDocumentsListeModel(courseId, term);
    const transformed = transformDocuments(model, term, courseId);
    res.json(transformed);
});

router.get('/lea/courses/:id/announcements', async (req, res) => {
    const courseId = req.params.id;
    const term = typeof req.query.term_id === 'string'
        ? req.query.term_id
        : await getDefaultTerm();

    const model = await GetCommuniquesListeModel(courseId, term);
    const transformed = transformAnnouncements(model, term, courseId);
    res.json(transformed);
});

router.get('/lea/courses/:course_id/documents/:document_id/download', async (req, res) => {
    const courseId = req.params.course_id;
    const documentId = req.params.document_id;
    const term = typeof req.query.term_id === 'string'
        ? req.query.term_id
        : await getDefaultTerm();

    const result = await GetDocumentFichier(courseId, documentId, term);
    res.set('Content-Disposition', result.contentDisposition);
    res.set('Content-Type', result.contentType);
    res.set('Cache-Control', 'private, max-age=600');
    res.send(result.data);
});

router.get('/lea/courses/:id/assignments', async (req, res) => {
    const courseId = req.params.id;
    const term = typeof req.query.term_id === 'string'
        ? req.query.term_id
        : await getDefaultTerm();

    const model = await GetTravauxListeModel(courseId, term);
    const transformed = transformAssignmentsList(model, term, courseId);
    res.json(transformed);
});

router.get('/lea/courses/:course_id/assignments/:assignment_id', async (req, res) => {
    const courseId = req.params.course_id;
    const assignmentId = req.params.assignment_id;
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();

    const model = await GetTravauxDetailModel(courseId, assignmentId, term);
    const transformed = transformAssignmentDetail(model);
    res.json(transformed);
});

router.get('/lea/courses/:course_id/assignments/:assignment_id/file/:file_id', async (req, res) => {
    const courseId = req.params.course_id;
    const assignmentId = req.params.assignment_id;
    const fileId = req.params.file_id;
    const fileRole = req.query.role;
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();

    if (typeof fileRole !== 'string') {
        res.status(400).json({ error: 'Missing role query parameter. Accepted values are: submission, teacher_document, correction.' });
        return;
    }

    let result: DownloadResult;
    switch (fileRole) {
        case 'teacher_document': {
            result = await GetEnonceTravailFichier(courseId, assignmentId, fileId, term);
            break;
        }

        case 'submission': {
            result = await GetDepotTravailFichier(courseId, assignmentId, fileId, term);
            break;
        }

        case 'correction': {
            result = await GetCopieCorrigeTravailFichier(courseId, assignmentId, fileId, term);
            break;
        }

        default: {
            res.status(400).json({ error: 'Invalid role query parameter. Accepted values are: submission, teacher_document, correction.' });
            return;
        }
    }

    res.set('Content-Disposition', result.contentDisposition);
    res.set('Content-Type', result.contentType);
    res.set('Cache-Control', 'private, max-age=600');
    res.send(result.data);
})


router.get('/lea/grades', async (req, res) => {
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();

    const model = await GetNotesSommaireModel(term);
    const transformed = transformGradesSummary(model, term)
    res.json(transformed);
});

router.get('/lea/grades/:course_id', async (req, res) => {
    const courseId = req.params.course_id;
    const term = typeof req.query.term_id === 'string' ? req.query.term_id : await getDefaultTerm();

    const [courseCode, courseGroup] = courseId.split('.');

    const webModel = await GetNotesDetailWebModel(courseCode, courseGroup, term);
    const gradeText = await GetWebListeEval(webModel, courseCode, courseGroup, term);

    res.send(gradeText)
});


export default router;