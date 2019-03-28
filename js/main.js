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
		.defer(d3.json, "data/allcounties.topojson")
		// load choropleth spatial data
		.defer(d3.json, "data/tracts.topojson")
		// load county outlines
		.defer(d3.json, "data/countyoutlines.topojson")
		// load state outlines
		.defer(d3.json, "data/stateoutlines.topojson")
		.await(callback);

	// add callback function
	function callback(error, csvData, counties, tracts, countyOutlines, stateOutlines){
		console.log(counties);
		console.log(tracts);
		console.log(countyOutlines);
		console.log(stateOutlines);
		
		// translate topoJSON
		var allCounties = topojson.feature(counties, counties.objects.dccounties),
			allTracts = topojson.feature(tracts, tracts.objects.tracts).features,
			linesCounties = topojson.feature(countyOutlines.objects.regioncounties),
			linesStates = topojson.feature(stateOutlines, stateOutlines.objects.states);

		// examine results
		console.log(allTracts);
	};
};