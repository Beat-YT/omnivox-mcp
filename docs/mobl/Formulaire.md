# Formulaire

## POST /Mobl/Formulaire/GetFormulaireModel

Returns the list of online forms. The module renders the list natively; each form opens in the web portal via its `UrlService` (Skytech SSO redirect).

**Body:** `{}`

**Response:**
```
ListeFormulaires[]
  IsActif        boolean    false = form closed (e.g. max responses reached)
  UrlService     string     Skytech.aspx redirect to /estd/FRME/Default.ovx?SV={form id}
  CouleurImage   string | null    e.g. "hsl(114,54%,62%)"
  Nom            string
  Description    string
  UrlImage       string     /Mobl/College/GetImagePleinEcran/?id=...
```
