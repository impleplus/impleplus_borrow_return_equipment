/*!
* Builded by Impleplus application builder (https://builder.impleplus.com)
* Version 2.0.0
* Link https://www.impleplus.com
* Copyright impleplus.com
* Licensed under MIT (https://mit-license.org)
*/
var _ = require("lodash");
const common = require('../lib/common');
const moment = require('moment');
var fs = require("fs");
const path = require('path');
const Excel = require('exceljs');
const extract = require('extract-zip');
var mv = require('mv');
var impleplusHelper = require('../helper/impleplus-helper');
const { v4: uuidv4 } = require('uuid');
const store = require('store2');
const db  = require('../models/init-models');
const sequelize = require('../helper/db-connect');
var dbHelper = new (require('../helper/db'))(db(sequelize));

var exports = module.exports = {};
exports.index = async function (req, res, next) {
	try 
	{
		var redirectUrl = req.user.default_url??"";
		if(redirectUrl != "/" && redirectUrl!="." && redirectUrl!="") {
            res.redirect(redirectUrl);
		}
		else {
			res.render('index', { title: "impleplus's Application Builder"});
		}
	}
	catch (err) {
		next(err);
	}
}
exports.error404 = async function (req, res, next) {
	try {
		res.render('error/404', { title: 'Error 404', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.error500 = async function (req, res, next) {
	try {
		res.render('error/500', { title: 'Error 500', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.error503 = async function (req, res, next) {
	try {
		res.render('error/503', { title: 'Error 503', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.error505 = async function (req, res, next) {
	try {
		res.render('error/505', { title: 'Error 505', layout: false });
	}
	catch (err) {
		next(err);
	}
}
exports.assignSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"save");
        const tableName = req.body.tableName;
        const [entityData] = await Promise.all([
        	dbHelper.findOne(tableName,{'id':param.id})
        ]);
        var oriAssignsValue = [];
        if(entityData.assign) {
            oriAssignsValue = JSON.parse(entityData.assign);
        }
        var assignsValue = oriAssignsValue;
        var assign_to_id = "";
        if(req.body.assign_to_cat == "department"){
            assign_to_id = req.body.department_id;
        }
        else if(req.body.assign_to_cat == "team"){
            assign_to_id = req.body.team_id;
        }
        else if(req.body.assign_to_cat == "user"){
            assign_to_id = req.body.user_id;
        }
        var fileName = "";
        if (req.files != undefined) {
			if (req.files.file != undefined ) {
				fileName = req.files.file.name;
			}
		}	
        var newId = uuidv4();
        if(req.body.action == "open") {            
            assignsValue.push({
                id:newId,
                date:common.toMySqlDateTimeFormat(new Date()),
                assign_by_id:req.user.id,
                assign_by_name:req.user.user_name,
                assign_to_id:assign_to_id,
                action:req.body.action,
                assign_to_cat:req.body.assign_to_cat,
                reason:req.body.reason,     
                file:fileName
            });
        }
        else if(req.body.action == "cancel") {
            var assignsValue = oriAssignsValue;
            _.remove(assignsValue,{id: req.body.id});
        }
        else if(req.body.action == "accept" || req.body.action == "reject") {
            var index = _.findIndex(assignsValue, {id: req.body.id});
            
            if(index != -1) {
                var updateDate = assignsValue[index];
                updateDate.action = "close";
                assignsValue.splice(index, 1, updateDate);                 
            }
            assignsValue.push({
                id:newId,
                date:common.toMySqlDateTimeFormat(new Date()),
                assign_by_id:req.user.id,
                assign_by_name:req.user.user_name,
                assign_to_id:assign_to_id,
                action:req.body.action,
                assign_to_cat:req.body.assign_to_cat,
                reason:req.body.reason,     
                file:fileName
            });
            if(req.body.action == "accept"){
                await dbHelper.update(tableName,{owner_id:assign_to_id}, {'id':param.id})
            }
        }
        const uploadPath = __config.uploadPath;
		if (req.files != undefined) {
			await common.uploadFile(req.files.file, path.join(uploadPath,newId));
		}
        await dbHelper.update(tableName,{assign:JSON.stringify(assignsValue)},{'id':param.id});
        return res.status(200).json({ success: true, message: 'Assign complete', refresh:true });
    }
    catch (err) {
        next(err);
    }
}
exports.locations = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
  
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_locations] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_location ${sqlWhere}) totalcount from org_location ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (org_locations.length > 0) { totalcount = org_locations[0].totalcount; } 
		let org_locationsPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('organization/location/index', { title: 'locations', org_locations, org_locationsPagination,param});
	}
	catch (err) {
		next(err);
	}
}

exports.locationPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
         
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_locations] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_location ${sqlWhere}) totalcount from org_location ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (org_locations.length > 0) { totalcount = org_locations[0].totalcount; } 
		let org_locationsPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message: '' ,org_locations, org_locationsPagination,param });
	}
	catch (err) {
		next(err);
	}
}
exports.locationEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [org_location] = await Promise.all([
        	param.location!=undefined?dbHelper.findOne("org_location",{'id':param.location}):{}
        ]);
		
		res.render('organization/location/edit', { title: 'location: '+org_location.id,  org_location,param});
	}
	catch (err) {
		next(err);
	}
}
exports.locationDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
			dbHelper.delete("org_department",{'location_id':param.deleteId}),
			dbHelper.delete("org_team",{'location_id':param.deleteId}),
            dbHelper.delete("org_location",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
exports.locationSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		var saveData = {
			name: req.body.name,
			address: req.body.address,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.location == undefined) { saveData.id = uuidv4(); redirect = `/organization/location/edit?location=${saveData.id}` }                
        await param.location!=undefined?dbHelper.update("org_location",saveData,{'id':param.location}):dbHelper.create("org_location",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect });
	}
	catch (err) {
		next(err);
	}
}
exports.departments = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }

		arrWhere.push(`location_id = '${param.location??""}'`);
		
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_departments] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_department ${sqlWhere}) totalcount  from org_department ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (org_departments.length > 0) { totalcount = org_departments[0].totalcount; } 
		let org_departmentsPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('organization/department/index', { title: 'departments', org_departments:org_departments, org_departmentsPagination:org_departmentsPagination,param});
	}
	catch (err) {
		next(err);
	}
}
exports.departmentPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }   

		arrWhere.push(`location_id = '${param.location??""}'`);

        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_departments] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_department ${sqlWhere}) totalcount from org_department ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (org_departments.length > 0) { totalcount = org_departments[0].totalcount; } 
		let org_departmentsPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message: '' ,org_departments, org_departmentsPagination,param });
	}
	catch (err) {
		next(err);
	}
}
exports.departmentEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [org_department] = await Promise.all([
        	param.id!=undefined?dbHelper.findOne("org_department",{'id':param.id}):{}
        ]);
		res.render('organization/department/edit', { title: 'department: '+org_department.id, param, org_department  });
	}
	catch (err) {
		next(err);
	}
}
exports.departmentSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		var saveData = {
			location_id: param.location,
			name: req.body.name,
			address: req.body.address,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.id == undefined) { saveData.id = uuidv4(); redirect = `/organization/department/edit?location=${param.location}&id=${saveData.id}` }                
        await param.id!=undefined?dbHelper.update("org_department",saveData,{'id':param.id}):dbHelper.create("org_department",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect });
	}
	catch (err) {
		next(err);
	}
}
exports.departmentDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
            dbHelper.delete("org_department",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
exports.teams = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];      
		arrWhere.push(`location_id = '${param.location??""}'`);

        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }

        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }
		
        const [org_teams] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_team ${sqlWhere}) totalcount from org_team ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (org_teams.length > 0) { totalcount = org_teams[0].totalcount; } 
		let org_teamsPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('organization/team/index', { title: 'teams', org_teams, org_teamsPagination,param});
	}
	catch (err) {
		next(err);
	}
}
exports.teamPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];       
		arrWhere.push(`location_id = '${param.location??""}'`);         
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
         
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [org_teams] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from org_team ${sqlWhere}) totalcount from org_team ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (org_teams.length > 0) { totalcount = org_teams[0].totalcount; } 
		let org_teamsPagination = common.pagination(req, totalcount, paginationNum, page);

        return res.status(200).json({ success: true, message: '' ,org_teams, org_teamsPagination,param});
	}
	catch (err) {
		next(err);
	}
}
exports.teamEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");              
        const [org_team] = await Promise.all([
        	param.id!=undefined?dbHelper.findOne("org_team",{'id':param.id}):{}
        ]);
		res.render('organization/team/edit', { title: 'team: '+org_team.id, param, org_team});
	}
	catch (err) {
		next(err);
	}
}
exports.teamSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		var saveData = {
			location_id: param.location,
			name: req.body.name,
			address: req.body.address,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.id == undefined) { saveData.id = uuidv4(); redirect = `/organization/team/edit?location=${param.location}&id=${saveData.id}` }                
        await param.id!=undefined?dbHelper.update("org_team",saveData,{'id':param.id}):dbHelper.create("org_team",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect });
	}
	catch (err) {
		next(err);
	}
}

exports.teamDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
            dbHelper.delete("org_team",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true});
    }
    catch (err) {
        next(err);
    }
}
exports.login = async function (req, res, next) {
	try
	{
		if(req.user) {
        	return res.redirect('/');
        }
		else {res.render('user/auth/login', { layout : false, title: 'login' });}	
	}
	catch (err) {
		next(err);
	}
}

exports.logout = function (req, res) {	
    res.clearCookie(__config.cookie.name, {domain: __config.cookie.domain});
    store.remove(req.user.id);
	res.redirect('/login');
  };

exports.authInfo = async function (req, res, next) {
	try 
	{
		res.render('user/auth', { title: 'user info'  });
	}
	catch (err) {
		next(err);
	}
}
exports.authInfoSave = async function (req, res, next) {
	try 
	{
		return res.status(200).json({ success: true, message: 'Save complete.' });
	}
	catch (err) {
		next(err);
	}
}
exports.authChangePassword = async function (req, res, next) {
	try 
	{
		res.render('user/password', { title: 'change password' });
	}
	catch (err) {
		next(err);
	}
}
exports.authChangePasswordSave = async function (req, res, next) {
	try 
	{
		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.users = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];              
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
   
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [users] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user ${sqlWhere}) totalcount  from user ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);

        if (users.length > 0) { totalcount = users[0].totalcount; } 
		let usersPagination = common.pagination(req, totalcount, paginationNum, page);
		res.render('user/user/index', { title: 'Users',	users, usersPagination, param});
	}
	catch (err) {
		next(err);
	}
}
exports.userPage = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];       
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }

        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [users] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user ${sqlWhere}) totalcount from user ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (users.length > 0) { totalcount = users[0].totalcount; } 
		let usersPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message: '' ,users, usersPagination, param });
	}
	catch (err) {
		next(err);
	}
}
exports.userEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [user, org_locations, org_departments, org_teams, user_teams] = await Promise.all([
        	param.user!=undefined?dbHelper.findOne("user",{'id':param.user}):{},
			dbHelper.findAll("org_location"),
			dbHelper.findAll("org_department"),
			dbHelper.findAll("org_team"),
			dbHelper.queryAll(`select user_team.*, org_team.name from user_team, org_team where user_team.team_id = org_team.id and user_id = '${param.user}'`)
        ]);
		let uploadPath = __config.uploadPath.concat(req.user.id);
		res.render('user/user/edit', { title: 'user: '+user.id, uploadPath, user, org_locations, org_departments, org_teams, user_teams, param });
	}
	catch (err) {
		next(err);
	}
}
exports.userDelete = async function (req, res, next) {
    try
    {
        var param = impleplusHelper.getFunctionParams(req,"delete");
        await Promise.all([
            dbHelper.delete("user",{'id':param.deleteId})
        ]);
        return res.status(200).json({ success: true});
    }
    catch (err) {
        next(err);
    }
}
exports.userSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		if(req.body.password != undefined && req.body.confirmpassword != undefined ){
			if(req.body.password != req.body.confirmpassword){
				return res.status(200).json({ success: false, message: 'Passwords are not the same !!!' })
			}
		}
		var saveData = {			
			user_code: req.body.user_code,
			user_name: req.body.user_name,
			address: req.body.address,
			email: req.body.email,
			location_id: req.body.location_id,
			department_id: req.body.department_id,
			status_id: req.body.status_id,
			remark: req.body.remark
		}
		if (req.files != undefined) {
			if (req.files.picture != undefined ) {
				saveData.picture = req.files.picture.name;
			}			
		}		
		if (param.user != undefined) {
			await Promise.all([
				dbHelper.delete("user_team",{user_id:param.user})
			]);		
			if(req.body.teams_id != '') {
				var teams_id = JSON.parse(req.body.teams_id);
				for(team_id of teams_id){
					let data = {
						id:uuidv4(),
						user_id:param.user,
						team_id:team_id.data_id
					}
					await dbHelper.create("user_team",data);
				}
			}		
		}	
		var redirect = "";
		if (param.user == undefined) { 
			saveData.id = uuidv4(); 
			saveData.password = impleplusHelper.generateHash(req.body.password);
			redirect = `/user/edit?user=${saveData.id}`;
		}                
        param.user!=undefined? await dbHelper.update("user",saveData,{'id':param.user}):await dbHelper.create("user",saveData);
		const uploadPath = __config.uploadPath;
		if (req.files != undefined) {
			await common.uploadFile(req.files.picture, path.join(uploadPath,saveData.id));	
		}			
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect })
	}
	catch (err) {
		next(err);
	}
}
exports.roles = async function (req, res, next) {
	try
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [user_roles, user_role_bases] = await Promise.all([
			dbHelper.queryAll(`select * from user_role where user_id = '${param.user}'`),
			dbHelper.queryAll(`select * from user_role_base`)
        ]);
		for(user_role_base of user_role_bases){
			user_role_base.checked = "";
			if(_.find(user_roles,{role_base_id:user_role_base.id}) != undefined) {
				user_role_base.checked = "checked";
			}
		}
		res.render('user/userrole/index', { title: 'roles', user_roles, user_role_bases, param });
	}
	catch (err) {
		next(err);
	}
}
exports.roleSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		await dbHelper.delete("user_role",{user_id:param.user});
		for(let i=0; i<Object.keys(req.body).length; i++){
			let data = {
				id:uuidv4(),
				user_id:param.user,
				role_base_id:Object.keys(req.body)[i]
			};			
			await dbHelper.create("user_role",data);
		}
		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.password = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		res.render('user/user/password', { title: 'password', param  });
	}
	catch (err) {
		next(err);
	}
}
exports.passwordSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		if(req.body.password != undefined && req.body.confirmpassword != undefined ){
			if(req.body.password != req.body.confirmpassword){
				return res.status(200).json({ success: false, message: 'Passwords are not the same !!!' })
			}
		}
		await dbHelper.update("user",{password:impleplusHelper.generateHash(req.body.password)},{'id':param.user});
		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.rolebases = async function (req, res, next) {
	try
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
        
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [user_role_bases] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user_role_base ${sqlWhere}) totalcount from user_role_base ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (user_role_bases.length > 0) { totalcount = user_role_bases[0].totalcount; } 
		let user_role_basesPagination = common.pagination(req, totalcount, paginationNum, page);

		res.render('user/rolebase/index', { title: 'user role bases', user_role_bases, user_role_basesPagination, param});
	}
	catch (err) {
		next(err);
	}
}
exports.rolebasePage = async function (req, res, next) {
	try
	{	
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;

        var sqlParam = impleplusHelper.getSqlParam(param);

        var arrWhere = [];                
        if(sqlParam != ""){
            arrWhere.push(sqlParam);
        }
        
        var sqlWhere = "";
        if(arrWhere.length>0){
            sqlWhere = ` where ${arrWhere.join(" and ")??""}`;
        }

        const [user_role_bases] = await Promise.all([
            dbHelper.queryAll(`select *, (select count(id) from user_role_base ${sqlWhere}) totalcount from user_role_base ${sqlWhere} limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (user_role_bases.length > 0) { totalcount = user_role_bases[0].totalcount; } 
		let user_role_basesPagination = common.pagination(req, totalcount, paginationNum, page);
		return res.status(200).json({ success: true, user_role_bases, user_role_basesPagination, param });
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseEdit = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [user_role_base] = await Promise.all([
        	param.role!=undefined?dbHelper.findOne("user_role_base",{'id':param.role}):{}
        ]);
		res.render('user/rolebase/edit', { title: 'rolebase: '+user_role_base.id, user_role_base, param });
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseDelete = async function (req, res, next) {
    try
    {		
        var param = impleplusHelper.getFunctionParams(req,"delete");

		const [user_roles] = await Promise.all([
        	dbHelper.findAll("user_role",{'role_base_id':param.deleteId})
        ]);
		if(user_roles.length > 0){
			return res.status(200).json({ success: false, message:"Can't delete because have someone user uses this role base !!! "});			
		}
		else {
			await Promise.all([
				dbHelper.delete("user_role_base_access",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base_department",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base_location",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base_team",{'role_base_id':param.deleteId}),
				dbHelper.delete("user_role_base",{'id':param.deleteId})
			]);
			return res.status(200).json({ success: true});
		}

    }
    catch (err) {
        next(err);
    }
}
exports.rolebaseSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");  
		var saveData = {
			name: req.body.name,
			default_url: req.body.default_url,
			remark: req.body.remark
		}
		var redirect = "";
		if (param.role == undefined) { saveData.id = uuidv4(); redirect = `/user/rolebase/edit?role=${saveData.id}` }                
        param.role!=undefined? await dbHelper.update("user_role_base",saveData,{'id':param.role}):await dbHelper.create("user_role_base",saveData);
		return res.status(200).json({ success: true, message: 'Save complete.', param, redirect:redirect })
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseAccess = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        var [user_access_bases, user_role_base_accesss] = await Promise.all([
            dbHelper.findAll("user_access_base"),
			dbHelper.findAll("user_role_base_access",{"role_base_id":param.role})
        ]);
		res.render('user/rolebaseaccess/index', { title: 'Users', user_access_bases, user_role_base_accesss, param,_:_});
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseAccessSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		await dbHelper.delete("user_role_base_access",{role_base_id:param.role});
		for(let i=0; i<Object.keys(req.body).length; i++){			
			var keyVals = Object.keys(req.body)[i].split(":");

			let data = {
				id:uuidv4(),
				role_base_id:param.role,
				nav_id:keyVals[0],
				access_base_id:keyVals[1]						
			};					
			await dbHelper.create("user_role_base_access",data);
		}

		return res.status(200).json({ success: true, message: 'Save complete.' })
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseOrganization = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"get");
        var [org_teams, org_locations, org_departments, user_role_base_departments, user_role_base_locations, user_role_base_teams] = await Promise.all([
			dbHelper.queryAll("select org_team.*, (select name from org_location where org_location.id = org_team.location_id) locationName from org_team"),
			dbHelper.findAll("org_location"),			
			dbHelper.queryAll("select org_department.*, (select name from org_location where org_location.id = org_department.location_id) locationName from org_department"),			
			dbHelper.queryAll(`select user_role_base_department.*, 
			(select name from org_department where org_department.id = user_role_base_department.department_id) departmentName,
			(select name from org_location where org_location.id = org_department.location_id) locationName
			from user_role_base_department, org_department
			where user_role_base_department.department_id = org_department.id and role_base_id = '${param.role}'`),
			dbHelper.queryAll(`select user_role_base_location.*, (select name from org_location where org_location.id = user_role_base_location.location_id) locationName 
			from user_role_base_location where role_base_id = '${param.role}'`),
			dbHelper.queryAll(`select user_role_base_team.*, 
			(select name from org_team where org_team.id = user_role_base_team.team_id) teamName,
			(select name from org_location where org_location.id = org_team.location_id) locationName
			from user_role_base_team, org_team
			where user_role_base_team.team_id = org_team.id and role_base_id = '${param.role}'`)
        ]);
		res.render('user/rolebaseorganization/edit', { title: 'user role bases', org_teams, org_locations, org_departments,user_role_base_departments,user_role_base_locations,user_role_base_teams, param});
	}
	catch (err) {
		next(err);
	}
}
exports.rolebaseOrganizationSave = async function (req, res, next) {
	try 
	{
        var param = impleplusHelper.getFunctionParams(req,"save");
		await Promise.all([
			dbHelper.delete("user_role_base_location",{role_base_id:param.role}),
			dbHelper.delete("user_role_base_department",{role_base_id:param.role}),
			dbHelper.delete("user_role_base_team",{role_base_id:param.role}),
		]);
		if(req.body.locations_id != '') {
			var locations_id = JSON.parse(req.body.locations_id);
			for(location_id of locations_id){
				let data = {
					id:uuidv4(),
					role_base_id:param.role,
					location_id:location_id.data_id
				}
				await dbHelper.create("user_role_base_location",data);
			}
		}
		if(req.body.departments_id != ''){
			var departments_id = JSON.parse(req.body.departments_id);
			for(department_id of departments_id){
				let data = {
					id:uuidv4(),
					role_base_id:param.role,
					department_id:department_id.data_id
				}
				await dbHelper.create("user_role_base_department",data);
			}		
		}
		if(req.body.teams_id != '') {
			var teams_id = JSON.parse(req.body.teams_id);
			for(team_id of teams_id){
				let data = {
					id:uuidv4(),
					role_base_id:param.role,
					team_id:team_id.data_id
				}
				await dbHelper.create("user_role_base_team",data);
			}
		}
		return res.status(200).json({ success: true, message: 'Save complete.', param })
	}
	catch (err) {
		next(err);
	}
}
exports.import_dataPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"page");
		let paginationNum = __config.paginationNum;
		let page = Number(req.body.page) || 1;
		let totalcount = 0;
        const [import_datas] = await Promise.all([
			dbHelper.queryAll(`select *, (select user.user_name from user where user.id = import_by) import_by_name, (select count(id) from import_data where table_name like '%${param.qimport_datas??""}%' ) totalcount  from import_data where table_name like '%${param.qimport_datas??""}%'  limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (import_datas.length > 0) { totalcount = import_datas[0].totalcount; }
		let import_datasPagination = common.pagination(req, totalcount, paginationNum, page);
        return res.status(200).json({ success: true, message:'', param , import_datas, import_datasPagination });
    }
    catch (err) {
        next(err);
    }
}
exports.import_datas = async function (req, res, next) {
    try 
    {
		const uploadPath = __config.uploadPath;
		
        var param = impleplusHelper.getFunctionParams(req,"get");
		let paginationNum = __config.paginationNum;
		let page = Number(req.body.page) || 1;
		let totalcount = 0;
        const [import_datas] = await Promise.all([
			dbHelper.queryAll(`select *, (select user.user_name from user where user.id = import_by) import_by_name, (select count(id) from import_data where table_name like '%${param.qimport_datas??""}%' ) totalcount  from import_data where table_name like '%${param.qimport_datas??""}%'  limit ${((page - 1) * paginationNum) + "," + paginationNum} `)
        ]);
        if (import_datas.length > 0) { totalcount = import_datas[0].totalcount; }
		let import_datasPagination = common.pagination(req, totalcount, paginationNum, page);
        res.render('import_data/list', { title: 'Imports', uploadPath:uploadPath, param, import_datas, import_datasPagination } );
    }
    catch (err) {
        next(err);
    }
}
exports.import_dataEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"get");
        const importTables = __config.importTables;
        var sqlWhere = importTables.map(item => `table_name='${item}'`).join(" or ");
        const [table_columns] = await Promise.all([
			dbHelper.queryAll(`select table_name, column_name from information_schema.columns where table_schema = '${__config.database.database}' and (${sqlWhere}) `)
        ]);       
        const uploadPath = __config.uploadPath;
        res.render('import_data/edit', { title: 'Imports', uploadPath, param, importTables, table_columns} );
    }
    catch (err) {
        next(err);
    }
}
exports.import_dataTemplate = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"get");
        var sql = `select * from #grave#${param.tableName}#grave# limit ${__config.exportRecord}`.replace(/#grave#/ig,"`");
        var [dataTemplates] = await Promise.all([
            dbHelper.queryAll(sql)
        ]);
        res.writeHead(200, {
            'Content-Disposition': `attachment; filename="import-tempate-${param.tableName}.xlsx"`,
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
        const worksheet = workbook.addWorksheet(param.tableName);
        let worksheet_header = [];
        if (dataTemplates.length > 0) {
            let record = dataTemplates[0];
            for(let i=0; i< Object.keys(record).length; i++){
                var findIngoreColumn = __config.ignore.exportColumns.find((el) => el == Object.keys(record)[i]);
                if(findIngoreColumn == undefined ) {
                    worksheet_header.push({ header: Object.keys(record)[i], key: Object.keys(record)[i] });                
                }
            }
        }
        worksheet.columns = worksheet_header;
        dataTemplates.forEach(record => {
            let row = {};
            for(let i=0; i< Object.keys(record).length; i++){
                var findIngoreColumn = __config.ignore.exportColumns.find((el) => el == Object.keys(record)[i]);
                if(findIngoreColumn == undefined ) {
                    row[Object.keys(record)[i]] = Object.values(record)[i];             
                }
            }
            worksheet.addRow(row).commit();
        });
        worksheet.commit();
        workbook.commit();	     
		
    }
    catch (err) {
        next(err);
    }
}
exports.import_dataSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"save");
        var tableName = req.body.importTable;
        var tempTableName = common.randomText();
        const [columns] = await Promise.all([
			dbHelper.queryAll(`SHOW COLUMNS FROM ${tableName}`)
        ]);   
        if (req.files != undefined && req.body.importTable != "") {
            const uploadPath = __config.uploadPath;
            if (req.files != undefined) {
				await common.uploadFile(req.files.fileupload, path.join(uploadPath,req.user.id));
            }            
			const fileName = `${__basedir}/app/public/${uploadPath.concat("/",req.user.id,"/",req.files.fileupload.name)}`;
            const wb = new Excel.Workbook();
            var fieldNames = [];            
            var fieldRowValues = [];
            await wb.xlsx.readFile(fileName).then(() => {
                var sheet = wb.getWorksheet(wb.worksheets[0].name);
                rowTotal = sheet.actualRowCount-1;
                for (var i = 1; i <= sheet.actualRowCount; i++) {
                    var fieldValues = [];
                    for (var j = 1; j <= sheet.actualColumnCount; j++) {
                        data = sheet.getRow(i).getCell(j).toString();
                        if(i==1) {
                            fieldNames.push(data);
                        }
                        else {
                            const findColumn = _.find(columns, {Field:fieldNames[j-1].toLowerCase()});
                            if(findColumn!= undefined){
                                if(findColumn.Type.includes("varchar(36)")){
                                    if(data == "UUID()"){
                                        fieldValues.push(`${data}`);
                                    }
                                    else {
                                        fieldValues.push(`'${data}'`);
                                    }                                    
                                }
                                else if(findColumn.Type.includes("varchar")){
                                    fieldValues.push(`'${data}'`);
                                }
                                else if(findColumn.Type.includes("text")){
                                    fieldValues.push(`'${data}'`);
                                }                                
                                else if(findColumn.Type.includes("datetime")){
                                    if(moment(data).isValid())
                                    {                                        
                                        var dateValue = moment(data).format('YYYY-MM-DD');
                                        fieldValues.push(`'${dateValue}'`);
                                    }
                                    else {
                                        fieldValues.push(`null`);
                                    }
                                }
                                else if(findColumn.Type.includes("int")){
                                    fieldValues.push(`${data}`);
                                }
                                else {
                                    fieldValues.push(`null`);
                                }
                            }
                        }
                    }
                    if(i!= 1){
                        fieldValues.push("UUID()");
                        fieldValues.push(`'${req.user.id}'`);
                        fieldValues.push(`'${req.user.id}'`);
                        fieldValues.push(`'${moment(new Date()).format('YYYY-MM-DD')}'`);
                    }


                    if(fieldValues.length != 0){
                        fieldRowValues.push("("+fieldValues.join(",")+")");
                    }
                }
            });
            fieldNames.push("id");
            fieldNames.push("owner_id");
            fieldNames.push("create_by");
            fieldNames.push("create_date");
            var sqlNameInsertTemp = `(${fieldNames.join(",")})`;
            var sqlValueInsertTemp = `${fieldRowValues.join(",")}`;
            var checkDupColumns = "";
            if(req.body.checkDupColumns != ""){
                checkDupColumns = JSON.parse(req.body.checkDupColumns).map(item=>item.value).join(",");
            }
            var sqlcheckDup = "";
            if(checkDupColumns != ""){
                sqlcheckDup = ` where (${checkDupColumns}) not in (select ${checkDupColumns} from ${tableName})`;
            }
            await dbHelper.execute(`CREATE TEMPORARY TABLE IF NOT EXISTS ${tempTableName} select * from ${tableName} limit 0`);
            await dbHelper.execute(`insert into ${tempTableName} ${sqlNameInsertTemp} values ${sqlValueInsertTemp}`); 
            await dbHelper.execute(`insert into ${tableName} select * from ${tempTableName} ${sqlcheckDup}`);
            await dbHelper.execute(`DROP TEMPORARY TABLE IF EXISTS ${tempTableName}`);
            var importData = {
                id:uuidv4(),
                table_name:tableName,
                import_by:req.user.id,
                import_date:new Date(),
                import_status:0,
                message:"Sucess"
            };
            await dbHelper.create("import_data",importData);
            fs.unlinkSync(fileName);
        }
        return res.status(200).json({ success: true, refresh:true, message:'Save complete.', param });
    }
    catch (err) {
            var importData = {
				id:uuidv4(),
                table_name:tableName,
                import_by:req.user.id,
                import_date:new Date(),
                import_status:1,
                message:err.message
            };
            await dbHelper.create("import_data",importData);        
        next(err);
    }
}

exports.import_dataExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req,"get");
        const [import_datas] = await Promise.all([
			dbHelper.queryAll(`select * from import_data where table_name like '%${param.qimport_datas}%' `)
        ]);
        res.writeHead(200, {
            'Content-Disposition': 'attachment; filename="import_datas-'+common.stampTime+'.xlsx"',
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const workbook = new Excel.stream.xlsx.WorkbookWriter({ stream: res });
        const worksheet = workbook.addWorksheet('Sheet1');
        let worksheet_header = [];			
        if (import_datas.length > 0) {
            let record = import_datas[0];
            for(let i=0; i< Object.keys(record).length; i++){
                worksheet_header.push({ header: Object.keys(record)[i], key: Object.keys(record)[i] });
            }
        }
        worksheet.columns = worksheet_header;
        import_datas.forEach(record => {
            let row = {};
            for(let i=0; i< Object.keys(record).length; i++){
                row[Object.keys(record)[i]] = Object.values(record)[i];
            }            
            worksheet.addRow(row).commit();
        });
        worksheet.commit();
        workbook.commit();	        
    }
    catch (err) {
        next(err);
    }
}


exports.equipmentEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [equipmentRecord] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select *,  (select equipment_group.name from equipment_group where equipment_group.id = equipment_group_id) equipment_group_text  
from equipment
where equipment.id='${param.id??""}'`,{},{}):{} 
		]);

        res.render('equipment/edit', { title: `Equipment: ${equipmentRecord.id??""}`, param ,equipmentRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.equipmentSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var equipmentData = {
			name: req.body.name||null,
			equipment_group_id: req.body.equipment_group_id||null,
			serial: req.body.serial||null,
			detail: req.body.detail||null 
		};
                if (req.files != undefined) { if (req.files.image != undefined) {
                                                const filePath = "/".concat(__config.uploadPath,"/","marketing_team/",req.user.id);
                                                equipmentData.image = filePath.concat("/",req.files.image.name);
                                            await common.uploadFile(req.files.image, filePath); }}

		var newequipmentId = uuidv4(); 
        if (param.id == undefined) {
            equipmentData.id = newequipmentId;
            equipmentData.owner_id = req.user.id;
            equipmentData.create_by = req.user.id;
            equipmentData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            equipmentData.update_by = req.user.id;
            equipmentData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/equipment/edit?id=${newequipmentId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [equipmentRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("equipment",equipmentData,{"id":param.id??""}):dbHelper.create("equipment",equipmentData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.equipmentDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [equipmentRecord] = await Promise.all([
			dbHelper.delete("equipment",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.equipmentExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereequipmentRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereequipmentRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereequipmentRecords = "";
        if(arrWhereequipmentRecords.length>0){
            sqlWhereequipmentRecords = `  and  ${arrWhereequipmentRecords.join(" and ")??""}`;
        }
    

		var [equipmentRecords] = await Promise.all([
			dbHelper.queryAll(`select equipment.*, (select equipment_group.name from equipment_group where equipment_group.id = equipment_group_id) equipment_group_text   from equipment where name like '%${param.name??""}%'  ${sqlWhereequipmentRecords}`) 
		]);

        common.exportXls(res, "equipmentRecords-"+common.stampTime, "Sheet1", equipmentRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.equipmentPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereequipmentRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereequipmentRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereequipmentRecords = "";
        if(arrWhereequipmentRecords.length>0){
            sqlWhereequipmentRecords = `  and  ${arrWhereequipmentRecords.join(" and ")??""}`;
        }
    

		var [equipmentRecords] = await Promise.all([
			dbHelper.queryAll(`select equipment.*, (select equipment_group.name from equipment_group where equipment_group.id = equipment_group_id) equipment_group_text ,(select count(id) from equipment where name like '%${param.name??""}%' ) totalcount   from equipment where name like '%${param.name??""}%'  ${sqlWhereequipmentRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (equipmentRecords.length > 0) { totalcount = equipmentRecords[0].totalcount; }
        let equipmentRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,equipmentRecords,equipmentRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.equipmentAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        
        var arrWhereequipmentRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereequipmentRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereequipmentRecords = "";
        if(arrWhereequipmentRecords.length>0){
            sqlWhereequipmentRecords = `  and  ${arrWhereequipmentRecords.join(" and ")??""}`;
        }
    

		var [equipmentRecords] = await Promise.all([
			dbHelper.queryAll(`select equipment.*, (select equipment_group.name from equipment_group where equipment_group.id = equipment_group_id) equipment_group_text ,(select count(id) from equipment where name like '%${param.name??""}%' ) totalcount   from equipment where name like '%${param.name??""}%'  ${sqlWhereequipmentRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (equipmentRecords.length > 0) { totalcount = equipmentRecords[0].totalcount; }
        let equipmentRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('equipment/list', { title: `Equipment`, param ,equipmentRecords,equipmentRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.equipment_groupDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [equipment_groupRecord] = await Promise.all([
			dbHelper.delete("equipment_group",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.equipment_groupExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereequipment_groupRecords = [];                
        
        if(sqlParam != ""){
            arrWhereequipment_groupRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereequipment_groupRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereequipment_groupRecords = "";
        if(arrWhereequipment_groupRecords.length>0){
            sqlWhereequipment_groupRecords = `  where  ${arrWhereequipment_groupRecords.join(" and ")??""}`;
        }
    

		var [equipment_groupRecords] = await Promise.all([
			dbHelper.queryAll(`select * from equipment_group ${sqlWhereequipment_groupRecords}`) 
		]);

        common.exportXls(res, "equipment_groupRecords-"+common.stampTime, "Sheet1", equipment_groupRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.equipment_groupPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereequipment_groupRecords = [];                
        
        if(sqlParam != ""){
            arrWhereequipment_groupRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereequipment_groupRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereequipment_groupRecords = "";
        if(arrWhereequipment_groupRecords.length>0){
            sqlWhereequipment_groupRecords = `  where  ${arrWhereequipment_groupRecords.join(" and ")??""}`;
        }
    

		var [equipment_groupRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from equipment_group ${sqlWhereequipment_groupRecords}) totalcount  from equipment_group ${sqlWhereequipment_groupRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (equipment_groupRecords.length > 0) { totalcount = equipment_groupRecords[0].totalcount; }
        let equipment_groupRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,equipment_groupRecords,equipment_groupRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.equipment_groupAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereequipment_groupRecords = [];                
        
        if(sqlParam != ""){
            arrWhereequipment_groupRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereequipment_groupRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereequipment_groupRecords = "";
        if(arrWhereequipment_groupRecords.length>0){
            sqlWhereequipment_groupRecords = `  where  ${arrWhereequipment_groupRecords.join(" and ")??""}`;
        }
    

		var [equipment_groupRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from equipment_group ${sqlWhereequipment_groupRecords}) totalcount  from equipment_group ${sqlWhereequipment_groupRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (equipment_groupRecords.length > 0) { totalcount = equipment_groupRecords[0].totalcount; }
        let equipment_groupRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('equipment_group/list', { title: `Equipment Group`, param ,equipment_groupRecords,equipment_groupRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.equipment_groupEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [equipment_groupRecord] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("equipment_group",{"id":param.id??""},[]):{} 
		]);

        res.render('equipment_group/edit', { title: `Equipment Group: ${equipment_groupRecord.id??""}`, param ,equipment_groupRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.equipment_groupSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var equipment_groupData = {
			code: req.body.code||null,
			name: req.body.name||null,
			detail: req.body.detail||null 
		};
                
		var newequipment_groupId = uuidv4(); 
        if (param.id == undefined) {
            equipment_groupData.id = newequipment_groupId;
            equipment_groupData.owner_id = req.user.id;
            equipment_groupData.create_by = req.user.id;
            equipment_groupData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            equipment_groupData.update_by = req.user.id;
            equipment_groupData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/equipment_group/edit?id=${newequipment_groupId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [equipment_groupRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("equipment_group",equipment_groupData,{"id":param.id??""}):dbHelper.create("equipment_group",equipment_groupData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.borrow_equipmentDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [borrow_equipmentRecord] = await Promise.all([
			dbHelper.delete("borrow_equipment",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.borrow_equipmentExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req,"borrow_equipment");

        
        var arrWhereborrow_equipmentRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereborrow_equipmentRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereborrow_equipmentRecords = "";
        if(arrWhereborrow_equipmentRecords.length>0){
            sqlWhereborrow_equipmentRecords = `  and  ${arrWhereborrow_equipmentRecords.join(" and ")??""}`;
        }
    

		var [borrow_equipmentRecords] = await Promise.all([
			dbHelper.queryAll(`select borrow_equipment.id, borrow_equipment.borrower_id, borrow_equipment.objective, borrow_equipment.remark, borrow_equipment.approve_by, borrow_equipment.createdate, borrow_equipment.createby, borrow_equipment_item.borrow_equipment_id, borrow_equipment_item.start_date, borrow_equipment_item.return_date, borrow_equipment_item.return_status, borrow_equipment_item.quantity, borrow_equipment_item.receiver, borrow_equipment_item.receive_date, borrow_equipment_item.borrow_equipment_name,borrower.firstname, borrower.lastname, borrower.employee_code, case return_status when 0 then 'Not return' else 'Returned' end return_status_text  from borrow_equipment, borrow_equipment_item, borrower where borrow_equipment.id = borrow_equipment_item.borrow_equipment_id and borrow_equipment.borrower_id = borrower.id and borrower_id in (   select id from borrower where firstname like '%${param.borrower??""}%' or lastname like '%${param.borrower??""}%' or employee_code like '%${param.borrower??""}%' ) and return_status like '%${param.return_status??""}%' ${sqlWhereborrow_equipmentRecords}`) 
		]);

        common.exportXls(res, "borrow_equipmentRecords-"+common.stampTime, "Sheet1", borrow_equipmentRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.borrow_equipmentPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req,"borrow_equipment");

        
        var arrWhereborrow_equipmentRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereborrow_equipmentRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereborrow_equipmentRecords = "";
        if(arrWhereborrow_equipmentRecords.length>0){
            sqlWhereborrow_equipmentRecords = `  and  ${arrWhereborrow_equipmentRecords.join(" and ")??""}`;
        }
    

		var [borrow_equipmentRecords] = await Promise.all([
			dbHelper.queryAll(`select borrow_equipment.id, borrow_equipment.borrower_id, borrow_equipment.objective, borrow_equipment.remark, borrow_equipment.approve_by, borrow_equipment.createdate, borrow_equipment.createby, borrow_equipment_item.borrow_equipment_id, borrow_equipment_item.start_date, borrow_equipment_item.return_date, borrow_equipment_item.return_status, borrow_equipment_item.quantity, borrow_equipment_item.receiver, borrow_equipment_item.receive_date, borrow_equipment_item.borrow_equipment_name,borrower.firstname, borrower.lastname, borrower.employee_code, case return_status when 0 then 'Not return' else 'Returned' end return_status_text ,(select count(borrow_equipment_item.id) from borrow_equipment, borrow_equipment_item where borrow_equipment.id = borrow_equipment_item.borrow_equipment_id and borrower_id in (  select id from borrower where firstname like '%${param.borrower??""}%' or lastname like '%${param.borrower??""}%' or employee_code like '%${param.borrower??""}%' ) and return_status like '%${param.return_status??""}%' ) totalcount  from borrow_equipment, borrow_equipment_item, borrower where borrow_equipment.id = borrow_equipment_item.borrow_equipment_id and borrow_equipment.borrower_id = borrower.id and borrower_id in (   select id from borrower where firstname like '%${param.borrower??""}%' or lastname like '%${param.borrower??""}%' or employee_code like '%${param.borrower??""}%' ) and return_status like '%${param.return_status??""}%' ${sqlWhereborrow_equipmentRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (borrow_equipmentRecords.length > 0) { totalcount = borrow_equipmentRecords[0].totalcount; }
        let borrow_equipmentRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,borrow_equipmentRecords,borrow_equipmentRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.borrow_equipmentAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req,"borrow_equipment");

        
        var arrWhereborrow_equipmentRecords = [];                
        
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereborrow_equipmentRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereborrow_equipmentRecords = "";
        if(arrWhereborrow_equipmentRecords.length>0){
            sqlWhereborrow_equipmentRecords = `  and  ${arrWhereborrow_equipmentRecords.join(" and ")??""}`;
        }
    

		var [borrow_equipmentRecords] = await Promise.all([
			dbHelper.queryAll(`select borrow_equipment.id, borrow_equipment.borrower_id, borrow_equipment.objective, borrow_equipment.remark, borrow_equipment.approve_by, borrow_equipment.createdate, borrow_equipment.createby, borrow_equipment_item.borrow_equipment_id, borrow_equipment_item.start_date, borrow_equipment_item.return_date, borrow_equipment_item.return_status, borrow_equipment_item.quantity, borrow_equipment_item.receiver, borrow_equipment_item.receive_date, borrow_equipment_item.borrow_equipment_name,borrower.firstname, borrower.lastname, borrower.employee_code, case return_status when 0 then 'Not return' else 'Returned' end return_status_text ,(select count(borrow_equipment_item.id) from borrow_equipment, borrow_equipment_item where borrow_equipment.id = borrow_equipment_item.borrow_equipment_id and borrower_id in (  select id from borrower where firstname like '%${param.borrower??""}%' or lastname like '%${param.borrower??""}%' or employee_code like '%${param.borrower??""}%' ) and return_status like '%${param.return_status??""}%' ) totalcount  from borrow_equipment, borrow_equipment_item, borrower where borrow_equipment.id = borrow_equipment_item.borrow_equipment_id and borrow_equipment.borrower_id = borrower.id and borrower_id in (   select id from borrower where firstname like '%${param.borrower??""}%' or lastname like '%${param.borrower??""}%' or employee_code like '%${param.borrower??""}%' ) and return_status like '%${param.return_status??""}%' ${sqlWhereborrow_equipmentRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (borrow_equipmentRecords.length > 0) { totalcount = borrow_equipmentRecords[0].totalcount; }
        let borrow_equipmentRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('borrow_equipment/list', { title: `Borrow Equipment`, param ,borrow_equipmentRecords,borrow_equipmentRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}

exports.borrowerEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [borrowerRecord] = await Promise.all([
			param.id!=undefined?dbHelper.findOne("borrower",{"id":param.id??""},[]):{} 
		]);

        res.render('borrower/edit', { title: `Borrower: ${borrowerRecord.id??""}`, param ,borrowerRecord });
    }
    catch (err) {
        next(err);
    }
}

exports.borrowerSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var borrowerData = {
			firstname: req.body.firstname||null,
			lastname: req.body.lastname||null,
			employee_code: req.body.employee_code||null,
			position: req.body.position||null,
			business_unit: req.body.business_unit||null,
			department: req.body.department||null,
			phone: req.body.phone||null,
			email: req.body.email||null,
			remark: req.body.remark||null 
		};
                
		var newborrowerId = uuidv4(); 
        if (param.id == undefined) {
            borrowerData.id = newborrowerId;
            borrowerData.owner_id = req.user.id;
            borrowerData.create_by = req.user.id;
            borrowerData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            borrowerData.update_by = req.user.id;
            borrowerData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/borrower/edit?id=${newborrowerId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [borrowerRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("borrower",borrowerData,{"id":param.id??""}):dbHelper.create("borrower",borrowerData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.borrow_equipmentEdit = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [borrow_equipmentRecord,borrow_equipment_itemRecords] = await Promise.all([
			param.id!=undefined?dbHelper.queryOne(`select borrow_equipment.* , (select firstname from borrower where borrower.id = borrower_id) borrower_text from borrow_equipment where id = "${param.id??""}"`,{},{}):{},
			dbHelper.findAll("borrow_equipment_item",{"borrow_equipment_id":param.id??""},[]) 
		]);

        res.render('borrow_equipment/edit', { title: `Borrow Equipment: ${borrow_equipmentRecord.id??""}`, param ,borrow_equipmentRecord,borrow_equipment_itemRecords });
    }
    catch (err) {
        next(err);
    }
}

exports.borrow_equipmentSave = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var borrow_equipmentData = {
			borrower_id: req.body.borrower_id||null,
			objective: req.body.objective||null,
			remark: req.body.remark||null,
			approve_by: req.body.approve_by||null 
		};
                
		var newborrow_equipmentId = uuidv4(); 
        if (param.id == undefined) {
            borrow_equipmentData.id = newborrow_equipmentId;
            borrow_equipmentData.owner_id = req.user.id;
            borrow_equipmentData.create_by = req.user.id;
            borrow_equipmentData.create_date = common.toMySqlDateTimeFormat(new Date());
        }
        else {
            borrow_equipmentData.update_by = req.user.id;
            borrow_equipmentData.update_date = common.toMySqlDateTimeFormat(new Date());
        };

		if(req.body["datasheet_Eextmc"] != undefined && req.body["datasheet_Eextmc"] != ""){
            var datasheet_EextmcItems = JSON.parse(req.body["datasheet_Eextmc"]);
            var datasheet_EextmcData = {};
            if (param.id == undefined) {
                datasheet_EextmcData.borrow_equipment_id = newborrow_equipmentId;
            }
            else {
                datasheet_EextmcData.borrow_equipment_id = param.id;
            };
            await dbHelper.delete("borrow_equipment_item",{borrow_equipment_id:datasheet_EextmcData.borrow_equipment_id});
            for(let datasheet_EextmcItem of datasheet_EextmcItems){
                datasheet_EextmcData.id = uuidv4();
				datasheet_EextmcData.start_date = common.toMySqlDateTimeFormat(new Date());
				datasheet_EextmcData.receiver = req.user.id;
				datasheet_EextmcData.receive_date = null;
				datasheet_EextmcData.return_date = datasheet_EextmcItem.return_status==1?common.toMySqlDateTimeFormat(new Date()):null;
				datasheet_EextmcData.return_status = datasheet_EextmcItem.return_status||0;
				datasheet_EextmcData.quantity = datasheet_EextmcItem.quantity||0;
				datasheet_EextmcData.borrow_equipment_name = datasheet_EextmcItem.borrow_equipment_name||null;
                if (param.id == undefined) {
                    datasheet_EextmcData.owner_id = req.user.id;
                    datasheet_EextmcData.create_by = req.user.id;
                    datasheet_EextmcData.create_date = common.toMySqlDateTimeFormat(new Date());                                
                }
                else {
                    datasheet_EextmcData.update_by = req.user.id;
                    datasheet_EextmcData.update_date = common.toMySqlDateTimeFormat(new Date());   
                }
                await dbHelper.create("borrow_equipment_item",datasheet_EextmcData);
            } 
        }

		var redirectParam = common.getRedirectAllParam(req);  
            var redirect = "" ;
            if (param.id == undefined) {             
                redirect = `/borrow_equipment/edit?id=${newborrow_equipmentId}${redirectParam!=""?`&${redirectParam}`:""}`;
            }
            

		var [borrow_equipmentRecord] = await Promise.all([
			param.id!=undefined?dbHelper.update("borrow_equipment",borrow_equipmentData,{"id":param.id??""}):dbHelper.create("borrow_equipment",borrow_equipmentData) 
		]);

        res.status(200).json({ success: true, message:'Save complete.', param  ,redirect });
    }
    catch (err) {
        next(err);
    }
}

exports.borrowerDelete = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var [borrowerRecord] = await Promise.all([
			dbHelper.delete("borrower",{'id':param.deleteId}) 
		]);

        res.status(200).json({ success: true, message:'', param   });
    }
    catch (err) {
        next(err);
    }
}

exports.borrowerExport = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereborrowerRecords = [];                
        
        if(sqlParam != ""){
            arrWhereborrowerRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereborrowerRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereborrowerRecords = "";
        if(arrWhereborrowerRecords.length>0){
            sqlWhereborrowerRecords = `  where  ${arrWhereborrowerRecords.join(" and ")??""}`;
        }
    

		var [borrowerRecords] = await Promise.all([
			dbHelper.queryAll(`select * from borrower ${sqlWhereborrowerRecords}`) 
		]);

        common.exportXls(res, "borrowerRecords-"+common.stampTime, "Sheet1", borrowerRecords);
    }
    catch (err) {
        next(err);
    }
}

exports.borrowerPage = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereborrowerRecords = [];                
        
        if(sqlParam != ""){
            arrWhereborrowerRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereborrowerRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereborrowerRecords = "";
        if(arrWhereborrowerRecords.length>0){
            sqlWhereborrowerRecords = `  where  ${arrWhereborrowerRecords.join(" and ")??""}`;
        }
    

		var [borrowerRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from borrower ${sqlWhereborrowerRecords}) totalcount  from borrower ${sqlWhereborrowerRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (borrowerRecords.length > 0) { totalcount = borrowerRecords[0].totalcount; }
        let borrowerRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.status(200).json({ success: true, message:'', param ,borrowerRecords,borrowerRecordsPagination  });
    }
    catch (err) {
        next(err);
    }
}

exports.borrowerAll = async function (req, res, next) {
    try 
    {
        var param = impleplusHelper.getFunctionParams(req);

        let paginationNum = __config.paginationNum;
        let page = param.page||1;
        let totalcount = 0;
        
		var sqlWhereDataPrivilege = impleplusHelper.sqlDataPrivilege(req);

        var sqlParam = impleplusHelper.getSqlParam(param);
        var arrWhereborrowerRecords = [];                
        
        if(sqlParam != ""){
            arrWhereborrowerRecords.push(sqlParam);
        }
        
        if(sqlWhereDataPrivilege != ''){
            arrWhereborrowerRecords.push(sqlWhereDataPrivilege);
        }
        var sqlWhereborrowerRecords = "";
        if(arrWhereborrowerRecords.length>0){
            sqlWhereborrowerRecords = `  where  ${arrWhereborrowerRecords.join(" and ")??""}`;
        }
    

		var [borrowerRecords] = await Promise.all([
			dbHelper.queryAll(`select * ,(select count(id) from borrower ${sqlWhereborrowerRecords}) totalcount  from borrower ${sqlWhereborrowerRecords} limit ${((page - 1) * paginationNum) + "," + paginationNum}`) 
		]);
		if (borrowerRecords.length > 0) { totalcount = borrowerRecords[0].totalcount; }
        let borrowerRecordsPagination = common.pagination(req, totalcount, paginationNum, page);

        res.render('borrower/list', { title: `Borrower`, param ,borrowerRecords,borrowerRecordsPagination });
    }
    catch (err) {
        next(err);
    }
}