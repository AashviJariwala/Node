# ---- Base image ----
# Pin to a current Node LTS. Alpine keeps the image small; all deps here are pure-JS.
FROM node:22-alpine

# Cloud Run injects PORT (defaults to 8080). The app already reads process.env.PORT.
ENV NODE_ENV=production \
    PORT=8080

WORKDIR /usr/src/app

# Install dependencies first for better layer caching.
# Copy only manifests so this layer is reused unless dependencies change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the application source.
COPY . .

# Drop root privileges (the node image ships a non-root "node" user).
USER node

EXPOSE 8080

CMD ["node", "index.js"]
