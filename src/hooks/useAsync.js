// src/hooks/useAsync.js
import { useState, useCallback } from "react";

/**
 * Hook genérico para llamadas async en componentes.
 * Devuelve { execute, loading, error, value }
 */
export default function useAsync(asyncFunction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [value, setValue] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFunction(...args);
        setValue(result);
        setLoading(false);
        return result;
      } catch (err) {
        setError(err);
        setLoading(false);
        throw err;
      }
    },
    [asyncFunction]
  );

  return { execute, loading, error, value };
}
