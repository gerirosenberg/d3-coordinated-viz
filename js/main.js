/* Javascript by Geri Rosenberg, 2019 */

// local scope
(function(){

	// psuedo-global variables
	var attrArray = ["under_15_minutes", "15_to_29_minutes", "30_to_59_minutes", "60_to_89_minutes", "90_plus_minutes"]

	// initial attribute
	var expressed = attrArray[0];

	// chart frame dimensons
	var chartWidth = window.innerWidth * 0.425,
		chartHeight = 460;

	// set scale to size bars proportionally to frame
	var yScale = d3.scale.linear()
		.range([0, chartHeight])
		.domain([0, 105]);

	// begin script when window loads
	window.onload = setMap();

	// set up choropleth map
	function setMap(){

		// map frame dimensions
		var width = window.innerWidth * 0.5,
		height = 460;

		// create new svg container for the map
		var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

		// create equal area conic conformal projection
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

			// join csv data to geoJSON enumeration units
			allTracts = joinData(allTracts, csvData);

			// create the color scale
			var colorScale = makeColorScale(csvData);

			// add enumeration units to the map
			setEnumerationUnits(allTracts, map, path, colorScale);

			// add coordinated visualization to the map
			setChart(csvData, colorScale);

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

			// create dropdown menu
			createDropdown(csvData);
		};
	};

	function joinData(allTracts, csvData){
		// loop through csv to assign each set of csv attribute values to geojson tract
		for (var i=0; i<csvData.length; i++){

			// current tract
			var csvTract = csvData[i];

			// csv primary key
			var csvKey = csvTract.GEOID;

			// loop through geojson tracts to find correct tract
			for (var a=0; a<allTracts.length; a++){

				// current tract geojson properties
				var geojsonProps = allTracts[a].properties;

				// geojson primary key
				var geojsonKey = geojsonProps.GEOID;

				// where primary keys match, transfer csv data to geojson properties object
				if (geojsonKey === csvKey){

					// assign all attributes and values
					attrArray.forEach(function(attr){

						// get csv attribute value
						var val = parseFloat(csvTract[attr]);

						// assign attribute and value to geojson properties
						geojsonProps[attr] = val;
					});
				};
			};
		};
		return allTracts;
	}

	function setEnumerationUnits(allTracts, map, path, colorScale){
		// add tracts to map
		var censustracts = map.selectAll(".censustracts")
			.data(allTracts)
			.enter()
			.append("path")
			.attr("class", function(d){
				return "censustracts " + d.properties.GEOID;
			})
			.attr("d", path)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale);
			});
	};

	// function to create color scale generator
	function makeColorScale(data){
		var colorClasses = [
			"#edf8fb",
			"#b3cde3",
			"#8c96c6",
			"#8856a7",
			"#810f7c"
		];

		// create color scale generator
		var colorScale = d3.scale.quantile()
			.range(colorClasses);

		// build array of all values of the expressed attribute
			var domainArray = [];
			for (var i=0; i<data.length; i++){
				var val = parseFloat(data[i][expressed]);
				domainArray.push(val);
			};

		// assign array of expressed values as scale domain
		colorScale.domain(domainArray);
		return colorScale;
	}

	// function to test for data value and return color
	function choropleth(props, colorScale){

		// make sure attribute value is a number
		var val = parseFloat(props[expressed]);

		// if attribute value exists, assign a color; otherwise assign gray
		if (typeof val == 'number' && !isNaN(val)){
			return colorScale(val);
		} else {
			return "#CDD1D6";
		};
	};

	// function to create coordinated bar chart
	function setChart(csvData, colorScale){

		// create a second svg element to hold the bar chart
		var chart = d3.select("body")
			.append("svg")
			.attr("width", chartWidth)
			.attr("height", chartHeight)
			.attr("class", "chart");

		// set bars for each tract
		var bars = chart.selectAll(".bars")
			.data(csvData)
			.enter()
			.append("rect")

			// sort from largest to smallest
			.sort(function(a, b){
				return b[expressed] - a[expressed]
			})

			// create bars
			.attr("class", function(d){
				return "bars " + d.GEOID;
			})

			// bar width
			.attr("width", chartWidth / (csvData.length - 1))

		// // annotate bars with attribute value text
		// var numbers = chart.selectAll(".numbers")
		// 	.data(csvData)
		// 	.enter()
		// 	.append("text")

		// 	// sort from smallest to largest
		// 	.sort(function(a, b){
		// 		return a[expressed] - b[expressed]
		// 	})

		// 	// create labels
		// 	.attr("class", function(d){
		// 		return "numbers " + GEOID;
		// 	})
		// 	.attr("text-anchor", "middle")

		// 	// centers labels to each bar
		// 	.attr("x", function(d, i){
		// 		var fraction = chartWidth / csvData.length;
		// 		return i * fraction + (fraction - 1) / 2;
		// 	})

		// 	// locate labels inside each bar
		// 	.attr("y", function(d){
		// 		return chartHeight - yScale(parseFloat(d[expressed])) + 15;
		// 	})

		// 	// place the expressed value in each <text> element
		// 	.text(function(d){
		// 		return d[expressed];
		// 	});

		// create a text element for the chart title
		var chartTitle = chart.append("text")
			.attr("x", 20)
			.attr("y", 40)
			.attr("class", "chartTitle")

		// set bar positions, heights, and colors
		updateChart(bars, csvData.length, colorScale);
	};

	// function to create a dropdown menu for attribute selection
	function createDropdown(csvData){

		// add select element
		var dropdown = d3.select("body")
			.append("select")
			.attr("class", "dropdown")

			// listen for a change in dropdown and change attribute
			.on("change", function(){
				changeAttribute(this.value, csvData)
			});

		// add initial option
		var titleOption = dropdown.append("option")
			.attr("class", "titleOption")
			.attr("disabled", "true")
			.text("Select commute length");

		// add attribute value name options
		var attrOptions = dropdown.selectAll("attrOptions")
			.data(attrArray)
			.enter()
			.append("option")
			.attr("value", function(d){ return d })
			.text(function(d){ return d });
	};

	// dropdown change listener handler
	function changeAttribute(attribute, csvData){

		// change the expressed attribute
		expressed = attribute;

		// recreate the color scale
		var colorScale = makeColorScale(csvData);

		// recolor enumeration units
		var censustracts = d3.selectAll(".censustracts")
			.transition()
			.duration(1000)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale)
			});

		// re-sort, resize, and recolor bars
		var bars = d3.selectAll(".bar")

			// re-sort
			.sort(function(a, b){
				return b[expressed] - a[expressed];
			})

			// add animation
			.transition()
			.delay(function(d, i){
				return i * 20
			})
			.duration(500);
		
		updateChart(bars, csvData.length, colorScale);
	};

	// // position, size, and color bars in chart
	function updateChart(bars, n, colorScale){

		// position bars
		bars.attr("x", function(d, i){
			return i * (chartWidth / n);
		})

			// size/resize bars
			.attr("height", function(d){
				return yScale(parseFloat(d[expressed]));
			})
			.attr("y", function(d){
				return chartHeight - yScale(parseFloat(d[expressed]));
			})

			// color/recolor bars
			.style("fill", function(d){
				return choropleth(d, colorScale);
			});

		// add text to chart title
		var chartTitle = d3.select(".chartTitle")
			// create a string that includes the 4th character of the current attribute name
			.text("Percent " + expressed);
	}
})();
