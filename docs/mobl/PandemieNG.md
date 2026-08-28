# PandemieNG

## POST /Mobl/PandemieNG/GetDefaultModel

Returns the health status declaration campaign state.

**Body:** `{}`

**Response:**
```
InterceptionPandemieNG
  DoitIntercepter                    boolean
  IDCampagneSuiviPandemie            number     -2147483648 = none
  IsTypeDeclarationSuivi             boolean
  IndicateurDeclarationObligatoire   boolean
  NomMaladie                         string | null
  Instructions                       string | null
  IsAtteint                          boolean
```
