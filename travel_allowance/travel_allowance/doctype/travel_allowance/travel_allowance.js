// Copyright (c) 2023, Apeksha and contributors
// For license information, please see license.txt

frappe.ui.form.on("Travel Allowance", {
	to_location:function(frm){
		//frappe.msgprint("Welcome");
		let destination=frm.doc.to_location.trim();
		 // Convert destination to lowercase for case-insensitive comparison
		//let lowerDestination = destination.toLowerCase();
		console.log(destination);
		let cityClass= getCityClass(destination);
		console.log(cityClass);
		frm.set_value("class_city", cityClass);
		

	}

});

// Function to determine the city class based on the destination
function getCityClass(lowerDestination) {
    // Define the lists of cities for each class
    let classA = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', /* Add more metro cities */];
    let classB = ['Nagpur', 'Amravati', 'Aurangabad', 'Nashik', 'Kolhapur', 'Solapur', 'Gondia'];

   

    // Check if the destination is in Class A cities
	if (classA.includes(lowerDestination)) {
        return 'A';
    }

    // Check if the destination is in Class B cities
    else if (classB.includes(lowerDestination)) {
        return 'B';
    }

    // If not in Class A or Class B, consider it Class C
	else{
		return 'C';
	}
    
}





