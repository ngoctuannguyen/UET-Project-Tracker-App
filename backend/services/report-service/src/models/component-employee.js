const component = require("./component");
const product = require("./product");

module.exports = (sequelize, DataTypes) => {
    const Component_Employee = sequelize.define('Component_Employee', {
      componentCode: { 
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'components',
          key: 'componentCode'
        }
      },
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      tableName: 'component_employees',
      timestamps: false
    });
  
    return Component_Employee
  };
  