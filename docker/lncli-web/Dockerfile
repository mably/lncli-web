FROM node:latest

EXPOSE 8280

# Instead of copying:
# COPY . /lncli-web
# We'll clone it from github:
RUN git clone https://github.com/mably/lncli-web.git /lncli-web && \
cd /lncli-web && echo "no tags unfortunately"

WORKDIR /lncli-web

RUN npm install \
&&  ./node_modules/.bin/gulp bundle

COPY "docker/lncli-web/init.sh" /lncli-web/init.sh
RUN chmod +x /lncli-web/init.sh

CMD ["/lncli-web/init.sh"]