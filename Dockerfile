# Upaj Sahyog - single container, no npm dependencies
FROM node:22-alpine
WORKDIR /app
COPY . .
# SQLite file lives on a mounted volume so data survives restarts
ENV DB_PATH=/app/data/upaj-sahyog.db PORT=3000 NODE_ENV=production
RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "--no-warnings", "server.mjs"]
