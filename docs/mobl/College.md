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
ReferenceNouvelle    null
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
ListeImage                     any[]
TimestampDateDebutPublication  number
TimestampDateFinPublication    number
TimestampDateModification      number
TimestampDateCreation          number
NbCommentaires                 number
UrlVideo                       string
IsNouvelleCollege              boolean
IndicateurNouvelleALaUne       boolean
IsMesureUrgence                boolean
```

---

## POST /Mobl/College/SetFiltre

Sets calendar filter preferences.

**Body:** filter config object (varies)
