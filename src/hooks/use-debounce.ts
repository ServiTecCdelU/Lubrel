// Devuelve el valor recién cuando dejó de cambiar durante `ms` (búsqueda mientras se tipea,
// cotización mientras se tocan cantidades). El primer valor sale al instante.
import { useEffect, useState } from 'react';

export function useDebounce<T>(valor: T, ms: number): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}
