const cloudinary = require("cloudinary").v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: "db7jn3ooa",
  api_key: "219965812249282",
  api_secret: "gND9TZqbEpP6kqXzqVHLiKrPcU8",
  secure: true,
});

module.exports = cloudinary;
