# ------------ build ------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# use install (not ci) so lock can update
RUN npm install
COPY . .
RUN npm run build
# normalize build output to /app/out (supports Vite "dist" or CRA "build")
RUN if [ -d dist ]; then mv dist out; elif [ -d build ]; then mv build out; else echo "No build output directory (dist or build) found" && exit 1; fi

# ------------ run ------------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/out/ /usr/share/nginx/html
