#!/bin/bash

if [[ ( "$1" == ""  ||  ( "$1" != "release" && "$1" != "test" && "$1" != "clean" )) ]];
then
    echo "Target config missing. Call \"deploy release\" or \"deploy test\"."
    exit
fi

if [ "$1" == "clean" ];
then
    rm .clasp.json
    rm appsscript.json
    rm tests.js
    exit
fi

if [ "$1" == "release" ];
then
    cp .clasp.json.release .clasp.json
    cp appsscript.json.release appsscript.json
fi

if [ "$1" == "test" ];
then
    cp .clasp.json.test .clasp.json
    cp appsscript.json.test appsscript.json
    cp tests.js.DO_NOT_DEPLOY cp tests.js
fi

echo "Publishing to Google..."
clasp push