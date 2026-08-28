# DocMessageCollege

## POST /Mobl/DocMessageCollege/GetDefaultModel

Returns official college documents (admissions letters, enrollment confirmations, etc.).

**Body:** `{}`

**Response:**
```
NombreDocuments     number
NombreMessages      number
NombreContrats      number
NombreTotal         number

ListeDocumentsMessages
  ListeDocuments[]
    IDDocument          string     GUID
    Titre               string
    NomDocument         string     filename
    Extention           string     e.g. "pdf"
    ContentType         string     e.g. "application/pdf"
    TailleOctet         number
    Description         string
    Commentaire         null
    Provenance          number
    TypeDocument        number
    PathFichier         null
    EstConsulte         boolean
    EstObligatoire      boolean
    DateCreation        number     epoch ms
    DateDerniereModif   number
    DateDebut           number
    DateFin             number     -62135596800000 = no expiry
    DateConsultation    number
  ListeMessageVocaux     any[]
  ListeMessages          any[]
  ListeContrats          any[]
  ListeRapportsTache     any[]
```
