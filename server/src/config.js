const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// MongoDB bağlantı fonksiyonu
const connectDB = async () => {
    try {
        // MongoDB'ye bağlanma
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, // Artık kullanmıyoruz, eski bir seçenek, fakat bağlantı için öncelikle yine de yazabiliriz.
            useUnifiedTopology: true // Bu da aynı şekilde eski bir seçenek.
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB Connection Error: ${err.message}`);
        process.exit(1); // Bağlantı hatası durumunda uygulamayı sonlandır
    }
};

// MongoDB bağlantısını dışa aktarma
module.exports = connectDB;