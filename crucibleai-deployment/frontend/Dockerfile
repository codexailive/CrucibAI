FROM node:20-alpine AS build
WORKDIR /app

COPY crucibleai-deployment/frontend/package*.json ./
RUN npm ci

COPY crucibleai-deployment/frontend/ ./
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/build/ /usr/share/nginx/html/

RUN sed -i 's|try_files \$uri \$uri/ =404;|try_files \$uri \$uri/ /index.html;|' /etc/nginx/conf.d/default.conf

EXPOSE 80