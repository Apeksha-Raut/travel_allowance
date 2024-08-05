# Copyright (c) 2024, Apeksha Raut and contributors
# For license information, please see license.txt

import json
import re
import frappe
from frappe import _
from frappe.model.document import Document
from werkzeug.wrappers import Response
from datetime import datetime

class TravelAllowances(Document):
    def before_save(self):
        # Extract the employee ID from the user field
        self.employee_id = self.user.split('@')[0]
        
        # Retrieve the designation from the Employee doctype
        self.designation = frappe.db.get_value('Employee', self.employee_id, 'designation')
        
        # Retrieve the ta_category from the Designation doctype based on the designation
        if self.designation:
            self.ta_category = frappe.db.get_value('Designation', self.designation, 'ta_category')
        

        # Extract month and year from self.from_date
        if self.from_date:
            from_date = datetime.strptime(self.from_date, '%Y-%m-%d')
            self.month = from_date.strftime('%B')  # Full month name, e.g., 'January'
            self.year = from_date.year

        #     



# @frappe.whitelist(allow_guest=True)
# def create_record():
#     try:
#         data = frappe.form_dict

#         # Create a new document
#         ta_record = frappe.new_doc("Travel Allowances")
#         ta_record.from_date = data.get("date")
#         ta_record.from_location = data.get("from_location")
#         ta_record.time_from = data.get("time_from")
#         ta_record.to_location = data.get("to")
#         ta_record.to_time = data.get("time_to")
#         ta_record.total_duration = calculate_duration(data.get("time_from"), data.get("time_to"))
#         ta_record.user = frappe.session.user
        
#         # Insert the document and get its name
#         ta_record.insert()
#         doc_name = ta_record.name

#         return {"status": "success", "doc_name": doc_name}
#     except Exception as e:
#         frappe.log_error(message=str(e), title="Form Submission Error")
#         return {"status": "error", "message": str(e)}

# def calculate_duration(time_from, time_to):
#     from datetime import datetime, timedelta

#     fmt = '%H:%M'
#     time_from = datetime.strptime(time_from, fmt)
#     time_to = datetime.strptime(time_to, fmt)

#     if time_to < time_from:
#         time_to += timedelta(days=1)

#     duration = time_to - time_from
#     hours, minutes = divmod(duration.seconds // 60, 60)

#     return f"{hours}h {minutes}m"


@frappe.whitelist(allow_guest=True)
def create_record():
    try:
        # Retrieve all form data from the request
        data = frappe.form_dict

        # Extract individual fields
        from_date = data.get("from_date")
        from_location = data.get("from_location")
        from_location_other = data.get("from_location_other")
        from_time = data.get("from_time")
        to_date = data.get("to_date")
        to_location = data.get("to_location")
        to_location_other = data.get("to_location_other")
        to_time = data.get("to_time")
        total_time = frappe.form_dict.get("total_time")
        purpose = data.get("purpose")
        travel_mode = data.get("travel_mode")
        total_km = data.get("total_km")
        ticket_amount = data.get("ticket_amount")
        fare_amount = data.get("fare_amount")
        allowance_type = data.get("allowance_type")
        final_da_amount = data.get("final_da_amount")
        lodging_amount = data.get("lodging_amount")
        day_stay_lodge = data.get("day_stay_lodge")
        day_stay_halt = data.get("day_stay_halt")
        final_lodge_amount = data.get("final_lodge_amount")
        final_halt_amount = data.get("final_halt_amount")
        total_amount = data.get("total_amount")
        user = frappe.session.user


        # Create a new Travel Allowances document
        ta_record = frappe.new_doc("Travel Allowances")

        # Assign values to the document fields
        ta_record.from_date = from_date
        ta_record.from_time = from_time
        ta_record.from_location = from_location
        ta_record.from_location_other = from_location_other
        ta_record.to_date = to_date
        ta_record.to_time = to_time
        ta_record.to_location = to_location
        ta_record.to_location_other = to_location_other
        ta_record.total_time = total_time
        ta_record.purpose = purpose
        ta_record.travel_mode = travel_mode
        ta_record.total_km = total_km
        ta_record.ticket_amount = ticket_amount
        ta_record.fare_amount = fare_amount
        ta_record.allowance_type = allowance_type
        ta_record.final_da_amount = final_da_amount
        ta_record.lodging_amount = lodging_amount
        ta_record.day_stay_lodge = day_stay_lodge
        ta_record.day_stay_halt = day_stay_halt
        ta_record.final_lodge_amount = final_lodge_amount
        ta_record.final_halt_amount = final_halt_amount
        ta_record.total_amount = total_amount
        ta_record.user = user
        

        # Insert the document into the database
        ta_record.insert()

        # Return a success message with the document name
        return {
            "message": f"Travel Allowance created successfully with ID: {ta_record.name}",
            "status": "success",
            "doc_name": ta_record.name
        }

    except Exception as e:
        # Log the error message in Frappe's error log for debugging
        frappe.log_error(f"Error creating Travel Allowance: {e}")

        # Return an error message
        return {
            "message": "Failed to create Travel Allowance. Please check your inputs and try again.",
            "status": "error"
        }
        
        
        



@frappe.whitelist(allow_guest=True)
def get_list():
    try:
        user = frappe.session.user
        ta_records = frappe.db.get_all(
            "Travel Allowances",
            filters={"owner": user},  # Filtering by the current user
            fields=[
                "user",
                "date",
                "month",
                "year",
                "from_location",
                "from_date",
                "from_time",
                "to_location",
                "to_date",
                "to_time",
                "total_time",
                "purpose",
                "travel_mode",
                "total_km",
                "fare_amount",
                "allowance_type",
                "final_da_amount",
                "final_halt_amount",
                "final_lodge_amount",
                "total_amount"
            ],
            order_by="modified desc"
        )

        return (ta_records)
    except Exception as e:
        frappe.log_error(message=str(e), title="Error in get_list API")
        return frappe.response_as_json({"error": str(e)}, status=500)

    

@frappe.whitelist()
def findAllowance(city_class, ta_category):
    allowances = ["DA", "Lodging", "Halting"]
    results = {}

    for allowance_type in allowances:
        result = frappe.db.sql(
            f"""SELECT {city_class}_class_city FROM `tabAllowance Parameters`
            WHERE level = '{ta_category}'
            AND parent = '{allowance_type}';""",
            as_dict=True
        )

        if result:
            results[allowance_type] = result[0][f"{city_class}_class_city"]
        else:
            results[allowance_type] = "No details found"

    return results

@frappe.whitelist(allow_guest=True)
def check_submit():
    user = frappe.session.user
    employee_id = user.split('@')[0]

    # Retrieve the designation from the Employee doctype
    designation = frappe.db.get_value('Employee', employee_id, 'designation')

    # Retrieve the ta_category from the Designation doctype based on the designation
    ta_category = frappe.db.get_value('Designation', designation, 'ta_category')
    
    # Retrieve the form data
    data = frappe.form_dict
    to_location = data.get("to_location")

    # Determine the city category
    city_class = frappe.db.get_value('City Category', to_location, 'category')
    
    if city_class and ta_category:
        # Call the findAllowance function and get the result
        allowances = findAllowance(city_class, ta_category)
        return allowances if allowances else {"error": "No details found"}
    else:
        return {"error": "Incomplete information"}


@frappe.whitelist()
def calculate_da_amount(total_time, da_amount):
    try:
        # Convert inputs to appropriate types
        total_hours = float(total_time)
        da_amount = float(da_amount)

        # Convert total time to days and hours
        duration_days = total_hours // 24
        duration_hours = total_hours % 24

        if total_hours < 4:
            return {"error": "You are not eligible for DA because your total travel duration is less than 4 hours."}

        # Calculate DA for days
        da_amount_days = duration_days * da_amount

        # Calculate DA for remaining hours
        if duration_hours > 4 and duration_hours < 8:
            da_amount_hours = da_amount / 2
        elif duration_hours >= 8 and duration_hours < 12:
            da_amount_hours = (da_amount * 3) / 4
        elif duration_hours >= 12 and duration_hours <= 24:
            da_amount_hours = da_amount
        else:
            da_amount_hours = 0

        final_da_amount = da_amount_days + da_amount_hours

        return final_da_amount
    
    except Exception as e:
        return {"error": str(e)}
    


@frappe.whitelist()
def calculate_lodging_amount(input_lodging_amount, stay_days, lodging_limit):
   
    try:
        # Convert input parameters to floats
        input_lodging_amount = float(input_lodging_amount)
        stay_days = float(stay_days)
        lodging_limit = float(lodging_limit)

        # Ensure stay_days is not zero or negative to avoid invalid calculations
        if stay_days <= 0:
            return {
                "status": "error",
                "message": "Stay days must be greater than zero."
            }
        
        # Calculate the total lodging amount
        if input_lodging_amount <= lodging_limit:
            # Use the input amount if it is within the lodging limit
            total_lodging_amount = input_lodging_amount * stay_days
           
        else:
            # Use the lodging limit if the input amount exceeds it
            total_lodging_amount = lodging_limit * stay_days

        # return {
        #     "status": "success",
        #     "message": total_lodging_amount
        # }
        
        return total_lodging_amount
    
    except ValueError as e:
        frappe.throw(_("Invalid input for lodging calculation: {0}".format(str(e))))
    except Exception as e:
        frappe.throw(_("An unexpected error occurred during lodging calculation: {0}".format(str(e))))

@frappe.whitelist()
def calculate_halting_amount(stay_days, halting_limit):
    try:
        # Attempt to convert input values to float
        halting_limit = float(halting_limit)
        stay_days = float(stay_days)
        
        # Calculate total halting amount
        total_halting_amount = halting_limit * stay_days
        
        # Return the calculated halting amount
        return total_halting_amount
    
    except ValueError as e:
        # Handle conversion errors, return an appropriate error message
        frappe.throw(_("Invalid input: Please ensure that stay_days and halting_limit are numbers."))
    except Exception as e:
        # Handle any other unexpected errors, log the exception
        frappe.log_error(frappe.get_traceback(), "Calculate Halting Amount Error")
        frappe.throw(_("An error occurred while calculating the halting amount. Please try again."))

    

@frappe.whitelist()
def calculate_total_amount(fare_amount, da_amount, halt_amount, lodge_amount):
    # Convert the string amounts to floats
    fare_amount = float(fare_amount)
    da_amount = float(da_amount)
    halt_amount = float(halt_amount)
    lodge_amount = float(lodge_amount)
    
    total_amount= 0

    # Calculate the total amount
    total_amount = fare_amount + da_amount + halt_amount + lodge_amount

    # Return the total amount
    return total_amount