# Calendrier (Calendar)

## POST /Mobl/Calendrier/GetCalendrierModel

Returns paginated calendar events (list view).

**Body:**
```
decalagePagination              number     page offset (0 = current)
typeCalendrier                  string     "scolaire", "lea", etc.
anSession                       string     term ID (empty = current)
coursGroupe                     string     filter by course (empty = all)
filtre                          string     "choix_tous" = all types
filtresDisabled[N].Key          string     filter type name
filtresDisabled[N].Value        boolean    true = disabled
```

Filter keys observed: `CalScolaire`, `Lea`, `Perso`, `Communaute`, `Cours`, `Examen`, `RendezVous`.

**Response:**
```
DecalagePagination              number
PositionNouvelleAujourdhui      number
IndicateurPagePrecedente        boolean
IndicateurPageSuivante          boolean
TypeCalendrier                  string
AnSession                       null
CoursGroupe                     null
IsTutoratInstalle               boolean
IsServicesAdaptesInstalle       boolean
IsHoraireExamenInstalle         boolean
ListeTypes                      string[]
HoraireDisponible               boolean
IsOmnivoxV19                    boolean
ClasseDistanceDisponible        boolean
AnSessionDisponible             null

ListeEvenements[]
  EstTermine                boolean
  EstEnCours                boolean
  EstPeriode                boolean
  EstAnneeDifferente        boolean
  EstPeriodeMemeJournee     boolean
  TypeAffiche               null
  TitreAffiche              string
  DescriptionAffiche        null | string

  Evenement
    IdEvenement                  string
    Type                         string     event type code
    Titre                        string
    Description                  string
    TitreAng                     string
    DescriptionAng               string
    TimestampDateEvenement       number     epoch ms
    TimestampDateFin             number
    EstTermine                   boolean
    EstEnCours                   boolean
    EstSeulementGrille           boolean
    PositionJour                 string

    Details
      LienExterne                              string
      TitreCommunaute                          null | string
      URLCommunaute                            null
      IdWebPart                                string
      NoCours                                  null | string
      NoGroupe                                 null | string
      AnSession                                null
      NomCours                                 null
      IdDocument                               null
      IdEvaluation                             number
      Ponderation                              number
      IdTravail                                null
      ModeRemise                               number
      IdRencontreTutorat                       null
      TypeParticipationTutorat                 number
      NomAutreParticipantTutorat               null
      URLMioAutreParticipantTutorat            null
      IndicateurActiviteTutorat                boolean
      IndicateurAfficheQDN                     boolean
      IdRencontreServicesAdaptes               string | null
      URLMio                                   null
      NomMio                                   null
      NoLocal                                  null | string
      IsCoursV19                               boolean
      URLMio2                                  null
      NomMio2                                  null
      IsEvenementLea                           boolean
      IsEvenementPriveLea                      boolean
      DepotEnLigne                             number
      DetailRemiseNonSysteme                   null
      DetailRemiseAlternatifElectronique       null
      StatutDiffusion                          number
      PublicCible                              null
      RangAffichage                            number
      PossedeImage                             boolean
      IDGroupe                                 number
      TypePeriode                              null
      ModeParticipation                        null | string
      TitreTypeComposante                      null | string
      TypeEnseignement                         null | string
      IsMultiCoursGroupes                      boolean
      NoCoursGroupesFormat                     null
```

---

## POST /Mobl/Calendrier/GetCalendrierMoisModel

Returns calendar events for a specific month.

**Body:**
```
moisCourant                     number     epoch ms of the month start
typeCalendrier                  string     "lea", "scolaire", etc.
anSession                       string     term ID
coursGroupe                     string
filtre                          string     "choix_tous"
filtresDisabled[N].Key          string
filtresDisabled[N].Value        boolean
```

**Response:** same structure as `GetCalendrierModel`.
