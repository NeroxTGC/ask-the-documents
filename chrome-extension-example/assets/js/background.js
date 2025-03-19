chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

const UNINSTALL_URL = "https://softoolbase.com/deepseek-ai-uninstall";
chrome.runtime.setUninstallURL(UNINSTALL_URL);

const WELCOME_URL = "https://softoolbase.com/deepseek-ai-welcome-page";
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: WELCOME_URL,
        });
    }
});