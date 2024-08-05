// Copyright (c) 2024, Apeksha Raut and contributors
// For license information, please see license.txt

frappe.ui.form.on("TA Approval", {
  refresh: function (frm) {
    $("span.sidebar-toggle-btn").hide();
    $(".col-lg-2.layout-side-section").hide();
    frm.disable_save();
    // Add custom button 'Go To Home'
    frm
      .add_custom_button(__("Go To Home"), function () {
        // Define the action for the button
        // Redirect to home page or any other action
        window.location.href = "/app/e-travel"; // Adjust the URL as needed
      })
      .css({
        "background-color": "#2490ef",
        color: "white",
      });

    frm.trigger("populate_employee_ta_status");
  },
  async populate_employee_ta_status(frm) {
    // Get the current logged-in user's ID
    let userId = frappe.session.user;

    console.log("loggin user:", userId);

    frm.call({
      method:
        "travel_allowance.travel_allowance.doctype.ta_approval.ta_approval.get_employee_ta_records",
      args: {
        user_id: userId,
      },
      callback: function (response) {
        // Handle the response as per your application logic
        if (response && response.message) {
          // Process the data returned from the server
          console.log(response.message);

          let data = response.message;
          // Extract travel allowance records and employee names
          let taRecords = data.travel_allowance_records;
          let employeeNames = data.employee_names;

          console.log("Travel Allowance Records:", taRecords);
          console.log("Employee Names:", employeeNames);

          // Generate the employee ID list for further use
          // let employeeIds = employeeNames.map((emp) => emp.employee_id);
          // console.log("Employee IDs:", employeeIds);

          // Generate employee record counts
          let employeeRecordCounts = {};
          taRecords.forEach((record) => {
            if (!employeeRecordCounts[record.employee_name]) {
              employeeRecordCounts[record.employee_name] = 0;
            }
            employeeRecordCounts[record.employee_name]++;
          });
          console.log("Employee Record Counts:", employeeRecordCounts);

          // console.log("data:", data);
          // Count of pending records
          let count = taRecords.length;

          // Function to format date and time
          function formatDateTime(dateTime) {
            let options = {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            };
            let date = new Date(dateTime);
            return date.toLocaleString("en-GB", options).replace(",", "");
          }

          // Generate detailed HTML content
          let html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Pending Travel Allowance Records</title>

              <style>

                /* Navbar styles */
                .ta_navbar {
                  display: flex;
                  margin-bottom: 15px;
                  font-size: 16px;
                  position: sticky;
                  top: 0;
                  background-color: #fff; /* Ensure background color covers content behind */
                  z-index: 1000; /* Ensure it stays above other content */
                  justify-content: space-between;
                  align-items: center;
                  flex-wrap: wrap;
                }

                .ta_navbar div{
                  padding: 10px 20px;
                  cursor: pointer;
                }


                .ta_navbar .active {
                  font-weight: bold;
                  border-bottom: 2px solid red;
                }

                .ta-nav-item{
                  list-style:none;
                  margin: 10px 0;
                }
                .ta-nav-link{
                  border: 1px solid transparent;
                  border-top-left-radius: 0.25rem;
                  border-top-right-radius: 0.25rem;
                  padding: 0.5rem 1rem;
                  margin-right: 0.2rem;
                  color: #495057;
                  background-color: #f8f9fa;
                  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
                }
                .ta-nav-link:hover,
                .ta-nav-link:focus{
                  text-decoration:none;
                  font-weight: bold;
                  border-bottom: 2px solid red;
                  outline:none;
                }

                /* Pending count styles */
                .pending-count {
                  color: red;
                  font-weight: bold;
                  margin-left: 5px;
                }


                /* Count span styles */
                .count {
                  font-weight: bold;
                  margin-left: 5px;
                }


                .main-container{
                  border: 1px solid #ddd;
                  border-radius: 10px;
                  
                }
                /* Card container styles */
                .card-container {
                  max-height: calc(100vh - 60px); /* Adjust height based on the height of the sticky navbar */
                  overflow-y: auto; /* Enable vertical scrolling */
                  margin: 0px 4px;
                }
                .card {
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  height: 340px;
                  position: relative;
                  margin-bottom: 20px;
                  position: relative;
                  background-color: #E8F3FC;

                }
                .card-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  background-color:#E8F3FC;
                  border-radius:10px;
                  padding: 8px 10px;
                }
                .card-header .status {
                  color: red;
                }
                .action{
                  cursor:pointer;
                }
                .emp-name{
                  font-size:larger;
                }
                /*.card-body {
                  display: flex;
                  justify-content: space-between;
                }*/
                .card-content {
                  padding: 5px 10px;
                }
                .card-content .left {
                  text-align: left;
                }
                .card-content .center {
                  text-align: center;
                }
                .card-content .right {
                  text-align: right;
                }
                .location{
                  font-size: 16px;
                  font-weight: bold;
                  text-transform:uppercase;
                }
                /*.time{
                  font-size:14px;
                }*/
                .arrow-icon{
                  height: 25px;
                  width: 75px;
                }
                .card-content .amount {
                  font-size: medium;
                  color: #0a0909;
                }
              
                .purpose{
                  border-top: 1px solid rgb(0 0 0 / 13%);
                  padding: 6px 10px;
                  font-size:14px;
                }
                .card-footer { 
                  background-color: #E8F3FC;
                  padding: 10px;
                  border-radius: 8px;
                  border-top: 1px solid #ddd;
                }
                .footer-title {
                  font-size: 15px;
                  font-weight: bold;
                }
                .Allowances {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 10px;
                  align-items: center;
                  justify-content: space-between;
                  padding: 10px 5px;
                  font-size: 14px;
                  text-align:center;
                }
                .Amounts{
                  text-align:center;
                }

                .approve-btn {
                  display: none;
                  position: absolute;
                  top: 35px;
                  right: 10px;
                  z-index: 100;
                }
                .no-records {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100%;
                  text-align: center;
                  margin: auto;
                  font-size: 18px;
                  color: #495057;
                  margin-bottom: 40px;
                }

                .no-records-message {
                  height: 100%;
                  text-align: center;
                  margin: auto;
                  font-size: 18px;
                  justify-content: center;
                  align-items: center;
                  margin-bottom: 40px;
                  display: none; /* Message is hidden by default */
                  font-weight: bold;
                  color: #495057;
                }
                .action_menu {
                  display: flex;
                  text-align: right;
                  justify-content: end;
                }
                .btn_bulk_approve{
                  display:none;
                  margin-right:10px;
                  font-size: 15px;
                }
                .btn_select_all{
                  
                  font-size: 15px;
                }
               
             
              </style>
            </head>
            <body>
              <div class="container">
                <div class="row">
                  <div class="ta_navbar">
                    <div class="active">
                      Pending <span class="pending-count">${count}</span>
                    </div>
                    <!--<div>Approved</div>-->
                  </div>
                </div>
              </div>
              
              <div class="container main-container">
                <div class="row ">
                  <ul class="ta_navbar" id="employeeTabs" role="tablist">
                    <li class="ta-nav-item">
                      <button class="ta-nav-link active" id="all-tab" data-employee-name="all" onclick="handleTabClick('all', this)">
                        All <span class="count">${count}</span>
                      </button>
                    </li>
                    ${employeeNames
                      .map(
                        (emp) => `
                        <li class="ta-nav-item">
                          <button class="ta-nav-link" id="${
                            emp.full_name
                          }-tab" data-employee-name="${
                          emp.full_name
                        }" onclick="handleTabClick('${emp.full_name}', this)">
                            ${emp.full_name} <span class="count">${
                          employeeRecordCounts[emp.full_name] || 0
                        }</span>
                          </button>
                        </li>`
                      )
                      .join("")}
                  </ul>
                </div>
           
                <div class="container action_menu">
                  <button class="btn btn-success btn_bulk_approve" onclick="bulkApprove()"> Approve </button>
                  <button class="btn btn-primary btn_select_all" id="selectAllButton" onclick="toggleSelectAll()">Select All</button>
                </div>
                <div class="row mb-2 card-container" id="cardContainer">
                  ${
                    count === 0
                      ? `<h3 class="no-records" style="text-align:center;">You have no Request</h3>`
                      : taRecords
                          .map(
                            (record) => `
                      <div class="col-md-4 card-column">
                      <!-- Checkbox for each card -->
                      <input class="approve-checkbox" type="checkbox" data-record-name="${
                        record.name
                      }" >
                        <div class="card ">
                        <button class="btn btn-success approve-btn" id="approve-${
                          record.name
                        }" onclick="approveRecord('${
                              record.name
                            }')">Approve</button>
                          <div class="card-header">
                            <div class="emp-name">
                              <img src="/files/user (1).png" alt="user" width="20" />
                              ${record.employee_name}
                            </div>

                            <div class="status">Pending
                              <span>
                                <img class="action" onclick="get_approve_btn('${
                                  record.name
                                }')" src="/files/dots.png" alt="user" width="20" />
                              </span>
                            </div>
                          </div>
                        <div class="card-content">
                          <div class="row">
                            <div class="col-4 left">
                              <div>From</div>
                              <div class="location">${
                                record.from_location
                              }</div>
                              <div class="time"> ${formatDateTime(
                                record.date_and_time_start
                              )}</div>
                            </div>
                            <div class="col-4 center">
                              <div>${record.mode_of_transport}</div>
                      
                              <img
                                class="arrow-icon"
                                src="/files/arrows (1).png"
                                alt="user"
                              />
                      
                              <div class="amount">₹${record.total}</div>
                            </div>
                            <div class="col-4 right">
                              <div>To</div>
                              <div class="location">${record.to_location}</div>
                              <div class="time"> ${formatDateTime(
                                record.date_and_time_end
                              )}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div class="purpose"> 
                          <img
                          class="text-icon"
                          src="/files/chat.png"
                          alt="user" width="20"/> ${record.purpose}
                        </div>

                        <div class="card-footer">
                          <div class="footer-title"> 
                            Allowances
                          </div>
                          <div class="Allowances">
                            <div>Local
                            <div>₹${
                              record.local_conveyance_other_expenses_amount
                            }</div></div>
                            <div>DA
                            <div>₹${record.daily_allowance}</div></div>
                            <div>Halt
                            <div>₹${record.halting_amount}</div></div>
                            <div>Lodge
                            <div>₹${record.lodging_amount}</div></div>
                            <div>KM
                            <div>${record.kilometer_of_travelling}km</div></div>
                            <div>Fare
                            <div>₹${record.fare_amount}</div></div>
                            <div>Total
                            <div>₹${record.total}</div></div>
                          </div>  
                        </div>
                      </div>
                    </div>
                    `
                          )
                          .join("")
                  }
                </div>

                <!-- No records message -->
                <div class="no-records-message">No Request found for the selected employee.</div>
              </div>
             
              <!-- jQuery CDN -->
              <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha384-ZvpUoO/+PqeF8UOrRtvNLU7mKxOj7cMwp7o+6g0Pj5tyJf6cFOksdRMtrzmQe1Rj" crossorigin="anonymous"></script>

              <script>
            
              // handle select all button
              function toggleSelectAll() {
                // Get the "Select All" button element
                const selectAllButton = document.getElementById('selectAllButton');
                // Get all the checkboxes
                const checkboxes = document.querySelectorAll('.approve-checkbox');
                // Check if all checkboxes are currently selected
                const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
                
                // Toggle the checked state of all checkboxes
                checkboxes.forEach(checkbox => {
                  checkbox.checked = !allChecked;
                });
                
                // Update the bulk approve button visibility
                handleCheckboxChange();
              
                // Update the "Select All" button text
                if (allChecked) {
                  selectAllButton.textContent = 'Select All';
                } else {
                  selectAllButton.textContent = 'Unselect All';
                }
              }
              
              
              // Add event listeners to checkboxes
              document.querySelectorAll('.approve-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', handleCheckboxChange);
              });

              // Handle checkboxes function for bulk approved records
              function handleCheckboxChange() {
                const bulkApproveButton = document.querySelector('.btn_bulk_approve');

                // Check if any checkbox is checked
                const isAnyChecked = Array.from(document.querySelectorAll('.approve-checkbox'))
                  .some(checkbox => checkbox.checked);

                // Toggle the bulk approve button's visibility
                bulkApproveButton.style.display = isAnyChecked ? 'block' : 'none';

                // Log the record name of the checked checkbox
                if (this.checked) {
                  console.log('Checked record name:', this.dataset.recordName);
                }
              }
              
              // handle for nav tabs filter by employee name
              function handleTabClick(employee, element) {
                // Log the clicked employee name to the console
                console.log("Selected Employee: ", employee);
              
                // Remove 'active' class from all buttons
                const buttons = document.querySelectorAll(".ta-nav-link");
                buttons.forEach((button) => {
                  button.classList.remove("active");
                });
              
                // Add 'active' class to the clicked button
                element.classList.add("active");
              
                // Filter the cards based on the active tab
                filterCardsByEmployee(employee);
              }
              
              // handle cards for filter by employee name
              function filterCardsByEmployee(employee) {
                const cards = document.querySelectorAll(".card-column");
                let hasVisibleCards = false; // Track if there are any visible cards
    
                cards.forEach((card) => {
                    const empNameElement = card.querySelector(".emp-name");
                    const empNameText = empNameElement ? empNameElement.textContent.trim() : '';
                    const employeeName = empNameText.replace(/^\s*\S+\s+/, '').trim();
    
                    if (employee === "all" || employeeName === employee) {
                        card.style.display = "block";
                        hasVisibleCards = true; // At least one card is visible
                    } else {
                        card.style.display = "none";
                    }
                });
    
                // Display message if no cards are visible
                const noRecordsMessage = document.querySelector(".no-records-message");
                const noAllRecordsMessage = document.querySelector(".no-records");

                // Check if employee is 'all' and handle separately
                if (employee === "all") {
                    // Check if there are no cards at all
                    if (hasVisibleCards) {
                      noRecordsMessage.style.display = "none";
                        noAllRecordsMessage.style.display = "flex"; // Show "You have no Request" for all employees

                    } else {
                        noAllRecordsMessage.style.display = "none"; // Hide the message if cards are visible
                    }
                } else {
                    if (!hasVisibleCards) {

                        noRecordsMessage.style.display = "flex";
                        noAllRecordsMessage.style.display = "none";
                    } else {
                        noRecordsMessage.style.display = "none"; // Hide the message if cards are visible
                    }
                }
              }           

              
              document.addEventListener("DOMContentLoaded", function () {
                // Initially display all cards
                filterCardsByEmployee("all");
              });


              // handle to display approve button when click on three dots of each records
              function get_approve_btn(recordName) {
                console.log("Toggle button for record:", recordName);
                var approveButton = document.getElementById('approve-' + recordName);
                if (approveButton) {
                    // Toggle the display style
                    if (approveButton.style.display === "none" || approveButton.style.display === "") {
                        approveButton.style.display = "block";
                    } else {
                        approveButton.style.display = "none";
                    }
                }
              }
          
              // funtion to approved records individually
              function approveRecord(recordName) {
                console.log("Approve button clicked for record:", recordName);
              
                // Define the status and approved_by values
                const status = 'Approved';
                const approvedBy = frappe.session.user;
                console.log(approvedBy);
              
                // Call the server-side method to update the record status
                frappe.call({
                  method:"travel_allowance.travel_allowance.doctype.travel_allowance.travel_allowance.update_approved_record_status",
                  args: {
                    record_name: recordName,
                    status: status,
                    approved_by: approvedBy,
                  },
                  callback: function(response) {
                    if (response.message === 'Record status updated successfully.') {
                      // Handle the successful response
                      console.log('Record approved successfully.');
                      // // Optionally hide the approve button or update the UI
                      // var approveButton = document.getElementById('approve-' + recordName);
                      // if (approveButton) {
                      //   approveButton.style.display = 'none';
                      // }
                      // Refresh the page
                      location.reload();
                    } else {
                      // Handle the failure response
                      console.error('Failed to approve record:', response.message);
                    }
                  }

                });
              }
          
              // funtion to approved bulk records 
              function bulkApprove() {
                // Get all checked records
                const checkedRecords = Array.from(
                  document.querySelectorAll(".approve-checkbox:checked")
                ).map((checkbox) => checkbox.dataset.recordName);
              
                console.log("Bulk approving records:", checkedRecords);
              
                if (checkedRecords.length > 0) {
                  // Confirm the bulk approval action
                  if (confirm("Are you sure you want to approve these records?")) {
                    // Approve each record using the existing approveRecord function
                    checkedRecords.forEach((recordName) => {
                      approveRecord(recordName);
                    });
                  
                    // Optionally, provide feedback once all are approved
                    alert("All selected records have been processed for approval.");
                  }
                } else {
                  alert("Please select at least one record to approve.");
                }
              }

              document.addEventListener("DOMContentLoaded", function () {
                // Initial setup: hide or show the bulk approve button
                handleCheckboxChange.call(document.querySelector(".approve-checkbox"));
              });
            
              </script>

            </body>
          </html>
          `;

          // Set the above `html` as Summary HTML
          frm.set_df_property("ta_approval_status", "options", html);
        } else {
          console.error("Failed to fetch data");
        }
      },
    });
  },
});
