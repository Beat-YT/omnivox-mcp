# Notification

## POST /Mobl/Notification/GetListeParametreModuleModel

Returns push notification subscription settings per module.

**Body:** `{}`

**Response:**
```
Abonnement
  Actif              boolean
  IsAchatDisponible  boolean
  ListeParametres    { [moduleCode: string]: ParametreModule }

  ParametreModule:
    EstActive        boolean
    EstDisponible    boolean
    EstAchete        boolean
    AchatEnCours     boolean

ValetActif                  boolean
ModeHoraire                 string     e.g. "ToutTemps"
InAppDisabled               boolean
IsAfficheJournalActivite    boolean
```

Module codes observed: `ABS_Liste`, `COMM`, `COTER`, `DDLE`, `DTRV`, `MIOE`, `NOTE`, `NOTEEVAL`, `PAIE`, `CVAP`, `CADP`, `CADE`, `CDIE`.
