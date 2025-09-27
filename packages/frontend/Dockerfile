FROM node:20-alpine
WORKDIR /app

# Install deps first (better caching)
COPY package.json ./
RUN npm i --silent

# Copy the rest
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
