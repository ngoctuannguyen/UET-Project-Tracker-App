
module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define('Report', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      componentCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      reportAt : {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'reports',
      timestamps: false
    });
  
    return Report;
  };
  