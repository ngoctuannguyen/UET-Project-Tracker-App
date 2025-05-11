module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
      productCode: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      progress: {
        type: DataTypes.STRING
      },
      status: {
        type: DataTypes.ENUM,
        values: ['in-progress', 'completed', 'on-hold'],},
      timeSpent: {
        type: DataTypes.INTEGER
      }
    }, {
      tableName: 'products',
      timestamps: false
    });
  
    return Product;
  };
  