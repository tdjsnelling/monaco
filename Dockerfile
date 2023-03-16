FROM node:18
ARG NEXT_PUBLIC_WS_URL
WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY next.config.js next.config.js
COPY jsconfig.json jsconfig.json
COPY server.js server.js
COPY components components
COPY pages pages
COPY public public
RUN yarn install --production
RUN yarn build
EXPOSE 3000
EXPOSE 3001
CMD ["yarn", "start"]
