// Copyright (c) 2023, Apeksha and contributors
// For license information, please see license.txt

// Declare a global variable
let cityClass;
let globalEmpDesignation;
let globalTaCategory;

let daAllowance;

frappe.ui.form.on("Travel Allowance", {
  // after_save: function (frm) {
  //   console.log("form saved");
  //   if (frm.save) {
  //     frm.toggle_display("total_amount_summary", true);
  //     console.log("details tab display");
  //   }

  //   //showSummary(frm);
  // },
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

    // set value null when destination location is change
    frm.set_value("da_claim", null);
    frm.set_value("halting_lodging_select", null);
    frm.set_value("daily_allowance", null);
    frm.set_value("halting_lodging_amount", null);
  },

  refresh: function (frm) {
    // // Fetch the current client date
    // var currentClientDate = frappe.datetime.get_today();

    // // Log the result to the console
    // console.log("Current Client Date:", currentClientDate);
    // frm.set_value("date", currentClientDate);

    // // Get the month from the date field
    // var month = frappe.datetime.month(frm.doc.date);

    // // Log the result to the console
    // console.log("Month:", month);

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
    frm.fields_dict.btn_add.$input.css({
      "background-color": "#3498db",
      color: "#fff",
      border: "none",
      padding: "8px 20px",
      cursor: "pointer",
    });

    frm.fields_dict.btn_save_form.$input.css({
      "background-color": "#08A226",
      color: "#fff",
      border: "none",
      padding: "8px 22px",
      cursor: "pointer",
    });
  },

  //handle the DA Claim Allowance
  da_claim: function (frm) {
    //frm.trigger("set_claim");

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
            (frm.doc.other_expenses_amount || 0);

          console.log("Total Allowance:", total_amount);
          frm.set_value("total_amount", total_amount.toFixed(2));
          frm.refresh_field("total_amount");
        },
      });
    }
  },

  // set_claim(frm) {
  //   frappe.msgprint("hello claim");
  //},

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
            (frm.doc.other_expenses_amount || 0);

          console.log("Total Allowance:", total_amount);
          frm.set_value("total_amount", total_amount.toFixed(2));
          frm.refresh_field("total_amount");
        },
      });
    }
  },
  other_expenses_check: function (frm) {
    console.log(frm.doc.other_expense_check);
  },
  //handle the local conveyance amount
  other_expenses_amount: function (frm) {
    let total_amount =
      frm.doc.daily_allowance +
      frm.doc.halting_lodging_amount +
      (frm.doc.other_expenses_amount || 0);

    console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount.toFixed(2));
    frm.refresh_field("total_amount");
  },
  // onload: function (frm) {
  //   frm.fields_dict["date_and_time_to"].df.options = "hh:mm a";
  //   frm.fields_dict["date_and_time_to"].refresh();
  // },

  // button function to add other expense data in child table Local Conveyance
  btn_add: function (frm) {
    //console.log(frm.doc.btn_add);
    let typeofExpense = frm.doc.select_type_expenses;
    let dateExpense = frm.doc.date_other_expense;
    let fromExpense = frm.doc.from;
    let toExpense = frm.doc.to;
    let modeofTravel = frm.doc.mode_of_travel;
    let purposeExpense = frm.doc.purpose_local_conveyance;
    let amountExpense = frm.doc.other_expenses_amount;

    //before add checking fields are empty
    if (!typeofExpense) {
      frappe.throw("Please select Type of Expense ");
    } else if (!dateExpense) {
      frappe.throw("Please Fill the date of other expense");
    } else if (!fromExpense) {
      frappe.throw("Please Fill your from location");
    } else if (!toExpense) {
      frappe.throw("Please your destination location");
    } else if (!modeofTravel) {
      frappe.throw("Please Select your Travelling Mode");
    } else if (!purposeExpense) {
      frappe.throw("Please fill purpose");
    } else if (!amountExpense) {
      frappe.throw("Please Enter your expense amount");
    } else {
      let row = frm.add_child("local_conveyance_table", {
        type_of_expenses: typeofExpense,
        date: dateExpense,
        from: fromExpense,
        to: toExpense,
        mode_of_travel: modeofTravel,
        purpose: purposeExpense,
        amount: amountExpense,
      });
      frm.refresh_field("local_conveyance_table");

      frm.set_value("select_type_expenses", null);
      frm.set_value("date_other_expense", null);
      frm.set_value("from", null);
      frm.set_value("to", null);
      frm.set_value("mode_of_travel", null);
      frm.set_value("purpose_local_conveyance", null);
      frm.set_value("other_expenses_amount", null);

      let childAmount = 0;
      for (let row of frm.doc.local_conveyance_table) {
        childAmount = childAmount + row.amount;
      }
      console.log("child table amount", childAmount);
      frm.set_value("other_total_expense_amount", childAmount);

      frm.set_value("total_amount", childAmount + frm.doc.total_amount);
      let totalamt = frm.doc.total_amount;
      console.log("totalamt test : ", totalamt);
      frm.refresh_field("total_amount");
      frm.save();
    }
  },

  //saving total allowance amount
  before_save(frm) {
    let total_amount =
      frm.doc.daily_allowance +
      frm.doc.halting_lodging_amount +
      (frm.doc.other_total_expense_amount || 0);

    console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount.toFixed(2));
    frm.refresh_field("total_amount");
  },

  // button function to add data in TA child table
  btn_save_form: function (frm) {
    let taFromLocation = frm.doc.from_location;
    let tadateTimeFrom = frm.doc.date_and_time_from;
    let taToLocation = frm.doc.to_location;
    let taOtherLocation = frm.doc.other_to_location;
    let tadateTimeTo = frm.doc.date_and_time_to;
    let taPurpose = frm.doc.purpose;
    let taDaClaim = frm.doc.da_claim;
    let taDaAmount = frm.doc.daily_allowance;
    let taHaltingLodging = frm.doc.halting_lodging_select;
    let taHaltLodgAmount = frm.doc.halting_lodging_amount;
    let taClassCity = frm.doc.class_city;
    let taTotalTime = frm.doc.total_visit_time;
    let taOtherExpense = frm.doc.other_total_expense_amount;
    let taTotalAllowance = frm.doc.total_amount;

    if (!taFromLocation) {
      frappe.throw("Please Fill your Source Location");
    } else if (!taToLocation) {
      frappe.throw("Please Fill your Destination Location");
    } else if (!taPurpose) {
      frappe.throw("Please Fill your Reason of travelling");
    } else if (!taDaClaim) {
      frappe.throw("Please Select DA Claim");
    } else if (!taHaltingLodging) {
      frappe.throw("Please Select Halting/Lodging");
    } else {
      let row = frm.add_child("ta_chart", {
        from_location: taFromLocation,
        date_and_time_start: tadateTimeFrom,
        to_location: taToLocation,
        other_location: taOtherLocation,
        date_and_time_end: tadateTimeTo,
        purpose: taPurpose,
        total_visit_hour: taTotalTime,
        city_class: taClassCity,
        da_claimed: taDaClaim,
        haltinglodging: taHaltingLodging,
        daily_allowance: taDaAmount,
        haltinglodging_amount: taHaltLodgAmount,
        local_conveyance__other_expenses: taOtherExpense,
        total: taTotalAllowance,
      });

      frm.refresh_field("ta_chart");

      frm.save();
      frm.set_value("from_location", null);
      frm.set_value("date_and_time_from", null);
      frm.set_value("to_location", null);
      frm.set_value("other_to_location", null);
      frm.set_value("date_and_time_to", null);
      frm.set_value("purpose", null);
      frm.set_value("da_claim", null);
      frm.set_value("daily_allowance", null);
      frm.set_value("halting_lodging_select", null);
      frm.set_value("halting_lodging_amount", null);
      frm.set_value("class_city", null);
      frm.set_value("total_visit_time", null);
      frm.set_value("total_amount", null);
    }
  },

  date_and_time_to: function (frm) {
    // let from_datetime = frm.doc.date_and_time_from;
    //let to_datetime = frm.doc.date_and_time_to;
    //console.log(from_datetime);
    // console.log(to_datetime);
    //calculateTotalTime(frm);
    //frm.set_value("total_visit_time", total_time);
  },

  // other_expenses_check: function (frm) {
  //   // Check if the field is checked
  //   if (frm.doc.other_expenses_check) {
  //     // Show the fields in the desired tab (change 'YourTabName' to the actual tab name)
  //     frm.get_field("other_expense_details_tab").toggle(true);
  //   } else {
  //     // Optionally, hide the fields when unchecked
  //     frm.get_field("other_expense_details_tab").toggle(false);
  //   }
  // },
});
// function showSummary(frm) {
//   // Create a summary HTML using Jinja templating
//   var summaryHTML = `
//       <div>
//           <strong>DA Claim:</strong> {{ doc.da_claim.toFixed(2) }}<br>
//           <strong>Daily Allowance:</strong> &#8377;{{ doc.daily_allowance.toFixed(2) }}<br>
//           <strong>Halting/Lodging Select:</strong> {{ doc.halting_lodging_select }}<br>
//           <strong>Halting/Lodging Amount:</strong> &#8377;{{ doc.halting_lodging_amount.toFixed(2) }}<br>
//           <strong>Total Allowance Amount:</strong> &#8377;{{ doc.total_amount.toFixed(2) }}<br>
//       </div>
//   `;

//   // Remove any existing summary fields before adding a new one
//   frm.dashboard.clear_headline();

//   // Display the summary at the top of the form
//   frm.dashboard.add_headline(__("Summary"), summaryHTML);
// }

// function calculateTotalTime(frm) {
//   let dateAndTimeFrom = new Date(frm.doc.date_and_time_from);
//   let dateAndTimeTo = new Date(frm.doc.date_and_time_to);
//   console.log(dateAndTimeFrom);
//   console.log(dateAndTimeFrom);

//   // Check if both date and time values are valid
//   if (!isNaN(dateAndTimeFrom) && !isNaN(dateAndTimeTo)) {
//     // Check if 'date_and_time_from' is earlier than 'date_and_time_to'
//     if (dateAndTimeTo >= dateAndTimeFrom) {
//       let timeDifference = dateAndTimeTo - dateAndTimeFrom;
//       console.log(dateAndTimeFrom, dateAndTimeTo, timeDifference); // Add this line for debugging
//       let formattedTime = formatTimeDifference(timeDifference);
//       console.log(formattedTime); // Add this line for debugging
//       frm.set_value("total_visit_time", formattedTime);
//     } else {
//       frm.set_value("total_visit_time", ""); // Clear total_visit_time if dates are not in order
//       frappe.msgprint(
//         __("End date and time should be later than start date and time.")
//       );
//     }
//   } else {
//     frm.set_value("total_visit_time", ""); // Clear total_visit_time if either date or time is invalid
//   }
// }

// function formatTimeDifference(timeDifference) {
//   var totalMinutes = Math.floor(timeDifference / (60 * 1000));
//   //var days = Math.floor(totalMinutes / (24 * 60));
//   var hours = Math.floor((totalMinutes % (24 * 60)) / 60);
//   var minutes = totalMinutes % 60;

//   // Format the time as DD:HH:MM
//   var formattedTime = `${padZero(hours)}:${padZero(minutes)}`; //${padZero(days)}:
//   return formattedTime;
// }

// function padZero(num) {
//   return num.toString().padStart(2, "0");
// }

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
    "Kolkata",
    "Hyderabad" /* Add more metro cities */,
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
