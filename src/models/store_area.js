'use strict';
module.exports = (sequelize, DataTypes) => {
  const store_area = sequelize.define('store_area', {
    storeId: DataTypes.INTEGER,
    areaId: DataTypes.INTEGER
  }, {});
  store_area.associate = function(models) {
    // associations can be defined here
  }; 
  return store_area;
};