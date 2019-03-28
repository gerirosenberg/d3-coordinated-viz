/* Javascript by Geri Rosenberg, 2019 */

// begin script when window loads
window.onload = setMap();

// set up choropleth map
function setMap(){
	// use queue to parallelize asynchronous data loading
	d3.queue()
		// load attributes from csv
		.defer(d3.csv, "data/traveltime.csv")
		// load background spatial data
		.defer(d3.json, "data/all-counties.topojson")
		// load choropleth spatial data
		.defer(d3.json, "data/all-tracts.topojson")
		// load county outlines
		.defer(d3.json, "data/county-outlines.topojson")
		// load state outlines
		.defer(d3.json, "data/state-outlines.topojson")
		.await(callback);

	// add callback function
	function callback(error, csvData, counties, tracts, countyOutlines, stateOutlines){
		console.log(error);
		console.log(csvData);
		console.log(counties);
		console.log(tracts);
		console.log(countyOutlines);
		console.log(stateOutlines);
	};
};