const request = require('request-promise');
const cheerio = require('cheerio'); // to use jQuery syntax from within Node
const Table = require('cli-table');
const config = require('./config')

// let table = new Table({
// 		head: ['date', 'recipient', 'city', 'state', 'amount', 'description'], 
// 		colWidths: [20, 20, 15, 10, 15, 20]
// })

let table = new Table({
		head: ['date', 'donor', 'city', 'state', 'amount', 'occupation', 'employer'], 
		colWidths: [20, 20, 15, 10, 15, 20, 20]
})

const options = {
//received:
url: `https://api.open.fec.gov/v1/schedules/schedule_a/?api_key=` + config.fec.api_key + `&sort_hide_null=false&sort_nulls_last=true&sort=-contribution_receipt_date&per_page=100&committee_id=C00498121&two_year_transaction_period=2018&is_individual=true`,
json: true

}

request(options)
  .then((data) => {
    
    let fecData = [];

    var i;
    for (var i =0; i < data.results.length; i++) {
    	handleNullValues(data.results[i])
    	fecData.push({load_date: data.results[i].load_date, contributor_name: data.results[i].contributor_name, contributor_city: data.results[i].contributor_city, contributor_state: data.results[i].contributor_state, contribution_receipt_amount: data.results[i].contribution_receipt_amount, contributor_occupation: data.results[i].contributor_occupation, contributor_employer: data.results[i].contributor_employer});
    }

    // process.stdout.write('Loading FEC data');
    getFecDataAndPushIntoTable(fecData);
  })
  .catch((err) => {
  	console.log(err)
  })

function getFecDataAndPushIntoTable(fecData) {
	var i = 0
	// next helper
	function next() {
		if (i < fecData.length) {
			var options = {
				url: `https://www.fec.gov/data/committee/C00498121/?cycle=2018&tab=raising#individual-contribution-transactions` + fecData[i].contributor_name,
				transform: body => cheerio.load(body)
			}
			request(options)
			  .then(function () {
			  	process.stdout.write(`.`)
			  	
			  	table.push([fecData[i].load_date, fecData[i].contributor_name.toProperCase(), fecData[i].contributor_city.toProperCase(), fecData[i].contributor_state, fecData[i].contribution_receipt_amount, fecData[i].contributor_occupation.toProperCase(), fecData[i].contributor_employer.toProperCase()])

    			++i;
			  	return next();
			  })
		} else {
			printData();
		}
	}
	return next();
}

// printData helper
function printData() {
	console.log("✅");
	console.log(table.toString())
}

// handle null values
function handleNullValues(obj) {
	Object.keys(obj).forEach(function(key) {
	    if(obj[key] === null) {
	        obj[key] = '-';
	    }
	})
  return obj
}

// properCase helper
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
