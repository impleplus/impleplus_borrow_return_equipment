/*!
* Builded by Impleplus application builder (https://builder.impleplus.com)
* Version 2.0.0
* Link https://www.impleplus.com
* Copyright impleplus.com
* Licensed under MIT (https://mit-license.org)
*/
var impleplusController = require('../controllers/impleplus-controller.js');
var impleplusHelper = require('../helper/impleplus-helper.js');
var common = require('../lib/common');

module.exports = function (app, passport) {
    app.get('/', impleplusHelper.requireLoggedIn, impleplusController.index);
    app.get('/404', impleplusController.error404);  
    app.get('/500', impleplusController.error500);
    app.get('/503', impleplusController.error503);
    app.get('/505', impleplusController.error505);   
	app.get('/login', impleplusController.login);
	app.post('/login', async (req, res, next) => {
		await passport.authenticate('local', {session: false}, (err, user, info) => {
			if(user){
				const userClaim = {
					id: user.id,
					department_id: user.department_id,
					location_id: user.location_id,
					status_id: user.status_id,
					user_code: user.user_code,
					user_name: user.user_name,
					picture: user.picture==null||user.picture==undefined||user.picture==""?"/static/avatars/default.jpg":user.picture,
					rememberme:req.body.rememberme
				}

				const securityKey = Buffer.from(__config.cookie.securityKey);
				const initVector = Buffer.from(__config.cookie.initVector);
				const encryptData = common.encryptData(securityKey, initVector, JSON.stringify(userClaim));	

				if(userClaim.rememberme){
					res.cookie(__config.cookie.name, encryptData, { domain:__config.cookie.domain, maxAge:  24 * 60 * 60 * 1000 * Number(__config.cookie.maxAge), httpOnly: true });
				}	
				else {
					res.cookie(__config.cookie.name, encryptData, { domain:__config.cookie.domain, httpOnly: true });
				}						

				res.status(200).json({ success: true, redirect:"/" });
			}
			else {
				res.status(200).json({ success: true, message:err})	
			}
		}) (req, res, next);
	});
	app.get('/logout', impleplusController.logout);
  	app.get('/auth', impleplusHelper.requireLoggedIn, impleplusController.authInfo);
	app.post('/auth/save', impleplusHelper.requireLoggedIn, impleplusController.authInfoSave);
	app.get('/auth/password', impleplusHelper.requireLoggedIn, impleplusController.authChangePassword);
	app.post('/auth/password/save', impleplusHelper.requireLoggedIn, impleplusController.authChangePasswordSave);    
	app.post('/assign/save', impleplusHelper.requireLoggedIn, impleplusController.assignSave);
    app.get('/import_datas', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.import_datas);
    app.post('/import_datas', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.import_dataPage);
    app.get('/import_data/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.import_dataEdit);
    app.get('/import_data/template', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.import_dataTemplate);
    app.post('/import_data/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.import_dataSave);
    app.get('/import_data/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.import_dataExport);  
	app.get('/organization/locations', impleplusHelper.requireLoggedIn, impleplusController.locations);
	app.post('/organization/locationpage', impleplusHelper.requireLoggedIn, impleplusController.locationPage);
  	app.get('/organization/location/edit', impleplusHelper.requireLoggedIn, impleplusController.locationEdit);
	app.post('/organization/location/save', impleplusHelper.requireLoggedIn, impleplusController.locationSave);
	app.post('/organization/location/delete', impleplusHelper.requireLoggedIn, impleplusController.locationDelete);
	app.get('/organization/departments', impleplusHelper.requireLoggedIn, impleplusController.departments);
	app.post('/organization/departmentpage', impleplusHelper.requireLoggedIn, impleplusController.departmentPage);
  	app.get('/organization/department/edit', impleplusHelper.requireLoggedIn, impleplusController.departmentEdit);
	app.post('/organization/department/save', impleplusHelper.requireLoggedIn, impleplusController.departmentSave);
	app.post('/organization/department/delete', impleplusHelper.requireLoggedIn, impleplusController.departmentDelete);
	app.get('/organization/teams', impleplusHelper.requireLoggedIn, impleplusController.teams);
	app.post('/organization/teampage', impleplusHelper.requireLoggedIn, impleplusController.teamPage);
  	app.get('/organization/team/edit', impleplusHelper.requireLoggedIn, impleplusController.teamEdit);
	app.post('/organization/team/save', impleplusHelper.requireLoggedIn, impleplusController.teamSave);
	app.post('/organization/team/delete', impleplusHelper.requireLoggedIn, impleplusController.teamDelete);        
	app.get('/users', impleplusHelper.requireLoggedIn, impleplusController.users);
	app.post('/userpage', impleplusHelper.requireLoggedIn, impleplusController.userPage);
	app.get('/user/edit', impleplusHelper.requireLoggedIn, impleplusController.userEdit);
	app.post('/user/delete', impleplusHelper.requireLoggedIn, impleplusController.userDelete);
	app.post('/user/save', impleplusHelper.requireLoggedIn, impleplusController.userSave);
	app.get('/user/roles', impleplusHelper.requireLoggedIn, impleplusController.roles);
	app.post('/user/role/save', impleplusHelper.requireLoggedIn, impleplusController.roleSave);
	app.get('/user/password', impleplusHelper.requireLoggedIn, impleplusController.password);
	app.post('/user/password/save', impleplusHelper.requireLoggedIn, impleplusController.passwordSave);
	app.get('/user/rolebases', impleplusHelper.requireLoggedIn, impleplusController.rolebases);
	app.post('/user/rolebasepage', impleplusHelper.requireLoggedIn, impleplusController.rolebasePage);
  	app.get('/user/rolebase/edit', impleplusHelper.requireLoggedIn, impleplusController.rolebaseEdit);
	app.post('/user/rolebase/delete', impleplusHelper.requireLoggedIn, impleplusController.rolebaseDelete);
	app.post('/user/rolebase/save', impleplusHelper.requireLoggedIn, impleplusController.rolebaseSave);
	app.get('/user/rolebase/access', impleplusHelper.requireLoggedIn, impleplusController.rolebaseAccess);
	app.post('/user/rolebase/access/save', impleplusHelper.requireLoggedIn, impleplusController.rolebaseAccessSave);
	app.get('/user/rolebase/organization', impleplusHelper.requireLoggedIn, impleplusController.rolebaseOrganization);
	app.post('/user/rolebase/organization/save', impleplusHelper.requireLoggedIn, impleplusController.rolebaseOrganizationSave);
	app.post('/borrow_equipment', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.borrow_equipmentPage);
	app.get('/borrow_equipment', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.borrow_equipmentAll);
	app.post('/borrow_equipment/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.borrow_equipmentDelete);
	app.get('/borrow_equipment/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.borrow_equipmentEdit);
	app.get('/borrow_equipment/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.borrow_equipmentExport);
	app.post('/borrow_equipment/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.borrow_equipmentSave);
	app.post('/borrower', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.borrowerPage);
	app.get('/borrower', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.borrowerAll);
	app.post('/borrower/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.borrowerDelete);
	app.get('/borrower/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.borrowerEdit);
	app.get('/borrower/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.borrowerExport);
	app.post('/borrower/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.borrowerSave);
	app.post('/equipment', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.equipmentPage);
	app.get('/equipment', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.equipmentAll);
	app.post('/equipment/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.equipmentDelete);
	app.get('/equipment/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.equipmentEdit);
	app.get('/equipment/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.equipmentExport);
	app.post('/equipment/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.equipmentSave);
	app.post('/equipment_group', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.equipment_groupPage);
	app.get('/equipment_group', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.equipment_groupAll);
	app.post('/equipment_group/delete', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("delete"), impleplusController.equipment_groupDelete);
	app.get('/equipment_group/edit', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("view"), impleplusController.equipment_groupEdit);
	app.get('/equipment_group/export', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("export"), impleplusController.equipment_groupExport);
	app.post('/equipment_group/save', impleplusHelper.requireLoggedIn, impleplusHelper.requireAuthorize("edit"), impleplusController.equipment_groupSave)
}
