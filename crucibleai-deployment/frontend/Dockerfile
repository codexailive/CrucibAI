# ---------- build stage (Create React App) ----------
FROM node:20-alpine AS build
WORKDIR /app

# install deps (best cache)
COPY package*.json ./
RUN npm ci

# copy app and build (CRA outputs /app/build)
COPY . .
RUN npm run build

# ---------- serve stage (nginx) ----------
FROM nginx:1.25-alpine

# copy CRA build to nginx root
COPY --from=build /app/build/ /usr/share/nginx/html/

# SPA fallback so deep links don’t white-screen
RUN sed -i 's|try_files \$uri \$uri/ =404;|try_files \$uri \$uri/ /index.html;|' /etc/nginx/conf.d/default.conf

# ensure favicons are at web root (if build didn’t carry /public)
COPY public/favicon.ico /usr/share/nginx/html/
COPY public/favicon-16x16.png /usr/share/nginx/html/
COPY public/favicon-32x32.png /usr/share/nginx/html/
COPY public/apple-touch-icon.png /usr/share/nginx/html/
COPY public/android-chrome-192x192.png /usr/share/nginx/html/
COPY public/android-chrome-512x512.png /usr/share/nginx/html/
COPY public/site.webmanifest /usr/share/nginx/html/

EXPOSE 80
