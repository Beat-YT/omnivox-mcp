# CentrePaiement

## POST /Mobl/CentrePaiement/GetCentrePaiementModel

Returns only the common envelope fields (no payment data observed — likely populated when a payment is due).

**Body:** `{}`

**Response:** common envelope only (`Updating`, `IsPeriodeArret`, `NaviguerPage`, `DateRetourSysteme`, `CacheConfig`, `IsAvailable`).
