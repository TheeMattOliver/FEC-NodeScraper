const request = require('request-promise');
const cheerio = require('cheerio'); // to use jQuery syntax from within Node
const Table = require('cli-table');
const config = require('./config')

let receiptsTable = new Table({
	head: ['date', 'donor', 'city', 'state', 'amount', 'occupation', 'employer'], 
	colWidths: [20, 20, 15, 10, 15, 20, 20]
})

const receiptOptions = {
//received:
url: `https://api.open.fec.gov/v1/schedules/schedule_a/?api_key=` + config.fec.api_key + `&sort_hide_null=false&sort_nulls_last=true&sort=-contribution_receipt_date&per_page=100&committee_id=C00498121&two_year_transaction_period=2018&is_individual=true`,
json: true

}

request(receiptOptions)
  .then((data) => {
    
    let fecReceiptsData = [];

    var i;
    for (var i =0; i < data.results.length; i++) {
    	handleNullValues(data.results[i])
    	fecReceiptsData.push({load_date: data.results[i].load_date, contributor_name: data.results[i].contributor_name, contributor_city: data.results[i].contributor_city, contributor_state: data.results[i].contributor_state, contribution_receipt_amount: data.results[i].contribution_receipt_amount, contributor_occupation: data.results[i].contributor_occupation, contributor_employer: data.results[i].contributor_employer});
    }

    process.stdout.write('Loading FEC receipts data');
    getFecReceiptsDataAndPushIntoReceiptsTable(fecReceiptsData);
  })
  .catch((err) => {
  	console.log(err)
  })

function getFecReceiptsDataAndPushIntoReceiptsTable(fecReceiptsData) {
	var i = 0
	// next helper
	function next() {
		if (i < fecReceiptsData.length) {
			var options = {
				url: `https://www.fec.gov/data/committee/C00498121/?cycle=2018&tab=raising#individual-contribution-transactions` + fecReceiptsData[i].contributor_name,
				transform: body => cheerio.load(body)
			}
			request(options)
			  .then(function () {
			  	process.stdout.write(`.`)
			  	
			  	receiptsTable.push([fecReceiptsData[i].load_date, fecReceiptsData[i].contributor_name.toProperCase(), fecReceiptsData[i].contributor_city.toProperCase(), fecReceiptsData[i].contributor_state, fecReceiptsData[i].contribution_receipt_amount, fecReceiptsData[i].contributor_occupation.toProperCase(), fecReceiptsData[i].contributor_employer.toProperCase()])

    			++i;
			  	return next();
			  })
		} else {
			printReceiptsData();
		}
	}
	return next();
}

// printData helper
function printReceiptsData() {
	console.log("✅");
	console.log(receiptsTable.toString())
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

