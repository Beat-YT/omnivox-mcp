# Omnivox Mobile API Documentation

Endpoint documentation for the Omnivox `/Mobl/` mobile API.

All endpoints are POST with JSON body unless noted. A `?nocache=<timestamp>` query parameter is appended to every call by the client JS but is not required by the server.

## AnSession

`AnSession` (or `anSession`) is the academic term identifier. Format: `YYYYN` — 4-digit year + single-digit cycle number. The cycle numbers are institution-specific (some colleges use 1-2-3, others have more cycles). Example: `"20263"`. Use `AnSessionDisponible` from API responses to discover valid values.

Most endpoints accept it as a body parameter. Some endpoints (like `LeaCommun/GetDefaultModel`) defaults to the current term when passed an empty string, but many endpoints require it explicitly (passing null or omitting returns empty data). Available terms are returned in `AnSessionDisponible` on most Lea responses.

## Common response envelope

Most JSON responses include these fields:

```
Updating              boolean
IsPeriodeArret        boolean
NaviguerPage          string | null    (module page, `{ModuleId}.{Action}[?query]`)
DateRetourSysteme     number           (epoch ms, 0 when unset)
CacheConfig           { ListeCleCacheOverride: string[], TempsCache: number }
IsAvailable           boolean
```

The server answers HTTP 200 for every outcome; errors are signalled through the envelope. The app checks these fields before rendering a response:

- **`NaviguerPage`**: server-driven redirect. When non-null, the app navigates to the named page and passes the response as that page's model; the requested view is not rendered and the payload does not follow the endpoint's documented shape. Observed values are `ErrorPage.*` pages, e.g. `ErrorPage.DocumentCollegeBlock` (unread mandatory college document) and `ErrorPage.PeriodeArret`.
- **`IsPeriodeArret`**: maintenance window. Data fields are empty; `DateRetourSysteme` is the expected return time, `0` when unknown.
- **`IsAvailable`**: `false` when the module is gated behind an access code; the response carries `CodeAcces` and no data.

## Modules

- [App](mobl/App.md) - initialization, notifications, service manifest, interceptions
- [Lea](mobl/Lea.md) - LÉA course management (`LeaCommun` + `LeaEtudiant`): documents, assignments, grades, absences, teachers, announcements
- [Mio](mobl/Mio.md) - Messagerie Interne Omnivox (messaging system)
- [College](mobl/College.md) - news, events, communities, filters
- [Horaire](mobl/Horaire.md) - schedule
- [Calendrier](mobl/Calendrier.md) - calendar events
- [CoursAnnule](mobl/CoursAnnule.md) - cancelled classes
- [CarteEtudianteNumerique](mobl/CarteEtudianteNumerique.md) - digital student card
- [PhotoEtudiant](mobl/PhotoEtudiant.md) - student photo
- [Notification](mobl/Notification.md) - push notification settings
- [NotesFinales](mobl/NotesFinales.md) - final grades / R score (web handoff)
- [DocMessageCollege](mobl/DocMessageCollege.md) - official college documents
- [Formulaire](mobl/Formulaire.md) - online forms list
- [CentrePaiement](mobl/CentrePaiement.md) - payment centre
- [PandemieNG](mobl/PandemieNG.md) - health status declaration
- [Confirmation](mobl/Confirmation.md) - email confirmation
- [ThemeCouleur](mobl/ThemeCouleur.md) - UI themes
- [Login](mobl/Login.md) - web portal redirect tokens

## Reference

- [Services](services.md) - the module manifest (`App/GetOffreService`): how services map to modules and `/Mobl/` routes, flags, change-detection hash, notification codes
- [Native bridge](native-bridge.md) - the WebView ↔ native app bridge (`ComNatifOvx.js`): transports, command/callback convention, command namespaces, backward compatibility and version pinning
- [Web handoff](web-handoff.md) - how a portal-only manifest entry becomes a `WebUI.OpenNewWindow` call: fields read from `MenuItems`, the `AutoLogin` / `AutoLoginIntraflex` wrapping, the `TokenRedirection` step and the window arguments
