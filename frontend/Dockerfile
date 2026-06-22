# ---- Stage 1: Build ----
# Use Node to build the React production bundle
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .

# Build arguments let us pass the API URL at build time
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ---- Stage 2: Serve ----
# Use Nginx to serve only the built static files
# (the Node.js layer from Stage 1 is discarded — final image is tiny)
FROM nginx:alpine

# Copy the React build output into Nginx's default serve directory
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our custom Nginx config (routing /api calls to the backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
