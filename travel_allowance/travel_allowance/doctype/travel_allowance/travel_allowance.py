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

    # if result:
    #     city_class_city_value = result[0].get(f"{city_class}_class_city")
    #     frappe.msgprint(f"{city_class}_class_city Value for Category {category} and City Class {city_class}: {city_class_city_value}")
    # else:
    #     frappe.msgprint(f"No matching records found in Allowance Parameters for Category {category} and City Class {city_class}")

    return result


