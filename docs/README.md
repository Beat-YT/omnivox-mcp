# Omnivox Mobile API Documentation

Endpoint documentation for the Omnivox `/Mobl/` mobile API.

All endpoints are POST with JSON body unless noted. A `?nocache=<timestamp>` query parameter is appended to every call by the client JS but is not required by the server.

## AnSession

`AnSession` (or `anSession`) is the academic term identifier. Format: `YYYYN` — 4-digit year + single-digit cycle number. The cycle numbers are institution-specific (some colleges use 1-2-3, others have more cycles). Example: `"20263"`. Use `AnSessionDisponible` from API responses to discover valid values.

Most endpoints accept it as a body parameter. Some endpoints (like `LeaCommun/GetDefaultModel`) will default to the current term when given an empty string, but many endpoints require it explicitly — passing null or omitting it will fail or return empty data. Available terms are returned in `AnSessionDisponible` on most responses.

## Common response envelope

Most JSON responses include these fields:

```
Updating              boolean
IsPeriodeArret        boolean
NaviguerPage          null
DateRetourSysteme     number (epoch ms, usually 0)
CacheConfig           { ListeCleCacheOverride: string[], TempsCache: number }
IsAvailable           boolean
```

## Modules

One file per `/Mobl/{Module}/` controller. LÉA (`LeaCommun` + `LeaEtudiant`) is kept in one file — both are the CVIE service.

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
