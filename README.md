Here’s the translation of your text to English:  

---

# Portfolio V5  
Hello everyone!  
Let me introduce myself, I'm Eki Zulfar Rachman. On this occasion, I'd like to share the portfolio website project that I've developed.  

**Tech Stack used:**  
- ReactJS  
- Tailwind CSS  
- AOS  
- Firebase  
- Framer Motion  
- Lucide  
- Material UI  
- SweetAlert2  
- Nodemailer (SMTP Mail)

**Website Link:**  
[https://www.eki.my.id/](https://www.eki.my.id/)  

We would appreciate it if you decide to use this project. Please include credit when using it. Thank you! 🙏  

---

# Tutorial: Running the Project  

Here's a simple guide to run this project.  

## Prerequisites  

Ensure that you have already installed:  
- **Node.js**  

---

## Steps to Run the Project  

1. **Download this project:**  

   ```bash  
   git clone https://github.com/EkiZR/Portofolio_V5.git  
   ```  

2. **Install all dependencies:**  

   ```bash  
   npm install  
   ```  
   Or use:  

   ```bash  
   npm install --legacy-peer-deps  
   ```  

3. **Configure SMTP Mail Settings:**

   **Gmail Uygulama Şifresi Alma:**
   - Gmail hesabınıza giriş yapın
   - [Google Hesap Ayarları](https://myaccount.google.com/)'na gidin
   - Güvenlik > 2 Adımlı Doğrulama'yı açın
   - Uygulama Şifreleri > Diğer > Özel ad girin (örn: Portfolio)
   - Oluşturulan 16 haneli şifreyi kopyalayın

   **Environment Variables:**
   - `env.example` dosyasını `.env` olarak kopyalayın
   - Gmail adresinizi ve uygulama şifrenizi girin:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

4. **Run the project:**  

   ```bash  
   npm run dev  
   ```  

5. **Open in browser:**  

   Access the application through the link displayed in your terminal.  

---

## Creating a Production Build  

To create a production-ready build:  

1. Run the build command:  

   ```bash  
   npm run build  
   ```  

2. The build files will be saved in the `dist` folder. You can upload this folder to your hosting server.  

---

## Deployment (Vercel)

1. **Vercel'e deploy edin:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Environment Variables'ları Vercel'de ayarlayın:**
   - Vercel Dashboard > Project Settings > Environment Variables
   - `EMAIL_USER` ve `EMAIL_PASS` değerlerini ekleyin

---

## Notes  

If you encounter issues while running the project, ensure that:  
- Node.js is correctly installed.  
- You're in the correct project directory.  
- All dependencies are installed without errors.  
- SMTP mail ayarları doğru yapılandırılmış.

---

## Firebase Configuration  

To configure Firebase for this project, follow these steps:  

1. **Add Firebase to the Project:**  
   - Go to the [Firebase Console](https://console.firebase.google.com/).  
   - Create a new project or use an existing one.  

2. **Enable Firestore Database:**  
   - Create a database.  

3. **Go to Project Settings:**  
   - Click the settings icon.  
   - Copy the Firebase configuration.  

4. **Go to Rules:**  
   - Set the rules to `true`.  

5. **Adjust the Collection Structure:**  
   - Set up the collections as shown in the following images:  

   ![Collection Structure Example 1](https://github.com/user-attachments/assets/38580122-08a4-4499-a8fd-0f253652a239)  
   ![Collection Structure Example 2](https://github.com/user-attachments/assets/d563d7ad-f1ab-46ff-8185-640dcebd0363)  

6. **Update `firebase.js` and `firebase-comment.js` Files:**  
   - Replace the `firebaseConfig` content with your Firebase configuration.  

---
