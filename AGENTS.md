<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- No database or real auth; the only server code is AI ticket triage in `src/lib/ai/triage.functions.ts` (Lovable AI Gateway SDK) so prompts/keys stay server-side; pages read data exclusively through `src/lib/api` functions (getOverview, getUsers, …) so a real API can replace the mock transport without UI changes.
- `src/lib/api/client.ts` `request()` is the single transport: it calls `VITE_RD4X_API_URL` when set, otherwise resolves against `src/lib/mock/data.ts` with simulated latency.
- All mock data lives in `src/lib/mock/data.ts` (seeded RNG) — never inline mock data in components.
- Dashboard pages live under the `_dashboard` pathless layout (sidebar + topbar); Login (`/login`) and Key (`/key`) are full-screen routes outside it.
- Pages fetch with `useQuery(queries.x())` from `src/lib/api/queries.ts` and render LoadingSkeleton / ErrorState / EmptyState explicitly, because loading and error states are a product requirement.
- Reusable dashboard building blocks live in `src/components/dashboard/`; reuse them instead of re-styling raw elements per page.
- Dark-only theme; all colors are semantic tokens in `src/styles.css` (status tones: success/warning/danger/info).
