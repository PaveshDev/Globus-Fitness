# Globus Fitness

React 19 + Vite frontend, Node.js 24 + Express 5 API, and Neon PostgreSQL through Prisma 7. Existing gym photos, pricing, public pages, WhatsApp contact links, and jersey presentation are preserved.

## Implemented

- Registration saves name, normalized Sri Lankan phone number, NIC, and a salted scrypt password hash. Phone and NIC are unique. Server validation applies independently of the browser.
- Login uses an HttpOnly, SameSite cookie with a one-day signed token and a database session. Logout revokes the session. Production cookies require HTTPS.
- Members can view their profile and their own payment history. Admission must be paid first; membership checkout stays locked until an admin confirms sending the admission notification on WhatsApp. Admins can view paginated member, admission, and payment records.
- All 13 original photos in `Image/` are uploaded as actual binary files to Cloudinary. The frontend loads the verified originals directly from Cloudinary using `client/src/data/imageManifest.json`. PostgreSQL keeps asset IDs, public IDs, delivery URLs, filenames, MIME types, SHA-256 checksums, and sizes. Legacy database bytes are cleared only after downloading and verifying the Cloudinary original. Original local files and existing frontend copies are preserved. Generated screenshots, build output, and dependency assets are not imported.
- Five database payment options use the supplied prices: admission LKR 2,500; monthly LKR 2,500; 3 months LKR 7,000; 6 months LKR 12,000; annual LKR 25,000. Admission is a separate payment.
- PayHere checkout creates a pending order with a server-selected price. Signed notifications verify merchant, amount, currency, and order before updating payment status. Duplicate notifications are idempotent; late callbacks cannot downgrade paid or charged-back records.
- Payment records retain billing name/email/address/city, amount in integer minor units, currency, description, gateway reference, sandbox flag, status, and timestamps. Raw card details, CVV, passwords, and merchant secrets are never returned or stored in payment records.

PayHere is prepared but **not activated** until merchant credentials and a public callback URL are configured. No account is automatically made an administrator. Membership activation/expiry rules, recurring billing, refund automation, account recovery, and the remaining scaffolded pages are outside this implementation.

## Local development

Requirements: Node.js 24+ and npm 11+.

The supplied Neon connection and a generated JWT secret have been configured locally in ignored `server/.env`. For a fresh checkout, copy `server/.env.example` to `server/.env`, supply the Neon URL, and generate a random JWT secret (at least 32 characters). Never put secrets in frontend `VITE_` variables.

```sh
npm install
npm run db:setup
npm run dev
```

`db:setup` generates Prisma Client, applies committed migrations without resetting the database, and seeds plans/images. The image seed needs the server Cloudinary credentials below. Rerunning it preserves users, payments, existing plan prices, and unchanged cloud assets. Changed original photos receive new content-based asset IDs; existing cloud assets are never overwritten or deleted.

- Frontend: http://localhost:5173
- API liveness: http://localhost:5000/api/health
- Database readiness: http://localhost:5000/api/ready
- Vite proxies `/api` to Express on port 5000.

## Cloudinary image storage

The actual image files are already uploaded to your Cloudinary account. URLs are the browser's addresses for retrieving those files, not a substitute for uploading them.

Keep the upload credentials in ignored `server/.env` or the deployment secret store:

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The local values are configured. Never add the API secret to React, `VITE_` configuration, or the public image manifest. Uploads use authenticated multipart requests from Node.js with the original binary file attached; no unsigned upload preset is needed.

To add or replace a project image, put the original file in `Image/`, then run:

```sh
npm run images:sync --workspace server
npm run build
```

The sync verifies every remote original by downloading it and comparing byte length and SHA-256. It reuses unchanged uploads, safely resumes a partial run, updates Neon metadata, and writes the public manifest only when all originals are verified. Commit/deploy the generated `client/src/data/imageManifest.json` along with the application. When adding a new image, reference its filename in the relevant component/data source.

At runtime the deployed frontend reads images directly from Cloudinary's HTTPS CDN. It does not need the original `Image/` folder, the old `client/src/assets/gym/` copies, Cloudinary upload credentials, or an API request to display these images. The existing `/api/images/:filename` endpoints remain compatible by redirecting to Cloudinary. Account and payment features still require Express and Neon.

## Enable PayHere Lite

PayHere Lite supports one-time checkout; each membership payment is initiated separately. Create a PayHere merchant account and register the frontend domain under **Integrations**. Obtain the Merchant ID and domain-specific Merchant Secret. Use a separate sandbox account/integration for testing.

Set these values in `server/.env` or deployment secret storage:

```dotenv
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_SANDBOX=true
PUBLIC_API_URL=https://your-api-domain.example
CLIENT_ORIGIN=https://your-frontend-domain.example
```

`PUBLIC_API_URL` is the public HTTPS API origin, without `/api`. PayHere must reach `POST /api/payments/payhere/notify`; localhost alone cannot receive their callbacks. The browser is redirected to PayHere's hosted checkout and returns to `/member/payments`. A return redirect never marks a payment paid: the server notification is authoritative. History polls for up to one minute after return and has a manual refresh button.

Test successful, failed, cancelled, and delayed notifications with your real sandbox integration. Once merchant/domain approval and sandbox testing are complete, use the live integration credentials and set `PAYHERE_SANDBOX=false`. Existing sandbox records remain clearly marked. Changing environments does not turn test payments into live payments.

Billing fields and the payment-plan selector remain editable while merchant configuration is missing. Only the checkout button stays disabled, and keyboard/programmatic form submission cannot start a payment until PayHere is configured. Details are saved when checkout starts, not while typing. No merchant account, public tunnel, external deployment, or real payment has been created by this implementation.

Provider references: [Checkout API](https://support.payhere.lk/api-&-mobile-sdk/checkout-api), [sandbox testing](https://support.payhere.lk/sandbox-and-testing), [current pricing](https://payhere.lk/fees/).

## Administrator access

Register your own account, then promote that exact registered phone number from a trusted terminal:

```sh
npm run admin:promote --workspace server -- 0771234567
```

Reload the app and open `/admin`. The registration API ignores submitted roles and always creates a member. There is no public role-change endpoint and no default admin password.

## Admission-first membership policy

1. A newly registered member can select only **Admission fee — LKR 2,500**. Billing fields remain editable while PayHere setup is pending; checkout still requires configured gateway credentials.
2. A verified successful admission payment changes the member's status to **Awaiting admin confirmation**. No membership plans are offered, and repeat admission checkout is blocked.
3. In **Administration → Admissions**, the admin reviews the paid admission and opens a WhatsApp draft addressed to the member's registered number. The admin reviews and sends the message in WhatsApp.
4. After sending, the admin ticks **I sent the admission confirmation on WhatsApp** and selects **Confirm notification & unlock**. This records the admin ID and notification-confirmation time against that paid admission. Opening the draft alone never changes account access.
5. The member can then select monthly, quarterly, half-year, or annual membership payments. Admission is no longer offered. The member page checks for approval while awaiting confirmation and provides a manual refresh button.

The app records the admin's confirmation of sending; it does not claim to verify WhatsApp delivery or send messages automatically. No WhatsApp Business API credentials are configured. Only successful admission payments can be approved. Pending, failed, cancelled, and charged-back admissions do not qualify. A chargeback removes the eligibility of that admission even if it was previously approved. Sandbox approvals apply only to sandbox checkout and cannot unlock live membership payments.

The server independently enforces this rule, including on resumed checkouts. Frontend changes or forged approval fields cannot bypass it. Approval retries preserve the original admin/time. Existing members without a paid, approved admission must complete the same steps; no accounts are automatically grandfathered in.

## API

| Endpoint | Access / purpose |
| --- | --- |
| `POST /api/auth/register` | Create member and session |
| `POST /api/auth/login` | Sign in with phone and password |
| `POST /api/auth/logout` | Revoke current session |
| `GET /api/auth/me`, `GET /api/members/me` | Current authenticated profile |
| `GET /api/images` | Public image metadata and Cloudinary delivery URLs |
| `GET /api/images/:filename` | Compatibility redirect to the Cloudinary original |
| `GET /api/payments/options` | Authenticated member's eligible plans, admission status, and gateway availability |
| `GET /api/payments?page=1` | Current member's history |
| `POST /api/payments/checkout` | Create/reuse pending order and return signed hosted-checkout fields |
| `POST /api/payments/payhere/notify` | Signed, form-encoded gateway notification |
| `GET /api/admin/members?page=1` | Admin-only member list |
| `GET /api/admin/payments?page=1` | Admin-only payment list |
| `GET /api/admin/admissions?page=1` | Admin-only paid admissions and notification audit records |
| `POST /api/admin/admissions/:paymentId/confirm-notification` | Admin attests `{ "notified": true }` after sending WhatsApp; unlocks eligible membership payments |

App mutations require `X-Requested-With: GlobusFitness`, cookies, and an allowed Origin when present. The signed PayHere callback is exempt from browser CSRF checks. Login/registration and checkout have per-process rate limits. For multiple API instances, use a shared rate limiter; configure proxy trust only for a known trusted proxy topology.

## Verification

```sh
npm run lint
npm run build
npm run prisma:validate
npm test
npm run test:integration
```

Unit tests cover phone normalization, validation, password hashing, checkout input filtering, Cloudinary request signing, binary uploads, delivery URL validation, and mismatched download rejection. Integration tests require the configured migrated Neon database and uploaded Cloudinary images; they create disposable test accounts and sandbox-labelled orders, exercise the real Express API and PostgreSQL persistence, and remove only their own fixtures in `finally`. Gateway callbacks are simulated and never contact PayHere or charge money. Image checks download existing Cloudinary originals without creating or deleting cloud assets.

Integration coverage includes authorization, CSRF, duplicate accounts, Cloudinary redirects, original image byte/checksum equality and CDN caching, price tampering, checkout idempotency, invalid notification signatures/amounts/currencies, duplicate and out-of-order notifications, member record isolation, admin permissions, and session revocation. Live PayHere processing remains unverified until merchant setup is supplied.

Admission integration tests additionally cover forged eligibility fields, all locked membership plans, failed/cancelled payments, waiting after successful payment, repeated admission rejection, explicit admin attestation, audit idempotency, member isolation, sandbox/live separation, chargebacks, and rechecking old checkouts. Gateway callbacks are simulated; tests do not send WhatsApp messages.

The project is JavaScript/JSX and has no separate TypeScript checking script. Prisma-generated TypeScript runs through Node 24 native type stripping. Browser verification uses Playwright at mobile, tablet, and desktop sizes. Screenshots are local artifacts under ignored `.playwright-mcp/`.

## Production

For the already configured database and uploaded images, run `npm run prisma:generate`, `npm run db:migrate --workspace server`, and `npm run build`, then start Express with `NODE_ENV=production` and `npm start`. Re-uploading images during each deployment is unnecessary. For a new database/account, run `npm run db:setup` first with the original files and upload credentials available. Express serves `client/dist`, handles React route reloads, and retains JSON API 404s. Put the service behind HTTPS and set `CLIENT_ORIGIN` to the exact browser origin. The supported production arrangement serves frontend and API on the same site so SameSite cookies work. Store secrets in deployment environment variables and retain Neon certificate verification. Database and Cloudinary API credentials are server-only.

Public WhatsApp contact remains configured by `VITE_ADMIN_WHATSAPP_NUMBER`. Links open drafts for visitors to review; the app never sends WhatsApp messages automatically. The jersey sizing guide remains provisional until supplier measurements are confirmed.
