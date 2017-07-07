#!/bin/bash

time node --expose_gc --max-old-space-size=12288 import.js "$1" "$2"
