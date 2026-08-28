# NotesFinales

## POST /Mobl/NotesFinales/GetNotesFinalesModel

Returns CVIR auto-login credentials for the final grades / R score web view. The module does not serve grade data natively — it hands off to the Lea web domain (same `InfosAutoLoginCvir` shape as `LeaEtudiant/GetTravauxDetailModel`).

**Body:** `{}`

**Response:**
```
InfosNotesFinalesWebModel
  SID             string     GUID
  UrlLea          string     e.g. "cegepmontpetit-lea.omnivox.ca"
  TKSEncrypte     null
  NomCookieTKS    null
```
