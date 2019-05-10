FROM alpine/git:latest as clone
RUN git clone https://github.com/JorenVerbaandert/pool.git /pool

FROM node:alpine as build
COPY --from=clone /pool /pool
WORKDIR pool
RUN npm install && \
    npm run build

FROM node:alpine
COPY --from=build /pool/build /pool
COPY app.js /pool
WORKDIR pool
RUN npm install connect serve-static

CMD ["node","app.js"]
