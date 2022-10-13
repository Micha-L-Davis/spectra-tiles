export function randomIndex(array) {
  let index = randomIntExclusive(array.length);
  return array[index];
}

const randomIntExclusive = (max) => Math.floor(Math.random() * max);

export function findOppositeTrigon(direction) {
  if (direction >= 3) {
    return direction - 3;
  } else {
    return direction + 3;
  }
}

export function findClosestHexCenter(coordinates, gameBoard) {
  let closestCenter = { x: Infinity, y: Infinity };

  for (let [cell] of gameBoard.hexMap) {
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

  function getDistance(start, end) {
    let xDiff = Math.abs(start.x - end.x);
    let yDiff = Math.abs(start.y - end.y);

    return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
  }
}
