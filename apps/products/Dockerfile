FROM node:22.11.0-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm install

COPY . .

WORKDIR /app/apps/products

RUN npm run build products

EXPOSE 3001

CMD ["npm", "run", "start:dev", "products"]