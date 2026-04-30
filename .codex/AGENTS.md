# Project Contract

## Wagmi Usage

- Use `useConnection` instead of `useAccount`

## Component Design

- Use **kebab-case** for all main files and folders (except `*.md,` `*.env` files).
- Export **named function** in a React components which in the `components/` directory.
- Run `pnpm run shadcn` to add shadcn components (Do not use global shadcn).

## Code Restrictions

- Do not use `xx as xxIcon` to import icons, import directly from icon packages.
- Do not use `* as React` to import React related packages.
- `hooks`, `configs`, `contexts`, `utils`, `enums`, `constants` should re-export in the `index.ts` file.
