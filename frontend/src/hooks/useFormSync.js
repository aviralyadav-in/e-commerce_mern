import { useState } from "react";

/**
 * Adjusts form state during render whenever `key` changes — React's official
 * "adjust some state when a prop changes" pattern for syncing props into
 * local state without an effect cascade.
 *
 * Modal forms previously did this inside useEffect, which forced React
 * through an extra commit. Comparing against the previous key kept in
 * component state keeps the update synchronous within the same render pass.
 *
 * The callback runs at most once per distinct key value, never on mount
 * (initial state already matches the closed/blank case).
 */
const useFormSync = (key, sync) => {
  const [prevKey, setPrevKey] = useState(key);
  if (!Object.is(prevKey, key)) {
    setPrevKey(key);
    sync();
  }
};

export default useFormSync;