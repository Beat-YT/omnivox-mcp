# App

## POST /Mobl/App/Initialisation

Returns user identity, auth hash, and server configuration.

**Body:** `{}`

**Response:**
```
Utilisateur                string     student number
AuthHash                   string     session auth hash
TypeUtilisateur            number     1 = student
OID                        string     user GUID
IsUtiliseLeaV2             boolean
BtnCommunautesVisible      boolean
ServerConfig               object
  AppVersionStore          { Android: string, IOS: string }
  DateUpdateApp            { Android: number, IOS: number }
  ListeImageCache          string[]   full-screen image URLs
IsOmnivoxV19               boolean
ShouldShowLogoutAlertMFA   boolean
```

---

## POST /Mobl/App/Notification

Returns notification counts and service updates for the dashboard.

**Body:**
```
anSession         string | null    term ID
isFirstLoadQD9    boolean          true on first load, false on subsequent
```

**Response:**
```
ListeUpdates[]
  ModuleMobile           string | null    target module (e.g. "LeaEtudiant")
  NbNotifications        number
  OrdreAffichage         number
  IdService              string           e.g. "cvir_comm", "cvir_docu", "cvir_trav", "cvir_note", "mio", "SRAE", "FRME"
  Nom                    string           display name / count
  NomMobile              string | null
  Description            string | null
  UrlService             string | null
  Source                 string | null
  ListeIDQuoiDeNeuf      string
  Couleur                string | null    CSS gradient
  CouleurSolid           string | null    hex color
  SVGHTMLMarkup          string | null    inline SVG icon
  NomRetour              string | null    parent label
  Image                  number           icon ID
  IndicateurPeutDismiss  boolean

DateHeureDernierMiseAJour    number
IsConnected                  boolean
Version                      string | null
ChargerInfoSupSavq           boolean
AnSessionDisponible          { AnSessionDisponible: string[], AnSessionDefault: string }
```

---

## POST /Mobl/App/AddItemCache

Dismisses a notification item from the dashboard.

**Body:**
```
idService              string     service ID (e.g. "FRME")
listeIDQuoiDeNeuf      string     the notification's unique ID string from ListeUpdates
```

**Response:** not documented.

---

## POST /Mobl/App/GetOffreService

Returns the app's module manifest: the modules the app is assembled from for the
current user, with state flags and a composition hash. See [services.md](../services.md)
for what the fields mean and how modules map to `/Mobl/` routes.

**Body:**
```
DerniereOuverture          number     timestamp
DernierHash                string     version/state hash
Force                      boolean
EnvoieStatistique          boolean
HasPreviousOffreService    boolean
```

**Response:**
```
OffreService
  MenuItems[]
    CodeModule               string     e.g. "CVIE", "MFAE", "API", "HOR"
    Module                   string | null  internal module path
    Texte                    string     display name
    Id                       string     unique module ID
    OrdreAffichage           number
    Description              string
    ImageMenu                string | null  menu icon path
    ImageSelected            string | null  selected state icon path
    Image                    string | null  default icon path
    EstDisponibleMenu        boolean
    EstActif                 boolean
    DateRetour               number
    EstModuleMobile          boolean
    EstBloque                boolean
    RaisonBloque             string | null
    UrlService               string
    EstDisponibleOffline     boolean
    VersionMinimum           string | null
    ModuleParent             string | null
    RestoreLevels            string     "true"
    EstModuleResponsive      boolean
    IconeService             number
    IconeServiceString       string
  HashCode                   string     manifest fingerprint: concatenated {CodeModule}{flags} per entry + version tail (see services.md)
  Modifie                    boolean    true when the manifest changed since DernierHash
```

Note: this response has no common envelope fields — the top level is just `OffreService`.

---

## POST /Mobl/App/CheckActionUrgence

**Body:** `{}`

**Response:** `0` (number)

---

## POST /Mobl/App/GetPagesInstructionsVues

**Body:** `{}`

**Response:** `""` (empty string)

---

## POST /Mobl/App/CheckInterceptions

Checks for mandatory interceptions (surveys, consent, emergency contacts).

**Body:**
```
AffichePopupContratService                boolean
AfficheInterceptionSondagesVote           boolean
AfficheInterceptionDocumentClara          boolean
AfficheInterceptionPhotoEtudiant          boolean
AfficheInterceptionPilotageCarteEtu       boolean
AfficheInterceptionPandemieNG             boolean
AfficheInterceptionSondageEtudiantFinissant boolean
AfficheInterceptionConfirmationEmail      boolean
AfficheInterceptionContactUrgence         boolean
AfficheInterceptionDesactivationGCM       boolean
AfficheInterceptionFromNode               boolean
```

**Response:**
```
PopupContratService                    null
InterceptionSondagesVote               null
InterceptionConsentement               null
InterceptionPhotoEtudiant              null
InterceptionPilotageCarteEtu           null
InterceptionPandemieNG                 null
ListeDocumentsMessages                 null
InterceptionSondageEtudiantFinissant   null
InterceptionConfirmationEmail          null
InterceptionContactUrgence             boolean
InterceptionDesactivationGCM           boolean
IsSuperUser                            boolean
ListeInterceptions                     any[]
```

---

## POST /Mobl/App/UpdateListeCollegeUser

Returns colleges associated with the user.

**Body:** `{}`

**Response:** `CollegeDef[]`
```
CodeCollege    string
UrlCollege     string
NomCollege     string
```
