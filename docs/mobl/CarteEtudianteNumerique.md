# CarteEtudianteNumerique (Digital Student Card)

## POST /Mobl/CarteEtudianteNumerique/EnvoiStatistique

Logs a digital student card view event.

**Body:**
```
typeAffichage    string     "autre" (before load), "valide" (after validation)
```

**Response:** `true`

---

## POST /Mobl/CarteEtudianteNumerique/GetDefaultModel

Returns digital student card metadata and validity status.

**Body:**
```
height    number     screen height for card image scaling
```

**Response:**
```
CodeRetour           number     1 = valid
DateExpiration       number     epoch ms
DateCourante         number     server time epoch ms
DateActivation       number
CarteValide          boolean
IsImageVerticale     boolean
HeightCarte          number
```

---

## GET /Mobl/CarteEtudianteNumerique/GetImageCarte

Returns the digital student card image.

**Query params:**
```
height                  number
dateActivation          number
dateHeureExpiration     number
```

**Response:** `image/jpeg`
