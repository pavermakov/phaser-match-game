var Match3 = Match3 || {};

Match3.Board = function(state, rows, cols, blockVariations) {
  this.game = state.game;
  this.state = state;
  this.rows = rows;
  this.cols = cols;
  this.blockVariations = blockVariations;
  
  this.RESERVE_ROW = rows;

  // main grid
  this.grid = [];

  var i, j;
  for(i = 0; i < rows; i++) {
    this.grid.push([]);

    for(j = 0; j < cols; j++) {
      this.grid[i].push(0);
    }
  }

  // reserve grid  on the top, for when new blocks  are needed
  this.reserveGrid = [];

  for(i = 0; i < this.RESERVE_ROW; i++) {
    this.reserveGrid.push([]);

    for(j = 0; j < cols; j++) {
      this.reserveGrid[i].push(0);
    }
  }

  // populate grids
  this.populateGrid();
  this.populateReserveGrid();
};

Match3.Board.prototype.populateGrid = function() {
  var i, j, variation;
  for(i = 0; i < this.rows; i++) {
    for(j = 0; j < this.cols; j++) {
      variation = this.game.rnd.integerInRange(1, 8);
      this.grid[i][j] = variation;
    }
  }

  // if there are chains, repopulate
  var chains = this.findAllChains();
  if(chains.length > 0) {
    this.populateGrid();
  }
};

Match3.Board.prototype.populateReserveGrid = function() {
  var i, j, variation;
  for(i = 0; i < this.RESERVE_ROW; i++) {
    for(j = 0; j < this.cols; j++) {
      variation = this.game.rnd.integerInRange(1, 8);
      this.reserveGrid[i][j] = variation;
    }
  }
};

Match3.Board.prototype.swap = function(source, target) {
  var temp = this.grid[target.row][target.col];
  this.grid[target.row][target.col] = this.grid[source.row][source.col];
  this.grid[source.row][source.col] = temp;

  var tempPos = { row: source.row, col: source.col };
  source.row = target.row;
  source.col = target.col;
  target.row = tempPos.row;
  target.col = tempPos.col;
};

Match3.Board.prototype.checkAdjacent = function(source, target) {
  var diffRow = Math.abs(source.row - target.row);
  var diffCol = Math.abs(source.col - target.col);

  var isAdjacent = (diffRow === 1 && diffCol === 0) || (diffRow === 0 && diffCol === 1);
  return isAdjacent;
};

Match3.Board.prototype.isChained = function(block) {
  var isChained = false;
  var row = block.row;
  var col = block.col;
  var variation = this.grid[row][col];

  // left
  if(variation === this.grid[row][col - 1] && variation === this.grid[row][col - 2]) {
    isChained = true;
  }

  // right
  if(variation === this.grid[row][col + 1] && variation === this.grid[row][col + 2]) {
    isChained = true;
  }

  // up 
  if(this.grid[row - 2]) {
    if(variation === this.grid[row - 1][col] && variation === this.grid[row - 2][col]) {
      isChained = true;
    }
  }

  // down
  if(this.grid[row + 2]) {
    if(variation === this.grid[row + 1][col] && variation === this.grid[row + 2][col]) {
      isChained = true;
    }
  }

  // center - horizontal
  if(variation === this.grid[row][col - 1] && variation === this.grid[row][col + 1]) {
    isChained = true;
  }

  // center - vertical
  if(this.grid[row + 1] && this.grid[row - 1]) {
    if(variation === this.grid[row - 1][col] && variation === this.grid[row + 1][col]) {
      isChained = true;
    }
  }

  return isChained;
};

Match3.Board.prototype.findAllChains = function() {
  var chained = [];

  var i, j;
  for(i = 0; i < this.rows; i++) {
    for(j = 0; j < this.cols; j++) {
      if(this.isChained({row: i, col: j})){
        chained.push({row: i, col: j});
      }
    }
  }

  return chained;
};

Match3.Board.prototype.clearChains = function() {
  var chainedBlocks = this.findAllChains();

  chainedBlocks.forEach(function(block) {
    this.grid[block.row][block.col] = 0;

    this.state._getBlockFromColRow(block).kill();
  }, this);
}

Match3.Board.prototype.dropBlock = function(sourceRow, targetRow, col) {
  this.grid[targetRow][col] = this.grid[sourceRow][col];
  this.grid[sourceRow][col] = 0;

  this.state._dropBlock(sourceRow, targetRow, col);
}

Match3.Board.prototype.dropReserveBlock = function(sourceRow, targetRow, col) {
  this.grid[targetRow][col] = this.reserveGrid[sourceRow][col];
  this.reserveGrid[sourceRow][col] = 0;

  this.state._dropReserveBlock(sourceRow, targetRow, col);
}

Match3.Board.prototype.updateGrid = function() {
  var i, j, k, foundBlock;

  for(i = this.rows - 1; i >= 0; i--) {
    for(j = 0; j < this.cols; j++) {
      if(this.grid[i][j] === 0) {
        foundBlock = false;

        for(k = i - 1; k >= 0; k--) {
          if(this.grid[k][j] > 0) {
            this.dropBlock(k, i, j);
            foundBlock = true;
            break;
          }
        }

        if(!foundBlock) {
          for(k = this.RESERVE_ROW - 1; k >= 0; k--) {
            if(this.reserveGrid[k][j] > 0) {
              this.dropReserveBlock(k, i, j);
              break;
            }
          }
        }
      }
    }
  }

  this.populateReserveGrid();
}