#!/bin/bash
files=("admin.macaroon" "tls.cert")
overrides=("SET_SERVERPORT" "SET_SERVERHOST" "SET_LNDHOST" "SET_USETLS" "SET_USER" "SET_PWD"  \
           "SET_LIMITUSER" "SET_LIMITPWD" "SET_LOGFILE" "SET_LOGLEVEL" "SET_LNDLOGFILE" "SET_LE_EMAIL")
defaultopts=""
config="/lncli-web/config/defaults.js"

cd /lncli-web

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

if [[ $lndcert = 1 ]]; then
  echo "Existing cert was attached, skipping generation"
else
  # assumes config wasn't updated, so by default looks in /lncli-web/
  # if this ever changes, -out [cert] has to change too
  echo "Generating a new certificate"
  # if /config is attached, generate it there so it won't get regenerated in the future
  if [ -d "/config" ]; then
    echo "/config attached, generating cert and pointing config there"
    sed -i 's/lndCertPath: \(.*\)/lndCertPath: "\/config\/tls.cert",/g' $config
    cd /config
  fi
  openssl ecparam -genkey -name prime256v1 -out tls.key
  openssl req -new -sha256 -key tls.key -out csr.csr -subj '/CN=*/O=lnd/'
  openssl req -x509 -sha256 -days 36500 -key tls.key -in csr.csr -out tls.cert
  rm csr.csr
fi

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


## disabled for now
#if [[ $macaroon -ne 1 ]]; then
#  if [[ -z $SET_USER ]]; then
    # require at least some auth I mean come on
#    echo "MACAROON NOT ATTACHED AND BASIC AUTH NOT SPECIFIED, exiting..."
#    exit 1
#  fi
#fi

cd /lncli-web
echo "launching server with $opts"
node server $opts
