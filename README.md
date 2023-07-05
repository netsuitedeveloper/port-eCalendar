# eCalendar

The eCalendar allows managers to easily assign Work Orders and to view the work day, week, and/or month.


![demo](/images/port_ecal_cal.jpg)

## Requirement

Built eCalendar custom form using SuiteScript 1.0 (Suitelet and Client Script) and custom HTML/CSS.

   ```bash
    1. Based in each employee, review their work schedule and highlight the times they are not working.
    2. Search out all SM Work Orders and based on the Start Date of the Service Appointment Records, 
    indicate the WO value from the Service Appointment on the Calendar.
        Display as the WO ID and the Customer Name.
    3. From an internal Customer, indicate the Service Appointments that show when the employee is 
    busy or not available.
    4. When hovering over a Work Order, show details of the WO as indicated.
    5. Pressing the + button allow you to create a WO Service Appointment for a WO, or for the 
    employee to performing another task making them unavailable.
    6. Employee Filter, allow to see only those Service Appointments assigned to that employee during 
    the display dates, as well as unassigned Service Appointments which then could be assigned to the 
    employee.
    7. Calendar view show the calendar with employees and currently scheduled WOs.
        Above the calendar is a section with WOs and a section with technician info.
        ALL columns are filterable and they allow multi select function.
            a. Work Order Columns
                i. Select (Checkbox)
                ii. WO#
                iii. Status
                iv. Scheduling Status
                v. Customer
                vi. Expected Duration
                vii. Location / Site viii. Start Date
                ix. End Date
                x. Assigned to (allow none as a filter)
                xi. Skills Needed
            b. Technician Columns
                i. Name
                ii. Zone
                iii. Skills
                iv. User Group
            c. Once a single WO is selected and a time frame is selected on the calendar then user 
            click submit and a Service WO appointment is created.
   ```

## Filter Options

![filters](/images/port_ecal_filters.jpg)