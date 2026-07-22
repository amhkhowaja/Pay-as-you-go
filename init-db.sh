#!/bin/bash
set -e
for db in userdb billingdb paymentdb; do
  psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
    CREATE DATABASE $db;
EOSQL
done
