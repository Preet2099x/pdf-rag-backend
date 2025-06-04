# Use Node.js LTS image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists) first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy rest of the backend source code
COPY . .

# Expose the port your app listens on
EXPOSE 8000

# Use environment variable for port if possible (optional)
ENV PORT=8000

# Command to run your app
CMD ["node", "index.js"]
