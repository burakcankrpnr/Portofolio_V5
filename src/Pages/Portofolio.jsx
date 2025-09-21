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
    Title: "Habbo TPD Website",
    Img: "./tpdgiris.png",
    Company: "Acc Studio",
    Description:
      "Professional Community Platform - 100+ günlük aktif kullanıcı için modern topluluk etkileşim deneyimi sağlayan tam özellikli web platformu. Güvenli kullanıcı kimlik doğrulaması (JWT/OAuth 2.0) uygulandı. Kullanıcı etkinliği, profil ayrıntıları ve performans ölçümlerini gösteren modüler dashboard tasarlandı. React, Tailwind CSS ve Node.js kullanarak koyu/açık mod seçeneklerine sahip duyarlı ve mobil uyumlu UI oluşturuldu.",
    Link: "https://habbotpd.com/",
  },
  // {
  //   id: 2,
  //   Title: "AccValo.Shop",
  //   Img: "./valo3.png",
  //   Description:
  //     "E-Commerce Platform - Valorant hesaplarını güvenli bir şekilde alıp satmak için tasarlanmış full-stack web uygulaması. Node.js ve Express.js kullanarak RESTful API'ler geliştirildi, ürün ve kullanıcı yönetimi için MySQL entegrasyonu yapıldı. JWT tabanlı kimlik doğrulama ile modern, duyarlı React frontend'i oluşturuldu.",
  //   Link: "https://www.accvalo.shop/",
  // },
  // {
  //   id: 3,
  //   Title: "Hesap Durağı",
  //   Img: "./Adsız.png",
  //   Description:
  //     "E-Commerce Platform - Dijital ürünleri güvenli bir şekilde alıp satmak için geliştirilmiş ölçeklenebilir e-ticaret platformu. Node.js ve Express.js ile RESTful API'ler tasarlandı ve uygulandı, ürün, sipariş ve kullanıcı yönetimi için MySQL entegrasyonu yapıldı. Güvenli ödeme sistemleri entegre edildi ve güvenilirlik ve kullanıcı güveni sağlamak için ödeme süreçleri optimize edildi.",
  //   Link: "https://hesapduragi.com/",
  // },
  {
    id: 2,
    Title: "Orbis Med Clinics",
    Img: "./orbis.png",
    Company: "Creamake E-Ticaret Ajansı",
    Description:
      "Dental Clinic Website - Türkçe, İngilizce ve Almanca içerikle çok dilli kurumsal site geliştirildi. Dinamik tedavi paketleri, fiyatlandırma ve teklif/rezervasyon iş akışları uygulandı. Güvenli iletişim ve rezervasyon formları ile duyarlı, kullanıcı dostu UI/UX teslim edildi. Cloudflare kullanarak performans ve güvenlik optimize edildi.",
    Link: "https://orbismedclinics.com/",
  },
  {
    id: 3,
    Title: "Base of Influencer",
    Img: "./boi.png",
    Company: "Creamake E-Ticaret Ajansı",
    Description:
      "Influencer Marketing Platform - Markalar ve influencer'ları sorunsuz kampanya yönetimi için bağlayan tam özellikli platform geliştirildi. Kampanya oluşturma, başvuru takibi, içerik onayı ve ödeme iş akışları uygulandı. Web ve mobil platformlarda tutarlı deneyim sağlayan duyarlı ve mobil uyumlu UI tasarlandı. Modern web teknolojileri kullanarak güvenli kimlik doğrulama ve kullanıcı yönetimi ile ölçeklenebilir backend oluşturuldu.",
    Link: "https://baseofinfluencer.com/",
  },
  {
    id: 4,
    Title: "Base of Influencer App",
    Img: "./boiapp.png",
    Company: "Creamake E-Ticaret Ajansı",
    Description:
      "Influencer Marketing Mobile App - Base of Influencer platformunun mobil uygulaması olarak geliştirildi. Kampanya yönetimi, influencer bağlantıları ve içerik takibi için optimize edilmiş mobil deneyim sunar. Cross-platform uyumluluk ile iOS ve Android cihazlarda sorunsuz çalışır. Push notification, gerçek zamanlı bildirimler ve offline çalışma özellikleri ile kullanıcı deneyimi geliştirildi.",
    Link: "https://app.baseofinfluencer.com/",
  },
  {
    id: 5,
    Title: "Acc Studio",
    Img: "./accstudio.co.png",
    Company: "Acc Studio",
    Description:
      "Creative Agency Platform - Yaratıcı ajans hizmetleri sunan modern web platformu geliştirildi. Tasarım, marka kimliği ve dijital pazarlama çözümleri için kapsamlı hizmet portföyü sunuldu. Kullanıcı dostu arayüz ile portfolyo sergileme ve hizmet tanıtımı yapıldı. Responsive tasarım ve modern web teknolojileri kullanılarak profesyonel bir dijital varlık oluşturuldu.",
    Link: "https://accstudio.co/",
  },
  {
    id: 6,
    Title: "Home London Breeze",
    Img: "./hml.png",
    Company: "Creamake E-Ticaret Ajansı",
    Description:
      "Shopify E-Commerce Platform - Lüks moda ve yaşam tarzı ürünleri sunan Shopify tabanlı e-ticaret platformu geliştirildi. Dinamik ürün kategorileri, filtreleme ve arama işlevselliği ile özel Shopify Liquid teması oluşturuldu. Sorunsuz alışveriş deneyimleri için duyarlı ve mobil uyumlu UI tasarlandı. Shopify admin paneli aracılığıyla içerik ve ürün yönetimi verimli bir şekilde gerçekleştirildi.",
    Link: "https://homelondonbreeze.com/",
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
          </SwiperSlide>

          {/* TAB 1: Yetkinliklerim */}
          <SwiperSlide>
            <TabPanel value={value} index={1} dir={theme.direction}>
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
