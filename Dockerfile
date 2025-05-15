FROM node:22-alpine
# Create app directory
WORKDIR /usr/src/app

# non-root user
RUN addgroup -S pss && adduser -S pss -G pss

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# change ownership
RUN chown -R pss:pss /usr/src/app
USER pss

RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/src/main.js"]