# Dockerfile para o frontend Next.js
FROM node:20-alpine as build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build

FROM node:20-alpine as runner
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
