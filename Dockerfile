# Build the application and run server
FROM node:22-alpine
WORKDIR /app

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

# Start the Express production server
CMD ["node", "server/index.js"]
