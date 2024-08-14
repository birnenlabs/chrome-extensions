#!/bin/bash
script_path="$(realpath $0)"
package_dir="$(dirname ${script_path})"

case "$1" in
  ( "" | .* | */* )
    echo 'usage: build-extension.sh EXTENSION_SUBDIR'
    exit 1;;
esac

if [[ ! -d "${package_dir}/$1" ]]
then
    echo "subdirectory: $1 does not exist"
    exit 1
fi

zipfile="${package_dir}/target/$1.zip"

echo "Building $zipfile..."

set -e # exit on error

mkdir -p "${package_dir}/target"
cd "${package_dir}/$1"
npm install
npm audit
npm run eslint
npm run typecheck
npm run generate-files
zip -rv "$zipfile" .
echo ""
echo "Built $zipfile"
