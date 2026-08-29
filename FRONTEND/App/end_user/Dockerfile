# Stage 1: Build Flutter Web App
FROM ghcr.io/cirrusci/flutter:stable AS build

WORKDIR /app

# Enable web support
RUN flutter config --enable-web

# Copy dependency spec and fetch packages
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copy full application code and build web bundle
COPY . .
RUN flutter build web --release

# Stage 2: Serve Flutter Web with Nginx
FROM nginx:alpine

COPY --from=build /app/build/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
