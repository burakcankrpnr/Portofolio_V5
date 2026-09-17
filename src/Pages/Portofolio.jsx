import { useEffect, useState } from "react";
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
import { Boxes, Award } from "lucide-react";
import { myWebsites } from "../data/projects";


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

// Teknik Yeterlilikler
const techStacks = [
  { icon: "reactjs.svg", language: "React.js" },
  { icon: "nodejs.svg", language: "Node.js" },
  { icon: "typescript.svg", language: "TypeScript" },
  { icon: "javascript.svg", language: "JavaScript" },
  { icon: "scss.svg", language: "SCSS" },
  { icon: "vuejs.svg", language: "Vue.js" },
  { icon: "html.svg", language: "HTML5" },
  { icon: "css.svg", language: "CSS" },
  { icon: "nextjs.svg", language: "Next.js" },
  { icon: "sass.svg", language: "SASS" },
  { icon: "mysql.svg", language: "MySQL" },
  { icon: "docker.svg", language: "Docker" },
  { icon: "git.svg", language: "Git" },
  { icon: "python.svg", language: "Python" },
  { icon: "tailwind.svg", language: "Tailwind CSS" },
  { icon: "prisma.svg", language: "Prisma ORM" },
  { icon: "mongodb.svg", language: "MongoDB" },
  { icon: "wordpress.svg", language: "WordPress" },
  { icon: "socketio.svg", language: "Socket.IO" },
  { icon: "graphql.svg", language: "GraphQL" },
  { icon: "vite.svg", language: "Vite" },
  { icon: "bootstrap.svg", language: "Bootstrap" },
  { icon: "MUI.svg", language: "Material UI" },
  { icon: "vercel.svg", language: "Vercel" },
  { icon: "googleads.svg", language: "Google Ads" },
  { icon: "metaads.svg", language: "Meta Ads" },
  { icon: "trendyol.png", language: "Trendyol Pazaryeri" },
  { icon: "ikas.png", language: "İkas" },
  { icon: "shopify.svg", language: "Shopify" },
];

export default function FullWidthTabs() {
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const [swiperRef, setSwiperRef] = useState(null);


  // AOS başlat
  useEffect(() => {
    AOS.init({
      once: false,
    });
  }, []);


  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (swiperRef) {
      swiperRef.slideTo(newValue);
    }
  };

  const handleSlideChange = (swiper) => {
    setValue(swiper.activeIndex);
  };


  return (
    <section
      className="px-[5%] sm:px-[5%] lg:px-[10%] w-full sm:mt-0 mt-[3rem] bg-[#030014] overflow-hidden"
      id="Portofolio"
      aria-labelledby="portfolio-heading"
    >
      {/* Başlık */}
      <div
        className="text-center pb-10"
        data-aos="fade-up"
        data-aos-duration="1000"
      >
        <h2
          id="portfolio-heading"
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
            {/* Tab 1: Projelerim (GitHub) */}
            <Tab
              icon={<Award className="mb-2 w-5 h-5 transition-all duration-300" />}
              label="Projelerim"
              {...a11yProps(0)}
            />
            {/* Tab 2: Yetkinliklerim */}
            <Tab
              icon={<Boxes className="mb-2 w-5 h-5 transition-all duration-300" />}
              label="Yetkinliklerim"
              {...a11yProps(1)}
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
          {/* TAB 0: Web Sitelerim - YORUMDA */}
          {/* <SwiperSlide>
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
                        Company={website.Company}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>
          </SwiperSlide> */}

          {/* TAB 0: Projelerim (GitHub Projeleri) */}
          <SwiperSlide>
            <TabPanel value={value} index={0} dir={theme.direction}>
              <div className="w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-5 items-stretch">
                  {myWebsites.map((website, index) => (
                    <div
                      key={website.id}
                      className="h-full"
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
                        Company={website.Company}
                        CompanyLink={website.CompanyLink}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabPanel>
          </SwiperSlide>

          {/* TAB 1: Yetkinliklerim */}
          <SwiperSlide>
            <TabPanel value={value} index={1} dir={theme.direction}>
              <div className="w-full overflow-hidden pb-[5%]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-8 gap-5 items-stretch">
                  {techStacks.map((stack, index) => (
                    <div
                      key={index}
                      className="h-full"
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
    </section>
  );
}
