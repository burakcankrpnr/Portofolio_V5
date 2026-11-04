import { Heart } from "lucide-react";

/** Kenarlardan uçuşan kalpler — mobilde daha az ve kenarda kalır. */
const HEARTS = [
  { side: "left", top: "6%", size: 22, delay: "0s", duration: "6.5s", bob: "2.2s", tone: "kayisi", mobile: true },
  { side: "left", top: "18%", size: 14, delay: "0.7s", duration: "7.2s", bob: "1.8s", tone: "lila", mobile: false },
  { side: "left", top: "32%", size: 28, delay: "1.5s", duration: "5.8s", bob: "2.6s", tone: "rose", mobile: true },
  { side: "left", top: "46%", size: 16, delay: "0.3s", duration: "6.8s", bob: "2s", tone: "kayisi", mobile: false },
  { side: "left", top: "58%", size: 20, delay: "2.1s", duration: "7.5s", bob: "1.6s", tone: "lila", mobile: true },
  { side: "left", top: "70%", size: 12, delay: "1.1s", duration: "5.5s", bob: "2.4s", tone: "rose", mobile: false },
  { side: "left", top: "82%", size: 24, delay: "2.8s", duration: "6.2s", bob: "1.9s", tone: "kayisi", mobile: true },
  { side: "left", top: "94%", size: 15, delay: "0.5s", duration: "7s", bob: "2.1s", tone: "lila", mobile: false },
  { side: "right", top: "10%", size: 18, delay: "0.4s", duration: "6s", bob: "2s", tone: "lila", mobile: true },
  { side: "right", top: "24%", size: 26, delay: "1.2s", duration: "7.4s", bob: "1.7s", tone: "kayisi", mobile: false },
  { side: "right", top: "36%", size: 13, delay: "2.4s", duration: "5.6s", bob: "2.5s", tone: "rose", mobile: true },
  { side: "right", top: "50%", size: 21, delay: "0.8s", duration: "6.9s", bob: "1.5s", tone: "lila", mobile: false },
  { side: "right", top: "64%", size: 17, delay: "1.9s", duration: "6.3s", bob: "2.3s", tone: "kayisi", mobile: true },
  { side: "right", top: "76%", size: 30, delay: "3.1s", duration: "7.8s", bob: "1.8s", tone: "rose", mobile: false },
  { side: "right", top: "88%", size: 14, delay: "0.2s", duration: "5.9s", bob: "2.2s", tone: "lila", mobile: true },
];

const TONE_CLASS = {
  kayisi: "text-kayisi",
  lila: "text-lila",
  rose: "text-[#ff8fab]",
};

const HeartEdges = () => (
  <div className="beril-hearts pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden="true">
    {HEARTS.map((h, i) => (
      <span
        key={`${h.side}-${i}`}
        className={`beril-heart beril-heart--${h.side} absolute ${TONE_CLASS[h.tone]} ${
          h.mobile ? "" : "hidden sm:block"
        }`}
        style={{
          top: h.top,
          [h.side]: "-1.5rem",
          width: h.size,
          height: h.size,
          animationDelay: h.delay,
          animationDuration: h.duration,
        }}
      >
        <Heart
          className="beril-heart-bob h-full w-full drop-shadow-[0_0_12px_rgba(255,178,122,0.45)]"
          style={{ animationDuration: h.bob, animationDelay: h.delay }}
          fill="currentColor"
          strokeWidth={0}
        />
      </span>
    ))}
  </div>
);

export default HeartEdges;
