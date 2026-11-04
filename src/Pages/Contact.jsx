import { useState } from "react";
import { Send } from "lucide-react";
import Swal from "sweetalert2";
import SocialLinks from "../components/SocialLinks";
import Komentar from "../components/Commentar";

const EMAIL = "burikcankorpinar@gmail.com";

const swalTheme = {
  background: "#17142F",
  color: "#F3F0FF",
  confirmButtonColor: "#FFB27A",
};

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    Swal.fire({
      ...swalTheme,
      title: "Mesajınız gönderiliyor",
      html: "Birkaç saniye sürebilir.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await e.target.submit();
      Swal.fire({
        ...swalTheme,
        title: "Mesajınız gönderildi",
        text: "En kısa sürede size dönüş yapacağım.",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
      });
      setFormData({ name: "", email: "", message: "" });
    } catch {
      Swal.fire({
        ...swalTheme,
        title: "Mesaj gönderilemedi",
        text: `Bağlantınızı kontrol edip tekrar deneyin ya da doğrudan ${EMAIL} adresine yazın.`,
        icon: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="Contact" className="border-t border-cizgi py-24 md:py-32" aria-labelledby="contact-heading">
      <div className="shell">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2
              id="contact-heading"
              className="display text-5xl font-semibold leading-[0.95] text-kar md:text-7xl"
            >
              Bir projeniz mi var?
            </h2>
            <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-sis md:text-lg">
              Yeni bir site, mevcut sitenizin hızlanması ya da bir e-ticaret entegrasyonu.
              Kısaca anlatın, en kısa sürede dönüş yapayım.
            </p>
            <a
              href={`mailto:${EMAIL}`}
              className="display mt-8 inline-block break-all text-2xl font-medium text-kayisi link-underline sm:text-[1.75rem]"
            >
              {EMAIL}
            </a>
            <div className="mt-12">
              <SocialLinks />
            </div>
          </div>

          <form
            action="https://formsubmit.co/burikcankorpinar7@gmail.com"
            method="POST"
            onSubmit={handleSubmit}
            className="space-y-5 rounded-[28px] border border-cizgi bg-murekkep p-5 sm:p-8 lg:col-span-7"
          >
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="_captcha" value="true" />
            <input type="hidden" name="_next" value="https://burakcankorpinar.dev/" />
            <input type="hidden" name="_subject" value="New Contact Form Message" />

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-sis">Adınız</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="field"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-sis">E-posta adresiniz</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="field"
                  required
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm text-sis">Projeniz hakkında</span>
              <textarea
                name="message"
                rows={7}
                value={formData.message}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Ne yapmak istiyorsunuz, ne zamana yetişmeli?"
                className="field resize-none"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Gönderiliyor…" : "Mesajı gönder"}
            </button>
          </form>
        </div>

        <div className="mt-20 grid gap-10 md:mt-28 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h3 className="display text-4xl font-semibold leading-none text-kar md:text-5xl">
              Ziyaretçi defteri
            </h3>
            <p className="mt-4 max-w-[36ch] text-[17px] leading-relaxed text-sis">
              Siteyi beğendiyseniz ya da bir öneriniz varsa buraya not bırakın.
            </p>
          </div>
          <div className="lg:col-span-7">
            <Komentar />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
