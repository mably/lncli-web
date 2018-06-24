This directory is for now meant as a showcase for easier development of custom applications and maybe integration-testing.

```
cd docker
docker-compose build
./lnd-bootstrap.sh --up
# check localhost:8280 (which is alice)
# connect your application to localhost:10009 (which is bob)
# e.g. create an invoice via grpc
# alternatively create your invoice like such:
./lnd-bootstrap.sh --invoice
# from alice pay bob that invoice:
./lnd-bootstrap.sh --pay-invoice
```

the current container build in lncli-web is checking out from github directly. For the purpose of developing this project, that probably should be changed.