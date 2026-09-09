# Homepage UI Guidelines

## Web dashboard

-   Build every new team or administration page inside the shared `AdminLayout`; do not introduce a second dashboard shell.
-   Keep navigation grouped in the administration mega menu within the shared navbar. New modules belong in the most appropriate existing group before another group is added.
-   Use compact cards, consistent spacing and the existing dark SeriuxMod surfaces. Orange remains the primary brand accent; semantic green, yellow and red are reserved for service state and feedback.
-   Never invent values, silently replace unavailable values with `0`, or leave an unexplained blank card.
-   While an administration module is still in the design phase, use local fixture data only when every affected value is visibly marked as `Testdatensatz` and the module is labelled `Noch nicht implementiert`. Do not connect new backend endpoints until that module is taken into implementation.
-   A request that is still loading, a service that is not connected yet, or a source that has not returned data must show the shared animated dashboard pending state in the affected card.
-   A successful request with an empty result must show an explicit empty state. A failed request must be identified as unavailable and offer a retry where the surrounding page supports it; do not leave a permanent spinner for a confirmed error.
-   Reuse the shared components from `src/components/admin/AdminUi.jsx` for metric, pending and empty states so newly added pages remain visually and behaviorally consistent.
-   Dashboard controls, cards and the administration menu must remain usable on narrow screens.

## Dashboard data and interaction libraries

-   Use TanStack Charts v0 for administration charts and data visualizations; lazy-load chart-heavy modules where practical.
-   Use TanStack Table for data-heavy administration views such as players, bans, orders and translations. Keep markup and styling inside the SeriuxMod design system because the table engine is headless.
-   Use TanStack Form for multi-field administration forms, field-level validation and asynchronous validation. Reuse shared SeriuxMod field components instead of creating a new visual form system per page.
-   Use TanStack Virtual only when the actual or expected dataset is large enough that rendering every row or card would be wasteful. Do not virtualize short lists.
-   Use TanStack Hotkeys for scoped dashboard commands and discoverable shortcuts. Do not trigger destructive actions through a single unconfirmed shortcut.
-   Use TanStack Pacer for debounced searches, throttled high-frequency input and explicit rate limiting, queues or batching. Do not add ad-hoc timeout-based request control where Pacer is already in use.
-   Add each library to the production dependencies only when the first page actually uses it; do not increase the application bundle for a written future plan alone.
