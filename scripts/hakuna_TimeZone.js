var timezoneRecord = nlapiCreateRecord('customrecord_ecal_time_zone_name');
var TZ_olsonkey = {};
var TZ_gmtId;

TZ_loadOlsonkey();

function TZ_convertTimezoneUsingOlsonkey(date,time,fromTZid,toTZid,tf){
    try {
        
        nlapiLogExecution('debug', 'date:'+date+', time:'+time, 'fromTZid'+fromTZid+', toTZid'+toTZid+', tf'+tf)
        var datetimeToBeConverted = TZ_convertToDatetimetz(date,time,tf);
        
        var from_olsonkey = TZ_olsonkey[fromTZid];
        var to_olsonkey = TZ_olsonkey[toTZid];
        
        timezoneRecord.setDateTimeValue('custrecord_ecal_time_zone_datetimehelp', datetimeToBeConverted,from_olsonkey);
        var newDatetime = timezoneRecord.getDateTimeValue('custrecord_ecal_time_zone_datetimehelp',to_olsonkey);
        var datetime = nlapiStringToDate(newDatetime,'datetimetz');
        var newDate = nlapiDateToString(datetime,'date');
        var newTime = nlapiDateToString(datetime,'timeofday');
        nlapiLogExecution('debug', 'datetimeToBeConverted:'+datetimeToBeConverted, 'newTime'+newTime);

        return {datetime:newDatetime,date:newDate,time:newTime};             
    }
    catch (err){
        nlapiLogExecution('ERROR','ERROR - TZ_convertTimezoneUsingOlsonkey: ',err.message);
    }
}

function TZ_convertToDatetimetz(date,time,tf){
    var newtime = (time)?time:"00:00 am";
    var context = nlapiGetContext();
    var timeformat = context.getPreference('TIMEFORMAT');
    var datetime = date + ' ' + TZ_changeTimeFormat(newtime, timeformat);    
    return datetime;
}

function TZ_loadOlsonkey(){
    
    var columns = [
            new nlobjSearchColumn('custrecord_ecal_time_zone_olsonkey'),
            new nlobjSearchColumn('custrecord_ecal_time_zone_olsonvalue')            
        ];
    
    var result = nlapiSearchRecord('customrecord_ecal_time_zone_name',null,null,columns)
    
    for(var i = 0; i < result.length; i++){
        var internalid = result[i].getId();
        var olsonkey = result[i].getValue('custrecord_ecal_time_zone_olsonkey');
        var olsonvalue = result[i].getValue('custrecord_ecal_time_zone_olsonvalue');
        
        TZ_olsonkey[internalid] = olsonkey;
        
        if(olsonvalue == 'GMT'){
            TZ_gmtId = internalid;
        }
    }
    
}

//////////////////// LIBRARY FUNCTIONS ///////////////////////
//Function to convert a NetSuite time string to milliseconds. expects HH:MM, HH:MM XM, HH-MM, HH-MM XM
function TZ_stringToMS(myStr){
    if (!myStr) return 0;
    
    var timeofday = nlapiStringToDate(myStr,'timeofday');
    var timestartingday = new Date(timeofday.getFullYear(),timeofday.getMonth(),timeofday.getDate());

    return timeofday.getTime() - timestartingday.getTime();    
}

function TZ_stringToHoursMinutes(myStr){
    if (!myStr) return {hours:0,minutes:0};
    
    var timeofday = nlapiStringToDate(myStr,'timeofday');

    return {hours:timeofday.getHours(),minutes:timeofday.getMinutes()};   
}

function TZ_pnvl(value, number)
{
    if(number)
    {
	if(isNaN(parseFloat(value))) return 0;
	return parseFloat(value);
    }
    if(value == null) return '';
    return value;
}

function TZ_changeTimeFormat(change_time, timeformat){
    switch(timeformat) {
        case 'h:mm a':
            change_time = change_time.replace('-', ':').toLowerCase();
            var arr_time = change_time.split(' ');
            if (arr_time[1]!='am' && arr_time[1]!='pm') {
                change_time = arr_time[0];
                var arr_time_again = change_time.split(':');
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
                change_time = (h_num).toString()+':'+arr_time_again[1]+':00 '+a_str;
            } else {
                change_time = arr_time[0]+':00 '+arr_time[1];
            }
            break;
        case 'H:mm':
            change_time = change_time.replace('-', ':').toLowerCase();
            var arr_time = change_time.split(' ');
            var arr_time_again = arr_time[0].split(':');
            var h_num = parseInt(arr_time_again[0]);
            if (arr_time[1] == 'pm' && h_num < 12) {
                change_time = (h_num+12).toString()+':'+arr_time_again[1]+':00';
            } else if(arr_time[1] == 'am' && h_num == 12) {
                change_time = (h_num-12).toString()+':'+arr_time_again[1]+':00';
            } else {
                change_time = arr_time[0]+':00';
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
                change_time = (h_num).toString()+'-'+arr_time_again[1]+'-00 '+a_str;
            } else {
                change_time = arr_time[0]+'-00 '+arr_time[1];
            }
            break;
        case 'H-mm':
            change_time = change_time.replace(':', '-').toLowerCase();
            var arr_time = change_time.split(' ');
            var arr_time_again = arr_time[0].split('-');
            var h_num = parseInt(arr_time_again[0]);
            if (arr_time[1] == 'pm' && h_num < 12) {
                change_time = (h_num+12).toString()+'-'+arr_time_again[1]+'-00';
            } else if(arr_time[1] == 'am' && h_num == 12) {
                change_time = (h_num-12).toString()+'-'+arr_time_again[1]+'-00';
            } else {
                change_time = arr_time[0]+'-00';
            }
            break;
        default:
    }
    return change_time;
}