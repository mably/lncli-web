FROM node:latest

EXPOSE 8280

COPY . /lncli-web

WORKDIR /lncli-web

RUN npm install \
&&  ./node_modules/.bin/gulp bundles

CMD ["/lncli-web/init.sh"]
