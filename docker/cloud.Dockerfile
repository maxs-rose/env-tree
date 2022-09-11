FROM node:lts-buster-slim AS base

RUN apt-get update && apt-get install libssl-dev ca-certificates -y
WORKDIR /app

COPY .yarn .yarn
COPY package.json yarn.lock .yarnrc.yml ./

FROM base as build
RUN export NODE_ENV=production
COPY . .

RUN yarn
RUN yarn prisma generate
RUN yarn build --filter cloud

# Remove the .next/cache folder as its not needed in the final image
RUN rm -rf /app/apps/cloud/.next/cache

FROM base as prod-deps
RUN export NODE_ENV=production
COPY . .

RUN yarn plugin import workspace-tools
RUN yarn workspaces focus @envtree/cloud --production

FROM base as deploy

COPY --from=prod-deps /app/node_modules /app/node_modules
# Grab missing prisma stuff
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client /app/node_modules/@prisma/client
COPY --from=build /app/apps/cloud/prisma /app/apps/cloud/prisma

COPY --from=build /app/apps/cloud/.next /app/apps/cloud/.next
COPY --from=build /app/apps/cloud/public /app/apps/cloud/public

COPY apps/cloud/package.json /app/apps/cloud/package.json

EXPOSE 3000
CMD yarn prisma migrate deploy;yarn start