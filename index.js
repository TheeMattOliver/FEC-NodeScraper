const request = require('request-promise');
const cheerio = require('cheerio'); // to use jQuery syntax from within Node
const Table = require('cli-table');

let table = new Table({
		head: ['date', 'recipient', 'city', 'state', 'amount', 'description'], 
		colWidths: [20, 20, 20, 20, 20, 20]
})

//spent:
const options = {
  url: 'https://api.open.fec.gov/v1/schedules/schedule_b/?api_key=5yyI90SU3Xb73TVlv4wrEhQxYcCwMWCywQiGdYbJ&sort_hide_null=false&sort_nulls_last=true&sort=-disbursement_date&per_page=100&committee_id=C00498121&two_year_transaction_period=2018',
  // url: 'https://api.open.fec.gov/v1/schedules/schedule_b/?api_key=5yyI90SU3Xb73TVlv4wrEhQxYcCwMWCywQiGdYbJ&sort_hide_null=false&sort_nulls_last=true&sort=-disbursement_date&per_page=100&committee_id=C00498121&two_year_transaction_period=2018',
  json: true 

//received:
// url: 'https://api.open.fec.gov/v1/committee/C00498121/schedules/schedule_a/by_employer/?api_key=5yyI90SU3Xb73TVlv4wrEhQxYcCwMWCywQiGdYbJ&sort_hide_null=false&sort_nulls_last=true&sort=-total&per_page=100&page=1&cycle=2018',
// json: true
}

request(options)
  .then((data) => {
  	
    let fecData = [];
    
    var i;
    for (var i =0; i < data.results.length; i++) {
    	fecData.push({date: data.results[i].disbursement_date, name: data.results[i].recipient_name.toProperCase(), recipient_city: data.results[i].recipient_city.toProperCase(), recipient_state: data.results[i].recipient_state.toProperCase(), disbursement_amount: data.results[i].disbursement_amount, disbursement_description: data.results[i].disbursement_description.toProperCase()});
    }

    // 	console.log('On ' + data.results[i].disbursement_date + ' Roger Williams paid ' + data.results[i].recipient_name.toProperCase() + ' in ' + data.results[i].recipient_city.toProperCase() + ', ' + data.results[i].recipient_state.toProperCase() + ' $' + data.results[i].disbursement_amount + ' for ' + data.results[i].disbursement_description.toProperCase() + '.')
    
    process.stdout.write('Loading FEC data');
    getFecDataAndPushIntoTable(fecData);

  })
  .catch((err) => {
  	console.log(err)
  })

// printData();

function getFecDataAndPushIntoTable(fecData) {
	var i = 0
	// 
	function next() {
		if (i < fecData.length) {
			var options = {
				url: `https://www.fec.gov/data/committee/C00498121/?tab=spending` + fecData[i].recipient_name,
				transform: body => cheerio.load(body)
			}
			request(options)
			  .then(function () {
			  	process.stdout.write(`.`)
			  	
			  	table.push([fecData[i].date, fecData[i].name, fecData[i].recipient_city, fecData[i].recipient_state, fecData[i].disbursement_amount, fecData[i].disbursement_description]);
    			++i;
			  	return next();
			  })
		} else {
			printData();
		}
	}
	return next();
}

function printData() {
	console.log("✅");
	console.log(table.toString())
}

// fix all caps
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
