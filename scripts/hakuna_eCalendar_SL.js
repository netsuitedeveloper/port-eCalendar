/*
====================================================================================================================================
     MODULE:        eService
RECORD TYPE:        NONE 
    FILE(s):        NONE
   SEARCHES:        NONE
PREFERENCES:        NONE
      NOTES:        TODO
====================================================================================================================================
*/

var context = nlapiGetContext();
var timeformat_context = context.getPreference('TIMEFORMAT');

var calArray = [];
var eventArray = [];
var noAppointmentUsers = [];
var html = new StringBuffer();
var tooltipObject;
var tooltipObjectEmployee;
var smuser_hover = {};
//var colorObj = {};
var custscript_ecal_travelcolor = '';

var custscript_ecal_time_slots = '';
var quantitySpans = 6;
var countCheckbox = 12/quantitySpans;
var slotDurationInHours = quantitySpans/12;

var minutesInInternalSlot = 5;
var secondsInMinute = 60;
var millisecondsInSecond = 1000;
var millisecondsInSlot = 0;

var minutesCalendarSlot = 0;

var weektype = '';
var viewtype = '';
var row_starttime = '';
var row_endtime = '';
var timeformat;
var unassignedColor = 'ff0000';
var custscript_ecal_holidaycolor = '';
var emptySlotColor = 'CCFFFF';
var tooltipContentEmployee = '';
var tooltipContent = '';
var custscript_ecal_tooltipcontent = '';
var smUser_WorkingDayObj = {};
var allowoverlap = true;
var calendarViewMode = false;

var eCalSortWO;
var showUnassigned = '';
var eventBoxContext = '';
var addColumnsFromContext;
CALENDARFOLDERID = 174;

function eCalendar(request,response) {
    try { if (runSMScripts() == false) {return;} } 
    catch (e){ throwErrorEpip(e, 'eCalendar runSMScripts', 'eService Permissions have not been enabled for this account. Please contact Administrator.');  return;}
    
    try{
        var section = '';
        
        section = 'Get Parameters';
        {
            context = nlapiGetContext();
            var mode = request.getParameter('mode') || '';
            var pPreSelectedFilters = false;
            var isDisabled = '';
            if (pPreSelectedFilters) {
                isDisabled = 'disabled';
            }
            var pExpStartDate = request.getParameter('expstartdate') || '';
            var pSkillsText = request.getParameter('skills') || '';
            var pSkills = [];
            if (pSkillsText) {
                pSkills = pSkillsText.split(',');
            }
            var pUserGroupsText = request.getParameter('usergroups') || '';
            var pUserGroups = [];
            if (pUserGroupsText) {
                pUserGroups = pUserGroupsText.split(',');
            }
            var pUserGroups_SMUserstoSelect = [];
            var enabledSubsidiary = context.getFeature('SUBSIDIARIES');
            var currentUser = nlapiGetUser();
            var currentUserName = '';
            var timeZone = '';
            var smsubsidiaryWO = request.getParameter('smsubidiarywo') || '';
            
            var pworkorderid = request.getParameter('workorderid') || '';
        }
        
        section == 'Get Attributes';
        {
            var attb = ['wo_ecalendar_week_display','wo_ecalendar_view','wo_ecalendar_group','wo_ecalendar_starttime','wo_ecalendar_endtime',
                'wo_ecalendar_eventboxcontent','wo_ecalendar_tooltipcontentemployee','wo_ecalendar_travelcolor','wo_ecalendar_holidaycolor',
                'wo_ecalendar_timeslots','wo_ecalendar_tooltipcontent', 'wo_ecalendar_timeformat'];
            var attrbObj = getAttributes(attb);
        }
        
        section = 'Validating Attributes';
        {
            try{
                //week display

                if (attrbObj['wo_ecalendar_week_display']) {
                    weektype = attrbObj['wo_ecalendar_week_display'].value;
                }
                else{
                    throw 'Attribute "Week Display View" is empty!.';
                }

                //week display
                if (attrbObj['wo_ecalendar_view']) {
                    viewtype = attrbObj['wo_ecalendar_view'].value;
                }
                else{
                    throw 'Attribute "Default View" is empty!.';
                }

                //Time Slots
                if (attrbObj['wo_ecalendar_timeslots']) {
                    custscript_ecal_time_slots = attrbObj['wo_ecalendar_timeslots'].value;
                }
                else{
                    throw 'Attribute "Time Slot" is empty!.';
                }

                //Event Box Content
                if (attrbObj['wo_ecalendar_eventboxcontent']) {
                    eventBoxContext = attrbObj['wo_ecalendar_eventboxcontent'].value;
                }
                else{
                    throw 'Attribute "Event Box Content" is empty!.';
                }

                //Tooltip Employee
                var custscript_ecal_tooltipcontent_employee = '';
                if (attrbObj['wo_ecalendar_tooltipcontentemployee']) {
                    custscript_ecal_tooltipcontent_employee = attrbObj['wo_ecalendar_tooltipcontentemployee'].value;
                    tooltipContentEmployee = custscript_ecal_tooltipcontent_employee;
                }
                
                //Tooltip 
                if (attrbObj['wo_ecalendar_tooltipcontent']) {
                    custscript_ecal_tooltipcontent = attrbObj['wo_ecalendar_tooltipcontent'].value;
                    tooltipContent = custscript_ecal_tooltipcontent;
                }
                
                //Timeformat 
                if (attrbObj['wo_ecalendar_timeformat']) {
                    switch(parseInt(attrbObj['wo_ecalendar_timeformat'].value)) {
                        case 1:
                            timeformat = 'h:mm a';
                            break;
                        case 2:
                            timeformat = 'H:mm';
                            break;
                        case 3:
                            timeformat = 'h-mm a';
                            break;
                        case 4:
                            timeformat = 'H-mm';
                            break;
                        default:
                            timeformat = 'h:mm a';
                    }
                } else {
                    timeformat = 'h:mm a';
                }
                nlapiLogExecution('debug', '0 timeformat '+timeformat, attrbObj['wo_ecalendar_timeformat'].value);
                
                //Start Time
                if (attrbObj['wo_ecalendar_starttime']) {
                    row_starttime = attrbObj['wo_ecalendar_starttime'].value;
                }
                else{
                    row_starttime = '8:00 am';
                }
                row_starttime = changeTimeFormat(row_starttime, timeformat);
                
                //End Time
                if (attrbObj['wo_ecalendar_endtime']) {
                    row_endtime = attrbObj['wo_ecalendar_endtime'].value;
                }
                else{
                    row_endtime = '5:00 pm';
                }
                row_endtime = changeTimeFormat(row_endtime, timeformat);
                nlapiLogExecution('debug', '1 timeformat '+timeformat, 'row_starttime '+row_starttime+', row_endtime '+row_endtime)

                //Holiday Color
                custscript_ecal_holidaycolor = 'ff0066';
                if (attrbObj['wo_ecalendar_holidaycolor']) {
                    custscript_ecal_holidaycolor = attrbObj['wo_ecalendar_holidaycolor'].value;
                }
                
            }
            catch(err){
                var htmlerror = '<div id="div_notification" style="display:block; color:black; font-family:Tahoma,Geneva,Arial,sans-serif;font-size:13px; background:#fff8c4; border:1px solid #f2c779; font-weight:bold; margin:4px; padding:10px 36px;">';
                    htmlerror += '<div id="div_message">'+err+'</div></div>';
                response.write(htmlerror);
                return;
            }
        }
        
        section = 'Configuration';
        {
            resetSlotsVaraibles(custscript_ecal_time_slots);

            tooltipObjectEmployee = getTooltipFieldsEmployee(custscript_ecal_tooltipcontent_employee);
        }
        
        if (mode == '') {

            section = 'Get SM Subsidiary';
            {
                var smsubsidiary = {};
                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('name'),
                    new nlobjSearchColumn('custrecord_hakuna_subs_ns_subsidiary_id')
                ];

                var search = nlapiCreateSearch('customrecord_hakuna_subsidiaries',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
                            var subsidiary_id = searchResults[k].getValue('custrecord_hakuna_subs_ns_subsidiary_id');
                            if (!smsubsidiary[subsidiary_id]) {
                                var name = searchResults[k].getValue('name');
                                smsubsidiary[subsidiary_id] = {
                                    name : name,
                                    smsubsidiary : id
                                };
                            }
                        }
                    }
                    resultsStart += 1000;

                } while (searchResults && searchResults.length == 1000);
            }

            section = 'Get Skill Types';
            {
                var skillTypesObj = {};
                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('name'),
                    new nlobjSearchColumn('custrecord_hakuna_skills_uom')
                ];

                var search = nlapiCreateSearch('customrecord_hakuna_service_skill',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
                            if (!skillTypesObj[id]) {
                                var name = searchResults[k].getValue('name');
                                var uom = searchResults[k].getValue('custrecord_hakuna_skills_uom');
                                var uomText = searchResults[k].getText('custrecord_hakuna_skills_uom');
                                skillTypesObj[id] = {
                                    name : name,
                                    uom : uom,
                                    uomText : uomText
                                };
                            }
                        }
                    }
                    resultsStart += 1000;

                } while (searchResults && searchResults.length == 1000);
            }
      
            section = 'Get Groups';
            {
                var groups = {};
                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('name')
                ];

                var search = nlapiCreateSearch('customrecord_ecal_group',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
                            if (!groups[id]) {
                                var name = searchResults[k].getValue('name');
                                groups[id] = {
                                    name : name
                                };
                            }
                        }
                    }
                    resultsStart += 1000;

                } while (searchResults && searchResults.length == 1000);
            }
  
            section = 'Get User Groups';
            {
                var userGroups = {};
                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('custrecord_ecal_group_user_group'),
                    new nlobjSearchColumn('custrecord_ecal_group_user_user')
                ];

                var search = nlapiCreateSearch('customrecord_ecal_group_user',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
                            var groupname = searchResults[k].getText('custrecord_ecal_group_user_group');
                            var groupid = searchResults[k].getValue('custrecord_ecal_group_user_group');
                            var username = searchResults[k].getText('custrecord_ecal_group_user_user');
                            var userid = searchResults[k].getValue('custrecord_ecal_group_user_user');

                            if (!userGroups[userid]) {
                                userGroups[userid] = {
                                    groups : {}
                                };
                            }

                            if (!userGroups[userid].groups[groupid]) {
                                userGroups[userid].groups[groupid] = {
                                    groupname : groupname
                                };
                            }
                            
                            if (pUserGroups.indexOf(groupid) != -1 && pUserGroups_SMUserstoSelect.indexOf(userid) == -1) {
                                pUserGroups_SMUserstoSelect.push(userid);
                            }
                        }
                    }
                    resultsStart += 1000;

                } while (searchResults && searchResults.length == 1000);

            }

            section = 'Get User Skills';
            {
                var userSkills = {};
                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('custrecord_hakuna_skillset_service_skill'),
                    new nlobjSearchColumn('custrecord_hakuna_skillset_user')
                ];

                var search = nlapiCreateSearch('customrecord_hakuna_tech_skillset',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
                            var skillname = searchResults[k].getText('custrecord_hakuna_skillset_service_skill');
                            var skillid = searchResults[k].getValue('custrecord_hakuna_skillset_service_skill');
                            var username = searchResults[k].getText('custrecord_hakuna_skillset_user');
                            var userid = searchResults[k].getValue('custrecord_hakuna_skillset_user');

                            if (!userSkills[userid]) {
                                userSkills[userid] = {
                                    skills : {}
                                };
                            }

                            if (!userSkills[userid].skills[skillid]) {
                                userSkills[userid].skills[skillid] = {
                                    skillname : skillname
                                };
                            }
                        }
                    }
                    resultsStart += 1000;

                } while (searchResults && searchResults.length == 1000);

            }

            section = 'SM User';
            {
                var smUsers = {};
                smUsers[-1] = {
                    username : '- None -'
                };

                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('name'),
                    new nlobjSearchColumn('custrecord_hakuna_user_time_zone'),
                    new nlobjSearchColumn('custrecord_hakuna_user_employee')
                ];

                var search = nlapiCreateSearch('customrecord_hakuna_user',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
                            if (!smUsers[id]) {

                                var skillsNamePerUser = [];
                                if (userSkills[id]){
                                    for(var skillid in userSkills[id].skills){
                                        skillsNamePerUser.push(userSkills[id].skills[skillid].skillname);
                                    }    
                                }

                                var skillsIDPerUser = [];
                                if (userSkills[id]){
                                    for(var skillid in userSkills[id].skills){
                                        skillsIDPerUser.push(skillid);
                                    }    
                                }

                                var groupsNamePerUser = [];
                                if (userGroups[id]){
                                    for(var groupid in userGroups[id].groups){
                                        groupsNamePerUser.push(userGroups[id].groups[groupid].groupname);
                                    }    
                                }

                                var groupsIDPerUser = [];
                                if (userGroups[id]){
                                    for(var groupid in userGroups[id].groups){
                                        groupsIDPerUser.push(groupid);
                                    }    
                                }

                                smUsers[id] = {
                                    username : searchResults[k].getValue('name'),
                                    zoneText : searchResults[k].getText('custrecord_hakuna_user_time_zone'),
                                    skillName : skillsNamePerUser,
                                    groupName : groupsNamePerUser,
                                    zoneId : searchResults[k].getValue('custrecord_hakuna_user_time_zone'),
                                    skillId : skillsIDPerUser,
                                    groupId : groupsIDPerUser
                                };
                            }
                        }
                    }
                    resultsStart += 1000;
                } while (searchResults && searchResults.length == 1000);
                nlapiLogExecution('debug', 'smUsers', JSON.stringify(smUsers));
                
                timeZone = nlapiLookupField('employee',currentUser,'custentity_hakuna_time_zone') || '';
                currentUserName = nlapiGetContext().getName();
                
                if (!timeZone) {
                    var message = 'For currently connected user: ' + currentUserName + ', "Time Zone" is empty!. Please set a valid Time Zone in the connected employee record.';
                    var htmlerror = '<div id="div_notification" style="display:block; color:black; font-family:Tahoma,Geneva,Arial,sans-serif;font-size:13px; background:#fff8c4; border:1px solid #f2c779; font-weight:bold; margin:4px; padding:10px 36px;">';
                        htmlerror += '<div id="div_message">'+message+'</div></div>';
                    response.write(htmlerror);
                    return;
                }
            }

            section = 'Get WO records';
            {
                var woAllRecs = {};

                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('name'),
                    new nlobjSearchColumn('custrecord_ecal_event_work_status'),
                    new nlobjSearchColumn('custrecord_ecal_event_dispatch_status'),
                    new nlobjSearchColumn('custrecord_ecal_event_sm_customer'),
                    new nlobjSearchColumn('custrecord_ecal_event_expected_duration'),
                    new nlobjSearchColumn('custrecord_ecal_event_sm_site'),
                    new nlobjSearchColumn('custrecord_ecal_event_expected_start_dat'),
                    new nlobjSearchColumn('custrecord_ecal_event_expected_start_tim'),
                    new nlobjSearchColumn('custrecord_ecal_event_end_date_date'),
                    new nlobjSearchColumn('custrecord_ecal_event_assignedto'),
                    new nlobjSearchColumn('custrecord_ecal_event_wo_skills_required')
                ];

                var search = nlapiCreateSearch('customrecord_ecal_event',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
          
                            if (!woAllRecs[id]) {
                                woAllRecs[id] = {
                                    name : searchResults[k].getValue('name'),
                                    workstatusText : searchResults[k].getText('custrecord_ecal_event_work_status'),
                                    workstatusId : searchResults[k].getValue('custrecord_ecal_event_work_status'),
                                    dispatchstatusText : searchResults[k].getText('custrecord_ecal_event_dispatch_status'),
                                    dispatchstatusId : searchResults[k].getValue('custrecord_ecal_event_dispatch_status'),
                                    customerName : searchResults[k].getText('custrecord_ecal_event_sm_customer'),
                                    customerId : searchResults[k].getValue('custrecord_ecal_event_sm_customer'),
                                    locationsiteName : searchResults[k].getText('custrecord_ecal_event_sm_site'),
                                    locationsiteId : searchResults[k].getValue('custrecord_ecal_event_sm_site'),
                                    expected_duration : searchResults[k].getValue('custrecord_ecal_event_expected_duration'),
                                    expected_startdate : searchResults[k].getValue('custrecord_ecal_event_expected_start_dat'),
                                    expected_starttime : searchResults[k].getValue('custrecord_ecal_event_expected_start_tim'),
                                    expected_enddate : searchResults[k].getValue('custrecord_ecal_event_end_date_date'),
                                    assignedtoText : searchResults[k].getText('custrecord_ecal_event_assignedto').replace(/,/g, ', '),
                                    assignedtoId : searchResults[k].getValue('custrecord_ecal_event_assignedto').split(','),
                                    skillsneededText : searchResults[k].getText('custrecord_ecal_event_wo_skills_required').replace(/,/g, ', '),
                                    skillsneededId : searchResults[k].getValue('custrecord_ecal_event_wo_skills_required').split(',')
                                };
                            }
                        }
                    }
                    resultsStart += 1000;
                } while (searchResults && searchResults.length == 1000);
                
                if (woAllRecs.length == 0) {
                    var message = 'There is no suitable Work Order found. Please set a valid duration.';
                    var htmlerror = '<div id="div_notification" style="display:block; color:black; font-family:Tahoma,Geneva,Arial,sans-serif;font-size:13px; background:#fff8c4; border:1px solid #f2c779; font-weight:bold; margin:4px; padding:10px 36px;">';
                        htmlerror += '<div id="div_message">'+message+'</div></div>';
                    response.write(htmlerror);
                    return;
                }
                nlapiLogExecution('audit', 'woAllRecs', JSON.stringify(woAllRecs));
            }

            section = 'Get WO Status';
            {
                var statusAllLists = {};

                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('internalid').setSort(),
                    new nlobjSearchColumn('name')
                ];

                var search = nlapiCreateSearch('customlist_hakuna_wo_status_work',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
          
                            if (!statusAllLists[id]) {
                                statusAllLists[id] = {
                                    name : searchResults[k].getValue('name')
                                };
                            }
                        }
                    }
                    resultsStart += 1000;
                } while (searchResults && searchResults.length == 1000);
            }

            section = 'Get WO Scheduling/ Dispatch Status';
            {
                var dispatchstatusAllLists = {};

                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('internalid').setSort(),
                    new nlobjSearchColumn('name')
                ];

                var search = nlapiCreateSearch('customlist_hakuna_wo_status_scheduling',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
          
                            if (!dispatchstatusAllLists[id]) {
                                dispatchstatusAllLists[id] = {
                                    name : searchResults[k].getValue('name')
                                };
                            }
                        }
                    }
                    resultsStart += 1000;
                } while (searchResults && searchResults.length == 1000);
            }

            section = 'Get WO Customer';
            {
                var customerAllRecs = {};

                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('internalid').setSort(),
                    new nlobjSearchColumn('entityid'),
                    new nlobjSearchColumn("altname")
                ];

                var search = nlapiCreateSearch('customer',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
          
                            if (!customerAllRecs[id]) {
                                customerAllRecs[id] = {
                                    name : searchResults[k].getValue('altname')
                                    // name : searchResults[k].getValue('entityid') + ' ' + searchResults[k].getValue('altname')
                                };
                            }
                        }
                    }
                    resultsStart += 1000;
                } while (searchResults && searchResults.length == 1000);
            }

            section = 'Get Time Zones';
            {
                var tzAllRecs = {};

                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('name')
                ];

                var search = nlapiCreateSearch('customrecord_ecal_time_zone_name',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
          
                            if (!tzAllRecs[id]) {
                                tzAllRecs[id] = {
                                    name : searchResults[k].getValue('name')
                                };
                            }
                        }
                    }
                    resultsStart += 1000;
                } while (searchResults && searchResults.length == 1000);
            }

            section = 'Get WO Location / Site';
            {
                var sitesAllRecs = {};

                var filters = [
                    new nlobjSearchFilter('isinactive',null,'is','F')
                ];

                var columns = [
                    new nlobjSearchColumn('internalid').setSort(),
                    new nlobjSearchColumn('name')
                ];

                var search = nlapiCreateSearch('customrecord_hakuna_sites',filters,columns);
                var resultSet = search.runSearch();
                var resultsStart = 0;

                do{        
                    var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
                    if (searchResults && searchResults.length > 0){      
                        for(var k = 0; k < searchResults.length; k++){
                            var id = searchResults[k].getId();
          
                            if (!sitesAllRecs[id]) {
                                sitesAllRecs[id] = {
                                    name : searchResults[k].getValue('name')
                                };
                            }
                        }
                    }
                    resultsStart += 1000;
                } while (searchResults && searchResults.length == 1000);
            }

            section = 'Create Form';
            {
                var form = nlapiCreateForm('eCalendar');
                form.setScript('customscript_hakuna_ecalendar_cs');

                section = 'Style & Hidden fields';
                {
                    form.addField('custpage_skilltypestext','textarea','Skill Types Text').setDisplayType('hidden').setDefaultValue(JSON.stringify(skillTypesObj));
                    // userSkills
                    form.addField('custpage_wo_sourcetext','textarea','WO Source Text').setDisplayType('hidden').setDefaultValue(JSON.stringify(woAllRecs));
                    form.addField('custpage_tech_sourcetext','textarea','Tech Source Text').setDisplayType('hidden').setDefaultValue(JSON.stringify(smUsers));
                    
                    //Style - Header Filters
                    var htmlStyles = '';
                    htmlStyles += '<style>';
                    
                        htmlStyles += 'table{';
                            htmlStyles += 'width: auto !important;';
                        htmlStyles += '}';
                        
                        htmlStyles += 'html *{';
                            htmlStyles += 'vertical-align: top !important;';
                        htmlStyles += '}';
                    
                        htmlStyles += '.configtablefilter{';
                            htmlStyles += 'vertical-align: top !important;';
                            htmlStyles += 'border-collapse: collapse;';
                            htmlStyles += 'margin-right: 15px;';
                            htmlStyles += 'margin-top: 8px;';
                        htmlStyles += '}';
                    
                        htmlStyles += '.configtablefilter tbody tr{';
                            htmlStyles += 'vertical-align: top;';
                        htmlStyles += '}';
                    
                        htmlStyles += '.configbutton{';
                            htmlStyles += 'padding:0 14px;';
                            htmlStyles += 'font-weight: bold;';
                            htmlStyles += 'background-color: #777;';
                            htmlStyles += 'color: white;';
                        htmlStyles += '}';
                    
                        htmlStyles += '.smallgraytextnolink2{';
                            htmlStyles += 'font-size: 12px;';
                            htmlStyles += 'font-weight: normal !important;';
                            htmlStyles += 'color: #6f6f6f !important;';
                            htmlStyles += 'text-transform: uppercase;';
                        htmlStyles += '}';
                    
                        htmlStyles += '#custpage_table_wo, #custpage_table_tech {';
                            htmlStyles += 'font-size: 12px;';
                            htmlStyles += 'border-collapse: collapse;';
                            htmlStyles += 'margin-top: 20px;';
                        htmlStyles += '}';
                    
                        htmlStyles += '#custpage_table_wo td, #custpage_table_wo th, #custpage_table_tech td, #custpage_table_tech th {';
                            htmlStyles += 'border: 1px solid #ddd;';
                            htmlStyles += 'padding: 8px;';
                        htmlStyles += '}';
                    
                        htmlStyles += '#custpage_table_wo tr:hover {background-color: #f2f2f2;}';
                        htmlStyles += '#custpage_table_tech tr:hover {background-color: #f2f2f2;}';
                    
                        htmlStyles += '#custpage_table_wo th, #custpage_table_tech th {';
                            htmlStyles += 'padding-top: 8px;';
                            htmlStyles += 'padding-bottom: 8px;';
                            htmlStyles += 'font-weight: bold;';
                            htmlStyles += 'text-align: left;';
                            htmlStyles += 'background-color: #607799;';
                            htmlStyles += 'color: white;';
                        htmlStyles += '}';

                    htmlStyles += '</style>';
                }

                section = 'Filters: Preference';
                {                   
                    form.addFieldGroup('custpage_group_filters_pref','Filters For Preference');

                    //Select Preference: "Time Zone"
                    var timezoneField = form.addField('custpage_pref_timezone', 'select', 'Time Zone','customrecord_ecal_time_zone_name','custpage_group_filters_pref').setLayoutType('startrow','startcol');
                    timezoneField.setDefaultValue(timeZone);
                    timezoneField.setDisplayType('disabled');
                
                    //Float Preference: "Duration"
                    var eventDurationField = form.addField('custpage_pref_duration', 'float', 'Duration',null,'custpage_group_filters_pref');
                    eventDurationField.setLayoutType('startrow','startcol');
                    eventDurationField.setDefaultValue(9);
                    eventDurationField.setDisplaySize(16);

                    //Date Preference: "Start Date"
                    if (!pExpStartDate) {
                        var currentDate = new Date();
                        pExpStartDate = nlapiDateToString(currentDate);
                    }
                    var startDateField = form.addField('custpage_pref_startdate', 'date', 'Start Date', null, 'custpage_group_filters_pref');
                    startDateField.setLayoutType('startrow','startcol');
                    startDateField.setMandatory(true);
                    startDateField.setDefaultValue(pExpStartDate);
                    startDateField.setDisplaySize(20);
                    
                    //Date Preference: "End Date"
                    var endDateField = form.addField('custpage_pref_enddate', 'date', 'End Date', null, 'custpage_group_filters_pref');
                    endDateField.setLayoutType('startrow','startcol');
                    endDateField.setMandatory(true);
                    endDateField.setDefaultValue(pExpStartDate);
                    endDateField.setDisplaySize(20);

                    //Select Preference: "View Type"
                    var viewtypeField = form.addField('custpage_pref_viewtype', 'select', 'View Type',null,'custpage_group_filters_pref').setMandatory(true);
                    viewtypeField.setLayoutType('startrow','startcol');
                    viewtypeField.setDisplaySize(150);
                    if (pPreSelectedFilters) {
                        viewtypeField.setDisplayType('disabled');
                    }
                    var selectedviewtype = (viewtype == 1) ? true : false;
                    viewtypeField.addSelectOption('1', 'Daily',selectedviewtype);
                    selectedviewtype = (viewtype == 2) ? true : false;
                    viewtypeField.addSelectOption('2', 'Weekly',selectedviewtype);
                    selectedviewtype = (viewtype == 3) ? true : false;
                    viewtypeField.addSelectOption('3', 'Monthly',selectedviewtype);

                    //Select Preference: "Time Slots"
                    var timeslotsField = form.addField('custpage_pref_timeslots', 'select', 'Time Slots',null,'custpage_group_filters_pref').setMandatory(true);
                    timeslotsField.setLayoutType('startrow','startcol');
                    timeslotsField.setDisplaySize(150);
                    var selectedtimeslots = (custscript_ecal_time_slots == 1) ? true : false;
                    timeslotsField.addSelectOption('1', '1 hour',selectedtimeslots);
                    selectedtimeslots = (custscript_ecal_time_slots == 2) ? true : false;
                    timeslotsField.addSelectOption('2', '30 mins',selectedtimeslots);
                    selectedtimeslots = (custscript_ecal_time_slots == 3) ? true : false;
                    timeslotsField.addSelectOption('3', '15 mins',selectedtimeslots);

                    //Select Preference: "Time Format"
                    var timeformatField = form.addField('custpage_pref_timeformat', 'select', 'Time Format',null,'custpage_group_filters_pref').setMandatory(true);
                    timeformatField.setLayoutType('startrow','startcol');
                    timeformatField.setDisplaySize(150);
                    var selectedtimeformat = (timeformat == 'h:mm a') ? true : false;
                    timeformatField.addSelectOption('1', 'hh:mm am/pm',selectedtimeformat);
                    selectedtimeformat = (timeformat == 'H:mm') ? true : false;
                    timeformatField.addSelectOption('2', 'HH:mm',selectedtimeformat);
                    selectedtimeformat = (timeformat == 'h-mm a') ? true : false;
                    timeformatField.addSelectOption('3', 'hh-mm am/pm',selectedtimeformat);
                    selectedtimeformat = (timeformat == 'H-mm') ? true : false;
                    timeformatField.addSelectOption('4', 'HH-mm',selectedtimeformat);

                    //Select Preference: "Row Start Time"
                    var rowstartField = form.addField('custpage_pref_rowstart', 'select', 'Start Time',null,'custpage_group_filters_pref').setMandatory(true);
                    rowstartField.setLayoutType('startrow','startcol');
                    rowstartField.setDisplaySize(150);
                    var selectedrowstart = (getHourNumber(row_starttime) == 0) ? true : false;
                    rowstartField.addSelectOption('12:00 am', '12:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 1) ? true : false;
                    rowstartField.addSelectOption('1:00 am', '1:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 2) ? true : false;
                    rowstartField.addSelectOption('2:00 am', '2:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 3) ? true : false;
                    rowstartField.addSelectOption('3:00 am', '3:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 4) ? true : false;
                    rowstartField.addSelectOption('4:00 am', '4:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 5) ? true : false;
                    rowstartField.addSelectOption('5:00 am', '5:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 6) ? true : false;
                    rowstartField.addSelectOption('6:00 am', '6:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 7) ? true : false;
                    rowstartField.addSelectOption('7:00 am', '7:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 8) ? true : false;
                    rowstartField.addSelectOption('8:00 am', '8:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 9) ? true : false;
                    rowstartField.addSelectOption('9:00 am', '9:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 10) ? true : false;
                    rowstartField.addSelectOption('10:00 am', '10:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 11) ? true : false;
                    rowstartField.addSelectOption('11:00 am', '11:00 am',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 12) ? true : false;
                    rowstartField.addSelectOption('12:00 pm', '12:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 13) ? true : false;
                    rowstartField.addSelectOption('1:00 pm', '1:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 14) ? true : false;
                    rowstartField.addSelectOption('2:00 pm', '2:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 15) ? true : false;
                    rowstartField.addSelectOption('3:00 pm', '3:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 16) ? true : false;
                    rowstartField.addSelectOption('4:00 pm', '4:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 17) ? true : false;
                    rowstartField.addSelectOption('5:00 pm', '5:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 18) ? true : false;
                    rowstartField.addSelectOption('6:00 pm', '6:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 19) ? true : false;
                    rowstartField.addSelectOption('7:00 pm', '7:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 20) ? true : false;
                    rowstartField.addSelectOption('8:00 pm', '8:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 21) ? true : false;
                    rowstartField.addSelectOption('9:00 pm', '9:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 22) ? true : false;
                    rowstartField.addSelectOption('10:00 pm', '10:00 pm',selectedrowstart);
                    selectedrowstart = (getHourNumber(row_starttime) == 23) ? true : false;
                    rowstartField.addSelectOption('11:00 pm', '11:00 pm',selectedrowstart);

                    //Select Preference: "Row End Time"
                    var rowendField = form.addField('custpage_pref_rowend', 'select', 'End Time',null,'custpage_group_filters_pref').setMandatory(true);
                    rowendField.setLayoutType('startrow','startcol');
                    rowendField.setDisplaySize(150);
                    var selectedrowend = (getHourNumber(row_endtime) == 0) ? true : false;
                    rowendField.addSelectOption('12:00 am', '12:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 1) ? true : false;
                    rowendField.addSelectOption('1:00 am', '1:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 2) ? true : false;
                    rowendField.addSelectOption('2:00 am', '2:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 3) ? true : false;
                    rowendField.addSelectOption('3:00 am', '3:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 4) ? true : false;
                    rowendField.addSelectOption('4:00 am', '4:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 5) ? true : false;
                    rowendField.addSelectOption('5:00 am', '5:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 6) ? true : false;
                    rowendField.addSelectOption('6:00 am', '6:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 7) ? true : false;
                    rowendField.addSelectOption('7:00 am', '7:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 8) ? true : false;
                    rowendField.addSelectOption('8:00 am', '8:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 9) ? true : false;
                    rowendField.addSelectOption('9:00 am', '9:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 10) ? true : false;
                    rowendField.addSelectOption('10:00 am', '10:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 11) ? true : false;
                    rowendField.addSelectOption('11:00 am', '11:00 am',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 12) ? true : false;
                    rowendField.addSelectOption('12:00 pm', '12:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 13) ? true : false;
                    rowendField.addSelectOption('1:00 pm', '1:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 14) ? true : false;
                    rowendField.addSelectOption('2:00 pm', '2:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 15) ? true : false;
                    rowendField.addSelectOption('3:00 pm', '3:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 16) ? true : false;
                    rowendField.addSelectOption('4:00 pm', '4:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 17) ? true : false;
                    rowendField.addSelectOption('5:00 pm', '5:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 18) ? true : false;
                    rowendField.addSelectOption('6:00 pm', '6:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 19) ? true : false;
                    rowendField.addSelectOption('7:00 pm', '7:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 20) ? true : false;
                    rowendField.addSelectOption('8:00 pm', '8:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 21) ? true : false;
                    rowendField.addSelectOption('9:00 pm', '9:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 22) ? true : false;
                    rowendField.addSelectOption('10:00 pm', '10:00 pm',selectedrowend);
                    selectedrowend = (getHourNumber(row_endtime) == 23) ? true : false;
                    rowendField.addSelectOption('11:00 pm', '11:00 pm',selectedrowend);

                    //Select "SM Subsidiary"
                    var smSubsidiaryEnabled = isDisabled;
                    var subsidiary = 0;
                    if (enabledSubsidiary) {
                        subsidiary = nlapiLookupField('employee',currentUser,'subsidiary') || '';
                        smSubsidiaryEnabled = 'normal';
                    }
                    else {
                        smSubsidiaryEnabled = 'disabled';
                    }

                    var htmlFilterSubsidiary = '<table class="configtablefilter">';
                        htmlFilterSubsidiary += '<tbody>';
                            htmlFilterSubsidiary += '<tr>';

                                htmlFilterSubsidiary += '<td>';
                                    htmlFilterSubsidiary += '<label class="smallgraytextnolink2">SM Subsidiary</label><label class="uir-required-icon">*</label></br>';
                                    htmlFilterSubsidiary += '<select id="custpage_smsubsidiary" name="smsubsidiary" style="width:150px" onchange="" '+smSubsidiaryEnabled+'>';
                                        htmlFilterSubsidiary += '<option value=""></option>';
                                        for (var id in smsubsidiary){
                                            var select = '';
                                            if (smsubsidiaryWO) {
                                                if (smsubsidiary[id].smsubsidiary == smsubsidiaryWO) {
                                                    select = 'selected';
                                                }
                                            }
                                            else {
                                                if (id == subsidiary) {
                                                    select = 'selected';
                                                }
                                            }
                                            htmlFilterSubsidiary += '<option value="' + smsubsidiary[id].smsubsidiary + '" '+select+'>' + smsubsidiary[id].name + '</option>';
                                        }
                                    htmlFilterSubsidiary += '</select>';
                                htmlFilterSubsidiary += '</td>';
                            htmlFilterSubsidiary += '<tr>';
                        htmlFilterSubsidiary += '<tbody>';
                    htmlFilterSubsidiary += '</table>';

                    form.addField('custpage_pref_htmlsubsidiary','inlinehtml','',null,'custpage_group_filters_pref').setLayoutType('startrow','startcol').setDisplayType(smSubsidiaryEnabled).setDefaultValue(htmlStyles+htmlFilterSubsidiary);
                    
                }

                section = 'Filters for Work Orders';
                {
                                    
                    form.addFieldGroup('custpage_group_filters_wo','Filters For Work Orders');
                    
                    //Multiple Select "Work Orders"
                    var htmlFilterWOWorkOrder = '<table class="configtablefilter">';
                    htmlFilterWOWorkOrder += '<tbody>';
                        htmlFilterWOWorkOrder += '<tr>';
                            htmlFilterWOWorkOrder += '<td>';
                                htmlFilterWOWorkOrder += '<label class="smallgraytextnolink2">Work Order</label></br>';
                                htmlFilterWOWorkOrder += '<select id="custpage_wo_workorder" name="woworkorder" multiple style="width:200px; height:auto;" onchange="updateTableWO();" '+isDisabled+'>';
                                for(var woid in woAllRecs){
                                    htmlFilterWOWorkOrder += '<option value="' + woid + '" selected>' + woAllRecs[woid].name + '</option>';
                                }
                                htmlFilterWOWorkOrder += '</select>';
                            htmlFilterWOWorkOrder += '</td>';
                        htmlFilterWOWorkOrder += '<tr>';
                    htmlFilterWOWorkOrder += '<tbody>';
                    htmlFilterWOWorkOrder += '</table>';
                    
                    form.addField('custpage_htmlfilterwoworkorder','inlinehtml','',null,'custpage_group_filters_wo').setBreakType('startcol').setDefaultValue(htmlFilterWOWorkOrder);
                    
                    //Checkbox "Select All SM Users"
                    var htmlFilterallwoworkorders= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlFilterallwoworkorders+= '<tbody>';
                            htmlFilterallwoworkorders+= '<tr>';
                            
                                htmlFilterallwoworkorders+= '<td rowspan="2">';
                                    htmlFilterallwoworkorders+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_wo_workorder\');" id="custpage_allwoworkorders" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select all Work Orders</label>';
                                htmlFilterallwoworkorders+= '</td>';
                                
                            htmlFilterallwoworkorders+= '<tr>';
                        htmlFilterallwoworkorders+= '<tbody>';
                    htmlFilterallwoworkorders+= '</table>';
                        
                    form.addField('custpage_htmlallworkorders','inlinehtml','',null,'custpage_group_filters_wo').setDefaultValue(htmlFilterallwoworkorders);
                    
                    //Multiple Select "WO: Status"
                    var htmlFilterWOStatus = '<table class="configtablefilter">';
                    htmlFilterWOStatus += '<tbody>';
                        htmlFilterWOStatus += '<tr>';
                            htmlFilterWOStatus += '<td>';
                                htmlFilterWOStatus += '<label class="smallgraytextnolink2">Status</label></br>';
                                htmlFilterWOStatus += '<select id="custpage_wo_status" name="wostatus" multiple style="width:200px; height:auto;" onchange="updateTableWO();" '+isDisabled+'>';
                                for(var id in statusAllLists){
                                    htmlFilterWOStatus += '<option value="' + id + '" selected>' + statusAllLists[id].name + '</option>';
                                }
                                htmlFilterWOStatus += '</select>';
                            htmlFilterWOStatus += '</td>';
                        htmlFilterWOStatus += '<tr>';
                    htmlFilterWOStatus += '<tbody>';
                    htmlFilterWOStatus += '</table>';
                    
                    form.addField('custpage_htmlfilterwostatus','inlinehtml','',null,'custpage_group_filters_wo').setBreakType('startcol').setDefaultValue(htmlFilterWOStatus);
                    
                    //Checkbox "Select All WO Status"
                    var htmlAllWOStatus= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlAllWOStatus+= '<tbody>';
                            htmlAllWOStatus+= '<tr>';
                                htmlAllWOStatus+= '<td rowspan="2">';
                                    htmlAllWOStatus+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_wo_status\');" id="custpage_allwostatus" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select All Status</label>';
                                htmlAllWOStatus+= '</td>';
                            htmlAllWOStatus+= '<tr>';
                        htmlAllWOStatus+= '<tbody>';
                    htmlAllWOStatus+= '</table>';
                        
                    form.addField('custpage_htmlallwostatus','inlinehtml','',null,'custpage_group_filters_wo').setDefaultValue(htmlAllWOStatus);
                    
                    //Multiple Select "WO: Scheduling/ Dispatch Status"
                    var htmlFilterWODispStatus = '<table class="configtablefilter">';
                    htmlFilterWODispStatus += '<tbody>';
                        htmlFilterWODispStatus += '<tr>';
                            htmlFilterWODispStatus += '<td>';
                                htmlFilterWODispStatus += '<label class="smallgraytextnolink2">Scheduling/Dispatch Status</label></br>';
                                htmlFilterWODispStatus += '<select id="custpage_wo_dispstatus" name="wodispstatus" multiple style="width:200px; height:auto;" onchange="updateTableWO();" '+isDisabled+'>';
                                for(var id in dispatchstatusAllLists){
                                    htmlFilterWODispStatus += '<option value="' + id + '" selected>' + dispatchstatusAllLists[id].name + '</option>';
                                }
                                htmlFilterWODispStatus += '</select>';
                            htmlFilterWODispStatus += '</td>';
                        htmlFilterWODispStatus += '<tr>';
                    htmlFilterWODispStatus += '<tbody>';
                    htmlFilterWODispStatus += '</table>';
                    
                    form.addField('custpage_htmlfilterwodispstatus','inlinehtml','',null,'custpage_group_filters_wo').setBreakType('startcol').setDefaultValue(htmlFilterWODispStatus);
                    
                    //Checkbox "Select All WO Scheduling/ Dispatch Status"
                    var htmlAllWODispStatus= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlAllWODispStatus+= '<tbody>';
                            htmlAllWODispStatus+= '<tr>';
                                htmlAllWODispStatus+= '<td rowspan="2">';
                                    htmlAllWODispStatus+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_wo_dispstatus\');" id="custpage_allwodispstatus" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select All Scheduling/Dispatch Status</label>';
                                htmlAllWODispStatus+= '</td>';
                            htmlAllWODispStatus+= '<tr>';
                        htmlAllWODispStatus+= '<tbody>';
                    htmlAllWODispStatus+= '</table>';
                        
                    form.addField('custpage_htmlallwodispstatus','inlinehtml','',null,'custpage_group_filters_wo').setDefaultValue(htmlAllWODispStatus);
                    
                    //Multiple Select "WO: Customer"
                    var htmlFilterWOCustomer = '<table class="configtablefilter">';
                    htmlFilterWOCustomer += '<tbody>';
                        htmlFilterWOCustomer += '<tr>';
                            htmlFilterWOCustomer += '<td>';
                                htmlFilterWOCustomer += '<label class="smallgraytextnolink2">Customer</label></br>';
                                htmlFilterWOCustomer += '<select id="custpage_wo_customer" name="wocustomer" multiple style="width:200px; height:auto;" onchange="updateTableWO();" '+isDisabled+'>';
                                for(var id in customerAllRecs){
                                    htmlFilterWOCustomer += '<option value="' + id + '" selected>' + customerAllRecs[id].name + '</option>';
                                }
                                htmlFilterWOCustomer += '</select>';
                            htmlFilterWOCustomer += '</td>';
                        htmlFilterWOCustomer += '<tr>';
                    htmlFilterWOCustomer += '<tbody>';
                    htmlFilterWOCustomer += '</table>';
                    
                    form.addField('custpage_htmlfilterwocustomer','inlinehtml','',null,'custpage_group_filters_wo').setBreakType('startcol').setDefaultValue(htmlFilterWOCustomer);
                    
                    //Checkbox "Select All WO Customer"
                    var htmlAllWOCustomer= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlAllWOCustomer+= '<tbody>';
                            htmlAllWOCustomer+= '<tr>';
                                htmlAllWOCustomer+= '<td rowspan="2">';
                                    htmlAllWOCustomer+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_wo_customer\');" id="custpage_allwocustomer" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select All Customers</label>';
                                htmlAllWOCustomer+= '</td>';
                            htmlAllWOCustomer+= '<tr>';
                        htmlAllWOCustomer+= '<tbody>';
                    htmlAllWOCustomer+= '</table>';
                        
                    form.addField('custpage_htmlallwocustomer','inlinehtml','',null,'custpage_group_filters_wo').setDefaultValue(htmlAllWOCustomer);
                    
                    //Multiple Select "WO: Location / Site"
                    var htmlFilterWOSite = '<table class="configtablefilter">';
                    htmlFilterWOSite += '<tbody>';
                        htmlFilterWOSite += '<tr>';
                            htmlFilterWOSite += '<td>';
                                htmlFilterWOSite += '<label class="smallgraytextnolink2">Location / Site</label></br>';
                                htmlFilterWOSite += '<select id="custpage_wo_site" name="wosite" multiple style="width:200px; height:auto;" onchange="updateTableWO();" '+isDisabled+'>';
                                for(var id in sitesAllRecs){
                                    htmlFilterWOSite += '<option value="' + id + '" selected>' + sitesAllRecs[id].name + '</option>';
                                }
                                htmlFilterWOSite += '</select>';
                            htmlFilterWOSite += '</td>';
                        htmlFilterWOSite += '<tr>';
                    htmlFilterWOSite += '<tbody>';
                    htmlFilterWOSite += '</table>';
                    
                    form.addField('custpage_htmlfilterwosite','inlinehtml','',null,'custpage_group_filters_wo').setBreakType('startcol').setDefaultValue(htmlFilterWOSite);
                    
                    //Checkbox "Select All WO Location / Site"
                    var htmlAllWOSite= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlAllWOSite+= '<tbody>';
                            htmlAllWOSite+= '<tr>';
                                htmlAllWOSite+= '<td rowspan="2">';
                                    htmlAllWOSite+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_wo_site\');" id="custpage_allwosite" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select All Location/Site</label>';
                                htmlAllWOSite+= '</td>';
                            htmlAllWOSite+= '<tr>';
                        htmlAllWOSite+= '<tbody>';
                    htmlAllWOSite+= '</table>';
                        
                    form.addField('custpage_htmlallwosite','inlinehtml','',null,'custpage_group_filters_wo').setDefaultValue(htmlAllWOSite);
                    
                    //Multiple Select "WO: Assigned to"
                    var htmlFilterWOAssigned = '<table class="configtablefilter">';
                        htmlFilterWOAssigned += '<tbody>';
                            htmlFilterWOAssigned += '<tr>';
                                htmlFilterWOAssigned += '<td>';
                                    htmlFilterWOAssigned += '<label class="smallgraytextnolink2">Assigned to</label></br>';
                                    htmlFilterWOAssigned += '<select id="custpage_wo_assigned" name="woassigned" multiple style="width:200px; height:auto;" onchange="updateTableWO();" '+isDisabled+'>';
                                        for(var userid in smUsers){
                                            htmlFilterWOAssigned += '<option value="' + userid + '" selected>' + smUsers[userid].username + '</option>';
                                        }
                                    htmlFilterWOAssigned += '</select>';
                                htmlFilterWOAssigned += '</td>';
                            htmlFilterWOAssigned += '<tr>';
                        htmlFilterWOAssigned += '<tbody>';
                    htmlFilterWOAssigned += '</table>';
                    
                    form.addField('custpage_htmlfilterwoassigned','inlinehtml','',null,'custpage_group_filters_wo').setBreakType('startcol').setDefaultValue(htmlFilterWOAssigned);
                    
                    //Checkbox "Select All WO Assigned to"
                    var htmlAllWOAssigned= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlAllWOAssigned+= '<tbody>';
                            htmlAllWOAssigned+= '<tr>';
                            
                                htmlAllWOAssigned+= '<td rowspan="2">';
                                    htmlAllWOAssigned+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_wo_assigned\');" id="custpage_allwoassigned" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select All Assigned to</label>';
                                htmlAllWOAssigned+= '</td>';
                                
                            htmlAllWOAssigned+= '<tr>';
                        htmlAllWOAssigned+= '<tbody>';
                    htmlAllWOAssigned+= '</table>';
                        
                    form.addField('custpage_htmlallwoassigned','inlinehtml','',null,'custpage_group_filters_wo').setDefaultValue(htmlAllWOAssigned);

                    //Multiple Select "WO: Skill Needed"
                    var htmlFilterWOSkills = '<table class="configtablefilter">';
                        htmlFilterWOSkills += '<tbody>';
                            htmlFilterWOSkills += '<tr>';
                                htmlFilterWOSkills += '<td rowspan="2">';
                                    htmlFilterWOSkills += '<label class="smallgraytextnolink2">Skills Needed</label></br>';
                                    htmlFilterWOSkills += '<select multiple id="custpage_wo_skills" name="woskills" style="width:200px; height:auto;" onchange="updateTableWO();" '+isDisabled+'>';
                                    for(var skill_id in skillTypesObj){
                                        htmlFilterWOSkills += '<option value="' + skill_id + '" selected>' + skillTypesObj[skill_id].name + '</option>';
                                    }
                                    htmlFilterWOSkills += '</select>';
                                htmlFilterWOSkills += '</td>';
                                
                            htmlFilterWOSkills += '<tr>';
                        htmlFilterWOSkills += '<tbody>';
                    htmlFilterWOSkills += '</table>';
                        
                    form.addField('custpage_htmlfilterwoskills','inlinehtml','',null,'custpage_group_filters_wo').setBreakType('startcol').setDefaultValue(htmlFilterWOSkills); 
                    
                    //Checkbox "Select All WO Skill Needed"
                    var htmlAllWOSkills = '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlAllWOSkills += '<tbody>';
                            htmlAllWOSkills += '<tr>';
                            
                                htmlAllWOSkills += '<td rowspan="2">';
                                    htmlAllWOSkills += '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_wo_skills\');" id="custpage_allwoskills" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select All Needed Skills</label>';
                                htmlAllWOSkills += '</td>';
                                
                            htmlAllWOSkills += '<tr>';
                        htmlAllWOSkills += '<tbody>';
                    htmlAllWOSkills += '</table>';
                    
                    form.addField('custpage_htmlallwoskills','inlinehtml',null,null,'custpage_group_filters_wo').setDefaultValue(htmlAllWOSkills);
                    
                    //Select "WO: Expected Start Time"
                    var woStartTimeField = form.addField('custpage_wo_starttime', 'select', 'Expected Start Time',null,'custpage_group_filters_wo');
                    woStartTimeField.setLayoutType('startrow','startcol');
                    woStartTimeField.setDisplaySize(140);
                    var wo_starttime = "00:00";
                    var selectedwostarttime = (getHourNumber(wo_starttime) == 0) ? true : false;
                    woStartTimeField.addSelectOption('12:00 am', '12:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 1) ? true : false;
                    woStartTimeField.addSelectOption('1:00 am', '1:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 2) ? true : false;
                    woStartTimeField.addSelectOption('2:00 am', '2:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 3) ? true : false;
                    woStartTimeField.addSelectOption('3:00 am', '3:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 4) ? true : false;
                    woStartTimeField.addSelectOption('4:00 am', '4:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 5) ? true : false;
                    woStartTimeField.addSelectOption('5:00 am', '5:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 6) ? true : false;
                    woStartTimeField.addSelectOption('6:00 am', '6:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 7) ? true : false;
                    woStartTimeField.addSelectOption('7:00 am', '7:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 8) ? true : false;
                    woStartTimeField.addSelectOption('8:00 am', '8:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 9) ? true : false;
                    woStartTimeField.addSelectOption('9:00 am', '9:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 10) ? true : false;
                    woStartTimeField.addSelectOption('10:00 am', '10:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 11) ? true : false;
                    woStartTimeField.addSelectOption('11:00 am', '11:00 am',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 12) ? true : false;
                    woStartTimeField.addSelectOption('12:00 pm', '12:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 13) ? true : false;
                    woStartTimeField.addSelectOption('1:00 pm', '1:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 14) ? true : false;
                    woStartTimeField.addSelectOption('2:00 pm', '2:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 15) ? true : false;
                    woStartTimeField.addSelectOption('3:00 pm', '3:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 16) ? true : false;
                    woStartTimeField.addSelectOption('4:00 pm', '4:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 17) ? true : false;
                    woStartTimeField.addSelectOption('5:00 pm', '5:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 18) ? true : false;
                    woStartTimeField.addSelectOption('6:00 pm', '6:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 19) ? true : false;
                    woStartTimeField.addSelectOption('7:00 pm', '7:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 20) ? true : false;
                    woStartTimeField.addSelectOption('8:00 pm', '8:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 21) ? true : false;
                    woStartTimeField.addSelectOption('9:00 pm', '9:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 22) ? true : false;
                    woStartTimeField.addSelectOption('10:00 pm', '10:00 pm',selectedwostarttime);
                    selectedwostarttime = (getHourNumber(wo_starttime) == 23) ? true : false;
                    woStartTimeField.addSelectOption('11:00 pm', '11:00 pm',selectedwostarttime);

                    //Float "WO: Expected Duration"
                    var woDurationField = form.addField('custpage_wo_duration', 'float', 'Expected Duration',null,'custpage_group_filters_wo');
                    woDurationField.setDefaultValue(9);
                    woDurationField.setDisplaySize(16);

                    //Date "WO: Expected Start Date"
                    var woStartDateField = form.addField('custpage_wo_startdate', 'date', 'Expected Start Date', null, 'custpage_group_filters_wo');
                    woStartDateField.setLayoutType('startrow','startcol');
                    woStartDateField.setDefaultValue(pExpStartDate);
                    woStartDateField.setDisplaySize(20);
                    
                    //Date "WO: Expected End Date"
                    var woEndDateField = form.addField('custpage_wo_enddate', 'date', 'Expected End Date', null, 'custpage_group_filters_wo');
                    woEndDateField.setDefaultValue(pExpStartDate);
                    woEndDateField.setDisplaySize(20);

                }

                section = 'Filters for Technicians';
                {
                    form.addFieldGroup('custpage_group_filters_tech','Filters For Technicians');

                    //Multiple Select "SM Users"
                    var htmlFilterUser = '<table class="configtablefilter">';
                        htmlFilterUser += '<tbody>';
                            htmlFilterUser += '<tr>';
                                htmlFilterUser += '<td>';
                                    htmlFilterUser += '<label class="smallgraytextnolink2">Name</label></br>';
                                    htmlFilterUser += '<select id="custpage_users" name="users" multiple style="width:180px; height:auto;" onchange="updateTableTechnician();" '+isDisabled+'>';
                                        for(var userid in smUsers){
                                            var selected = '';
                                            // if (pUserGroups_SMUserstoSelect.indexOf(userid) != -1) {
                                                selected = 'selected';
                                            // }
                                            if (userid != -1){
                                                htmlFilterUser += '<option value="' + userid + '" '+selected+'>' + smUsers[userid].username + '</option>';
                                            }
                                        }
                                    htmlFilterUser += '</select>';
                                htmlFilterUser += '</td>';
                            htmlFilterUser += '<tr>';
                        htmlFilterUser += '<tbody>';
                    htmlFilterUser += '</table>';
                    
                    form.addField('custpage_htmlfilteruser','inlinehtml','',null,'custpage_group_filters_tech').setBreakType('startcol').setDefaultValue(htmlFilterUser);
                    
                    //Checkbox "Select All SM Users"
                    var htmlFilterallsmusers= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlFilterallsmusers+= '<tbody>';
                            htmlFilterallsmusers+= '<tr>';
                            
                                htmlFilterallsmusers+= '<td rowspan="2">';
                                    htmlFilterallsmusers+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_users\');" id="custpage_allsmusers" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select all SM Users</label>';
                                htmlFilterallsmusers+= '</td>';
                                
                            htmlFilterallsmusers+= '<tr>';
                        htmlFilterallsmusers+= '<tbody>';
                    htmlFilterallsmusers+= '</table>';
                        
                    form.addField('custpage_htmlallsmusers','inlinehtml','',null,'custpage_group_filters_tech').setDefaultValue(htmlFilterallsmusers);

                    //Multiple Select "Time Zones"
                    var htmlFilterTechTimeZone = '<table class="configtablefilter">';
                    htmlFilterTechTimeZone += '<tbody>';
                        htmlFilterTechTimeZone += '<tr>';
                            htmlFilterTechTimeZone += '<td>';
                                htmlFilterTechTimeZone += '<label class="smallgraytextnolink2">Zone</label></br>';
                                htmlFilterTechTimeZone += '<select id="custpage_tech_timezone" name="techtimezone" multiple style="width:300px; height:auto;" onchange="updateTableTechnician();" '+isDisabled+'>';
                                for(var tzid in tzAllRecs){
                                    htmlFilterTechTimeZone += '<option value="' + tzid + '" selected>' + tzAllRecs[tzid].name + '</option>';
                                }
                                htmlFilterTechTimeZone += '</select>';
                            htmlFilterTechTimeZone += '</td>';
                        htmlFilterTechTimeZone += '<tr>';
                    htmlFilterTechTimeZone += '<tbody>';
                    htmlFilterTechTimeZone += '</table>';
                    
                    form.addField('custpage_htmlfiltertechtimezone','inlinehtml','',null,'custpage_group_filters_tech').setBreakType('startcol').setDefaultValue(htmlFilterTechTimeZone);
                    
                    //Checkbox "Select All Time Zones"
                    var htmlFilterAllTechTimeZone= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlFilterAllTechTimeZone+= '<tbody>';
                            htmlFilterAllTechTimeZone+= '<tr>';
                            
                                htmlFilterAllTechTimeZone+= '<td rowspan="2">';
                                    htmlFilterAllTechTimeZone+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_tech_timezone\');" id="custpage_alltechtimezones" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select All Time Zones</label>';
                                htmlFilterAllTechTimeZone+= '</td>';
                                
                            htmlFilterAllTechTimeZone+= '<tr>';
                        htmlFilterAllTechTimeZone+= '<tbody>';
                    htmlFilterAllTechTimeZone+= '</table>';
                        
                    form.addField('custpage_htmlalltechtimezones','inlinehtml','',null,'custpage_group_filters_tech').setDefaultValue(htmlFilterAllTechTimeZone);

                    //Multiple Select "Skill Types"
                    var htmlFilterSkillTypes = '<table class="configtablefilter">';
                        htmlFilterSkillTypes += '<tbody>';
                            htmlFilterSkillTypes += '<tr>';
                                htmlFilterSkillTypes += '<td rowspan="2">';
                                    htmlFilterSkillTypes += '<label class="smallgraytextnolink2">Skills</label><label class="uir-required-icon">*</label></br>';
                                    htmlFilterSkillTypes += '<select multiple id="custpage_skilltypes" name="skilltypes" style="width:200px; height:auto;" onchange="updateTableTechnician();" '+isDisabled+'>';

                                        for(var skill_id in skillTypesObj){
                                            // if (skillTypesObj[skill_id]) {
                                                var skillname = skillTypesObj[skill_id].name;
                                                htmlFilterSkillTypes += '<option value="' + skill_id + '" selected>' + skillname + '</option>';
                                            // }
                                        }

                                        htmlFilterSkillTypes += '</select>';
                                htmlFilterSkillTypes += '</td>';
                                
                            htmlFilterSkillTypes += '<tr>';
                        htmlFilterSkillTypes += '<tbody>';
                    htmlFilterSkillTypes += '</table>';
                        
                    form.addField('custpage_htmlfilterskills','inlinehtml','',null,'custpage_group_filters_tech').setBreakType('startcol').setDefaultValue(htmlFilterSkillTypes); 
                    
                    //Checkbox "Select All Skill Types"
                    var htmlFilterallskilltypes = '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlFilterallskilltypes += '<tbody>';
                            htmlFilterallskilltypes += '<tr>';
                            
                                htmlFilterallskilltypes += '<td rowspan="2">';
                                    htmlFilterallskilltypes += '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_skilltypes\');" id="custpage_allskilltypes" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select all Skills</label>';
                                htmlFilterallskilltypes += '</td>';
                                
                            htmlFilterallskilltypes += '<tr>';
                        htmlFilterallskilltypes += '<tbody>';
                    htmlFilterallskilltypes += '</table>';
                    
                    form.addField('custpage_htmlallskilltypes','inlinehtml',null,null,'custpage_group_filters_tech').setDefaultValue(htmlFilterallskilltypes);
                    

                    //Multiple Select "SM User Groups"
                    var htmlFilterGroupUser = '<table class="configtablefilter">';
                        htmlFilterGroupUser += '<tbody>';
                            htmlFilterGroupUser += '<tr>';
                                htmlFilterGroupUser += '<td>';
                                    htmlFilterGroupUser += '<label class="smallgraytextnolink2">User Group(s)</label></br>';
                                    htmlFilterGroupUser += '<select id="custpage_group" name="group" multiple style="width:180px; height:auto;" onchange="updateTableTechnician();" '+isDisabled+'>';
                                        for (var groupId in groups){
                                            var selected = '';
                                            // if (pUserGroups.indexOf(groupId) != -1) {
                                                selected = 'selected';
                                            // }
                                            htmlFilterGroupUser += '<option value="' + groupId + '" '+selected+'>' + groups[groupId].name + '</option>';
                                        }
                                    htmlFilterGroupUser += '</select>';
                                htmlFilterGroupUser += '</td>';
                                
                            htmlFilterGroupUser += '<tr>';
                        htmlFilterGroupUser += '<tbody>';
                    htmlFilterGroupUser += '</table>';
                        
                    form.addField('custpage_htmlfiltergroupuser','inlinehtml','',null,'custpage_group_filters_tech').setBreakType('startcol').setDefaultValue(htmlFilterGroupUser);
                    
                    //Checkbox "Select All SM User Groups"
                    var htmlFilterallsmusergroups= '<table class="configtablefilter" style="margin-top:5px;">';
                        htmlFilterallsmusergroups+= '<tbody>';
                            htmlFilterallsmusergroups+= '<tr>';
                            
                                htmlFilterallsmusergroups+= '<td rowspan="2">';
                                    htmlFilterallsmusergroups+= '<input type="checkbox" onclick="selectAll(this.checked, \'custpage_group\');" id="custpage_allsmusergroups" checked '+isDisabled+'/>&nbsp;<label class="smallgraytextnolink2">Select all User Groups</label>';
                                htmlFilterallsmusergroups+= '</td>';
                                
                            htmlFilterallsmusergroups+= '<tr>';
                        htmlFilterallsmusergroups+= '<tbody>';
                    htmlFilterallsmusergroups+= '</table>';
                    
                    form.addField('custpage_htmlallsmusergroups','inlinehtml',null,null,'custpage_group_filters_tech').setDefaultValue(htmlFilterallsmusergroups);
                                
                }

                section = 'Tables';
                {
                    
                    //Table "Work Orders"
                    var htmlWOTable = '<table id="custpage_table_wo" class="workorder" style="width:1250px; maring-left:-20px;">';
                        htmlWOTable += '<thead>';
                            htmlWOTable += '<tr>';
                                htmlWOTable += '<th></th>';
                                htmlWOTable += '<th>WO#</th>';
                                htmlWOTable += '<th>Status</th>';
                                htmlWOTable += '<th>Scheduling / Dispatch Status</th>';
                                htmlWOTable += '<th>Customer</th>';
                                htmlWOTable += '<th>Location / Site</th>';
                                htmlWOTable += '<th>Expected Duration</th>';
                                htmlWOTable += '<th>Expected Start Date</th>';
                                htmlWOTable += '<th>Expected Start Time</th>';
                                htmlWOTable += '<th>Expected End Date</th>';
                                htmlWOTable += '<th>Assigned to</th>';
                                htmlWOTable += '<th>Skills Needed</th>';
                            htmlWOTable += '</tr>';
                        htmlWOTable += '</thead>';
                        htmlWOTable += '<tbody>';
                            for(var woid in woAllRecs){
                                htmlWOTable += '<tr id="wo'+woid+'">';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += '<input type="radio" id="custpage_radio_woid" name="radiowoid" value="'+woid+'">';
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].name;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].workstatusText;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].dispatchstatusText;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].customerName;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].locationsiteName;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].expected_duration;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].expected_startdate;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].expected_starttime;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].expected_enddate;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].assignedtoText;
                                    htmlWOTable += '</td>';
                                    htmlWOTable += '<td>';
                                        htmlWOTable += woAllRecs[woid].skillsneededText;
                                    htmlWOTable += '</td>';
                                htmlWOTable += '<tr>';
                            }
                        htmlWOTable += '<tbody>';
                    htmlWOTable += '</table>';
                    
                    form.addField('custpage_htmlwotable','inlinehtml').setLayoutType('startrow').setDefaultValue(htmlWOTable);
                    
                    //Table "Technicians"
                    var htmlTechTable = '<table id="custpage_table_tech" class="technician" style="width:600px; margin-left:20px;">';
                        htmlTechTable += '<thead>';
                            htmlTechTable += '<tr>';
                                htmlTechTable += '<th><input type="checkbox" onclick="selectTableAll(this.checked, \'custpage_table_tech\');" id="custpage_checkbox_selectAll" name="allcheckboxtechid" checked></th>';
                                htmlTechTable += '<th>Name</th>';
                                htmlTechTable += '<th>Zone</th>';
                                htmlTechTable += '<th>Skills</th>';
                                htmlTechTable += '<th>User Group</th>';
                            htmlTechTable += '</tr>';
                        htmlTechTable += '</thead>';
                        htmlTechTable += '<tbody>';
                            for(var smid in smUsers){
                                if (smid != -1){
                                    htmlTechTable += '<tr id="tech'+smid+'">';
                                    htmlTechTable += '<td>';
                                        htmlTechTable += '<input type="checkbox" id="custpage_checkbox_techid" name="checkboxtechid" value="'+smid+'" checked>';
                                    htmlTechTable += '</td>';
                                    htmlTechTable += '<td>';
                                        htmlTechTable += smUsers[smid].username;
                                    htmlTechTable += '</td>';
                                    htmlTechTable += '<td>';
                                        htmlTechTable += smUsers[smid].zoneText;
                                    htmlTechTable += '</td>';
                                    htmlTechTable += '<td>';
                                        htmlTechTable += smUsers[smid].skillName;
                                    htmlTechTable += '</td>';
                                    htmlTechTable += '<td>';
                                        htmlTechTable += smUsers[smid].groupName;
                                    htmlTechTable += '</td>';
                                }
                            }
                        htmlTechTable += '<tbody>';
                    htmlTechTable += '</table>';
                    
                    form.addField('custpage_htmltechtable','inlinehtml').setLayoutType('midrow','startcol').setDefaultValue(htmlTechTable);
                }

                //Buttons "Submit, Previous Week, Next Week"
                var htmlButtons = '<table style="margin-top:20px;">';
                    htmlButtons += '<tbody>';
                        htmlButtons += '<tr>';
                            htmlButtons += '<td>';
                                htmlButtons += '<input type="button" id="btn_submit" value="Submit" class="configbutton" style="background-color:#006600; color:#FFFFFF;" onclick="submitButton(false);">';
                            htmlButtons += '</td>';
                            htmlButtons += '<td>';
                                htmlButtons += '<input type="button" id="btn_previousweek" value="Previous Week" class="configbutton" onclick="weekButton(\'previous\');">';
                            htmlButtons += '</td>';
                            htmlButtons += '<td>';
                                htmlButtons += '<input type="button" id="btn_nextweek" value="Next Week" class="configbutton" onclick="weekButton(\'next\');">';
                            htmlButtons += '</td>';
                            htmlButtons += '<td>';
                                htmlButtons += '<input type="button" id="btn_create" value="Create & Submit" class="configbutton" style="background-color:#D35400; color:#FFFFFF;" onclick="submitButton(true);">';
                            htmlButtons += '</td>';
                        htmlButtons += '</tr>';
                    htmlButtons += '</tbody>';
                htmlButtons += '</table>';
                
                form.addField('custpage_htmlbuttons','inlinehtml','').setLayoutType('outsidebelow','startrow').setDefaultValue(htmlButtons); 

                //Print eCalendar
                var url = nlapiResolveURL('SUITELET', 'customscript_hakuna_ecalendar_sl', 'customdeploy_hakuna_ecalendar_sl');
                var frame_url = url + '&mode=showCalendar&calendarParameter=';
                frame_url+= '&rnd=' + Math.floor(Math.random()*1000000); //To ensure browser's caching doesn't cause problem

                var fld_selectedframe = form.addField('custpage_selectedframe', 'inlinehtml');

                fld_selectedframe.setLayoutType('outsidebelow','startrow');
                fld_selectedframe.setDefaultValue('<iframe id="calendar_frame" name="selected_frame" src="'+frame_url+'" style="padding:5px;" scrolling="auto" width="1800" height="500" marginwidth="0" marginheight="0" frameborder="0" vspace="0" hspace="0" style="overflow:scroll"></iframe>');
      
                response.writePage(form);  
            }
        }
        else if (mode == 'showCalendar') {
            
            section = mode + ' - Get Parameters';
            {
                var calendarParameter = request.getParameter('calendarparameter') || '';
                if (!calendarParameter){
                    var custpage_calendarHtml = '<html><body style="font-size:16px; margin-top:5px; text-decoration:underline">Click on Submit button to Load details.</body></html>'; 
                    response.write(custpage_calendarHtml);
                    return;
                }
                var appointmentsParameter = request.getParameter('appointmentsparameter') || '';
                nlapiLogExecution('DEBUG', 'eCalendar - Create Appointments', 'appointmentsParameter ' + appointmentsParameter);
                if (appointmentsParameter != '') {
                    try {
                        var appointmentsParameterObj = JSON.parse(appointmentsParameter);
                        for (var a = 0; a < appointmentsParameterObj.length; a++) {
                            nlapiLogExecution('DEBUG', 'eCalendar - Create Appointment ' + a, JSON.stringify(appointmentsParameterObj[a]));
                            var tzObject = TZ_convertTimezoneUsingOlsonkey(appointmentsParameterObj[a].startdate,appointmentsParameterObj[a].starttime,appointmentsParameterObj[a].fromtz,appointmentsParameterObj[a].totz, timeformat);
                            var recWOSA = nlapiCreateRecord('customrecord_hakuna_work_order_user_sch', {recordmode: 'dynamic'});
                            recWOSA.setFieldValue('custrecord_hakuna_wos_work_order', appointmentsParameterObj[a].workorder);
                            recWOSA.setFieldValue('custrecord_hakuna_wos_start_date', tzObject.date);
                            recWOSA.setFieldValue('custrecord_hakuna_wos_start_time', tzObject.time);                            
                            recWOSA.setFieldValue('custrecord_hakuna_wos_expected_capacity', appointmentsParameterObj[a].duration);
                            recWOSA.setFieldValue('custrecord_hakuna_wos_expected_duration', appointmentsParameterObj[a].duration);
                            recWOSA.setFieldValue('custrecord_hakuna_wos_user', appointmentsParameterObj[a].smuser);
                            recWOSA.setFieldValue('custrecord_hakuna_wos_skill', appointmentsParameterObj[a].smskill);
                            var recWOSAId = nlapiSubmitRecord(recWOSA, false, true);
                            nlapiLogExecution('DEBUG', 'eCalendar - Created Appointment Id', recWOSAId);                            
                        }
                    } catch(errAppointmentsSection){
                        logError(section + ' - Create Appointments', errAppointmentsSection);
                        throw errAppointmentsSection;
                    }
                }
            }
            
            var calendarParameterObj = JSON.parse(calendarParameter);
            var skillTypesObj = calendarParameterObj.skillTypesObj;
            var skillTypesIdArray = calendarParameterObj.skillTypesId;
            var defaultduration = calendarParameterObj.defaultduration;
            
            viewtype = calendarParameterObj.viewtype;
            var startdate = calendarParameterObj.startdate;
            var enddate = calendarParameterObj.endDate;
            var timezoneCalendar = calendarParameterObj.timezone;
            nlapiLogExecution('audit','tz eCalendar',timezoneCalendar);
            custscript_ecal_time_slots = calendarParameterObj.pref_timeslots;
            resetSlotsVaraibles(custscript_ecal_time_slots);
            switch(parseInt(calendarParameterObj.timeformat)) {
                case 1:
                    timeformat = 'h:mm a';
                    break;
                case 2:
                    timeformat = 'H:mm';
                    break;
                case 3:
                    timeformat = 'h-mm a';
                    break;
                case 4:
                    timeformat = 'H-mm';
                    break;
                default:
                    timeformat = 'h:mm a';
            }
            row_starttime = calendarParameterObj.pref_rowstart;
            row_endtime = calendarParameterObj.pref_rowend;
            /*L.Morales 15MAY19, Unnecessary conversion, as the startdate in calendarParameterObj.startdate is already in the calendarParameterObj.timezone
            //Passing the entered Start Date (calendarParameterObj.startdate) to the getCalendar() function call below.
            var tzObject = TZ_convertTimezoneUsingOlsonkey(startdate,'12:00 am',timezoneCalendar,TZ_gmtId);
            startdate = tzObject.date;
             */
            
            var userArray = calendarParameterObj.userArray;
            
            var dateColumn = nlapiStringToDate(startdate);
            var daysbetween = calcDifferenceTwoDays(startdate, enddate);
            getDataForEachEmployee(userArray,'');
            getCalendar(dateColumn, daysbetween, viewtype,userArray,timezoneCalendar,skillTypesIdArray);
            renderCalendar(viewtype,defaultduration);
       
            response.write( html.toString() ); 
            return;
        }
        
    }
    catch(err){
        logError(section, err);
        throw err;
    }
}

function getCalendar(dateselect, daysbetween, viewtype, smusers,timezone,skillTypesIdArray){

    var dateselect_year = dateselect.getFullYear();
    var dateselect_month = dateselect.getMonth();
    var dateselect_date = dateselect.getDate();
    var dateselect_day = dateselect.getDay();
    
    //Define Weekly Treating
    var firstDayOfWeek = dateselect_day;
    var daysToSearch = 1;
    var daysInWeek = daysbetween+1;
    
    if(viewtype == 2){
        switch(weektype){
            case '1': //Mon-Fri
                firstDayOfWeek = 1;
                daysInWeek = 5;
                break;
            case '2': //Mon-Sat
                firstDayOfWeek = 1;
                daysInWeek = 6;
                break;
            case '3': //Mon-Sun
                firstDayOfWeek = 1;
                daysInWeek = 7;
                break;
            case '4': //Sun-Fri
                firstDayOfWeek = 0;
                daysInWeek = 6;
                break;
            case '5': //Sun-Sat
                firstDayOfWeek = 0;
                daysInWeek = 7;
                break;
            default:
        }
    }

    //Get start-end dates for display    
    var fromdate = dateselect;
    var todate = dateselect;
    if(viewtype == 1 || viewtype == 2) { //Daily || Weekly
        var firstDateOfWeek = dateselect_date-(dateselect_day-firstDayOfWeek);
        fromdate.setDate(firstDateOfWeek);
        todate = nlapiAddDays(fromdate, daysInWeek);
        daysToSearch = daysInWeek;
    }
    if(viewtype == 3){ //Monthly
        fromdate.setDate(1);
        todate = nlapiAddMonths(fromdate, 1);
        todate.setDate(0);
        daysToSearch = todate.getDate();
    }
    
    getEvents(nlapiDateToString(fromdate), nlapiDateToString(todate), smusers,timezone,daysToSearch,skillTypesIdArray);
    nlapiLogExecution('audit','In getCalendar - smusers', JSON.stringify(smusers) + ', length ' + smusers.length);
    nlapiLogExecution('audit','In getCalendar - eventArray[emp]', JSON.stringify(eventArray['3']));
    smusers.push(-1000);
        
    //Define cal width
    var startingHour = Math.floor(pnvl(stringToMS(row_starttime)/60/60/1000,true));
    if(startingHour == 24) startingHour = 0;
    var endingHour = Math.ceil(pnvl(stringToMS(row_endtime)/60/60/1000,true));
    if(endingHour == 0) endingHour = 24;

    var totalCols = 0; //This is the total qty of columns to display in calendar
    if (viewtype == 1 || viewtype ==2){
        if(endingHour > startingHour){
            totalCols = (endingHour-startingHour);
        }
        else{
            totalCols = ((24-startingHour) + endingHour);
        }
        
        if (custscript_ecal_time_slots == 2){ //30 minutes
            totalCols *= 2; 
        }
        else if (custscript_ecal_time_slots == 3) {//15 minuts
            totalCols *= 4; 
        }
        
        totalCols *= quantitySpans;
    }
    else if(viewtype == 3){//Monthly
        totalCols = 32 - new Date(dateselect_year, dateselect_month,32).getDate();
    }
     
    //Create Calendar Array
    /* Array design:
     * Level 1 - Date Info (date, datedisplay_day, datedisplay_month, employees array)
     * Level 2 - Employees (employeeid, employeename, slots array)
     * Level 3 - Time slots -- half-hours for daily/weekly, days for monthly -- (heading, date, events array)
     * Level 4 - Events (startdate, starttime, enddate, endtime, description, owner_id, attendee_id, title, event_id, ecal_id)
     */
    var daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    for(var i = 0; i <daysInWeek; i++){
        var currentDate = nlapiAddDays(fromdate, i);
        calArray[i] = {};
        calArray[i]['date'] = nlapiDateToString(currentDate);
        calArray[i]['dayn'] = currentDate.getDay();
        calArray[i]['datedisplay_day'] = daysOfWeek[currentDate.getDay()] + ' ' + months[currentDate.getMonth()] + ' ' + currentDate.getDate() + ', ' + currentDate.getFullYear();
        calArray[i]['datedisplay_month'] = months[currentDate.getMonth()] + ' ' + currentDate.getFullYear();

        //Define time slots
        var slots = [];
        for (var k = 0; k < totalCols; k++){                    
            slots[k] = {};                
            if(viewtype == 3){ //Monthly
               var currentday = nlapiAddDays(fromdate, k);
               var starthour = currentday;
               var endhour = nlapiAddDays(currentday, 1) - 1;
                slots[k]['date'] = nlapiDateToString(starthour);
                slots[k]['heading'] = daysOfWeek[currentday.getDay()] + '<br />' + currentday.getDate();
                slots[k]['startms'] = starthour.getTime();
                slots[k]['endms'] = endhour;
            } 
            else{              
                //Daily or Weekly                  
                var starthour = currentDate;
                var newhour = (startingHour);                  

                newhour = newhour + (k * (minutesInInternalSlot/60)); // lots in an hour

                if(newhour > 24) newhour -= 24; //Adjust for next-day

                starthour.setHours(newhour);             
                starthour.setMinutes(minutesInInternalSlot* (k%(60/minutesInInternalSlot)));                   

                var endhour = starthour.getTime() +(millisecondsInSlot) - 1;                 
                slots[k]['date'] = nlapiDateToString(starthour);
                slots[k]['heading'] = changeTimeFormat(nlapiDateToString(starthour, 'timeofday'), timeformat);
                slots[k]['startms'] = starthour.getTime();
                slots[k]['endms'] = endhour;                   
            }
        }
        
        calArray[i].calendarSlots = cloneObject(slots);

        //Prepare levels 2,3,4
        calArray[i]['employees'] = [];
        for (var j = 0; j< smusers.length; j++){

            var emp = smusers[j];
            //Cycle through time slots and add events as appropriate
            //Conditions to add an event:
            //  1. Event starts on slot time
            //  2. Slot is first of day and event started before
            if (viewtype == 3) {
                // Monthly
                var employeeSlots = {};
            }
            else {
                var employeeEvents = [];
            }
            
            if(eventArray[emp]) {
                for (var l = 0;l <eventArray[emp].length; l++){
                    spliceEventFromArray = false;
                    for(var k = 0; k < slots.length; k++) {
                        var startms = slots[k]['startms'];
                        var endms = slots[k]['endms'];

                        if(eventArray[emp][l]['startms'] >= startms && eventArray[emp][l]['startms'] <= endms) { 
                            //Condition 1
                            var calendarEvent = cloneObject(eventArray[emp][l]);
                                calendarEvent.startSlot = k;

                            if(calendarEvent.endms > slots[totalCols-1]['endms']){ //Need to adjust for events that run over time
                                var startWOms = startms;
                                if(calendarEvent.travelstartslots){
                                    var travelStartSlots_endMS = startms + (calendarEvent.travelstartslots * millisecondsInSlot);

                                    if(travelStartSlots_endMS > slots[totalCols-1]['endms']){
                                        calendarEvent.travelstartslots = Math.ceil((slots[totalCols-1]['endms'] - travelStartSlots_endMS - startWOms) / millisecondsInSlot);
                                        calendarEvent.slotsstartend = '';
                                        calendarEvent.travelendslots = '';
                                    }
                                    else {
                                        startWOms = travelStartSlots_endMS;
                                    }
                                }

                                var endWOms = calendarEvent.endms;
                                if(calendarEvent.travelendslots) {
                                    var travelendslots_ms = calendarEvent.travelendslots * millisecondsInSlot;
                                    var travelEndSlots_startMS = calendarEvent.endms - travelendslots_ms;
                                    if (travelEndSlots_startMS >= slots[slots.length-1].endms){
                                        calendarEvent.travelendslots = '';
                                        endWOms = slots[slots.length-1].endms;
                                    }
                                    else {
                                        if ((travelEndSlots_startMS + travelendslots_ms) >  slots[slots.length-1].endms) {
                                            calendarEvent.travelendslots = Math.ceil((slots[slots.length-1].endms - travelEndSlots_startMS) / millisecondsInSlot);
                                        }
                                        endWOms = travelEndSlots_startMS;
                                    }
                                }
                                else if(endWOms > slots[slots.length-1].endms)
                                {
                                    endWOms = slots[slots.length-1].endms;
                                }

                                if(calendarEvent.slotsstartend) {
                                    if (endWOms > startWOms) {
                                        calendarEvent.slotsstartend = Math.ceil((endWOms - startWOms) / millisecondsInSlot);
                                    }
                                    else {
                                        calendarEvent.slotsstartend = 0;
                                    }
                                }
                                
                                calendarEvent.slots_day = pnvl(calendarEvent.travelstartslots,true) + pnvl(calendarEvent.slotsstartend,true) + pnvl(calendarEvent.travelendslots,true);
                            }  
                            
                            //Remove event once used to increase script execution speed (only if single-day)
                            if(calendarEvent.startdate == calendarEvent.enddate){
                                spliceEventFromArray = true;
                            }
                            if(viewtype == 3){
                                if(!employeeSlots[k]){
                                    employeeSlots[k] = {events : []};
                                }
                                employeeSlots[k].events.push(calendarEvent);
                            }
                            else {
                                employeeEvents.push(calendarEvent);
                            }
                            break;
                        } 
                        else if((k==0||viewtype == 3) && eventArray[emp][l]['startms'] < startms && eventArray[emp][l]['endms'] > startms){
                            var calendarEvent = cloneObject(eventArray[emp][l]); 
                                calendarEvent.startSlot = k;
                            
                            //Condition 2
                            var startWOms = startms;
                            if(calendarEvent.travelstartslots){
                                var travelStartSlots_endMS = calendarEvent.startms + (calendarEvent.travelstartslots * millisecondsInSlot);
                                if(travelStartSlots_endMS > startms){             
                                    calendarEvent.travelstartslots = Math.ceil((travelStartSlots_endMS - startms) / millisecondsInSlot);
                                    startWOms = travelStartSlots_endMS;
                                }
                                else {
                                    calendarEvent.travelstartslots = '';
                                }
                            }
                            
                            var endWOms = calendarEvent.endms;
                            if(calendarEvent.travelendslots) {
                                var travelendslots_ms = calendarEvent.travelendslots * millisecondsInSlot;
                                var travelEndSlots_startMS = calendarEvent.endms - travelendslots_ms;
                                if (travelEndSlots_startMS >= slots[slots.length-1].endms){
                                    calendarEvent.travelendslots = '';
                                    endWOms = slots[slots.length-1].endms;
                                }
                                else {
                                    if (travelEndSlots_startMS < startms){ 
                                        calendarEvent.travelstartslots = '';
                                        calendarEvent.slotsstartend = '';
                                        calendarEvent.travelendslots = Math.ceil((endWOms - startms) / millisecondsInSlot);
                                    }
                                    else if ((travelEndSlots_startMS + travelendslots_ms) >  slots[slots.length-1].endms) {
                                        calendarEvent.travelendslots = Math.ceil((slots[slots.length-1].endms - travelEndSlots_startMS) / millisecondsInSlot);
                                    }
                                    endWOms = travelEndSlots_startMS;
                                }
                            }
                            else if(endWOms > slots[slots.length-1].endms){
                                endWOms = slots[slots.length-1].endms;
                            }
                            
                            if (endWOms > startWOms) {
                                calendarEvent.slotsstartend = Math.ceil((endWOms - startWOms) / millisecondsInSlot);
                            }
                            else {
                                calendarEvent.slotsstartend = 0;
                            }
                            
                            calendarEvent.slots_day = pnvl(calendarEvent.travelstartslots,true) + pnvl(calendarEvent.slotsstartend,true) + pnvl(calendarEvent.travelendslots,true);
                          
                            //Remove event once used to increase script execution speed (only if single-day)
                            if(eventArray[emp][l]['startdate'] == eventArray[emp][l]['enddate']){
                                spliceEventFromArray = true;
                            }
                            if(viewtype == 3){
                                if(!employeeSlots[k]){
                                    employeeSlots[k] = {events : []};
                                }
                                employeeSlots[k].events.push(calendarEvent);
                            }
                            else {
                                employeeEvents.push(calendarEvent);
                            }
                            break;
                        }
                        else if(eventArray[emp][l]['endms'] < startms){
                            break;
                        }
                    }
                    if(spliceEventFromArray){
                        eventArray[emp].splice(l,1);
                        l--; 
                    }
                }
            }
            
            //Add employee and levels 3 & 4 to array
            if(viewtype == 3){
                calArray[i]['employees'].push({
                    employeename: '',
                    employeeid: smusers[j],
                    slots: employeeSlots
                });                
            }
            else {
                calArray[i]['employees'].push({
                    employeename: '',
                    employeeid: smusers[j],
                    events : employeeEvents
                });
            }           
        }
    }
    nlapiLogExecution('audit','In getCalendar (end) - calArray', JSON.stringify(calArray));
}

function getEvents(startdate, enddate, employees,forcetimezone,daysToSearch,skillTypes) {
    nlapiLogExecution('DEBUG', 'getEvent - startdate', startdate);
    nlapiLogExecution('DEBUG', 'getEvent - enddate', enddate);
    nlapiLogExecution('DEBUG', 'getEvent - employees', employees);
    nlapiLogExecution('DEBUG', 'getEvent - forcetimezone', forcetimezone);
    nlapiLogExecution('DEBUG', 'getEvent - daysToSearch', daysToSearch);
    
    getSMWorkingDay(employees, forcetimezone);
    getHolidayDays(startdate, enddate, employees);
   
    var allContextData = '';
    allContextData = eventBoxContext + ' ' + custscript_ecal_tooltipcontent;         
    addColumnsFromContext = [
                            {name:"{title}",internalid:"custrecord_hakuna_wos_work_order",join:null,search:false,text:true}
                        ];
    tooltipObject = getTooltipFields(eventBoxContext);   
    for(var i in tooltipObject){
        var toInternalid = tooltipObject[i].fieldInternalId;
        var join = tooltipObject[i].join;
        var toIsText  = tooltipObject[i].isText;
        addColumnsFromContext.push({
            name : '{' + i + '}',
            internalid :  toInternalid,
            join : join,
            search : true,
            text : toIsText
        });
    }
    tooltipObject = getTooltipFields(custscript_ecal_tooltipcontent);

    if (allContextData) {
        for(var i = 0; i < addColumnsFromContext.length; i++) {         
            var name = addColumnsFromContext[i].name;
            var search = addColumnsFromContext[i].search;
            if ((allContextData.indexOf(name) > -1) && !search) {
                addColumnsFromContext[i].search = true;   
            }
        }
    }

    var results = [];
    var parentReference = null;
            
    var startDate_Date = nlapiStringToDate(startdate);
    var endDate_Date = nlapiStringToDate(enddate);

    var startDatems = startDate_Date.getTime();
    var endDatems = endDate_Date.getTime();

    var filters = [
        new nlobjSearchFilter('custrecord_hakuna_wos_start_date', null, 'notbefore', startdate),
        new nlobjSearchFilter('custrecord_hakuna_wos_start_date', null, 'notafter', enddate),
        new nlobjSearchFilter('custrecord_hakuna_wos_skill', null, 'anyOf', skillTypes)
    ];

    var columns = [ 
        new nlobjSearchColumn('custrecord_hakuna_wos_expected_duration'),
        new nlobjSearchColumn('custrecord_hakuna_wos_start_date'),
        new nlobjSearchColumn('custrecord_hakuna_wos_start_time'),
        new nlobjSearchColumn('custrecord_hakuna_wos_site_time_zone')
    ];

    var recordType = 'customrecord_hakuna_work_order_user_sch';
    var searchName = 'customsearch_ecalendar_servappoint';
    var attendeeName = 'custrecord_hakuna_wos_user';

    for(var h = 0; h < addColumnsFromContext.length; h++) {
        var searchField = addColumnsFromContext[h].search;
        if (searchField) {
            var Field_internalid = addColumnsFromContext[h].internalid;
            var join = addColumnsFromContext[h].join;
            if(!join){
                join = parentReference;
            }
            columns.push(new nlobjSearchColumn(Field_internalid,join));
        }
    }

    for (var i in tooltipObject){
        var join = tooltipObject[i].join;
        if(!join){
            join = parentReference;
            columns.push(new nlobjSearchColumn(tooltipObject[i].fieldInternalId));               
        }
        columns.push(new nlobjSearchColumn(tooltipObject[i].fieldInternalId,join));
    }

    if (eCalSortWO){
        columns = eCalSortWO.add_columns_to_searchColumns(columns);
    }   

    nlapiLogExecution('AUDIT','Saved Search',searchName+' - Record Type: '+recordType);
    var search = nlapiLoadSearch(recordType,searchName);
        search.addFilters(filters);
        search.addColumns(columns);
    var resultSet = search.runSearch();
    var startRecord = 0;
    nlapiLogExecution('audit', 'columns', JSON.stringify(columns));

    do {
        var searchResults = resultSet.getResults(startRecord,startRecord+1000);
        if(searchResults && searchResults.length > 0){
            results = results.concat(searchResults);
        }
        startRecord += 1000;
    } while(searchResults.length == 1000);
    
    fileResp = nlapiCreateFile( '0_wo_search_results' + '.txt', 'PLAINTEXT', JSON.stringify(results));
    fileResp.setFolder(CALENDARFOLDERID); 
    fileID = nlapiSubmitFile(fileResp);

    if (results && results.length > 0){
        // Get Assigned to Names
        for (var i = 0; i< results.length; i++){
            // Get AssignedTo names
            var assignedTo = [];
            var attendee_ids_str = pnvl(results[i].getValue(attendeeName));

            if (attendee_ids_str) {
                if (employees.indexOf(attendee_ids_str) >= 0) {
                    assignedTo.push(attendee_ids_str);
                }            
            }
            else {
                assignedTo.push(-1000);
            }
            if(assignedTo.length == 0) {
                continue;
            }

            var travelWO = '';
            var desc_color = '';
            var internal = '';
            var startDateWO = pnvl(results[i].getValue('custrecord_hakuna_wos_start_date'));
            var startTimeWO = pnvl(results[i].getValue('custrecord_hakuna_wos_start_time'));
            var fromTimeZoneWO = pnvl(results[i].getValue('custrecord_hakuna_wos_site_time_zone'));
            
            var tzObject = TZ_convertTimezoneUsingOlsonkey(startDateWO,startTimeWO,fromTimeZoneWO,forcetimezone, timeformat);
            var event_startdate = tzObject.date;
            var event_starttime = tzObject.time;
            if (!event_startdate) {
                continue;
            }
            
            var event_expectedDuration = pnvl(results[i].getValue('custrecord_hakuna_wos_expected_duration'),true);

            var event_enddate = '';
            var event_endtime = '';

            var event_startdate_Date = nlapiStringToDate(event_startdate + ' ' + event_starttime,'timeofday');

            var hours = pnvl(event_startdate_Date.getHours(),true);
            var newHours = hours + event_expectedDuration;

            event_startdate_Date.setHours(newHours);
            event_enddate = nlapiDateToString(event_startdate_Date,'date');
            event_endtime = nlapiDateToString(event_startdate_Date,'timeofday');
                
            var event_travelstarttime = '';
            var event_travelendtime = '';
            var travelstarttimeMS = '';
            var travelendtimeMS = '';

            var starttimeMS = stringToMS(event_starttime);
            var endtimeMS = stringToMS(event_endtime);

            if ( starttimeMS === '' || endtimeMS === ''){
                nlapiLogExecution('ERROR', 'Event without start or end time,', 'eCal Id: ' + results[i].getId());
                continue;
            }

            var start = nlapiStringToDate(event_startdate).getTime();
            var end = nlapiStringToDate(event_enddate).getTime();

            if (start > endDatems || end < startDatems){
                //Out of date range.
                nlapiLogExecution('DEBUG','Out of date range.');                 
                continue;
            }

            starttimeMS = ((starttimeMS) - (starttimeMS % millisecondsInSlot));
            start += starttimeMS;

            end = end + endtimeMS;
            var slotsStartEnd = Math.ceil((end-start) / millisecondsInSlot);         
            end = start + (slotsStartEnd * millisecondsInSlot);

            var travelstart = '';
            if (travelstarttimeMS){
                travelstarttimeMS = ((travelstarttimeMS) - (travelstarttimeMS % millisecondsInSlot));
                travelstart = nlapiStringToDate(event_startdate).getTime() + travelstarttimeMS;
            }

            var travelend = '';
            if (travelendtimeMS){
                travelend = nlapiStringToDate(event_enddate).getTime() + travelendtimeMS;
            }

            var allEnd = end;
            var allStart = start;
            var travelStartSlots = '';
            var travelEndSlots = '';

            if (travelstart){
                allStart = travelstart;
                travelStartSlots = Math.ceil((start-travelstart) / millisecondsInSlot);            
            }

            if (travelend){
                allEnd = travelend;
                travelEndSlots = Math.ceil((travelend-end) / millisecondsInSlot);               
            }

            var slots = pnvl(travelStartSlots,true) + pnvl(slotsStartEnd,true)  + pnvl(travelEndSlots,true);   
            if (slots == 0) slots = 1;

            for (var j = 0; j < assignedTo.length; j++){   
                var attendee_id = assignedTo[j];
                if (eventArray[attendee_id] == null) eventArray[attendee_id] = new Array();

                var ecal_id = pnvl(results[i].getId());
                var parentWO = '';
                var event_id = '';
                    parentWO = pnvl(results[i].getValue('custrecord_ecal_event_subof'));                 

                    if (travelWO == "T") {
                        event_travelstarttime = event_starttime;
                        event_travelendtime = event_endtime;

                        event_starttime = "";
                        event_endtime = "";
                    }
                    
                    event_id = pnvl(results[i].getValue('custrecord_ecal_event'));
//                }
                
                if (!parentWO){
                    parentWO = ecal_id;
                }   

                var eventObject = {
                    startdate    : event_startdate,
                    starttime    : changeTimeFormat(event_starttime, timeformat),
                    starttime24H : transformTimeAMPMto24H(event_starttime),
                    startms      : allStart,
                    starttimems  : start,
                    enddate      : event_enddate,
                    endtime      : changeTimeFormat(event_endtime, timeformat),
                    endtime24H   : transformTimeAMPMto24H(event_endtime),
                    endms        : allEnd-1,
                    endtimems    : end-1,
                    slots_day    : slots,
                    slotsstartend: slotsStartEnd,
                    desc_color   : desc_color,
                    event_id     : event_id,
                    ecal_id      : ecal_id,
                    attendee_id  : attendee_id,
                    attendee     : smuser_hover[attendee_id].entityid,
                    parentWO     : parentWO,
                    internal     : internal,
                    travelwo     : travelWO,
                    travelstart  : event_travelstarttime,
                    travelend    : event_travelendtime,
                    travelstartms: travelstart,
                    travelendms  : travelend-1,
                    travelstartslots : travelStartSlots,
                    travelendslots  : travelEndSlots,
                    recordtype : recordType
                };

                for(var h = 0; h < addColumnsFromContext.length; h++) {
                    var searchField = addColumnsFromContext[h].search;
                    if (searchField) {
                        var Field_internalid = addColumnsFromContext[h].internalid;
                        var isText = addColumnsFromContext[h].text;
                        var name = addColumnsFromContext[h].name;
                        var join = addColumnsFromContext[h].join;
                        if(!join){
                            join = parentReference;
                        }
                        name = name.replace(/[}{]/g, ''); 
                        if (isText) {
                            eventObject[name] = pnvl(results[i].getText(Field_internalid,join));
                        }else {
                            eventObject[name] = pnvl(results[i].getValue(Field_internalid,join));
                        }
                    }
                }

                for(var tooltipField in tooltipObject) {
                    var isText = tooltipObject[tooltipField].isText;
                    var is24H = tooltipObject[tooltipField].is24H;
                    var isPWO = tooltipObject[tooltipField].isPWO;
                    var fieldInternalId = tooltipObject[tooltipField].fieldInternalId;
                    var join = tooltipObject[tooltipField].join || null;
                    
                    if (isText){
                        if (isPWO){
                            eventObject[tooltipField] = pnvl(results[i].getText(fieldInternalId,parentReference)); 
                        }
                        else{
                            eventObject[tooltipField] = pnvl(results[i].getText(fieldInternalId,join));
                        } 
                    }
                    else {
                        if (is24H) {
                            if (isPWO){
                                eventObject[tooltipField] = transformTimeAMPMto24H(pnvl(results[i].getValue(fieldInternalId,parentReference)));
                            }
                            else{
                                eventObject[tooltipField] = transformTimeAMPMto24H(pnvl(results[i].getValue(fieldInternalId,join)));                                                       
                            }
                        }
                        else {
                            if (isPWO){
                                eventObject[tooltipField] = pnvl(results[i].getValue(fieldInternalId,parentReference));
                            }
                            else{
                                eventObject[tooltipField] = pnvl(results[i].getValue(fieldInternalId,join));
                            }                                             
                        }     
                    }
                }

                if (eCalSortWO){
                    eventObject = eCalSortWO.add_columns_to_eventObject(eventObject,results[i]);
                }
                
                eventArray[attendee_id].push(eventObject);          
            }
            
            //Internal Holiday
            for (var j = 0; j < assignedTo.length; j++){   
                var attendee_id = assignedTo[j];
                if (smUser_WorkingDayObj[attendee_id]) {
             
                    if (eventArray[attendee_id] == null) eventArray[attendee_id] = new Array();
                    
                    var holiday = smUser_WorkingDayObj[attendee_id].holidayForSpecifiedPeriod;

                    for(var h = 0; h < holiday.length; h++){
                        var inserted = holiday[h].inserted;
                        if (inserted) {
                            continue;
                        }
                      
                        var eventObject = {
                            event_id     : '',
                            ecal_id      : holiday[h].holidayId,
                            attendee_id  : attendee_id,
                            attendee     : smuser_hover[attendee_id].entityid,
                            parentWO     : parentWO,
                            travelwo     : '',
                            travelstart  : '',
                            travelend    : '',
                            travelstartms: '',
                            travelendms  : '',
                            travelstartslots : '',
                            travelendslots  : '',
                            recordtype : recordType,
                            
                            id : holiday[h].holidayId,
                            date : holiday[h].holidayDate,
                            bgColor : holiday[h].bgColor,
                            txtColor : holiday[h].txtColor,
                            nameColorIndex : holiday[h].nameColorIndex,
                            url : holiday[h].url,
                            description : holiday[h].description,
                            startdate    : holiday[h].holidayDate,
                            starttime    : changeTimeFormat(holiday[h].starttime, timeformat),
                            starttime24H : transformTimeAMPMto24H(holiday[h].starttime),
                            startms      : holiday[h].startms,
                            starttimems  : holiday[h].starttimems,
                            enddate      : holiday[h].enddate,
                            endtime      : changeTimeFormat(holiday[h].endtime, timeformat),
                            endtime24H   : transformTimeAMPMto24H(holiday[h].endtime),
                            endms        : holiday[h].endms,
                            endtimems    : holiday[h].endtimems,
                            slots_day    : holiday[h].slots_day,
                            slotsstartend: holiday[h].slotsstartend,
                            internal     : 'T'
                        };
                        
                        smUser_WorkingDayObj[attendee_id].holidayForSpecifiedPeriod[h].inserted = true;

                        for(var h = 0; h < addColumnsFromContext.length; h++) {
                            var searchField = addColumnsFromContext[h].search;
                            if (searchField) {
                                var Field_internalid = addColumnsFromContext[h].internalid;
                                var isText = addColumnsFromContext[h].text;
                                var name = addColumnsFromContext[h].name;
                                var join = addColumnsFromContext[h].join;
                                if(!join){
                                    join = parentReference;
                                }
                                name = name.replace(/[}{]/g, ''); 
                                if (isText) {
                                    eventObject[name] = pnvl(results[i].getText(Field_internalid,join));
                                }else {
                                    eventObject[name] = pnvl(results[i].getValue(Field_internalid,join));
                                }
                            }
                        }

                        for(var tooltipField in tooltipObject) {
                            var isText = tooltipObject[tooltipField].isText;
                            var is24H = tooltipObject[tooltipField].is24H;
                            var isPWO = tooltipObject[tooltipField].isPWO;
                            var fieldInternalId = tooltipObject[tooltipField].fieldInternalId;
                            var join = tooltipObject[tooltipField].join || null;

                            if (isText){
                                if (isPWO){
                                    eventObject[tooltipField] = pnvl(results[i].getText(fieldInternalId,parentReference)); 
                                }
                                else{
                                    eventObject[tooltipField] = pnvl(results[i].getText(fieldInternalId,join));
                                } 
                            }
                            else {
                                if (is24H) {
                                    if (isPWO){
                                        eventObject[tooltipField] = transformTimeAMPMto24H(pnvl(results[i].getValue(fieldInternalId,parentReference)));
                                    }
                                    else{
                                        eventObject[tooltipField] = transformTimeAMPMto24H(pnvl(results[i].getValue(fieldInternalId,join)));                                                       
                                    }
                                }
                                else {
                                    if (isPWO){
                                        eventObject[tooltipField] = pnvl(results[i].getValue(fieldInternalId,parentReference));
                                    }
                                    else{
                                        eventObject[tooltipField] = pnvl(results[i].getValue(fieldInternalId,join));
                                    }                                             
                                }     
                            }
                        }

                        if (eCalSortWO){
                            eventObject = eCalSortWO.add_columns_to_eventObject(eventObject,results[i]);
                        }

                        eventArray[attendee_id].push(eventObject);
                    }
                }
            }
            //Internal - Holiday
        }
    }

    //Special Case: Holidays without Appointments
    for (var w = 0; w < noAppointmentUsers.length; w++) {
        attendee_id = noAppointmentUsers[w];
        if (eventArray[attendee_id] == null) eventArray[attendee_id] = new Array();
                        
        var holiday = smUser_WorkingDayObj[attendee_id].holidayForSpecifiedPeriod;

        for(var h = 0; h < holiday.length; h++){
            var inserted = holiday[h].inserted;
            if (inserted) {
                continue;
            }
          
            var eventObject = {
                event_id     : '',
                ecal_id      : holiday[h].holidayId,
                attendee_id  : attendee_id,
                attendee     : smuser_hover[attendee_id].entityid,
                parentWO     : parentWO,
                travelwo     : '',
                travelstart  : '',
                travelend    : '',
                travelstartms: '',
                travelendms  : '',
                travelstartslots : '',
                travelendslots  : '',
                recordtype : recordType,
                
                id : holiday[h].holidayId,
                date : holiday[h].holidayDate,
                bgColor : holiday[h].bgColor,
                txtColor : holiday[h].txtColor,
                nameColorIndex : holiday[h].nameColorIndex,
                url : holiday[h].url,
                description : holiday[h].description,
                startdate    : holiday[h].holidayDate,
                starttime    : changeTimeFormat(holiday[h].starttime, timeformat),
                starttime24H : transformTimeAMPMto24H(holiday[h].starttime),
                startms      : holiday[h].startms,
                starttimems  : holiday[h].starttimems,
                enddate      : holiday[h].enddate,
                endtime      : changeTimeFormat(holiday[h].endtime, timeformat),
                endtime24H   : transformTimeAMPMto24H(holiday[h].endtime),
                endms        : holiday[h].endms,
                endtimems    : holiday[h].endtimems,
                slots_day    : holiday[h].slots_day,
                slotsstartend: holiday[h].slotsstartend,
                internal     : 'T'
            };
            
            smUser_WorkingDayObj[attendee_id].holidayForSpecifiedPeriod[h].inserted = true;

            eventArray[attendee_id].push(eventObject);
        }
        //End of Special Case: Holidays without Appointments
    }
    
    nlapiLogExecution('audit','getEvents - eventArray (end)',JSON.stringify(eventArray));
    fileResp = nlapiCreateFile( '2_eventArray' + '.txt', 'PLAINTEXT', JSON.stringify(eventArray));
    fileResp.setFolder(CALENDARFOLDERID); 
    fileID = nlapiSubmitFile(fileResp);
    
}

function renderCalendar(viewtype,defaultduration) {
    
    var createnewURL = nlapiResolveURL('RECORD', 'customrecord_hakuna_work_order_user_sch');
    var monthly = (viewtype == 3);

    ////////DRAW HEAD/////////
    html.append('<html>');
    html.append('<head><title>eCalendar</title>');
    
    //Style
    {   
        html.append('<STYLE type="text/css">');
        html.append('     #tt { position:absolute; display:block; font-size:9pt} #tttop { display:block; height:5px; margin-left:5px; overflow:hidden; } #ttcont { display:block; padding:2px 12px 3px 7px; margin-left:5px; background:#666; color:#fff; }#ttbot {display:block;height:5px;margin-left:5px;overflow:hidden;}\n');
        html.append('     .ecal_dateheading { border: 1px solid #CCFFFF; font-size:9pt; font-weight:bold; text-align:center; background-color:#c0c0c0; margin:0px; padding:0px; }');
        html.append('     .ecal_empheading { font-size:9pt; text-align:left; height:30px; padding:6px; '+getGradient('33CCFF', '33CCFF') +' }');
        html.append('     .ecal_empheading2 {height:auto; font-size:9pt; text-align:left; padding:4px; '+getGradient('33CCFF', '33CCFF') +' }');
        html.append('     .ecal_empheading_unassigned {height:auto; font-size:9pt; text-align:left; padding:4px; color: white; '+getGradient(unassignedColor, unassignedColor) +' }');
        html.append('     .ecal_empheadingH {height:auto; background-color:#FFFFFF; font-size:9pt; text-align:center; padding:2px 2px; '+getGradient(''+ custscript_ecal_holidaycolor +'', ''+ custscript_ecal_holidaycolor +'') +' }');
        html.append('     .ecal_emplabel   {font-size:9pt; text-align:center; width: 100px; '+getGradient('FFFFFF', '33CCFF') +'}');
        html.append('     .ecal_slotheading_d { font-size:9pt; text-align:center; width:40px; '+getGradient('FFFFFF', '33CCFF') +' }');
        html.append('     .ecal_slotheading_m { font-size:9pt; text-align:center; width:30px; '+getGradient('FFFFFF', '33CCFF') +' }');
        html.append('     .ecal_cell { padding:4px; background-color:#FFD700; height:100%; word-wrap: break-word; overflow:hidden; white-space:normal; }');
        html.append('     .ecal_cell_left {font-size:9pt; padding:0px 0px; background-color:#FFD700; height:auto; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }');
        html.append('     .ecal_cell_center { padding:0px 1px; background-color:#FFD700; height:auto; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; text-align: center;}');
        html.append('     .ecal_ttip { font-size: 9pt; }');
        html.append('     .ecal_link { color:#FFFFFF; }');
        html.append('     .ecal_unlink { text-decoration:none; color:#000000; }');
        html.append('     a.ecal_link:hover { color:#000000; text-decoration:none; }');
        html.append('     body { font-family: Verdana, Arial, Times; font-size:9pt }  td {padding: 0;} ');
        html.append('</STYLE>\n');
    }
    
    //Scripts
    {
        html.append('<SCRIPT>' + "var tooltip=function(){   var id = 'tt'; var top = 35; var left = 3; var maxw = 300; var ttw = maxw; var speed = 10; var timer = 20; var endalpha = 95; var alpha = 0; var tt,t,c,b,h; var ie = document.all; var ns6 = document.getElementById && !document.all; return{ show:function(v,w){ if(tt == null){ tt = document.createElement('div'); tt.setAttribute('id',id); t = document.createElement('div'); t.setAttribute('id',id + 'top'); c = document.createElement('div'); c.setAttribute('id',id + 'cont'); b = document.createElement('div'); b.setAttribute('id',id + 'bot'); tt.appendChild(t); tt.appendChild(c); tt.appendChild(b); document.body.appendChild(tt); tt.style.opacity = 0; tt.style.filter = 'alpha(opacity=0)'; document.onmousemove = this.pos; } tt.style.display = 'block'; c.innerHTML = v; tt.style.width = w ? w + 'px' : maxw+'px'; ttw = w?w:maxw; \
                if(!w && ie){   t.style.display = 'none'; b.style.display = 'none'; tt.style.width = tt.offsetWidth; t.style.display = 'block'; b.style.display = 'block'; } \
                if(tt.offsetWidth > maxw){tt.style.width = maxw + 'px';} h = parseInt(tt.offsetHeight) + top; clearInterval(tt.timer); tt.timer = setInterval(function(){tooltip.fade(1);},timer);}, pos:function(e){ var u = null; var l = null; if (ns6){ u = e.pageY;    l = e.pageX;}   else {  u = event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);l = event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);} tt.style.top = (u - top) + 'px';if (u > 200 && tt.offsetHeight > 50){ tt.style.top = (u - 150) + 'px';} if (l > 1250 - ttw) {tt.style.left = (l - ttw) + 'px';} else {tt.style.left = (l + left) + 'px';}}, fade:function(d){var a = alpha; if((a != endalpha && d == 1) || (a != 0 && d == -1)){   var i = speed;  if(endalpha - a < speed && d == 1){ i = endalpha - a;}else if(alpha < speed && d == -1){    i = a;  }alpha = a + (i * d); tt.style.opacity = alpha * .01; tt.style.filter = 'alpha(opacity=' + alpha + ')'; }else{  clearInterval(tt.timer);if(d == -1){tt.style.display = 'none';} }},hide:function(){clearInterval(tt.timer);tt.timer = setInterval(function(){tooltip.fade(-1);},timer); }};}();" + '</SCRIPT>');

        html.append('<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>');

        html.append('<script language="javascript" type="text/javascript">');
        
            html.append('(function ($) {');
                html.append('$.fn.freezeHeader = function (params) {');

                html.append('var copiedHeader = false;');
                html.append('var idObj = this.selector.replace(\'#\', \'\');');
                html.append('var container;');
                html.append('var grid;');
                html.append('var conteudoHeader;');
                html.append('var openDivScroll = \'\';');
                html.append('var closeDivScroll = \'\';');

                html.append('if (params && params.height !== undefined) {');
                    html.append('divScroll = \'<div id="hdScroll\' + idObj + \'" style="height: \' + params.height + \'; overflow-y: scroll">\';');
                    html.append('closeDivScroll = \'</div>\';');
                html.append('}');

                html.append('grid = $(\'table[id$="\' + idObj + \'"]\');');
                html.append('conteudoHeader = grid.find(\'thead\');');

                html.append('if (params && params.height !== undefined) {');
                    html.append('if ($(\'#hdScroll\' + idObj).length == 0) {');
                        html.append('grid.wrapAll(divScroll);');
                    html.append('}');
                html.append('}');

                html.append('var obj = params && params.height !== undefined ? $(\'#hdScroll\' + idObj) : $(window);');

                html.append('if ($(\'#hd\' + idObj).length == 0) {');
                    html.append('grid.before(\'<div id="hd\' + idObj + \'"></div>\');');
                html.append('}');

                html.append('obj.scroll(function () { freezeHeader(); });');

                html.append('function freezeHeader() {');

                    html.append('if ($(\'table[id$="\' + idObj + \'"]\').length > 0) {');

                        html.append('container = $(\'#hd\' + idObj);');
                        html.append('if (conteudoHeader.offset() != null) {');
                            html.append('if (limiteAlcancado(params)) {');
                                html.append('if (!copiedHeader) {');
                                    html.append('cloneHeaderRow(grid);');
                                    html.append('copiedHeader = true;');
                                html.append('}');
                            html.append('}');
                            html.append('else {');

                                html.append('if (($(document).scrollTop() > conteudoHeader.offset().top)) {');
                                    html.append('container.css("position", "absolute");');
                                    html.append('container.css("top", (grid.find("tr:last").offset().top - conteudoHeader.height()) + "px");');
                                html.append('}');
                                html.append('else {');
                                    html.append('container.css("visibility", "hidden");');
                                    html.append('container.css("top", "0px");');
                                    html.append('container.width(0);');
                                html.append('}');

                                html.append('copiedHeader = false;');

                            html.append('}');
                        html.append('}');
                    html.append('}');
                html.append('}');

                html.append('function limiteAlcancado(params) {');
                    html.append('if (params && params.height !== undefined) {');
                        html.append('return (conteudoHeader.offset().top <= obj.offset().top);');
                    html.append('}');
                    html.append('else {');
                        html.append('return ($(document).scrollTop() > conteudoHeader.offset().top && $(document).scrollTop() < (grid.height() - conteudoHeader.height() - grid.find("tr:last").height()) + conteudoHeader.offset().top);');
                    html.append('}');
                html.append('}');

                html.append('function cloneHeaderRow() {');
                    html.append('container.html(\'\');');
                    html.append('container.val(\'\');');
                    html.append('var tabela = $(\'<table style="margin: 0 0;"></table>\');');
                    html.append('var atributos = grid.prop("attributes");');

                    html.append('$.each(atributos, function () {');

                        html.append('if (this.name != "id") {');
                            html.append('tabela.attr(this.name, this.value);');
                        html.append('}');
                    html.append('});');

                    html.append('tabela.append(\'<thead>\' + conteudoHeader.html() + \'</thead>\');');

                    html.append('container.append(tabela);');
                    html.append('container.width(conteudoHeader.width());');
                    html.append('container.height(conteudoHeader.height);');
                    html.append('container.find(\'th\').each(function (index) {');
                        html.append('var cellWidth = grid.find(\'th\').eq(index).width();');
                        html.append('$(this).css(\'width\', cellWidth);');
                    html.append('});');

                    html.append('container.css("visibility", "visible");');

                    html.append('if (params && params.height !== undefined) {');
                        html.append('container.css("top", obj.offset().top + "px");');
                        html.append('container.css("position", "absolute");');
                    html.append('} else {');
                        html.append('container.css("top", "0px");');
                        html.append('container.css("position", "fixed");');
                    html.append('}');

                html.append('}');

                html.append('};');
            html.append('})(jQuery);');


            html.append('$(document).ready(function () {');
                html.append('$("#table1").freezeHeader();');
                html.append('$("#table2").freezeHeader();');
                html.append('$("#table3").freezeHeader();');
                html.append('$("#table4").freezeHeader();');
                html.append('$("#table5").freezeHeader();');
                html.append('$("#table6").freezeHeader();');
                html.append('$("#table7").freezeHeader();');

            html.append('});');
            
        html.append('</script>');
        
        html.append('<script language="javascript" type="text/javascript">');
        
        html.append('function validateFieldseCalendar(_this) {');
                html.append('var internalid = _this.id;');
                    
                    html.append('var timezone = parent.nlapiGetFieldValue("custpage_pref_timezone");');
                    html.append('var wo = parent.nlapiGetFieldValue("custpage_wo_workorder");');
                    html.append('var duration = parent.nlapiGetFieldValue("custpage_pref_duration");');
                    html.append('if(!wo){');
                        html.append('alert("Please select Work Order.");');
                        html.append('return false;');
                    html.append('}');
                    
                    html.append('if(!duration){');
                        html.append('alert("Please enter Duration.");');
                        html.append('return false;');
                    html.append('}');
                    
                    html.append('var url = document.getElementById(internalid + "_url").value;');
                    
                    html.append('url += "&calledby=ecalendar";');
                    html.append('var startdate = document.getElementById(internalid + "_date").value;');
                    html.append('url += "&startdate=" + startdate;');
                    html.append('var smuser = document.getElementById(internalid + "_user").value;');
                    html.append('url += "&smuser=" + smuser;');
                    html.append('var starttime = document.getElementById(internalid + "_time").value;');
                    html.append('url += "&starttime=" + starttime;');
                    html.append('url += "&workorder=" + wo;');
                    html.append('url += "&duration=" + duration;');
                    html.append('url += "&fromtz=" + timezone;');
                    
                    html.append('window.open(url,"screenWOSA","width=1200,height=600");');
                    
                html.append('}');
            
        html.append('</script>');
    }
    
    html.append('</head>\n');

    function addNewEvent(lines,startLine,event){
        var eventAdded = false;
        for (var i = startLine; i < lines.length && !eventAdded; i++){
            var employeeLine = lines[i];
            var replacedOrSplitSlot = true; // T: replaced, F: splitted

            for (var j = 0; j < employeeLine.length && !eventAdded; j++){
                var thisEvent = employeeLine[j];
                
                if (event.startSlot == thisEvent.startSlot){
                    if (event.endSlot == thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '1-1 : same startSlot && same endSlot, replace & end for');
                        employeeLine.splice(j,1,event);                    
                        return;
                    } else if (event.endSlot > thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '1-2 : same startSlot && bigger endSlot, replace & go on for to remove next slots');
                        employeeLine.splice(j,1,event);
                        // eventAdded = true;
                    } else if (event.endSlot < thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '1-3 : same startSlot && smaller endSlot, split & end for');
                        // Do split for thisEvent
                        thisEvent.startSlot = event.endSlot + 1;
                        thisEvent.slotsStartEnd = thisEvent.endSlot - thisEvent.startSlot + 1;
                        thisEvent.colspan = thisEvent.slotsStartEnd;
                        employeeLine.splice(j,0,event);
                        return;
                    }
                } else if (event.startSlot > thisEvent.startSlot){
                    if (event.endSlot == thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '2-1 : bigger startSlot && same endSlot, split & end for');
                        // Do split for thisEvent
                        thisEvent.endSlot = event.startSlot - 1;
                        thisEvent.slotsStartEnd = thisEvent.endSlot - thisEvent.startSlot + 1;
                        thisEvent.colspan = thisEvent.slotsStartEnd;
                        j++;
                        employeeLine.splice(j,0,event);
                        return;
                    } else if (event.endSlot > thisEvent.endSlot && event.startSlot < thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '2-2 : bigger startSlot && bigger endSlot, split & go on for');
                        // Do split for thisEvent
                        thisEvent.endSlot = event.startSlot - 1;
                        thisEvent.slotsStartEnd = thisEvent.endSlot - thisEvent.startSlot + 1;
                        thisEvent.colspan = thisEvent.slotsStartEnd;
                        j++;
                        employeeLine.splice(j,0,event);
                        replacedOrSplitSlot = false;
                        // eventAdded = true;
                    } else if (event.endSlot < thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '2-3 : bigger startSlot && smaller endSlot, included, split twice & end for');
                        // Do split twice for thisEvent
                        var tempThisEventStartSlot = thisEvent.startSlot;
                        var tempThisEventEndSlot = thisEvent.endSlot;
                        var tempThisEvent = JSON.parse(JSON.stringify(thisEvent))
                        employeeLine.splice(j,0, tempThisEvent, event);
                        employeeLine[j].startSlot = tempThisEventStartSlot;
                        employeeLine[j].endSlot = event.startSlot - 1;
                        employeeLine[j].slotsStartEnd = employeeLine[j].endSlot - employeeLine[j].startSlot + 1;
                        employeeLine[j].colspan = employeeLine[j].slotsStartEnd;
                        employeeLine[j+2].startSlot = event.endSlot + 1;
                        employeeLine[j+2].endSlot = tempThisEventEndSlot;
                        employeeLine[j+2].slotsStartEnd = employeeLine[j+2].endSlot - employeeLine[j+2].startSlot + 1;
                        employeeLine[j+2].colspan = employeeLine[j].slotsStartEnd;
                        return;
                    }
                } else if (event.startSlot < thisEvent.startSlot) {
                    if (event.endSlot == thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '3-1 : smaller startSlot && same endSlot, remove & end for');
                        // Do remove
                        employeeLine.splice(j,1);
                        return;
                    }else if (event.endSlot > thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '3-2 : smaller startSlot && bigger endSlot, remove & go on for');
                        // Do remove
                        employeeLine.splice(j,1);
                        j--;
                    } else if (event.endSlot < thisEvent.endSlot){
                        nlapiLogExecution('debug','addNewEvent', '3-3 : smaller startSlot && smaller endSlot, split & end for');
                        // Do split
                        thisEvent.startSlot = event.endSlot + 1;
                        thisEvent.slotsStartEnd = thisEvent.endSlot - thisEvent.startSlot + 1;
                        thisEvent.colspan = thisEvent.slotsStartEnd;
                        return;
                    }
                }
            }
        }
    }
    
    function pushNewEvent(lines,startLine,event){
        while (lines.length <= startLine){
            lines.push(new Array);
        }
        lines[startLine].push(event);
    }

    var indexTable = 1;
    if (monthly){       
        var calendarStartDate = calArray[0]['date'];
        var calendarStartDate_Date = nlapiStringToDate(calendarStartDate);
        var maxSlotsPerLine = calArray[0].calendarSlots.length;
        var calendarEndDate_Date = nlapiAddDays(calendarStartDate_Date,maxSlotsPerLine-1);
        
        ////////DRAW BODY/////////
        html.append('<body><table width="100%"><tr><td>');

        for(var i = 0; i < calArray.length; i++){ 
            //For each date
            html.append('<table id="table'+ indexTable + '" style="background-color:#CCFFFF; width:100%; table-layout:fixed; overflow:hidden;">');
            html.append('<thead>');
            
            // Add hours headers - Empty
            html.append('<tr>');
            html.append('<th class="ecal_emplabel" style="background:#CCFFFF;"></th>');
            for (var k = 0; k < calArray[i].calendarSlots.length; k++){
                html.append('<th class="ecal_slotheading_m" style="background:#CCFFFF;"></th>');                
            }
            html.append('</tr>');
            
            // Set Header date
            html.append('<tr><th colspan="'+(calArray[i].calendarSlots.length + 1)+'"  class="ecal_dateheading">');
            html.append(calArray[i]['datedisplay_month']);
            html.append('</th></tr>');
            
            // Add hours headers - with data
            html.append('<tr>');
            html.append('<th class="ecal_emplabel">SM Users</th>');
            for (var k = 0; k < calArray[i].calendarSlots.length; k++){
                html.append('<th class="ecal_slotheading_m" style="font-weight:normal;">' + calArray[i].calendarSlots[k]['heading'] + '</th>');                
            }
            html.append('</tr>');
            html.append('</thead>');
            html.append('<tbody>');
            
            for (var j = 0; j < calArray[i]['employees'].length; j++){ //For each employee

                var this_employeeid = calArray[i]['employees'][j].employeeid;
                
                var classclass_Employee = 'ecal_empheading';
                if (this_employeeid == -1000) {
                    classclass_Employee = 'ecal_empheading_unassigned';
                }
                html.append('<tr height="30" style="padding-bottom:0px; margin-bottom:0px; overflow:hidden" >');
                var employeename = '';
                if (smuser_hover[this_employeeid]) {
                    employeename = smuser_hover[this_employeeid].name;
                }
                var this_hover = '';
                if (smuser_hover[this_employeeid]) {
                    this_hover = smuser_hover[this_employeeid].hover;
                }
                html.append('<td class="' + classclass_Employee + '" onmouseover="tooltip.show(\'<span class=ecal_ttip>' + replaceContentEmployee(tooltipContentEmployee, this_hover) + '</span>\');" onmouseout="tooltip.hide();">' + employeename + '</td>');

                for (var k = 0; k < calArray[i].calendarSlots.length; k++){ //For each hour
                    var colspan = 1;
                    var cell_content = '';
                    var added_style = '';
                   
                    if(calArray[i]['employees'][j]['slots'][k]) {
                        var events = calArray[i]['employees'][j]['slots'][k]['events'];
                        if (eCalSortWO){
                            events = eCalSortWO.sort_wo(events);
                        }

                        added_style = 'background-color:#CCCCCC;';
                        for (var l = 0; l < events.length; l++) {
                            cell_content += '<span style="font-size:9pt; color:'+events[l].desc_color+'" onmouseover="tooltip.show(\'' + replaceContent(tooltipContent, events[l]) + '\');" onmouseout="tooltip.hide();">&bull;</span>';
                        }
                    }
                    
                    html.append('<td colspan="' + colspan + '" class="ecal_cell" style="' + added_style + '">');
                    html.append(cell_content);
                    html.append('</td>');
                }
                html.append('</tr>');
            }
            html.append('</table></td></tr>');
            html.append('</table>');
        }

        html.append('</span></td></tr></table>');

        if (calArray[0]['employees'].length > 0 && calArray[0]['employees'].length < 5){
            html.append('<br/><br/><br/><br/><br/><br/>');
        }

        html.append('<br/><br/></body>');
        html.append('</html>');
    }
    else{
        var eCalendar = {};
        var maxSlotsPerLine = calArray[0].calendarSlots.length;
        
        for(var i = 0; i < calArray.length; i++){ //For each date
            
            var eDate = calArray[i]['date'];
            var eDate_Date = nlapiStringToDate(eDate);
            var headerDate = calArray[i]['datedisplay_day'];
            var headerDayN = calArray[i]['dayn'];
            var headerSlots = [];  
            for (var k = 0; k < calArray[i].calendarSlots.length; k++){
                headerSlots.push(calArray[i].calendarSlots[k]['heading']); 
            }
            var headerSlotsClass = 'ecal_slotheading_d';

            eCalendar[i] = {
                date : eDate,            
                headerDate : headerDate,
                headerDayN : headerDayN,
                headerSlots : headerSlots,
                headerSlotsClass : headerSlotsClass,
                employees : {},
                holidayLine : []
            };

            var slotAvailableForAllEmployees = [];
            var slotAvailableForAllEmployeesWorkingDaysHours = [];
            
            for (var j = 0; j < maxSlotsPerLine; j++){
                slotAvailableForAllEmployees[j] = true;
                slotAvailableForAllEmployeesWorkingDaysHours[j] = true;
            }
            
            for (var j = 0; j < calArray[i]['employees'].length; j++){ //For each employee
                
                var employeeid = calArray[i]['employees'][j]['employeeid'];
                var employeename = '';
                if (smuser_hover[employeeid]) {
                    employeename = smuser_hover[employeeid].name;
                }
       
                eCalendar[i].employees[j] = {
                    employeeid : employeeid,
                    employeename : employeename,
                    employeeLine : [],
                    employeeHoliday : []
                };

                var slotAvailableForEmployee = slotAvailableForAllEmployees.slice(0);
                var slotAvailableForEmployeesWorkingDaysHours = slotAvailableForAllEmployeesWorkingDaysHours.slice(0);

                // Determine SM Working Days available for user
                if (employeeid != -1000) {
                    for (var k = 0; k < calArray[i].calendarSlots.length;k++){ 
                        var startms = calArray[i].calendarSlots[k]['startms'];
                        var endms = calArray[i].calendarSlots[k]['endms'];
                        if (smUser_WorkingDayObj[employeeid]) {
                            
                            var starttimems_wd = smUser_WorkingDayObj[employeeid].starttime;
                            var endtimems_wd = smUser_WorkingDayObj[employeeid].endtime;
                            var starttimems_wd_ori = smUser_WorkingDayObj[employeeid].starttimems;
                            var endtimems_wd_ori = smUser_WorkingDayObj[employeeid].endtimems;
                            if (!starttimems_wd || !endtimems_wd) {
                                slotAvailableForEmployeesWorkingDaysHours[k] = false;
                                continue;
                            }

                            starttimems_wd = nlapiStringToDate(calArray[i]['date'] + ' ' + changeTimeFormat(starttimems_wd, timeformat_context)).getTime();
                            endtimems_wd = nlapiStringToDate(calArray[i]['date'] + ' ' + changeTimeFormat(endtimems_wd, timeformat_context)).getTime();

                            var available = true;
                            if (starttimems_wd_ori < endtimems_wd_ori){
                                if (startms < starttimems_wd || endms > endtimems_wd) {
                                    available = false;
                                }
                            } else {
                                if (startms < starttimems_wd && endms > endtimems_wd) {
                                    available = false;
                                }    
                            }
                            slotAvailableForEmployeesWorkingDaysHours[k] = available;
                        }
                    }
                }
                
                // Determine Calendar Options                    
                var startLine = eCalendar[i].employees[j].employeeLine.length;  
                for (var k = 0; k < calArray[i].calendarSlots.length;k+=quantitySpans){ 
                    var slotEvent = {};
                        slotEvent.startSlot = k;
                        slotEvent.slotsStartEnd = quantitySpans;
                        slotEvent.endSlot = slotEvent.startSlot + (slotEvent.slotsStartEnd - 1);
                        slotEvent.cell_content = '';
                        slotEvent.added_style = '';
                        slotEvent.added_tooltip = '';
                        slotEvent.onclick = '';

                    if (slotAvailableForEmployeesWorkingDaysHours[k] && slotAvailableForEmployee[k]){
                        
                        var rawdate = nlapiStringToDate(calArray[i].calendarSlots[k]['date']);
                        var formatted_date = nlapiDateToString(rawdate);
                        var formatted_time = calArray[i].calendarSlots[k]['startms'];
                        var formatted_timeheading = calArray[i].calendarSlots[k]['heading'];
                        var formatted_user = eCalendar[i].employees[j].employeeid;
                        var formatted_url = createnewURL;
                        
                        var a_Id = formatted_date + '_' + formatted_time + '_' + formatted_user;
                        
                        slotEvent.cell_content = '<a class="ecal_link" id="' + a_Id + '" onmouseover="tooltip.show(\'Click here to create\',200);" onmouseout="tooltip.hide();" onclick="validateFieldseCalendar(this);" >';
                        slotEvent.cell_content += '+';
                        slotEvent.cell_content += '<input id="' + a_Id + '_url" type="hidden" value="'+formatted_url+'"/>';
                        slotEvent.cell_content += '<input id="' + a_Id + '_date" type="hidden" value="'+formatted_date+'"/>';
                        slotEvent.cell_content += '<input id="' + a_Id + '_time" type="hidden" value="'+formatted_timeheading+'"/>';
                        slotEvent.cell_content += '<input id="' + a_Id + '_user" type="hidden" value="'+formatted_user+'"/>';
                        slotEvent.cell_content += '</a>';
                        slotEvent.cell_content += '<input class="selecttocreate" id="cb_' + a_Id + '" type="checkbox"/>';
                    }

                    if (!slotAvailableForEmployeesWorkingDaysHours[k] || !slotAvailableForEmployee[k]) {
                        slotEvent.added_style = 'background-color:#' + emptySlotColor;
                    }

                    pushNewEvent(eCalendar[i].employees[j].employeeLine,startLine,slotEvent);
                }

                // Determine SM Working Day per Users - Holiday without specified period
                if (smUser_WorkingDayObj[employeeid]){
                    if (smUser_WorkingDayObj[employeeid].holidayDate[eDate_Date.getTime()]) {
                        var holidayWithoutSpecifiedPeriod = smUser_WorkingDayObj[employeeid].holidayDate[eDate_Date.getTime()].holidayWithoutSpecifiedPeriod;
                        for(var h = 0; h < holidayWithoutSpecifiedPeriod.length; h++){
                            var startLine = eCalendar[i].employees[j].employeeHoliday.length;
                            var holiday = holidayWithoutSpecifiedPeriod[h];

                            var slotEvent = {
                                id : holiday.id,
                                startSlot : 0,
                                colspan : headerSlots.length,
                                endSlot : headerSlots.length,
                                added_style : 'border-style:solid; border-width:thin; border-color:black; -moz-border-radius:9px; background-color:' + holiday.bgColor + '; color: ' + holiday.txtColor + ';',
                                added_tooltip : '',
                                cell_content : '<span style="font-size:7pt; padding:0px 1px; height:auto;"> <a class="ecal_unlink" href="' + holiday.url + '" target="_blank">'+holiday.description+'</a></span>'
                            };
                            nlapiLogExecution('debug',"// Determine SM Working Day per Users - Holiday without specified period", JSON.stringify(eCalendar[i].employees[j].employeeHoliday));
                            nlapiLogExecution('debug',"addNewEvent:"+startLine, JSON.stringify(slotEvent));
        
                            addNewEvent(eCalendar[i].employees[j].employeeHoliday,startLine,slotEvent);
                            nlapiLogExecution('debug',"// Determine SM Working Day per Users - Holiday without specified period", JSON.stringify(eCalendar[i].employees[j].employeeHoliday));
                            for (var m = slotEvent.startSlot; m <= slotEvent.endSlot; m++){
                                slotAvailableForEmployee[m] = false;
                            }
                        }
                    }
                }
                
                // Determine SM Working Day per Users - Holiday with specified period
                var startLine = eCalendar[i].employees[j].employeeLine.length;
                if(calArray[i].employees[j].events && calArray[i].employees[j].events.length > 0){                
                    var events = calArray[i].employees[j].events;
                    
                    if (eCalSortWO){
                        events = eCalSortWO.sort_wo(events);
                    }      

                    for (var l = 0; l < events.length;l++){
                        var slotEvent = {};
                        var event = events[l];

                        if (event.internal == 'T'){ 
                            var colspan = pnvl(event.slots_day, true);
                            if(event.colspan <1) continue;
                            
                            slotEvent.id = event.ecal_id;
                            slotEvent.travelStartSlots = event.travelstartslots;
                            slotEvent.travelEndSlots = event.travelendslots;
                            slotEvent.travelColor = 'border-style:solid; border-width:thin; border-color:black; -moz-border-radius:9px; background-color:#' + custscript_ecal_travelcolor;
                            slotEvent.slotsStartEnd = event.slotsstartend;                         
                            slotEvent.startSlot = event.startSlot;                        
                            slotEvent.colspan = colspan;
                            slotEvent.endSlot = slotEvent.startSlot + (slotEvent.colspan - 1);
                            
                            var eventColor = event.desc_color;
                            slotEvent.added_style = 'border-style:solid; border-width:thin; border-color:black; -moz-border-radius:9px; background-color:#' + event.bgColor + '; color:#' + event.txtColor + ';';
                            slotEvent.added_tooltip = 'onmouseover="tooltip.show(\'<span class=ecal_ttip>' + event.description + '</span>\');" onmouseout="tooltip.hide();" ';
                            slotEvent.cell_content = '<span style="font-size:10pt; padding:0px 1px; height:auto;"> <a class="ecal_unlink" href="' + event.url + '" target="_blank">' + event.nameColorIndex + '</a></span>';

                            nlapiLogExecution('debug',"// Determine SM Working Day per Users - Holiday with specified period", JSON.stringify(eCalendar[i].employees[j].employeeLine));
                            nlapiLogExecution('debug',"addNewEvent:"+startLine, JSON.stringify(slotEvent));
                            addNewEvent(eCalendar[i].employees[j].employeeLine,startLine,slotEvent);
                            nlapiLogExecution('debug',"// Determine SM Working Day per Users - Holiday with specified period", JSON.stringify(eCalendar[i].employees[j].employeeLine));
                            for (var m = slotEvent.startSlot; m <= slotEvent.endSlot; m++){
                                slotAvailableForEmployee[m] = false;
                            }
                        }
                    }
                }

                // Determine SM WO Service Appointment
                var startLine = eCalendar[i].employees[j].employeeLine.length-1;
                if(calArray[i].employees[j].events && calArray[i].employees[j].events.length > 0){                
                    var events = calArray[i].employees[j].events;
                    
                    if (eCalSortWO){
                        events = eCalSortWO.sort_wo(events);
                    }      
                    
                    for (var l = 0; l < events.length;l++){
                        var slotEvent = {};
                        var event = events[l];

                        if (event.internal != 'T'){                         
                            var colspan = pnvl(event.slots_day, true);
                            if(event.colspan <1) continue;
                            
                            slotEvent.id = event.ecal_id;
                            slotEvent.travelStartSlots = event.travelstartslots;
                            slotEvent.travelEndSlots = event.travelendslots;
                            slotEvent.travelColor = 'border-style:solid; border-width:thin; border-color:black; -moz-border-radius:9px; background-color:#' + custscript_ecal_travelcolor;
                            slotEvent.slotsStartEnd = event.slotsstartend;                         
                            slotEvent.startSlot = event.startSlot;                        
                            slotEvent.colspan = colspan;
                            slotEvent.endSlot = slotEvent.startSlot + (slotEvent.colspan - 1);
                            
                            var eventColor = event.desc_color;
                            if (event.travelwo == "T") {
                                eventColor = custscript_ecal_travelcolor;
                            }
                            
                            slotEvent.added_style = 'border-style:solid; border-width:thin; border-color:black; -moz-border-radius:9px; background-color:#' + eventColor;
                            slotEvent.cell_content = replaceContent(eventBoxContext, event);
                            slotEvent.added_tooltip = 'onmouseover="tooltip.show(\'<span class=ecal_ttip>' + replaceContent(tooltipContent, event) + '</span>\');" onmouseout="tooltip.hide();" ';
                            slotEvent.onclick = ' onclick="window.open(\''+nlapiResolveURL('RECORD', event.recordtype, event.parentWO)+'\', \'ecalevent'+event.ecal_id+'\');"'; 

                            nlapiLogExecution('debug',"// Determine SM WO Service Appointment", JSON.stringify(eCalendar[i].employees[j].employeeLine));
                            nlapiLogExecution('debug',"addNewEvent:"+startLine, JSON.stringify(slotEvent));
                            addNewEvent(eCalendar[i].employees[j].employeeLine,startLine,slotEvent);
                            nlapiLogExecution('debug',"// Determine SM WO Service Appointment", JSON.stringify(eCalendar[i].employees[j].employeeLine));
                        }
                    }
                }

            }
        }

        nlapiLogExecution('audit','renderCalendar: eCalendar',JSON.stringify(eCalendar));
            
        ////////DRAW BODY/////////
        html.append('<body><table width="100%" style=""><tr><td>');

        for (var i in eCalendar){
            html.append('<table id="table'+ indexTable + '" cellspacing="1" cellpadding="0" style="background-color:#CCFFFF; width:100%; table-layout:fixed; overflow:hidden;">');
            
            // Set Header Employee - Empty
            html.append('<thead>');
            html.append('<tr>');
            html.append('<th class="ecal_emplabel"></th>');
            for (var j=0; j < eCalendar[i].headerSlots.length;j+=quantitySpans){
                html.append('<th colspan="' + quantitySpans + '" class="'+ eCalendar[i].headerSlotsClass +'"></th>');
            }
            html.append('</tr>');    
            
            // Set Header date
            var headerDayN = eCalendar[i].headerDayN;
            html.append('<tr><th colspan="'+(eCalendar[i].headerSlots.length + 1)+'" class="ecal_dateheading">');
            html.append(eCalendar[i].headerDate);
            html.append('</th></tr>');
            
            // Set Header Employee - With Data
            html.append('<tr>');
            html.append('<th class="ecal_emplabel">SM Users</th>');
            for (var j=0; j < eCalendar[i].headerSlots.length;j+=quantitySpans){
                html.append('<th colspan="' + quantitySpans + '" class="'+ eCalendar[i].headerSlotsClass +'" style="font-weight:normal;">' + eCalendar[i].headerSlots[j] + '</th>');
            }
            html.append('</tr>');    
                
            html.append('</thead>');
            html.append('<tbody>');
            
            //Set Employee Name
            for (var j in eCalendar[i].employees){
                
                var class_Employee = 'ecal_empheading2';
                if (eCalendar[i].employees[j].employeeid == -1000) {
                    class_Employee = 'ecal_empheading_unassigned';
                }

                var this_employeeid = eCalendar[i].employees[j].employeeid;
                var this_hover = '';
                var existWorkingDay = false;
                        
                if (smUser_WorkingDayObj[this_employeeid]) {
                    if (smUser_WorkingDayObj[this_employeeid].dayWD[headerDayN]) {
                        existWorkingDay = true;
                    }
                }
                if (smuser_hover[this_employeeid]) {
                    this_hover =  smuser_hover[this_employeeid].hover;
                }
                
                var numberOfLineByEmployee = eCalendar[i].employees[j].employeeLine.length;
                var numberOfLineByEmployeeHolidays = eCalendar[i].employees[j].employeeHoliday.length;
                var totalLinesByEmployee = parseInt(numberOfLineByEmployee,10) + parseInt(numberOfLineByEmployeeHolidays,10);

                html.append('<tr style="padding-bottom:0px; margin-bottom:0px; overflow:hidden;" >');
                html.append('<td class="' + class_Employee + '" onmouseover="tooltip.show(\'<span class=ecal_ttip>' + replaceContentEmployee(tooltipContentEmployee,this_hover) + '</span>\');" onmouseout="tooltip.hide();" rowspan="'+ totalLinesByEmployee +'">' + eCalendar[i].employees[j].employeename + '</td>');

                if (eCalendar[i].employees[j].employeeHoliday.length > 0){
                    for (var m=0; m< numberOfLineByEmployeeHolidays;m++){
                        for (var k = 0; k < eCalendar[i].employees[j].employeeHoliday[m].length;k++){
                            var slot = eCalendar[i].employees[j].employeeHoliday[m][k];
                            html.append('<td colspan="' + slot.colspan + '" class="ecal_cell_left" style="' + slot.added_style + '" ' + slot.added_tooltip + slot.onclick +'>');
                            html.append(slot.cell_content);
                            html.append('</td>');
                        }
                        html.append('</tr>');              
                    }
                }

                for( var k = 0; k < numberOfLineByEmployee;k++){
                    var startEmptySlot = 0;
                    if (existWorkingDay || this_employeeid == -1000) {
                        for (var l = 0; l < eCalendar[i].employees[j].employeeLine[k].length; l++){                       
                            var slot = eCalendar[i].employees[j].employeeLine[k][l];
                           
                            if (slot.startSlot > startEmptySlot){
                                var colSpamEmptySlot = slot.startSlot - startEmptySlot;
                                html.append('<td colspan="' +colSpamEmptySlot   + '" style=""></td>');
                            }

                            if (slot.travelStartSlots){
                                html.append('<td colspan ="' + slot.travelStartSlots + '" class="ecal_cell_left" style="color:' + slot.travelColor + '" ' + slot.added_tooltip + slot.onclick +'>');
                                html.append('<span style="font-size:7pt; height:10px; padding-left:5px;">&rArr;</span>');
                                html.append('</td>');
                            }                                    

                            if (slot.slotsStartEnd > 0) {
                                html.append('<td colspan="' + slot.slotsStartEnd + '" class="ecal_cell_left" style="' + slot.added_style + '" ' + slot.added_tooltip + slot.onclick +'>');                        
                                html.append(slot.cell_content);
                                html.append('</td>');    
                            }

                            if (slot.travelEndSlots){
                                html.append('<td colspan ="' + slot.travelEndSlots + '" class="ecal_cell_left" style="color:' + slot.travelColor + '; text-align:right;" ' + slot.added_tooltip + slot.onclick +'>');
                                html.append('<span style="font-size:7pt; height:10px; padding-left:5px; padding-right:5px;">&rArr;</span>');
                                html.append('</td>');
                            } 
                            startEmptySlot = slot.endSlot + 1;                        
                        }
                    }
                    
                    if(startEmptySlot < maxSlotsPerLine) {
                        var colSpamEmptySlot = maxSlotsPerLine - startEmptySlot;
                        html.append('<td colspan="' + colSpamEmptySlot + '" style=""></td>');
                    }                    
                    html.append('</tr>');
                    if (k != (numberOfLineByEmployee - 1)){
                        html.append('<tr style="padding-bottom:0px; margin-bottom:0px; overflow:hidden;" >');
                    }
                }
                html.append('</tr>');
            }
            
            html.append('</tbody>');
            html.append('</table>');
            
            indexTable += 1;
        }

        html.append('</td></tr></table>');

        if (calArray[0]['employees'].length > 0 && calArray[0]['employees'].length < 5 && viewtype == 1){
            html.append('<br/><br/><br/><br/><br/><br/>');
        }

        html.append('<form>');
        html.append('<input type="hidden" id="ecal_hidden_first_checkbox" value="true" />');
        html.append('</form>');

        html.append('<br/><br/></body>');
        html.append('</html>');
    }

    section = 'Save order json data to a file';
    fileResp = nlapiCreateFile( '1_smUser_WorkingDayObj' + '.txt', 'PLAINTEXT', JSON.stringify(smUser_WorkingDayObj));
    fileResp.setFolder(CALENDARFOLDERID); 
    fileID = nlapiSubmitFile(fileResp);
    fileResp = nlapiCreateFile( '3_calArray' + '.txt', 'PLAINTEXT', JSON.stringify(calArray));
    fileResp.setFolder(CALENDARFOLDERID); 
    fileID = nlapiSubmitFile(fileResp);
    fileResp = nlapiCreateFile( '4_eCalendar' + '.txt', 'PLAINTEXT', JSON.stringify(eCalendar));
    fileResp.setFolder(CALENDARFOLDERID); 
    fileID = nlapiSubmitFile(fileResp);
    fileResp = nlapiCreateFile( '5_html' + '.txt', 'PLAINTEXT', html);
    fileResp.setFolder(CALENDARFOLDERID); 
    fileID = nlapiSubmitFile(fileResp);

}

function getSMWorkingDay(smUsers, targettimezone) {
    
    var filtersH = [
        new nlobjSearchFilter('custrecord_sm_workingdays_user',null,'anyOf',smUsers),
        new nlobjSearchFilter('custrecord_sm_workingdays_starttime',null,'isnotempty'),
        new nlobjSearchFilter('custrecord_hakuna_dt_working_day','custrecord_sm_workingdays_day_type','is','T'),
        new nlobjSearchFilter('custrecord_sm_workingdays_date',null,'isempty'),
        new nlobjSearchFilter('isinactive',null,'is','F')
    ];
    
    var columnsH = [
        new nlobjSearchColumn('custrecord_ecal_opp_color_index','custrecord_sm_workingdays_color'),
        new nlobjSearchColumn('custrecord_ecal_opp_color_text_index','custrecord_sm_workingdays_color'),
        new nlobjSearchColumn('name','custrecord_sm_workingdays_color'),
        new nlobjSearchColumn('custrecord_ecal_opp_color_day_type','custrecord_sm_workingdays_color'),
        new nlobjSearchColumn('custrecord_sm_workingdays_sun'),
        new nlobjSearchColumn('custrecord_sm_workingdays_mon'),
        new nlobjSearchColumn('custrecord_sm_workingdays_tue'),
        new nlobjSearchColumn('custrecord_sm_workingdays_wed'),
        new nlobjSearchColumn('custrecord_sm_workingdays_thu'),
        new nlobjSearchColumn('custrecord_sm_workingdays_fri'),
        new nlobjSearchColumn('custrecord_sm_workingdays_sat'),
        new nlobjSearchColumn('custrecord_sm_workingdays_user'),
        new nlobjSearchColumn('custrecord_sm_workingdays_starttime'),
        new nlobjSearchColumn('custrecord_sm_workingdays_hours'),
        new nlobjSearchColumn('custrecord_sm_workingdays_time_zone')
    ];

    var search = nlapiCreateSearch('customrecord_sm_workingdays',filtersH,columnsH);
    var resultSet = search.runSearch();
    var resultsStart = 0;

    do{        
        var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
        if (searchResults && searchResults.length > 0){    
            for(var k = 0; k < searchResults.length; k++){
                var smUserId = searchResults[k].getValue('custrecord_sm_workingdays_user');
                var starttime_WD = searchResults[k].getValue('custrecord_sm_workingdays_starttime');
                var timezone_WD = searchResults[k].getValue('custrecord_sm_workingdays_time_zone');
                var duration = parseFloat(searchResults[k].getValue('custrecord_sm_workingdays_hours')) || 8;
                var endtime_WD = '';
                var tzObject = TZ_convertTimezoneUsingOlsonkey('1/1/2021',starttime_WD,timezone_WD,targettimezone, timeformat);
                nlapiLogExecution('audit','starttime_WD'+starttime_WD + ', timezone_WD'+timezone_WD, 'targettimezone'+targettimezone + ' tzObject '+ JSON.stringify(tzObject));
                var workingday_starttime = tzObject.time;

                var event_startdate_Date = nlapiStringToDate(workingday_starttime,'timeofday');
                var hours = pnvl(event_startdate_Date.getHours(),true);
                var newHours = hours + duration;
  

                event_startdate_Date.setHours(newHours);
                endtime_WD = nlapiDateToString(event_startdate_Date,'timeofday');
                nlapiLogExecution('audit','workingday_starttime'+workingday_starttime, 'startHours'+hours);            
                nlapiLogExecution('audit','endtime_WD'+endtime_WD, 'endHours'+newHours);            

                if (!smUser_WorkingDayObj[smUserId]) {
                    if (newHours<=34){
                        smUser_WorkingDayObj[smUserId] = {
                            bgColor : searchResults[k].getValue('custrecord_ecal_opp_color_index','custrecord_sm_workingdays_color'),
                            txtColor : searchResults[k].getValue('custrecord_ecal_opp_color_text_index','custrecord_sm_workingdays_color'),
                            nameColorIndex : searchResults[k].getValue('name','custrecord_sm_workingdays_color'),
                            starttime : changeTimeFormat(workingday_starttime, timeformat),
                            endtime : changeTimeFormat(endtime_WD, timeformat),
                            starttimems : stringToMS(workingday_starttime),
                            endtimems : stringToMS(endtime_WD),
                            dayWD : [],
                            holidayDate : {},
                            holidayForSpecifiedPeriod : []
                        };    
                    } else {
                        event_startdate_Date.setHours(24);
                        meantime_WD = nlapiDateToString(event_startdate_Date,'timeofday');
                        nlapiLogExecution('audit','meantime_WD'+endtime_WD, '24');            
        
                        smUser_WorkingDayObj[smUserId] = {
                            bgColor : searchResults[k].getValue('custrecord_ecal_opp_color_index','custrecord_sm_workingdays_color'),
                            txtColor : searchResults[k].getValue('custrecord_ecal_opp_color_text_index','custrecord_sm_workingdays_color'),
                            nameColorIndex : searchResults[k].getValue('name','custrecord_sm_workingdays_color'),
                            starttime : changeTimeFormat(workingday_starttime, timeformat),
                            endtime : changeTimeFormat(meantime_WD, timeformat),
                            starttimems : stringToMS(workingday_starttime),
                            endtimems : stringToMS(meantime_WD),
                            dayWD : [],
                            holidayDate : {},
                            holidayForSpecifiedPeriod : []
                        };
                    }
                }

                smUser_WorkingDayObj[smUserId].dayWD.push(searchResults[k].getValue('custrecord_sm_workingdays_sun') == 'T');
                smUser_WorkingDayObj[smUserId].dayWD.push(searchResults[k].getValue('custrecord_sm_workingdays_mon') == 'T');
                smUser_WorkingDayObj[smUserId].dayWD.push(searchResults[k].getValue('custrecord_sm_workingdays_tue') == 'T');
                smUser_WorkingDayObj[smUserId].dayWD.push(searchResults[k].getValue('custrecord_sm_workingdays_wed') == 'T');
                smUser_WorkingDayObj[smUserId].dayWD.push(searchResults[k].getValue('custrecord_sm_workingdays_thu') == 'T');
                smUser_WorkingDayObj[smUserId].dayWD.push(searchResults[k].getValue('custrecord_sm_workingdays_fri') == 'T');
                smUser_WorkingDayObj[smUserId].dayWD.push(searchResults[k].getValue('custrecord_sm_workingdays_sat') == 'T');
            }
        }
        resultsStart += 1000;

    } while (searchResults && searchResults.length == 1000);

    nlapiLogExecution('AUDIT','getSMWorkingDay:smUser_WorkingDayObj',JSON.stringify(smUser_WorkingDayObj)); 
    
}

function getHolidayDays(startdate, enddate, HsmUsers) {
    
    var startDate_Date = nlapiStringToDate(startdate);
    var endDate_Date = nlapiStringToDate(enddate);

    var startDatems = startDate_Date.getTime();
    var endDatems = endDate_Date.getTime();
    
    if(HsmUsers.length > 0){
        //Get Users with Appointments
        var appointmentUsers = [];
        var appointmentSearchFilters = [];
        appointmentSearchFilters.push(new nlobjSearchFilter('custrecord_hakuna_wos_user',null,'anyOf',HsmUsers));
        appointmentSearchFilters.push(new nlobjSearchFilter('custrecord_hakuna_wos_start_date',null,'isnotempty'));
        appointmentSearchFilters.push(new nlobjSearchFilter('custrecord_hakuna_wos_start_date',null,'onorafter',startdate));
        appointmentSearchFilters.push(new nlobjSearchFilter('custrecord_hakuna_wos_start_date',null,'onorbefore',enddate));
        appointmentSearchFilters.push(new nlobjSearchFilter('isinactive',null,'is','F'));
        var appointmentSearchColumns = [];
        appointmentSearchColumns.push(new nlobjSearchColumn('custrecord_hakuna_wos_user'));
        var appointmentSearchResults = nlapiSearchRecord('customrecord_hakuna_work_order_user_sch', null, appointmentSearchFilters, appointmentSearchColumns);
        if (appointmentSearchResults && appointmentSearchResults.length > 0) {    
            for (var r = 0; r < appointmentSearchResults.length; r++) {
                var user = appointmentSearchResults[r].getValue('custrecord_hakuna_wos_user');
                if (appointmentUsers.indexOf(user) == -1) {
                    appointmentUsers.push(user);
                }
            }
        }
        //Get Holidays
        var filtersH = [
            new nlobjSearchFilter('custrecord_sm_workingdays_user',null,'anyOf',HsmUsers),
            new nlobjSearchFilter('custrecord_sm_workingdays_date',null,'isnotempty'),
            new nlobjSearchFilter('custrecord_sm_workingdays_date',null,'onorafter',startdate),
            new nlobjSearchFilter('custrecord_sm_workingdays_date',null,'onorbefore',enddate),
            new nlobjSearchFilter('custrecord_hakuna_dt_holiday','custrecord_sm_workingdays_day_type','is', 'T'),
            new nlobjSearchFilter('isinactive',null,'is','F')
        ];

        var columnsH = [
            new nlobjSearchColumn('custrecord_ecal_opp_color_index','custrecord_sm_workingdays_color'),
            new nlobjSearchColumn('custrecord_ecal_opp_color_text_index','custrecord_sm_workingdays_color'),
            new nlobjSearchColumn('name','custrecord_sm_workingdays_color'),
            new nlobjSearchColumn('custrecord_sm_workingdays_date'),
            new nlobjSearchColumn('custrecord_sm_workingdays_user'),
            new nlobjSearchColumn('custrecord_sm_workingdays_starttime'),
            new nlobjSearchColumn('custrecord_sm_workingdays_hours'),
            new nlobjSearchColumn('custrecord_sm_workingdays_description')
        ];

        var search = nlapiCreateSearch('customrecord_sm_workingdays',filtersH,columnsH);
        var resultSet = search.runSearch();
        var resultsStart = 0;

        do{        
            var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
            if (searchResults && searchResults.length > 0){      
                for(var k = 0; k < searchResults.length; k++){
                    
                    var holidayDate = searchResults[k].getValue('custrecord_sm_workingdays_date') || '';
                    var smuser = searchResults[k].getValue('custrecord_sm_workingdays_user') || '';

                    if (smUser_WorkingDayObj[smuser] && holidayDate) {
                        var holidayDate_Date = nlapiStringToDate(holidayDate).getTime();
                        if (!smUser_WorkingDayObj[smuser].holidayDate[holidayDate_Date]) {
                            smUser_WorkingDayObj[smuser].holidayDate[holidayDate_Date] = {
                                holidayWithoutSpecifiedPeriod : []//,
//                                holidayForSpecifiedPeriod : []
                            };
                        }
                        
                        var holidayId = searchResults[k].getId();
                        var urlHoliday = nlapiResolveURL('RECORD','customrecord_sm_workingdays',holidayId);
                        var description = searchResults[k].getValue('custrecord_sm_workingdays_description') || '';
                        
                        var starttime_WD = searchResults[k].getValue('custrecord_sm_workingdays_starttime') || '';
                        var duration = parseFloat(searchResults[k].getValue('custrecord_sm_workingdays_hours'),10) || '';
                        
                        var bgColor = searchResults[k].getValue('custrecord_ecal_opp_color_index','custrecord_sm_workingdays_color') || 'FFFFFF';
                        var txtColor = searchResults[k].getValue('custrecord_ecal_opp_color_text_index','custrecord_sm_workingdays_color') || '000000';
                        var nameColorIndex = searchResults[k].getValue('name','custrecord_sm_workingdays_color') || '';

                        if (!starttime_WD && !duration) {
                            smUser_WorkingDayObj[smuser].holidayDate[holidayDate_Date].holidayWithoutSpecifiedPeriod.push({
                                id : holidayId,
                                date : holidayDate,
                                bgColor : bgColor,
                                txtColor : txtColor,
                                nameColorIndex : nameColorIndex,
                                url : urlHoliday,
                                description : description
                            });
                        }
                        else{
                            var event_startdate_Date = nlapiStringToDate(holidayDate + ' ' + starttime_WD,'timeofday');

                            var hours = pnvl(event_startdate_Date.getHours(),true);
                            var newHours = hours + duration;

                            event_startdate_Date.setHours(newHours);
                            var event_enddate = nlapiDateToString(event_startdate_Date,'date');
                            var endtime_WD = nlapiDateToString(event_startdate_Date,'timeofday');

                            var starttimeMS = stringToMS(starttime_WD);
                            var endtimeMS = stringToMS(endtime_WD);

                            if ( starttimeMS === '' || endtimeMS === ''){
                                nlapiLogExecution('ERROR', 'Event without start or end time,');
                                continue;
                            }

                            var start = nlapiStringToDate(holidayDate).getTime();
                            var end = nlapiStringToDate(event_enddate).getTime();

                            if (start > endDatems || end < startDatems){
                                //Out of date range.
                                nlapiLogExecution('DEBUG','Out of date range.');                 
                                continue;
                            }

                            starttimeMS = ((starttimeMS) - (starttimeMS % millisecondsInSlot));
                            start += starttimeMS;

                            end = end + endtimeMS;
                            var slotsStartEnd = Math.ceil((end-start) / millisecondsInSlot);         
                            end = start + (slotsStartEnd * millisecondsInSlot);

                            var slots = pnvl(slotsStartEnd,true);   
                            if (slots == 0) slots = 1;

                            smUser_WorkingDayObj[smuser].holidayForSpecifiedPeriod.push({
                                id : holidayId,
                                date : holidayDate,
                                bgColor : bgColor,
                                txtColor : txtColor,
                                nameColorIndex : nameColorIndex,
                                url : urlHoliday,
                                description : description,
                                startdate    : holidayDate,
                                starttime    : starttime_WD,
                                starttime24H : transformTimeAMPMto24H(starttime_WD),
                                startms      : start,
                                starttimems  : start,
                                enddate      : event_enddate,
                                endtime      : endtime_WD,
                                endtime24H   : transformTimeAMPMto24H(endtime_WD),
                                endms        : end-1,
                                endtimems    : end-1,
                                slots_day    : slots,
                                slotsstartend: slotsStartEnd,
                                attendee_id  : smuser,
                                attendee     : smuser_hover[smuser].entityid,
                                internal     : 'T',
                                inserted : false
                            });
                        }
                        
                        if (appointmentUsers.indexOf(smuser) == -1 && noAppointmentUsers.indexOf(smuser) == -1) {
                            noAppointmentUsers.push(smuser);
                        }
                    }
                }
            }
            resultsStart += 1000;

        } while (searchResults && searchResults.length == 1000);
    }
    nlapiLogExecution('AUDIT','getHolidayDays:smUser_WorkingDayObj',JSON.stringify(smUser_WorkingDayObj)); 
}

function getAttributes(attbArray) {
    var attrbObj = {};
    
    if (attbArray.length > 0) {
        var filterText = "[['isinactive','is','F'],'and',";
        for(var a = 0; a < attbArray.length; a++){
            var attbId = attbArray[a];
            if (a != 0) {
                filterText += ",'or',";
            }
            
            filterText += "['custrecord_ep_atrb_id','is','"+attbId+"']";
        }
        filterText += "]";
        
        var filters = [
            eval(filterText)
        ];

        var columns = [
            new nlobjSearchColumn('custrecord_ep_atrb_id'),
            new nlobjSearchColumn('custrecord_ep_atrb_value')
        ];
      
        var search = nlapiCreateSearch('customrecord_epip_attributes',filters,columns);
        var resultSet = search.runSearch();
        var resultsStart = 0;

        do{        
            var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
            if (searchResults && searchResults.length > 0){      
                for(var k = 0; k < searchResults.length; k++){
                    var id = searchResults[k].getValue('custrecord_ep_atrb_id');
                    var value = searchResults[k].getValue('custrecord_ep_atrb_value');
                    if (!attrbObj[id] && value) {
                        attrbObj[id] = {
                            value : value
                        };
                    }
                }
            }
            resultsStart += 1000;

        } while (searchResults && searchResults.length == 1000);
    }
    
    return attrbObj;
}

function getDataForEachEmployee(smUsers,smsubsidiary) {
nlapiLogExecution('audit','subsidiary',smsubsidiary);
    var filters = [
        new nlobjSearchFilter('internalid',null,'anyOf',smUsers),
        new nlobjSearchFilter('isinactive',null,'is', 'F')
    ];
    
    var columns = [ 
        new nlobjSearchColumn('name')
    ];

    for (var i in tooltipObjectEmployee){
        columns.push(new nlobjSearchColumn(tooltipObjectEmployee[i].fieldInternalId));
    }
    
    var search = nlapiCreateSearch('customrecord_hakuna_user',filters,columns);
    var resultSet = search.runSearch();
    var resultsStart = 0;

    do{        
        var searchResults = resultSet.getResults(resultsStart,resultsStart + 1000);                
        if (searchResults && searchResults.length > 0){      
            for(var k = 0; k < searchResults.length; k++){
                var eventObjectSMUser = {};
                var smUserIDHover = searchResults[k].getId();
                var smuser_name = pnvl(searchResults[k].getValue('name'));
                

                for(var tooltipField in tooltipObjectEmployee){
                    var isText = tooltipObjectEmployee[tooltipField].isText;
                    var fieldInternalId = tooltipObjectEmployee[tooltipField].fieldInternalId;

                    if (isText){
                        eventObjectSMUser[tooltipField] = searchResults[k].getText(fieldInternalId) || '';
                    }
                    else{
                        eventObjectSMUser[tooltipField] = searchResults[k].getValue(fieldInternalId) || '';
                    }
                }

                if (!smuser_hover[smUserIDHover]){
                    smuser_hover[smUserIDHover] = {
                        name : smuser_name,
                        hover : eventObjectSMUser
                    };
                }
            }
        }
        resultsStart += 1000;

    } while (searchResults && searchResults.length == 1000);
    
    smuser_hover[-1000] = {
        name : 'UNASSIGNED',
        hover : {}
    };

    nlapiLogExecution('debug', 'getDataForEachEmployee', JSON.stringify(smuser_hover));
}

function getTooltipFields(tooltipString) {   
    var tooltipFields = new Object();
    var titleStartField = tooltipString;
    var arrayTooltip = ["title","attendee","startdate","enddate","starttime","endtime","starttime24H","endtime24H","organizer","description","company","status","address"];
    do {
        var startField = titleStartField.indexOf('{');
        if (startField != -1) {
            titleStartField = titleStartField.substr(startField);
            var endField = titleStartField.indexOf('}');
            if (endField != -1) {
                var field = titleStartField.substr(0,endField+1);
                var fieldName = field.substring(1,field.length-1);

                var isText = (fieldName.indexOf('TEXT') > -1);
                var is24H = (fieldName.indexOf('24H') > -1);
                var isPWO = (fieldName.indexOf('PWO') > -1);
                var fieldInternalId = fieldName;
                var join = null;

                if (is24H){                   
                    fieldInternalId = fieldInternalId.replace('24H','');                  
                }
                
                if (isText){                                 
                    fieldInternalId = fieldInternalId.replace('TEXT','');                                       
                }
                
                if (isPWO){      
                    fieldInternalId = fieldInternalId.replace('PWO','');                  
                }
                
                if(fieldInternalId.indexOf('.') > 0){
                    var arrayField = fieldInternalId.split('.');
                    fieldInternalId = arrayField[1];
                    join = arrayField[0];
                }

                if (arrayTooltip.indexOf(fieldInternalId) == -1){                    
                    if (!tooltipFields[fieldName]){                       
                        tooltipFields[fieldName] = {
                            is24H : is24H,
                            isText : isText,
                            isPWO : isPWO,
                            fieldInternalId : fieldInternalId,
                            join : join
                        };
                    }
                }
                titleStartField = titleStartField.substr(endField+1);
            }
            else {
                break;
            }
        }
        else {
            break;
        }
    }
    while (true);

    return tooltipFields;
}

function getTooltipFieldsEmployee(tooltipString) {   
    var tooltipFields = {};
    var arrayTooltip = [];
    var titleStartField = tooltipString;
                
    if (titleStartField){
        do {
            var startField = titleStartField.indexOf('{');
            if (startField != -1) {
                titleStartField = titleStartField.substr(startField);
                var endField = titleStartField.indexOf('}');
                if (endField != -1) {
                    var field = titleStartField.substr(0,endField+1);
                    var fieldName = field.substring(1,field.length-1);
                    var isText = (fieldName.indexOf('TEXT') > -1);

                    var fieldInternalId = fieldName;     

                    if (isText){                                 
                        fieldInternalId = fieldInternalId.replace('TEXT','');                                       
                    }           

                    if (arrayTooltip.indexOf(fieldInternalId) == -1){                    
                        if (!tooltipFields[fieldName]){                       
                            tooltipFields[fieldName] = {
                                isText : isText,
                                fieldInternalId : fieldInternalId
                            };
                        }
                    }
                    titleStartField = titleStartField.substr(endField+1);
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }
        while (true);
    }

    return tooltipFields;
}

//Libraries
function logError(section, err){
    var err_Details = "";

    if ( err instanceof nlobjError ) { 
        err_Details = err.getDetails();
    }
    else {
        err_Details = err.message;
    }
    nlapiLogExecution( 'error', 'Error Notification on ' + section,  err_Details );
}

function StringBuffer() {this.buffer = [];}
    StringBuffer.prototype.append = function(string){
        this.buffer.push(string);
        return this;
    }
    StringBuffer.prototype.toString = function(){
        return this.buffer.join("");
    }

function cloneObject(_this) {
    var newObj = (_this instanceof Array) ? [] : {};
    for (var i in _this){      
        if (i == 'clone') continue;
        if (_this[i] && typeof _this[i] == "object")
        {
            newObj[i] = cloneObject(_this[i]);
        }
        else newObj[i] = _this[i]
    }
    return newObj;
};

function getGradient(col1, col2) {
    var gradient = 'background: #' + col1 + ';';
        gradient+= 'background: -webkit-gradient(linear, 0% 0%, 0% 100%, from(#'+col1+'), to(#'+col2+'));'; /* for webkit browsers */
        gradient+= 'background: -moz-linear-gradient(top,#'+col1+',  #'+col2+');'; /* for firefox 3.6+ */
        gradient+= 'background: -ms-linear-gradient(top,#'+col1+',#'+col2+');' ;/* IE10+ */
        gradient+= 'background: linear-gradient(#'+col1+',#'+col2+');' /* W3C */  
    return gradient;
}

function replaceContent(str, events) {
    str = str.replace(/&lt;/g, '<');
    str = str.replace(/&gt;/g, '>');
    str = str.replace('{attendee}', nlapiEscapeXML(events['attendee']));
    str = str.replace('{startdate}', nlapiEscapeXML(events['startdate']));
    str = str.replace('{enddate}', nlapiEscapeXML(events['enddate']));
    str = str.replace(/{starttime}/g, nlapiEscapeXML(events['starttime']));
    str = str.replace(/{starttime24H}/g, nlapiEscapeXML(events['starttime24H']));
    str = str.replace(/{endtime}/g, nlapiEscapeXML(events['endtime']));
    str = str.replace(/{endtime24H}/g, nlapiEscapeXML(events['endtime24H'])); 
    
    for(var h = 0; h < addColumnsFromContext.length; h++) {
        var searchField = addColumnsFromContext[h].search;
        if (searchField) {
            var name = addColumnsFromContext[h].name;
            var nameEvent = name.replace(/[}{]/g, '');
            if (nameEvent != 'address') {
                str = str.replace(name, nlapiEscapeXML(events[nameEvent]));
            } else {
                str = str.replace(name, nlapiEscapeXML(events[nameEvent]).replace(new RegExp(String.fromCharCode(10), 'g'), '<br />'));
            }
        }
    }
    
    for(var i in tooltipObject){     
        var regularExpresion = new RegExp('{'+i+'}','g');
        str = str.replace(regularExpresion,nlapiEscapeXML(events[i]));
    }

    str = str.replace(/&apos;/g, ' ');
    var acceptedChars = /[^a-zA-Z0-9 :;_,#<>=\"\/\-]/g;
    str=str.replace(acceptedChars, ' ');
    //str = str.replace(new RegExp(String.fromCharCode(10), 'g'), '');
    return str;
}

function stringToMS(myStr) {
    if (!myStr) return '';
    
    var timeofday = nlapiStringToDate(myStr,'timeofday');
    var timestartingday = new Date(timeofday.getFullYear(),timeofday.getMonth(),timeofday.getDate());

    return timeofday.getTime() - timestartingday.getTime();    
}

function pnvl(value, number) {
    if(number){
        if(isNaN(parseFloat(value))) return 0;
        return parseFloat(value);
    }
    if(value == null) return '';
    return value;
}

function replaceContentEmployee(str, events) {   
    str = str.replace(/&lt;/g, '<');
    str = str.replace(/&gt;/g, '>');

    for(var i in tooltipObjectEmployee)
    {     
        var regularExpresion = new RegExp('{'+i+'}','g');
        str = str.replace(regularExpresion,nlapiEscapeXML(pnvl(events[i])));
    }

    str = str.replace(/&apos;/g, ' ');
    var acceptedChars = /[^a-zA-Z0-9 :;_,#@.()<>=\"\/\-]/g;
    str=str.replace(acceptedChars, ' ');
    //str = str.replace(new RegExp(String.fromCharCode(10), 'g'), '');
    return str;
}

function transformTimeAMPMto24H(timeAMPM) {
    var valueTime = '';
    if (timeAMPM){
        var timeAMPMarray = timeAMPM.split(' ');
        
        var timeArray = timeAMPMarray[0].split(':');
        
        var timeHour = parseInt(timeArray[0]);
        var timeMinute = timeArray[1];
        
        var ampm = timeAMPMarray[1];
        
        if (ampm == 'am'){
            if (timeHour == 12){
                timeHour = 0;
            }
        }
        else if (ampm == 'pm'){
            if (timeHour < 12){
                timeHour += 12;
            }
        }

        if (timeHour < 10){
            timeHour = '0' + timeHour;
        }

        valueTime = '' + timeHour + ':' + timeMinute; 
    }
    return valueTime;
}

function calcDifferenceTwoDays(date1Str, date2Str){
    var date1 = new Date(date1Str); 
    var date2 = new Date(date2Str); 
    var Difference_In_Time = date2.getTime() - date1.getTime(); 
    var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
    return Difference_In_Days;
}

function resetSlotsVaraibles(ecal_time_slots){
    millisecondsInSlot = minutesInInternalSlot * secondsInMinute * millisecondsInSecond;

    if (ecal_time_slots == 3){// 15 Minutes
        minutesCalendarSlot = 15;
        quantitySpans = minutesCalendarSlot / minutesInInternalSlot;
        countCheckbox = 2;
        slotDurationInHours = minutesCalendarSlot/60;
    }
    else if (ecal_time_slots == 2){// Slots by half hours
        minutesCalendarSlot = 30;
        quantitySpans = minutesCalendarSlot / minutesInInternalSlot;
        countCheckbox = 2;
        slotDurationInHours = minutesCalendarSlot/60;   
    }
    else if(ecal_time_slots == 1){// Slots by hours
        minutesCalendarSlot = 60;
        quantitySpans = minutesCalendarSlot / minutesInInternalSlot;
        countCheckbox = 1;
        slotDurationInHours = minutesCalendarSlot/60;
    }
}

function changeTimeFormat(change_time, tf){
    switch(tf) {
        case 'h:mm a':
            change_time = change_time.replace('-', ':').toLowerCase();
            var arr_time = change_time.split(' ');
            if (arr_time[1]!='am' && arr_time[1]!='pm') {
                change_time = arr_time[0];
                var arr_time_again = change_time.split(':');
                var h_num = parseInt(arr_time_again[0]);
                var a_str = 'am';
                if (h_num > 12) {
                    h_num = h_num-12;
                    a_str = 'pm';
                } else if (h_num == 12){
                    a_str = 'pm';
                } else if (h_num == 0){
                    h_num = h_num+12;
                }
                change_time = (h_num).toString()+':'+arr_time_again[1]+' '+a_str;
            } else {
                change_time = arr_time[0]+' '+arr_time[1];
            }
            break;
        case 'H:mm':
            change_time = change_time.replace('-', ':').toLowerCase();
            var arr_time = change_time.split(' ');
            var arr_time_again = arr_time[0].split(':');
            var h_num = parseInt(arr_time_again[0]);
            if (arr_time[1] == 'pm' && h_num < 12) {
                change_time = (h_num+12).toString()+':'+arr_time_again[1];                        
            } else if(arr_time[1] == 'am' && h_num == 12) {
                change_time = (h_num-12).toString()+':'+arr_time_again[1];                        
            } else {
                change_time = arr_time[0];
            }
            break;
        case 'h-mm a':
            change_time = change_time.replace(':', '-').toLowerCase();
            var arr_time = change_time.split(' ');
            if (arr_time[1]!='am' && arr_time[1]!='pm') {
                change_time = arr_time[0];
                var arr_time_again = change_time.split('-');
                var h_num = parseInt(arr_time_again[0]);
                var a_str = 'am';
                if (h_num>12) {
                    h_num = h_num-12;
                    a_str = 'pm';
                } else if (h_num == 12){
                    a_str = 'pm';
                } else if (h_num == 0){
                    h_num = h_num+12;
                }
                change_time = (h_num).toString()+'-'+arr_time_again[1]+' '+a_str;
            } else {
                change_time = arr_time[0]+' '+arr_time[1];
            }
            break;
        case 'H-mm':
            change_time = change_time.replace(':', '-').toLowerCase();
            var arr_time = change_time.split(' ');
            var arr_time_again = arr_time[0].split('-');
            var h_num = parseInt(arr_time_again[0]);
            if (arr_time[1] == 'pm' && h_num < 12) {
                change_time = (h_num+12).toString()+'-'+arr_time_again[1];                        
            } else if(arr_time[1] == 'am' && h_num == 12) {
                change_time = (h_num-12).toString()+'-'+arr_time_again[1];                        
            } else {
                change_time = arr_time[0];
            }
            break;
        default:
    }
    return change_time;
}

function getHourNumber(time){
    change_time = time.replace('-', ':').toLowerCase();
    var arr_time = change_time.split(' ');
    var arr_time_again = arr_time[0].split(':');
    var h_num = parseInt(arr_time_again[0]);
    if (arr_time[1] == 'pm' && h_num<12) {
        h_num = h_num+12;
    } else if (arr_time[1] == 'am' && h_num==12) {
        h_num = h_num-12;                        
    }
    return h_num;
}

//JSHINT
/*exported ,,,,,,, */
/*
global runSMScripts,isCapacityPlanningEnabled,alert,confirm,EpiphanyDynamicMapping_LoadFieldsToCopy,EpiphanyDynamicMapping_FromRecordToRecord_Param,
EpiphanyDynamicMapping_fieldsForToRecord,EpiphanyDynamicMapping_FromRecordToRecord_Form,EpiphanyDynamicMapping_FromRecordToRecordCurrentItem,escape,EpiphanyDynamicMapping_fieldsToCopy,
nlapiAddDays,nlapiAddMonths,nlapiAttachRecord,nlapiCancelLineItem,nlapiCommitLineItem,nlapiCopyRecord,nlapiCreateAssistant,
nlapiCreateCSVImport,nlapiCreateCurrentLineItemSubrecord,nlapiCreateSearch,nlapiCreateSubrecord,nlapiCreateError,nlapiCreateFile,nlapiCreateForm,
nlapiCreateList,nlapiCreateRecord,nlapiCreateReportDefinition,nlapiCreateReportForm,nlapiCreateTemplateRenderer,nlapiDateToString,nlapiDeleteFile,
nlapiDeleteRecord,nlapiDetachRecord,nlapiDisableField,nlapiDisableLineItemField,nlapiEditCurrentLineItemSubrecord,nlapiEditSubrecord,nlapiEncrypt,
nlapiEscapeXML,nlapiExchangeRate,nlapiFindLineItemMatrixValue,nlapiFindLineItemValue,nlapiFormatCurrency,nlapiGetContext,nlapiGetCurrentLineItemDateTimeValue,
nlapiGetCurrentLineItemIndex,nlapiGetCurrentLineItemMatrixValue,nlapiGetCurrentLineItemText,nlapiGetCurrentLineItemValue,nlapiGetCurrentLineItemValues,
nlapiGetDateTimeValue,nlapiGetDepartment,nlapiGetJobManager,nlapiGetField,nlapiGetFieldText,nlapiGetFieldTexts,nlapiGetFieldValue,nlapiGetFieldValues,
nlapiGetLineItemCount,nlapiGetLineItemDateTimeValue,nlapiGetLineItemField,nlapiGetLineItemMatrixField,nlapiGetLineItemMatrixValue,nlapiGetLineItemText,
nlapiGetLineItemValue,nlapiGetLineItemValues,nlapiGetLocation,nlapiGetLogin,nlapiGetMatrixCount,nlapiGetMatrixField,nlapiGetMatrixValue,nlapiGetNewRecord,
nlapiGetOldRecord,nlapiGetRecordId,nlapiGetRecordType,nlapiGetRole,nlapiGetSubsidiary,nlapiGetUser,nlapiInitiateWorkflow,nlapiInsertLineItem,
nlapiInsertLineItemOption,nlapiInsertSelectOption,nlapiIsLineItemChanged,nlapiLoadFile,nlapiLoadRecord,nlapiLoadSearch,nlapiLogExecution,nlapiLookupField,
nlapiMergeRecord,nlapiMergeTemplate,nlapiOutboundSSO,nlapiPrintRecord,nlapiRefreshLineItems,nlapiRefreshPortlet,nlapiRemoveCurrentLineItemSubrecord,
nlapiRemoveLineItem,nlapiRemoveLineItemOption,nlapiRemoveSelectOption,nlapiRemoveSubrecord,nlapiRequestURL,nlapiRequestURLWithCredentials,nlapiResizePortlet,
nlapiResolveURL,nlapiScheduleScript,nlapiSearchDuplicate,nlapiSearchGlobal,nlapiSearchRecord,nlapiSelectLineItem,nlapiSelectNewLineItem,nlapiSelectNode,
nlapiSelectNodes,nlapiSelectValue,nlapiSelectValues,nlapiSendCampaignEmail,nlapiSendEmail,nlapiSendFax,nlapiSetCurrentLineItemDateTimeValue,
nlapiSetCurrentLineItemMatrixValue,nlapiSetCurrentLineItemText,nlapiSetCurrentLineItemValue,nlapiSetCurrentLineItemValues,nlapiSetDateTimeValue,
nlapiSetFieldText,nlapiSetFieldTexts ,nlapiSetFieldValue,nlapiSetFieldValues ,nlapiSetLineItemDateTimeValue,nlapiSetLineItemValue,nlapiSetMatrixValue,
nlapiSetRecoveryPoint,nlapiSetRedirectURL,nlapiStringToDate,nlapiStringToXML,nlapiSubmitCSVImport,nlapiSubmitField,nlapiSubmitFile,nlapiSubmitRecord,
nlapiTransformRecord,nlapiTriggerWorkflow,nlapiViewCurrentLineItemSubrecord,nlapiViewLineItemSubrecord,nlapiViewSubrecord,nlapiXMLToPDF,nlapiXMLToString,
nlapiYieldScript,nlobjAssistant,nlobjAssistantStep,nlobjButton,nlobjColumn,nlobjConfiguration,nlobjContext,nlobjCredentialBuilder,
nlobjCSVImport,nlobjError,nlobjField,nlobjFieldGroup,nlobjFile,nlobjForm,nlobjList,nlobjLogin,nlobjPivotColumn,nlobjPivotRow,
nlobjPivotTable,nlobjPivotTableHandle,nlobjPortlet,nlobjRecord,nlobjReportColumn,nlobjReportColumnHierarchy,nlobjReportDefinition,nlapiSubmitConfiguration,
nlobjReportForm,nlobjReportRowHierarchy,nlobjResponse,nlobjRequest,nlobjSearch,nlobjSearchColumn,nlobjSearchFilter,nlobjSearchResult,nlapiLoadConfiguration,
nlobjSelectOption,nlobjSubList,nlobjSubrecord,nlobjTab,nlobjTemplateRenderer, EPIPGetShowButton, EP_getCurrentForm_BL, EPIPAddButtonLines, EPIPAddButton,
runEpiphanySMScripts,EP_sm_setRecordNameSite,getSMSubsidiaryRecordsArr,getNSSubsidiaryRecordsArr,createSMSubsidiary,getSMSubNonOW,getAllSubsidiaries,
isempty,throwErrorEpip,inactivateDeleteSMSubs,inactivateSMSubs,getSMSubOW,updateSMSubs,runSMScripts,_
*/