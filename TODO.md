# TODO - Deployment & Fixes (Frontend + Backend)

## Phase 1 — Infrastructure / .env
- [ ] Add `.env` support to backend using `JWT_SECRET`, `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CORS_ORIGIN`.
- [ ] Add `.env` support to frontend (Vite) for `VITE_API_BASE_URL`.
- [ ] Replace hardcoded `http://localhost:5000` and `http://localhost:5173` in frontend/backend with env-based values.

## Phase 2 — Fix Register / Auth
- [ ] Verify `/api/auth/register` endpoint exists and matches frontend expectations.
- [ ] Add missing endpoint(s) or update frontend to use the correct registration endpoints.
- [ ] Ensure `/api/staff/register` is admin-only; frontend “register” UI uses correct flow.
- [ ] Fix any JWT/role/name storage inconsistencies (`localStorage` keys).

## Phase 3 — Interactive Content Completion
- [ ] Fix Treatment / Patient / Appointment / Medicine / Prescription flows that still contain hardcoded URLs.
- [ ] Ensure authorization UI matches backend roles for each module.
- [ ] Implement or verify missing CRUD endpoints referenced by frontend.

## Phase 4 — Medicine Record / Medical record stability
- [ ] Ensure medical record queries join correct tables: prescriptions ⇄ treatments ⇄ patients ⇄ medicines.
- [ ] Confirm inventory deduction and stock sync are correct for create/update/delete/bundle.
- [ ] Add better error messages for stock shortfalls.

## Phase 5 — Build & Test
- [ ] Run backend + frontend locally with `.env` configured.
- [ ] Build frontend for production (`npm run build`) and confirm API calls work.
- [ ] Provide a short deploy checklist in README.

