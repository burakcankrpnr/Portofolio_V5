import { useRef } from "react";
import PropTypes from "prop-types";
import { gsap, lockScroll, useGSAP } from "../lib/motion";

const LINES = ["Portfolyo siteme", "hoş geldiniz"];
const URL_TEXT = "burakcankorpinar.dev";

/**
 * Açılış perdesi: yazı maskeden yükselir, çizgi dolar, perde yukarı kalkar.
 * onReveal perde kalkmaya başladığında, onDone tamamen bittiğinde çağrılır.
 * Tıklayınca ya da bir tuşa basınca doğrudan çıkışa atlar.
 */
const Intro = ({ onReveal, onDone }) => {
  const root = useRef(null);
  const tlRef = useRef(null);

  useGSAP(
    () => {
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      lockScroll(true);

      let revealed = false;
      const reveal = () => {
        if (revealed) return;
        revealed = true;
        onReveal();
      };

      const tl = gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          lockScroll(false);
          onDone();
        },
      });
      tlRef.current = tl;

      tl.from(".intro-word", { yPercent: 120, duration: 1, stagger: 0.09 })
        .fromTo(
          ".intro-bar",
          { scaleX: 0 },
          { scaleX: 1, duration: 1, ease: "power2.inOut" },
          "-=0.55"
        )
        .from(".intro-url-char", { autoAlpha: 0, duration: 0.01, stagger: 0.035 }, "<")
        .addLabel("out", "+=0.2")
        .to(
          ".intro-word",
          { yPercent: -120, duration: 0.55, stagger: 0.05, ease: "power3.in" },
          "out"
        )
        .to(".intro-foot", { autoAlpha: 0, duration: 0.3, ease: "power1.in" }, "out")
        .to(
          root.current,
          {
            yPercent: -100,
            borderBottomLeftRadius: "50% 12vh",
            borderBottomRightRadius: "50% 12vh",
            duration: 0.95,
            ease: "expo.inOut",
            onStart: reveal,
          },
          "out+=0.3"
        );

      const skip = () => {
        if (tl.time() < tl.labels.out) tl.seek("out");
      };
      window.addEventListener("keydown", skip);
      return () => {
        window.removeEventListener("keydown", skip);
        lockScroll(false);
      };
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      onClick={() => {
        const tl = tlRef.current;
        if (tl && tl.time() < tl.labels.out) tl.seek("out");
      }}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col justify-center overflow-hidden bg-murekkep will-change-transform"
      role="presentation"
    >
      <div className="shell">
        <p
          className="display font-semibold leading-[0.9] text-kar text-[clamp(3rem,11vw,10rem)] tracking-[-0.04em]"
          style={{ fontVariationSettings: '"wdth" 80' }}
        >
          {LINES.map((line) => (
            <span key={line} className="mask-line">
              <span className="intro-word">{line}</span>
            </span>
          ))}
        </p>

        <div className="intro-foot mt-10 md:mt-14">
          <div className="intro-bar h-px w-full origin-left bg-kayisi" />
          <div className="mt-4 flex items-baseline justify-between gap-4 text-[15px]">
            <span className="text-lila" aria-label={URL_TEXT}>
              {Array.from(URL_TEXT).map((ch, i) => (
                <span key={i} className="intro-url-char" aria-hidden="true">
                  {ch}
                </span>
              ))}
            </span>
            <span className="hidden text-sis sm:inline">Geçmek için tıklayın</span>
          </div>
        </div>
      </div>
    </div>
  );
};

Intro.propTypes = {
  onReveal: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

export default Intro;
