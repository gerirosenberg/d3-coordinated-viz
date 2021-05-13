/* Javascript by Geri Rosenberg, 2019 */

// local scope
(function(){

	// function to join census tracts and csv
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

				// where primary keys match, transfer csv infodata to geojson properties object
				if (geojsonKey === csvKey){

					// assign all attributes and values
					infoArray.forEach(function(info){

						// get csv attribute value
						var val = parseFloat(csvTract[info]);

						// assign attribute and value to geojson properties
						geojsonProps[info] = val;
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
				return "censustracts id" + d.properties.GEOID;
			})
			.attr("d", path)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale);
			})

			// event listeners
			.on("mouseover", function(d){
				highlightTracts(d.properties);
			})
			.on("mouseout", function(d){
				dehighlightTracts(d.properties);
			})
			.on("mousemove", moveLabel);

		// add style descriptor to each path
		var desc = censustracts.append("desc")
			.text('{"stroke": "#000", "stroke-width": "0.5px"}');
	};

	// function to create color scale generator
	function makeColorScale(data){

		// create color scale generator
		var colorScale = d3.scale.threshold()
			.range(colorClasses);

		// build array of all values of the expressed attribute
		var domainArray = [];
		for (var i=0; i<data.length; i++){
			var val = parseFloat(data[i][expressed]);
			domainArray.push(val);
		};

	   	//cluster data using ckmeans clustering algorithm to create natural breaks
	    var clusters = ss.ckmeans(domainArray, 5);
	    
	    //reset domain array to cluster minimums
	    domainArray = clusters.map(function(d){
	        return d3.min(d);
	    });

	    // make legend labels
		var legendLabels = d3.select(".map").selectAll(".legendlabels")
			.data([0].concat(clusters.map(function(d){
    			return d3.max(d);
    		})))
		legendLabels.enter()
			.append("text")
				.attr("x", width - 60)
				.attr("y", function(d,i){ return 57 + i*15})
				.style("fill", "#000")
				.style("font-size", "0.8em")
				.attr("text-anchor", "left")
				.style("alignment-baseline", "middle")
				.style("font-family", "sans-serif")
				.attr("class", "legendlabels")

		legendLabels
				.text(function(d) { return Math.round(d) + "%"; })
		legendLabels.exit().remove();

	    //remove first value from domain array to create class breakpoints
	    domainArray.shift();

	    //assign array of last 4 cluster minimums as domain
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

	// function to create coordinated dot chart
	function setChart(csvData, colorScale){

		// create a second svg element to hold the chart
		var chart = d3.select("body")
			.append("svg")
				.attr("width", chartWidth + margin.left + margin.right)
				.attr("height", chartHeight + margin.top + margin.bottom)
				.attr("class", "chart")
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// add the tooltip area to the page
		var tooltip = d3.select("body").append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

		// setup chart x
		var xAxis = d3.svg.axis()
				.scale(xScale)
				.orient("bottom");

		// setup chart y
		var yAxis = d3.svg.axis()
				.scale(yScale)
				.orient("left");

		// buffer to avoid overlap of axes
		xScale.domain([d3.min(csvData, xValue), d3.max(csvData, xValue)+1]);
		yScale.domain([d3.min(csvData, yValue), d3.max(csvData, yValue)]);

		// add x-axis
		chart.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + chartHeight + ")")
				.call(xAxis)
			.append("text")
				.attr("class", "label")
				.attr("x", chartWidth)
				.attr("y", 28)
				.style("text-anchor", "end")
				.text("Median Household Income ($1000s)");

		// add y-axis
		chart.append("g")
				.attr("class", "y axis")
				.call(yAxis)
			.append("text")
				.attr("class", "label")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Percent of commuters");

		// draw dots
		var dots = chart.selectAll(".dot")
			.data(csvData)
			.enter().append("circle")
				.attr("class", function(d) {
					return "dot id" + Object.values(d)[0];
				})
				.attr("r", 3)
				.attr("cx", xMap)
				.attr("cy", yMap)
				.style("fill", function(d){
					return choropleth(d, colorScale);
				})

				// hide tracts where median income is unavailable
				.style("display", function(d){
					if (xValue(d) === 0) {return "none"};
				})

				// event listeners
				.on("mouseover", function(d){
					highlightDots(d);
				})
				.on("mouseout", function(d){
					dehighlightDots(d);
				})
				.on("mousemove", moveLabel);
		
		// add style descriptor to each rect
		var desc = dots.append("desc")
			.text('{"stroke": "none", "stroke-width": "0px"}');

		// create a text element for the chart title
		var chartTitle = chart.append("text")
			.attr("x", 25)
			.attr("y", 10)
			.attr("class", "chartTitle")

		var chartInfo = chart.append("text")
			.attr("x", 25)
			.attr("y", 30)
			.attr("class", "chartInfo")

		// set dot positions and colors
		updateChart(dots, colorScale);
	};

	// function to create a dropdown menu for attribute selection
	function createDropdown(csvData){

		// add select element
		var dropdown = d3.select("#dropdown")

			// listen for a change in dropdown and change attribute
			.on("change", function(){
				changeAttribute(this.value, csvData)
			});

		// add attribute value name options
		var attrOptions = dropdown.selectAll("attrOptions")
			.data(attrArray)
			.enter()
			.append("option")
			.attr("class", "data-option")
			.attr("value", function(d){ return d })
			.attr("selected", function(d,i) { if (i===0) {return true}})
			.text(function(d){ return prettyString(d) });
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
			.style("fill", function(d){
				return choropleth(d.properties, colorScale)
			});

		// re-position y-value and recolor dots
		var dots = d3.selectAll(".dot")

			//re-position y-value
			.attr("cy", yValue[expressed])

			// recolor dots
			.style("fill", function(d){
				return choropleth(d, colorScale);
			});

		updateChart(dots, colorScale);
	};

	// position, size, and color dots in chart
	function updateChart(dots, colorScale){

		dots.attr("cx", xMap)
			.attr("cy", yMap)
			.style("fill", function(d){
				return choropleth(d, colorScale);
			})

		// add text to chart title
		var chartTitle = d3.select(".chartTitle")
			// create a string that includes the current attribute name
			.text("Wealth of commuters who")
		var chartInfo = d3.select(".chartInfo")
			.text(prettyString(expressed).toLowerCase())
	}

	// function to highlight tracts
	function highlightTracts(props){

		// change stroke
		var selectedTracts = d3.selectAll(".censustracts.id" + props.GEOID)
			.style("stroke", "#000")
			.style("stroke-width", "2")
			.style("stroke-opacity", "1");

		var selectedDots = d3.selectAll(".dot.id" + props.GEOID)
			.style("stroke", "#000")
			.style("stroke-opacity", "1")
			.style("stroke-width", "3");

		setTractLabel(props);
	};

	// function to highlight dots
	function highlightDots(props){

		// change stroke
		var selectedTracts = d3.selectAll(".censustracts.id" + Object.values(props)[0])
			.style("stroke", "#000")
			.style("stroke-width", "2")
			.style("stroke-opacity", "1");

		var selectedDots = d3.selectAll(".dot.id" + Object.values(props)[0])
			.style("stroke", "#000")
			.style("stroke-opacity", "1")
			.style("stroke-width", "3");

		setDotLabel(props);
	};

	// function to reset the tract style on mouseout
	function dehighlightTracts(props){
		var selectedTracts = d3.selectAll(".censustracts.id" + props.GEOID)
			.style("stroke", "#FFF")
			.style("stroke-width", "0.2px");

		var selectedDots = d3.selectAll(".dot.id" + props.GEOID)
			.style("stroke", "#000")
			.style("stroke-opacity", "0.3")
			.style("stroke-width", "1");

		function getStyle(element, styleName){
			var styleText = d3.select(element)
				.select("desc")
				.text();

			var styleObject = JSON.parse(styleText);

			return styleObject[styleName];
		};

		// remove infolabel
		d3.select(".infolabel")
			.remove();
	};

	// function to reset the dot style on mouseout
	function dehighlightDots(props){
		var selectedTracts = d3.selectAll(".censustracts.id" + Object.values(props)[0])
			.style("stroke", "#CDD1D6")
			.style("stroke", "#FFF")
			.style("stroke-width", "0.2px");

		var selectedDots = d3.selectAll(".dot.id" + Object.values(props)[0])
			.style("stroke", "#000")
			.style("stroke-opacity", "0.3")
			.style("stroke-width", "1")

		function getStyle(element, styleName){
			var styleText = d3.select(element)
				.select("desc")
				.text();

			var styleObject = JSON.parse(styleText);

			return styleObject[styleName];
		};

		// remove infolabel
		d3.select(".infolabel")
			.remove();
	};

	// function to create dynamic tract labels
	function setTractLabel(props){

		// change undefined income to ?
		var income = Math.round(1000 * props["median_income"]) || String("?");

		// label content
	 	var labelAttribute = "<h1>" + props[expressed] + "%</h1><b>" + prettyString(expressed) + "</b><br/>$" + income.toLocaleString('en') + " Median Income</br>" + props.NAMELSAD + "</br>" + props.COUNTYFP + ", " + props.STATEFP;

	 	// create info label div
	 	var infolabel = d3.select("body")
	 		.append("div")
	 		.attr("class", "infolabel")
	 		.attr("id", props.GEOID + "_label")
	 		.html(labelAttribute);

	 	var tractName = infolabel.append("div")
	 		.attr("class", "labelname")
	 		.html(props.name); 	
	};

	// function to create dynamic dot labels
	function setDotLabel(props){

		// pare down tract name
		var longTract = props["Geography"];
		var shortTract = longTract.split(",")[0];
		var tractCity = longTract.split(",")[1];
		var tractState = longTract.split(",")[2];

		// label content
	 	var labelAttribute = "<h1>" + yValue(props) + "%</h1><b>" + prettyString(expressed) + "</b><br/>$" + Math.round(1000 * xValue(props)).toLocaleString('en') + " Median Income<br/>" + shortTract + "<br/>" + tractCity + ", " + tractState;

	 	// create info label div
	 	var infolabel = d3.select("body")
	 		.append("div")
	 		.attr("class", "infolabel")
	 		.attr("id", Object.values(props)[0] + "_label")
	 		.html(labelAttribute);

	 	var tractName = infolabel.append("div")
	 		.attr("class", "labelname")
	 		.html(props.name);
	};

	// function to move infolabel with mouse
	function moveLabel(){

		// get width of label
		var labelWidth = d3.select(".infolabel")
			.node()
			.getBoundingClientRect()
			.width;

		// use coordinates of mousemove event to set label coordinates
		var x1 = d3.event.clientX + 10,
			y1 = d3.event.clientY + 75,
			x2 = d3.event.clientX - labelWidth - 10,
			y2 = d3.event.clientY + 25;

		// horizontal label coordinate, testing for overflow
		var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;

		// vertical label coordinate, testing for overflow
		var y = d3.event.clientY < 75 ? y2 : y1;

		d3.select(".infolabel")
			.style("left", x + "px")
			.style("top", y + "px");
	};

	// function to add labels for DC region counties
	function setCountyLabels(labelData, projection, map){
		
		var labels = map.selectAll('text.label').data(labelData);

	    labels.enter().append('text')
	        .classed('label', true)
	        .attr("class", "countylabel noselect");

	    labels
	        .attr('x', function(d) { return projection(d3.geo.centroid(d))[0]; })
	        .attr('y', function(d) { return projection(d3.geo.centroid(d))[1] + 10; })
	        .text(function(d) { return d.properties.NAMELSAD })
	        .style("text-anchor", "middle");

	    labels.exit().remove();
	};

	// function to add labels for all other counties
	function setCountyBgLabels(labelData, projection, map){
		
		var labels = map.selectAll('text.label').data(labelData);

	    labels.enter().append('text')
	        .classed('label', true)
	        .attr("class", "countybglabel noselect");

	    labels
	        .attr('x', function(d) { return projection(d3.geo.centroid(d))[0]; })
	        .attr('y', function(d) { return projection(d3.geo.centroid(d))[1] + 10; })
	        .text(function(d) { return d.properties.NAMELSAD })
	        .style("text-anchor", "middle");

	    labels.exit().remove();
	};

	// function to capitalize first letter of attributes
	function prettyString(string) {
		splitString = string.split('_').join(' ')
    	return splitString.charAt(0).toUpperCase() + splitString.slice(1);
	}

	// function to toggle metro
	function toggleMetro() {
		var metroCheckbox = document.querySelector('input[id="metro_toggle"]');

	    metroCheckbox.onchange = function() {
	    	if(this.checked) {
	    		d3.selectAll(".metrolines").attr("visibility", "visible");
	   		} else {
	    		d3.selectAll(".metrolines").attr("visibility", "hidden");
	        }
    	};
	};

	// psuedo-global variables
	var attrArray = ["drive_alone", "carpool", "ride_public_transit", "bicycle", "walk", "work_from_home"];
	var infoArray = ["median_income"];

	// initial attribute
	var expressed = attrArray[0];

	// map frame dimensions
	var width = window.innerWidth * 0.5,
	height = 460;

	// chart frame dimensons
	var margin = {top: 20, right: 20, bottom: 30, left: 40},
		chartWidth = window.innerWidth * 0.425 - margin.left - margin.right,
		chartHeight = 473 - margin.top - margin.bottom;

	// set chart scales
	xScale = d3.scale.linear()
		.range([0, chartWidth]),
	yScale = d3.scale.linear()
		.range([chartHeight, 0]);

	// setup color classes
	var colorClasses = [
		"#edf8fb",
		"#b3cde3",
		"#8c96c6",
		"#8856a7",
		"#810f7c"
	];

	var chartAttribute = infoArray[0];

	// setup x and y values
	var xValue = function(d) { return Number(d[chartAttribute]);},
		xMap = function(d) { return xScale(xValue(d));},
		yValue = function(d) { return Number(d[expressed]);},
		yMap = function(d) { return yScale(yValue(d));};

	// begin script when window loads
	window.onload = setMap();

	// set up choropleth map
	function setMap(){

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
			.defer(d3.csv, "data/income_dist.csv")
			// load background spatial data
			.defer(d3.json, "data/allcounties.topojson")
			// load choropleth spatial data
			.defer(d3.json, "data/tracts.topojson")
			// // load county outlines
			.defer(d3.json, "data/countyoutlines.topojson")
			// load state outlines
			.defer(d3.json, "data/stateoutlines.topojson")
			// load metro lines
			.defer(d3.json, "data/metro.topojson")
			.await(callback);

		// add callback function
		function callback(error, csvData, counties, dctracts, countyOutlines, stateOutlines, metroLines){

			// translate topoJSON
			var allCounties = topojson.feature(counties, counties.objects.dccounties),
				allTracts = topojson.feature(dctracts, dctracts.objects.tracts).features,
				linesCounties = topojson.feature(countyOutlines, countyOutlines.objects.countylines),
				linesStates = topojson.feature(stateOutlines, stateOutlines.objects.states);
				lineMetro = topojson.feature(metroLines, metroLines.objects.Metro_Lines_Regional)

			// add counties to map background
			var countiesbg = map.append("path")
				.datum(allCounties)
				.attr("class", "countiesbg")
				.attr("d", path);

			var metrobg = map.append("path")
				.datum(lineMetro)
				.attr("class", "metrolines")
				.attr("visibility", "hidden")
				.attr("d", path);

			// add county labels to map
			setCountyLabels(linesCounties.features, projection, map);
			setCountyBgLabels(allCounties.features, projection, map);

			// join csv data to geoJSON enumeration units
			allTracts = joinData(allTracts, csvData);

			// add legend background
			map.append("rect")
				.attr("x", width - 98)
				.attr("y", 0)
				.attr("width", 98)
				.attr("height", 143)
				.style("fill", "#FFF")
				.style("opacity", "0.4")

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

			// add legend title

			map.append("text")
				.attr("x", width-90)
				.attr("y", 16)
				.style("font-weight", "bold")
				.style("font-family", "sans-serif")
				.style("font-size", "0.8em")
				.text("Percent of")

			map.append("text")
				.attr("x", width-90)
				.attr("y", 28)
				.style("font-weight", "bold")
				.style("font-family", "sans-serif")
				.style("font-size", "0.8em")
				.text("commuters in")

			map.append("text")
				.attr("x", width-90)
				.attr("y", 43)
				.style("font-weight", "bold")
				.style("font-family", "sans-serif")
				.style("font-size", "0.8em")
				.text("census tract")


			// make legend squares
			var size = 15
			map.selectAll("mysquares")
				.data(colorClasses)
				.enter()
				.append("rect")
					.attr("x", width - 80)
					.attr("y", function(d,i){ return 55 + i*(size)})
					.attr("width", size)
					.attr("height", size)
					.style("fill", function(d){return d})
					.attr("class", "mysquares")
					.style("z-index", 96)

			// create dropdown menu
			createDropdown(csvData);

			// add element to toggle Metro layer
			toggleMetro();

			// add block at bottom for sources
			sources = d3.select("body")
				.append("div")
				.attr("class", "source")
			sources.append("span")
				.text("Sources: Metro shapefile from DCGIS Open Data. All data and other shapefiles from United States Census Bureau.")
		};
	};

})();
