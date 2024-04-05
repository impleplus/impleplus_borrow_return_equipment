
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var equipment = sequelize.define('equipment', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		name: {type: DataTypes.STRING(100), allowNull: true },
		equipment_group_id: {type: DataTypes.STRING(36), allowNull: true },
		image: {type: DataTypes.STRING(100), allowNull: true },
		serial: {type: DataTypes.STRING(20), allowNull: true },
		detail: {type: DataTypes.TEXT('medium'),allowNull: true},
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'equipment', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return equipment;
};