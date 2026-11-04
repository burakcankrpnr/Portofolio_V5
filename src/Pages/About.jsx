import { memo, useRef } from "react";
import { PROJECT_COUNT } from "../data/projects";
import { gsap, useGSAP } from "../lib/motion";

const STATS = [
  { value: PROJECT_COUNT, label: "Yayında olan proje" },
  { value: 6, label: "Yıllık deneyim" },
  { value: 4, label: "Sertifika" },
];

const WORKPLACES = [
  { name: "StylingPark", url: "https://stylingpark.com/", note: "Şu an" },
  { name: "Desird Design Arge", url: "https://desird.com/" },
  { name: "Acc Studio", url: "https://accstudio.co/" },
  { name: "Creamake E-Ticaret Ajansı", url: "https://creamake.com/" },
];

const AboutPage = () => {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray(".stat-value").forEach((el) => {
          const target = Number(el.dataset.value);
          const counter = { n: 0 };
          gsap.to(counter, {
            n: target,
            duration: 1.6,
            ease: "power3.out",
            snap: { n: 1 },
            onUpdate: () => {
              el.textContent = counter.n;
            },
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        gsap.from(".about-photo img", {
          scale: 1.18,
          ease: "none",
          scrollTrigger: {
            trigger: ".about-photo",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section
      id="About"
      ref={root}
      className="border-t border-cizgi py-24 md:py-32"
      aria-labelledby="about-heading"
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="about-photo lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden rounded-[28px] border border-cizgi bg-murekkep">
              <img
                src="/image.jpg"
                alt="Burak Can Körpınar"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 lg:pt-4">
            <h2
              id="about-heading"
              className="display text-5xl font-semibold leading-[0.95] text-kar md:text-7xl"
            >
              Hakkımda
            </h2>

            <div className="mt-8 max-w-[62ch] space-y-5 text-[17px] leading-relaxed text-sis md:text-lg">
              <p className="text-xl leading-snug text-lila md:text-2xl">
                Mehmet Akif Ersoy Üniversitesi’nde Bilgisayar Mühendisliği okudum. Bugün
                markaların satış yapan sitelerini ve uygulamalarını uçtan uca geliştiriyorum.
              </p>
              <p>
                JavaScript, React, Node.js ve modern CSS ile ölçeklenebilir, hızlı arayüzler
                kuruyorum. Google Ads, Meta Ads, Trendyol Pazaryeri, İkas ve Shopify
                entegrasyonlarında kurumsal projelerde aktif rol alıyorum.
              </p>
              <p>
                Yeni teknolojileri takip edip işe yarayanları projelerime katıyorum; hedefim her
                seferinde biraz daha hızlı, biraz daha sade bir ürün çıkarmak.
              </p>
            </div>

            <h3 className="mt-12 text-[15px] text-sis">Çalıştığım yerler</h3>
            <ul className="mt-3 border-t border-cizgi">
              {WORKPLACES.map((w) => (
                <li key={w.name} className="border-b border-cizgi">
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="display text-2xl font-medium text-kar transition-colors group-hover:text-kayisi md:text-[1.75rem]">
                      {w.name}
                    </span>
                    {w.note && <span className="text-sm text-kayisi">{w.note}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <dl className="mt-20 grid grid-cols-3 gap-4 border-t border-cizgi pt-10 md:mt-28">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="mt-2 text-sm text-sis md:text-base">{s.label}</dt>
              <dd
                className="stat-value display text-6xl font-semibold leading-none text-kar sm:text-7xl md:text-[8rem]"
                data-value={s.value}
                style={{ fontVariationSettings: '"wdth" 80' }}
              >
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default memo(AboutPage);
