import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

let lenis = null;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const getLenis = () => lenis;

/** Lenis'i GSAP ticker'ına bağlar; ScrollTrigger her kaydırmada güncellenir. */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    if (scrollLocked) lenis.stop();

    const tick = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

/** Bölüme kaydırır; sabit menü için üstten pay bırakır. */
export function scrollToId(id, { offset = -72, immediate = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return;

  if (lenis) {
    lenis.scrollTo(el, { offset, immediate, duration: 1.2 });
    return;
  }

  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: immediate || prefersReducedMotion() ? "auto" : "smooth",
  });
}

/** Açılış perdesi hero animasyonunu bekletir: wait perde kalkınca çözülür. */
export function createIntroGate(active) {
  if (!active) return { active: false, wait: Promise.resolve(), open: () => {} };
  let open;
  const wait = new Promise((resolve) => {
    open = resolve;
  });
  return { active: true, wait, open };
}

let scrollLocked = false;

export function lockScroll(locked) {
  scrollLocked = locked;
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export { gsap, ScrollTrigger, useGSAP };
