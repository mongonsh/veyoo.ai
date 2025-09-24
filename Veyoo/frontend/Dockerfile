# build environment
FROM node:16-alpine as build
WORKDIR /app
COPY package.json .
COPY package-lock.json .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm ci
COPY . .
RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
ENV PORT=8080
# Provide nginx template that listens on $PORT (Cloud Run)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]