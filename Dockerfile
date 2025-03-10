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

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache git
RUN apk add --no-cache file

# Set environment variables
ENV NODE_ENV=production

# Copy built application from build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.env .env

# Expose the port the app runs on
EXPOSE 13541

# Command to run the application
CMD ["npm", "run", "start:prod"]