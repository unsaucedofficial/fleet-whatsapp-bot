# WhatsApp Fleet Inspection Alert Agent

Listens for fleet inspection webhook payloads, formats them into a clean
WhatsApp message using Groq AI (`llama-3.3-70b-versatile`), and sends the
message to a WhatsApp group via `whatsapp-web.js`.

## How it works

1. `POST /webhook` receives a JSON inspection payload.
2. `messageFormatter.js` sends the payload to Groq, which returns a
   plain-text WhatsApp message (defect alert or pass notice).
3. `whatsappClient.js` sends that message to the WhatsApp group named in
   `WHATSAPP_GROUP_NAME` via a logged-in WhatsApp Web session.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) |
   | `WHATSAPP_GROUP_NAME` | Exact (case-insensitive) name of the WhatsApp group to post alerts to |
   | `PORT` | Port for the Express server (default `3000`) |

3. Start the server:

   ```bash
   npm start
   ```

   Or with auto-restart during development:

   ```bash
   npm run dev
   ```

4. On first run, a QR code prints in the terminal. Scan it from
   **WhatsApp → Linked Devices → Link a Device** on your phone. Session
   data is cached in `.wwebjs_auth/` so you won't need to scan again on
   subsequent runs.

## Endpoints

### `GET /health`
Returns server and WhatsApp connection status.

```json
{ "status": "ok", "whatsapp": "connected" }
```

### `GET /groups`
Returns all WhatsApp groups the logged-in account belongs to.

```json
[{ "id": "123456789@g.us", "name": "Fleet Maintenance Team" }]
```

### `POST /webhook`
Accepts an inspection report payload, formats it via Groq, and sends it to
`WHATSAPP_GROUP_NAME`.

**Request body** must include an `action` field, e.g.:

```json
{
  "action": "inspection_report_upserted",
  "trigger": "created",
  "vehicle_number": "TRUCK-104",
  "driver_name": "John Smith",
  "inspection_type": "pre_trip",
  "defects": [
    { "category": "Brake", "notes": "Brake light not working" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "🚨 NEW MAINTENANCE ISSUE\nTruck: TRUCK-104\nDriver: John Smith\nIssue:\nBrake light not working\nStatus: OPEN\nPlease inspect and resolve."
}
```

**Errors:**
- `400` — payload is missing the `action` field
- `500` — Groq formatting failed, WhatsApp send failed, or the target
  group wasn't found (error message lists all available group names)

## Notes

- WhatsApp disconnections trigger an automatic reconnect after 5 seconds.
- `whatsapp-web.js` drives a headless Chromium instance via Puppeteer —
  keep the process running continuously (e.g. under `pm2` or a systemd
  service) for production use.
- This uses an unofficial WhatsApp Web client library; be mindful of
  WhatsApp's terms of service when deploying.
# fleet-whatsapp-automation
