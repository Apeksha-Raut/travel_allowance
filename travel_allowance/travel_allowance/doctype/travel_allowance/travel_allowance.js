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
    // frm.set_value("total_amount", 0);
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
      frm.set_value("total_amount", 0);
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

    // //(TA Add Button)adding css to button
    // frm.fields_dict.btn_add_journey.$input.css({
    //   "background-color": "#4CAF50",
    //   color: "#fff",
    //   border: "none",
    //   padding: "8px 22px",
    //   cursor: "pointer",
    //   width: "100%",
    //   "border-radius": "12px",
    // });

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

  // handle allowances according to the selected value
  select_allowance: function (frm) {
    let select_allowance = frm.doc.select_allowance;
    console.log("selected value of allowances:", select_allowance);

    if (select_allowance === "") {
      frm.set_value("da_claim", "");
      frm.set_value("daily_allowance", 0);
      frm.set_value("halting_amount", 0);
      frm.set_value("lodging_amount", 0);
      frm.set_value("input_lodging_amt", 0);
    } else if (select_allowance === "DA") {
      frm.set_value("halting_amount", 0);
      frm.set_value("lodging_amount", 0);
      frm.set_value("input_lodging_amt", 0);
      console.log("DA Select value");
      frm.trigger("total_time_travel");
    } else if (select_allowance === "Halting") {
      frm.set_value("daily_allowance", 0);
      frm.set_value("lodging_amount", 0);
      frm.set_value("input_lodging_amt", 0);
      console.log("Halting Selected value");
      frm.trigger("get_halting");
    } else if (select_allowance === "Lodging") {
      frm.set_value("halting_amount", 0);
      frm.set_value("daily_allowance", 0);
      console.log("Lodging Selected value");
    } else if (select_allowance === "DA with Lodging") {
      console.log("DA with Lodging Selected value");
      frm.set_value("halting_amount", 0);
      frm.trigger("total_time_travel");
    }
  },

  date_and_time_to(frm) {
    //console.log(frm.doc.date_and_time_to);
    frm.trigger("total_time_travel");
    frm.trigger("select_allowance");
  },

  // // handle the DA Claim Allowance
  // get_da_claim(frm) {
  //   if (frm.doc.from_location) {
  //     let da_category = frm.doc.da_claim; // Full Day or Half Day
  //     let category = frm.doc.category; // Designation category(level 1/2/3/4/5/6/7/8/)
  //     let cityClass = frm.doc.class_city; // Category of city a,b,c

  //     console.log(da_category);
  //     console.log(category);
  //     console.log(cityClass);

  //     frm.call({
  //       method: "findAllowance",
  //       args: {
  //         city_class: cityClass,
  //         category: category,
  //         halt_lodge: "DA",
  //       },
  //       callback: function (r) {
  //         if (!r.exc) {
  //           da_amount = r.message[0][`${cityClass}_class_city`];
  //           if (da_category == "Half Day") {
  //             da_amount = da_amount / 2;
  //             frm.set_value("daily_allowance", da_amount);
  //           } else if (da_category == "Full Day") {
  //             frm.set_value("daily_allowance", da_amount);
  //           }
  //         }
  //         console.log(frm.doc.daily_allowance);
  //         console.log(frm.doc.fare_amount);

  //         let total_amount =
  //           (frm.doc.daily_allowance || 0) +
  //           (frm.doc.other_expenses_amount || 0) +
  //           (frm.doc.fare_amount || 0) +
  //           (frm.doc.halting_amount || 0) +
  //           (frm.doc.lodging_amount || 0);

  //         console.log("Total Allowance in da_claim:", total_amount);
  //         frm.set_value("total_amount", total_amount.toFixed(2));
  //         frm.refresh_field("total_amount");
  //       },
  //     });
  //   }
  // },

  // get_da_claim function fetching DA standard amount
  get_da_claim(frm) {
    if (frm.doc.from_location) {
      let da_category = frm.doc.da_claim; // "Nil", "Half Day", "Three Quarters Day", "Full Day", "Multiple Days"
      let category = frm.doc.category; // Designation category (level 1/2/3/4/5/6/7/8/)
      let cityClass = frm.doc.class_city; // Category of city a,b,c

      console.log(da_category);
      console.log(category);
      console.log(cityClass);

      frm.call({
        method: "findAllowance",
        args: {
          city_class: cityClass,
          category: category,
          halt_lodge: "DA",
        },
        callback: function (r) {
          if (!r.exc) {
            console.log("response", r);
            let da_amount = r.message[0][`${cityClass}_class_city`];
            let da_amount_final;
            let temp_amt = 0;
            if (da_category === "NA") {
              da_amount = 0;
            } else if (da_category === "Half Day") {
              da_amount /= 2;
            } else if (da_category === "Three Quarters Day") {
              da_amount = (da_amount * 3) / 4;
            } else if (da_category === "Full Day") {
              // No change to da_amount
            } else if (da_category === "Multiple Days") {
              // Calculate the amount for multiple days
              let totalVisitTime = frm.doc.total_visit_time;
              let timeParts = totalVisitTime.split(":");
              let hours = parseInt(timeParts[0]);
              let days = Math.floor(hours / 24);
              let remainingHours = hours % 24;

              da_amount_final = days * da_amount;
              console.log("da_amount in days:", da_amount_final);
              console.log("Remaining hours:", remainingHours);

              if (remainingHours > 0 && remainingHours <= 4) {
                // No additional amount for remaining hours up to 4 hours
              } else if (remainingHours > 4 && remainingHours < 8) {
                // Add 50% of the daily allowance proportionally
                temp_amt = da_amount / 2;
                console.log("da_amount:", da_amount);
              } else if (remainingHours >= 8 && remainingHours < 12) {
                temp_amt = (da_amount * 3) / 4; // 75% of daily allowance for remaining hours between 8 and 12 hours
              } else if (remainingHours >= 12 && remainingHours <= 24) {
                temp_amt = da_amount; // Full daily allowance for remaining hours between 12 and 24 hours
              }
            }

            console.log("total DA is:", da_amount_final + temp_amt);
            frm.set_value("daily_allowance", da_amount_final + temp_amt);

            let total_amount =
              (frm.doc.daily_allowance || 0) +
              (frm.doc.other_expenses_amount || 0) +
              (frm.doc.fare_amount || 0) +
              (frm.doc.halting_amount || 0) +
              (frm.doc.lodging_amount || 0);

            console.log("Total Allowance in get_da_claim:", total_amount);
            frm.set_value("total_amount", total_amount.toFixed(2));
            frm.refresh_field("total_amount");
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

              frm.set_value("halting_amount", halt_amount);
              frm.refresh_field("halting_amount");
              updateTotalAmount(frm);
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

  // CalculateAllowances(frm) {
  //   var timeString = frm.doc.total_visit_time;
  //   var timeParts = timeString.split(":");
  //   var hours = parseInt(timeParts[0]);

  //   // Calculate days from hours
  //   var days = Math.floor(hours / 24); // Get the whole number of days
  //   var remainingHours = hours % 24; // Get the remaining hours after subtracting full days

  //   // Loop through each full day
  //   for (var i = 0; i < days; i++) {
  //     // Set DA claim for full days
  //     setDAClaimForDay(i + 1, 24);
  //   }

  //   // Calculate DA claim for the last partial day
  //   if (remainingHours <= 4) {
  //     console.log("Last day: Absence not exceeding 4 hours");
  //     frm.set_value("da_claim", "");
  //   } else if (remainingHours > 4 && remainingHours <= 8) {
  //     console.log("Last day: Absence exceeding 4 hours but less than 8 hours");
  //     frm.set_value("da_claim", "50% of DA");
  //   } else if (remainingHours > 8 && remainingHours <= 12) {
  //     console.log("Last day: Absence exceeding 8 hours but less than 12 hours");
  //     frm.set_value("da_claim", "75% of DA");
  //   } else if (remainingHours > 12) {
  //     console.log("Last day: Absence exceeding 12 hours");
  //     frm.set_value("da_claim", "100% of DA");
  //   }

  //   function setDAClaimForDay(dayNumber, dayHours) {
  //     if (dayHours <= 4) {
  //       console.log("Day " + dayNumber + ": Absence not exceeding 4 hours");
  //     } else if (dayHours > 4 && dayHours <= 8) {
  //       console.log(
  //         "Day " +
  //           dayNumber +
  //           ": Absence exceeding 4 hours but less than 8 hours"
  //       );
  //     } else if (dayHours > 8 && dayHours <= 12) {
  //       console.log(
  //         "Day " +
  //           dayNumber +
  //           ": Absence exceeding 8 hours but less than 12 hours"
  //       );
  //     } else if (dayHours > 12) {
  //       console.log("Day " + dayNumber + ": Absence exceeding 12 hours");
  //     }
  //   }
  // },

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

  // CalculateAllowances(frm) {
  //   var timeString = frm.doc.total_visit_time;
  //   var timeParts = timeString.split(":");
  //   var hours = parseInt(timeParts[0]);

  //   // Calculate days from hours
  //   var days = Math.floor(hours / 24); // Get the whole number of days
  //   var remainingHours = hours % 24; // Get the remaining hours after subtracting full days

  //   var da_claim = "";

  //   // Loop through each full day
  //   for (var i = 0; i < days; i++) {
  //     // Set DA claim for full days
  //     da_claim += "Day " + (i + 1) + ": 100% of DA, "; // Add comma between multiple days
  //   }

  //   // Calculate DA claim for the last partial day
  //   if (remainingHours <= 4) {
  //     da_claim += "";
  //   } else if (remainingHours > 4 && remainingHours <= 8) {
  //     da_claim += "Day " + (days + 1) + ": 50% of DA";
  //   } else if (remainingHours > 8 && remainingHours <= 12) {
  //     da_claim += "Day " + (days + 1) + ": 75% of DA";
  //   } else if (remainingHours > 12) {
  //     da_claim += "Day " + (days + 1) + ": 100% of DA";
  //   }

  //   frm.set_value("da_claim", da_claim);
  //   frm.refresh_field("da_claim");
  //   frm.trigger("get_da_claim"); // Call get_da_claim function after setting da_claim
  // },

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

    frm.trigger("CalculateAllowances");
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

  //handle the local conveyance amount
  other_expenses_amount: function (frm) {
    let total_amount =
      (frm.doc.daily_allowance || 0) +
      (frm.doc.other_expenses_amount || 0) +
      (frm.doc.fare_amount || 0) +
      (frm.doc.halting_amount || 0) +
      (frm.doc.lodging_amount || 0);

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
        (frm.doc.daily_allowance || 0) +
        (frm.doc.other_expenses_amount || 0) +
        (frm.doc.fare_amount || 0) +
        (frm.doc.halting_amount || 0) +
        (frm.doc.lodging_amount || 0);
    } else {
      total_amount = 0;
    }

    console.log("Total Allowance:", total_amount);
    frm.set_value("total_amount", total_amount.toFixed(2));
    frm.refresh_field("total_amount");
  },

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

  // // button function to add data in TA child table
  // btn_add_journey: function (frm) {
  //   console.log("button add journey");
  //   let fromLoc = frm.doc.from_location;
  //   let dateTimeFrom = frm.doc.date_and_time_from;
  //   let toLoc = frm.doc.to_location;
  //   let OtherLoc = frm.doc.other_to_location;

  // },

  /* Saving data into child table TA */
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
        mode_of_transport: taModeOfTransport,
        kilometer_of_travelling: taTotalKM,
        fare_amount: taFareAmt,
        da_claimed: taDaClaim,
        daily_allowance: taDaAmount,
        halting_amount: taHaltingAmt,
        lodging_amount: taLodgingAmt,
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
      frm.set_value("daily_allowance", 0);
      frm.set_value("ta_mode_of_transport", null);
      frm.set_value("fare_amount", 0);
      frm.set_value("upload_ticket", null);
      frm.set_value("class_city", null);
      frm.set_value("total_visit_time", null);
      frm.set_value("do_you_want_apply_allowances", 0);
      frm.set_value("select_allowance", null);
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
      frm.set_value("other_expenses_amount", null);
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

  console.log("Mode of transport:", modeValue);
  console.log("Fare amount:", fareAmount);

  frm.set_value("fare_amount", fareAmount);
  frm.refresh_field("fare_amount");

  updateTotalAmount(frm);
}

function updateTotalAmount(frm) {
  let total_amount =
    (frm.doc.daily_allowance || 0) +
    (frm.doc.other_expenses_amount || 0) +
    (frm.doc.fare_amount || 0) +
    (frm.doc.halting_amount || 0) +
    (frm.doc.lodging_amount || 0);

  console.log("Total Allowance in halt/lodge:", total_amount);
  frm.set_value("total_amount", total_amount.toFixed(2));
  frm.refresh_field("total_amount");
}
