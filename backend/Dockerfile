# backend/Dockerfile
FROM node:18.17.1-alpine3.18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/index.js"]
