import { memo, useRef } from "react";
import PropTypes from "prop-types";
import { myWebsites } from "../data/projects";
import { hostOf, previewFileFromUrl } from "../lib/preview";
import { gsap, scrollToId, useGSAP } from "../lib/motion";

const NAME_LINES = ["Burak Can", "Körpınar"];
const STRIP = myWebsites.filter((p) => p.Link);

const jump = (id) => (e) => {
  e.preventDefault();
  scrollToId(id);
};

const Home = ({ ready = Promise.resolve() }) => {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Açılış perdesi varsa, perde kalkmaya başlayınca oynat
        const tl = gsap.timeline({ paused: true, delay: 0.15, defaults: { ease: "expo.out" } });
        ready.then(() => tl.play());
        tl.from(".hero-char", { yPercent: 118, duration: 1.15, stagger: 0.032 })
          .from(
            ".hero-fade",
            { autoAlpha: 0, y: 18, duration: 0.9, stagger: 0.08, ease: "power3.out" },
            "-=0.75"
          )
          .from(
            ".hero-shot",
            { autoAlpha: 0, y: 48, duration: 1, stagger: 0.06, ease: "power3.out" },
            "-=0.7"
          );

        const track = root.current.querySelector(".hero-track");
        gsap.to(track, {
          x: () => -Math.max(0, track.scrollWidth - window.innerWidth) * 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-strip",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section
      id="Home"
      ref={root}
      className="relative overflow-hidden pt-28 md:pt-40"
      aria-labelledby="home-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(60%_60%_at_20%_0%,rgba(201,190,255,0.10),transparent_70%)]"
      />

      <div className="shell relative">
        <p className="hero-fade flex items-center gap-3 text-[15px] text-sis">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="status-ping absolute inset-0 rounded-full bg-kayisi" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-kayisi" />
          </span>
          <span>
            Şu an{" "}
            <a
              href="https://stylingpark.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-kar link-underline"
            >
              StylingPark
            </a>
            ’ta full-stack geliştiriciyim
          </span>
        </p>

        <h1
          id="home-heading"
          aria-label="Burak Can Körpınar"
          className="display mt-6 font-semibold text-kar leading-[0.86] text-[clamp(5rem,21vw,14.5rem)] tracking-[-0.045em]"
          style={{ fontVariationSettings: '"wdth" 80' }}
        >
          {NAME_LINES.map((line) => (
            <span key={line} className="mask-line" aria-hidden="true">
              <span>
                {Array.from(line).map((ch, i) => (
                  <span key={i} className="hero-char inline-block">
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <p className="hero-fade max-w-[30ch] text-[1.35rem] leading-snug text-lila md:col-span-7 md:text-[1.75rem]">
            Markalar için hızlı, satış yapan web siteleri ve mobil uygulamalar geliştiriyorum.
          </p>
          <div className="hero-fade flex flex-wrap gap-3 md:col-span-5 md:justify-end">
            <a href="#Portofolio" onClick={jump("Portofolio")} className="btn-primary">
              İşleri gör
            </a>
            <a href="#Contact" onClick={jump("Contact")} className="btn-ghost">
              İletişime geç
            </a>
          </div>
        </div>
      </div>

      <div className="hero-strip mt-16 pb-24 md:mt-24 md:pb-32">
        <ul className="hero-track flex w-max gap-4 pl-4 sm:pl-8 md:gap-6 lg:pl-[max(3rem,calc((100vw-80rem)/2+3rem))]">
          {STRIP.map((p) => (
            <li key={p.id} className="hero-shot">
              <a
                href={p.Link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-[260px] sm:w-[320px] md:w-[400px]"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-cizgi bg-murekkep">
                  <img
                    src={previewFileFromUrl(p.Link) || p.Img}
                    alt={`${p.Title} sitesinin ana sayfası`}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-kar group-hover:text-kayisi transition-colors">{p.Title}</span>
                  <span className="truncate text-sis">{hostOf(p.Link)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

Home.propTypes = { ready: PropTypes.instanceOf(Promise) };

export default memo(Home);
