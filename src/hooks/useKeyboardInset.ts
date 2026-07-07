import { useEffect, useState } from "react";

/**
 * Altura (px) que el teclado en pantalla le tapa al viewport.
 * En iOS/Android el teclado no achica el layout viewport, así que los
 * modales fijos al fondo quedan detrás; este inset permite levantarlos.
 * Devuelve 0 con el teclado cerrado o en desktop.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}

/** Bloquea el scroll del body mientras el modal está montado. */
export function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}
