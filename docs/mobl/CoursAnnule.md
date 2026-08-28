# CoursAnnule (Cancelled Classes)

## POST /Mobl/CoursAnnule/GetCoursAnnuleModel

Returns cancelled class announcements.

**Body:** `{}`

**Response:**
```
DateCoursAnnule                 number     server timestamp
IndicateurAucunCoursAnnule      boolean

ListeAnnulationCours[]
  DateCoursAnnule                   number     date of cancellation
  DateAbs                           number
  HeureDebutAnnulation              string
  HeureFinAnnulation                string
  NoCours                           string
  NoGroupe                          string
  NomCours                          string
  NomProf                           string
  Local                             string[]
  CommentaireProf                   string
  HasCommentaireProfTexte           boolean
  DureeCommentaireProf              number | null
  FichierCommentaireProf            string
  HasCommentaireProfVocal           boolean
  IDAnnulation                      string
```

When no classes are cancelled, `ListeAnnulationCours` is empty and `IndicateurAucunCoursAnnule` is `true`.
