# Project Contract

## Wagmi/Viem Usage

- Use `useConnection` instead of `useAccount`
- Prefer to use wagmi hooks like `useWriteContract`, `useReadContract`, `useReadContracts`, etc. instead of using viem client directly.
- Use `Address` type from `viem` instead of `0x${string}`.

## Component Design

- Use **kebab-case** for all main files and folders (except `*.md,` `*.env` files).
- Export **named function** in a React components which in the `components/` directory.
- Run `pnpm run shadcn` to add shadcn components (Do not use global shadcn).
- If use shadcn components that hasn't been added, run `pnpm run shadcn add xxx` to add it, and do not code shadcn components.

## Code Restrictions

- Do not use `xx as xxIcon` to import icons, import directly from icon packages.
- Do not use `* as React` to import React related packages.
- `hooks`, `configs`, `contexts`, `utils`, `enums`, `constants` should re-export in the `index.ts` file.
- Usd zod to validate form data.
