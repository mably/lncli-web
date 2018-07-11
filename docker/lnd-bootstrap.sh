#!/bin/bash


usage(){
	cat <<"END"
  The purpose of this file is to ease development of lightning integration
  and maybe also improve integration-testing
  It is based on simnet and the lnd-alice/bob-tutorial: 
    * Alice will have the money and will open a channel with bob
    * Alice will open a lncli-web at http://localhost:8280
    * Bob will expose port 10009 in order to be able to be connectable from your local dev-environment
  
  Usage: ./utils/lndbootstrap [options]
  options are:
    --purge         kill and remove all containers and volumes ALL OF THEM, EVEN ALL VOLUMES!!!!
    --up, -u        bootstrap the whole setup including btcd, funding alice and opeing a channel to bob
    --invoice, -i   creates another invoice on bob's side
    --full-circle   the channel also gets removed
    --help, -h      shows this help-file
END
	exit 1
}

set -e

export NETWORK="simnet"
ACTION="HELP"

while [[ $# -gt 0 ]]
do
key="$1"
case $key in
    -p|--purge)
    ACTION="PURGE"
    shift # past argument
    ;;
    -u|--up)
    ACTION="UP"
    shift # past argument
    ;;
    -i|--invoice)
    ACTION="INVOICE"
    shift # past argument
    ;;    
    -n|--pay-invoice)
    ACTION="PAY_INVOICE"
    shift # past argument
    ;;    
    -c|--full-circle)
    ACTION="FULL_CIRCLE"
    shift # past argument
    ;;
    -h|--help)
    ACTION="HELP"
    shift # past argument
    ;;
    *)    # unknown option
    POSITIONAL="$1" # save it in an array for later
    shift # past argument
    ;;
esac
done

if [ "$ACTION" == "HELP" ]; then
  usage
fi

create_invoice(){
  echo "    --> create an invoice on bob's side"
  PAY_REQ=$(docker exec -i -t bob lncli addinvoice --amt=10000 | jq -r ".pay_req")
  echo "    --> INVOICE=$PAY_REQ"
}

if [ "$ACTION" == "INVOICE" ]; then
  create_invoice
fi

pay_invoice(){
  echo "    --> grab the first pending invoice's paymen_request on bob's side"
  PAY_REQ=$(docker exec -it bob lncli listinvoices --pending_only | jq -r ".invoices[0].payment_request")
  echo "    --> INVOICE=$PAY_REQ"
  echo "    --> send payments on alice's side"
  docker exec -it alice lncli sendpayment --pay_req=$PAY_REQ
}

if [ "$ACTION" == "PAY_INVOICE" ]; then
  pay_invoice
fi

if [ "$ACTION" == "PURGE" ]; then
  echo "    --> purging all docker containers"
  docker kill alice bob btcd alice-web || echo "error but ignored"
  docker rm alice bob btcd alice-web || echo "error but ignored"
  docker rm $(docker ps -a -q) || echo "error but ignored"
  docker volume prune -f
  exit 0
fi

if [ "$ACTION" == "UP" -o "$ACTION" == "FULL_CIRCLE" ]; then
  echo "    --> Create \"btcd\" node with a random mining address:"
  MINING_ADDRESS=rsLfVHdS3nZCZAKif7wPFMcaQt7GK32eLw docker-compose up -d btcd
  echo "    --> Generate 400 blocks (we need at least 100 \>= blocks because of coinbase "
  echo "    --> block maturity and \"300 ~=\" in order to activate segwit):"
  docker-compose run btcctl generate 400

  echo "    --> Check that segwit is active:"
  docker-compose run btcctl getblockchaininfo | jq -r .bip9_softforks.segwit.status | grep active || exit 2
  sleep 3

  echo "    --> create Alice's container"
  docker-compose run -d -e LND_OWNER=alice --name alice lnd_btc
  sleep 6 # wait 4 seconds for the containers to come up

  echo "    --> create Alice's lncli_web-container"
  docker-compose run -d -p 8280:8280 -e SET_LNDHOST=alice:10009 -e LND_OWNER=alice --name alice-web lncli_web

  echo "    --> creating a nice address for alice"
  alice_address=$(docker exec -i -t alice lncli newaddress np2wkh | jq -r ".address")
  echo "    --> alice_address=$alice_address"


  echo "    --> Recreate "btcd" node and set Alice's address as mining address:"
  MINING_ADDRESS=$alice_address docker-compose up -d btcd

  echo "    --> Generate another 105 blocks (we need at least 100 >= blocks because of coinbase "
  docker-compose run btcctl generate 105
  sleep 5

  echo "    -> check for Alice's balance:"
  docker exec -i -t alice lncli walletbalance

  echo "    --> Create Bob's node"
  docker-compose run -d -p 10009:10009 --name bob lnd_btc
  sleep 6

  echo "    --> get Bob's node identity_pubkey"
  bob_identity_pubkey=$(docker exec -i -t bob lncli getinfo | jq -r ".identity_pubkey")
  echo "    --> bob_identity_pubkey=$bob_identity_pubkey"

  echo "    --> get Bob's node ip-address"
  bob_ip_address=$(docker inspect bob | jq -r ".[0].NetworkSettings.Networks.docker_default.IPAddress")
  echo "    --> bob_ip_address=$bob_ip_address"

  echo "    --> connect alice's node to bob's"
  docker exec -i -t alice lncli connect ${bob_identity_pubkey}@${bob_ip_address}
  sleep 1

  echo "    --> Check list of peers on Alice's side:"
  docker exec -i -t alice lncli listpeers | jq ".peers[0].pub_key"

  echo "    --> Check list of peers on Bob's side:"
  docker exec -i -t bob lncli listpeers | jq ".peers[0].pub_key"

  echo "    --> Open the channel with "Bob":"
  docker exec -i -t alice lncli openchannel --node_key=${bob_identity_pubkey} --local_amt=1000000

  echo "    --> Include funding transaction in block thereby opening the channel:"
  docker-compose run btcctl generate 3

  echo "    --> Check that channel with "Bob" was opened:"
  docker exec -i -t alice lncli listchannels

  echo "    --> Probably the channel is not listed, so workaround as described in https://github.com/lightningnetwork/lnd/issues/698"
  docker stop alice
  docker start alice

  sleep 5

  echo "    --> Check that channel with "Bob" was opened:"
  docker exec -it alice lncli listchannels

  create_invoice

  echo "    --> send payments on alice's side"
  docker exec -it alice lncli sendpayment --pay_req=$PAY_REQ

  echo "    --> check alice's channelbalance"
  docker exec -it alice lncli channelbalance

  echo "    --> check bob's channelbalance"
  docker exec -i -t bob lncli channelbalance

  # Channel point consists of two numbers separated by a colon. The first one 
  # is "funding_txid" and the second one is "output_index".
  echo "    --> get funding_txid and output_index"
  docker exec -i -t alice lncli listchannels | jq ".channels[0].channel_point"

  funding_txid=$(docker exec -i -t alice lncli listchannels | jq -r ".channels[0].channel_point" | cut -f1 -d:)
  output_index=$(docker exec -i -t alice lncli listchannels | jq -r ".channels[0].channel_point" | cut -f2 -d:)
fi

if [ "$ACTION" = "FULL_CIRCLE" ]; then
  echo "    --> Close the channel"
  docker exec -i -t alice lncli closechannel --funding_txid=$funding_txid --output_index=$output_index

  echo "    --> Include close transaction in a block thereby closing the channel:"
  docker-compose run btcctl generate 3
fi

echo "    --> Finally Alice's Balance"
docker exec -i -t alice lncli walletbalance | jq .

echo "    --> Finally Bob's Balance"
docker exec -i -t bob lncli walletbalance  | jq .

docker exec -i -t bob lncli walletbalance | jq -r ".total_balance" | grep 10000
