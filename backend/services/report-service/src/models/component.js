module.exports = (sequelize, DataTypes) => {
    const Component = sequelize.define('Component', {
      componentCode: { 
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      progress: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
    }, {
      tableName: 'components',
      timestamps: false
    });
  
    return Component
  };
  