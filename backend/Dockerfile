# Use official Node.js 20 LTS image as the base
FROM node:20-alpine

# Alpine = tiny Linux (only 5MB) — keeps our container small and secure

# Create and set working directory inside the container
WORKDIR /app

# Copy package files first (before code) so Docker can cache
# the npm install step — only re-runs if dependencies actually changed
COPY package*.json ./

# Install only production dependencies (skip devDependencies like nodemon)
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Tell Docker this container listens on port 5000
EXPOSE 5000

# Command that runs when the container starts
CMD ["node", "server.js"]
