const express = require("express");  // Express'i projeye dahil et
/*
    Express framework'ü, web sunucusu oluşturmak ve HTTP isteklerini yönetmek için kullanılır.
*/
const bcrypt = require("bcryptjs");  // Şifreleri güvenli hale getirmek için kullanılan kütüphane (hashleme işlemi yapar)
const jwt = require("jsonwebtoken");
/*
    JWT (JSON Web Token) Nedir?
    -------------------------------------
    - JWT, kullanıcının giriş yaptığını kanıtlayan bir dijital kimlik kartıdır.
    - Kullanıcı giriş yaptıktan sonra sunucu bir token oluşturur ve bunu kullanıcıya yollar.
    - Kullanıcı, sunucuya her istekte bulunurken bu token’ı gönderir.
    - Sunucu, token’ın geçerli olup olmadığını kontrol eder ve ona göre işlem yapar.
*/
const User = require("../models/User");  // Kullanıcı modelini projeye dahil et
/*
    User modeli, kullanıcı bilgilerini veritabanında saklamak ve yönetmek için kullanılır.
*/
const router = express.Router();  // Yeni bir router (yönlendirme) nesnesi oluştur


// Kullanıcı Kaydı (Register)
router.post("/register", async (req, res) => {
    const { name, password, phone_number, mail_adress } = req.body;

    /*
        Eksik bilgi var mı kontrol et
        - Eğer name, password veya mail_adress eksikse hata döndür
    */
    if (!name || !password || !mail_adress) {
        return res.status(400).json({ success: false, error: "Name, password, and mail_adress are required." });
    }

    try {
         /*
            Veritabanında bu e-posta adresi zaten var mı kontrol et
            ----------------------------------
            - Kullanıcılar tekil bir e-posta adresi ile kayıt olabilir.
            - Aynı e-posta adresiyle kayıtlı başka bir kullanıcı varsa, hata mesajı döndürülür.
        */
        const existingUser = await User.findOne({ mail_adress });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "E-mail already registered!" });
        }

         /*
            Kullanıcının şifresini güvenli hale getir (hash'le)
            - Hash işlemi, şifrenin veritabanında düz metin olarak saklanmasını önler
            - '10' ifadesi, şifreyi ne kadar güçlü hashleyeceğini belirler
        */
        const hashedPassword = await bcrypt.hash(password, 10);

        /*
            Yeni kullanıcı oluştur
            - Şifreyi hashlenmiş haliyle kaydet
            - Kullanıcının bilgilerini veritabanına ekle
        */
        const newUser = new User({ name, password: hashedPassword, phone_number, mail_adress });
        await newUser.save();

        /*
            Kullanıcı başarıyla kaydedildiğinde yanıt döndür
        */

        res.status(201).json({ success: true, message: "User registered successfully!" });
    } catch (error) {
         /*
            Sunucu ile ilgili bir hata oluşursa hata mesajı döndür
        */
        res.status(500).json({ success: false, error: error.message });
    }
});

// Kullanıcı Girişi (Login)
router.post("/login", async (req, res) => {
      /*
        Kullanıcıdan gelen giriş bilgilerini al
        --------------------------------------
        - req.body içindeki veriler:
          - mail_adress (e-posta): Kullanıcının kayıtlı e-posta adresi
          - password (şifre): Kullanıcının giriş yaparken kullandığı şifre
    */
    const { mail_adress, password } = req.body;
    /*
        Eksik bilgi var mı kontrol et
        --------------------------------------
        - Eğer e-posta veya şifre girilmemişse hata döndür.
    */
    if (!mail_adress || !password) {
        return res.status(400).json({ success: false, error: "E-mail and password are required." });
    }

    try {
         /*
            Kullanıcıyı veritabanında ara
            --------------------------------------
            - Eğer belirtilen e-posta ile kayıtlı kullanıcı yoksa hata döndür.
        */
        const user = await User.findOne({ mail_adress });
        if (!user) {
            return res.status(400).json({ success: false, error: "User not found" });
        }

        /*
            Kullanıcının girdiği şifreyi kontrol et
            --------------------------------------
            - Kullanıcının girdiği şifre, veritabanındaki hash'lenmiş şifre ile karşılaştırılır.
            - bcrypt.compare() fonksiyonu, şifrenin eşleşip eşleşmediğini kontrol eder.
        */
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: "Invalid credentials" });
        }
         /*
            Kullanıcı için JWT Token oluştur
            --------------------------------------
            - Kullanıcı giriş yaptığında, ona özel bir JWT token oluşturulur.
            - Token, kullanıcının kim olduğunu doğrulamak için kullanılır.
            - expiresIn: "1h" → Bu token 1 saat boyunca geçerli olur.
        */
        const token = jwt.sign(
            { id: user._id, mail_adress: user.mail_adress },  // Token içinde kullanıcı bilgileri tutulur
            process.env.JWT_SECRET || "your_jwt_secret",
            { expiresIn: "1h" }  // Token süresi 1 saat
        );

        /*
            Başarılı giriş yanıtı döndür
            --------------------------------------
            - Eğer kullanıcı doğru e-posta ve şifre ile giriş yaparsa, başarılı bir giriş yanıtı döndürülür.
            - Bu yanıtta:
            - `success: true`: Giriş işleminin başarılı olduğunu belirtir.
            - `message: "Login successful"`: Kullanıcıya başarılı bir şekilde giriş yaptığını bildiren mesajdır.
            - `token`: Kullanıcıya, giriş yaptıktan sonra verilen JWT token’ıdır. Bu token, kullanıcının kimliğini doğrulamak için ilerideki isteklerde kullanılacaktır.
        */
        res.json({ 
            success: true, 
            message: "Login successful", 
            token 
        });
    } catch (error) {
        /*
            Sunucu ile ilgili hata oluşursa hata mesajı döndür
            --------------------------------------
            - Veritabanı bağlantı hatası, ağ hatası gibi durumlarda 500 (Internal Server Error) kodu döndürülür.
        */
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; // - Bu dosyada tanımlanan `router` nesnesini diğer dosyalarda kullanabilmek için `module.exports` ile dışa aktarıyoruz.
