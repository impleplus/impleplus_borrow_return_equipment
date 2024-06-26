/*! 
* Builded by Impleplus application builder (https://builder.impleplus.com) 
* Version 2.0.0 
* Link https://www.impleplus.com 
* Copyright impleplus.com 
* Licensed under MIT (https://mit-license.org) 
*/ 
var Sequelize = require("sequelize");
var DataTypes = require("sequelize").DataTypes;
var _borrow_equipment = require("./borrow_equipment");
var _borrow_equipment_item = require("./borrow_equipment_item");
var _borrower = require("./borrower");
var _equipment = require("./equipment");
var _equipment_group = require("./equipment_group");
var _import_data = require("./import_data");
var _org_department = require("./org_department");
var _org_location = require("./org_location");
var _org_team = require("./org_team");
var _user = require("./user");
var _user_access_base = require("./user_access_base");
var _user_role = require("./user_role");
var _user_role_base = require("./user_role_base");
var _user_role_base_access = require("./user_role_base_access");
var _user_role_base_department = require("./user_role_base_department");
var _user_role_base_location = require("./user_role_base_location");
var _user_role_base_team = require("./user_role_base_team");
var _user_team = require("./user_team");


function db(sequelize) {
	var borrow_equipment = _borrow_equipment(sequelize, DataTypes);
	var borrow_equipment_item = _borrow_equipment_item(sequelize, DataTypes);
	var borrower = _borrower(sequelize, DataTypes);
	var equipment = _equipment(sequelize, DataTypes);
	var equipment_group = _equipment_group(sequelize, DataTypes);
	var import_data = _import_data(sequelize, DataTypes);
	var org_department = _org_department(sequelize, DataTypes);
	var org_location = _org_location(sequelize, DataTypes);
	var org_team = _org_team(sequelize, DataTypes);
	var user = _user(sequelize, DataTypes);
	var user_access_base = _user_access_base(sequelize, DataTypes);
	var user_role = _user_role(sequelize, DataTypes);
	var user_role_base = _user_role_base(sequelize, DataTypes);
	var user_role_base_access = _user_role_base_access(sequelize, DataTypes);
	var user_role_base_department = _user_role_base_department(sequelize, DataTypes);
	var user_role_base_location = _user_role_base_location(sequelize, DataTypes);
	var user_role_base_team = _user_role_base_team(sequelize, DataTypes);
	var user_team = _user_team(sequelize, DataTypes);

    return {
        sequelize,borrow_equipment,borrow_equipment_item,borrower,equipment,equipment_group,import_data,org_department,org_location,org_team,user,user_access_base,user_role,user_role_base,user_role_base_access,user_role_base_department,user_role_base_location,user_role_base_team,user_team
    };
}

module.exports = db;
