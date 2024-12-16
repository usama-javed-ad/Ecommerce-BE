FROM node:22.11.0-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm install

COPY . .

WORKDIR /app/apps/orders

RUN npm run build orders

EXPOSE 3001

CMD ["npm", "run", "start:dev", "orders"]