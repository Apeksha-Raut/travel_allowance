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
    // Validate the "from_location" field for alphabets and spaces
    var fieldValue = frm.doc.from_location;

    if (fieldValue && !/^[a-zA-Z\s]+$/.test(fieldValue)) {
      frappe.msgprint(
        __("Please enter only alphabet characters and spaces in From Location.")
      );
      frm.set_value("from_location", "");
    }
  },

  to_location: function (frm) {
    var source = frm.doc.from_location
      ? frm.doc.from_location.toLowerCase()
      : null;
    let destination = frm.doc.to_location
      ? frm.doc.to_location.toLowerCase()
      : null;

    if (source && destination && source === destination) {
      frappe.msgprint({
        title: __("Validation Error"),
        message: __("From Location and To Location should be different."),
        indicator: "red",
      });
      frm.set_value("to_location", "");
    }

    // check whether the destination field is Other
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

    // on change of destination location
    frm.trigger("select_allowance");
  },

  refresh: function (frm) {
    frm.set_value("total_amount", "");
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
      frm.add_custom_button(__("Submit"), function () {
        console.log("custom submit button");
      });
      frm.set_value("total_amount", "");
      frm.trigger("populate_total_amount_html");
      frm.trigger("ta_chart_table_html");
    }

    // (TA Add Button) adding CSS to button
    frm.fields_dict.btn_add_ta.$input.css({
      "background-color": "#4caf50",
      color: "#fff",
      padding: "10px 25px",
      border: "none",
      "border-radius": "4px",
      cursor: "pointer",
      "font-size": "16px",
      float: "right",
      "margin-bottom": "10px",
    });

    //(Local Add Button)adding css to button
    frm.fields_dict.btn_local_add.$input.css({
      "background-color": "#4CAF50",
      color: "#fff",
      border: "none",
      padding: "8px 22px",
      cursor: "pointer",
      width: "100%",
      "border-radius": "8px",
      "margin-top": " 23px",
    });

    // Make the entire "ta_chart" child table read-only
    // frm.fields_dict["ta_chart"].df.read_only = 1;

    // Refresh the form to apply the changes
    frm.refresh_fields();
  },

  //  to show the data as html with Fetching the data from the backend
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
                  grid-template-columns: repeat(5, minmax(0, 1fr)); /* Changed to divide into 5 equal columns */
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
                <div class="card-title">Fare Amount</div>
                <p class="card-content">
                   ₹${data.total_fare_amount ?? 0}</p>
              </div>
                <div class="card">
                  <div class="card-title">Daily Allowance</div>
                  <p class="card-content">₹${
                    data.total_daily_allowance ?? 0
                  }</p>
                </div>
                <div class="card">
                  <div class="card-title">Halting</div>
                  <p class="card-content">₹${data.total_halting_amount ?? 0}</p>
                </div>
                <div class="card">
                <div class="card-title">Lodging</div>
                <p class="card-content">₹${data.total_lodging_amount ?? 0}</p>
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

  // handle the ta_chart table to showing data of travel history
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

  async html_total_allowances_details(frm) {
    let html = `
        <style>
            .allowance {
                margin-bottom: 5px;
            }
            .allowance-name {
                display: inline-block;
                width: 200px; /* Adjust width as needed */
                font-weight: bold;
            }
            .amount {
                display: inline-block;
                font-weight:bold;
               
            }
        </style>
        <div>
            <h3>Allowances:</h3>
        </div>
    `;

    // Function to check if value is a number
    function isValidNumber(value) {
      return !isNaN(parseFloat(value)) && isFinite(value) && value !== 0;
    }

    // Generate HTML for each allowance if it's a valid number
    if (isValidNumber(frm.doc.daily_allowance)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Daily Allowance:</span>
                <span class="amount">${frm.doc.daily_allowance}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.fare_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Fare Amount:</span>
                <span class="amount">${frm.doc.fare_amount}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.other_expenses)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Other Expenses Amount:</span>
                <span class="amount">${frm.doc.other_expenses}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.halting_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Halting Amount:</span>
                <span class="amount">${frm.doc.halting_amount}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.lodging_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Lodging Amount:</span>
                <span class="amount">${frm.doc.lodging_amount}</span>
            </div>
        `;
    }

    if (isValidNumber(frm.doc.total_amount)) {
      html += `
            <div class="allowance">
                <span class="allowance-name">Total Amount:</span>
                <span class="amount">${frm.doc.total_amount}</span>
            </div>
        `;
    }

    // Set HTML content
    frm.set_df_property("html_total_allowances_details", "options", html);
  },
  // handle allowances according to the selected value
  select_allowance: function (frm) {
    let select_allowance = frm.doc.select_allowance;
    console.log("selected value of allowances:", select_allowance);

    if (select_allowance === "") {
      frm.set_value("da_claim", "");
      frm.set_value("daily_allowance", "");
      frm.set_value("halting_amount", "");
      frm.set_value("lodging_amount", "");
      frm.set_value("input_lodging_amt", "");
    } else if (select_allowance === "DA") {
      frm.set_value("halting_amount", "");
      frm.set_value("lodging_amount", "");
      frm.set_value("input_lodging_amt", "");
      console.log("DA Select value");
      frm.trigger("total_time_travel");
      frm.trigger("CalculateAllowances");
    } else if (select_allowance === "Halting") {
      frm.set_value("daily_allowance", "");
      frm.set_value("lodging_amount", "");
      frm.set_value("input_lodging_amt", "");
      console.log("Halting Selected value");
      frm.trigger("get_halting");
    } else if (select_allowance === "Lodging") {
      frm.set_value("halting_amount", "");
      frm.set_value("daily_allowance", "");
      console.log("Lodging Selected value");
    } else if (select_allowance === "DA with Lodging") {
      console.log("DA with Lodging Selected value");
      frm.set_value("halting_amount", "");
      frm.trigger("total_time_travel");
      frm.trigger("CalculateAllowances");
    }
  },

  date_and_time_from: function (frm) {
    frm.trigger("total_time_travel");
    // frm.trigger("select_allowance");
  },
  date_and_time_to(frm) {
    //console.log(frm.doc.date_and_time_to);
    frm.trigger("total_time_travel");
    frm.trigger("select_allowance");
  },

  // get_da_claim function fetching DA standard amount
  get_da_claim(frm) {
    if (frm.doc.from_location) {
      let da_category = frm.doc.da_claim; // "Nil", "Half Day", "Three Quarters Day", "Full Day", "Multiple Days"
      let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
      let cityClass = frm.doc.class_city; // Category of city a,b,c

      // // Logging inputs for debugging
      // console.log("da_category:", da_category);
      // console.log("category:", category);
      // console.log("cityClass:", cityClass);

      frm.call({
        method: "findAllowance",
        args: {
          city_class: cityClass,
          category: category,
          halt_lodge: "DA",
        },
        callback: function (r) {
          if (!r.exc) {
            console.log("Response from findAllowance:", r);
            let da_amount = r.message[0][`${cityClass}_class_city`];
            let da_amount_final = 0;
            let temp_amt = 0;

            // Calculate DA amount based on category
            switch (da_category) {
              case "Half Day":
                da_amount_final = da_amount / 2;
                break;
              case "Three Quarters Day":
                da_amount_final = (da_amount * 3) / 4;
                break;
              case "Full Day":
                da_amount_final = da_amount;
                break;
              case "Multiple Days":
                // Calculate DA amount for multiple days
                let totalVisitTime = frm.doc.total_visit_time;
                let timeParts = totalVisitTime.split(":");
                let hours = parseInt(timeParts[0]);
                let days = Math.floor(hours / 24);
                let remainingHours = hours % 24;

                da_amount_final = days * da_amount;

                // Additional amount for remaining hours
                if (remainingHours > 4 && remainingHours < 8) {
                  temp_amt = da_amount / 2;
                } else if (remainingHours >= 8 && remainingHours < 12) {
                  temp_amt = (da_amount * 3) / 4;
                } else if (remainingHours >= 12 && remainingHours <= 24) {
                  temp_amt = da_amount;
                }
                break;
              default:
                da_amount_final = 0;
            }

            // Set daily allowance
            frm.set_value("daily_allowance", da_amount_final + temp_amt);

            // Calculate total allowance
            let total_amount =
              (frm.doc.daily_allowance || 0) +
              (frm.doc.other_expenses || 0) +
              (frm.doc.fare_amount || 0) +
              (frm.doc.halting_amount || 0) +
              (frm.doc.lodging_amount || 0);

            // Set total amount
            frm.set_value("total_amount", total_amount);
            frm.refresh_field("total_amount");

            // Update total amount
            updateTotalAmount(frm);
          } else {
            console.error("Error while fetching DA amount:", r.exc);
            frappe.msgprint(
              "Error while fetching DA amount. Please try again."
            );
          }
        },
      });
    }
  },

  get_halting: function (frm) {
    //<Taking Parameters to fetch Amount for Halting and Lodging>
    let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
    let cityClass = frm.doc.class_city; // Category of city a,b,c
    let haltLodge = "Halting"; // selected value for halting
    let no_of_days = frm.doc.no_of_days;

    let days = Math.floor(no_of_days);
    if (frm.doc.from_location) {
      if (haltLodge === "Halting") {
        frm.call({
          method: "findAllowance",
          args: {
            city_class: cityClass,
            category: category,
            halt_lodge: haltLodge,
          },
          callback: function (r) {
            if (!r.exc) {
              let halt_amount = r.message[0][`${cityClass}_class_city`];
              if (days === 0) {
                frm.set_value("halting_amount", 0);
                frm.refresh_field("halting_amount");
                updateTotalAmount(frm);
              } else if (days === 1) {
                frm.set_value("halting_amount", halt_amount);
                frm.refresh_field("halting_amount");
                updateTotalAmount(frm);
              } else if (days > 1) {
                halt_amount = halt_amount * days;
                frm.set_value("halting_amount", halt_amount);
                frm.refresh_field("halting_amount");
                updateTotalAmount(frm);
              }
            }
          },
        });
      }
    }
  },

  // User's inputted value of lodging
  input_lodging_amt: function (frm) {
    let inputLodge = frm.doc.input_lodging_amt;
    console.log("inputLodge", inputLodge);
    frm.trigger("get_lodging"); // getting standard Lodging amount
  },

  get_lodging: function (frm) {
    //<Taking Parameters to fetch Amount for Halting and Lodging>
    let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
    let cityClass = frm.doc.class_city; // Category of city a,b,c
    let lodge = "Lodging"; // selected value for halting

    if (frm.doc.from_location) {
      if (lodge === "Lodging") {
        frm.call({
          method: "findAllowance",
          args: {
            city_class: cityClass,
            category: category,
            halt_lodge: lodge,
          },
          callback: function (r) {
            if (!r.exc) {
              let lodge_amount = r.message[0][`${cityClass}_class_city`];
              console.log("Standard Lodging Amount:", lodge_amount);

              let inputLodge = frm.doc.input_lodging_amt;
              console.log("inputLodge", inputLodge);
              if (inputLodge > lodge_amount) {
                console.log(
                  "your inputed lodging amount is greater than standard amount."
                );
                frm.set_value("lodging_amount", lodge_amount);
                frm.refresh_field("halting_amount");
              } else {
                frm.set_value("lodging_amount", inputLodge);
                frm.refresh_field("halting_amount");
              }

              updateTotalAmount(frm);
            }
          },
        });
      }
    }
  },

  // // calculating DA on total visiting time basis
  // CalculateAllowances(frm) {
  //   /**** for getting time in hours to unhidden DA and Halting/Lodging fields *****/
  //   var timeString = frm.doc.total_visit_time;
  //   // Split the time string into hours, minutes, and seconds
  //   var timeParts = timeString.split(":");
  //   // Extract the hours from the array
  //   var hours = parseInt(timeParts[0]);

  //   // Now 'hours' contains the hours from the time field
  //   console.log("Hours:", hours);

  //   // Calculate days from hours
  //   var days = Math.floor(hours / 24);
  //   console.log("Days:", days);

  //   // Calculate remaining hours after converting to days
  //   var remainingHours = hours % 24;

  //   console.log("Remaining Hours:", remainingHours);

  //   if (hours <= 4) {
  //     console.log("Absence not exceeding 4 hours");
  //     frm.set_value("da_claim", "");
  //   } else if (hours > 4 && hours <= 8) {
  //     console.log("Absence exceeding 4 hours but less than 8 hours");
  //     frm.set_value("da_claim", "50% of DA");
  //   } else if (hours > 8 && hours <= 12) {
  //     console.log("Absence exceeding 8 hours but less than 12 hours");
  //     frm.set_value("da_claim", "75% of DA");
  //   } else if (hours > 12) {
  //     console.log("Absence exceeding 12 hours");
  //     frm.set_value("da_claim", "100% of DA");
  //   }
  // },

  // calculating DA on total visiting time basis
  CalculateAllowances(frm) {
    var timeString = frm.doc.total_visit_time;
    var timeParts = timeString.split(":");
    var hours = parseInt(timeParts[0]);

    console.log("Hours:", hours);

    if (hours <= 4) {
      frm.set_value("da_claim", "NA");
      frm
        .get_field("da_claim")
        .set_description(
          "<span style='color:red;'>You are not eligible for Daily Allowance (DA) as the total visit time is less than or equal to 4 hours.</span>"
        );
      frm.trigger("get_da_claim");
    } else if (hours > 4 && hours < 8) {
      frm.set_value("da_claim", "Half Day");
      frm
        .get_field("da_claim")
        .set_description(
          "<span style='color:green;'>You are eligible for 50% of Daily Allowance (DA) as the total visit time exceeds 4 hours but is less than 8 hours.</span>"
        );
      frm.trigger("get_da_claim");
    } else if (hours >= 8 && hours < 12) {
      frm.set_value("da_claim", "Three Quarters Day");
      frm
        .get_field("da_claim")
        .set_description(
          "<span style='color:blue;'>You are eligible for 75% of Daily Allowance (DA) as the total visit time exceeds 8 hours but is less than 12 hours.</span>"
        );
      frm.trigger("get_da_claim");
    } else if (hours >= 12 && hours <= 24) {
      frm.set_value("da_claim", "Full Day");
      frm
        .get_field("da_claim")
        .set_description(
          "<span style='color:purple;'>You are eligible for 100% of Daily Allowance (DA) as the total visit time exceeds 12 hours.</span>"
        );
      frm.trigger("get_da_claim");
    } else if (hours > 24) {
      frm.set_value("da_claim", "Multiple Days");
      frm
        .get_field("da_claim")
        .set_description(
          "<span style='color:#8b8b07;'>You are eligible for Daily Allowance (DA) for multiple days as the total visit time exceeds 24 hours.</span>"
        );
      frm.trigger("get_da_claim");
    }
  },

  total_time_travel: function (frm) {
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
        // Calculate days and remaining hours
        let timeParts = formattedTime.split(":");
        let hours = parseInt(timeParts[0]);
        let days = Math.floor(hours / 24);
        let remainingHours = hours % 24;

        // Construct the message based on days and remaining hours
        var message = "";
        if (days > 0) {
          message += `${days} day`;
          if (days !== 1) {
            message += "s"; // Add 's' only if days is not equal to 1
          }
          if (remainingHours > 0) {
            message += " and ";
          }
        }
        if (remainingHours > 0) {
          message += `${remainingHours} hour`;
          if (remainingHours !== 1) {
            message += "s"; // Add 's' only if remainingHours is not equal to 1
          }
        }
        message += "."; // Add a period at the end of the sentence

        // Show total visiting time to the user
        var totalVisitTimeText = `<div style="font-weight: bold; color: #007bff;">Your total visiting time is ${message}</div>`;
        // Replace the 'your_div_id' with the ID of the div where you want to display the text
        $(frm.wrapper).find("#total_time_text").html(totalVisitTimeText);

        frm.set_value("no_of_days", days + "." + remainingHours);
      } else {
        // Clear total_visit_time if dates are not in order
        frappe.msgprint(
          __("End date and time should be greater than start date and time.")
        );

        // Clear the div content
        $(frm.wrapper).find("#total_time_text").html("");
        frm.set_value("total_visit_time", "");
        frm.set_value("date_and_time_to", "");
        // frm.set_value("date_and_time_from", "");
      }
    } else {
      // Clear the div if either date or time is invalid
      $(frm.wrapper).find("#total_time_text").html("");
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
  },

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

  // //handle the local conveyance amount
  // other_expenses_amount: function (frm) {
  //   frm.set_value("other_expenses", frm.doc.other_expenses_amount);
  //   let total_amount =
  //     (frm.doc.daily_allowance || 0) +
  //     (frm.doc.other_expenses_amount || 0) +
  //     (frm.doc.fare_amount || 0) +
  //     (frm.doc.halting_amount || 0) +
  //     (frm.doc.lodging_amount || 0);

  //   console.log("Total Allowance:", total_amount);
  //   frm.set_value("total_amount", total_amount);
  //   frm.refresh_field("total_amount");

  //   updateTotalAmount(frm);
  // },
  //handle the local conveyance amount
  other_expenses: function (frm) {
    // frm.set_value("other_expenses", frm.doc.other_expenses_amount);
    let total_amount =
      (frm.doc.daily_allowance || 0) +
      (frm.doc.other_expenses || 0) +
      (frm.doc.fare_amount || 0) +
      (frm.doc.halting_amount || 0) +
      (frm.doc.lodging_amount || 0);

    console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount);
    frm.refresh_field("total_amount");

    updateTotalAmount(frm);
  },

  // local(other expense) date validation- between the range of from date and to date
  date_other_expense: function (frm) {
    var from_date = frm.doc.date_and_time_from;
    // console.log(from_date);
    var modifiedfromDate = frappe.datetime.add_days(from_date, -1);
    // console.log("Modified date:", modifiedfromDate);
    var to_date = frm.doc.date_and_time_to;
    // console.log(to_date);
    var date_otherexpense = frm.doc.date_other_expense;

    if (date_otherexpense) {
      // Check if inbetween_date is within the range
      if (
        date_otherexpense > modifiedfromDate &&
        date_otherexpense <= to_date
      ) {
        // console.log("from date:", from_date);
        // console.log("to date:", to_date);
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

    total_amount =
      (frm.doc.daily_allowance || 0) +
      (frm.doc.other_expenses || 0) +
      (frm.doc.fare_amount || 0) +
      (frm.doc.halting_amount || 0) +
      (frm.doc.lodging_amount || 0);

    // console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount);
    frm.refresh_field("total_amount");
  },

  ta_mode_of_transport: function (frm) {
    updateFareAmount(frm);
  },

  ticket_amount: function (frm) {
    frm.set_value("fare_amount", frm.doc.ticket_amount);
    // console.log("Ticket amount:", frm.doc.ticket_amount);
  },

  travel_km: function (frm) {
    updateFareAmount(frm);
  },

  // // button function to add data in TA child table
  // btn_add_journey: function (frm) {
  //   console.log("button add journey");
  //   let fromLoc = frm.doc.from_location;
  //   let dateTimeFrom = frm.doc.date_and_time_from;
  //   let toLoc = frm.doc.to_location;
  //   let OtherLoc = frm.doc.other_to_location;
  // },

  // Saving data into child table of local conveyance
  btn_local_add: function (frm) {
    let localFrom = frm.doc.other_from;
    let localTo = frm.doc.other_to;
    let localTypeExpense = frm.doc.select_type_expenses;
    let localDate = frm.doc.date_other_expense;
    let localModeTravl = frm.doc.mode_of_travel;
    let localExpenseAmt = frm.doc.other_expenses_amount;
    let localPurpose = frm.doc.purpose_other_expense;

    if (!localFrom) {
      frappe.throw("Please Fill your From Location in Local Expenses");
    } else if (!localTo) {
      frappe.throw("Please Fill your To Location in Local Expenses");
    } else {
      let row = frm.add_child("local_conveyance_tbl", {
        type_of_expenses: localTypeExpense,
        date: localDate,
        from: localFrom,
        to: localTo,
        mode_of_travel: localModeTravl,
        amount: localExpenseAmt,
        purpose: localPurpose,
      });
      frm.refresh_field("local_conveyance_tbl");
      // Clear the fields after adding data
      frm.set_value("other_from", "");
      frm.set_value("other_to", "");
      frm.set_value("select_type_expenses", "");
      frm.set_value("date_other_expense", "");
      frm.set_value("mode_of_travel", "");
      frm.set_value("other_expenses_amount", "");
      frm.set_value("purpose_other_expense", "");

      // Reset total amount to zero before recalculating
      frm.set_value("other_expenses", 0);

      // Fetch and populate Local Conveyance data
      // Fetch and populate Local Conveyance data
      frm.call({
        method: "get_local_amount",
        args: {
          parent_docname: frm.doc.name,
        },
        callback: function (r) {
          if (r.message && r.message.length > 0) {
            console.log("Local data:", r.message);

            // Calculate total local conveyance amount from all records
            var totalLocalConveyanceAmount = 0;
            r.message.forEach(function (record) {
              if (record.local_conveyance_other_expenses_amount) {
                totalLocalConveyanceAmount += parseFloat(
                  record.local_conveyance_other_expenses_amount
                );
              }
            });
            console.log(
              "Total Local Conveyance Amount:",
              totalLocalConveyanceAmount
            );

            // Calculate and update total amount for the current form
            let totalLocalAmt = 0;
            frm.doc.local_conveyance_tbl.forEach(function (row) {
              totalLocalAmt += row.amount;
            });

            console.log("Total Local Amount:", totalLocalAmt);
            // Update the total amount field
            frm.set_value(
              "other_expenses",
              totalLocalAmt - totalLocalConveyanceAmount
            );
            console.log("other_expenses:", frm.doc.other_expenses);
          } else {
            // No local conveyance data found, set total to 0

            // frm.set_value("other_expenses", 0);
            console.log("No local conveyance data found.");
            // Calculate and update total amount for the current form
            let totalLocalAmt = 0;
            frm.doc.local_conveyance_tbl.forEach(function (row) {
              totalLocalAmt += row.amount;
            });

            console.log("Total Local Amount:", totalLocalAmt);
            // Update the total amount field
            frm.set_value("other_expenses", totalLocalAmt);
            console.log("other_expenses:", frm.doc.other_expenses);
          }
        },
      });
    }
  },

  // Saving data into child table TA
  btn_add_ta: function (frm) {
    let taFromLocation = frm.doc.from_location;
    let tadateTimeFrom = frm.doc.date_and_time_from;
    let taToLocation = frm.doc.to_location;
    let taOtherLocation = frm.doc.other_to_location;
    let tadateTimeTo = frm.doc.date_and_time_to;
    let taPurpose = frm.doc.purpose;
    let taTotalTime = frm.doc.total_visit_time;
    let taClassCity = frm.doc.class_city;
    let taModeOfTransport = frm.doc.ta_mode_of_transport;
    let taTotalKM = frm.doc.travel_km;
    let taFareAmt = frm.doc.fare_amount;
    let taDaClaim = frm.doc.da_claim;
    let taDaAmount = frm.doc.daily_allowance;
    let taHaltingAmt = frm.doc.halting_amount;
    let taLodgingAmt = frm.doc.lodging_amount;
    let taOtherExpense = frm.doc.other_expenses;
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
      frappe.throw("Please fill your Source Location");
    } else if (!taToLocation) {
      frappe.throw("Please fill your Destination Location");
    } else if (!taPurpose) {
      frappe.throw("Please fill your Reason of travelling");
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
        mode_of_transport: taModeOfTransport,
        kilometer_of_travelling: taTotalKM,
        fare_amount: taFareAmt,
        da_claim: taDaClaim,
        daily_allowance: taDaAmount,
        halting_amount: taHaltingAmt,
        lodging_amount: taLodgingAmt,
        local_conveyance_other_expenses_amount: taOtherExpense,
        total: taTotalAllowance,
        local_expense_type: taExpenseType,
        mode_of_travel: modeofTravel,
        local_conveyance: otherExpenseYesNo,
      });

      frm.refresh_field("ta_chart"); // save form after adding ta
      frm.save(); // Set null of ta form
      frm.set_value("from_location", null);
      frm.set_value("date_and_time_from", null);
      frm.set_value("to_location", null);
      frm.set_value("other_to_location", null);
      frm.set_value("date_and_time_to", null);
      frm.set_value("purpose", null);
      frm.set_value("da_claim", null);
      frm.set_value("daily_allowance", 0);
      frm.set_value("ta_mode_of_transport", null);
      frm.set_value("fare_amount", 0);
      frm.set_value("upload_ticket", null);
      frm.set_value("class_city", null);
      frm.set_value("total_visit_time", null);
      frm.set_value("do_you_want_apply_allowances", 0);
      frm.set_value("select_allowance", null);
      frm.set_value("upload_image_of_lodging", null);
      frm.set_value("total_amount", 0);
      frm.set_value("halting_amount", 0);
      frm.set_value("lodging_amount", 0);
      frm.set_value("other_expenses_check", 0);
      frm.set_value("select_type_expenses", null);
      frm.set_value("date_other_expense", null);
      frm.set_value("other_from", null);
      frm.set_value("other_to", null);
      frm.set_value("mode_of_travel", null);
      frm.set_value("purpose_other_expense", null);
      frm.set_value("other_expenses", 0);
      frm.set_value("ta_mode_of_transport", null);
      frm.set_value("travel_km", 0);
      frm.set_value("ticket_amount", 0);
      frm.set_value("input_lodging_amt", 0);
      frm.refresh_field("Travel Allowance");
    }
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

  // console.log("Mode of transport:", modeValue);
  // console.log("Fare amount:", fareAmount);

  frm.set_value("fare_amount", fareAmount);
  frm.refresh_field("fare_amount");

  updateTotalAmount(frm);
}

function updateTotalAmount(frm) {
  let total_amount =
    (frm.doc.daily_allowance || 0) +
    (frm.doc.other_expenses || 0) +
    (frm.doc.fare_amount || 0) +
    (frm.doc.halting_amount || 0) +
    (frm.doc.lodging_amount || 0);

  console.log("Total Allowance:", total_amount);
  frm.set_value("total_amount", total_amount);
  frm.refresh_field("total_amount");

  frm.trigger("html_total_allowances_details");
}
