/**
 * Created by Marty on 2/20/2017.
 *
 * The Game state is the main game loop. All game related logic will reside in this state. Upon completion of the game the Game state will
 * start the Achievements state to display to the user the prize they one.
 *
 */

Game.Game = function(game) { };

var map;
var layer;
var tiles;
var pac;
var cursors;


Game.Game.prototype = {

    create: function(game){

        game.stage.smoothed = true;

        map = this.add.tilemap('map', 32, 32);
        map.addTilesetImage('tiles');
        layer = map.createLayer(0);

    },

    update: function(game) {

    }

};
