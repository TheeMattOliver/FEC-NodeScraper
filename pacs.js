const request = require('request-promise');
const cheerio = require('cheerio'); // to use jQuery syntax from within Node
const Table = require('cli-table');
const config = require('./config')


	let receiptsTable = new Table({
	head: ['date', 'donor', 'city', 'state', 'amount', 'occupation', 'employer'], 
	colWidths: [20, 20, 15, 10, 15, 20, 20]
})

	const receiptOptions = {
		// donations received from individuals: '&is_individual=true'
		url: `https://api.open.fec.gov/v1/schedules/schedule_a/?api_key=` + config.fec.api_key + `&sort_hide_null=false&sort_nulls_last=true&sort=-contribution_receipt_date&per_page=100&committee_id=` + config.fec.committee_id + `&two_year_transaction_period=2018&is_individual=false`,
		json: true
	}

	request(receiptOptions)
	  .then((data) => {
	    
	    let fecReceiptsDataArray = [];

	    var i;
	    for (var i =0; i < data.results.length; i++) {
	    	handleNullValues(data.results[i])
	    	fecReceiptsDataArray.push({load_date: data.results[i].load_date, contributor_name: data.results[i].contributor_name, contributor_city: data.results[i].contributor_city, contributor_state: data.results[i].contributor_state, contribution_receipt_amount: data.results[i].contribution_receipt_amount, contributor_occupation: data.results[i].contributor_occupation, contributor_employer: data.results[i].contributor_employer});
	    }

	    process.stdout.write('Loading FEC receipts data for ' + config.fec.committee_id);
	    pushFecReceiptsDataIntoTable(fecReceiptsDataArray);
	  })
	  .catch((err) => {
	  	console.log(err)
	  })

	function pushFecReceiptsDataIntoTable(data) {
		var i = 0
		// next helper
		function next() {
			if (i < data.length) {
				var options = {
					url: `https://www.fec.gov/data/committee/` + config.fec.committee_id + `/?cycle=2018&tab=raising` + data[i].contributor_name,
					// url: `//https://www.fec.gov/data/schedules/schedule_a/?api_key=` + config.fec.api_key + `&committee_id=` + config.fec.committee_id + `&two_year_transaction_period=2018&sort=-contribution_receipt_date&per_page=100`,
					transform: body => cheerio.load(body)
				}
				request(options)
				  .then(function () {
				  	process.stdout.write(`.`)
				  	
				  	receiptsTable.push([data[i].load_date, data[i].contributor_name.toProperCase(), data[i].contributor_city.toProperCase(), data[i].contributor_state, data[i].contribution_receipt_amount, data[i].contributor_occupation.toProperCase(), data[i].contributor_employer.toProperCase()])

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
