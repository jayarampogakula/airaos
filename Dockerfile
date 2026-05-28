# Build the application and run server
FROM node:22-alpine
WORKDIR /app

# Install git for dynamic version calculation
RUN apk add --no-cache git

# Copy dependency files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the React application (generates /app/dist)
RUN npm run build

# Run database seeder to initialize the database
RUN node server/seed.js

# Expose port 3001 for Express server
EXPOSE 3001

# Health check configuration for Docker/Coolify container orchestrators
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the Express production server
CMD ["node", "server/index.js"]
