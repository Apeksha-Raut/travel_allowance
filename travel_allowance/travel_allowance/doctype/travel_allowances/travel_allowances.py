# Copyright (c) 2024, Apeksha Raut and contributors
# For license information, please see license.txt

import json
import re
import frappe
from frappe import _
from frappe.model.document import Document
from werkzeug.wrappers import Response
from datetime import date, datetime

class TravelAllowances(Document):
    def before_save(self):
        # Extract the employee ID from the user field
        self.employee_id = self.user.split('@')[0]
        
        self.first_name= frappe.db.get_value('Employee', self.employee_id, 'first_name')
        self.last_name= frappe.db.get_value('Employee', self.employee_id, 'last_name')
        
        # Retrieve the designation from the Employee doctype
        self.designation = frappe.db.get_value('Employee', self.employee_id, 'designation')
        
        self.reporting_person_user_id= frappe.db.get_value('Employee', self.employee_id, 'reporting_employee_user_id')
        
        # Retrieve the ta_category from the Designation doctype based on the designation
        if self.designation:
            self.ta_category = frappe.db.get_value('Designation', self.designation, 'ta_category')
        

        # Extract month and year from self.from_date
        if self.from_date:
            from_date = datetime.strptime(self.from_date, '%Y-%m-%d')
            self.month = from_date.strftime('%B')  # Full month name, e.g., 'January'
            self.year = from_date.year


@frappe.whitelist()
def get_current_month():
    current_month = datetime.now().strftime("%B")
    return Response(current_month)



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


@frappe.whitelist()
def get_employee_name(email):
    # user = frappe.session.user  # Get the current logged-in user

    # Fetch employee details linked to the user
    employee = frappe.get_all('Employee', filters={'user_id': email}, fields=['first_name', 'last_name'])

    if employee:
        full_name = f"{employee[0].first_name} {employee[0].last_name}"
        return Response(full_name)

    return Response("Guest User")

@frappe.whitelist()
def get_employee_designation(email):
    try:
        # Fetch employee details linked to the user
        employee = frappe.get_all('Employee', filters={'user_id': email}, fields=['designation'])

        if employee and 'designation' in employee[0]:
            designation = employee[0]['designation']
            return Response(designation)

        return Response(" ")

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_employee_designation")
        return _("Error retrieving designation")

#function to create ta doc
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
        total_time = data.get("total_time")
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

        # Handle file upload for the ticket if present
        if "upload_ticket" in frappe.request.files:
            ticket_file = frappe.request.files["upload_ticket"]
            ticket_filename = ticket_file.filename

            # Create a new File document
            ticket_file_doc = frappe.get_doc({
                "doctype": "File",
                "file_name": ticket_filename,
                "content": ticket_file.read(),
                "folder": "Home",  # or any other folder
                "is_private": 1
            })
            ticket_file_doc.insert()

            ta_record.upload_ticket = ticket_file_doc.file_url

        # Handle file upload for the lodging bill if present
        if "upload_lodging" in frappe.request.files:
            lodging_file = frappe.request.files["upload_lodging"]
            lodging_filename = lodging_file.filename

            # Create a new File document
            lodging_file_doc = frappe.get_doc({
                "doctype": "File",
                "file_name": lodging_filename,
                "content": lodging_file.read(),
                "folder": "Home",  # or any other folder
                "is_private": 1
            })
            lodging_file_doc.insert()

            ta_record.upload_lodging = lodging_file_doc.file_url

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
                "name",
                "date",
                "month",
                "year",
                "from_location",
                "from_location_other",  # Include this field
                "from_date",
                "from_time",
                "to_location",
                "to_location_other",    # Include this field
                "to_date",
                "to_time",
                "total_time",
                "purpose",
                "travel_mode",
                "ticket_amount",
                "total_km",
                "fare_amount",
                "allowance_type",
                "final_da_amount",
                "final_halt_amount",
                "final_lodge_amount",
                "total_amount",
                "upload_ticket",
                "upload_lodging",
                "status"
            ],
            order_by="modified desc"
        )

        # Update records with "from_location_other" and "to_location_other" if "from_location" or "to_location" is "Other"
        for record in ta_records:
            if record.get("from_location") == "Other" and record.get("from_location_other"):
                record["from_location"] = record["from_location_other"]
            
            if record.get("to_location") == "Other" and record.get("to_location_other"):
                record["to_location"] = record["to_location_other"]

            # Remove the 'from_location_other' and 'to_location_other' fields from the result if not needed
            record.pop("from_location_other", None)
            record.pop("to_location_other", None)

        return ta_records

    except Exception as e:
        frappe.log_error(message=str(e), title="Error in get_list API")
        return frappe.response_as_json({"error": str(e)}, status=500)

# delete ta record function
@frappe.whitelist()
def delete_records(names):
    try:
        # Log the incoming request body for debugging
        frappe.log_error(f"Received names: {names}", "Delete Records Debug")

        # Ensure names are received as a list
        if isinstance(names, str):
            names = json.loads(names)

        if not isinstance(names, list):
            raise ValueError("Invalid data format: names should be a list.")

        deleted_records = []
        errors = []

        for name in names:
            if frappe.db.exists("Travel Allowances", name):
                try:
                    frappe.delete_doc("Travel Allowances", name)
                    deleted_records.append(name)
                except Exception as e:
                    errors.append(f"Failed to delete {name}: {str(e)}")
            else:
                errors.append(f"Record {name} does not exist")

        frappe.db.commit()

        if errors:
            return {
                "status": "partial",
                "message": f"Deleted records: {deleted_records}. Errors: {errors}"
            }
        else:
            return {
                "status": "success",
                "message": f"Successfully deleted records: {deleted_records}"
            }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Delete Travel Allowances Error")
        return {
            "status": "error",
            "message": f"An unexpected error occurred: {str(e)}"
        }
        
# function to update status as 'Pending' on submit
@frappe.whitelist()
def update_status(names):
    try:
        # Log the incoming request body for debugging
        frappe.log_error(f"Received names for status update: {names}", "Update Status Debug")

        # Ensure names are received as a list
        if isinstance(names, str):
            names = json.loads(names)

        if not isinstance(names, list):
            raise ValueError("Invalid data format: names should be a list.")

        updated_records = []
        errors = []

        # List of known date fields in Travel Allowances
        date_fields = ['date', 'from_date', 'to_date']  # Add or modify these field names as per your doctype

        for name in names:
            if frappe.db.exists("Travel Allowances", name):
                try:
                    doc = frappe.get_doc("Travel Allowances", name)
                    
                    # Convert date fields to strings if necessary
                    for field in date_fields:
                        if hasattr(doc, field) and isinstance(doc.get(field), (date, datetime)):
                            doc.set(field, doc.get(field).strftime('%Y-%m-%d'))

                    doc.status = 'Pending'
                    doc.save()
                    updated_records.append(name)
                except Exception as e:
                    errors.append(f"Failed to update {name}: {str(e)}")
            else:
                errors.append(f"Record {name} does not exist")

        frappe.db.commit()

        if errors:
            return {
                "status": "partial",
                "message": f"Updated records: {updated_records}. Errors: {errors}",
                "updated_count": len(updated_records)
            }
        else:
            return {
                "status": "success",
                "message": f"Successfully updated records: {updated_records}",
                "updated_count": len(updated_records)
            }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Update Travel Allowances Status Error")
        return {
            "status": "error",
            "message": f"An unexpected error occurred: {str(e)}",
            "updated_count": 0
        }
        
@frappe.whitelist()
def ping():
    return "Pong"
    
@frappe.whitelist(allow_guest=True)
def calculate_total_duration():
    try:
        # Retrieve data from the request
        data = frappe.local.form_dict
        
        # Extract fields
        from_date = data.get("from_date")
        from_time = data.get("from_time")
        to_date = data.get("to_date")
        to_time = data.get("to_time")
        
        # Check if all required fields are provided
        if not (from_date and from_time and to_date and to_time):
            return {
                "status": "error",
                "message": _("All date and time fields must be provided.")
            }
        
        start_date_time = frappe.utils.get_datetime(f"{from_date} {from_time}")
        end_date_time = frappe.utils.get_datetime(f"{to_date} {to_time}")

        # Check if start date-time is greater than end date-time
        if start_date_time > end_date_time:
            return {
                "status": "error",
                "message": _("Start date-time should not be greater than end date-time.")
            }
        
        # Check if start and end times are the same
        if start_date_time == end_date_time:
            return {
                "status": "error",
                "message": _("Start time and end time should not be the same.")
            }

        # Calculate duration
        duration_ms = (end_date_time - start_date_time).total_seconds() * 1000
        duration_days = duration_ms // (1000 * 60 * 60 * 24)
        duration_hours = (duration_ms % (1000 * 60 * 60 * 24)) // (1000 * 60 * 60)
        
        # Calculate total hours
        total_hours = duration_days * 24 + duration_hours
        
        # Check if total duration is less than 3 hours
        if total_hours < 3:
            return {
                "status": "error",
                "message": _("You are not eligible for DA because your total travel duration is less than 3 hours.")
            }
        
        # Return success with calculated duration and total hours
        return {
            "status": "success",
            "total_hours": total_hours,
            "total_duration": f"{int(duration_days)} days {int(duration_hours)} hours"
        }
    
    except Exception as e:
        frappe.log_error(f"Error calculating total duration: {str(e)}")
        return {
            "status": "error",
            "message": _("An error occurred while calculating the total duration.")
        }

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
def calculate_halting_amount(total_time, halting_limit):
    try:
        # Attempt to convert input values to float
        # Convert inputs to appropriate types
        total_hours = float(total_time)
        halting_limit = float(halting_limit)

        # Convert total time to days and hours
        duration_days = total_hours // 24
        duration_hours = total_hours % 24

        if total_hours < 4:
            return {"error": "You are not eligible for DA because your total travel duration is less than 4 hours."}

        # Calculate DA for days
        halt_amount_days = duration_days * halting_limit

        # Calculate DA for remaining hours
        if duration_hours > 4 and duration_hours < 8:
            halt_amount_hours = halting_limit / 2
        elif duration_hours >= 8 and duration_hours < 12:
            halt_amount_hours = (halting_limit * 3) / 4
        elif duration_hours >= 12 and duration_hours <= 24:
            halt_amount_hours = halting_limit
        else:
            halt_amount_hours = 0

        final_halt_amount = halt_amount_days + halt_amount_hours

        return final_halt_amount
    
    except Exception as e:
        return {"error": str(e)}
    

    

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

# Reposting person approved ta record
@frappe.whitelist()  # Removed allow_guest=True unless required
def bulk_approve_records(names):
    try:
        # Log the incoming request body for debugging
        frappe.log_error(f"Received names for status update: {names}", "Update Status Debug")

        # Ensure names are received as a list
        if isinstance(names, str):
            names = json.loads(names)

        if not isinstance(names, list):
            raise ValueError("Invalid data format: names should be a list.")

        updated_records = []
        errors = []

        # List of known date fields in Travel Allowances
        date_fields = ['date', 'from_date', 'to_date']  # Add or modify these field names as per your doctype

        for name in names:
            if frappe.db.exists("Travel Allowances", name):
                try:
                    doc = frappe.get_doc("Travel Allowances", name)
                    
                    # Convert date fields to strings if necessary
                    for field in date_fields:
                        if hasattr(doc, field) and isinstance(doc.get(field), (date, datetime)):
                            doc.set(field, doc.get(field).strftime('%Y-%m-%d'))

                    doc.status = 'Approved'
                    doc.approved_by = frappe.session.user
                    doc.save()
                    updated_records.append(name)
                except Exception as e:
                    errors.append(f"Failed to update {name}: {str(e)}")
            else:
                errors.append(f"Record {name} does not exist")

        frappe.db.commit()

        if errors:
            frappe.log_error("\n".join(errors), "Bulk Approval Errors")

        # Return success or partial success message
        if updated_records:
            if errors:
                return {'message': 'Some records were approved successfully, but some failed.', 'errors': errors}
            else:
                return {'message': 'Records approved successfully.'}
        else:
            return {'message': 'No records were approved.', 'errors': errors}
    
    except Exception as e:
        frappe.log_error(str(e), "Bulk Approval Failed")
        return {'message': str(e), 'error': True}
    
    
# Reposting person Reject ta record
@frappe.whitelist()  # Removed allow_guest=True unless required
def bulk_reject_records(names):
    try:
        # Log the incoming request body for debugging
        frappe.log_error(f"Received names for status update: {names}", "Update Status Debug")

        # Ensure names are received as a list
        if isinstance(names, str):
            names = json.loads(names)

        if not isinstance(names, list):
            raise ValueError("Invalid data format: names should be a list.")

        updated_records = []
        errors = []

        # List of known date fields in Travel Allowances
        date_fields = ['date', 'from_date', 'to_date']  # Add or modify these field names as per your doctype

        for name in names:
            if frappe.db.exists("Travel Allowances", name):
                try:
                    doc = frappe.get_doc("Travel Allowances", name)
                    
                    # Convert date fields to strings if necessary
                    for field in date_fields:
                        if hasattr(doc, field) and isinstance(doc.get(field), (date, datetime)):
                            doc.set(field, doc.get(field).strftime('%Y-%m-%d'))

                    doc.status = 'Reject'
                    doc.rejected_by = frappe.session.user
                    doc.save()
                    updated_records.append(name)
                except Exception as e:
                    errors.append(f"Failed to update {name}: {str(e)}")
            else:
                errors.append(f"Record {name} does not exist")

        frappe.db.commit()

        if errors:
            frappe.log_error("\n".join(errors), "Bulk Rejection Errors")

        # Return success or partial success message
        if updated_records:
            if errors:
                return {'message': 'Some records were rejected successfully, but some failed.', 'errors': errors}
            else:
                return {'message': 'Records Rejected successfully.'}
        else:
            return {'message': 'No records were rejected.', 'errors': errors}
    
    except Exception as e:
        frappe.log_error(str(e), "Bulk Rejection Failed")
        return {'message': str(e), 'error': True}

        
# @frappe.whitelist()
# def delete_record(id):
#     try:
#         frappe.delete_doc("Travel Allowances", id)
#         frappe.db.commit()
#         return {"message": "Record deleted successfully"}
#     except Exception as e:
#         frappe.log_error(frappe.get_traceback(), _("Travel Allowances Delete Error"))
#         return {"error": str(e)}
    
# @frappe.whitelist()
# def update_record(data):
#     try:
#         data = frappe.parse_json(data)
#         doc = frappe.get_doc("Travel Allowances", data.get("name"))
#         doc.update(data)
#         doc.save()
#         frappe.db.commit()
#         return {"message": "Record updated successfully"}
#     except Exception as e:
#         frappe.log_error(frappe.get_traceback(), _("Travel Allowances Update Error"))
#         return {"error": str(e)}
    


# @frappe.whitelist(allow_guest=True)
# def create_blank_record():
#     try:
#         # Create a new Travel Allowances document
#         ta_record = frappe.new_doc("Travel Allowances")

#         # Optionally set default values or leave it blank

#         # Insert the document into the database
#         ta_record.insert()

#         # Return success message
#         return {
#             "message": f"Travel Allowance created successfully with ID: {ta_record.name}",
#             "status": "success",
#             "doc_name": ta_record.name  # Pass the doc_name back for tracking
#         }

#     except Exception as e:
#         # Log error and return failure
#         frappe.log_error(f"Error creating Travel Allowance: {e}")
#         return {
#             "message": "Failed to create Travel Allowance. Please check your inputs and try again.",
#             "status": "error"
#         }

# @frappe.whitelist(allow_guest=True)
# def delete_record(doc_name):
#     try:
#         # Delete the document by its name
#         frappe.delete_doc("Travel Allowances", doc_name)

#         # Return success message
#         return {
#             "message": f"Travel Allowance with ID: {doc_name} deleted successfully.",
#             "status": "success"
#         }
#     except Exception as e:
#         # Log error and return failure
#         frappe.log_error(f"Error deleting Travel Allowance {doc_name}: {e}")
#         return {
#             "message": f"Failed to delete Travel Allowance {doc_name}. Please try again.",
#             "status": "error"
#         }
