

// printData helper
exports.printData = function() {
	console.log("✅");
	console.log(receiptsTable.toString())
}

// handle null values
exports.handleNullValues = function(obj) {
	Object.keys(obj).forEach(function(key) {
	    if(obj[key] === null) {
	        obj[key] = '-';
	    }
	})
  return obj
}

// properCase helper
exports.toProperCase = function (string) {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};
