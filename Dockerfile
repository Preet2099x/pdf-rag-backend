# Use Node.js LTS image
FROM node:18-alpine

# Create app directory and set user for security
WORKDIR /usr/src/app
RUN chown -R node:node .
USER node

# Copy package files first to leverage Docker cache
COPY --chown=node:node package*.json ./

# Install production dependencies with exact versions
RUN npm ci --only=production --legacy-peer-deps

# Copy application files
COPY --chown=node:node . .

# Environment variables
ENV PORT=8000 \
    NODE_ENV=production

# Expose the port your app listens on
EXPOSE 8000

# Command to run your app (modify based on your needs)
CMD ["node", "index.js"]
