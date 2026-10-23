# MIO (Messagerie Interne Omnivox)

## POST /Mobl/Mio/GetListeFoldersModel

Returns message folders with unread counts.

**Body:** `{}`

**Response:**
```
ListeFolders[]
  Id                  string     folder ID (e.g. "SEARCH_FOLDER_MioRecu")
  IdCategorie         string     category ID (empty for system folders)
  NomCategorie        string     display name (e.g. "Inbox", "Sent messages")
  NomCategorieCourt   string     short name (e.g. "Inbox", "Sent")
  Image               string     icon filename
  NbMessageNonLu      number
  NbMessageTotal      number
```

System folder IDs: `SEARCH_FOLDER_MioRecu` (inbox), `SEARCH_FOLDER_MioEnvoye` (sent), `SEARCH_FOLDER_Brouillon` (drafts), `SEARCH_FOLDER_Drapeau` (flagged), `SEARCH_FOLDER_MioSupprimer` (trash). Custom folders use their name as ID.

---

## POST /Mobl/Mio/GetLatestMessages

Returns recent messages in a folder.

**Body:**
```
IdFolder                    string     folder ID
NbMessages                  number     page size (default 21)
DateHeureDerniereUpdate     number     timestamp for incremental updates (0 for first load)
NombreItemDernierUpdate     number     0 for first load
Force                       boolean
UtilisationQuota            number     quota usage in bytes
```

**Response:**
```
ListeMessages[]
  Id                              string     message GUID
  Sujet                           string     subject line
  Message                         string     full HTML body
  ExtraitMessage                  string     plain-text excerpt
  TimestampDateEnvoi              number     epoch ms
  Unread                          boolean
  HasAttachment                   boolean
  NbAttachements                  number
  TailleAttachements              number
  NomCompletEnvoyeur              string
  TitreAfficheEnvoyeur            string
  OIDEnvoyeur                     string
  NomEnvoyeur                     string
  PrenomEnvoyeur                  string
  NumeroEnvoyeur                  string
  CouleurProfileEnvoyeur          null
  DateFinAbsenceEnvoyeur          number
  DateFinAbsenceEnvoyeurDescription string
  IsEnvoyeurSearchable            boolean
  NomCompletRecepteur             string
  NomRecepteur                    null
  PrenomRecepteur                 null
  OIDRecepteur                    null
  IndicateurLocal                 boolean
  NbDestinataires                 number
  AfficheDestinataire             boolean
  AffichePhoto                    boolean
  AfficheNoDa                     boolean
  MioEnvoi                        boolean
  IsDansCorbeille                 boolean
  IDMessageReply                  string     GUID of the message this one replies to or forwards, empty otherwise
  DerniereAction                  number     action taken on this message: 0 none, 1 replied, 2 forwarded, 3 replied to all (MioWorker.TypeAction)
  NomCategorie                    string
  TypeIndividu                    number
  ImageTypeIndividu               string
  IsPeutVisualiser                boolean
  NbLectures                      number
  IsIncludeOriginal               boolean
  IsBrouillon                     boolean

  Indicateurs
    Drapeau     boolean     flagged
    ARelire     boolean     mark to re-read

  ListeDestinataires[]
    OID                     string
    NomComplet              string
    NomFormat               string
    TypeIndividu            string
    DateVisualisation       number
    DateFinAbsenceString    string | null
    DateFinAbsence          number
    IsAbsent                boolean
    NomCompletAvecAbsence   null
    IsSearchable            boolean
    Numero                  null | string

  Attachements[]
    IDFichierAttachement    string
    IDMessage               string
    NomFichier              string
    ContentType             string
    TailleOctet             number
    DateHeureCreation       number
    Etat                    number
    Contenu                 null

  Images                    null

IsUpdateRequired               boolean
DateHeureServeur               number
NbMessagesTotal                number
NbMessagesNonLus               number
AfficherMessagesCategorie      boolean
IsMioBloque                    boolean
UtilisationQuota               number
```

---

## POST /Mobl/Mio/GetMessages

Loads older messages (pagination).

**Body:**
```
IdFolder                    string
DernierOidMessage           string     last message GUID from previous page
IndicateurDernierMioEnvoi   boolean
NbMessages                  number     default 20
```

**Response:** same shape as `GetLatestMessages`.

---

## POST /Mobl/Mio/GetMessage

Returns a single message by ID, from any folder. The app calls it (`MioWorker.GetMessageFromServer`) when a list item carries only `ExtraitMessage`, and to load `ListeDestinataires` before a reply-all.

**Body:**
```
IdMessage    string     message GUID, case-insensitive
```

**Response:**
```
MioMessage    object     one `ListeMessages[]` item from `GetLatestMessages`, with `Message` (full HTML) and `ListeDestinataires` populated
```

`Attachements` is `null` rather than `[]` when the message has none. Does not mark the message as read. An unknown ID still returns the envelope with an empty `MioMessage` (`Id`, `Sujet`, `Message` and `OIDEnvoyeur` are `null`, `TimestampDateEnvoi` is `0`), not an error.

---

## POST /Mobl/Mio/SearchMessages

Searches messages by text.

**Body:**
```
IdFolder      string
NbMessages    number     default 21
SearchText    string
```

**Response:** same shape as `GetLatestMessages`.

---

## POST /Mobl/Mio/GetListeContacts

Returns saved/recent contacts.

**Body:** `{}`

**Response:** `IndividuItem[]`
```
OID                       string
Numero                    string
TitreAffiche              string
TypeIndividu              number
NoProgDept                null
NomProgDept               null
DateFinAbsence            number
IsAbsent                  boolean
NomCompletAvecAbsence     string
```

---

## POST /Mobl/Mio/SendMessage

Sends a MIO message.

**Body:**
```
IDMessage            null
To                   string     recipient OID(s)
Sujet                string     subject
Message              string     body HTML
Attachements         any[]
IDMessageReply       string     "undefined" for new, GUID of the original for reply/forward
derniereAction       string     "0" new, "1" reply, "2" forward, "3" reply all (MioWorker.TypeAction)
CacheDestinataire    boolean
```

**Response:** truthy value on success.

Quoting is done client-side. For a reply the app (`Nouveau.getMessage`) HTML-encodes the typed text, appends `<br /><br />` + signature when enabled, then appends `Dictio.MIO.MSG_0130` filled with the original sender's name and date, followed by the original `Message` HTML with any `<body>` wrapper stripped. The English `MSG_0130` is `<br/><br/>__________________________________<br/>{0} wrote on {1} :<br />`; the date pattern is `$3_W j-$3_M-Y à H:i` (e.g. `tue 20-oct-2026 à 11:26`). The subject goes through `MioWorker.CreerTitreReponse`, which prepends `Dictio.MIO.MSG_0190` (`Re:`) unless the subject already starts with it. Forward uses `MSG_0185` (`Fw:`). The body is limited to 50 000 characters client-side.

---

## POST /Mobl/Mio/CategoriseMessage

Moves a message to a folder/category.

**Body:**
```
oidMessage       string     message GUID
nomCategorie     string     target folder ID
isEnvoyeur       boolean
```

**Response:** truthy value on success.

---

## POST /Mobl/Mio/SetIndicateursMessage

Sets flag and re-read indicators on a message.

**Body:**
```
Id             string     message GUID
indicateurs
  Drapeau      boolean    star/flag
  ARelire      boolean    mark to re-read
IsEnvoi        boolean
```

**Response:** truthy value on success.

---

## POST /Mobl/Mio/DeleteMessage

Moves a message to trash.

**Body:**
```
Id                    string     message GUID
SupprimerPermanent    boolean    false = move to trash, true = permanent
Envoie                boolean
```

**Response:** truthy value on success.

---

## POST /Mobl/Mio/RestoreMessage

Restores a message from trash.

**Body:**
```
Id        string     message GUID
Envoie    boolean
```

**Response:** truthy value on success.

---

## POST /Mobl/Mio/SetMessageLu

Marks a message as read.

**Body:**
```
Id        string     message GUID
IsEnvoi   boolean
```

**Response:** truthy value on success.

---

## POST /Mobl/Mio/RechercheIndividu

Searches for people (recipients) by text.

**Body:**
```
TexteRecherche    string
```

**Response:** `IndividuItem[]`
```
OID                       string
Numero                    string
TitreAffiche              string
TypeIndividu              number
NoProgDept                string | null
NomProgDept               string | null
DateFinAbsence            number
IsAbsent                  boolean
NomCompletAvecAbsence     string
```

---

## POST /Mobl/Mio/AjoutCategorie

Creates a new message folder/category.

**Body:**
```
nomCategorie    string
```

**Response:** truthy value on success.

---

## GET /Mobl/Mio/GetAttachement

Downloads a message attachment.

**Query params:**
```
IdMessage        string     message GUID
IdAttachement    string     attachment GUID
```

**Response:** binary file.

---

## POST /Mobl/Mio/ObtenirDestinatiaresWeb

Returns recipients selected via the web-based people picker.

**Body:**
```
idRecherche    string     search session ID from the Skytech widget
```

**Response:** `IndividuItem[]` (same shape as `RechercheIndividu`).
