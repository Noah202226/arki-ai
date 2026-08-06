---
name: implementation-plan-first
description: Enforces creating a precise, clear, and straight-to-the-point implementation plan artifact before executing any changes or feature implementations. Ensures full clarity on what changes, how it changes, and the exact effects on the app.
---

# Implementation Plan First Skill

Use this skill whenever implementing any code changes, bug fixes, refactoring, or new features in the repository.

## Workflow Rules & Guidelines

1. **Mandatory Planning Phase**:
   - Before editing any code or creating files, **ALWAYS** generate or update an `implementation_plan.md` artifact.
   - Do NOT begin making code changes until the implementation plan artifact has been presented and approved.

2. **Structure of Implementation Plan Artifact**:
   The plan must be precise, concise, and structured as follows:

   - **Goal & Core Objective**: High-level summary of what the change accomplishes.
   - **What Changes & How (Exact Target Files)**:
     - Group changes by component or file.
     - Specify exact function signatures, state hooks, or schema modifications being added/changed.
   - **Effects & Impact on the App**:
     - *UI/UX Impact*: How the interface, layout, or mobile responsiveness will look and behave.
     - *Data/Backend Impact*: Database schema updates, Convex query/mutation behavior, or data persistence.
     - *Potential Side-Effects / Edge Cases*: Any breaking changes, dependencies, or performance considerations.
   - **Verification & Testing Plan**: Exact steps (automated builds, manual browser checks) to verify the implementation.

3. **Execution Phase**:
   - Once approved, follow the implementation plan strictly step-by-step.
   - Update `walkthrough.md` with visual verification and results upon completion.
