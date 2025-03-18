# Ask The Documents Chrome Extension

This Chrome extension allows you to query your documents using the Ask The Documents API directly from your browser.

## Features

- Simple, clean interface similar to the main application
- Query your documents without leaving your current page
- Markdown rendering for answers

## Installation

Since this is a development version of the extension, you'll need to install it manually:

1. Make sure your Ask The Documents application is running on `http://localhost:3000`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the `chrome-extension` folder from your Ask The Documents project
5. The extension should now be installed and visible in your Chrome toolbar

## Usage

1. Click on the Ask The Documents icon in your Chrome toolbar
2. Type your question in the search box
3. Press Enter to submit your query
4. View the answer in the popup window

## Requirements

- You must be logged in to your Ask The Documents application in the same browser
- The Ask The Documents application must be running on `http://localhost:3000`

## Missing Files

Note that you'll need to add the following image files to the `images` folder:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create these icons using any image editor or icon generator.

## Customization

If your Ask The Documents application is running on a different URL, you'll need to update the `API_BASE_URL` variable in `popup.js` and the `host_permissions` in `manifest.json`.
