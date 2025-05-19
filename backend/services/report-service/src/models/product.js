module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      productCode: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        // Đổi tên trường này thành productName để nhất quán
        type: DataTypes.STRING,
        allowNull: false,
      },
      progress: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["in-progress", "completed", "on-hold"],
      },
      timeSpent: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "products",
      timestamps: false,
    }
  );

  // <<< THÊM: Định nghĩa mối quan hệ >>>
  Product.associate = function (models) {
    Product.hasMany(models.Component, {
      foreignKey: "productCode",
      sourceKey: "productCode",
      as: "Components", // Alias cho danh sách các components
    });
  };

  return Product;
};
