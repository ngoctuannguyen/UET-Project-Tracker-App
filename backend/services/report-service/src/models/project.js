module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
      id: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      projectCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'projects',
      timestamps: false
    });
  
    return Project;
  };
  