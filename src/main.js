'use strict';

import GameBoard from './game/gameBoard';
import Tile from './game/tiles';
import { findClosestHexCenter } from './utilities';
import scoreGraph from './game/score';


const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gameBoard = new GameBoard(ctx);
const maxTileQuantity = 45;
let tileCount = 0;

// const origin = {
//   x: canvas.width / 2,
//   y: canvas.height / 2
// }

let heldTile;
let lastTilePlayed = null;

function update() {
	console.log()
	if (!heldTile && tileCount < maxTileQuantity) {
		heldTile = new Tile(mousePos, ctx);
		scoreGraph();
	}
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawGrid(canvas.width, canvas.height);
	for (let [cell] of gameBoard.hexMap) {
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

	let center = findClosestHexCenter(mousePos, gameBoard);
	if (center) {
		heldTile.centerCoordinates = center;
		gameBoard.set(center, { tile: heldTile, neighbors: gameBoard.get(center).neighbors });
		heldTile.draw(true);
		tileCount++;
		console.log("tiles: ", tileCount);
		console.log("New tile stored at", center);
		console.log(gameBoard.get(center));
	}

	lastTilePlayed = heldTile;
	heldTile = null;

	update();
	render();
}

function handleWheelDirection(event) {
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
	heldTile = new Tile(mousePos, ctx);
	render();

	canvas.addEventListener('mousemove', (event) => handleMousePos(canvas, event));
	canvas.addEventListener('click', handleClick);
	canvas.addEventListener('wheel', (event) => handleWheelDirection(event));
}
init();
