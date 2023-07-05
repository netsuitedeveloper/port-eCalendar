/**
 * Hakunamoni 2020-07-30
 * Converted to v10
 * Update SM WO Task with SM User indicated from eCalendar
 */


var ctx = nlapiGetContext();
var section = '';

function hakuna_serviceAppointment_afterSubmit(type) {
    
    if (type == 'create' || type == 'edit') {
        try {
            section = 'Retrieve SM WO Service Appointment record';
            var recId = nlapiGetRecordId();
            var appointmentRec = nlapiLoadRecord('customrecord_hakuna_work_order_user_sch', recId);
        
            var woId = appointmentRec.getFieldValue('custrecord_hakuna_wos_work_order');
            var smUserId = appointmentRec.getFieldValue('custrecord_hakuna_wos_user');
            var startDate = appointmentRec.getFieldValue('custrecord_hakuna_wos_start_date');
            var startTime = appointmentRec.getFieldValue('custrecord_hakuna_wos_start_time');
            nlapiLogExecution('debug', 'Retrieved Appointment Fields', 'woId:'+woId+', smUserId:'+smUserId+', startDate:'+startDate+' ,startTime:'+startTime);

            // Runs only if the work order is set.
            if (!woId){
                nlapiLogExecution('error', 'Stop running', 'No Work Order is set');
                return;
            }

            section = 'Search SM WO Tasks associated to the SM Work Order indicated on the eCalendar';
            var arrWoTaskIds = getWoTaskFields(woId);
           
            for (var iTask = 0; iTask < arrWoTaskIds.length; iTask++) {
                section = 'Update SM WO Tasks with SM WO Service Appointment record information';
                var wotId = arrWoTaskIds[iTask].wotId;
                var wotUser = arrWoTaskIds[iTask].wotUser;
                var wotStartDate = arrWoTaskIds[iTask].wotStartDate;
                startDate = (wotStartDate == '') ? startDate : wotStartDate;
                if (wotUser == ''){
                    nlapiSubmitField(
                        'customrecord_hakuna_wo_tasks', wotId, 
                        ['custrecord_hakuna_wot_user', 
                        'custrecord_hakuna_wot_startdate', 
                        'custrecord_hakuna_wot_service_date', 
                        'custrecord_hakuna_wot_starttime'], 
                        [smUserId, startDate, startDate, startTime]
                    );
                } else {
                    nlapiLogExecution('debug', 'Cancelled to update WO Task record', 'WO Task SM User is already set');
                }
            }
           
           
            return true;

        } catch (ex) {
            var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
            nlapiLogExecution('error', 'Section: ' + section, errorStr);
        }
    }
}

function getWoTaskFields(woId){
    section = 'Retrieve WO Tasks Information';
    var arrWotFields = [];
    try {
        var results = nlapiSearchRecord( 
            'customrecord_hakuna_wo_tasks', null, 
            [new nlobjSearchFilter('custrecord_hakuna_wot_work_order', null, 'anyof', woId)], 
            [new nlobjSearchColumn('custrecord_hakuna_wot_user'),
            new nlobjSearchColumn('custrecord_hakuna_wot_startdate')]
        );
        if (results && results.length > 0) {
            for (var i = 0; i < results.length; i++) {
                var wotUser = (results[i].getValue('custrecord_hakuna_wot_user')) ? results[i].getValue('custrecord_hakuna_wot_user') : '';
                var wotStartDate = (results[i].getValue('custrecord_hakuna_wot_startdate')) ? results[i].getValue('custrecord_hakuna_wot_startdate') : '';
                nlapiLogExecution('debug', 'WO Parts Fields', 'wo task User = ' + wotUser + ', wo task StartDate = ' + wotStartDate);

                var wotFields = {
                    'wotId' : results[i].getId(),
                    'wotUser' : wotUser,
                    'wotStartDate' : wotStartDate
                }
                arrWotFields.push(wotFields);
            }
            nlapiLogExecution('debug', 'Retrieved WO Tasks Information', JSON.stringify(arrWotFields));
        }
        return arrWotFields;
    } catch (ex) {
        var errorStr = (ex.getCode != null) ? ex.getCode() + '<br>' + ex.getDetails() + '<br>' + ex.getStackTrace().join('<br>') : ex.toString();
        nlapiLogExecution('error', 'Section: ' + section, errorStr);
    }
}