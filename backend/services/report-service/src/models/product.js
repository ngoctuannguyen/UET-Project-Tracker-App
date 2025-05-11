module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
      productCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true // Đặt productCode làm khóa chính

      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      currentProgress: {
        type: DataTypes.INTEGER
      },
      timeSpent: {
        type: DataTypes.INTEGER
      }
    }, {
      tableName: 'products',
      timestamps: false
    });
  
    return Product;
  };
  