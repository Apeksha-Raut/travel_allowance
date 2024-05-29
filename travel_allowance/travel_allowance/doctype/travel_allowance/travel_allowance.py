# Copyright (c) 2023, Apeksha and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime


class TravelAllowance(Document):
	pass


              
def before_save(self):
    # Helper function to handle None values by replacing them with 0
    def handle_none(value):
        return value if value is not None else 0

    # Calculate total_amount with or without other_expenses_amount
    self.total_amount = (
        handle_none(self.daily_allowance)
        + handle_none(self.fare_amount) if self.fare_amount else 0
        + handle_none(self.other_expenses) if self.other_expenses else 0
        + handle_none(self.halting_amount) if self.halting_amount else 0
        + handle_none(self.lodging_amount) if self.lodging_amount else 0
    )



@frappe.whitelist()
def findAllowance(city_class, category, halt_lodge):
    result = frappe.db.sql(
        f"""SELECT {city_class}_class_city FROM `tabAllowance Parameters`
        WHERE level = '{category}'
        AND parent = '{halt_lodge}';""",
        as_dict=True
    )

    if result:
        return result
    else:
         frappe.msgprint("Cannot Find Details from Server !!")


@frappe.whitelist(allow_guest=True)
def get_server_datetime():
    return frappe.utils.now_datetime()


@frappe.whitelist()
def get_ta_total_amount(self):
    result = frappe.db.sql(
        f"""SELECT
                MIN(CAST(date_and_time_start AS DATE)) as StartDate,
                MONTH(MIN(CAST(date_and_time_start AS DATE))) as Month,
                DATE_FORMAT(MIN(CAST(date_and_time_start AS DATE)), '%b') as MonthName,
                DATE_FORMAT(MAKEDATE(EXTRACT(YEAR FROM MIN(CAST(date_and_time_start AS DATE))), 1), '%d') as FirstDayOfMonth,
                DATE_FORMAT(LAST_DAY(MIN(CAST(date_and_time_start AS DATE))), '%d') AS LastDayOfMonth,
                sum(daily_allowance) as total_daily_allowance,
                sum(halting_amount) as total_halting_amount,
                sum(lodging_amount) as total_lodging_amount,
                sum(local_conveyance_other_expenses_amount) as total_local_conveyance_other_expenses,
                sum(fare_amount) as total_fare_amount,
                sum(total) as total_amount
            FROM `tabTA Chart`
            WHERE parent = '{self}';""",
        as_dict=True
    )

    if result:
        return result[0]
    else:
        frappe.msgprint("Error fetching total amounts")
        return {}



# #Original code 
# @frappe.whitelist()
# def get_child_table_data(parent_docname):
#     # to fetch data from the child table
#     data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','halting_amount','lodging_amount','daily_allowance','fare_amount','local_conveyance_other_expenses_amount','total'], order_by='idx DESC')

#     # Format the date in the data before passing it to the template
#     for row in data:
#         if 'date_and_time_start' in row:
#             row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
#         if 'date_and_time_end' in row:
#             row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")


#     return render_child_table_template(data)



# @frappe.whitelist()
# def get_child_table_data(parent_docname):
#     # Fetch data from the child table including the 'other_location' field
#     data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','halting_amount','lodging_amount','daily_allowance','fare_amount','local_conveyance_other_expenses_amount','total', 'other_location'], order_by='idx DESC')

#     # Format the date in the data before passing it to the template
#     for row in data:
#         if 'date_and_time_start' in row:
#             row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
#         if 'date_and_time_end' in row:
#             row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")
#         if 'to_location' in row and row['to_location'] == 'Other':
#             # Fetch value of 'Other' field if 'to_location' is 'Other'
#             other_location = row.get('other_location')  # Access 'other_location' directly from the row
#             if other_location:
#                 row['to_location'] = other_location

#     return render_child_table_template(data)



@frappe.whitelist()
def get_child_table_data(parent_docname, month=None, year=None):
    # Build filters based on provided month and year
    filters = {'parent': parent_docname}
    if month:
        filters['month'] = month
    if year:
        filters['year'] = year

    # Fetch data from the TA Chart doctype
    data = frappe.get_all('TA Chart', 
                          filters=filters, 
                          fields=[
                              'name',
                              'local_conveyance',
                              'date_and_time_start',
                              'from_location',
                              'date_and_time_end',
                              'to_location',
                              'purpose',
                              'total_visit_hour',
                              'city_class',
                              'mode_of_transport',
                              'kilometer_of_travelling',
                              'fare_amount',
                              'da_claimed',
                              'daily_allowance',
                              'halting_amount',
                              'lodging_amount',
                              'local_conveyance_other_expenses_amount',
                              'total',
                              'month',
                              'year',
                              'uploaded_ticket_image',
                              'uploaded_lodging_bill_image',
                              'day_stay_lodge'
                          ],
                          order_by='modified DESC')
    
    # # Format the date in the data before returning
    # for row in data:
    #     if 'date_and_time_start' in row:
    #         row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
    #     if 'date_and_time_end' in row:
    #         row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")

    # Convert datetime objects to strings
    for row in data:
        row['date_and_time_start'] = row['date_and_time_start'].strftime("%Y-%m-%d %H:%M:%S")
        row['date_and_time_end'] = row['date_and_time_end'].strftime("%Y-%m-%d %H:%M:%S")
        
    return render_child_table_template(data)


def render_child_table_template(data):
    # Load the Jinja template
    template = frappe.get_template("templates/ta_child_table_template.html")

    # Render the template with the provided data
    rendered_html = template.render({"data": data})

    return rendered_html
    
    
@frappe.whitelist()
def delete_ta_record(record_name):
    try:
        # Check if the record exists
        if frappe.db.exists("TA Chart", record_name):
            # Delete the record
            frappe.delete_doc("TA Chart", record_name)
            frappe.db.commit()
            return "success"
        else:
            return "error: Record does not exist"
    except Exception as e:
        # Handle any errors that occur during deletion
        frappe.log_error(frappe.get_traceback(), "Delete Error")
        return f"error: {str(e)}"
    

@frappe.whitelist()
def get_local_amount(parent_docname):
    # Fetch data from the child table including the 'other_location' field
    data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','halting_amount','lodging_amount','daily_allowance','fare_amount','local_conveyance_other_expenses_amount','total', 'other_location'], order_by='idx DESC')
    
    return data