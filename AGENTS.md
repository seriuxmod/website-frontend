# Homepage UI Guidelines

## Web dashboard

- Build every new team or administration page inside the shared `AdminLayout`; do not introduce a second dashboard shell.
- Keep navigation grouped in the persistent administration sidebar. New modules belong in the most appropriate existing group before another group is added.
- Use compact cards, consistent spacing and the existing dark SeriuxMod surfaces. Orange remains the primary brand accent; semantic green, yellow and red are reserved for service state and feedback.
- Never invent values, silently replace unavailable values with `0`, or leave an unexplained blank card.
- While an administration module is still in the design phase, use local fixture data only when every affected value is visibly marked as `Testdatensatz` and the module is labelled `Noch nicht implementiert`. Do not connect new backend endpoints until that module is taken into implementation.
- A request that is still loading, a service that is not connected yet, or a source that has not returned data must show the shared animated dashboard pending state in the affected card.
- A successful request with an empty result must show an explicit empty state. A failed request must be identified as unavailable and offer a retry where the surrounding page supports it; do not leave a permanent spinner for a confirmed error.
- Reuse the shared components from `src/components/admin/AdminUi.jsx` for metric, pending and empty states so newly added pages remain visually and behaviorally consistent.
- Dashboard controls and cards must remain usable on narrow screens; the sidebar may become a horizontal navigation strip on mobile.
