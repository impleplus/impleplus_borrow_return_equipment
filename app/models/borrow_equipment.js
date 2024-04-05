
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var borrow_equipment = sequelize.define('borrow_equipment', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		borrower_id: {type: DataTypes.STRING(36), allowNull: true },
		objective: {type: DataTypes.STRING(100), allowNull: true },
		remark: {type: DataTypes.TEXT('medium'),allowNull: true},
		approve_by: {type: DataTypes.STRING(36), allowNull: true },
		createdate: {type: DataTypes.DATE,allowNull: true},
		createby: {type: DataTypes.STRING(36), allowNull: true },
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'borrow_equipment', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return borrow_equipment;
};