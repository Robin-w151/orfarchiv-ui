# ORF Archiv UI

[![Website](https://img.shields.io/website?url=https%3A%2F%2Forfarchiv.news&up_message=online&up_color=brightgreen&down_message=offline&down_color=red&style=for-the-badge)](https://orfarchiv.news)
[![GitHub deployments](https://img.shields.io/github/deployments/Robin-w151/orfarchiv-ui/production?style=for-the-badge&logo=vercel&label=deployment)](https://vercel.com)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/Robin-w151/orfarchiv-ui/test.yaml?branch=main&event=deployment_status&style=for-the-badge&label=Tests)
[![Website](<https://img.shields.io/website?url=https%3A%2F%2Frobin-w151.github.io%2Forfarchiv-ui%2F&up_message=online&up_color=rgb(255%2C%2071%2C%20133)&down_message=offline&down_color=red&style=for-the-badge&label=Storybook>)](https://robin-w151.github.io/orfarchiv-ui/)
![GitHub package.json version](https://img.shields.io/github/package-json/v/Robin-w151/orfarchiv-ui?style=for-the-badge)
[![GitHub License](https://img.shields.io/github/license/Robin-w151/orfarchiv?style=for-the-badge&color=blue)](https://github.com/Robin-w151/orfarchiv-ui/blob/main/LICENSE)

ORF Archiv UI is a web application powered by [SvelteKit](https://kit.svelte.dev/docs/introduction).
It serves links to ORF news stories from multiple sources, which are persisted in a _MongoDB_ document store.
This app includes both frontend and backend ([Endpoints](https://kit.svelte.dev/docs/routing#endpoints)) code,
so no separate backend application is required.

## Local Development

### Prerequisites

1. Start and configure a local _MongoDB_ document store (more [info](../db/README.md))
2. Install _NodeJS_ and _npm_

### Run DEV server

1. _Optionally_: create _.env.local_ (copy from _.env_ file) and configure **ORFARCHIV_DB_URL** environment variable if
   your _MongoDB_ is not running on **mongodb://localhost:27017**
2. `npm install`
3. `npm run dev`
4. Visit http://localhost:3001

### Run Storybook

1. `npm install`
2. `npm run storybook`
3. Visit http://localhost:6006
