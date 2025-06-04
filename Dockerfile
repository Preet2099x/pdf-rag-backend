# Use Node.js LTS image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the backend source code
COPY . .

# Expose the port your app listens on
EXPOSE 8000

# Command to run your app
CMD ["node", "index.js"]
