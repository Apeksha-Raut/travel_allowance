# Copyright (c) 2023, Apeksha and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TravelAllowance(Document):
	pass

def before_save(self):
    if(self.other_expenses_amount):
       self.total_amount=self.daily_allowance + self.halting_lodging_amount + self.other_expenses_amount
    else:
        self.total_amount=self.daily_allowance + self.halting_lodging_amount
              


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
