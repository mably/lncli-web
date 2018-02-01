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

cd /lncli-web
echo "launching server with $opts"
node server $opts
