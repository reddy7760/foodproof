# FoodProof — Session Notes

Record of the planning and Milestone 1 build session for this project, kept alongside the code for continuity.

## What FoodProof is

A community-powered food review app. Real customers upload dish-level photos, ratings, and reviews after visiting a restaurant (not restaurant marketing photos), and earn points for genuine contributions, redeemable for discounts/coupons. Key differentiator: dish-level (not just restaurant-level) ratings, photos, and price.

## Stack

Flask + SQLAlchemy + Strawberry-GraphQL (backend), PostgreSQL via Alembic migrations, React + TypeScript + Apollo Client (frontend), Celery + Redis for background jobs. Chosen deliberately to match the user's day-job stack (Flask/SQLAlchemy/GraphQL/React on a talent marketplace platform) — conventions should follow that codebase's style rather than introduce new patterns.

## Data model

- **User** — id, name, email, password_hash, phone, created_at
- **Restaurant** — id, name, city, address, lat, lng, price_range, avg_rating, created_at
- **Dish** — id, restaurant_id (FK), name, category, avg_rating, avg_price, created_at
- **Review** — id, user_id (FK), restaurant_id (FK), dish_id (FK nullable), rating (1-5), review_text, price_paid, status (pending/approved/rejected), is_verified_visit, created_at
- **ReviewPhoto** — id, review_id (FK), photo_url, moderation_status, is_duplicate
- **ReviewHelpfulVote** — id, review_id (FK), voter_user_id (FK), unique(review_id, voter_user_id)
- **PointsLedger** — id, user_id (FK), review_id (FK nullable), points, reason, created_at. **Append-only, never a mutable balance column** — a user's balance is always the sum of their ledger rows, computed at read time, specifically to avoid race conditions on concurrent point-crediting events.
- **Reward** — id, title, points_cost, restaurant_id (nullable), stock
- **Redemption** — id, user_id (FK), reward_id (FK), points_spent, redeemed_at, status

## GraphQL API (current + planned)

Queries: `restaurants(city, search)`, `restaurant(id)`, `dish(id)`, `myPointsBalance`.
Mutations (later milestones): `signup`, `login`, `createReview`, `voteHelpful(reviewId)`, `redeemReward(rewardId)`.

## Moderation pipeline (Milestone 3, not yet built)

Celery task on review submit: min review length check, perceptual-hash duplicate photo check (`imagehash`), spam filter, auto-approve + credit points if checks pass, else flag for admin review.

## Build order

1. **Restaurant/Dish models + seed data + browse queries + browse UI (no auth) — ✅ done**
2. **Auth + review/photo upload flow (presigned S3/Cloudinary upload) — ✅ done**
3. **Points ledger + moderation background job + admin approval queue — ✅ done**, broken into:
   - **3a. Points ledger + admin approve/reject mutations — ✅ done**
   - **3b. Moderation checks (length, perceptual-hash duplicate photo, spam filter) — ✅ done** —
     running **synchronously inside the review/photo mutations**, not as a Celery task, since
     Docker/WSL2 (needed for Redis) still isn't working on this machine. Swap in real Celery later
     without changing the moderation logic itself.
   - **3c. Admin frontend page over `pendingReviews`/`approveReview`/`rejectReview` — ✅ done**
4. Milestone 4 (next, in this order): helpful voting → rewards catalog browsing → redemption flow
   (redemption depends on the points balance from 3a)

## What got built (Milestone 1)

**Backend** (`backend/`):
- Flask app factory (`app/__init__.py`), config (`app/config.py`), extensions (`app/extensions.py`)
- All 9 SQLAlchemy models under `app/models/`, registered via `app/models/__init__.py`
- Alembic/Flask-Migrate set up (`migrations/`), initial migration generated and applied
- `flask seed` CLI command (`app/seed.py`) — seeds 3 restaurants (Bengaluru x2, Chennai x1) with 7 dishes total
- Strawberry GraphQL schema (`app/graphql/`) serving `restaurants(city, search)`, `restaurant(id)`, `dish(id)` at `/graphql`

**Frontend** (`frontend/`):
- Hand-scaffolded Vite + React 18 + TypeScript + Apollo Client (the `npm create vite` CLI failed on the machine's original Node 18 install, so it was built file-by-file instead)
- Browse UI: city/search filter inputs, restaurant cards with nested dish lists (name, category, price)
- Verified with a real headless-Chromium run via Playwright — page renders, filters work, zero console errors

## Environment setup done this session

The machine had none of the required tooling installed at the start. Installed via winget/npm with the user's confirmation:
- **Python 3.12** (`C:\Users\Shiva Reddy\AppData\Local\Programs\Python\Python312`)
- **Node.js upgraded 18.18.0 → 24.19.0 LTS** (`C:\Program Files\nodejs`) — needed because both `create-vite` and Playwright require Node 20+
- **Docker Desktop** — installed but **not yet functional**: it needs WSL2, which needs admin rights the agent session doesn't have. The user was going to run `wsl --install` from an elevated PowerShell themselves and restart.

**Current DB: SQLite**, not Postgres. `backend/app/config.py` defaults `SQLALCHEMY_DATABASE_URI` to a local `backend/dev.db` file, overridable via the `DATABASE_URL` env var. Once Docker/WSL2 is working, `docker-compose.yml` (already written, at the project root) brings up Postgres + Redis — switching over is just setting `DATABASE_URL`, no code changes needed.

## Gotchas hit and how they were resolved

1. **`create-vite` failed on Node 18** (`styleText` not exported from `node:util`) — worked around by hand-writing the Vite/React/TS scaffold instead of using the CLI. Fixed properly later by upgrading Node to 24; the CLI was never re-run since the hand-built scaffold already worked.
2. **Playwright also required Node 20+** — same root cause, fixed by the same Node upgrade.
3. **Strawberry's async `DataLoader` doesn't work under Flask's sync WSGI dev server.** `strawberry.flask.views.GraphQLView` calls `execute_sync`, which tears the event loop down per-resolver; this produced `"There is no current event loop in thread ..."` and later `"GraphQL execution failed to complete synchronously"` errors. Fix: for Milestone 1's restaurant→dishes nesting, dropped the async DataLoader and instead set `lazy="selectin"` on the `Restaurant.dishes` SQLAlchemy relationship — this batches dish-loading into one extra query across all restaurants in a result set, which is the actual N+1 fix here and needs no asyncio at all. The DataLoader code is still sitting in `app/graphql/loaders.py`, unused, with a comment explaining why — revisit for the deeper dish→reviews→photos chain in Milestone 3/4, either by continuing to lean on `selectin` relationships, doing manual per-request query batching, or moving to an ASGI server (`strawberry.asgi.GraphQL` + Hypercorn/Uvicorn) if true GraphQL-layer dataloading is needed.
4. **Stale `flask run` reloader subprocesses** survived across a session disconnect and kept serving cached old code on port 5000, twice producing confusing errors that looked like code bugs but were actually zombie processes. Fixed by checking `Get-NetTCPConnection -LocalPort 5000` and the owning process's start time before trusting a response, and killing stale processes before restarting.

## What got built (Milestone 2)

**Backend** (`backend/`):
- `app/auth/` — `security.py` (bcrypt via passlib, JWT encode/decode with PyJWT), `context.py`
  (`get_current_user` reads the JWT from an httpOnly cookie or `Authorization: Bearer`,
  `require_user` raises a `GraphQLError` for protected resolvers)
- JWT is carried in an httpOnly, `SameSite=Lax` cookie set by `signup`/`login`, cleared by
  `logout` — never touches `localStorage` or JS at all (verified `document.cookie` is empty
  after login; feasible because `strawberry.flask.views.GraphQLView.get_context` hands
  resolvers the same Flask `Response` object that becomes the actual HTTP response, so
  `response.set_cookie(...)` inside a mutation just works)
- `FoodProofGraphQLView.get_context` now injects `current_user` per-request
- New mutations (`app/graphql/mutations.py`): `signup`, `login`, `logout`, `createReview`
  (auth required, always created with `status = pending`), `attachReviewPhoto` (auth required,
  rejects attaching to another user's review)
- New queries: `me`, `cloudinaryUploadSignature` (auth required)
- `app/integrations/cloudinary_client.py` — signs upload params (`timestamp` + `folder`) with
  the API secret; the browser uploads image bytes straight to Cloudinary, never through Flask
- `flask export-schema` CLI command added (prints SDL) so the frontend can regenerate codegen
  types without a running server
- No new migration needed — `password_hash` already existed on `User` from Milestone 1

**Frontend** (`frontend/`):
- `react-router-dom` added for routing: `/`, `/login`, `/signup`, `/reviews/new` (protected via
  `RequireAuth`, redirects to `/login` and back)
- `AuthContext` wraps the `me` query + login/signup/logout mutations, refetches `me` after each
  auth action
- `LoginPage`/`SignupPage` use React Hook Form + Zod (`@hookform/resolvers/zod`)
- `UploadReviewPage`: restaurant → dish cascading selects, star-rating `Controller`, price/text
  fields, file input that calls `cloudinaryUploadSignature` then uploads directly to
  `api.cloudinary.com` via `fetch`, then `createReview` + (if a photo was picked)
  `attachReviewPhoto`
- GraphQL Codegen set up fresh (didn't exist before): `codegen.yml` reads
  `frontend/schema.graphql` (generated by `flask export-schema`) and `src/**/*.ts` documents,
  outputs `src/generated/graphql.ts`. `types.ts` now just derives `Restaurant`/`Dish` from the
  generated `RestaurantsQuery` type instead of hand-written interfaces. Run `npm run codegen`
  after adding/changing any `gql` operation (and re-export the schema first if the backend
  schema changed: `flask export-schema > ../frontend/schema.graphql`)
- `apolloClient.ts` sets `credentials: "include"` so the auth cookie round-trips with GraphQL
  requests

**Verified live** (Playwright + a running Flask/Vite pair): signup → nav shows user + logout;
logout → nav reverts to Login/Sign up; login round-trip; visiting `/reviews/new` while logged
out redirects to `/login`; full review submission (restaurant, dish, 4-star rating, text, price)
persists to SQLite with `status = pending`; zero console errors throughout. Cloudinary itself
wasn't exercised end-to-end since no real Cloudinary account is configured on this dev
machine — `cloudinaryUploadSignature` correctly raises "Cloudinary is not configured on this
server" until `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` are set in
`backend/.env`.

## What got built (Milestone 3, phase 3a: points ledger)

**Backend** (`backend/`):
- `users.is_admin` boolean column added (migration `a397aca184be_add_is_admin_to_users.py`;
  `server_default=sa.false()` added by hand since Alembic's autogenerate left it off, which would
  have failed against the existing non-empty `users` table)
- `app/points.py` — `credit_points()` (raw ledger insert) and `credit_for_approved_review()`
  (the actual crediting rule: `REVIEW_APPROVED_POINTS = 10` always, plus
  `PHOTO_BONUS_POINTS = 2` if the review has at least one photo — two separate ledger rows with
  distinct `reason`s so a user's history reads as a clear audit trail, not one opaque summed
  number)
- `require_admin()` added alongside `require_user()` in `app/auth/context.py`
- New queries: `myPointsBalance` (sums `PointsLedger.points` at read time — per the
  already-decided append-only design, never a stored balance column),
  `myPointsHistory`, `pendingReviews` (admin-only)
- New mutations: `approveReview`/`rejectReview` (admin-only, reject re-approving/re-rejecting a
  review that's already left `pending`); `approveReview` is what actually calls
  `credit_for_approved_review`
- `flask make-admin <email>` CLI command to promote a user for testing — no signup flow for
  admins yet, this is the only way in right now

**Frontend** (`frontend/`):
- Nav bar shows a `"{balance} pts"` pill next to the user's name (`MY_POINTS_BALANCE_QUERY`,
  `skip: !user`) — the only new frontend surface for 3a; the actual admin review queue UI is
  deferred to phase 3c

**Verified live**: promoted a user via `flask make-admin`, approved a review with a photo (+10
+2 = 12 balance), rejected another (+0), confirmed double-approve is blocked
("Review is already approved"), confirmed a non-admin calling `approveReview` gets "Admin access
required", confirmed the nav pill renders the live balance in a real browser session.

## What got built (Milestone 3, phase 3b: moderation checks)

**Backend** (`backend/`):
- `app/moderation.py`:
  - `review_text_passes`: at least 20 characters and no links (`http(s)://` or `www.`)
  - `moderate_photo`: fetches the image from Cloudinary, computes a perceptual hash (`imagehash.phash`),
    and marks it `rejected` + `is_duplicate` if it's within Hamming distance 5 of any non-duplicate
    photo. A fetch or decode failure leaves the photo `pending`, never approved.
  - `auto_approve_if_clean`: approves and calls `credit_for_approved_review` only if the review is
    pending, the text passes, and every photo is `approved`. Anything else stays pending for the 3c queue.
- `review_photos.perceptual_hash` column (migration `ca13c7dc1576`), indexed.
- **Approval timing:** `createReview` takes an optional `photoUrl`, so the photo is checked before the
  single approval decision. A duplicate photo blocks approval. `attachReviewPhoto` still exists, but
  only works while the review is pending, so a late photo can't change an approved review's points.
- **SSRF guard:** photo URLs must start with `https://res.cloudinary.com/<our cloud name>/`. This stops
  the server from fetching arbitrary URLs.

**Frontend** (`frontend/`):
- The upload form sends the photo in `createReview` (the two-step call is gone). After submit it shows
  "live, and you've earned points" or "pending a manual check", plus a duplicate-photo notice when relevant.

**Verified live:** short text stays pending; clean text auto-approves (+10); a spam link stays pending;
clean text plus a distinct photo approves (+12); a duplicate photo is rejected and the review stays pending;
a late photo on an approved review errors; a non-Cloudinary URL errors before any fetch. The browser
upload flow shows the approved message with no console errors. Points arithmetic checked (balance 12 → 56).
Test images were deleted from Cloudinary afterwards.

**Known gaps:** duplicate detection scans every stored hash (fine at this scale, not indexed for
similarity). Photo fetching is synchronous, so a slow Cloudinary response slows the mutation (up to a
5-second timeout). Both move to Celery when Docker/WSL2 works.

## What got built (Milestone 3, phase 3c: admin queue page) — Milestone 3 now fully done

**Backend** (`backend/`):
- `User.isAdmin` and `Review.userName`/`userEmail`/`restaurantName`/`dishName` added to the
  GraphQL types (denormalized onto `Review` via the existing `user`/`restaurant`/`dish`
  relationships — fine at admin-queue volume, not worth a `selectin` change for this)

**Frontend** (`frontend/`):
- `RequireAdmin` (mirrors `RequireAuth`, redirects non-admins to `/`) guarding a new `/admin` route
- `AdminQueuePage`: lists `pendingReviews` as cards (restaurant/dish, reviewer, rating, text, price,
  photo thumbnails with moderation status) with Approve/Reject buttons that refetch the list
- "Admin" nav link shown only when `me.isAdmin`

**Verified live**: admin sees the pending queue and the Admin nav link; approving/rejecting updates the
list and the points pill in real time; a non-admin sees no Admin link and is redirected away from
`/admin` if they navigate there directly; zero console errors.

**Gotcha hit**: the Flask stat-reloader silently failed to restart after the `types.py` edits for this
phase — `wmic` showed **five** nested `flask run` processes stacked up (each restart apparently spawned
a new monitor+worker pair without fully replacing the old one), and the oldest one was still answering
on port 5000 with the stale schema. Killing only the single PID bound to the port (as the earlier
gotcha's fix described) wasn't enough this time either. Fix: enumerate every `python.exe` running
`flask run --port 5000` via `wmic process where "name='python.exe'" get ProcessId,ParentProcessId,CommandLine`
and kill the whole chain, then start one fresh process. **If a schema/code change doesn't seem to take
effect, don't trust the reloader — check for a stacked process chain before debugging the code itself.**

**Also hit this session**: `backend/.venv/Scripts/activate` got corrupted (a `fi` went missing from the
`deactivate()` function, breaking `source .venv/Scripts/activate` with a bash syntax error) after the
user had the file open in the IDE. Restored by hand. Cause unconfirmed — possibly an IDE
save/line-ending interaction — but worth a quick diff check if venv activation ever breaks again.

## What got built (Milestone 4, step 1: helpful voting)

There was no way to actually see a review anywhere in the app before this — browse only showed
restaurants and dishes. Helpful voting needed somewhere to vote *on*, so this also ships the first
review-reading UI.

**Backend** (`backend/`):
- `Restaurant.reviews`: approved reviews only (`dish_id` null or not — restaurant- and dish-level
  together), sorted by helpful count then recency. Built from the already-`selectin`-loaded
  `model.reviews`/`model.helpful_votes`, so no new queries.
- `Review.helpfulCount`/`hasVotedHelpful` — the latter needs the current user, so `Restaurant.from_model`
  and the `restaurants`/`restaurant` queries now thread `current_user_id` through (`None` when logged out).
- `voteHelpful(reviewId)` mutation: toggles (vote → unvote on a second call) via the existing unique
  constraint on `(review_id, voter_user_id)`. Rejects voting on a non-approved review and on your own
  review.

**Frontend** (`frontend/`):
- `RestaurantCard` now renders each restaurant's approved reviews (rating, author, dish, text, photos)
  with a Helpful button. Logged out, or viewing your own review, it's static "`N` found this helpful"
  text instead of a button — no point showing a control that would just error.
- Also fixed a latent bug noticed while in this file: `restaurant-card__rating` used `` ₹{...} `` instead
  of `` ${...} `` in a template literal, so a restaurant with a nonzero `avgRating` would have rendered
  the literal text `₹{restaurant.avgRating...}` instead of the star rating. Never triggered yet since
  `avg_rating` is never recalculated anywhere (still a known gap, not in scope here) — would have shown
  up the moment that's built.

**Verified live**: logged out, every review shows static helpful text, zero buttons. Logged in, your
own reviews are static, everyone else's are clickable. Voting toggles the count and active style
on/off correctly. Zero console errors.

**Gotcha hit again**: the Flask reloader needed a manual full-process-tree restart once more after
editing `types.py` — same class as the phase-3c gotcha. Checked with `wmic process where
"name='python.exe'" get ProcessId,ParentProcessId,CommandLine` first this time, confirmed it was a
single clean monitor+worker pair (not stacked), and killed that pair before starting fresh. Worth
treating "did my backend change actually take effect?" as a standing question after any `types.py` or
resolver edit, not just when something looks broken.

## What got built (Milestone 4, step 2+3: rewards catalog + redemption) — Milestone 4 now fully done

**Backend** (`backend/`):
- `Reward`/`Redemption` GraphQL types, denormalizing `restaurantName`/`rewardTitle` the same way
  `Review` does (`Reward.restaurant` and `Redemption.reward` are plain, non-`selectin`
  relationships — fine at catalog/history volume).
- `rewards` query (all rewards, cheapest first) and `myRedemptions` query (a user's own history).
- `redeemReward(rewardId)` mutation: checks stock, checks balance (via a new shared
  `points.get_points_balance()`, also now used by `myPointsBalance` to avoid duplicating the sum
  query), decrements `reward.stock`, creates a `Redemption` row, and debits the points ledger with
  a **negative** `PointsLedger` entry (`REASON_REWARD_REDEMPTION`) — same append-only pattern as
  crediting, just negative. `PointsLedger.review_id` is nullable and stays `None` here since the
  table has no `redemption_id` column to link back to; the ledger row's `reason` string is the only
  trace of which kind of spend it was.
- `flask seed-rewards` CLI command: seeds a 4-reward catalog (3 restaurant-specific, 1 platform-wide)
  **without touching existing restaurants** — looks them up by name instead of recreating them,
  unlike `flask seed` which always inserts fresh restaurants. Guards against double-seeding by
  checking `Reward.query.count() > 0` first.
- **Known gap, accepted deliberately**: no locking between the balance/stock check and the write,
  so two simultaneous redemptions from the same under-funded account (or for the last unit of
  stock) could both succeed. Same level of rigor as the rest of this codebase at this stage
  (`approve_review` etc. don't lock either) — flagging it here rather than fixing it, since it'd
  need real row locking or a `SELECT ... FOR UPDATE`-style pattern SQLite doesn't support well
  anyway. Worth revisiting before this ever runs multi-worker against Postgres.

**Frontend** (`frontend/`):
- `RewardsPage` at `/rewards` (public route, no auth guard — browsing is open to everyone, same as
  the restaurant browse page). Points balance shown via the same `MY_POINTS_BALANCE_QUERY` the nav
  pill uses, so Apollo's cache keeps both in sync automatically after a redemption with no manual
  wiring. Redeem button is disabled with a specific reason shown as the label itself ("Log in to
  redeem" / "Out of stock" / "Need N more pts") rather than a generic disabled state.
- A user's redemption history renders below the catalog when they're logged in and have any.
- "Rewards" added to the nav, visible in both the logged-in and logged-out states (unlike "Write a
  review"/"Admin", which are gated).

**Verified live**: logged out, all 4 reward buttons show "Log in to redeem" and are disabled.
Logged in with a 22-point balance, the 20-point reward is redeemable and the rest show the correct
"Need N more pts" math. Clicking Redeem drops stock 14→13, balance 22→2 in both the page and the nav
pill simultaneously, and the new redemption appears in history with the right points/status/date.
After spending down, all buttons correctly flip to "Need N more pts". Also verified directly via
GraphQL: out-of-stock and reward-not-found errors, and that insufficient balance blocks redemption
even when stock remains.

Milestone 4 is now fully done: helpful voting, rewards catalog, redemption — all three built and
verified. That closes out the original Milestone 1–4 build order from the start of this project.

## What's left (not part of the original 4 milestones, but known gaps)

- Real Celery/Redis for moderation (currently synchronous in-request, since Docker/WSL2 isn't
  working on this machine) — see phase 3b notes.
- `avg_rating` is never recalculated on `Restaurant`/`Dish` — always shows "No ratings yet" in the
  UI. Never came up as blocking because nothing depended on it until now.
- Switch `DATABASE_URL` from SQLite to Postgres once Docker/WSL2 works (`docker-compose.yml` at the
  project root already has Postgres + Redis defined, untested).
- Redemption/reward concurrency (see this section's "known gap" above).
- No admin UI for managing the reward catalog itself (add/edit/restock) — rewards are seed-data only
  right now, matching how restaurants/dishes have no admin UI either.
