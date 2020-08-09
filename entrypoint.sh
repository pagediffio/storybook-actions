#!/bin/bash

cd $GITHUB_WORKSPACE
echo "Running `npm install`..."
npm install

STORY_OUTPUT=$GITHUB_WORKSPACE/__pagediff__githubactions__/storybook-output
SCREENSHOT_OUTPUT_RELATIVE=__pagediff__githubactions__/screenshot-output
SCREENSHOT_OUTPUT=$GITHUB_WORKSPACE/$SCREENSHOT_OUTPUT_RELATIVE

echo `mkdir -p $STORY_OUTPUT`
mkdir -p $STORY_OUTPUT

echo "Running `npm run build-storybook -- --quiet -o $STORY_OUTPUT`..."
npm run build-storybook -- --quiet warn -o $STORY_OUTPUT

echo `mkdir -p $SCREENSHOT_OUTPUT`
mkdir -p $SCREENSHOT_OUTPUT

echo "Generating screenshots from $STORY_OUTPUT to $SCREENSHOT_OUTPUT"
node /pagediff/dist/index.js generate $STORY_OUTPUT $SCREENSHOT_OUTPUT

echo "Archiving screenshots..."
tar -czvf $STORY_OUTPUT/screenshots.zip -C $SCREENSHOT_OUTPUT .

echo "Uploading to Pagediff..."
node /pagediff/dist/index.js upload $STORY_OUTPUT/screenshots.zip

echo "::set-output name=screenshot-path::$SCREENSHOT_OUTPUT_RELATIVE"
