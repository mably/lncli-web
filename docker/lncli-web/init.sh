#!/bin/bash
files=("admin.macaroon" "tls.cert")
overrides=("SET_SERVERPORT" "SET_SERVERHOST" "SET_LNDHOST" "SET_USETLS" "SET_USER" "SET_PWD"  \
           "SET_LIMITUSER" "SET_LIMITPWD" "SET_LOGFILE" "SET_LOGLEVEL" "SET_LNDLOGFILE" "SET_LE_EMAIL")
defaultopts=""
config="/lncli-web/config/defaults.js"

# if /config has any files in the array above, point config.js there.
for file in ${files[@]}; do
  if [[ -f "/config/$file" ]]; then
    if [[ "$file" = "admin.macaroon" ]]; then
      echo "Admin macaroon attached, pointing config there"
      sed -i 's/macaroonPath: \(.*\)/macaroonPath: "\/config\/admin.macaroon",/g' $config
      macaroon=1
    fi

    if [[ "$file" = "tls.cert" ]]; then
      echo "tls.cert attached, pointing config there"
      sed -i 's/lndCertPath: \(.*\)/lndCertPath: "\/config\/tls.cert",/g' $config
      lndcert=1
    fi
  fi
done

opts=$defaultopts
for override in ${overrides[@]}; do
  # if this override is set, add it to the options to be passed
  if [[ ! -z ${!override} ]]; then
    if [[ "$override" != "SET_LE_EMAIL" ]]; then
      # remove "SET_"
      opt=${override#SET_}
      ## ${variable,,} makes the variable lowercase
      opts+=" --${opt,,} ${!override}"
    else
      # since le-email has a dash, manually specify it
      opts+=" --le-email ${!override}"
    fi
  fi
done

# -------------------
# create certs
if [ ! -d /rpc ]; then
    mkdir /rpc
fi
cd /rpc
if [[ ! -z ${LND_OWNER} ]]; then
    # copy admin-macaroon
    if [ -f /rpc/${LND_OWNER}-admin.macaroon ]; then
        echo "Found LND_OWNER=$LND_OWNER ... copying admin.macaroon ..."
        cp /rpc/${LND_OWNER}-admin.macaroon /lncli-web/admin.macaroon
        echo "done"
    fi
    if [ ! -f /rpc/${LND_OWNER}-tls.key ]; then
        echo "Found LND_OWNER=$LND_OWNER ... creating certificate ..."
        echo "Found LND_OWNER=$LND_OWNER ... creating certificate ..."
        openssl ecparam -genkey -name prime256v1 -out ${LND_OWNER}-tls.key
        openssl req -new -sha256 \
            -key ${LND_OWNER}-tls.key \
            -subj "/CN=localhost/O=lnd" \
            -reqexts SAN \
            -config <(cat /etc/ssl/openssl.cnf \
                <(printf "\n[SAN]\nsubjectAltName=DNS:localhost,DNS:${LND_OWNER}")) \
            -out csr.csr
        openssl req -in csr.csr -text -noout # contains the subjectAltName
        openssl req -x509 -sha256 -days 36500 \
            -key ${LND_OWNER}-tls.key \
            -in csr.csr -out ${LND_OWNER}-tls.cert \
            -extensions SAN \
            -config <(cat /etc/ssl/openssl.cnf \
                <(printf "\n[SAN]\nsubjectAltName=DNS:localhost,DNS:${LND_OWNER}"))
        openssl x509 -in ${LND_OWNER}-tls.cert -text -noout
        rm csr.csr
        echo "done"
    fi
    echo "Copying ${LND_OWNER}-tls.cert to /lncli-web/lnd.cert"
    cp ${LND_OWNER}-tls.cert /lncli-web/lnd.cert
    cp ${LND_OWNER}-tls.key /lncli-web/lnd.key
fi


cd /lncli-web
echo "launching server with $opts"
node server $opts