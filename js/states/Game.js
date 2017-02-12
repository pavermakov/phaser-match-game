var Match3 = Match3 || {};

Match3.GameState = {
  init: function() {
    this.NUM_ROWS = 8;
    this.NUM_COLS = 8;
    this.NUM_VARIATIONS = 6;
    this.BLOCK_SIZE = 35;
    this.ANIMATION_TIME = 200;
  },

  create: function() {
    this.background = this.game.add.sprite(0, 0, 'background');
    this.blocks = this.game.add.group();

    // board model
    this.board = new Match3.Board(this, this.NUM_ROWS, this.NUM_COLS, this.NUM_VARIATIONS);
    this._drawBoard();
  },

  _createBlock: function(x, y, data) {
    var block = this.blocks.getFirstExists(false);

    if(!block) {
      block = new Match3.Block(this, x, y, data);
      this.blocks.add(block);
    } else {
      block.reset(x, y, data);
    }

    return block;
  },

  _drawBoard: function() {
    var i, j, block, square, x, y, data;
    var squareBitmap = this.game.add.bitmapData(this.BLOCK_SIZE + 4, this.BLOCK_SIZE + 4);
    squareBitmap.ctx.fillStyle = '#000';
    squareBitmap.ctx.fillRect(0, 0, this.BLOCK_SIZE + 4, this.BLOCK_SIZE + 4);

    for(i = 0; i < this.NUM_ROWS; i++) {
      for(j = 0; j < this.NUM_COLS; j++) {
        x = 36 + j * (this.BLOCK_SIZE + 6);
        y = 150 + i * (this.BLOCK_SIZE + 6);

        square = this.game.add.sprite(x, y, squareBitmap);
        square.anchor.setTo(0.5);
        square.alpha = 0.2;

        this._createBlock(x, y, { asset: 'block' + this.board.grid[i][j], row: i, col: j });
      }
    }

    this.game.world.bringToTop(this.blocks);
  },

  _getBlockFromColRow: function(position) {
    var foundBlock;

    this.blocks.forEachAlive(function(block){
      if(block.row === position.row && block.col === position.col) {
        foundBlock = block;
      }
    }, this);

    return foundBlock;
  },

  _dropBlock: function(sourceRow, targetRow, col) {
    var block = this._getBlockFromColRow({row: sourceRow, col: col});
    var targetY = 150 + targetRow * (this.BLOCK_SIZE + 6);

    block.row = targetRow;

    var blockMovement = this.game.add.tween(block);
    blockMovement.to({ y: targetY}, this.ANIMATION_TIME);
    blockMovement.start();
  },

  _dropReserveBlock: function(sourceRow, targetRow, col) {
    var x = 36 + col * (this.BLOCK_SIZE + 6);
    var y = -(this.BLOCK_SIZE + 6) * this.board.RESERVE_ROW + sourceRow * (this.BLOCK_SIZE + 6);
    var block = this._createBlock(x, y, { asset: 'block' + this.board.grid[targetRow][col], row: targetRow, col: col});
    var targetY = 150 + targetRow * (this.BLOCK_SIZE + 6);

    var blockMovement = this.game.add.tween(block);
    blockMovement.to({ y: targetY}, this.ANIMATION_TIME);
    blockMovement.start();
  },

  _swapBlocks: function(block1, block2) {
    block1.scale.setTo(0.7);
    var block1Movement = this.game.add.tween(block1);
    block1Movement.to({ x: block2.x, y: block2.y}, this.ANIMATION_TIME);
    block1Movement.onComplete.add(function() {
      this.board.swap(block1, block2);

      if(!this.isReversingSwap) {
        var chains = this.board.findAllChains();

        if(chains.length > 0) {
          this._updateBoard();
        } else {
          this.isReversingSwap = true;
          this._swapBlocks(block1, block2);
        }
      } else {
        this.isReversingSwap = false;
        this._clearSelection();
      }   
    }, this);
    block1Movement.start();

    var block2Movement = this.game.add.tween(block2);
    block2Movement.to({ x: block1.x, y: block1.y}, this.ANIMATION_TIME);
    block2Movement.start();
  },

  _pickBlock: function(block) {
    // only swap if ui is not blocked
    if(this.isBoardBlocked) {
      return;
    }

    // if nothing selected
    if(!this.selectedBlock) {
      // highlight the first block
      block.scale.setTo(1.1);
      this.selectedBlock = block;
    } else {
      // only adjacent blocks can swap
      this.targetBlock = block;

      if(this.board.checkAdjacent(this.selectedBlock, this.targetBlock)) {
        this.isBoardBlocked = true;
        this._swapBlocks(this.selectedBlock, this.targetBlock);
      } else {
        this._clearSelection();
      }
    }
  },

  _clearSelection: function() {
    this.isBoardBlocked = false;
    this.selectedBlock = null;
    this.blocks.setAll('scale.x', 0.7);
    this.blocks.setAll('scale.y', 0.7);
  },

  _updateBoard: function() {
    this.board.clearChains();
    this.board.updateGrid();

    this.game.time.events.add(this.ANIMATION_TIME, function(){
      // see if there are new chains
      var chains = this.board.findAllChains();

      if(chains.length > 0) {
        this._updateBoard();
      } else {
        this._clearSelection();
      }
    }, this);
  }
}
