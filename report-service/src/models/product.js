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
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("not started", "in progress", "done"),
        allowNull: false,
        defaultValue: "not started",
      },
      // timeSpent: {
      //   type: DataTypes.INTEGER,
      // },
      created_at: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      project_due: {
        type: DataTypes.DATEONLY,
        allowNull: false,
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
