#!/bin/bash

time node --expose_gc --max-old-space-size=8192 import.js "$1" "$2"
