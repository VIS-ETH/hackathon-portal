import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

import { useState } from "react";

// Keeps a local draft while a field is edited and saves it once on commit
// (blur). The field shows the draft while editing and the server value
// otherwise, so a refetch never overwrites what is being typed. Disable the
// field while `saving`, so nothing typed during the save gets discarded.
// Closing or reloading the page doesn't blur the field, so it asks for
// confirmation while a draft is unsaved or still being saved. Clicking a tab
// or link blurs the field first, which starts the save, so those don't ask.
export const useBlurSave = <T,>(
  serverValue: T,
  save: (value: T) => Promise<unknown>,
) => {
  const [draft, setDraft] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  useUnsavedChanges(draft !== null && draft !== serverValue, saving);

  const commit = async () => {
    if (draft === null) return;
    setSaving(true);
    try {
      if (draft !== serverValue) await save(draft);
    } catch {
      // Surfaced by the global MutationCache handler; the field reverts.
    } finally {
      setDraft(null);
      setSaving(false);
    }
  };

  return { value: draft ?? serverValue, setDraft, commit, saving };
};
