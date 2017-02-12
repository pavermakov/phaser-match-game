var Match3 = Match3 || {};

Match3.BootState = {
  init: function() {
    this.game.stage.backgroundColor = '#fff';
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
  },

  preload: function() {
    this.load.image('bar', 'assets/images/preloader-bar.png');
  },

  create: function() {
    this.game.state.start('Preload');
  }
}