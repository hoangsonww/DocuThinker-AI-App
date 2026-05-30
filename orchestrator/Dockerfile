FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .
ENV NODE_ENV=production
ENV PORT=4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"
RUN addgroup -g 1001 -S appuser && adduser -S appuser -u 1001
USER appuser
EXPOSE 4000
CMD ["node", "index.js"]
