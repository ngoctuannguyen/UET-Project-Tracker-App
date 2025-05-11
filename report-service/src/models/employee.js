module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define('Employee', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      employeeCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dob: {
        type: DataTypes.DATEONLY
      }
    }, {
      tableName: 'employees',
      timestamps: false
    });
  
    return Employee;
  };
  