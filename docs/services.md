# Services

`App/GetOffreService` returns the app's module manifest. Each `MenuItems[]` entry registers one client module of the mobile app. The app builds its UI from this list: menu contents, ordering, nesting, and entry points.

Response shape (no common envelope):

```
OffreService
  MenuItems[]     manifest entries (full field list in mobl/App.md)
  HashCode        string    manifest fingerprint (see Change detection)
  Modifie         boolean   true when the manifest changed since DernierHash
```

## Identifiers

- **`Id`** — module name, unique per entry. For native modules, also the client module name and the `/Mobl/{Id}/` route prefix (e.g. `Id: "Horaire"` ↔ `/Mobl/Horaire/*`).
- **`CodeModule`** — platform-wide service code. Not unique (`CVIE` and `MFAE` each appear twice). Used by notifications (`IdService`), interceptions, and the SSO redirect (`Skytech.aspx?...&IdService={CodeModule}`).
- **`Module`** — entry point opened when the service is selected: `{ModuleId}.{Action}[?query]`. Can reference another module (`CVIE` → `LeaCommun.Default`), a shared module with parameters (`Calendrier.Default?type=lea`), or a non-default action (`Confirmation.ConfirmationCourriel`). `null` = no client module; the app opens `UrlService` instead.

## Rendering kinds

1. **Native module** — client module with its own UI, backed by `/Mobl/{Id}/` JSON controllers. `EstModuleResponsive: false`. `UrlService`, when present, is the web-portal equivalent.
2. **Webview host** — client module hosts a responsive web page (`EstModuleResponsive: true`). `UrlService` is the hosted page: `/apps/*`, `/ui/*`, or a `.ovx` page behind the Skytech redirect.
3. **Web redirect** — `Module: null`. Opens `UrlService`, typically `/intr/Module/ServicesExterne/Skytech.aspx?...&lk={portal path}&IdService={CodeModule}` (SSO handoff). MIO's portal counterpart uses `RedirigeMio.ashx`.

## Flags

- **`EstModuleMobile`** — does not indicate `/Mobl/` routes: `true` on route-less redirects (API, COVE, ACAE, …), `false` on `LeaCommun` / `Calendrier` / `CalendrierLea`, which have routes. `false` only on secondary/embedded entries (LeaCommun, Calendrier, CalendrierLea, Intraflex); exact semantics unconfirmed.
- **`EstModuleResponsive`** — service page is responsive and hosted in-app (kind 2).
- **`EstActif`** — currently active. Seasonal: INSC, MDHR, CHOIX, CGPE, LODE observed `false` outside registration windows.
- **`EstDisponibleMenu`** — shown in the services menu. `false` on internal modules (Login, ErrorPage, Interceptions, ModuleOmnivox, Calendrier, CalendrierLea).
- **`EstBloque` / `RaisonBloque`** — service blocked for this user, with message.
- **`EstDisponibleOffline`** — usable without connectivity.
- **`ModuleParent`** — parent `CodeModule` for nesting. Most tiles parent to `MOBI_Services`; `MOBI_CalendrierLea` → `CVIE`, `MOBI_Calendrier` → `MOBI_Nouvelle`.

## Change detection

The client sends `DernierHash` + `DerniereOuverture`; the server returns `Modifie` and the current `HashCode`. The hash is the manifest state concatenated in menu order, plus a version tail:

```
{CodeModule}{flags} … {CodeModule}{flags}{serverVersion}-{lang}-{platform}-{appVersion}
e.g. CVIE13CVIE5MFAE13…PDME1326.8.2522.4452-ANG-WEBAPP-3.8.9
```

`{flags}` is a bitfield per entry:

| bit | flag |
|---|---|
| 8 | `EstModuleMobile` |
| 4 | `EstDisponibleMenu` |
| 2 | not observed set (likely `EstBloque`) |
| 1 | `EstActif` |

## Native modules (documented `/Mobl/{Id}/` routes)

| Id (= route prefix) | CodeModule | Service | Entry point (`Module`) | Docs |
|---|---|---|---|---|
| App | — | app shell (not a manifest entry) | — | [App.md](mobl/App.md) |
| LeaEtudiant | CVIE | LÉA (student data) | LeaCommun.Default?nocours=null&nogroupe=null | [Lea.md](mobl/Lea.md) |
| LeaCommun | CVIE | LÉA (shared course/term model) | LeaCommun.Default?nocours=null&nogroupe=null | [Lea.md](mobl/Lea.md) |
| Mio | MIOE | MIO | Mio.Default | [Mio.md](mobl/Mio.md) |
| Horaire | HOR | Course Schedule | Horaire.Default | [Horaire.md](mobl/Horaire.md) |
| CoursAnnule | CRSA | Suspended course | CoursAnnule.Default | [CoursAnnule.md](mobl/CoursAnnule.md) |
| DocMessageCollege | DINF | Documents & Messages | DocMessageCollege.Default | [DocMessageCollege.md](mobl/DocMessageCollege.md) |
| CarteEtudianteNumerique | CARE | Student ID card | CarteEtudianteNumerique.Default | [CarteEtudianteNumerique.md](mobl/CarteEtudianteNumerique.md) |
| PhotoEtudiant | PHOE | Photo ID | PhotoEtudiant.Default | [PhotoEtudiant.md](mobl/PhotoEtudiant.md) |
| Notification | VLTE | Notifications | Notification.Default | [Notification.md](mobl/Notification.md) |
| NotesFinales | NOTE | Final grades and R score | NotesFinales.Default | [NotesFinales.md](mobl/NotesFinales.md) |
| CentrePaiement | PAIEM | Financial file | CentrePaiement.Default | [CentrePaiement.md](mobl/CentrePaiement.md) |
| Formulaire | FRME | Online Forms | Formulaire.Default | [Formulaire.md](mobl/Formulaire.md) |
| PandemieNG | PDME | Health status declaration | PandemieNG.Default | [PandemieNG.md](mobl/PandemieNG.md) |
| College | MOBI_Nouvelle | News | College.Default | [College.md](mobl/College.md) |
| Calendrier | MOBI_Calendrier / MOBI_CalendrierLea | Calendar | Calendrier.Default / Calendrier.Default?type=lea | [Calendrier.md](mobl/Calendrier.md) |
| ThemeCouleur | MOBI_ThemeCouleur | Visual theme | ThemeCouleur.Default | [ThemeCouleur.md](mobl/ThemeCouleur.md) |
| Confirmation | MOBI_Confirmation | Email address | Confirmation.ConfirmationCourriel | [Confirmation.md](mobl/Confirmation.md) |
| Login | MOBI_LoginUser | Log Out | Login.Default | [Login.md](mobl/Login.md) |

Client modules probed with guessed action names, no endpoints found (a wrong action name and a missing controller are indistinguishable through the proxy, so not conclusive): `Services`, `Commentaire`, `Parametres`, `ErrorPage`, `Interceptions`, `ModuleOmnivox`, `Intraflex`.

## Webview-host modules (`EstModuleResponsive: true`)

| Id | CodeModule | Service | Entry point (`Module`) | UrlService |
|---|---|---|---|---|
| MFAE_validation_methods | MFAE | 2-Step Verification | MFA.Default | /apps/mfa/validation-methods |
| MFAE_devices | MFAE | Trusted devices | MFA.Default | /apps/mfa/devices |
| Cnfq | CNFQ | Attendance Validation | Cnfq.Default | Skytech redirect (.ovx) |
| Insc | INSC | Course Registration | Insc.Default | Skytech redirect (.ovx) |
| Mdhr | MDHR | Course Schedule Modification | Mdhr.Default | Skytech redirect (.ovx) |
| Adr | ADR | Personal File | Adr.Default | Skytech redirect (.ovx) |
| GrilleCheminement | GRCH | Progression Chart | GrilleCheminement.Default | Skytech redirect (.ovx) |
| Notb | NOTB | Grades Transcript | Notb.Default | Skytech redirect |
| ConsultationHoraireLocaux | LODE | Rooms - Availability | ConsultationHoraireLocaux.Default | Skytech redirect |
| SondagesVotes | SVET | Surveys and Votes | SondagesVotes.Default | Skytech redirect (.ovx) |
| DesinscriptionsAbandons | DIAB | Withdrawals and drops | DesinscriptionsAbandons.Default | /ui/etudiants/omnivox/desinscriptions-abandons |

## Web redirects (`Module: null`)

| Id | CodeModule | Service |
|---|---|---|
| API | API | Academic Advisor Appointment |
| COVE | COVE | Carpooling |
| TSCL_EXECUTION | TSCL_EXECUTION | Classification test |
| ACAE | ACAE | Lockers |
| IMPR | IMPR | Printing Credits |
| CGPE | CGPE | Program Change |
| REPR | REPR | Repères - Mon Webfolio |
| SRAE | SRAE | Student Access Centre |
| AENS | AENS | Teachers Directory |

Non-responsive wrapper modules with a `Module` value but a portal `UrlService`, probed with guessed action names and no endpoints found (not conclusive): `ChoixCours` (CHOIX), `DemandeCarteTarifReduit` (OPUE), `ReleveImpot` (RMPT).

## App navigation modules

Internal `MOBI_*` entries defining the app's structure.

| CodeModule | Id | Name | Parent | In menu |
|---|---|---|---|---|
| MOBI_Nouvelle | College | News | — | yes |
| MOBI_Services | Services | Services | — | yes |
| MOBI_Calendrier | Calendrier | Calendar | MOBI_Nouvelle | no |
| MOBI_CalendrierLea | CalendrierLea | Calendar (LÉA) | CVIE | no |
| MOBI_Commentaire | Commentaire | Opinion | — | yes |
| MOBI_Confirmation | Confirmation | Email address | MOBI_Services | yes |
| MOBI_Parametres | Parametres | Parameters | MOBI_Services | yes |
| MOBI_ThemeCouleur | ThemeCouleur | Visual theme | MOBI_Services | yes |
| MOBI_Intraflex | Intraflex | Omnivox web version | — | yes |
| MOBI_LoginUser | Login | Log Out | — | no |
| MOBI_ErrorPage | ErrorPage | — | — | no |
| MOBI_InterceptionContactUrgence | Interceptions | — | — | no |
| MOBI_ModuleOmnivox | ModuleOmnivox | — | — | no |

## Notification codes

### `IdService` (App/Notification)

The `IdService` field in `App/Notification` responses identifies what triggered the notification. Some map directly to a `CodeModule`, others are LÉA sub-module codes:

| IdService | Maps to | Description |
|---|---|---|
| cvir_comm | CVIE (LÉA) | New announcements |
| cvir_docu | CVIE (LÉA) | New documents |
| cvir_trav | CVIE (LÉA) | New/updated assignments |
| cvir_note | CVIE (LÉA) | New/updated grades |
| mio | MIOE | New MIO messages |
| SRAE | SRAE | Student Access Centre notifications |
| FRME | FRME | New forms to complete |

The `ModuleMobile` field on each notification names the module (by `Id`) that handles it (e.g. `"LeaEtudiant"` for all `cvir_*` notifications).

### Push notification module codes (Notification/GetListeParametreModuleModel)

Subscription keys for push notification preferences:

| Code | Description |
|---|---|
| ABS_Liste | Absences |
| COMM | Announcements |
| COTER | Corrections |
| DDLE | Document deadlines |
| DTRV | Assignment deadlines |
| MIOE | MIO Messages |
| NOTE | Grades |
| NOTEEVAL | Grade evaluations |
| PAIE | Payments |
| CVAP | Calendar appointments |
| CADP | Calendar (personal) |
| CADE | Calendar (exams) |
| CDIE | Distance learning |
