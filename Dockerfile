FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npx prisma generate
RUN npm run build

# Remove development dependencies
RUN npm prune --production

FROM node:22-alpine AS runner

RUN apk add --no-cache git
RUN apk add --no-cache file

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create data directory for Git repositories
RUN mkdir -p data/wordlists

# Install Prisma client
RUN npx prisma db push

# Expose the port the app runs on
EXPOSE 13541

# Command to run the application
CMD ["node", "dist/main"]
