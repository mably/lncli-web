#!/usr/bin/env bash

# exit from script if error was raised.
set -e

# error function is used within a bash function in order to send the error
# message directly to the stderr output and exit.
error() {
    echo "$1" > /dev/stderr
    exit 0
}

# return is used within bash function in order to return the value.
return() {
    echo "$1"
}

# set_default function gives the ability to move the setting of default
# env variable from docker file to the script thereby giving the ability to the
# user override it durin container start.
set_default() {
    # docker initialized env variables with blank string and we can't just
    # use -z flag as usually.
    BLANK_STRING='""'

    VARIABLE="$1"
    DEFAULT="$2"

    if [[ -z "$VARIABLE" || "$VARIABLE" == "$BLANK_STRING" ]]; then

        if [ -z "$DEFAULT" ]; then
            error "You should specify default variable"
        else
            VARIABLE="$DEFAULT"
        fi
    fi

   return "$VARIABLE"
}

# Set default variables if needed.
RPCUSER=$(set_default "$RPCUSER" "devuser")
RPCPASS=$(set_default "$RPCPASS" "devpass")
DEBUG=$(set_default "$DEBUG" "debug")
NETWORK=$(set_default "$NETWORK" "simnet")
CHAIN=$(set_default "$CHAIN" "bitcoin")
BACKEND="btcd"
if [[ "$CHAIN" == "litecoin" ]]; then
    BACKEND="ltcd"
fi



if [[ ! -z ${LND_OWNER} ]]; then
    if [ ! -f /root/.lnd/admin.macaroon ]; then
        echo "we'll now call the lnd just to create the macaroon files"
        lnd --bitcoin.active --bitcoin.simnet --btcd.rpcuser=blub --btcd.rpcpass=bla --noencryptwallet > /dev/null || echo "failure expected"
        echo "copying admin.macaroon to /rpc/${LND_OWNER}-admin.macaroon"
        cp /root/.lnd/admin.macaroon /rpc/${LND_OWNER}-admin.macaroon
    fi
    if [ -f /rpc/${LND_OWNER}-tls.cert ]; then
        echo "copying /rpc/${LND_OWNER}-tls.cert/key to  /root/.lnd/lnd.cert/key"
        cp /rpc/${LND_OWNER}-tls.cert /root/.lnd/tls.cert
        cp /rpc/${LND_OWNER}-tls.key /root/.lnd/tls.key
    fi
fi

exec lnd \
    --noencryptwallet \
    --logdir="/data" \
    "--$CHAIN.active" \
    "--$CHAIN.$NETWORK" \
    "--$CHAIN.node"="btcd" \
    "--$BACKEND.rpccert"="/rpc/rpc.cert" \
    "--$BACKEND.rpchost"="blockchain" \
    "--$BACKEND.rpcuser"="$RPCUSER" \
    "--$BACKEND.rpcpass"="$RPCPASS" \
    --debuglevel="$DEBUG" \
    --rpclisten=0.0.0.0:10009 \
    "$@"
