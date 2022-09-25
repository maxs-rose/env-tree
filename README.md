# Env Tree

A simple system to store, manage, and share `.env` like files across environments or development teams.

[Website](https://www.envtree.net)

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

## Selfhost

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/Oc6pzF?referralCode=cjaUwf)

Details for hosting on your own infrastructure can be found [here](https://www.envtree.net/docs/misc/selfhost)

## Tech
- Next.js
- TRPC
- Prisma
- Turbo Repo