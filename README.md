This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Checks

Nothing in a lesson is written from memory. Four gates hold that up, and the
first two run in CI on every push (`.github/workflows/verify.yml`):

| Command | What it proves | Needs |
| --- | --- | --- |
| `npm run verify` | Types, lint, and every visualisation's frames — a few seconds | node |
| `npm run build` | Every page renders | node |
| `npm run verify:code` | Every example *and every translation* compiles and prints what the lesson says it prints | JDK 25, Python 3.13, Go 1.24, g++, rustc, nasm |
| `npm run verify:visuals` | The player actually advances, at each of the four speeds | a running server and Chromium |

The toolchain versions matter. A recorded output is only reproducible on the toolchain it was recorded on — `Double.toString` switched to the shortest round-tripping decimal in JDK 19, so an older JDK disagrees with every lesson that prints a large double. CI pins them for this reason.

`npm run verify:code` takes an optional track and module — `npm run verify:code -- dsa arrays-and-strings` — which is how to use it while writing.
`npm run verify:visuals` needs the site already up (`npm run dev`, or `npm run build && npm start`); it measures real elapsed time, so it takes a few minutes by design.

To run the fast gates before every commit:

```bash
git config core.hooksPath .githooks
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
