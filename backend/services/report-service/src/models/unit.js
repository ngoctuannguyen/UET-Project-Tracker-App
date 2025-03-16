module.exports = (sequelize, DataTypes) => {
    const Unit = sequelize.define('Unit', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      unitCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'units',
      timestamps: false
    });
  
    return Unit;
  };
  