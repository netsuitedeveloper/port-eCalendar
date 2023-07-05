var context = '';

function pageInit_eCalendar(type) {
    context = nlapiGetContext();
}

function fieldChanged_eCalendar(type,name) {
    if (name == 'custpage_pref_viewtype') {
        var pref_viewtype = nlapiGetFieldValue(name);
        var displayValue = '';
        if (pref_viewtype == 2) {
            displayValue = 'block';
        }
        else if (pref_viewtype == 1 || pref_viewtype == 3) {
            displayValue = 'none';
        }
        document.getElementById('btn_previousweek').style.display  = displayValue;
        document.getElementById('btn_nextweek').style.display  = displayValue;
    }
    if (name == 'custpage_pref_startdate' || name == 'custpage_pref_enddate') {
        var startDate = nlapiGetFieldValue('custpage_pref_startdate');
        var endDate = nlapiGetFieldValue('custpage_pref_enddate');
        if (startDate && endDate) {
            var dStart = nlapiStringToDate(startDate);
            var dEnd = nlapiStringToDate(endDate);
            if (dEnd < dStart) {
                alert('The Start Date can not be later than the End Date.');
                nlapiSetFieldValue('custpage_pref_enddate', '');
            }
        }
    }
    if (name == 'custpage_wo_starttime' || name == 'custpage_wo_duration' || name == 'custpage_wo_startdate' || name == 'custpage_wo_enddate'){
        updateTableWO();
    }
}

function updateTableWO() {
    var arrWoNameId = [], arrWoWorkstatusId = [], arrWoDispatchstatusId = [], arrWoCustomerId = [], arrWoLocationId = [], arrWoAssignedtoId = [], arrWoSkillsneededId = [], filterDuration, filterStarttime, filterStartdate, filterEnddate;

    var custpage_wo_name = document.getElementById('custpage_wo_workorder') || '';	
    for (var i = 0; i < custpage_wo_name.options.length; i++){	
        if (custpage_wo_name.options[i].selected) {	
            arrWoNameId.push(custpage_wo_name.options[i].value);
        }
    }

    var custpage_wo_sta = document.getElementById('custpage_wo_status') || '';	
    for (var i = 0; i < custpage_wo_sta.options.length; i++){	
        if (custpage_wo_sta.options[i].selected) {	
            arrWoWorkstatusId.push(custpage_wo_sta.options[i].value);
        }
    }

    var custpage_wo_dis = document.getElementById('custpage_wo_dispstatus') || '';	
    for (var i = 0; i < custpage_wo_dis.options.length; i++){	
        if (custpage_wo_dis.options[i].selected) {	
            arrWoDispatchstatusId.push(custpage_wo_dis.options[i].value);
        }
    }

    var custpage_wo_cus = document.getElementById('custpage_wo_customer') || '';	
    for (var i = 0; i < custpage_wo_cus.options.length; i++){	
        if (custpage_wo_cus.options[i].selected) {	
            arrWoCustomerId.push(custpage_wo_cus.options[i].value);
        }
    }

    var custpage_wo_sit = document.getElementById('custpage_wo_site') || '';	
    for (var i = 0; i < custpage_wo_sit.options.length; i++){	
        if (custpage_wo_sit.options[i].selected) {	
            arrWoLocationId.push(custpage_wo_sit.options[i].value);
        }
    }

    var custpage_wo_assig = document.getElementById('custpage_wo_assigned') || '';	
    for (var i = 0; i < custpage_wo_assig.options.length; i++){	
        if (custpage_wo_assig.options[i].selected) {	
            arrWoAssignedtoId.push(custpage_wo_assig.options[i].value);
        }
    }

    var custpage_wo_ski = document.getElementById('custpage_wo_skills') || '';	
    for (var i = 0; i < custpage_wo_ski.options.length; i++){	
        if (custpage_wo_ski.options[i].selected) {	
            arrWoSkillsneededId.push(custpage_wo_ski.options[i].value);
        }
    }

    filterStarttime = nlapiGetFieldValue('custpage_wo_starttime') || '';
    var custpage_wo_dur = document.getElementById('custpage_wo_duration') || '';	
    filterDuration = custpage_wo_dur.value;
    var custpage_wo_stdate = document.getElementById('custpage_wo_startdate') || '';	
    filterStartdate = custpage_wo_stdate.value;
    var custpage_wo_eddate = document.getElementById('custpage_wo_enddate') || '';	
    filterEnddate = custpage_wo_eddate.value;

    var worksourceText = nlapiGetFieldValue('custpage_wo_sourcetext') || '';
    var workSourceObj = {};
    if (worksourceText) {
        workSourceObj = JSON.parse(worksourceText);
    }
    for (var woid in workSourceObj){
        var woInfo = workSourceObj[woid];
        
        var checkWoName = (arrWoNameId.indexOf(woid) == -1) ? false : true;
        var checkWoStat = (arrWoWorkstatusId.indexOf(woInfo.workstatusId) == -1) ? false : true;
        var checkWoDisp = (arrWoDispatchstatusId.indexOf(woInfo.dispatchstatusId) == -1) ? false : true;
        var checkWoCust = (arrWoCustomerId.indexOf(woInfo.customerId) == -1) ? false : true;
        var checkWoLoca = (arrWoLocationId.indexOf(woInfo.locationsiteId) == -1) ? false : true;
        var checkWoStime = (getHourNumber(filterStarttime) == getHourNumber(woInfo.expected_starttime)) ? true: false;
        var checkWoDur = (parseInt(filterDuration) == parseInt(woInfo.expected_duration)) ? true: false;
        var checkWoSdate = (filterStartdate == woInfo.expected_startdate) ? true: false;
        var checkWoEdate = (filterEnddate == woInfo.expected_enddate) ? true: false;

        var checkWoAssigned = (woInfo.assignedtoId.length > 0) ? true : false;
        for (var i=0; i<woInfo.assignedtoId.length; i++){
            if (arrWoAssignedtoId.indexOf(woInfo.assignedtoId[i]) == -1){
                checkWoAssigned = false;
                break;
            }
        }
        var checkWoSkills = (woInfo.skillsneededId.length > 0) ? true : false;
        for (var i=0; i<woInfo.skillsneededId.length; i++){
            if (arrWoSkillsneededId.indexOf(woInfo.skillsneededId[i]) == -1){
                checkWoSkills = false;
                break;
            }
        }

        // console.log(checkWoName +'<br/>'+ checkWoStat +'<br/>'+ checkWoDisp +'<br/>'+ checkWoCust +'<br/>'+ checkWoLoca +'<br/>'+ checkWoStime +'<br/>'+ checkWoDur +'<br/>'+ checkWoSdate +'<br/>'+ checkWoEdate +'<br/>'+ checkWoAssigned +'<br/>'+ checkWoSkills);

        var woRow = document.getElementById('wo'+woid);
        if (checkWoName && checkWoStat && checkWoDisp && checkWoCust && checkWoLoca && checkWoStime && checkWoDur && checkWoSdate && checkWoEdate && checkWoAssigned && checkWoSkills){
            woRow.style.display = '';
        } else {
            woRow.style.display = 'none';
        }
    }

}

function updateTableTechnician() {
    var arrTechNameId = [], arrTechZoneId = [], arrTechSkillsId = [], arrTechGroupId = [];

    var custpage_tech_name = document.getElementById('custpage_users') || '';
    for (var i = 0; i < custpage_tech_name.options.length; i++){
        if (custpage_tech_name.options[i].selected) {
            arrTechNameId.push(custpage_tech_name.options[i].value);
        }
    }

    var custpage_tech_zone = document.getElementById('custpage_tech_timezone') || '';
    for (var i = 0; i < custpage_tech_zone.options.length; i++){
        if (custpage_tech_zone.options[i].selected) {
            arrTechZoneId.push(custpage_tech_zone.options[i].value);
        }
    }

    var custpage_tech_skill = document.getElementById('custpage_skilltypes') || '';
    for (var i = 0; i < custpage_tech_skill.options.length; i++){
        if (custpage_tech_skill.options[i].selected) {
            arrTechSkillsId.push(custpage_tech_skill.options[i].value);
        }
    }

    var custpage_tech_group = document.getElementById('custpage_group') || '';
    for (var i = 0; i < custpage_tech_group.options.length; i++){
        if (custpage_tech_group.options[i].selected) {
            arrTechGroupId.push(custpage_tech_group.options[i].value);
        }
    }

    var techsourceText = nlapiGetFieldValue('custpage_tech_sourcetext') || '';
    var techSourceObj = {};
    if (techsourceText) {
        techSourceObj = JSON.parse(techsourceText);
    }
    for (var techid in techSourceObj){
        if (techid != -1){
            var techInfo = techSourceObj[techid];
            
            var checkTechName = (arrTechNameId.indexOf(techid) == -1) ? false : true;
            var checkTechZone = (arrTechZoneId.indexOf(techInfo.zoneId) == -1) ? false : true;

            var checkTechSkill = (techInfo.skillId.length > 0) ? true : false;
            for (var i=0; i<techInfo.skillId.length; i++){
                if (arrTechSkillsId.indexOf(techInfo.skillId[i]) == -1){
                    checkTechSkill = false;
                    break;
                }
            }
            var checkTechGroup = (techInfo.groupId.length > 0) ? true : false;
            for (var i=0; i<techInfo.groupId.length; i++){
                if (arrTechGroupId.indexOf(techInfo.groupId[i]) == -1){
                    checkTechGroup = false;
                    break;
                }
            }

            var techRow = document.getElementById('tech'+techid);
            if (checkTechName && checkTechZone && checkTechSkill && checkTechGroup){
                techRow.style.display = '';
            } else {
                techRow.style.display = 'none';
            }
        }
    }
}

function selectSkillTypes() {
    var custpage_skilltypes = document.getElementById('custpage_skilltypes');
    var skillTypes = [];
    for (var i = 0; i < custpage_skilltypes.options.length; i++){
        if (custpage_skilltypes.options[i].selected){
            skillTypes.push(custpage_skilltypes.options[i].value);
        }
    }
    
    var url = nlapiResolveURL('SUITELET','customscript_hakuna_searchskilltypes_sl','customdeploy_hakuna_searchskilltypes_sl');

    var newWindowParams = "width=500, height=400,resizeable = 1, scrollbars = 1," +
                          "toolbar = 0, location = 0, directories = 0, status = 0, menubar = 0, copyhistory = 0";

    var mapForm = document.createElement("form");
    mapForm.target = "MapCalendar";
    mapForm.method = "POST";
    mapForm.action = url;

    var mapInput = document.createElement("input");
    mapInput.type = "hidden";
    mapInput.name = "action";
    mapInput.value = "showForm";
    mapForm.appendChild(mapInput);

    var mapInput = document.createElement("input");
    mapInput.type = "hidden";
    mapInput.name = "skilltypes";
    mapInput.value = skillTypes;
    mapForm.appendChild(mapInput);
    
    var mapInput = document.createElement("input");
    mapInput.type = "hidden";
    mapInput.name = "fieldtype";
    mapInput.value = 'HTML';
    mapForm.appendChild(mapInput);
    
    var mapInput = document.createElement("input");
    mapInput.type = "hidden";
    mapInput.name = "fieldname";
    mapInput.value = 'custpage_skilltypes';
    mapForm.appendChild(mapInput);

    document.body.appendChild(mapForm);

    var map = window.open("", "MapCalendar", newWindowParams);

    if (map) 
    {
        window.onbeforeunload = function() { };
        mapForm.submit();
    } 
    else 
    {
        alert('You must allow popups for this map to work.');
    }

}

function selectAll(checked, selectid) {
    var selectList = document.getElementById(selectid);
    if (selectList.type == 'select-multiple') {
        for (var i = 0; i < selectList.options.length; i++) {
            selectList[i].selected = checked;
        }
    }
    if (selectid == 'custpage_wo_workorder' || selectid == 'custpage_wo_status' || selectid == 'custpage_wo_dispstatus' || selectid == 'custpage_wo_customer' || selectid == 'custpage_wo_site' || selectid == 'custpage_wo_assigned' || selectid == 'custpage_wo_skills'){
        updateTableWO();
    } else if (selectid == 'custpage_users' || selectid == 'custpage_tech_timezone' || selectid == 'custpage_skilltypes' || selectid == 'custpage_group'){
        updateTableTechnician();
    }
}

function selectTableAll(checked, tableid) {
    var selectTable = document.getElementById(tableid);
    var checkBoxes = selectTable.getElementsByTagName("INPUT");
    console.log("tableid"+checkBoxes.length);
    for (var i = 1; i < checkBoxes.length; i++) {
        console.log(checkBoxes[i].checked);
        if (checkBoxes[i].checked){
            console.log(checkBoxes[i].value);
        }
        checkBoxes[i].checked = checked;
    }
}

function submitButton(createAppointments) {
    var appointmentsParameter = '';
    
    var startdate = nlapiGetFieldValue('custpage_pref_startdate') || '';
    var endDate = nlapiGetFieldValue('custpage_pref_enddate') || '';
    var viewtype = nlapiGetFieldValue('custpage_pref_viewtype') || '';
    var timeformat = nlapiGetFieldValue('custpage_pref_timeformat') || '';
    var smsubsidiary = nlapiGetFieldValue('custpage_smsubsidiary') || '';
    var defaultduration = nlapiGetFieldValue('custpage_pref_duration') || '';
    var timezone = nlapiGetFieldValue('custpage_pref_timezone') || '';
    var pref_timeslots = nlapiGetFieldValue('custpage_pref_timeslots') || '';
    var pref_rowstart = nlapiGetFieldValue('custpage_pref_rowstart') || '';
    var pref_rowend = nlapiGetFieldValue('custpage_pref_rowend') || '';

    var userArray = [];
    var custpage_techTable = document.getElementById('custpage_table_tech');
    var custpage_techtable_inputs = custpage_techTable.getElementsByTagName("INPUT");
    for (var i = 1; i < custpage_techtable_inputs.length; i++) {
        if (custpage_techtable_inputs[i].checked){
            userArray.push(custpage_techtable_inputs[i].value);
        }
    }
   
    var skillTypesObj = {};
    var skillTypesText = nlapiGetFieldValue('custpage_skilltypestext') || '';
    if (skillTypesText) {
        skillTypesObj = JSON.parse(skillTypesText);
    }
    
    var custpage_skilltypes = document.getElementById('custpage_skilltypes');
    var skillTypesId = [];
    for (var i = 0; i < custpage_skilltypes.options.length; i++){
        if (custpage_skilltypes.options[i].selected){
            skillTypesId.push(custpage_skilltypes.options[i].value);
        }
    }
    
    if (!startdate) {
        alert('Please select Start Date.');
        return;
    }
    if (viewtype == '1') {
        if (!endDate) {
            alert('In Daily View, an End Date is required.');
            return;
        }
    }
    
    if (!smsubsidiary) {
        alert('Please select SM Subsidiary.');
        return;
    }
    
    if (!userArray.length > 0) {
        alert('Please select SM Users.');
        return;
    }
    
    if (skillTypesId.length == 0) {
        alert('There are no selected Skill Types.');
        return;
    }

    if (getHourNumber(pref_rowstart) > getHourNumber(pref_rowend)){
        alert('Please select correct End Time.');
        return;
    }

    if (createAppointments) {
        var timezone = nlapiGetFieldValue('custpage_pref_timezone');
        // var wo = nlapiGetFieldValue('custpage_wo_workorder');
        var wo = nlapiGetFieldValue('custpage_radio_woid') || '';
        var duration = nlapiGetFieldValue('custpage_pref_duration');    
        if (!wo) {
            alert('Please select Work Order.');
            return;
        }
        var wosmsite = nlapiLookupField('customrecord_ecal_event', wo, 'custrecord_ecal_event_sm_site');
        if (!wosmsite) {
            alert('SM Work Order ' + wo + ' has no SM Site. Please verify.');
            return;
        }        
        var smsitefields = nlapiLookupField('customrecord_hakuna_sites', wosmsite, ['name', 'custrecord_hakuna_site_timezone']);
        if (smsitefields.name) {
            var smsitename = smsitefields.name;
        } else {
            var smsitename = wosmsite;
        }
        var smsitetz = smsitefields.custrecord_hakuna_site_timezone;
        if (!smsitetz) {
            alert('SM Site ' + smsitename + ' has no Time Zone. Please set a Time Zone in the SM Site record.');
            return;
        }
        
        if (!duration) {
            alert('Please enter Duration.');
            return;
        }    
        var startDate = nlapiGetFieldValue('custpage_pref_startdate') || '';
        var endDate = nlapiGetFieldValue('custpage_pref_enddate') || '';    
        
        var days = 0;
        var aDays = [];
        if (startDate == '' || endDate == '') {
            alert('Please enter valid Start and End dates');
            return;
        } else {
            var dStart = nlapiStringToDate(startDate);
            var dEnd = nlapiStringToDate(endDate);
            var dCurrent = dStart;
            while (dCurrent <= dEnd) {                
                aDays.push(nlapiDateToString(dCurrent));
                days++;                
                dCurrent = nlapiAddDays(dCurrent, 1);
            }
        }
        var aSelectToCreateElements = window.frames['calendar_frame'].contentDocument.getElementsByClassName('selecttocreate');
        var aCreateAppointments = [];
        var aLength = aSelectToCreateElements.length;
        if (aLength > 0) {
            for (var b = 0; b < aLength; b++) {
                if (aSelectToCreateElements[b].checked) {
                    var id = aSelectToCreateElements[b].id;
                    id = id.slice(3);
                    var time = window.frames['calendar_frame'].contentDocument.getElementById(id + '_time').value;
                    var user = window.frames['calendar_frame'].contentDocument.getElementById(id + '_user').value;
                    aDays = confirmUserWorkingDays(user, aDays);
                    for (var d = 0; d < aDays.length; d++) {
                        var appointment = {workorder:wo, startdate:aDays[d], starttime:time, duration:duration, smuser:user, fromtz:timezone, totz:smsitetz, smskill:skillTypesId[0]};
                        aCreateAppointments.push(appointment);
                    }
                }
            }
        }
        if (aCreateAppointments.length == 0) {
            alert('Please check any users in the calendar.');
            return;
        }
        appointmentsParameter = JSON.stringify(aCreateAppointments);
        console.log(appointmentsParameter);
    }

    var calendarParameterObj = 
    {
        startdate : startdate,
        endDate : endDate,
        viewtype : viewtype,
        timeformat : timeformat,
        pref_timeslots : pref_timeslots,
        pref_rowstart: pref_rowstart,
        pref_rowend: pref_rowend,
        smsubsidiary : smsubsidiary,
        userArray : userArray,
        skillTypesObj : skillTypesObj,
        skillTypesId : skillTypesId,
        defaultduration : defaultduration,
        timezone : timezone,
        currentWOId : ''
    };
    
    var calendarParameter = JSON.stringify(calendarParameterObj);
        console.log(calendarParameter);

    var url = nlapiResolveURL('SUITELET', 'customscript_hakuna_ecalendar_sl', 'customdeploy_hakuna_ecalendar_sl');
    var frame_url = url + '&calendarparameter=' + calendarParameter + '&appointmentsparameter=' + appointmentsParameter + '&mode=showCalendar';
    frame_url+= '&rnd=' + Math.floor(Math.random()*1000000); //To ensure browser's caching doesn't cause problem                            
   
    parent.document.getElementById('calendar_frame').src = frame_url;
}

function weekButton(nextOrPrevious) {
    var pref_startdate = nlapiGetFieldValue('custpage_pref_startdate') || '';
    if (pref_startdate) {
        var dateselect = nlapiStringToDate(pref_startdate);
        var dateselect_date = dateselect.getDate();
        var dateselect_day = dateselect.getDay();
        
        var firstDayOfWeek = dateselect_day;
        var daysInWeek = 0;
        if (nextOrPrevious == 'next') {
            daysInWeek = 7;
        }
        else if (nextOrPrevious == 'previous') {
            daysInWeek = -7;
        }
        
        var fromdate = dateselect;
        var todate = dateselect;
        
        var firstDateOfWeek = dateselect_date-(dateselect_day-firstDayOfWeek);
        fromdate.setDate(firstDateOfWeek);
        todate = nlapiAddDays(fromdate, daysInWeek);
        var toDateString = nlapiDateToString(todate);
        
        nlapiSetFieldValue('custpage_pref_viewtype',2);
        nlapiSetFieldValue('custpage_pref_startdate',toDateString);
        document.getElementById('btn_submit').click();
    }
    else{
        alert('Please select Start Date');
    }
}

function confirmUserWorkingDays(userid, aDays) {
    var aUserWorkingDays = aDays;
    var aHolidays = [];
    var aWeekWorkingDays = [];
    var workingdaySearchFilters = [];
    workingdaySearchFilters.push(new nlobjSearchFilter('custrecord_sm_workingdays_user', null, 'is', userid));
    workingdaySearchFilters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    var workingdaySearchColumns = [];
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_date'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_hakuna_dt_working_day', 'custrecord_sm_workingdays_day_type'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_hakuna_dt_holiday', 'custrecord_sm_workingdays_day_type'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_sun'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_mon'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_tue'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_wed'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_thu'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_fri'));
    workingdaySearchColumns.push(new nlobjSearchColumn('custrecord_sm_workingdays_sat'));
    var workingdaySearchResults = nlapiSearchRecord('customrecord_sm_workingdays', null, workingdaySearchFilters, workingdaySearchColumns);
    if (workingdaySearchResults && workingdaySearchResults.length > 0) {
        aUserWorkingDays = [];
        for (var w = 0; w < workingdaySearchResults.length; w++) {            
            var isHoliday = workingdaySearchResults[w].getValue('custrecord_hakuna_dt_holiday', 'custrecord_sm_workingdays_day_type') || 'F';
            var isWorkingDay = workingdaySearchResults[w].getValue('custrecord_hakuna_dt_working_day', 'custrecord_sm_workingdays_day_type') || 'F';
            if (isHoliday == 'T') {
                var holidayDate = workingdaySearchResults[w].getValue('custrecord_sm_workingdays_date') || '';
                if (holidayDate) {
                    aHolidays.push(holidayDate);
                }
            } else if (isWorkingDay == 'T') {
                if (workingdaySearchResults[w].getValue('custrecord_sm_workingdays_sun') == 'T') {
                    aWeekWorkingDays.push(0)
                };
                if (workingdaySearchResults[w].getValue('custrecord_sm_workingdays_mon') == 'T') {
                    aWeekWorkingDays.push(1)
                };
                if (workingdaySearchResults[w].getValue('custrecord_sm_workingdays_tue') == 'T') {
                    aWeekWorkingDays.push(2)
                };
                if (workingdaySearchResults[w].getValue('custrecord_sm_workingdays_wed') == 'T') {
                    aWeekWorkingDays.push(3)
                };
                if (workingdaySearchResults[w].getValue('custrecord_sm_workingdays_thu') == 'T') {
                    aWeekWorkingDays.push(4)
                };
                if (workingdaySearchResults[w].getValue('custrecord_sm_workingdays_fri') == 'T') {
                    aWeekWorkingDays.push(5)
                };
                if (workingdaySearchResults[w].getValue('custrecord_sm_workingdays_sat') == 'T') {
                    aWeekWorkingDays.push(6)
                };
            }            
        }
    }
    for (var d = 0; d < aDays.length; d++) {
        if (aHolidays.indexOf(aDays[d]) != -1) {
            continue;
        }
        var dd = nlapiStringToDate(aDays[d]);
        if (aWeekWorkingDays.indexOf(dd.getDay()) != -1) {
            aUserWorkingDays.push(aDays[d]);
        }
    }
    return aUserWorkingDays;
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