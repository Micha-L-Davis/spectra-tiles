'use strict';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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
const gameBoard = new Map();

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
			gameBoard.set(coords, { tile: null, neighbors: neighbors });
		}
	}
}
//#endregion

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
					console.log("adding trigon of ", color);
					array.push(color);
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
					array.push(color)
					total--;
				}
				break;
			case 'none':
				let rand = randomIntExclusive(size + 1)
				let rem = size - rand;

				while (rand) {
					array.push(color)
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

let heldTile;

class Tile {
	constructor(centerCoordinates, trigons) {
		console.log(trigons)
		this.centerCoordinates = centerCoordinates;
		// this.types = {
		// 	count: colorSet.length,
		// 	list: colorSet,
		// 	trigons: colorSetToTrigonArray(colorSet)
		// }
		this.trigons = trigons;
		this.isHeld = true;
	};

	rotate = (dir) => {
		if (this === heldTile)
			if (dir === -1) {
				let first = this.types.list.shift();
				this.types.list.push(first);
			}
		if (dir === 1) {
			let last = this.types.list.pop();
			this.types.list.unshift(last);
		}

		// redraw held tile
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
			ctx.fillStyle = fillArray[i];
			ctx.fill();
		}

		if (isPlacing) {
			this.isHeld = false;
			heldTile = null;
		}
	}
}

function findOppositeTrigon(index) {
	if (index >= 3) {
		return index - 3;
	} else {
		return index + 3;
	}
}

function scoreGraph() {
	// caculate closed regions
	let closedRegions = calculateClosedRegions();
	// add each closed region to scoreboard
}

function calculateClosedRegions() {
	let closedRegions = new Map();
	// closedRegions map will be a numeric key and a region map
	let region = new Map();
	// region map is a tile object key and the trigon index of all member parts

	// Do a traversal here
	// During traversal add tiles and their member trigons to region
	// end traversal when expanding the region becomes impossible 
	// add complete region to closedRegions map

	return closedRegions;
}

function findNeighbors({ x, y }, direction = null) {
	const directions = new Map();
	directions.set('downRight', {
		x: x + radius * (1 + Math.cos(angle)),
		y: y + radius * Math.sin(angle)
	});
	directions.set('upRight', {
		x: x + radius * (1 + Math.cos(angle)),
		y: y - radius * Math.sin(angle)
	});
	directions.set('upLeft', {
		x: x - radius * (1 + Math.cos(angle)),
		y: y - radius * Math.sin(angle)
	});
	directions.set('downLeft', {
		x: x - radius * (1 + Math.cos(angle)),
		y: y + radius * Math.sin(angle)
	});
	directions.set('down', {
		x: x,
		y: y + 2 * radius * Math.sin(angle)
	});
	directions.set('up', {
		x: x,
		y: y - 2 * radius * Math.sin(angle)
	});

	let neighbors = [];
	for (let value of directions.values()) {
		if (value.x > 0 && value.x < canvas.width && value.y > 0 && value.y < canvas.height)
			neighbors.push(value);
	}
	if (direction) return directions.get(direction);
	else return neighbors;
}

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
	console.log(regions);
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

function findClosestHexCenter(coordinates) {
	let closestCenter = { x: Infinity, y: Infinity };

	for (let [cell] of gameBoard) {
		let distanceToClosest = getDistance(coordinates, closestCenter);
		let distanceToCurrentCenter = getDistance(coordinates, cell);

		if (distanceToCurrentCenter < distanceToClosest) {
			closestCenter = cell;
		}
	}
	if (gameBoard.get(closestCenter).tile) {
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
	if (!heldTile) {
		heldTile = new Tile(mousePos, generateColorSet());
	}
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawGrid(canvas.width, canvas.height);
	for (let [cell] of gameBoard) {
		let tile = gameBoard.get(cell).tile;
		if (tile) tile.draw();
	}
	heldTile.draw();
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
	let center = findClosestHexCenter(mousePos);
	if (center) {
		heldTile.centerCoordinates = center;
		gameBoard.set(center, { tile: heldTile, neighbors: gameBoard.get(center).neighbors });
		heldTile.draw(true);
	}

	update();
	render();
}

function init() {
	heldTile = new Tile(mousePos, generateColorSet());
	render();

	canvas.addEventListener('mousemove', (event) => handleMousePos(canvas, event));
	canvas.addEventListener('click', handleClick)
}
init();
// while (true) {
// 	update();
// 	render();
// }
