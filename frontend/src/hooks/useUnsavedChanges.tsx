import { useEffect } from "react";

const MESSAGE = "Discard your unsaved changes?";

let unsavedCount = 0;
let savingCount = 0;

// For in-app actions that unmount forms, e.g. tab switches. Changes that are
// being saved don't count: unmounting doesn't abort the request.
export const confirmDiscard = () =>
  unsavedCount === savingCount || window.confirm(MESSAGE);

const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

// Runs in the capture phase, so it can cancel a click before Next's <Link>
// sees it.
const guardLinkClick = (event: MouseEvent) => {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  const link =
    event.target instanceof Element
      ? event.target.closest<HTMLAnchorElement>("a[href]")
      : null;
  if (!link || link.target === "_blank" || link.origin !== location.origin) {
    return;
  }
  if (!confirmDiscard()) {
    event.preventDefault();
    event.stopPropagation();
  }
};

// While `unsaved`, asks for confirmation before the page is closed or reloaded
// and before a link is followed. Browser back/forward is not covered. Returns a
// confirmation for discarding only this component's changes, e.g. in a drawer.
export const useUnsavedChanges = (unsaved: boolean, saving = false) => {
  useEffect(() => {
    if (!unsaved) return;
    if (unsavedCount++ === 0) {
      window.addEventListener("beforeunload", warnBeforeUnload);
      document.addEventListener("click", guardLinkClick, true);
    }
    return () => {
      if (--unsavedCount === 0) {
        window.removeEventListener("beforeunload", warnBeforeUnload);
        document.removeEventListener("click", guardLinkClick, true);
      }
    };
  }, [unsaved]);

  useEffect(() => {
    if (!unsaved || !saving) return;
    savingCount++;
    return () => {
      savingCount--;
    };
  }, [unsaved, saving]);

  return () => !unsaved || saving || window.confirm(MESSAGE);
};
