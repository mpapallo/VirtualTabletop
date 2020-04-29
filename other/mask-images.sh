#!/bin/bash

DB_PATH='.'

for frag in $DB_PATH/fragments/*
do
    convert $frag/front-2d/color.png $frag/front-color-smask.png -alpha Off -compose CopyOpacity -composite $frag/front-2d/color-masked.png
done

echo Masked images saved in front-2d/
