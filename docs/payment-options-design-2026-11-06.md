# Payment option design

The owner approved the generated white payment-row mockup and requested Uzbek subtitles: Uzum — 3, 6 or 12 months; Alif — 3 months. Russian equivalents are included.

Implementation: one shared native button component with a compact left logo, divider, left-aligned title/subtitle, subtle border and 16px radius. Alif keeps its separate TEST badge and test notice. Card payment uses a blue card icon. Amount header wraps on narrow screens. Provider actions, loading locks, form requirements and server sandbox visibility are unchanged.

Use existing Uzum inline SVG, a text Alif wordmark and an inline card icon; the generated mockup is a visual reference, not a deployed image asset. Period subtitles describe the requested offering; actual available tariffs and customer approval remain controlled by the provider.

Validation: scoped ESLint and TypeScript passed; 25 existing Alif tests passed; production build passed. Independent UI review found no actionable regressions. Browser checks at 320px, 390px and 1280px found no horizontal overflow; Uzbek and Russian labels were verified. Screenshots were inspected. The visual preview used a browser-only local config fixture to display the Alif test button; no protected server route was accessed, no session was minted, and all payment calls/external requests were intercepted. Provider logic and the production admin gate remain intact.
