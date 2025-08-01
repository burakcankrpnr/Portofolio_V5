import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CardProject from "../components/CardProject";
import TechStackIcon from "../components/TechStackIcon";
import AOS from "aos";
import "aos/dist/aos.css";
import { Code, Award, Boxes } from "lucide-react";

// Ortak GitHub proje görseli (varsayılan placeholder)
const GITHUB_PLACEHOLDER_IMG =
  "https://www.bleepstatic.com/content/hl-images/2022/04/08/GitHub__headpic.jpg";

// Show More / Show Less butonu
const ToggleButton = ({ onClick, isShowingMore }) => (
  <button
    onClick={onClick}
    className="
      px-3 py-1.5
      text-slate-300 
      hover:text-white 
      text-sm 
      font-medium 
      transition-all 
      duration-300 
      ease-in-out
      flex 
      items-center 
      gap-2
      bg-white/5 
      hover:bg-white/10
      rounded-md
      border 
      border-white/10
      hover:border-white/20
      backdrop-blur-sm
      group
      relative
      overflow-hidden
    "
  >
    <span className="relative z-10 flex items-center gap-2">
      {isShowingMore ? "See Less" : "See More"}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          transition-transform 
          duration-300 
          ${isShowingMore ? "group-hover:-translate-y-0.5" : "group-hover:translate-y-0.5"}
        `}
      >
        <polyline
          points={isShowingMore ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}
        ></polyline>
      </svg>
    </span>
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500/50 transition-all duration-300 group-hover:w-full"></span>
  </button>
);

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          {/* IMPORTANT: Use component="div" to avoid nesting warnings */}
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

// Web Siteleri
const myWebsites = [
  {
    id: 1,
    Title: "HabboTPD",
    Img: "./tpdgiris.png",
    Description:
      "100'den fazla günlük aktif kullanıcı için modern bir topluluk etkileşim deneyimi sağlamayı amaçlayan tam özellikli bir web platformu geliştirildi. Veri korumasını ve oturum güvenliğini garanti altına alarak güvenli kullanıcı kimlik doğrulaması (JWT/OAuth 2.0) uygulandı. Kullanıcı etkinliğini, profil ayrıntılarını ve performans ölçümlerini gösteren modüler bir gösterge paneli tasarlandı. Optimum kullanıcı deneyimi için React, Tailwind CSS ve Node.js kullanarak koyu/açık mod seçeneklerine sahip duyarlı ve mobil uyumlu bir kullanıcı arayüzü oluşturuldu.",
    Link: "https://habbotpd.com/",
  },
  {
    id: 2,
    Title: "AccValo.Shop",
    Img: "./valo3.png",
    Description:
      "AccValo.Shop - Önde gelen global Valorant hesap ve skin satış platformu. Güvenli, hızlı alışveriş ve 7/24 canlı destek!",
    Link: "https://www.accvalo.shop/",
  },
  {
    id: 3,
    Title: "Hesap Durağı",
    Img: "./Adsız.png",
      Description:
        "Hesap Durağı - Türkiye'nin en güvenilir oyun hesabı alışveriş platformu. Profesyonel hesaplar, güvenli ödeme sistemi ve 7/24 müşteri desteği.",
    Link: "https://www.hesapduragi.com/",
  },
];

// Teknik Yeterlilikler
const techStacks = [
  { icon: "html.svg", language: "HTML" },
  { icon: "css.svg", language: "CSS" },
  { icon: "javascript.svg", language: "JavaScript" },
  { icon: "tailwind.svg", language: "Tailwind CSS" },
  { icon: "reactjs.svg", language: "ReactJS" },
  { icon: "vite.svg", language: "Vite" },
  { icon: "nodejs.svg", language: "Node JS" },
  { icon: "bootstrap.svg", language: "Bootstrap" },
  { icon: "MUI.svg", language: "Material UI" },
  { icon: "vercel.svg", language: "Vercel" },
];

export default function FullWidthTabs() {
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const [swiperRef, setSwiperRef] = useState(null);

  // GitHub projeleri
  const [githubProjects, setGithubProjects] = useState([]);

  // GitHub projelerinde "See More" özelliği
  const [showAllGithubProjects, setShowAllGithubProjects] = useState(false);

  // Ekran genişliği (mobil mi değil mi) - render sonrası hesaplıyoruz
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // ilk açılışta çalıştır
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Başlangıçta kaç proje gösterilsin?
  const initialItems = isMobile ? 4 : 6;

  // AOS başlat
  useEffect(() => {
    AOS.init({
      once: false,
    });
  }, []);

  // GitHub projelerini çekme fonksiyonu
  const fetchGithubProjects = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.github.com/users/burakcankrpnr/repos"
      );
      const data = await response.json();

      // Mümkün olan en fazla bilgiyi alarak "Description" alanına ekliyoruz
      const formattedRepos = data.map((repo) => {
        // Repo'ya ait ek bilgileri Description içine gömüyoruz.
        const combinedDesc = `
${repo.description || "Açıklama girilmemiş."}

• Dil (Language): ${repo.language || "Belirtilmemiş"}
• Yıldız (Stars): ${repo.stargazers_count}
• Forks: ${repo.forks_count}
• Watchers: ${repo.watchers_count}
• Open Issues: ${repo.open_issues_count}
• Lisans: ${repo.license?.spdx_id || "Lisans yok"}
• Topics: ${repo.topics?.join(", ") || "—"}
• Anasayfa (Homepage): ${repo.homepage || "Yok"}
• Oluşturulma (Created): ${repo.created_at}
• Güncellenme (Updated): ${repo.updated_at}
        `.trim();

        return {
          id: repo.id,
          Title: repo.name,
          Description: combinedDesc,
          Img: GITHUB_PLACEHOLDER_IMG, // Ortak GitHub placeholder resmi
          Link: repo.html_url,
        };
      });
      setGithubProjects(formattedRepos);
    } catch (error) {
      console.error("Error fetching GitHub projects:", error);
    }
  }, []);

  // component yüklendiğinde GitHub verilerini çek
  useEffect(() => {
    fetchGithubProjects();
  }, [fetchGithubProjects]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (swiperRef) {
      swiperRef.slideTo(newValue);
    }
  };

  const handleSlideChange = (swiper) => {
    setValue(swiper.activeIndex);
  };

  // Gösterilecek GitHub proje sayısı
  const displayedGithubProjects = showAllGithubProjects
    ? githubProjects
    : githubProjects.slice(0, initialItems);

  // ShowMore/ShowLess fonksiyonu
  const toggleShowMore = useCallback(() => {
    setShowAllGithubProjects((prev) => !prev);
  }, []);

  return (
    <div
      className="md:px-[10%] px-[5%] w-full sm:mt-0 mt-[3rem] bg-[#030014] overflow-hidden"
      id="Portofolio"
    >
      {/* Başlık */}
      <div
        className="text-center pb-10"
        data-aos="fade-up"
        data-aos-duration="1000"
      >
        <h2
          className="inline-block text-3xl md:text-5xl font-bold text-center mx-auto text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a855f7]"
          style={{
            color: "#6366f1",
            backgroundImage: "linear-gradient(45deg, #6366f1 10%, #a855f7 93%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Portföy Vitrini
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base mt-2">
          Web sitelerim, GitHub projelerim ve teknik uzmanlıklarım aracılığıyla
          yolculuğumu keşfedin. Her bölüm, sürekli öğrenme yolumda bir dönüm
          noktasını temsil ediyor.
        </p>
      </div>

      <Box sx={{ width: "100%" }}>
        {/* Sekmeler */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(180deg, rgba(139, 92, 246, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)",
              backdropFilter: "blur(10px)",
              zIndex: 0,
            },
          }}
          className="md:px-4"
        >
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="secondary"
            indicatorColor="secondary"
            variant="fullWidth"
            sx={{
              minHeight: "70px",
              "& .MuiTab-root": {
                fontSize: { xs: "0.9rem", md: "1rem" },
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "none",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                padding: "20px 0",
                zIndex: 1,
                margin: "8px",
                borderRadius: "12px",
                "&:hover": {
                  color: "#ffffff",
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  transform: "translateY(-2px)",
                  "& .lucide": {
                    transform: "scale(1.1) rotate(5deg)",
                  },
                },
                "&.Mui-selected": {
                  color: "#fff",
                  background:
                    "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))",
                  boxShadow: "0 4px 15px -3px rgba(139, 92, 246, 0.2)",
                  "& .lucide": {
                    color: "#a78bfa",
                  },
                },
              },
              "& .MuiTabs-indicator": {
                height: 0,
              },
              "& .MuiTabs-flexContainer": {
                gap: "8px",
              },
            }}
          >
            {/* Tab 1: Web Sitelerim */}
            <Tab
              icon={<Code className="mb-2 w-5 h-5 transition-all duration-300" />}
              label="Web Sitelerim"
              {...a11yProps(0)}
            />
            {/* Tab 2: Projelerim (GitHub) */}
            <Tab
              icon={<Award className="mb-2 w-5 h-5 transition-all duration-300" />}
              label="Projelerim"
              {...a11yProps(1)}
            />
            {/* Tab 3: Yetkinliklerim */}
            <Tab
              icon={<Boxes className="mb-2 w-5 h-5 transition-all duration-300" />}
              label="Yetkinliklerim"
              {...a11yProps(2)}
            />
          </Tabs>
        </AppBar>

        <Swiper
          slidesPerView={1}
          spaceBetween={30}
          loop={false}
          allowTouchMove={true}
          onSwiper={setSwiperRef}
          onSlideChange={handleSlideChange}
          modules={[Pagination, Navigation]}
          className="mySwiper"
          style={{
            '--swiper-pagination-color': 'transparent',
            '--swiper-navigation-color': 'transparent',
          }}
        >
          {/* TAB 0: Web Sitelerim */}
          <SwiperSlide>
            <TabPanel value={value} index={0} dir={theme.direction}>
              <div className="container mx-auto flex justify-center items-center overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                  {myWebsites.map((website, index) => (
                    <div
                      key={website.id}
                      data-aos={
                        index % 3 === 0
                          ? "fade-up-right"
                          : index % 3 === 1
                          ? "fade-up"
                          : "fade-up-left"
                      }
                      data-aos-duration={
                        index % 3 === 0
                          ? "1000"
                          : index % 3 === 1
                          ? "1200"
                          : "1000"
                      }
                    >
                      <CardProject
                        Img={website.Img}
                        Title={website.Title}
                        Description={website.Description}
                        Link={website.Link}
                        id={website.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>
          </SwiperSlide>

          {/* TAB 1: Projelerim (GitHub Projeleri) */}
          <SwiperSlide>
            <TabPanel value={value} index={1} dir={theme.direction}>
              <div className="container mx-auto flex justify-center items-center overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                  {displayedGithubProjects.map((repo, index) => (
                    <div
                      key={repo.id}
                      data-aos={
                        index % 3 === 0
                          ? "fade-up-right"
                          : index % 3 === 1
                          ? "fade-up"
                          : "fade-up-left"
                      }
                      data-aos-duration={
                        index % 3 === 0
                          ? "1000"
                          : index % 3 === 1
                          ? "1200"
                          : "1000"
                      }
                    >
                      <CardProject
                        Img={repo.Img} // Ortak GitHub placeholder resmi
                        Title={repo.Title}
                        Description={repo.Description}
                        Link={repo.Link}
                        id={repo.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {githubProjects.length > initialItems && (
                <div className="mt-6 w-full flex justify-start">
                  <ToggleButton
                    onClick={toggleShowMore}
                    isShowingMore={showAllGithubProjects}
                  />
                </div>
              )}
            </TabPanel>
          </SwiperSlide>

          {/* TAB 2: Yetkinliklerim */}
          <SwiperSlide>
            <TabPanel value={value} index={2} dir={theme.direction}>
              <div className="container mx-auto flex justify-center items-center overflow-hidden pb-[5%]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-8 gap-5">
                  {techStacks.map((stack, index) => (
                    <div
                      key={index}
                      data-aos={
                        index % 3 === 0
                          ? "fade-up-right"
                          : index % 3 === 1
                          ? "fade-up"
                          : "fade-up-left"
                      }
                      data-aos-duration={
                        index % 3 === 0
                          ? "1000"
                          : index % 3 === 1
                          ? "1200"
                          : "1000"
                      }
                    >
                      <TechStackIcon
                        TechStackIcon={stack.icon}
                        Language={stack.language}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>
          </SwiperSlide>
        </Swiper>
      </Box>
    </div>
  );
}
