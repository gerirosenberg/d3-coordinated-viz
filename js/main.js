/* Javascript by Geri Rosenberg, 2019 */

// begin script when window loads
window.onload = setMap();

// set up choropleth map
function setMap(){

	// map frame dimensions
	var width =500,
	height = 460;

	// create new svg container for the map
	var map = d3.select("body")
	.append("svg")
	.attr("class", "map")
	.attr("width", width)
	.attr("height", height);

	// create Albers equal area conic projection
	var projection = d3.geoConicConformal()
	.center([-0.08, 38.95])
	.rotate([77, 0])
	.parallels([38.3, 39.45])
	.scale(30000)
	.translate([width / 2, height / 2]);

	// path generator
	var path = d3.geoPath()
		.projection(projection);

	// use queue to parallelize asynchronous data loading
	d3.queue()
		// load attributes from csv
		.defer(d3.csv, "data/traveltime.csv")
		// load background spatial data
		.defer(d3.json, "data/allcounties.topojson")
		// load choropleth spatial data
		.defer(d3.json, "data/tracts.topojson")
		// // load county outlines
		.defer(d3.json, "data/countyoutlines.topojson")
		// load state outlines
		.defer(d3.json, "data/stateoutlines.topojson")
		.await(callback);

	// add callback function
	function callback(error, csvData, counties, dctracts, countyOutlines, stateOutlines){

		// create graticule generator
		var graticule = d3.geoGraticule()
			// place graticule lines every 1deg lat and long
			.step([1, 1]);

		// translate topoJSON
		var allCounties = topojson.feature(counties, counties.objects.dccounties),
			allTracts = topojson.feature(dctracts, dctracts.objects.tracts).features,
			linesCounties = topojson.feature(countyOutlines, countyOutlines.objects.countylines),
			linesStates = topojson.feature(stateOutlines, stateOutlines.objects.states);

		// add counties to map background
		var countiesbg = map.append("path")
			.datum(allCounties)
			.attr("class", "countiesbg")
			.attr("d", path);

		// add tracts to map
		var censustracts = map.selectAll(".censustracts")
			.data(allTracts)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "censustracts" + d.properties.Id2;
			})
			.attr("d", path);

		// add county lines to map
		var countylines = map.append("path")
			.datum(linesCounties)
			.attr("class", "countylines")
			.attr("d", path);

		// add state lines to map
		var statelines = map.append("path")
			.datum(linesStates)
			.attr("class", "statelines")
			.attr("d", path);
	};
};