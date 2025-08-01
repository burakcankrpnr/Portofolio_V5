import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body;

    // Gerekli alanları kontrol et
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'İsim, email ve mesaj alanları zorunludur' 
      });
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Geçerli bir email adresi giriniz' 
      });
    }

    // SMTP transporter oluştur
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // Gmail kullanıyoruz
      auth: {
        user: process.env.EMAIL_USER, // Gmail adresiniz
        pass: process.env.EMAIL_PASS  // Gmail uygulama şifresi
      }
    });

    // Mail içeriği
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'burakcan07@icloud.com', // Size gelecek mail adresi
      subject: `Portfolio'dan Yeni Mesaj - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            Portfolio'dan Yeni İletişim Mesajı
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Gönderen Bilgileri:</h3>
            <p><strong>İsim:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Mesaj:</h3>
            <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            <p>Bu mesaj portfolio sitenizden gönderilmiştir.</p>
          </div>
        </div>
      `
    };

    // Maili gönder
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Mesaj başarıyla gönderildi!' 
    });

  } catch (error) {
    console.error('Mail gönderme hatası:', error);
    res.status(500).json({ 
      message: 'Mail gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
    });
  }
} 