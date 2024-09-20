FROM node:18 as builder

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

#############################

FROM node:18 as runtime

WORKDIR /app

RUN mkdir .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

CMD ["node", "server.js"]
