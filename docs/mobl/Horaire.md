# Horaire (Schedule)

## POST /Mobl/Horaire/GetHoraireModel

Returns the full session schedule grid.

**Body:**
```
AnSession    string | null    term ID (null = current)
```

**Response:**
```
AnSession                  string
InfoAnSessionDisponible    { AnSessionDisponible: string[], AnSessionDefault: string }

HoraireDex
  HoraireSemaineDisponible     boolean
  HoraireDisponible            boolean
  ListeVolumes                 any[]
  RetourListeCours             string
  ContratReussiteASigner       boolean
  ImageClaraSemaine            null
  ImageClaraSession            null
  URLImageClaraSession         null
  IndicateurAffichageSemaine   boolean
  IndicateurRecuperationRequise boolean
  RegroupementsCours           null

  Plages[]
    Id                          number
    NumeroCoursAffiche          null
    EstEnConflit                boolean
    Jour                        number     1=Mon, 2=Tue, etc.
    HeureDebut                  number     epoch ms (date part is .NET epoch)
    HeureFin                    number
    NoPeriodeJourDebut          number
    NoPeriodeJourFin            number
    DateDebut                   number     epoch ms
    DateFin                     number
    TypePeriode                 string     "Laboratoire", "Theorie", etc.
    TypeDonnee                  "COURS"
    IDUniteOrg                  number
    IdRencontre                 number
    TitreCours                  string
    NumeroCours                 string
    AnSession                   string
    ModeParticipation           string     "P" = in-person
    ModeParticipationCourant    string
    ModeParticipationRedefinis  null
    IsPossedeSeancesRedefinis   boolean
    TypeEnseignement            string     "S" = standard
    TypeEnseignementCourant     string
    TypeEnseignementRedefinis   null
    IsPossedeSeancesRedefinisTypeEnseignement boolean
    InfoClasseDistance          string     encrypted class distance info
    HeureDebutInt               number     e.g. 8
    MinuteDebutInt              number     e.g. 10
    HeureFinInt                 number     e.g. 11
    MinuteFinInt                number     e.g. 0
    IndicateurPossedeMessageGroupe boolean
    PrenomProf                  null
    NomProf                     null
    NumeroProf                  null
    OidProf                     null
    Groupes                     string[]   e.g. ["65900903|1010"]

    Locaux[]
      Numero      string     e.g. "C165"
      Pavillon    string

    Profs[]
      Nom              string
      Prenom           string
      NoEnseignant     null
      OIDEnseignant    string     GUID

  Cours[]
    Numero                       string
    Titre                        string
    Groupes                      string[]
    EpreuveSynthese              boolean
    ListeVolumes                 any[]
    IndicateurHoraireSemaine     string
    HashCode                     number
    Classes[]
      IsMultiCours    boolean
      Groupes         string[]
      ID              string
      ServEns         string

  Groupes[]
    Numero                 string
    Titre                  string
    DateDebut              number
    DateFin                number
    HashCodeCours          number
    ServEns                string
    Campus                 string
    NombreHeuresContact    number
    Messages[]
      Contenu           string
      Titre             string
      Numero            number
      DocumentAssocie   string
    Profs[]
      (same shape as Plages.Profs)

  ParametreHoraireCaseCours
    AffNumeroCours       boolean
    AffTitreCours        boolean
    AffNumeroGroupe      boolean
    AffLocal             boolean
    AffEnseignant        boolean
    AffTypePeriode       boolean
    AffHeureFinPeriode   boolean

  InformationsHoraire
    MessagesHoraire      any[]
    NomAPI               string
    EtatHoraire          string
    StatutHoraire        null
    StatutEtudiant       string
    FuseauHoraire        string
    ListeCours           null
    InfoSupp             null
    InformationCasier
      NumeroCasier                   string
      NomPartenaireCasier            string
      PrenomPartenaireCasier         string
      NumTelephonePartenaireCasier   string
      NumEtudiantPartenaireCasier    string
      CombinaisonCadenasCasier       string

CoursInactifLea    any[]
```

---

## POST /Mobl/Horaire/GetHoraireSemaineModel

Returns the schedule for a specific week.

**Body:**
```
AnSession                string     term ID
TimeStampDebutSemaine    number     epoch ms of the week's Monday
```

**Response:** same structure as `GetHoraireModel`, with these differences in `Plages`:
- `DateDebut` / `DateFin` are `0` (not the session range)
- `TypePeriode` uses short codes: `"L"` (lab), `"T"` (theory), `"E"` (encadrement)
- `TitreCours` is truncated (15 chars)
- `NumeroCours` shows the actual course code (e.g. `"2435L5EM"`) instead of group number
- `Locaux` items may omit `Pavillon`
