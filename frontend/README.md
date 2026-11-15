This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ESP32 live Demo bin

Start the app with `npm run dev` in `frontend`. Send HTTP POST requests every 2 seconds to `http://<computer-LAN-IP>:3000/api/bins`, using `Content-Type: application/json`:

```json
{"bin_id":"SRT-DEMO","distance_cm":8.5}
```

The ESP32 and computer must be reachable on the network. Use the computer's LAN IP, not `localhost`. Check Wi-Fi device isolation and firewall settings if the board cannot connect. The sensor should point down from the top of the bin. Never send zero for an invalid echo or timeout; skip that reading. Filter brief passing objects on the board before sending readings.

Full is **4 inches (10.16 cm)** and empty is **9 inches (22.86 cm)**. These are the default calibration values. The bin clears at **15 cm**, retaining its previous state between the thresholds to avoid flicker. Calibrate these on the physical box. In `.env.local`, configure:

```dotenv
BIN_FULL_DISTANCE_CM=10.16
BIN_CLEAR_DISTANCE_CM=15
BIN_EMPTY_DISTANCE_CM=22.86
```

Restart the server after configuration changes. The empty distance must exceed the clear threshold, and the clear threshold must exceed the full threshold. The Demo bin percentage = (empty distance - reading) / (empty distance - full distance) × 100, clamped to 0–100. This is an estimate of fill height, not waste volume.

Legacy payloads `{ "bin_id": "SRT-DEMO", "fill_percent": 95 }` are also supported (full at >=95%). Distance takes precedence if both fields are supplied. Only SRT-DEMO accepts updates; other bins remain sample data.

The page polls every 2 seconds. It separately displays API connectivity and sensor freshness; readings older than 15 seconds are marked delayed. Repeated full readings preserve the first full timestamp; clearing the bin resets it. A full Demo bin takes priority at the top. Waiting times use the stored server timestamp and browser clock.

Readings persist in ignored `frontend/data/live-bins.json`, surviving browser refreshes and local server restarts. This is a single-process local demo store; multiple server instances or ephemeral hosting require a shared database. The endpoint is unauthenticated and intended for local demo use.
