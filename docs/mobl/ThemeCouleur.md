# ThemeCouleur

## POST /Mobl/ThemeCouleur/GetListeThemeCouleurModel

Returns available UI color themes.

**Body:** `{}`

**Response:**
```
ThemeSelectionne    string     e.g. "Energie"
NbThemes            number

ListeThemes[]
  Titre        string     e.g. "Bonbons", "Electrique", "Energie", "Feu", "Hockey", "Lagon", "Monochromia", "Nature", "Printemps", "Superpouvoir", "Vanille"
  IsCurrent    boolean
```
