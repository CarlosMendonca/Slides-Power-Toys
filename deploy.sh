#!/bin/bash

if [[ ( "$1" == ""  ||  ( "$1" != "release" && "$1" != "test" && "$1" != "clean" )) ]];
then
    echo "Target config missing. Call \"deploy release\" or \"deploy test\"."
    exit
fi

if [ "$1" == "clean" ];
then
    echo "Cleaning up..."
    rm .clasp.json
    rm appsscript.json
    rm tests.js
    echo "Done!"
    exit
fi

if [ "$1" == "release" ];
then
    echo "Preparing files..."
    cp .clasp.json.release .clasp.json
    cp appsscript.json.release appsscript.json
    test -f tests.js && rm tests.js
fi

if [ "$1" == "test" ];
then
    echo "Preparing files..."
    cp .clasp.json.test .clasp.json
    cp appsscript.json.test appsscript.json
    cp tests/tests.js tests.js
fi

echo "Publishing to Google..."
clasp push
echo "Done!"