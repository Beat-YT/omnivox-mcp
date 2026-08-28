# Login

## POST /Mobl/Login/GetTokenRedirection

Returns a single-use token for redirecting to the Omnivox web portal.

**Body:** `{}`

**Response:**
```
TokenRedirection    string     base64-encoded redirect token
```

Called multiple times throughout a session (before navigating to web views).
