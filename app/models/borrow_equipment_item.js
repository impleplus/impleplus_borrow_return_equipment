
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var borrow_equipment_item = sequelize.define('borrow_equipment_item', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		borrow_equipment_id: {type: DataTypes.STRING(36), allowNull: true },
		start_date: {type: DataTypes.DATE,allowNull: true},
		return_date: {type: DataTypes.DATE,allowNull: true},
		return_status: {type: DataTypes.SMALLINT,allowNull: true},
		quantity: {type: DataTypes.SMALLINT,allowNull: true},
		receiver: {type: DataTypes.STRING(36), allowNull: true },
		receive_date: {type: DataTypes.DATE,allowNull: true},
		borrow_equipment_name: {type: DataTypes.STRING(100), allowNull: true },
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'borrow_equipment_item', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return borrow_equipment_item;
};