const { Sequelize } = require("sequelize");
const config = require("../config/database.config");

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// Khởi tạo Sequelize với đầy đủ tham số
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    timezone: dbConfig.timezone,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
  }
);

const db = {};

// Import models theo đúng tên bảng trong database
db.User = require("./User")(sequelize, Sequelize.DataTypes);
db.Role = require("./Role")(sequelize, Sequelize.DataTypes);
db.UserRole = require("./UserRole")(sequelize, Sequelize.DataTypes);

db.Category = require("./Category")(sequelize, Sequelize.DataTypes);
db.Brand = require("./Brand")(sequelize, Sequelize.DataTypes);
db.Supplier = require("./Supplier")(sequelize, Sequelize.DataTypes);

db.Product = require("./Product")(sequelize, Sequelize.DataTypes);
db.ProductDetail = require("./ProductDetail")(sequelize, Sequelize.DataTypes);
db.Size = require("./Size")(sequelize, Sequelize.DataTypes);
db.Color = require("./Color")(sequelize, Sequelize.DataTypes);

db.Cart = require("./Cart")(sequelize, Sequelize.DataTypes);
db.Order = require("./Order")(sequelize, Sequelize.DataTypes);
db.OrderDetail = require("./OrderDetail")(sequelize, Sequelize.DataTypes);

db.PaymentMethod = require("./PaymentMethod")(sequelize, Sequelize.DataTypes);
db.ShippingMethod = require("./ShippingMethod")(sequelize, Sequelize.DataTypes);

db.ImportReceipt = require("./ImportReceipt")(sequelize, Sequelize.DataTypes);
db.ImportReceiptDetail = require("./ImportReceiptDetail")(
  sequelize,
  Sequelize.DataTypes
);

db.Voucher = require("./Voucher")(sequelize, Sequelize.DataTypes);
db.Review = require("./Review")(sequelize, Sequelize.DataTypes);
db.Wishlist = require("./Wishlist")(sequelize, Sequelize.DataTypes);
db.TokenRefresh = require("./TokenRefresh")(sequelize, Sequelize.DataTypes);

// Setup associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
