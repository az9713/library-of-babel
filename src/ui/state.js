/**
 * Shared UI state — tracks which panels are open
 */

export const uiState = {
  readerOpen: false,
  searchOpen: false,
  navOpen: false,
  vindicationsOpen: false,
  aboutOpen: false,
  introHidden: false,
};

export function isAnyPanelOpen() {
  return uiState.readerOpen || uiState.searchOpen || uiState.navOpen
    || uiState.vindicationsOpen || uiState.aboutOpen;
}
