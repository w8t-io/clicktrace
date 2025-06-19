FROM golang:1.23.3-alpine3.20 AS gobuild

ENV GOPROXY=https://goproxy.cn,direct

WORKDIR /app

COPY . /app

RUN CGO_ENABLED=0 go build -o clicktrace ./cmd \
    && chmod +x clicktrace

# ---
FROM node:18.20.3-alpine3.20 AS builder

WORKDIR /app

COPY web/package.json ./
RUN yarn install --frozen-lockfile

COPY web ./

RUN yarn run build

# ---
FROM node:18.20.3-alpine3.20 AS runner

WORKDIR /app

COPY --from=builder /app/package.json  ./

RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=gobuild  /app/clicktrace /app/clicktrace
COPY ./start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

# 启动命令
CMD /app/start.sh