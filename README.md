# Lnd Web Client

## Installation


### Requirements

* Git
* NodeJS / npm

### Procedure

Fetch sources from the Lnd Web Client git repository:

```
git clone https://github.com/mably/lncli-web.git
```
Move into the newly created directory:

```
cd lncli-web
```

Fetch and install all the backend server dependencies by running:

```
npm install
```

Fetch and install all the front end dependencies by running:

```
bower install --allow-root
```

## Execution

Start de back-end server:

```
node server
```

Available command-line arguments:

```
node server --help

  Usage: server [options]

  Options:

    -h, --help                  output usage information
    -V, --version               output the version number
    -s, --serverport [port]     web server listening port (defaults to 8280)
    -l, --lndhost  [host:port]  RPC lnd host (defaults to localhost:10009)

```

Open your browser at the following address: [http://localhost:8280](http://localhost:8280)

Enjoy!

## Screenshots

Check here to see the mandatory screenshots: [http://imgur.com/a/LgWcs](http://imgur.com/a/LgWcs)