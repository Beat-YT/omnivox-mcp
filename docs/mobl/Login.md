# Login

## POST /Mobl/Login/GetTokenRedirection

Returns a single-use token for redirecting to the Omnivox web portal.

**Body:** `{}`

**Response:**
```
TokenRedirection    string     base64-encoded redirect token
```

Called multiple times throughout a session (before navigating to web views).

---

## GET /Mobl/Login/AutoLogin

Logs a plain browser into the portal using a `TokenRedirection`, then redirects. This is how the app opens web-only pages (classic Léa, Intraflex, payment centre) in an external web view.

**Query params:**
```
UrlRetour          string     path to land on after login (URL-encoded)
ForceSession       bool       "true"
TokenRedirection   string     from GetTokenRedirection (single-use)
AppVersion         string     e.g. "3.11.3"
nocache            number
```

Responds `302` to `UrlRetour` and sets `.Mobile_AuthentificationASPX`.

---

## GET /Mobl/Login/AutoLoginCvir

Bridges the mobile session to the classic Léa host (`<college>-lea.omnivox.ca`, "cvir"). Used as the `UrlRetour` of `AutoLogin`.

**Query params:**
```
UrlRetour          string     path on the cvir host (URL-encoded)
AnSession          string     optional
nocache            number
```

Responds `301` to `//<college>-lea.omnivox.ca<UrlRetour>` and sets `SidLea` + `SessionSky_CheckUserAgent…` cookies on `omnivox.ca`.

### Example: assignment hand-in page

The mobile app has no native upload for Léa assignments. "Remettre" opens:

```
/Mobl/Login/AutoLogin?UrlRetour=<AutoLoginCvir?UrlRetour=</cvir/dtrv/DepotTravail.aspx?idTravail=…&NoCours=…&NoGroupe=…&AnSes=…>>&ForceSession=true&TokenRedirection=…
```

`DepotTravail.aspx` is a WebForms page that uploads the file in 1 MiB raw chunks to `/cvir/dtrv/EnvoiFichier.aspx?IdUpload=<guid>&PositionDepart=<offset>` (each returns `True`), then POSTs the form with `hidIdUpload` to commit. Success is a `302` to `DepotTravail.aspx?…&Src=ListeTravaux&d=1`. `GetTravauxDetailModel.InfosAutoLoginCvir` carries the `UrlLea` host for this flow.
