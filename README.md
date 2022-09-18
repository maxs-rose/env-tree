# Cloud Secret storage

A simple system to store, manage, and share `.env` like files across environments or development teams.

## Features

- Projects to group configurations together
- Projects can be shared with other users allowing easy onboarding of new team members
- Configurations can be linked to each other with changes to base configuration being automatically propagated to children
- CLI tool to allow easy downloading of configuration files in both general purpose and headless environments
- Selfhostable with provided docker image

## Example use cases

- Running docker images with .env configuration files
- If developers work between multiple machines .env settings can be easily stored and transfered between machines
- CI environments to pull in settings for each run
- On-boarding new team members 

> Note: When downloading files in .env format values are formatted **as written** in the UI

## Tech
- Next.js
- TRPC
- Prisma
- Turbo Repo