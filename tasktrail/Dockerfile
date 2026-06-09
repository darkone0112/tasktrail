FROM node:22-bookworm-slim AS base

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*


FROM base AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM dependencies AS development

COPY . .
RUN npx prisma generate
COPY docker-entrypoint.sh /usr/local/bin/tasktrail-entrypoint
RUN chmod +x /usr/local/bin/tasktrail-entrypoint

EXPOSE 3000 8080

ENTRYPOINT ["tasktrail-entrypoint"]
CMD ["npm", "run", "dev"]


FROM dependencies AS build

COPY . .
RUN npx prisma generate \
	&& npm run css-build \
	&& npm run build


FROM base AS production

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app ./
COPY docker-entrypoint.sh /usr/local/bin/tasktrail-entrypoint

RUN npm prune --omit=dev \
	&& npm cache clean --force \
	&& chmod +x /usr/local/bin/tasktrail-entrypoint \
	&& chown -R node:node /app

USER node

EXPOSE 3000

ENTRYPOINT ["tasktrail-entrypoint"]
CMD ["node", "./bin/www"]
