# Confirmation

## POST /Mobl/Confirmation/GetConfirmationCourrielModel

Checks email confirmation status.

**Body:**
```
isInterception    boolean    false for manual check, true when triggered by interception
```

**Response:**
```
CodeAcces    string     e.g. "Acces_Gen"
```

When `IsAvailable` is `false`, email confirmation is not required.
