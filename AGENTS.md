<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Custom Rules & Conventions

## 1. Shadcn Dialog / Modal Responsive Sizing Rule
- **Default Breakpoint Override Gotcha**: Shadcn `DialogContent` primitive in `components/ui/dialog.tsx` includes default responsive classes like `sm:max-w-sm` or `sm:max-w-lg`.
- **Enforcing Wide / Responsive Modals**: In Tailwind CSS, base utility classes (e.g. `max-w-6xl` or `w-[90vw]`) will be silently overridden on desktop screens (`>= 640px`) by `sm:max-w-sm` unless explicitly overridden with responsive prefix variants.
- **Mandatory Pattern for Wide Dialogs**: Always supply responsive `sm:` / `lg:` / `xl:` overrides when defining wide or rich data dialogs:
  ```tsx
  <DialogContent className="w-[94vw] sm:max-w-[92vw] lg:max-w-6xl xl:max-w-7xl max-h-[90vh]">
  ```
- **Diagnostic Workflow**: Before diagnosing why a modal appears narrow on desktop screens, inspect `components/ui/dialog.tsx` to identify primitive default max-width classes.

## 2. Mandatory Implementation Plan Rule
- **Plan First**: Before making any code changes, bug fixes, or feature implementations, ALWAYS construct a precise, structured, and straight-to-the-point implementation plan artifact.
- **Clarity Requirement**: Clearly outline **what** changes, **how** it is implemented, and the exact **effects/impact** on the app's UI, data layer, and user flow before writing code.
