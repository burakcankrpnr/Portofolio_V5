import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  MessageCircle, 
  UserCircle2, 
  Loader2, 
  AlertCircle, 
  Send, 
  ImagePlus, 
  X 
} from 'lucide-react';
import AOS from "aos";
import "aos/dist/aos.css";

/** 
 * Tek tek yorumları gösteren Comment bileşeni (değişmeden kullanılıyor)
 */
const Comment = memo(({ comment, formatDate, index }) => (
  <div 
    className="px-4 pt-4 pb-2 rounded-xl bg-gece border border-cizgi"
  >
    <div className="flex items-start gap-3">
      {comment.profileImage ? (
        <img
          src={comment.profileImage}
          alt={`${comment.userName}'s profile`}
          className="w-10 h-10 rounded-full object-cover border-2 border-cizgi"
          loading="lazy"
        />
      ) : (
        <div className="p-2 rounded-full bg-gece text-lila transition-colors">
          <UserCircle2 className="w-5 h-5" />
        </div>
      )}
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h4 className="font-medium text-kar truncate">{comment.userName}</h4>
          <span className="text-xs text-sis whitespace-nowrap">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="text-sis text-sm break-words leading-relaxed relative bottom-2">
          {comment.content}
        </p>
      </div>
    </div>
  </div>
));

/**
 * Yorum formu bileşeni
 */
const CommentForm = memo(({ onSubmit, isSubmitting, error }) => {
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  /**
   * Base64 olarak önizleme yapmak üzere
   * dosyanın okunmasını sağlar
   */
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // 5MB üzeri dosyaları engelliyoruz
      if (file.size > 5 * 1024 * 1024) return;
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, []);

  /**
   * Textarea otomatik yüksekliği için
   */
  const handleTextareaChange = useCallback((e) => {
    setNewComment(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  /**
   * Form Submit
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!newComment.trim() || !userName.trim()) return;
    
    onSubmit({ newComment, userName, imageFile });
    // Form temizliği
    setNewComment('');
    setUserName('');
    setImagePreview(null);
    setImageFile(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [newComment, userName, imageFile, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* İsim Alanı */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-kar">
          İsim <span className="text-kayisi">*</span>
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Adınızı girin"
          className="field"
          required
        />
      </div>

      {/* Mesaj Alanı */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-kar">
          Mesaj <span className="text-kayisi">*</span>
        </label>
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleTextareaChange}
          placeholder="Mesajınızı buraya yazın..."
          className="field resize-none min-h-[120px]"
          required
        />
      </div>

      {/* Profil Fotoğrafı */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-kar">
          Profil Fotoğrafı <span className="text-sis">(opsiyonel)</span>
        </label>
        <div className="flex items-center gap-4 p-4 bg-gece border border-cizgi rounded-xl">
          {imagePreview ? (
            <div className="flex items-center gap-4">
              <img
                src={imagePreview}
                alt="Profil önizlemesi"
                className="w-16 h-16 rounded-full object-cover border-2 border-cizgi"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="flex items-center gap-2 px-4 py-2 
                           rounded-full bg-red-500/20 text-kayisi 
                           hover:bg-red-500/30 transition-all group"
              >
                <X className="w-4 h-4" />
                <span>Fotoğrafı Kaldır</span>
              </button>
            </div>
          ) : (
            <div className="w-full">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-cizgi text-lila hover:border-kayisi hover:text-kayisi transition-colors group"
              >
                <ImagePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Profil Fotoğrafını Seçin</span>
              </button>
              <p className="text-center text-sis text-sm mt-2">
                Maksimum dosya boyutu: 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Butonu */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="relative flex items-center justify-center gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Yayınlanıyor...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Yorum Gönder</span>
            </>
          )}
        </div>
      </button>
    </form>
  );
});

/**
 * Ana Komentar bileşeni
 */
const Komentar = () => {
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // AOS başlatma
    AOS.init({
      once: false,
      duration: 1000,
    });
  }, []);

  /**
   * Tarih formatlamak için basit bir yardımcı fonksiyon
   */
  const formatDate = useCallback((date) => {
    if (!date) return '';
    // date normal bir JS Date nesnesi
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Şimdi';
    if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    // 7 günü geçtiyse normal tarih formatı
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, []);

  /**
   * Yorum formundan gelen veriyi sadece yerel state'e ekliyoruz
   */
  const handleCommentSubmit = useCallback(async ({ newComment, userName, imageFile }) => {
    setError('');
    setIsSubmitting(true);

    try {
      // Seçili bir resim varsa base64 preview'i kullanıyoruz
      let profileImageUrl = null;
      if (imageFile) {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        await new Promise((resolve) => {
          reader.onloadend = resolve;
        });
        profileImageUrl = reader.result; // base64 string
      }

      // Firestore olmadan, sadece yerel state'te tutuyoruz
      const newCommentData = {
        id: `${Date.now()}`, // basit bir unique ID
        content: newComment,
        userName,
        profileImage: profileImageUrl,
        createdAt: new Date(), // serverTimestamp yerine
      };

      setComments((prev) => [newCommentData, ...prev]);
    } catch {
      setError('Yorum eklenirken hata oluştu. Tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <div 
      className="w-full overflow-hidden rounded-[28px] border border-cizgi bg-murekkep"
    >
      <div className="p-6 border-b border-cizgi">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gece">
            <MessageCircle className="w-6 h-6 text-kayisi" />
          </div>
          <h3 className="text-xl font-semibold text-kar">
            Yorumlar <span className="text-kayisi">({comments.length})</span>
          </h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div 
            className="flex items-center gap-2 p-4 text-kayisi bg-red-500/10 
                       border border-red-500/20 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Yorum Ekleme Formu */}
        <div>
          <CommentForm 
            onSubmit={handleCommentSubmit} 
            isSubmitting={isSubmitting} 
            error={error} 
          />
        </div>

        {/* Yorumlar Listesi */}
        <div 
          className="space-y-4 h-[300px] overflow-y-auto custom-scrollbar"
        >
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <UserCircle2 className="w-12 h-12 text-kayisi mx-auto mb-3 opacity-50" />
              <p className="text-sis">Henüz yorum yok. İlk siz yorum yapın!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <Comment 
                key={comment.id} 
                comment={comment} 
                formatDate={formatDate}
                index={index}
              />
            ))
          )}
        </div>
      </div>

      {/* Özel scrollbar stilleri */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2A2650;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9C97C4;
        }
      `}</style>
    </div>
  );
};

export default Komentar;
