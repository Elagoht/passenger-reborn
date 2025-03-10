# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client types
RUN npx prisma generate
RUN npx prisma db push
RUN npx prisma db seed

# Build the application
RUN npm run build

# Install only production dependencies
RUN npm install --only=production

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install necessary runtime dependencies
RUN apk add --no-cache git file

# Set environment variables
ENV NODE_ENV=production

# Copy only necessary files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.env .env
COPY --from=build /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 13541

# Run the application with Node.js directly
CMD ["node", "dist/src/main.js"]
