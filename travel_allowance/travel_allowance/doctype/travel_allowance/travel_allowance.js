// Copyright (c) 2023, Apeksha and contributors
// For license information, please see license.txt

// Declare a global variable
let cityClass;
let globalEmpDesignation;
let globalTaCategory;

let daAllowance;
let halt_lodge_amount; // for halting or lodging amount
let da_amount; // for DA claim amount

frappe.ui.form.on("Travel Allowance", {
  from_location: function (frm) {
    // Validate the "from_location" field for alphabets
    var fieldValue = frm.doc.from_location;

    if (fieldValue && !/^[a-zA-Z]+$/.test(fieldValue)) {
      frappe.msgprint(
        __("Please enter only alphabet characters in From Location.")
      );
      // frappe.validated = false;
      frm.set_value("from_location", "");
      //frm.refresh_field("from_location");
    }
  },

  // handle the destination field
  to_location: function (frm) {
    var source = frm.doc.from_location.toLowerCase();
    let destination = frm.doc.to_location.toLowerCase();

    if (source && destination && source === destination) {
      frappe.msgprint({
        title: __("Validation Error"),
        message: __("From Location and To Location should be different."),
        indicator: "red",
      });
      frm.set_value("to_location", " ");
    }

    // check wheather the destination field is Other
    if (destination === "other") {
      console.log(destination);
      frm.toggle_display("other_to_location", true);
      // let otherLocation = frm.doc.other_to_location;
      // frm.set_value("to_location", otherLocation);
      // frm.refresh_field("to_location");
    } else {
      frm.toggle_display("other_to_location", false);
      console.log(destination);
    }
  },

  refresh: function (frm) {
    frm.set_value("halting_lodging_amount", null);
    frm.set_value("daily_allowance", null);
    // frm.toggle_display("da_claim", false);
    // frm.toggle_display("halting_lodging_select", false);
    //frm.toggle_display("upload_image_of_lodging", false);

    console.log("User Roles:", frappe.user_roles);
    console.log("Is Employee:", frappe.user_roles.includes("Employee"));

    //var isEmp = (frappe.user_roles || []).includes("Employee");
    var isEmp = frappe.user.has_role("Employee");

    //remove save button
    if (isEmp) {
      console.log("is employee", isEmp);
      frm.disable_save();
      frm.page.clear_menu();
      frm.page.clear_indicator();
    } else {
      frm.enable_save();
    }

    //check if the form is new, get empID
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

      //Fetching date, month and year
      frm.call({
        method: "get_server_datetime",
        callback: function (r) {
          // Check if the response has a valid message
          if (r.message) {
            // Parse the datetime string into a JavaScript Date object
            var serverDatetime = new Date(r.message);

            // Extract the year
            var year = serverDatetime.getFullYear();
            // Extract the month (returns a zero-based index, so add 1)
            //var month = serverDatetime.getMonth() + 1;

            var monthIndex = serverDatetime.getMonth();

            // Array of month names
            var monthNames = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];

            // Get the month name based on the index
            var monthName = monthNames[monthIndex];
            // Set the value of the "year" field
            frm.set_value("year", year);
            frm.refresh_field("year");
            // Set the value of the "month" field
            frm.set_value("month", monthName);

            frm.refresh_field("month");
          } else {
            console.log("Invalid server datetime response");
          }
        },
      });
    } else if (!frm.is_new()) {
      console.log("Old Form");

      frm.trigger("populate_total_amount_html");
      frm.trigger("ta_chart_table_html");
    }

    //(TA Add Button)adding css to button
    frm.fields_dict.btn_add_ta.$input.css({
      "background-color": "#5890FF",
      color: "#fff",
      border: "none",
      padding: "8px 22px",
      cursor: "pointer",
    });

    // Make the entire "ta_chart" child table read-only
    frm.fields_dict["ta_chart"].df.read_only = 1;

    // Refresh the form to apply the changes
    frm.refresh_fields();

    // if (frm.doc.other_expenses_check === "1") {
    //   frm.msgprint(
    //     ___("Please Fill Tab Local Conveyance & Other Expense"),
    //     "blue"
    //   );
    // }

    // Add a change event handler to your checkbox fields
    frm.fields_dict.check_da.$input.on("change", function () {
      // Uncheck all other checkboxes
      uncheckAllCheckboxes(frm);
      // Check the current checkbox
      frm.fields_dict.check_da.$input.prop("checked", true);
    });

    frm.fields_dict.check_halting.$input.on("change", function () {
      uncheckAllCheckboxes(frm);
      frm.fields_dict.check_halting.$input.prop("checked", true);
    });

    frm.fields_dict.check_da_with_lodging.$input.on("change", function () {
      uncheckAllCheckboxes(frm);
      frm.fields_dict.check_da_with_lodging.$input.prop("checked", true);
    });

    frm.fields_dict.check_lodging.$input.on("change", function () {
      uncheckAllCheckboxes(frm);
      frm.fields_dict.check_lodging.$input.prop("checked", true);
    });

    function uncheckAllCheckboxes(frm) {
      frm.fields_dict.check_da.$input.prop("checked", false);
      frm.fields_dict.check_halting.$input.prop("checked", false);
      frm.fields_dict.check_da_with_lodging.$input.prop("checked", false);
      frm.fields_dict.check_lodging.$input.prop("checked", false);
    }
  },

  async populate_total_amount_html(frm) {
    // Fetch the data from the backend
    frm.call({
      method: "get_ta_total_amount",
      args: {
        self: frm.doc.name,
      },
      callback: function (r) {
        if (!r.exc) {
          const data = r.message;
          console.log(data);
          // Generate HTML
          let html = `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <style>
                .cards {
                  max-width: 1080px;
                  margin: 0 auto;
                  display: grid;
                  gap: 10px;
                  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                }
          
                .card {
                  background-color: #d9d9d9;
                  color: black;
                  border-radius: 10px;
                  border: none;
                  padding: 16px;
                } 

                .card-title {
                  font-size: 16px;
                }
                p.card-content {
                  font-weight: bold;
                  font-size: 18px;
                }
                .heading_cards p{
                  text-align: right;
                  margin-left: auto;
                  color: black;
                  font-weight: bold;
                  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
                  font-size: medium;
                }
                .heading_cards p span{
                  color: #3E9C35;
                }

                .heading_cards {
                 display:flex;
                 margin: 0 4px;
                }
                .heading_cards h3 {
                  color:black;
                  font-weight: 700;
                  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
                }
        
                /* Add responsive styles */
                @media only screen and (max-width: 600px) {
                  .heading h3 {
                    font-size: small; 
                  }   
               
                .cards {
                  display: grid;
                  row-gap: 10px;
                  grid-template-columns: repeat(2, minmax(0, 1fr)); /* Updated value */
                  padding: 10px;
                }
                p.card-content {
                  font-weight: bold;
                  font-size: 10px;
              }
              .card-title {
                font-size: 10px;
            }
            .card {
              border-radius: 5px;
              padding: 5px 0px 5px 12px;
            }
              }
              </style>
            </head>
            <body>
              <div class="heading_cards">
              <h3>${data.MonthName} ${data.FirstDayOfMonth} - ${
            data.MonthName
          } ${data.LastDayOfMonth}</h3>
              <p> Total: <span>  ${data.total_amount ?? 0} </span></p>
             </div>
              <div class="cards">
                <div class="card">
                  <div class="card-title">Daily Allowance</div>
                  <p class="card-content">₹${
                    data.total_daily_allowance ?? 0
                  }</p>
                </div>
                <div class="card">
                  <div class="card-title">Halting/Lodging</div>
                  <p class="card-content">₹${
                    data.total_haltinglodging_amount ?? 0
                  }</p>
                </div>
                
                <div class="card">
                  <div class="card-title">Fare Amount</div>
                  <p class="card-content">
                  ₹${data.total_fare_amount ?? 0}</p>
                </div>
                <div class="card">
                  <div class="card-title">Local Conveyance</div>
                  <p class="card-content">
                    ₹${data.total_local_conveyance_other_expenses ?? 0}
                  </p>
                </div>
              </div>
            </body>
          </html> `;

          // Set the above `html` as Summary HTML
          frm.set_df_property("total_amount_summary", "options", html);
        } else {
          frappe.msgprint("Error fetching total amounts");
        }
      },
    });
  },

  //Original code here
  // handle the ta_chart table to showing data
  async ta_chart_table_html(frm) {
    try {
      const childTableData = await frm.call({
        method: "get_child_table_data",
        args: {
          parent_docname: frm.doc.name,
        },
      });

      if (!childTableData.exc) {
        const html = childTableData.message;
        frm.set_df_property("ta_chart_table_summary", "options", html);
      } else {
        frappe.msgprint(
          "Error fetching child table data: " + childTableData.exc
        );
      }
    } catch (error) {
      console.error("Error fetching child table data:", error);
      frappe.msgprint("Error fetching child table data");
    }
  },

  // //handle the DA Claim Allowance
  get_da_claim(frm) {
    //frm.trigger("set_claim");

    if (frm.doc.from_location) {
      let da_category = frm.doc.da_claim; // Full Day or Half Day
      let category = frm.doc.category; // Designation category(level 1/2/3/4/5/6/7/8/)
      let cityClass = frm.doc.class_city; // Category of city a,b,c

      console.log(da_category);
      console.log(category);
      console.log(cityClass);

      // if (!da_category) {
      //   frm.set_value("daily_allowance", null);
      //   frm.refresh_field("daily_allowance");

      //   frappe.throw("Please Select DA Category");
      // } else {
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
            da_amount = r.message[0][`${cityClass}_class_city`];
            if (da_category == "Half Day") {
              da_amount = da_amount / 2;
              frm.set_value("daily_allowance", da_amount);
            } else if (da_category == "Full Day") {
              frm.set_value("daily_allowance", da_amount);
            }
          }
          console.log(frm.doc.daily_allowance);
          console.log(frm.doc.fare_amount);
          // console.log(frm.doc.halting_lodging_amount);
          // console.log(frm.doc.other_expenses_amount);
          // console.log(frm.doc.other_total_expense_amount);
          // console.log(frm.doc.fare_amount);
          let total_amount =
            (frm.doc.daily_allowance || 0) +
            (frm.doc.other_expenses_amount || 0) +
            frm.doc.fare_amount;

          console.log("Total Allowance in da_claim:", total_amount);
          frm.set_value("total_amount", total_amount.toFixed(2));
          frm.refresh_field("total_amount");
        },
      });
      //}
    }
  },

  check_da: function (frm) {
    if (frm.doc.check_da == 1) {
      console.log("DA Select value");
      frm.trigger("date_and_time_to");
      // frm.trigger("get_da_claim");
    }
  },

  // halting_lodging_select: function (frm) {
  //   let haltLodge = frm.doc.halting_lodging_select;
  //   console.log(haltLodge);

  //   if (haltLodge === "Lodging") {
  //     halt_lodge_amount = frm.doc.input_lodging_amt; // getting inputed value of lodging
  //     frm.set_value("halting_lodging_amount", halt_lodge_amount);
  //     frm.refresh_field("halting_lodging_amount");
  //   }
  //   frm.trigger("halting_lodging");
  // },

  // input_lodging_amt: function (frm) {
  //   frm.set_value("halting_lodging_amount", frm.doc.input_lodging_amt);
  //   frm.refresh_field("halting_lodging_amount");
  // },
  //handle halting and Lodging Allowances
  // halting_lodging_select: function (frm) {
  //   //<Taking Parameters to fetch Amount for Halting and Lodging>
  //   let category = frm.doc.category; // Designation category(level 1/2/3/4/5/6/7/8/)
  //   let cityClass = frm.doc.class_city; //Category of city a,b,c
  //   let haltLodge = frm.doc.halting_lodging_select; // selected value for halting/lodging
  //   if (frm.doc.from_location) {
  //     if (!haltLodge) {
  //       frm.set_value("daily_allowance", null);
  //       frm.refresh_field("daily_allowance");
  //       frappe.throw("Please Select Halting or Lodging !!");
  //     } else {
  //       frm.call({
  //         method: "findAllowance",
  //         args: {
  //           city_class: cityClass,
  //           category: category,
  //           halt_lodge: haltLodge,
  //         },
  //         callback: function (r) {
  //           if (!r.exc) {
  //             // Handle the result if needed
  //             // console.log(r.message); // This will contain the result from the server
  //             halt_lodge_amount = r.message[0][`${cityClass}_class_city`];
  //             if (haltLodge == "Halting") {
  //               frm.set_value("halting_lodging_amount", halt_lodge_amount);
  //               frm.refresh_field("halting_lodging_amount");
  //             } else if (haltLodge == "Lodging") {
  //               halt_lodge_amount = frm.doc.input_lodging_amt; // getting inputed value of lodging
  //               frm.set_value("halting_lodging_amount", halt_lodge_amount);
  //               frm.refresh_field("halting_lodging_amount");
  //             }
  //           }
  //           console.log(frm.doc.daily_allowance);
  //           console.log(frm.doc.halting_lodging_amount);
  //           console.log(frm.doc.fare_amount);
  //           // console.log(frm.doc.other_expenses_amount);
  //           let total_amount =
  //             (frm.doc.halting_lodging_amount || 0) +
  //             (frm.doc.other_expenses_amount || 0) +
  //             (frm.doc.fare_amount || 0);

  //           console.log("Total Allowance in halt/lodge:", total_amount);
  //           frm.set_value("total_amount", total_amount.toFixed(2));
  //           frm.refresh_field("total_amount");
  //         },
  //       });
  //     }
  //   }

  //   // }
  // },

  input_lodging_amt: function (frm) {
    let inputLodge = frm.doc.input_lodging_amt;
    console.log("inputLodge", inputLodge);
    frm.set_value("halting_lodging_amount", inputLodge);
    frm.refresh_field("halting_lodging_amount");
    updateTotalAmount(frm);
  },

  // halting_lodging_select: function (frm) {
  //   //<Taking Parameters to fetch Amount for Halting and Lodging>
  //   let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
  //   let cityClass = frm.doc.class_city; // Category of city a,b,c
  //   let haltLodge = frm.doc.halting_lodging_select; // selected value for halting/lodging

  //   if (frm.doc.from_location) {
  //     if (!haltLodge) {
  //       frm.set_value("daily_allowance", null);
  //       frm.refresh_field("daily_allowance");
  //       frappe.throw("Please Select Halting or Lodging !!");
  //     } else {
  //       if (haltLodge === "Halting") {
  //         frm.call({
  //           method: "findAllowance",
  //           args: {
  //             city_class: cityClass,
  //             category: category,
  //             halt_lodge: haltLodge,
  //           },
  //           callback: function (r) {
  //             if (!r.exc) {
  //               let halt_lodge_amount = r.message[0][`${cityClass}_class_city`];

  //               frm.set_value("halting_lodging_amount", halt_lodge_amount);
  //               frm.refresh_field("halting_lodging_amount");
  //               updateTotalAmount(frm);
  //             }
  //           },
  //         });
  //       }
  //     }
  //   }
  // },

  other_expenses_check: function (frm) {
    let checkOtherExpense = frm.doc.other_expenses_check;
    console.log("check value", checkOtherExpense);
    // Make other fields mandatory (example code)
    if (checkOtherExpense === "1") {
      frm.set_df_property("select_type_expenses", "reqd", true);
      frm.set_df_property("date_other_expense", "reqd", true);
      // Add a trigger when the form is refreshed
    }
  },

  //handle the local conveyance amount
  other_expenses_amount: function (frm) {
    let total_amount =
      (frm.doc.daily_allowance || 0) +
      (frm.doc.halting_lodging_amount || 0) +
      (frm.doc.other_expenses_amount || 0) +
      (frm.doc.fare_amount || 0);

    console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount.toFixed(2));
    frm.refresh_field("total_amount");
  },

  // local(other expense) date validation- between the range of from date and to date
  date_other_expense: function (frm) {
    var from_date = frm.doc.date_and_time_from;
    console.log(from_date);
    var modifiedfromDate = frappe.datetime.add_days(from_date, -1);
    console.log("Modified date:", modifiedfromDate);
    var to_date = frm.doc.date_and_time_to;
    console.log(to_date);
    var date_otherexpense = frm.doc.date_other_expense;

    if (date_otherexpense) {
      // Check if inbetween_date is within the range
      if (
        date_otherexpense > modifiedfromDate &&
        date_otherexpense <= to_date
      ) {
        console.log("from date:", from_date);
        console.log("to date:", to_date);
        frm.set_value("date_other_expense", date_otherexpense); // Set the valid in-between date
      } else {
        frappe.msgprint(
          __(
            "Your local date should be match with from date or to date or within this dates."
          )
        );
        frm.set_value("date_other_expense", ""); // Clear the invalid in-between date
      }
    }
  },

  //saving total allowance amount
  before_save(frm) {
    let total_amount = 0;

    if (frm.doc.daily_allowance) {
      total_amount =
        frm.doc.fare_amount +
        (frm.doc.daily_allowance || 0) +
        (frm.doc.other_expenses_amount || 0);
    } else if (frm.doc.halting_lodging_amount) {
      total_amount =
        frm.doc.fare_amount +
        (frm.doc.halting_lodging_amount || 0) +
        (frm.doc.other_expenses_amount || 0);
    } else {
      total_amount = 0;
    }

    console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount.toFixed(2));
    frm.refresh_field("total_amount");
  },

  //Handle Mode of travel function
  // ta_mode_of_transport: function (frm) {
  //   const carFare = 10;
  //   const bikeFare = 4;

  //   let fareAmount = 0;
  //   let totalKm = frm.doc.travel_km;
  //   let modeValue = frm.doc.ta_mode_of_transport;
  //   let ticketAmt = frm.doc.ticket_amount;
  //   console.log(modeValue);

  //   // frm.toggle_display("ticket", false);
  //   // frm.toggle_display("upload_ticket_image", false);
  //   // frm.toggle_display("fare_amount", false);

  //   if (modeValue === "Bike") {
  //     fareAmount = bikeFare * totalKm;
  //     frm.set_value("fare_amount", fareAmount);
  //   } else if (modeValue === "Car") {
  //     fareAmount = carFare * totalKm;
  //     frm.set_value("fare_amount", fareAmount);
  //   } else if (modeValue === "Bus" || modeValue === "Train") {
  //     frm.set_value("fare_amount", ticketAmt);
  //   }
  //   //else {
  //   //   frm.toggle_display("ticket", false);
  //   //   frm.toggle_display("upload_ticket_image", false);
  //   //   frm.toggle_display("fare_amount", false);
  //   //   fareAmount = 0;
  //   // }

  //   // Set the value of 'fare_amount' field for Bike and Car modes
  //   // frm.set_value("fare_amount", fareAmount);
  //   //frm.refresh_field("ticket");
  // },
  // ticket_amount: function (frm) {
  //   let ticketAmt = frm.doc.ticket_amount;
  //   frm.set_value("fare_amount", ticketAmt);
  //   /*arshad change*/ //frm.set_value("ticket", null);
  // },
  // travel_km: function (frm) {
  //   let totalKm = frm.doc.travel_km;
  //   frm.set_value("fare_amount", ticketAmt);
  //   /*arshad change*/ //frm.set_value("ticket", null);
  // },

  //New code
  // ta_mode_of_transport: function (frm) {
  //   let fareAmount = 0;

  //   let modeValue = frm.doc.ta_mode_of_transport;

  //   console.log("Mode of transport:", modeValue);
  //   switch (modeValue) {
  //     case "Bus":
  //     case "Train":
  //       fareAmount = ticketAmt;
  //       break;
  //     default:
  //       // Handle other cases if needed
  //       break;
  //   }

  //   frm.set_value("fare_amount", fareAmount);
  //   frm.refresh_field("fare_amount");
  //   console.log("Fare amount", fareAmount);
  // },

  // ticket_amount: function (frm) {
  //   let ticketAmt = frm.doc.ticket_amount;
  //   frm.set_value("fare_amount", ticketAmt);
  //   console.log(frm.doc.fare_amount);
  // },

  // travel_km: function (frm) {
  //   let totalKm = frm.doc.travel_km;
  //   let modeValue = frm.doc.ta_mode_of_transport;
  //   let fareAmount = 0;

  //   console.log("Km", totalKm);
  //   console.log(modeValue);

  //   switch (modeValue) {
  //     case "Bike":
  //       fareAmount = 4 * totalKm;
  //       break;
  //     case "Car":
  //       fareAmount = 10 * totalKm;
  //       break;
  //     // Handle other modes if needed
  //   }

  //   console.log(fareAmount);
  //   frm.set_value("fare_amount", fareAmount);
  // },

  ta_mode_of_transport: function (frm) {
    updateFareAmount(frm);
  },

  ticket_amount: function (frm) {
    frm.set_value("fare_amount", frm.doc.ticket_amount);
    console.log("Ticket amount:", frm.doc.ticket_amount);
  },

  travel_km: function (frm) {
    updateFareAmount(frm);
  },

  /* Saving data into child table TA */
  btn_add_ta: function (frm) {
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
    let taFareAmt = frm.doc.fare_amount;
    let taClassCity = frm.doc.class_city;
    let taTotalTime = frm.doc.total_visit_time;
    let taOtherExpense = frm.doc.other_expenses_amount;
    let taTotalAllowance = frm.doc.total_amount;
    let taExpenseType = frm.doc.select_type_expenses;
    let modeofTravel = frm.doc.mode_of_travel;
    let otherExpenseYesNo;
    if (frm.doc.other_expenses_check == "1") {
      otherExpenseYesNo = "Yes";
    } else {
      otherExpenseYesNo = "No";
    }
    if (!taFromLocation) {
      frappe.throw("Please Fill your Source Location");
    } else if (!taToLocation) {
      frappe.throw("Please Fill your Destination Location");
    } else if (!taPurpose) {
      frappe.throw("Please Fill your Reason of travelling");
      // } else if (!taDaClaim) {
      //   frappe.throw("Please Select DA Claim");
      // } else if (!taHaltingLodging) {
      //   frappe.throw("Please Select Halting/Lodging");
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
        fare_amount: taFareAmt,
        local_conveyance_other_expenses_amount: taOtherExpense,
        total: taTotalAllowance,
        local_expense_type: taExpenseType,
        mode_of_travel: modeofTravel,
        local_conveyance: otherExpenseYesNo,
      });
      frm.refresh_field("ta_chart");
      //save form after adding ta
      frm.save();

      //Set null of ta form
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
      frm.set_value("fare_amount", 0);
      frm.set_value("class_city", null);
      frm.set_value("total_visit_time", null);
      frm.set_value("total_amount", null);
      frm.set_value("other_expenses_check", 0);
      frm.set_value("select_type_expenses", null);
      frm.set_value("date_other_expense", null);
      frm.set_value("other_from", null);
      frm.set_value("other_to", null);
      frm.set_value("mode_of_travel", null);
      frm.set_value("purpose_other_expense", null);
      frm.set_value("other_expenses_amount", null);
      frm.set_value("ta_mode_of_transport", null);
      frm.set_value("travel_km", 0);
      frm.set_value("ticket_amount", 0);
      frm.set_value("input_lodging_amt", 0);

      frm.refresh_field("Travel Allowance");
    }
  },

  // button function to add data in TA child table
  btn_save_form: function (frm) {
    // let btnSave = 1;
    // console.log("button value=", btnSave);
  },

  CalculateAllowances(frm) {
    /**** for getting time in hours to unhidden DA and Halting/Lodging fields *****/
    var timeString = frm.doc.total_visit_time;
    // Split the time string into hours, minutes, and seconds
    var timeParts = timeString.split(":");
    // Extract the hours from the array
    var hours = parseInt(timeParts[0]);

    // Now 'hours' contains the hours from the time field
    console.log("Hours:", hours);

    // frm.toggle_display("da_claim", false);
    // frm.toggle_display("halting_lodging_select", false);
    if (hours <= 12) {
      // frm.toggle_display("da_claim", true);
      console.log("less than 12 hours");
      frm.set_value("da_claim", "Half Day");
      // frm.toggle_display("halting_lodging_select", false);
      // frm.set_value("halting_lodging_amount", 0);
      // frm.toggle_display("upload_image_of_lodging", false);
      frm.trigger("get_da_claim");
    } else if (hours > 12 && hours <= 24) {
      // frm.toggle_display("da_claim", true);
      console.log("less than 24 hours");
      frm.set_value("da_claim", "Full Day");
      // frm.toggle_display("halting_lodging_select", false);
      // frm.toggle_display("upload_image_of_lodging", false);
      // frm.set_value("halting_lodging_amount", 0);
      frm.trigger("get_da_claim");
    } else if (hours > 24) {
      // frm.toggle_display("halting_lodging_select", true);
      console.log("greater than 24 hours");
      // frm.toggle_display("da_claim", false);
      // frm.set_value("da_claim", "");
      // frm.refresh_field("da_claim");
      // frm.set_value("daily_allowance", 0);
    }
  },

  date_and_time_to: function (frm) {
    var dateAndTimeFrom = new Date(frm.doc.date_and_time_from);
    var dateAndTimeTo = new Date(frm.doc.date_and_time_to);

    // Check if both date and time values are valid
    if (!isNaN(dateAndTimeFrom) && !isNaN(dateAndTimeTo)) {
      // Check if 'date_and_time_from' is earlier than 'date_and_time_to'
      if (dateAndTimeTo >= dateAndTimeFrom) {
        var timeDifference = dateAndTimeTo - dateAndTimeFrom;
        console.log(dateAndTimeFrom, dateAndTimeTo, timeDifference); // Add this line for debugging
        var formattedTime = formatTimeDifference(timeDifference);
        console.log("total time is", formattedTime); // Add this line for debugging
        frm.set_value("total_visit_time", formattedTime);
      } else {
        // Clear total_visit_time if dates are not in order
        frappe.msgprint(
          __("End date and time should be greater than start date and time.")
        );
        frm.set_value("total_visit_time", "");
        frm.set_value("date_and_time_to", "");
        // frm.set_value("date_and_time_from", "");
      }
    } else {
      frm.set_value("total_visit_time", ""); // Clear total_visit_time if either date or time is invalid
    }

    function formatTimeDifference(timeDifference) {
      var totalMinutes = Math.floor(timeDifference / (60 * 1000));
      // var days = Math.floor(totalMinutes / (24 * 60));
      var hours = Math.floor((totalMinutes % (24 * 60 * 24)) / 60);
      var minutes = totalMinutes % 60;
      var seconds = minutes % 60;
      // Format the time as DD:HH:MM
      var formattedTime = `${padZero(hours)}:${padZero(minutes)}:${padZero(
        seconds
      )}`;
      //${padZero(days)}:
      return formattedTime;
    }

    function padZero(num) {
      return num.toString().padStart(2, "0");
    }

    frm.trigger("CalculateAllowances");
  },
});

function updateFareAmount(frm) {
  let fareAmount = 0;
  let modeValue = frm.doc.ta_mode_of_transport;
  let travelKM = frm.doc.travel_km;

  if (modeValue === "Bus" || modeValue === "Train") {
    fareAmount = frm.doc.ticket_amount;
  } else if (modeValue === "Bike") {
    fareAmount = 4 * travelKM;
  } else if (modeValue === "Car") {
    fareAmount = 10 * travelKM;
  }

  console.log("Mode of transport:", modeValue);
  console.log("Fare amount:", fareAmount);

  frm.set_value("fare_amount", fareAmount);
  frm.refresh_field("fare_amount");
}

function updateTotalAmount(frm) {
  let total_amount =
    (frm.doc.halting_lodging_amount || 0) +
    (frm.doc.other_expenses_amount || 0) +
    (frm.doc.fare_amount || 0);

  console.log("Total Allowance in halt/lodge:", total_amount);
  frm.set_value("total_amount", total_amount.toFixed(2));
  frm.refresh_field("total_amount");
}
