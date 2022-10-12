'use strict';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const rotationCooldown = 250;
const maxTileQuantity = 45;
let tileCount = 0;

let score = 0;

const angle = 2 * Math.PI / 6; // 60 degrees
const radius = 50;
// const origin = {
//   x: canvas.width / 2,
//   y: canvas.height / 2
// }

//#region Harmonics Dictionary

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
const harmonics = new Map();
harmonics.set('red',
	{
		isPrimary: true,
		opposite: 'green',
		discordant: ['blue', 'yellow'],
		concordant: ['purple', 'orange']
	}
);
harmonics.set('orange',
	{
		isPrimary: false,
		opposite: 'blue',
		discordant: ['purple', 'green'],
		concordant: ['red', 'yellow']
	}
);
harmonics.set('yellow',
	{
		isPrimary: true,
		opposite: 'purple',
		discordant: ['red', 'blue'],
		concordant: ['orange', 'green']
	}
);
harmonics.set('green',
	{
		isPrimary: false,
		opposite: 'red',
		discordant: ['orange', 'purple'],
		concordant: ['yellow', 'blue']
	}
);
harmonics.set('blue',
	{
		isPrimary: true,
		opposite: 'orange',
		discordant: ['yellow', 'red'],
		concordant: ['green', 'purple']
	}
);
harmonics.set('purple',
	{
		isPrimary: false,
		opposite: 'yellow',
		discordant: ['green', 'orange'],
		concordant: ['blue', 'red']
	}
);

//#endregion

//#region Game Board Draw Functions
const gameBoard = new Map(); //Key: CenterCoords (as a string) Value: HexDataObject

let mousePos = {};

function drawHex(centerCoordinates) {
	let { x, y } = centerCoordinates;

	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		ctx.lineTo(
			x + radius * Math.cos(angle * i),
			y + radius * Math.sin(angle * i)
		);
	}
	ctx.closePath();
	ctx.stroke();
}

function drawGrid(width, height) {
	for (let y = radius;
		y + radius * Math.sin(angle) < height;
		y += radius * Math.sin(angle)) {
		for (let x = radius, j = 0;
			x + radius * (1 + Math.cos(angle)) < width;
			x += radius * (1 + Math.cos(angle)), y += (-1) ** j++ * radius * Math.sin(angle)) {
			let coords = { x: x, y: y }
			drawHex(coords);
			let neighbors = findNeighbors(coords);
			gameBoard.set(JSON.stringify(coords), { tile: null, neighbors: neighbors });
		}
	}
}
//#endregion

//#region Trigon Generation Functions
function generateColorSet() {
	// let colorCount = randomIntExclusive(3) + 1;

	let mainColor = randomIndex(colors);
	let bannedColor = harmonics.get(mainColor).opposite;
	let filteredColors = filterColor(colors, mainColor);

	filteredColors = filterColor(filteredColors, bannedColor);
	let mainConfig = configureRegion(3);

	let regions = [];
	let mainRegion = {
		color: mainColor,
		size: mainConfig.size * 2,
		pattern: mainConfig.pattern
	}
	regions.push(mainRegion);

	if (/*colorCount > 1 &&*/ mainRegion.size === 6) {
		return colorSetToTrigonArray(regions);
	} else {
		let freeSpace = 6 - mainRegion.size;
		while (freeSpace /*&& regions.length < colorCount*/) {
			//console.log(freeSpace, filteredColors);
			let color = randomIndex(filteredColors);
			filteredColors = filterColor(filteredColors, color);
			let subConfig = configureRegion(freeSpace);

			regions.push({
				color: color,
				size: subConfig.size,
				pattern: subConfig.pattern
			});
			freeSpace -= subConfig.size;
		}
		return colorSetToTrigonArray(regions);
	}

	function filterColor(array, colorToRemove) {
		return array.filter(color => color !== colorToRemove);
	}

	function configureRegion(maxSize) {
		let patterns = ['split', 'clump', 'none'];
		return {
			size: randomIntExclusive(maxSize) + 1,
			pattern: randomIndex(patterns)
		}
	}
}

function colorSetToTrigonArray(colorSet) {
	let array = []
	let regions = [...colorSet];
	while (regions.length) {
		let region = regions.shift();
		processRegion(region);
	}

	return array;

	function processRegion(region) {
		//console.log("processing ", region)

		let color = region.color;
		let size = region.size;
		let pattern = region.pattern;

		if (array.length > 5) {
			console.warn('Tile array is full!');
			return;
		}
		switch (pattern) {
			case 'split':
				let first = Math.ceil(size / 2);
				let remaining = Math.floor(size / 2);
				while (first) {
					//console.log("adding trigon of ", color);
					array.push(new Trigon(color));
					first--;
				}

				let nextRegion = regions.shift();
				regions.unshift({ color: color, size: remaining, pattern: 'clump' });
				if (nextRegion) {
					regions.unshift(nextRegion);
				}
				break;
			case 'clump':
				let total = size;
				while (total) {
					array.push(new Trigon(color))
					total--;
				}
				break;
			case 'none':
				let rand = randomIntExclusive(size + 1)
				let rem = size - rand;

				while (rand) {
					array.push(new Trigon(color))
					rand--;
				}
				if (rem) {
					let next = regions.shift();
					regions.unshift({ color: color, size: rem, pattern: 'clump' });
					if (next) {
						regions.unshift(next);
					}
				}
				break;
		}
	}
}
//#endregion

//#region Tiles and Trigons
let heldTile;
let lastTilePlayed = null;

class Tile {
	constructor(centerCoordinates, trigons) {
		//console.log(trigons)
		this.centerCoordinates = centerCoordinates;
		this.trigons = trigons;
		this.isHeld = true;
	};

	rotate = (dir) => {
		let now = Date.now();
		if (now < this.nextRotationTime) return;

		if (dir === -1) {
			let first = this.trigons.shift();
			this.trigons.push(first);
		}
		if (dir === 1) {
			let last = this.trigons.pop();
			this.trigons.unshift(last);
		}
		//console.log(this.trigons);
		this.nextRotationTime = Date.now() + rotationCooldown;
		this.draw();
	};

	draw = (isPlacing = false) => {
		let { x, y } = this.centerCoordinates;
		let fillArray = this.trigons;
		let i = 0;
		for (let i = 0; i < 6; i++) {
			ctx.beginPath();
			ctx.lineTo(
				x + radius * Math.cos(angle * i),
				y + radius * Math.sin(angle * i)
			);
			ctx.lineTo(
				x + radius * Math.cos(angle * i + 1.04),
				y + radius * Math.sin(angle * i + 1.04)
			);
			ctx.lineTo(x, y);
			ctx.closePath();
			ctx.stroke();
			ctx.fillStyle = fillArray[i].color;
			ctx.fill();
		}

		if (isPlacing) {
			this.isHeld = false;
			lastTilePlayed = this;
			heldTile = null;
		}
	}
}

class Trigon {
	constructor(color) {
		this.color = color;
		this.isClosed = false;
		this.score = 0;
	}
}

function findOppositeTrigon(direction) {
	if (direction >= 3) {
		return direction - 3;
	} else {
		return direction + 3;
	}
}

//#endregion

//#region Score
const closedRegions = new Map(); //Key: 'regionName' Value: [trigonObj, trigonObj, ...]
const openRegions = new Map(); //Key: 'regionName' Value: [trigonObj, trigonObj, ...]
const oppositionModifier = -2;
const discordanceModifier = -1
const concordanceModifier = 1;
const matchModifier = 2;

function scoreGraph() {
	traverseHexes(lastTilePlayed.centerCoordinates, compareHarmonics);

	traverseHexes({ x: 50, y: 50 }, calculateRegions);

	checkForClosedRegions();

	score += scoreClosedRegions();
	console.log("Score = ", score);

	function traverseHexes(startCoords, workFunction) {
		const viewed = new Set();
		const queue = [startCoords];

		while (queue.length > 0) {
			console.log("queue ", queue)
			const coords = queue.shift();
			console.log("coords ", coords)
			const hex = gameBoard.get(JSON.stringify(coords));
			console.log("looking for a tile at coords ", hex)
			if (hex.tile) {
				console.log("performing work on ", hex.tile);
				workFunction(hex.tile);
			}


			const neighbors = findNeighbors(hex);
			for (let neighbor of neighbors) {
				if (!viewed.has(gameBoard.get(JSON.stringify(neighbor)))) {
					viewed.add(gameBoard.get(JSON.stringify(neighbor)));
					queue.push(gameBoard.get(JSON.stringify(neighbor)));
				}
			}
		}
	}

	function compareHarmonics(tile) {
		console.log("Comparing Harmonics of tile at ", tile.centerCoordinates)
		for (let i = 0; i < tile.trigons.length; i++) {
			console.log("checking trigon ", i, tile.trigons[i])
			let trigon = tile.trigons[i];
			if (trigon.isClosed)
				continue;

			let adjacentHexCoords = findNeighbors(tile.centerCoordinates, i);
			let adjacentHex = gameBoard.get(JSON.stringify(adjacentHexCoords));
			console.log("adjacent hex ", adjacentHexCoords, adjacentHex)
			if (!adjacentHex.tile)
				continue;

			let adjacentTrigon = adjacentHex.tile.trigons(findOppositeTrigon(i));
			scoreTrigons(trigon, adjacentTrigon);
			trigon.isClosed = true;
			adjacentTrigon.isClosed = true;
		}

		function scoreTrigons(trigonA, trigonB) {
			let harmonic = harmonics.get(trigonA.color);
			if (harmonic.opposite === trigonB.color) {
				trigonA.score += oppositionModifier;
				trigonB.score += oppositionModifier;
			}

			if (harmonic.discordant.includes(trigonB.color)) {
				trigonA.score += discordanceModifier;
				trigonB.score += discordanceModifier;
			}

			if (harmonic.concordant.includes(trigonB.color)) {
				trigonA.score += concordanceModifier;
				trigonB.score += concordanceModifier;
			}
			console.log("scores resolved: ", trigonA, trigonB)
		}
	}

	function calculateRegions(tile) {
		// first loop through tile and group adjacent trigons
		let tileRegions = new Set();
		for (let i = 0; i < tile.trigons.length; i++) {
			let trigon = tile.trigons[i];
			let nextIndex = i + 1
			if (nextIndex > 5) {
				nextIndex = nextIndex - 6;
			}
			let nextTrigon = tile.trigons[nextIndex];

			evaluateTrigonRegions(nextTrigon, trigon);
		}

		//then loop through adjacent trigons in neighboring tiles
		for (let region of tileRegions.values) {
			for (let trigons of openRegions(region)) {
				for (let i = 0; i < trigons.length; i++) {
					let trigon = trigons[i];
					let [adjacentHexCoords] = findNeighbors(tile.centerCoordinates, i);
					let adjacentHex = gameBoard.get(JSON.stringify(adjacentHexCoords));
					if (!adjacentHex.tile)
						return;

					let adjacentTrigon = adjacentHex.tile.trigons(findOppositeTrigon(i));
					evaluateTrigonRegions(trigon, adjacentTrigon);
				}
			}
		}

		function evaluateTrigonRegions(nextTrigon, trigon) {
			if (nextTrigon.color === trigon.color) {
				if (nextTrigon.region && trigon.region) {
					mergeRegions(trigon.region, nextTrigon.region);
					tileRegions.delete(nextTrigon.region);
					tileRegions.add(trigon.region);
				} else if (!nextTrigon.region && trigon.region) {
					nextTrigon.region = trigon.region;
					openRegions.set(trigon.region, [...openRegions.get(trigon.region), nextTrigon]);
				} else {
					let newRegion = generateRegionName(trigon.color);
					openRegions.set(newRegion, [trigon, nextTrigon]);
					tileRegions.add(newRegion);
				}
			}

			function mergeRegions(regionA, regionB) {
				openRegions.set(regionA, [...openRegions.get(regionA), ...openRegions.get(regionB)]);
				openRegions.delete(regionB);
			}

			function generateRegionName(color) {
				let newName = color + Math.floor(100000 + Math.random() * 900000).toString();
				while (openRegions.has(newName) || closedRegions.has(newName)) {
					newName = color + Math.floor(100000 + Math.random() * 900000).toString();
				}
				return newName;
			}
		}
	}

	function checkForClosedRegions() {
		for (let [region, trigons] of openRegions.entries()) {
			openTrigons = trigons.filter(trigon => !trigon.isClosed)
			if (!openTrigons) {
				closedRegions.set(region, trigons);
				openRegions.delete(region);
			}
		}
	}

	function scoreClosedRegions() {
		//reduce eached closed region to a region score
		let sum = 0;
		for (let trigons of closedRegions.values()) {
			sum += trigons.reduce((total, trigon) => total += trigon.score, 0);
		}
		//return sum of region scores
		return sum;
	}
}


//#endregion 

function findNeighbors({ x, y }, direction = null) {
	const directions = new Map();
	directions.set(0/*'downRight'*/, {
		x: x + radius * (1 + Math.cos(angle)),
		y: y + radius * Math.sin(angle)
	});
	directions.set(1/*'down'*/, {
		x: x,
		y: y + 2 * radius * Math.sin(angle)
	});
	directions.set(2/*'downLeft'*/, {
		x: x - radius * (1 + Math.cos(angle)),
		y: y + radius * Math.sin(angle)
	});
	directions.set(3/*'upLeft'*/, {
		x: x - radius * (1 + Math.cos(angle)),
		y: y - radius * Math.sin(angle)
	});
	directions.set(4/*'up'*/, {
		x: x,
		y: y - 2 * radius * Math.sin(angle)
	});
	directions.set(5/*'upRight'*/, {
		x: x + radius * (1 + Math.cos(angle)),
		y: y - radius * Math.sin(angle)
	});

	let neighbors = [];
	for (let value of directions.values()) {
		if (value.x > 0 && value.x < canvas.width && value.y > 0 && value.y < canvas.height)
			neighbors.push(value);
	}
	if (direction === null) return neighbors;
	else return directions.get(direction);
}

function findClosestHexCenter(coordinates) {
	let closestCenter = { x: Infinity, y: Infinity };

	for (let [cell] of gameBoard) {
		cell = JSON.parse(cell);

		let distanceToClosest = getDistance(coordinates, closestCenter);
		let distanceToCurrentCenter = getDistance(coordinates, cell);

		if (distanceToCurrentCenter < distanceToClosest) {
			closestCenter = cell;
		}
	}
	if (gameBoard.get(JSON.stringify(closestCenter)).tile) {
		console.log("already a piece present at ", closestCenter)
		return null;
	}

	return closestCenter;
}

function getDistance(start, end) {
	let xDiff = Math.abs(start.x - end.x);
	let yDiff = Math.abs(start.y - end.y);

	return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
}

function randomIndex(array) {
	let index = randomIntExclusive(array.length);
	return array[index];
}

const randomIntExclusive = (max) => Math.floor(Math.random() * max);

function update() {
	console.log()
	if (!heldTile && tileCount < maxTileQuantity) {
		heldTile = new Tile(mousePos, generateColorSet());
		scoreGraph();
	}
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawGrid(canvas.width, canvas.height);
	for (let [cell] of gameBoard) {
		let tile = gameBoard.get(cell).tile;
		if (tile) tile.draw();
	}
	if (heldTile) heldTile.draw();
}


function handleMousePos(canvas, event) {
	let rect = canvas.getBoundingClientRect();

	mousePos = {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
	if (heldTile) heldTile.centerCoordinates = mousePos;

	update();
	render();
}

function handleClick() {
	if (!heldTile) return;

	let center = findClosestHexCenter(mousePos);
	center = JSON.stringify(center);
	if (center) {
		heldTile.centerCoordinates = JSON.parse(center);
		gameBoard.set(center, { tile: heldTile, neighbors: gameBoard.get(center).neighbors });
		heldTile.draw(true);
		tileCount++;
		console.log("tiles: ", tileCount);
		console.log("New tile stored at", center);
		console.log(gameBoard.get(center));
	}

	update();
	render();
}

function handleWheelDirection(event) {
	//if (event) console.log(event.deltaY);
	if (!heldTile) return;
	if (event.deltaY < 0) {
		heldTile.rotate(1);
		return;
	}
	if (event.deltaY > 0) {
		heldTile.rotate(-1);
		return;
	}
}

function init() {
	heldTile = new Tile(mousePos, generateColorSet());
	render();

	canvas.addEventListener('mousemove', (event) => handleMousePos(canvas, event));
	canvas.addEventListener('click', handleClick);
	canvas.addEventListener('wheel', (event) => handleWheelDirection(event));
}
init();
// while (true) {
// 	update();
// 	render();
// }
