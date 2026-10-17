# Project instructions

These instructions apply to BacaroGame and all its subdirectories.

## Project context

- This project is a game center built with SvelteKit, Svelte 5, TypeScript, and Vite, deployed on Vercel.
- Use Node.js 22.17 or later within the Node.js 22 major version.
- Firebase Authentication and Firestore support Bacarodex. Other games can run without Firebase.
- Read `README.md` and the relevant implementation documentation before changing a game or its backend.

## Programming style

- Prioritize readability and maintainability over brevity or cleverness.
- Prefer explicit `if` statements and early returns to nested ternary expressions.
- Keep one logical operation per statement. Do not compress multiple statements onto one line.
- Use descriptive names for variables, functions, and types. Avoid abbreviations that require interpretation.
- Introduce named intermediate variables when they make conditions or transformations easier to understand.
- Format long function signatures, object literals, and call arguments across multiple lines.
- Avoid complex callbacks in default parameter values. Give substantial behavior a clear name and an appropriate location.
- Separate validation, transformation, and side effects into clearly readable steps.
- Keep functions focused. Extract helpers when they clarify a responsibility, rather than merely moving complexity elsewhere.
- Use named TypeScript types for complex or repeated signatures. Avoid unnecessary abstractions and broad types when a specific type expresses the contract.
- Do not introduce abstractions, dependencies, or dependency injection solely to make trivial code easier to test.
- Write readable Svelte markup with clear indentation and separate lines for meaningful elements and control blocks.
- Use Svelte 5 conventions for new code. Keep server-only logic and credentials out of client components.
- Explain intent or non-obvious constraints in comments; avoid comments that simply repeat the code.
- Follow existing naming and domain conventions, but do not copy dense or compressed formatting from older code.
- Keep changes focused on the requested task and preserve unrelated work.
- Before finishing, reread the diff and simplify code that requires unnecessary effort to understand.

## Errors and diagnostics

- Keep client-facing error messages understandable and preserve the existing Italian UI language.
- Provide useful server diagnostics for unexpected failures, with a reference that can connect the response to its log entry.
- Never log request bodies, face descriptors, photos, cookies, tokens, credentials, or Firebase error payloads.
- Keep private environment variables and Firebase Admin access on the server.

## Validation

- Run `npm run check` after TypeScript or Svelte changes.
- Run the relevant test scripts from `package.json` for changed behavior, and report any failures or checks that could not be run.
- Add tests for meaningful behavior and regressions. Avoid tests that merely mirror the implementation or assert source formatting.
- For production build changes, run `npm run build` when the required environment and dependencies are available.
- Use the approved Firestore collection gateway and run `npm run check:collections` for database access changes. See `COLLEZIONI_FIREBASE.md`.
- Documentation-only changes do not require application tests; review the resulting text and diff.
