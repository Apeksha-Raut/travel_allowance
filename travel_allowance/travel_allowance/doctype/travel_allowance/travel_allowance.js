// Copyright (c) 2023, Apeksha and contributors
// For license information, please see license.txt

// Declare a global variable
let cityClass;
let globalEmpDesignation;
let globalTaCategory;

let daAllowance;

frappe.ui.form.on("Travel Allowance", {
  // handle the destination field
  to_location: function (frm) {
    let destination = frm.doc.to_location;
    // Convert destination to lowercase for case-insensitive comparison
    //let lowerDestination = destination.toLowerCase();
    if (destination === "Other") {
      console.log(destination);
      frm.toggle_display("other_to_location", true);
      frm.set_value("class_city", "C");
    } else {
      frm.toggle_display("other_to_location", false);
      console.log(destination);
      cityClass = getCityClass(destination);
      console.log(cityClass);
      frm.set_value("class_city", cityClass);
      frm.refresh_field("class_city");
    }
  },

  refresh: function (frm) {
    if (frm.is_new()) {
    }

    if (frm.is_new()) {
      //Setting Employee ID
      let user = frappe.session.user;
      let eid = user.match(/\d+/)[0];
      frm.set_value("employee_id", eid);
      let empid = frm.doc.employee_id;

      // Getting Employee Designation
      frappe.db
        .get_value("Employee", empid, "designation")
        .then((result) => {
          globalEmpDesignation =
            result.message && result.message.designation
              ? result.message.designation
              : null;
          console.log("Designation:", globalEmpDesignation);

          // Now you can use globalEmpDesignation wherever needed

          // Example: Call a function that depends on the fetched value
          handleDesignation(globalEmpDesignation);
        })
        .catch((err) => {
          console.error("Error fetching designation:", err);
        });

      function handleDesignation(designation) {
        // Perform actions based on the fetched designation value
        console.log("Handling Designation:", designation);

        // Getting Employee Designation Category
        frappe.db
          .get_value("Designation", designation, "ta_category")
          .then((result) => {
            globalTaCategory =
              result.message && result.message.ta_category
                ? result.message.ta_category
                : null;
            console.log("ta_category:", globalTaCategory);
            frm.set_value("category", globalTaCategory); // Setting value of designation category field

            // Now you can use globalEmpDesignation wherever needed

            // Example: Call a function that depends on the fetched value
            //handleDesignation(globalEmpDesignation);
          })
          .catch((err) => {
            console.error("Error fetching designation:", err);
          });
      }
    } else if (!frm.is_new()) {
      console.log("Old Form");
    }
  },

  //handle the DA Claim Allowance
  da_claim: function (frm) {
    frm.trigger("set_claim");

    let da_category = frm.doc.da_claim; // Full Day or Half Day
    let category = frm.doc.category; // Designation category(level 1/2/3/4/5/6/7/8/)
    let cityClass = frm.doc.class_city; // Category of city a,b,c

    if (!cityClass) {
      frappe.throw("Please Select To Location");
      frm.set_value("da_claim", "");
      frm.refresh_field("da_claim");
    } else {
      frm.call({
        method: "findAllowance",
        args: {
          city_class: cityClass,
          category: category,
          halt_lodge: "DA",
        },
        callback: function (r) {
          if (!r.exc) {
            // Handle the result if needed
            //console.log(r.message); // This will contain the result from the server
            let amount = r.message[0][`${cityClass}_class_city`];
            if (da_category == "Half Day") {
              amount = amount / 2;
              frm.set_value("daily_allowance", amount);
            } else if (da_category == "Full Day") {
              frm.set_value("daily_allowance", amount);
            }
          }
          console.log(frm.doc.daily_allowance);
          console.log(frm.doc.halting_lodging_amount);
          console.log(frm.doc.other_expenses_amount);
          let total_amount =
            frm.doc.daily_allowance +
            frm.doc.halting_lodging_amount +
            frm.doc.other_expenses_amount;
          console.log("Total Allowance:", total_amount);
          frm.set_value("total_amount", total_amount);
          frm.refresh_field("total_amount");
        },
      });
    }
  },

  set_claim(frm) {
    frappe.msgprint("hello claim");
  },
  //handle halting Lodging Allowances
  halting_lodging_select: function (frm) {
    //<Taking Parameters to fetch Amount for Halting and Lodging>
    // let category = frm.doc.category;
    // let cityClass = frm.doc.class_city;
    // let haltLodge = frm.doc.halting_lodging_select;
    //<Taking Parameters to fetch Amount for Halting and Lodging>

    let category = frm.doc.category; // Designation category(level 1/2/3/4/5/6/7/8/)
    let cityClass = frm.doc.class_city; //Category of city a,b,c
    let haltLodge = frm.doc.halting_lodging_select; // selected value for halting/lodging

    if (!cityClass) {
      //frm.set_value("halting_lodging_select", "");
      frappe.msgprint("Please Select To Location");

      //frm.doc.halting_lodging_select = null;
      // Debug statement to check the state of the form document after setting the value
      console.log("After setting value:", frm.doc.halting_lodging_select);
    } else {
      frm.call({
        method: "findAllowance",
        args: {
          city_class: cityClass,
          category: category,
          halt_lodge: haltLodge,
        },
        callback: function (r) {
          if (!r.exc) {
            // Handle the result if needed
            //console.log(r.message); // This will contain the result from the server
            let amount = r.message[0][`${cityClass}_class_city`];
            if (haltLodge == "Halting") {
              frm.set_value("halting_lodging_amount", amount);
            } else if (haltLodge == "Lodging") {
              frm.set_value("halting_lodging_amount", amount);
            }
          }
          console.log(frm.doc.daily_allowance);
          console.log(frm.doc.halting_lodging_amount);
          console.log(frm.doc.other_expenses_amount);
          let total_amount =
            frm.doc.daily_allowance +
            frm.doc.halting_lodging_amount +
            frm.doc.other_expenses_amount;
          console.log("Total Allowance:", total_amount);
          frm.set_value("total_amount", total_amount);
          frm.refresh_field("total_amount");
        },
      });
    }
  },
  other_expense_radio: function (frm) {
    console.log(frm.doc.other_expense_radio);
  },
  //handle the local conveyance amount
  other_expenses_amount: function (frm) {
    let total_amount =
      frm.doc.daily_allowance +
      frm.doc.halting_lodging_amount +
      frm.doc.other_expenses_amount;
    console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount);
    frm.refresh_field("total_amount");
  },
});

// function calculateTotalVisitTime(startDateTime, destinationDateTime) {
//   // Parse the input strings to Date objects
//   let startDt = new Date(startDateTime);
//   console.log(startDt);

//   let destinationDt = new Date(destinationDateTime);
//   console.log(destinationDt);

// // Calculate the time difference in milliseconds
// let timeDifference = destinationDt - startDt;

// // Calculate days, hours, minutes, and seconds
// const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
// const hours = Math.floor(
//   (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
// );
// const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

// // Format the result
// const formattedTime = `${days} Day:${hours < 10 ? "0" : ""}${hours}:${
//   minutes < 10 ? "0" : ""
// }${minutes}`;

// return formattedTime;
// }

// Function to determine the city class based on the destination
function getCityClass(lowerDestination) {
  // Define the lists of cities for each class
  let classA = [
    "Mumbai",
    "Pune",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Kolkata" /* Add more metro cities */,
  ];
  let classB = [
    "Nagpur",
    "Amravati",
    "Aurangabad",
    "Nashik",
    "Kolhapur",
    "Solapur",
    "Gondia",
  ];

  // Check if the destination is in Class A cities
  if (classA.includes(lowerDestination)) {
    return "a";
  }

  // Check if the destination is in Class B cities
  else if (classB.includes(lowerDestination)) {
    return "b";
  }
}
