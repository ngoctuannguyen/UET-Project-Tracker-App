module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      componentCode: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "components",
          key: "componentCode",
        },
      },
      reportText: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      reportAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      employeeId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // imagePath: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      // },
    },
    {
      tableName: "reports",
      timestamps: false,
    }
  );

  Report.associate = function (models) {
    Report.belongsTo(models.Component, {
      foreignKey: "componentCode",
      targetKey: "componentCode",
      as: "ComponentDetail",
    });
    // Nếu bạn có model Employee và muốn liên kết với employeeId:
    // Report.belongsTo(models.Employee, {
    //   foreignKey: 'employeeId', // Giả sử employeeId là FK đến một trường nào đó trong Employee
    //   targetKey: 'userId', // Ví dụ: nếu Employee có trường userId là STRING và unique
    //   as: 'Reporter'
    // });
  };

  return Report;
};
