# Lnd Web Client

## Installation


### Requirements

* [Git](https://git-scm.com/)
* [NodeJS / npm](https://nodejs.org)

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
"./node_modules/.bin/bower" install --allow-root
```

## Execution

Start the back-end server:

```
node server
```

Available command-line arguments:

```
node server --help

  Usage: server [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -s, --serverport [port]    web server listening port (defaults to 8280)
    -l, --lndhost [host:port]  RPC lnd host (defaults to localhost:10009)
    -u, --user [login]         basic authentication login
    -p, --pwd [password]       basic authentication password
    -r, --limituser [login]    basic authentication login for readonly account
    -w, --limitpwd [password]  basic authentication password for readonly account

```

Open your browser at the following address: [http://localhost:8280](http://localhost:8280)

Enjoy!

## Screenshots

Check here for the mandatory screenshots: [http://imgur.com/a/LgWcs](http://imgur.com/a/LgWcs)

## Enabling https for remote access

You need to replace the following line of code in the `<lncli-web>/server.js` file:

```
var server = require('http').Server(app);  
```

By this:

```
var server = require('https').createServer({
  key: require('fs').readFileSync('key.pem'),
  cert: require('fs').readFileSync('cert.pem')
}, app);
```

On Linux you can simply create the above required files `key.pem` and `cert.pem` by generating a self-signed certificate using the following command:

```
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
```

You might need to run this command to remove the password protection:

```
openssl rsa -in key.pem -out newkey.pem && mv newkey.pem key.pem
```

Example command starting a password protected Lnd Web Client with readonly account enabled and running on port 443:

```
node server -s 443 --user manager --pwd 33H966wG --limituser lnd --limitpwd rocks
```

Hoping that helps.