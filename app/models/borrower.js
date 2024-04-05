
/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 

module.exports = function(sequelize, DataTypes) {
  var borrower = sequelize.define('borrower', {
		id: { type: DataTypes.STRING(36), allowNull: false, primaryKey: true },
		firstname: {type: DataTypes.STRING(30), allowNull: true },
		lastname: {type: DataTypes.STRING(30), allowNull: true },
		employee_code: {type: DataTypes.STRING(20), allowNull: true },
		position: {type: DataTypes.STRING(30), allowNull: true },
		business_unit: {type: DataTypes.STRING(50), allowNull: true },
		department: {type: DataTypes.STRING(50), allowNull: true },
		phone: {type: DataTypes.STRING(30), allowNull: true },
		email: {type: DataTypes.STRING(30), allowNull: true },
		remark: {type: DataTypes.TEXT('medium'),allowNull: true},
		owner_id: {type: DataTypes.STRING(36), allowNull: true },
		assign: {type: DataTypes.TEXT('medium'),allowNull: true},
		create_by: {type: DataTypes.STRING(36), allowNull: true },
		create_date: {type: DataTypes.DATE,allowNull: true},
		update_by: {type: DataTypes.STRING(36), allowNull: true },
		update_date: {type: DataTypes.DATE,allowNull: true}
  },{
    sequelize, tableName: 'borrower', timestamps: false, indexes: [{name: "PRIMARY",unique: true,using: "BTREE",fields: [{ name: "id" }]}]
  });
  return borrower;
};