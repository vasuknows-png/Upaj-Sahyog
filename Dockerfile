FROM node:22-alpine
WORKDIR /app
COPY . .
ENV PORT=3000 DB_PATH=/app/data/upaj-sahyog.db NODE_ENV=production
RUN mkdir -p /app/data
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node","--no-warnings","server.mjs"]
