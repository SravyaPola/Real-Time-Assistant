FROM node:20-alpine
WORKDIR /app

# Install deps first (better caching)
COPY package.json ./
RUN npm i --silent

# Copy the rest
COPY . .

# Start the dev server (Fastify)
CMD ["npm", "run", "dev"]
