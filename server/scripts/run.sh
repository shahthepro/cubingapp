#!/bin/bash

errMsg="Please specify prod or dev for the build type. For example: sudo ./run.sh prod"

if [ -z "$1" ]; then
    echo $errMsg
    exit 1
elif [ $1 = "prod" ]; then
    source ../.env
elif [ $1 = "dev" ]; then
    source ../.env-dev
else
    echo $errMsg
    exit 1
fi

export PATH=$PATH:/usr/local/go/bin

echo "Printing logs to $LOG_FILE"

# Start the server, and keep it running even if the terminal is closed
nohup go run ../ > $LOG_FILE &