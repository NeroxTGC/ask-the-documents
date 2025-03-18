// Background script for the extension
console.log('Background script loaded');

// Simple listener for browser action clicks
chrome.action.onClicked.addListener(function(tab) {
  console.log('Extension icon clicked');
});
