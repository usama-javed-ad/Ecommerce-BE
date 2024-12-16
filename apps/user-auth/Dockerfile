FROM node:22.11.0-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm install

COPY . .

WORKDIR /app/apps/user-auth

RUN npm run build user-auth

EXPOSE 3000

CMD ["npm", "run", "start:dev", "user-auth"]