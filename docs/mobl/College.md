# College

## POST /Mobl/College/GetInfoNouvellesAffichees

Returns news counts, calendar snapshot, community listings, and calendar filters.

**Body:**
```
DateHeureModificationData    number     timestamp for cache check
HasCalendrier                boolean
HasCommunaute                boolean
loadCours                    boolean
force                        boolean
```

**Response:**
```
InfoActualites
  DateHeureModificationData    number
  NbNouvellesTotal             number

IsPauseUpdateCalendrier    boolean
Calendrier                 CalendrierModel.ResponseModel (see Calendrier.md)
FiltresCalendrier          string[]     e.g. ["CalScolaire","Lea","Communaute","Examen","Cours","RendezVous"]
HoraireDisponible          boolean
AgendaDisponible           boolean
ClasseDistanceDisponible   boolean
IsPauseUpdateCommunaute    boolean

Communautes[]
  IdSiteWeb                    string     GUID
  Url                          string     e.g. "~/CEM_etudiants/"
  Titre                        string
  ImgSrc                       string
  NbActivite                   number
  CouleurImage                 string     e.g. "hsl(94,46%,53%)"
  DateHeureDernierContenu       number
  IndicateurImageDefault       number

ClasseADistance             null
HasActualitesAnalytics     boolean
JsonWebToken               string     JWT for analytics
```

---

## POST /Mobl/College/EvenementsWeb_GetFirstLoad

Returns calendar events rendered as HTML cards for the portal.

**Body:** `{}`

**Response:**
```
html    string    server-rendered HTML event cards
```

---

## POST /Mobl/College/ListeActualite

Returns college news articles.

**Body:**
```
NombreItem           number     default 21
ReferenceNouvelle    string     IdActualite of the last item already loaded, or null for the latest
```

**Response:** `Actualite[]`
```
IdActualite                    string
OIDNews                        string
Titre                          string
Source                         string
SourceURL                      string
Resume                         string
Contenu                        string     full HTML
ListeImage                     { IdImage, Legende }[]
TimestampDateDebutPublication  number
TimestampDateFinPublication    number
TimestampDateModification      number
TimestampDateCreation          number
NbCommentaires                 number
UrlVideo                       string
IsNouvelleCollege              boolean
IndicateurNouvelleALaUne       boolean
IsMesureUrgence                boolean
UrlMesureUrgence               string | null
```

Items come newest first. With `ReferenceNouvelle` set, the response starts with the item after that ID, so paging passes the last `IdActualite` of the previous page. The app requests its page size (20) plus one. The app has no single-article request: its article view reads the item from the list already loaded. When tested, `NombreItem: 100` returned all 43 published items. `TimestampDateFinPublication` is negative (.NET `DateTime.MinValue`) when an item has no end date.

`Resume` is `Contenu` cut at about 500 characters of HTML, so its markup can be broken mid-tag. The app's article view renders `Contenu`, falling back to `Resume` when `Contenu` is blank, and converts newlines to `<br />` only when `IsNouvelleCollege` is true. It prints dates as a day for `IsNouvelleCollege` items and with the time otherwise, and shows `TimestampDateModification` as an update when it differs from `TimestampDateCreation` and is later than `TimestampDateDebutPublication`. An `IsMesureUrgence` item opens `UrlMesureUrgence` instead of an article. Images are served from `/Mobl/College/GetImagePleinEcran/?id=<IdImage>&width=0&dateModifNouv=<TimestampDateModification>` (confirmed from the app's JS).

---

## POST /Mobl/College/SetFiltre

Sets calendar filter preferences.

**Body:** filter config object (varies)
