#!/bin/bash
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

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

TARGET="${1:-}"

if [[ "$TARGET" != "release" && "$TARGET" != "test" && "$TARGET" != "clean" ]]; then
  echo "Usage: $0 <release|test|clean>" >&2
  exit 1
fi

if [[ "$TARGET" == "clean" ]]; then
  echo "Cleaning up..."
  rm -f .clasp.json appsscript.json tests.js
  echo "Done!"
  exit 0
fi

CLASP_CONFIG=".clasp.json.${TARGET}"
MANIFEST_CONFIG="appsscript.json.${TARGET}"

if [[ ! -f "$CLASP_CONFIG" ]]; then
  echo "Missing ${CLASP_CONFIG}. Copy ${CLASP_CONFIG}.example to ${CLASP_CONFIG} and set your scriptId." >&2
  exit 1
fi

if [[ ! -f "$MANIFEST_CONFIG" ]]; then
  echo "Missing ${MANIFEST_CONFIG}." >&2
  exit 1
fi

if ! command -v clasp >/dev/null 2>&1; then
  echo "Error: 'clasp' not found in PATH. Install via 'mise use -g npm:@google/clasp' or 'npm install -g @google/clasp'." >&2
  exit 1
fi

echo "Preparing files for ${TARGET}..."
cp "$CLASP_CONFIG" .clasp.json
cp "$MANIFEST_CONFIG" appsscript.json

if [[ "$TARGET" == "release" ]]; then
  rm -f tests.js
elif [[ "$TARGET" == "test" ]]; then
  cp tests/tests.js tests.js
fi

echo "Publishing to Google..."
clasp push
echo "Done!"
