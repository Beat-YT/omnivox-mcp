# LÉA (Course Management)

## POST /Mobl/LeaCommun/GetDefaultModel

Main entry point. Returns course list with per-module notification counts.

**Body:**
```
AnSession    string    term ID (empty string = current)
```

**Response:**
```
AnSessionDisponible    { AnSessionDisponible: string[], AnSessionDefault: string }
AnSession              string
ListeCours[]
  IdCoursGroupe              number
  Titre                      string | null
  NoCours                    string | null     e.g. "2435H5EM"
  NoGroupe                   string | null     e.g. "1010"
  ListeModulesLea            { [key: string]: ModuleInfo }
  TagCoursGroupeCoursDiffere string

  ModuleInfo:
    NotificationsNonConsultes    number
    NotificationsTotal           number
    NomIcone                     string
    FormatModuleMobile           string | null
    TextMsgDictio                string
    LienLea                      string | null
    LienPortail                  string | null
    IdHtml                       string | null
    Ordre                        number
    EstBloque                    boolean

ProchainCours              object     next upcoming course (same shape as ListeCours item)
HasError                   boolean
IsClasseADistanceDisponible boolean
IsCoursDiffereDisponible   boolean
IsEtudiant                 boolean
```

Module keys observed: `Communiques`, `Documents`, `Travaux`, `Notes`, `Evenements`, `Enseignants`, `SitesWeb`, `Absences`, `Forum`, `ClasseDistance`, `CDIE`.

The first entry in `ListeCours` (with `IdCoursGroupe: 0` and null course info) contains aggregate notification counts across all courses.

---

## POST /Mobl/LeaCommun/EnregistrerFiltresClasseDistance

Saves distance learning filters.

**Body:**
```
noCours       null
noGroupe      null
anSession     string
isEtudiant    boolean
```

**Response:** `"OK"`

---

## POST /Mobl/LeaEtudiant/GetCommuniquesSommaireModel

Announcement counts per course.

**Body:**
```
AnSession    string
```

**Response:**
```
SommaireCommuniques[]
  IDCoursGroupe         number
  NoCours               string
  NoGroupe              string
  NomCours              string
  NbCommuniquesTotal    number
  NbNouveaute           number

AnSessionDisponible    { ... }
```

---

## POST /Mobl/LeaEtudiant/GetCommuniquesListeModel

Announcements for a specific course.

**Body:**
```
AnSession    string
noCours      string     e.g. "2435H5EM"
noGroupe     string     e.g. "1010"
```

**Response:**
```
ListeInfosCommuniques[]
  IdCommunique                 number
  Titre                        string
  Contenu                      string     HTML
  DateDebutDiffusion           number
  TimeStampDateDebutDiffusion  number
  DateFinDiffusion             number
  NoCours                      string
  NoGroupe                     string
  NomCours                     string
  Visionne                     boolean
  IsPermetVisionnement         boolean
```

---

## POST /Mobl/LeaEtudiant/GetDocumentsSommaireModel

Document counts per course.

**Body:**
```
AnSession    string
```

**Response:**
```
ListeSommaire[]
  ListeTitreNouveauxDocumentsDisponibles    string[]
  IdCoursGroupe                              number
  NoCours                                    string
  NoGroupe                                   string
  NomCours                                   string
  NbDocumentsDisponibles                     number
  IndicateurNouveauDocumentDisponible        boolean
  NbNouveaute                                number

AnSession              string
AnSessionDisponible    { ... }
```

---

## POST /Mobl/LeaEtudiant/GetDocumentsListeModel

Document list for a specific course.

**Body:**
```
AnSession    string
idClasse     string     e.g. "2435H5EM.1010"
```

**Response:**
```
ListeDocuments[]
  IdDocCoursDocument               string
  NoCours                          string
  NoGroupe                         string
  NomCours                         string
  Titre                            string
  TitreCategorie                   string
  NomDocument                      string
  Extension                        string
  TailleOctet                      number
  ContentType                      string
  DateDebutDistribution            string
  DateDebutDistributionDateTime    number
  Description                      string
  OrdreCategorie                   number
  OrdreDocument                    number
  IndicateurDocumentVisualise      boolean
  IsPeutVisualiser                 boolean
  TypeDocument                     number
  TypeLien                         string
  TagIcone                         string
  UrlLienExterne                   string
```

---

## GET /Mobl/LeaEtudiant/GetDocumentFichier

Downloads a document file.

**Query params:**
```
idDocCoursDocument          string
isDansSousDossier           "false"
anSession                   string
idClasse                    string
nomFichierServeurFichier    string     same as idDocCoursDocument
```

**Response:** binary file with Content-Type and Content-Disposition headers.

---

## POST /Mobl/LeaEtudiant/GetTravauxSommaireModel

Assignment counts per course.

**Body:**
```
AnSession    string
```

**Response:**
```
ListeSommaire[]
  ListeTitreTravauxARemettre    string[]
  IdCoursGroupe                  number
  NoCours                        string
  NoGroupe                       string
  NomCours                       string
  NbEnoncesTotal                 number
  NouvellesCorrections           number
  NbNouveaute                    number
  IndicateurNouveauTravaux       boolean
  DepotEnLigne                   number

AnSession              string
AnSessionDisponible    { ... }
```

---

## POST /Mobl/LeaEtudiant/GetTravauxListeModel

Assignment list for a specific course.

**Body:**
```
AnSession    string
idClasse     string     e.g. "350954EM.1010"
```

**Response:**
```
ListeTravaux[]
  IDTravail                            string     GUID
  Titre                                string
  NomCategorie                         string
  DepotEnLigne                         number     0 = no, 1 = yes
  RetardAccepte                        boolean
  DetailRemiseNonSysteme               string
  DateHeureRemise                      number     deadline (epoch ms)
  TimeStampDateHeureRemise             number
  Enonce                               string     HTML description
  DateHeureDiffusion                   number
  TimeStampDateHeureDiffusion          number
  AutorisePlusieursRemises             boolean
  DetailRemiseAlternatifElectronique   string
  IsTravailNonConsulte                 boolean
  IsPeutVisualiser                     boolean
  RangCategorie                        number
  RangTravail                          number
  IsRemisePermise                      boolean
  IsRemiseEnRetardPermise              boolean
  EstRemis                             boolean
  ListeDepotsTravail                   DepotsTravail[]
  ListeDocumentsTravail                DocumentFichier[]
  ListeCopieCorigee                    DocumentFichier[]
  ListeEnonce                          any[]

DepotsTravail:
  IdTravail                                  string
  IDDepotEtudiant                            string
  NomFichierDepotEtudiant                    string
  TailleOctetDepotEtudiant                   number
  CommentaireDepotEtudiant                   string
  ContentTypeDepotEtudiant                   string
  DateHeureTelechargementEnseignant          number
  DateDepotEtudiant                          number
  Extension                                  string

DocumentFichier:
  IdTravail                              string
  IDDocumentTravail                      string | null
  IDDepotEtudiant                        string | null
  NomFichier                             string
  TailleOctet                            number
  ContentType                            string
  Extension                              string
  DatePremConsultDocEtudiant             number
  DateDepot                              number
```

---

## POST /Mobl/LeaEtudiant/GetTravauxDetailModel

Full assignment detail.

**Body:**
```
AnSession           string
idClasse            string
idTravail           string     GUID
isAddConsultation   boolean    true marks as consulted
```

**Response:**
```
Travail              (same shape as ListeTravaux item above)
InfosAutoLoginCvir
  SID                string
  UrlLea             string     e.g. "cegepmontpetit-lea.omnivox.ca"
  TKSEncrypte        null
  NomCookieTKS       null
```

---

## GET /Mobl/LeaEtudiant/GetEnonceTravailFichier

Downloads an assignment instruction file.

**Query params:**
```
idTravail            string
idDocumentTravail    string
anSession            string
idClasse             string
```

---

## GET /Mobl/LeaEtudiant/GetDepotTravailFichier

Downloads a student submission file.

**Query params:**
```
idTravail    string
idDepot      string
anSession    string
idClasse     string
```

---

## GET /Mobl/LeaEtudiant/GetCopieCorrigeTravailFichier

Downloads a corrected copy.

**Query params:**
```
idTravail    string
idDepot      string
anSession    string
idClasse     string
```

---

## POST /Mobl/LeaEtudiant/GetNotesSommaireModel

Grade summary per course.

**Body:**
```
AnSession    string
```

**Response:**
```
ListeInfosNotes[]
  AnSession          string
  IdClasse           string
  NoCours            string
  NoGroupe           string
  NomCours           string
  Moyenne            number
  Mediane            number
  EcartType          number
  MoyenneProjetee    number
  MedianeProjetee    number
  NoteFinale         string
  MoyenneFinale      string | null
  NotePonderee       string
  NoteProjetee       string
  PourcentAccumul    string
  NouveauEvals       number
```

---

## POST /Mobl/LeaEtudiant/GetNotesDetailModel

Per-evaluation grade detail for a course, as native JSON (no CVIR webview needed). Note: the current app navigates to the `NotesDetailWeb` iframe instead — this native endpoint still works.

All grade values are fixed-point ×100 (`8840` = 88.40, `Ponderation: 1500` = 15%). "No value" appears as `null` or int sentinels (`2147483647` / `-2147483648`).

**Body:**
```
AnSession    string
noCours      string     e.g. "2434K6EM"
noGroupe     string     e.g. "1011"
```

**Response:**
```
Evaluations[]
  IDEvaluation               string
  NomEvaluation              string
  Note                       number | null    ×100, after adjustments (null = not graded)
  NoteBase                   number           ×100, before adjustments
  NbPts                      number           ×100, maximum points
  Ponderation                number           ×100, weight (%)
  Moyenne                    number | null    ×100, class average
  Mediane                    number | null    ×100
  EcartType                  number | null    ×100, standard deviation
  DateEvaluation             number | null    epoch ms
  TypeEvaluation             number           1 = normal, 20 = bonus ("bonifiant la note"), 40 = penalty ("pénalisant la note")
  IDCategorie                string           negative = pseudo-category (e.g. "-20" = bonus; label comes from the app dictionary, not the API)
  RangEval                   string
  IsVisualise                boolean
  Ajustements[]
    NomAjustement            string
    ValeurAjustement         number           ×100
    Type                     number           1 = bonus (+), 2 = penalty (−)
  CommentairesEtudiant[]
    TexteCommentaireEtudiant       string
    TimestampCommentaireEtudiant   number     epoch ms
    NomProfCommentaireEtudiant     string
  TexteCommentaireGroupe     string
  TimestampCommentaireGroupe number | null
  NomProfCommentaireGroupe   string

Categories[]
  IDCategorie                    string
  NomCategorie                   string     empty for pseudo-categories
  PonderationCategorie           number | null    ×100
  MoyenneCategorie               number           ×100
  MoyenneMinimalCategorie        number | null
  TypeCategorie                  number | null
  NombreEvaluationIgnoreCategorie number
  NoteFinaleMaximumCategorie     number | null

Sommaire
  NoteFinale           string
  NotePonderee         number     ×100, excludes bonus evaluations
  NoteProjetee         number     ×100, includes bonus
  Moyenne              number     ×100
  MoyenneProjetee      number     ×100
  MoyenneFinale        string
  Mediane              number     ×100
  MedianeProjetee      number     ×100
  EcartType            number     ×100
  EcartTypeProjetee    number     ×100
  PourcentAccumul      number     ×100

UniquementNonCategorise         boolean
ListeIdEvaluationNonConsulte    string
IsPeutVisualiser                boolean
```

Competency/rubric lines shown on the CVIR web grade page are not included — the mobile app has no competency feature; that data requires the `GetNotesDetailWebModel` webview.

---

## POST /Mobl/LeaEtudiant/GetNotesDetailWebModel

Returns CVIR auto-login credentials and teacher names for a course's grade detail webview. For the grade data itself as JSON, use `GetNotesDetailModel` above.

**Body:**
```
AnSession    string
noCours      string
noGroupe     string
```

**Response:**
```
InfosAutoLoginCvir
  SID          string
  UrlLea       string
NoteEvaluationWeb
  Enseignants  string[]
```

---

## POST /Mobl/LeaEtudiant/GetAbsencesSommaireModel

Absence records per course.

**Body:**
```
anSession    string
```

**Response:**
```
ListeSommaire[]
  NoDA                   string     student number
  NoCours                string
  NoGroupe               string
  NomCours               string
  AnSession              string
  TotalNbHeureAbsence    number
  ListeAbsences[]
    NoDA                       string
    NoCours                    string
    NoGroupe                   string
    NomCours                   string
    AnSession                  string
    NbHeureAbs                 number
    DateAbsence                number
    TimeStampDateAbsence       number

AnSessionDisponible    { ... }
```

---

## POST /Mobl/LeaEtudiant/GetEnseignantsSommaireModel

Teacher summary list.

**Body:**
```
anSession    string
```

**Response:**
```
ListeSommaire[]
  AnSession           string
  Nom                 string
  Prenom              string
  OID                 string     GUID
  DesactiverMIO       string     "N" = MIO enabled
  EmplacementBureau   string
  NomDepartement      string
  NoTelephone         string

AnSessionDisponible    { ... }
```

---

## POST /Mobl/LeaEtudiant/GetEnseignantsDetailModel

Teacher contact details.

**Body:**
```
oidProfesseur    string     teacher GUID
anSession        string
```

**Response:**
```
InfosDetailsEnseignants
  NomProf                  string
  Nom                      string
  Prenom                   string
  AnSession                string
  EmplacementBureau        string
  NomDepartement           string
  NumeroDepartement        null
  NoTelephone              string
  NoTelephoneSecondaire    string
  SiteWeb                  string
  Courriel                 string
  ListeJourSemaine         number[]
  ListePeriodesDisponibites any[]
  ListeAnSessionCours[]
    AnSession    string
    Cours[]
      NoCours      string
      NomCours     string
```

---

## GET /Mobl/LeaEtudiant/GetPhotoEnseignant/?Oid={GUID}

Returns teacher photo as `image/png`.

---

## POST /Mobl/LeaEtudiant/GetSitesWebSommaireModel

Teacher websites summary.

**Body:**
```
anSession    string
```

**Response:**
```
ListeInfosSitesWeb[]
  ListeInfosCoursGroupe[]
    NoCours      string
    NoGroupe     string
    NomCours     string
  NomEnseignant    string
  NbLiens          number
  OidProf          string

AnSessionDisponible    { ... }
```
