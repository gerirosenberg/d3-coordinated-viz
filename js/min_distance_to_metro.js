// This program calculates the distance between centroids
// of polygons in one geojson and points of another geojson

// Use turf packages
var distance = require('@turf/distance').default;
var fs = require('fs');

// Open both files
var tracts = JSON.parse(fs.readFileSync('tracts.geojson', 'utf8'));
var metroStations = JSON.parse(fs.readFileSync('metro-stations.geojson', 'utf8'));

// Create empty array of results
var tractsWithDistances = []

// Function to find the minimum distance to any Metro station
function getDistanceToClosestPoint(origin, points) {
	var listOfDistances = [];

	// Loop to look up distance for every Metro station
	points.forEach(function(point) {
		listOfDistances.push(distance(origin, point, {units: 'miles'}));
	});

	// Determine the shortest distance
	var minDistance = Math.min(...listOfDistances);
	return minDistance;
}

// Loop through each tract to attach GEOID with minimum distance
tracts.features.forEach(function(feature) {

	tractCentroid = centroid(feature);
	geoid = feature.properties.GEOID;
	distanceToClosetStation = getDistanceToClosestPoint(
		tractCentroid,
		metroStations.features
	)

	// Write results into array
	tractsWithDistances.push({GEOID: geoid, Distance: distanceToClosetStation});
});

// Open csvWriter with declared headers
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
	path: 'distances.csv',
	header: [
	{id: 'GEOID', title: 'GEOID'},
	{id: 'Distance', title: 'Distance'},
	]
});

// Write to csv
csvWriter
	.writeRecords(tractsWithDistances)
	.then(()=> console.log('Successful'));