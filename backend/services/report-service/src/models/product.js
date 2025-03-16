module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      productCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      progress: {
        type: DataTypes.STRING
      },
      stage: {
        type: DataTypes.STRING
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
  