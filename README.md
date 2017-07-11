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

Fetch the dependencies and build the application by running:

```
npm install
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

    -h, --help                    output usage information
    -V, --version                 output the version number
    -s, --serverport [port]       web server listening port (defaults to 8280)
    -h, --serverhost [host]       web server listening host (defaults to localhost)
    -l, --lndhost [host:port]     RPC lnd host (defaults to localhost:10009)
    -t, --usetls [path]           path to a directory containing key.pem and cert.pem files
    -u, --user [login]            basic authentication login
    -p, --pwd [password]          basic authentication password
    -r, --limituser [login]       basic authentication login for readonly account
    -w, --limitpwd [password]     basic authentication password for readonly account
    -f, --logfile [file path]     path to file where to store the application logs
    -e, --loglevel [level]        level of logs to display (debug, info, warn, error)
    -n, --lndlogfile <file path>  path to lnd log file to send to browser
    -k, --le-email [email]        lets encrypt required contact email

```

Open your browser at the following address: [http://localhost:8280](http://localhost:8280)

Enjoy!

## Screenshots

Check here for the mandatory screenshots: [http://imgur.com/a/LgWcs](http://imgur.com/a/LgWcs)

## Enabling https for remote access

You need to have a `key.pem` (private key) file and a `cert.pem` (certificate) file available in your path (check the --usetls command-line option).

On Linux you can create the above files using a self-signed certificate by executing the following command:

```
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
```

You might need to run this extra command to remove the password protection:

```
openssl rsa -in key.pem -out newkey.pem && mv newkey.pem key.pem
```

And the you need to add the `--usetls` command-line option to point to the directory containing your two `pem` files.

Example command starting a password protected Lnd Web Client with readonly account enabled, running on port 443, and using https with corresponding `pem` files located in the app directory:

```
node server -s 443 --usetls . --user manager --pwd 33H966wG --limituser lnd --limitpwd rocks
```

Hoping that helps.