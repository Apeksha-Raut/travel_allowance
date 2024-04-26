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
        + handle_none(self.other_expenses_amount) if self.other_expenses_amount else 0
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


@frappe.whitelist()
def get_child_table_data(parent_docname):
    # Fetch data from the child table including the 'other_location' field
    data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','halting_amount','lodging_amount','daily_allowance','fare_amount','local_conveyance_other_expenses_amount','total', 'other_location'], order_by='idx DESC')

    # Format the date in the data before passing it to the template
    for row in data:
        if 'date_and_time_start' in row:
            row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
        if 'date_and_time_end' in row:
            row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")
        if 'to_location' in row and row['to_location'] == 'Other':
            # Fetch value of 'Other' field if 'to_location' is 'Other'
            other_location = row.get('other_location')  # Access 'other_location' directly from the row
            if other_location:
                row['to_location'] = other_location

    return render_child_table_template(data)


def render_child_table_template(data):
    # Load the Jinja template
    template = frappe.get_template("templates/ta_child_table_template.html")

    # Render the template with the provided data
    rendered_html = template.render({"data": data})

    return rendered_html
    

