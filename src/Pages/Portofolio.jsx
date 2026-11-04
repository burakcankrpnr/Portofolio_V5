import CardProject from "../components/CardProject";
import TechStackIcon from "../components/TechStackIcon";
import { myWebsites } from "../data/projects";

const techStacks = [
  { icon: "reactjs.svg", language: "React.js" },
  { icon: "nextjs.svg", language: "Next.js" },
  { icon: "typescript.svg", language: "TypeScript" },
  { icon: "javascript.svg", language: "JavaScript" },
  { icon: "nodejs.svg", language: "Node.js" },
  { icon: "vuejs.svg", language: "Vue.js" },
  { icon: "tailwind.svg", language: "Tailwind CSS" },
  { icon: "scss.svg", language: "SCSS" },
  { icon: "sass.svg", language: "SASS" },
  { icon: "html.svg", language: "HTML5" },
  { icon: "css.svg", language: "CSS" },
  { icon: "MUI.svg", language: "Material UI" },
  { icon: "bootstrap.svg", language: "Bootstrap" },
  { icon: "mysql.svg", language: "MySQL" },
  { icon: "mongodb.svg", language: "MongoDB" },
  { icon: "prisma.svg", language: "Prisma ORM" },
  { icon: "graphql.svg", language: "GraphQL" },
  { icon: "socketio.svg", language: "Socket.IO" },
  { icon: "python.svg", language: "Python" },
  { icon: "docker.svg", language: "Docker" },
  { icon: "git.svg", language: "Git" },
  { icon: "vite.svg", language: "Vite" },
  { icon: "vercel.svg", language: "Vercel" },
  { icon: "wordpress.svg", language: "WordPress" },
  { icon: "shopify.svg", language: "Shopify" },
  { icon: "ikas.png", language: "İkas" },
  { icon: "trendyol.png", language: "Trendyol Pazaryeri" },
  { icon: "googleads.svg", language: "Google Ads" },
  { icon: "metaads.svg", language: "Meta Ads" },
];

export default function Portofolio() {
  const [featured, ...rest] = myWebsites;

  return (
    <section
      id="Portofolio"
      className="border-t border-cizgi py-20 sm:py-24 md:py-32"
      aria-labelledby="portfolio-heading"
    >
      <div className="shell">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2
            id="portfolio-heading"
            className="display text-5xl font-semibold leading-[0.95] text-kar md:col-span-7 md:text-7xl"
          >
            Seçilmiş işler
          </h2>
          <p className="max-w-[44ch] text-[17px] leading-relaxed text-sis md:col-span-5">
            Hepsi yayında. Görselin üzerine gelerek ya da dokunarak sitenin tamamını
            gezebilirsiniz.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:gap-8">
          <div className="md:col-span-2">
            <CardProject {...featured} featured />
          </div>
          {rest.map((website) => (
            <CardProject key={website.id} {...website} />
          ))}
        </div>

        <div className="mt-24 grid gap-10 md:mt-32 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h3 className="display text-4xl font-semibold leading-none text-kar md:text-5xl">
              Kullandığım araçlar
            </h3>
            <p className="mt-4 max-w-[36ch] text-[17px] leading-relaxed text-sis">
              Arayüzden veritabanına, reklam ve pazaryeri entegrasyonlarına kadar.
            </p>
          </div>
          <ul className="grid grid-cols-2 border-l border-t border-cizgi sm:grid-cols-3 lg:col-span-8 xl:grid-cols-4">
            {techStacks.map((stack) => (
              <li key={stack.language} className="border-b border-r border-cizgi">
                <TechStackIcon TechStackIcon={stack.icon} Language={stack.language} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
