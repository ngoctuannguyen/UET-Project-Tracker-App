module.exports = (sequelize, DataTypes) => {
  const Component = sequelize.define(
    "Component",
    {
      componentCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      productCode: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "products",
          key: "productCode",
        },
      },
    },
    {
      tableName: "components",
      timestamps: false,
    }
  );

  Component.associate = function (models) {
    Component.belongsTo(models.Product, {
      foreignKey: "productCode",
      targetKey: "productCode",
      as: "Product",
    });
  };

  return Component;
};
