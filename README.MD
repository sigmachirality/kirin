# Kirin 🦒
Kirin is a framework agnostic [Github Action](https://github.com/features/actions) which provides a [Github Pages](https://pages.github.com/) staging environment for static sites. When Kirin is targeted to a pages site at `<OWNER>.pages.github.com/<REPO>` hosting the repo `<OWNER>/<REPO>`, a branch with `<BRANCH_NAME>` trigger a build which deploys its contents to `<OWNER>.pages.github.com/<REPO>/<BRANCH_NAME>`.

As opposed to [Vercel](www.vercel.com), [Netlify](www.netlify.com), and [Heroku](www.heroku.com), Kirin is more lightweight, transparently configurable, and most importantly, completely and utterly free.

## Limitations
Because of how routers are implemented in packages like [react-router](https://reactrouter.com/docs/en/v6/routers/browser-router) and frameworks like [NextJS](https://nextjs.org/docs/api-reference/next.config.js/basepath) and [Gatsby](https://www.gatsbyjs.com/docs/how-to/previews-deploys-hosting/path-prefix/), you will have to use the provided `getKirinBasePath` helper to set the base path at build time.

## Why "Kirin"?
It's an oblique reference to the [Giraffe from Revue Starlight](https://revuestarlight.fandom.com/wiki/Giraffe).

## Getting Started
WIP

## Maintainers
This library is maintained with ❤️ by me, [sigmachirality](https://github.com/sigmachirality).
