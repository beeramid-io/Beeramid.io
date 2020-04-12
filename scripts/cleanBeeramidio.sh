#!/bin/bash

echo -e `date '+[%Y-%m-%dT%H:%M:%S.000Z]'`"\t"`curl -s https://Beeramid.io/clean` >> $(dirname "$0")/../logs/clean.out
