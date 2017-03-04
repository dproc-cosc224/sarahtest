/**
 *
 * The Preloader state is used to preload assets before the MainMenu is displayed. Once assets have been loaded the Preloader state
 * will start the MainMenu state
 */


Game.Preloader = function(game) { };

Game.Preloader.prototype = {
    preload:function(){
        var preloadBG = this.add.sprite((this.world.width-580)*0.5, (this.world.height+150)*0.5, 'loading-background');
        var preloadProgress = this.add.sprite((this.world.width-540)*0.5, (this.world.height+170)*0.5, 'loading-progress');
        this.load.setPreloadSprite(preloadProgress);
        this.preloadResources();

    },
    preloadResources: function() {
        var pack = Game.Preloader.resources;

        for(var method in pack) {
            pack[method].forEach(function(args){
                var loader = this.load[method];
                loader && loader.apply(this.load, args);
            }, this);
        }


    },

    create:function(){
        this.state.start('MainMenu');
    }
};

Game.Preloader.resources = {
    /*
     * Load all game resources
     */
    'image' : [
        ['tiles', 'assets/img/tile2.png'],
        ['ptiles', 'assets/img/TileCraftGroundSet.png'],
        ['pacman', 'assets/img/pac.png'],
        ['dot', 'assets/img/dot.png'],
        ['cherry', 'assets/img/cherry.png'],
        ['femur', 'assets/img/femur.png'],
        ['ham', 'assets/img/ham.png']
    ],

    'audio': [
        ['level_music', ['assets/audio/DPROC_Main_Loop2.mp3', 'assets/audio/DPROC_Main_Loop2.ogg']]
    ],

    'tilemap': [
        ['map', 'assets/maps/map.csv'],
        ['pupmap', 'assets/maps/pupmap.csv']


    ],

    'spritesheet': [
        ['pup', 'assets/img/pup.png', 32, 32],
        ['down', 'assets/img/arrow_down.png', 20, 20],
        ['left', 'assets/img/arrow_left.png', 20, 20],
        ['right', 'assets/img/arrow_right.png', 20, 20],
        ['up', 'assets/img/arrow_up.png', 20, 20]
    ]

};
