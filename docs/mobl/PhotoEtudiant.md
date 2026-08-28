# PhotoEtudiant

## POST /Mobl/PhotoEtudiant/GetDefaultModel

Returns student photo metadata and submission status.

**Body:** `{}`

**Response:**
```
Image                           string     relative URL to photo endpoint
Instructions                    null
TitreInfos                      string     e.g. "Photo ID"
TexteInfos                      null
ClasseCouleurTitre              null
TexteBoutonPhoto                null
IsRetransmission                boolean
TexteBoutonAnnulerRetransmission null
DoitAfficherCriteres            boolean
CadreImageRouge                 boolean
ListeCriteres                   null
CritereAutre                    null
ListeCriteresPiece              null
CritereAutrePiece               null
PlusieursCriteres               boolean
TypePiece                       null
RefusPieceBottom                boolean
AfficheSeulementRefus           boolean
RedirigerCarteNumerique         boolean
RenvoyerPiece                   boolean
RenvoyerPhoto                   boolean
IsModeUploadPieceActif          boolean
IndicateurEnCoursApprobation    boolean
IsCAREAccessible                boolean
TexteCollecteInfo               string
DisableTransmission             boolean
```

---

## GET /Mobl/PhotoEtudiant/GetPhotoEtudiant

Returns the student's photo.

**Query params:**
```
fromSGP    string     "True"
t          string     cache-busting timestamp
```

**Response:** `image/jpg`
