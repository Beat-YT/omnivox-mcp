# Web handoff

How the app opens a portal-only module from a manifest entry, for example "Services adaptés" (`SRAE`). The manifest supplies a portal path, the client wraps it in two auto-login redirects, mints a single-use token, and hands the result to the native app through `WebUI.OpenNewWindow`. Everything below was read from the client bundle (`omnivox-connection/content/App.pretty.js`).

The observed native call, decoded:

```
WebUI.OpenNewWindow {
  Url: https://<college>.omnivox.ca/Mobl/Login/AutoLogin
         ?UrlRetour=/Mobl/Login/AutoLoginIntraflex
             ?UrlIntraflex=/intr/Module/ServicesExterne/Skytech.aspx
                 ?IdServiceSkytech=Skytech_Omnivox
                 &lk=/estd/RedirigeModuleDotNet.ovx?CodeModule=SRAE
                 &IdService=SRAE&C=EDM&E=P&L=FRA&Ref=20260918113923
             &IndicateurAppNative=true&nocache=<ms>
         &ForceSession=true&nocache=<ms>&AppVersion=3.8.9&TokenRedirection=<token>
  DisplayNavigationBar: "True"
  DisplayAltNavigationBar: "false"
  DisplayToolbar: "True"
  UseWebKit: "false"
  UseExistingView: "false"
  ActionButtonOptions: "Print"
  TextBtnBack: "Services adaptés"
  TextBackAltNavbar: "Retour à Omnivox mobile" (URL-encoded)
}
```

Each layer is `encodeURIComponent`-ed by the layer above, and the bridge encodes the final URL once more, hence `%25252F`.

## Source: the manifest entry

The Services page (`Skytech.Modules.Services.Default`, `displayView`) reads the cached `App/GetOffreService` `MenuItems` (localStorage key `Login-OffreService`, re-synced at most every 3 minutes, see [services.md](services.md)). Of the roughly 25 fields per entry, the handoff uses these:

| Field | Role |
|---|---|
| `EstDisponibleMenu` | entry is skipped when `false` |
| `EstModuleMobile` | picks the list the entry is rendered in (see below) |
| `Module` | in-app entry point; `null` means "open `UrlService` instead" |
| `UrlService` | the portal path that gets wrapped |
| `EstModuleResponsive` | hosted web page: wrapped link plus `UseWebKit: true` |
| `Texte` | label, becomes `TextBtnBack` through the `.ModuleTitre` node |
| `EstActif`, `EstDisponibleOffline` | item is disabled otherwise |
| `OrdreAffichage` | sort key; 1..5 go to the bottom icon bar, > 5 to the Services list |
| `VersionMinimum` | mobile entries hidden below this app version |
| `Id`, `CodeModule` | DOM id and a few hard-coded special cases |

Everything else (`Image*`, `IconeService*`, `Description`, `ModuleParent`, `RestoreLevels`, `DateRetour`, `EstBloque`, `RaisonBloque`) only affects icons, sorting or messaging, never the link.

The inner `lk=/estd/RedirigeModuleDotNet.ovx?CodeModule=…` and the trailing `C=`, `E=`, `L=`, `Ref=` parameters are not built by the client. They arrive verbatim in `UrlService`. `Ref` looks like a `yyyyMMddHHmmss` stamp of the manifest generation.

## Routing an entry

`displayView` splits menu entries by `EstModuleMobile`:

**`EstModuleMobile: true`** goes to `ListeServicesMobile` (rendered in `#lstServiceMobile`). The template then decides per item:

| Condition | Rendered as | On touch |
|---|---|---|
| `Module != null` and not responsive | `data-module="{Module}"` | in-app navigation, no link |
| `Module == null` and `EstActif` | class `lienExterneOmnivox`, `data-href="{UrlService}"` | `omnivoxLienExterneTouch` wraps `data-href` with `CreerLienPreAuthentifierIntraflex` |
| same, but `TypeModule === "cvir"` | `href=CreerLienPreAuthentifierCvir(UrlService)` | used as-is |
| `EstModuleResponsive` | `href=CreerLienPreAuthentifierIntraflex(UrlService)`, `data-est-module-responsive` | used as-is, `UseWebKit: true` |
| `UrlService` has a non-http scheme | `data-protocole-externe` | `App/GetUrlProtocoleExterne` then `OpenAppLink`, not a web handoff |

`SRAE` and the other web redirects in [services.md](services.md#web-redirects-module-null) take the second row.

`displayView` also rewrites a few entries before rendering: `NotesFinales`, `CentrePaiement`, `ReleveImpot`, `PersonnalisationPortail`, `DemandeCarteTarifReduit` and `ChoixCours` get `Module = null` and `TypeModule = "intr"` (`"cvir"` for `NotesFinales`), forcing them onto the web path even though the manifest gives them a `Module`. `Theme`, `ThemeCouleur`, `Installation`, `Notification`, `Parametres` are platform-gated and `PandemieNG` is dropped.

**`EstModuleMobile: false`** goes to `ListeServices` (rendered in `#lstService`). Each gets `UrlAutoLogin = CreerLienPreAuthentifierIntraflex(UrlService)` and class `lienOmnivox`; `omnivoxLienTouch` passes the `href` straight to `ManageLien`. `AVIE` is hidden on native, `CADP`, `CADE` and `TSCL_EXECUTION` are hidden everywhere.

Both handlers end in `Skytech.Commun.Application.ManageLien(url, "url", { Titre: <.ModuleTitre text>, ... })`.

## Wrapping the path

`Skytech.Commun.Module.LoginWorker` provides the wrappers:

```
CreerLienPreAuthentifierIntraflex(lien):
  /Mobl/Login/AutoLoginIntraflex?UrlIntraflex=<enc(lien)>&IndicateurAppNative=<true|false>&nocache=<Date.now()>
  then passed through CreerLienPreAuthentifierMobile unless skipPreAuthentificationMobile

CreerLienPreAuthentifierMobile(lien, forceSession = true):
  /Mobl/Login/AutoLogin?UrlRetour=<enc(lien)>&ForceSession=<true|false>&nocache=<Date.now()>&AppVersion=<Support.AppVersionString>

CreerLienPreAuthentifierCvir(lien, anSession?):
  /Mobl/Login/AutoLoginCvir?UrlRetour=<enc(lien)>&nocache=<Date.now()>[&AnSession=…]
  then passed through CreerLienPreAuthentifierMobile
```

`IndicateurAppNative` mirrors `Support.IsAppNative`, so it is `true` inside the app and `false` in the browser web app. The endpoints are documented in [mobl/Login.md](mobl/Login.md).

## Token and native call

`ManageLien(lien, "url", params)`:

1. Drops the call if another one ran within `DELAI_ENTRE_MANAGE_LIEN` (unless `ForceLoad`).
2. A link containing `.omnivox.ca/intr` but no `/Mobl/Login/AutoLogin` is trimmed to its path and wrapped with `CreerLienPreAuthentifierIntraflex` on the fly.
3. Prepends `window.location.origin` to relative links.
4. Builds `ActionButtonOptions`: `Print` when `Support.Print`; hosts outside `omnivox.ca` also get `Safari` (iOS) or `OpenIn` (Android) plus `Copy`.
5. `useToken` is true when the link contains `/Mobl/Login/AutoLogin`. It then POSTs `/Mobl/Login/GetTokenRedirection` and appends `&TokenRedirection=<token>` before navigating. The token is single-use, so a fresh one is minted on every tap.
6. Navigates:
   - inside the app, `omnivox.ca` host: `Ovx.WebUI.OpenNewWindow(...)`
   - inside the app, other host: `Ovx.WebUI.OpenURLInDeviceBrowser(lien)`
   - in a plain browser (`Support.IsChrome`): `window.open(lien, "_blank")`

Argument mapping for `OpenNewWindow` (the bridge stringifies booleans, see [native-bridge.md](native-bridge.md)):

| Arg | Value from `ManageLien` |
|---|---|
| `Url` | `encodeURIComponent(lien)` |
| `DisplayNavigationBar` | `params.DisplayNavigationBar`, default `true` |
| `DisplayAltNavigationBar` | `params.ShowAltNavigationBar`, default `undefined` (`"false"`) |
| `DisplayToolbar` | `params.DisplayToolbar`, default `true` |
| `UseWebKit` | `params.UseWebKit`, `true` only for responsive modules |
| `UseExistingView` | `params.UseExistingView`, default `undefined` |
| `ActionButtonOptions` | comma-joined options from step 4 |
| `TextBtnBack` | `params.Titre`, else `Dictio.COMMUN.MSG_0001`; iOS below 3.10.1 truncates at 30 chars |
| `TextBackAltNavbar` | `encodeURIComponent(Dictio.COMMUN.ALT_NAV_BAR_BACK_LABEL)` |
| callback | `params.OnCloseCallback` (Services page uses it to refresh notifications) |

## Reproducing it outside the app

1. Fetch `App/GetOffreService` and pick the entry by `Id` or `CodeModule`. Note the client sends this one with the form-encoded `HttpRequestWorker.Post` helper and `JSON.parse`s the text, not `PostJSON`.
2. Take `UrlService` and wrap it: Intraflex layer, then AutoLogin layer, both with a fresh `nocache`.
3. Mint a `TokenRedirection` and append it. Do this at click time, not ahead of time.
4. Open the URL in any browser. `AutoLogin` sets the session cookie and `302`s down the chain.

This repo does exactly that for two cases already: `BuildAssignmentSubmitUrl` in `src/omnivox-api/requests/Login.ts` (cvir variant) and the MIO recipient picker in `src/omnivox-api/requests/MioWeb.ts` (Intraflex variant, without the token because it is opened inside the authenticated Puppeteer page).
