# Copyright 2019 Google LLC
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     https://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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