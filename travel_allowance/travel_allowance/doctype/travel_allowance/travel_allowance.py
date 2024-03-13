# Copyright (c) 2023, Apeksha and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime


class TravelAllowance(Document):
	pass

# def before_save(self):
#     if(self.other_expenses_amount):
#        self.total_amount=self.daily_allowance + self.halting_lodging_amount + self.other_expenses_amount
#     else:
#         self.total_amount=self.daily_allowance + self.halting_lodging_amount
              

def before_save(self):
    # Helper function to handle None values by replacing them with 0
    def handle_none(value):
        return value if value is not None else 0

    # Calculate total_amount with or without other_expenses_amount
    self.total_amount = (
        handle_none(self.daily_allowance)
        + handle_none(self.halting_lodging_amount)
        + handle_none(self.fare_amount) if self.fare_amount else 0
        + handle_none(self.other_expenses_amount) if self.other_expenses_amount else 0
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
                sum(haltinglodging_amount) as total_haltinglodging_amount,
                sum(local_conveyance_other_expenses_amount) as total_local_conveyance_other_expenses,
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



#Original code 
@frappe.whitelist()
def get_child_table_data(parent_docname):
    # Your logic to fetch data from the child table
    data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','haltinglodging','daily_allowance','haltinglodging_amount','fare_amount','local_conveyance_other_expenses_amount','total'], order_by='idx DESC')

    # Format the date in the data before passing it to the template
    for row in data:
        if 'date_and_time_start' in row:
            row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
        if 'date_and_time_end' in row:
            row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")


    # # Sort the data based on formatted_date_start in descending order
    # sorted_data = sorted(data, key=lambda x: datetime.strptime(x['formatted_date_start'], "%d-%m-%Y"), reverse=True)

    # return render_child_table_template(sorted_data)
            
    # Reverse the data list to have the most recently added row at the top
    # sorted_data = reversed(data)

    return render_child_table_template(data)


def render_child_table_template(data):
    # Load the Jinja template
    template = frappe.get_template("templates/ta_child_table_template.html")

    # Render the template with the provided data
    rendered_html = template.render({"data": data})

    return rendered_html
    

#New code added here


# @frappe.whitelist()
# def get_child_table_data(parent_docname):
#     # Fetching data for the first set of rows
#     initial_data = frappe.get_all('TA Chart', filters={'parent': parent_docname}, fields=['date_and_time_start','from_location', 'date_and_time_end','to_location','da_claimed','haltinglodging','daily_allowance','haltinglodging_amount','local_conveyance_other_expenses_amount','total'], order_by='idx DESC', limit=5)

#     # Format the date in the initial data before passing it to the template
#     for row in initial_data:
#         if 'date_and_time_start' in row:
#             row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
#         if 'date_and_time_end' in row:
#             row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")

#     # Render the initial data using the template
#     initial_html = render_child_table_template(initial_data)

#     return initial_html

# #new Code added here
# @frappe.whitelist()
# def get_additional_child_table_data(parent_docname, current_row_count):
#     # Fetching additional rows based on the current_row_count
#     additional_data = frappe.get_all(
#         'TA Chart',
#         filters={'parent': parent_docname},
#         fields=['date_and_time_start', 'from_location', 'date_and_time_end', 'to_location', 'da_claimed', 'haltinglodging', 'daily_allowance', 'haltinglodging_amount', 'local_conveyance_other_expenses_amount', 'total'],
#         order_by='idx DESC',
#         start=current_row_count,
#         limit=5
#     )

#     # Format the date in the additional data before passing it to the template
#     for row in additional_data:
#         if 'date_and_time_start' in row:
#             row['formatted_date_start'] = row['date_and_time_start'].strftime("%d-%m-%Y")
#         if 'date_and_time_end' in row:
#             row['formatted_date_end'] = row['date_and_time_end'].strftime("%d-%m-%Y")

#     # Render the additional data using the template
#     additional_html = render_child_table_template(additional_data)

#     return additional_html


# def render_child_table_template(data):
#     # Load the Jinja template
#     template = frappe.get_template("templates/ta_child_table_template.html")

#     # Render the template with the provided data
#     rendered_html = template.render({"data": data})

#     return rendered_html
