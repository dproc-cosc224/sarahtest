/**
 * Created by Marty on 2/20/2017.
 *
 * The Game state is the main game loop. All game related logic will reside in this state. Upon completion of the game the Game state will
 * start the Achievements state to display to the user the prize they one.
 *
 */

Game.Game = function(game) { };

var TILE_SIZE = 32;
var IMPASSABLE_TERRAIN = [0];
var startX = 1 * TILE_SIZE + 16;
var startY = 18 * TILE_SIZE + 16;

var map;
var layer;
var tiles;
var pac;
var cursors;

var speed = 150;
var threshold = 8;
var turnSpeed = 150;

var directions = [null, null, null, null];
var opposites = [Phaser.None, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP];

// use these for sprite rotations -- assumes that sprite starts facing to the right
var targetAngleTable = {};
targetAngleTable[Phaser.DOWN] = 90;
targetAngleTable[Phaser.UP] = 270;
targetAngleTable[Phaser.RIGHT] = 0;
targetAngleTable[Phaser.LEFT] = 180;

var current = Phaser.RIGHT;
var turning = Phaser.NONE;

var marker = new Phaser.Point();
var turnPoint = new Phaser.Point();

Game.Game.prototype = {

    init: function() {
        this.physics.startSystem(Phaser.Physics.ARCADE);
    },

    create: function(game){

        game.stage.smoothed = true;

        map = this.add.tilemap('map', 32, 32);
        map.addTilesetImage('tiles');
        layer = map.createLayer(0);
        map.setCollision(0, true, layer);

        pac = game.add.sprite(startX, startY, 'pacman', 0);
        pac.anchor.setTo(0.5, 0.5);
        this.physics.arcade.enable(pac);
        cursors = game.input.keyboard.createCursorKeys();

        this.move(Phaser.RIGHT);

    },

    update: function(game) {

        this.physics.arcade.collide(pac, layer);

        // http://phaser.io/tutorials/coding-tips-005
        marker.x = game.math.snapToFloor(Math.floor(pac.x), TILE_SIZE) / TILE_SIZE;
        marker.y = game.math.snapToFloor(Math.floor(pac.y), TILE_SIZE) / TILE_SIZE;

        var x = marker.x;
        var y = marker.y;

        var index = layer.index;

        directions[1] = map.getTileLeft(index, x, y);
        directions[2] = map.getTileRight(index, x, y);
        directions[3] = map.getTileAbove(index, x, y);
        directions[4] = map.getTileBelow(index, x, y);

        this.checkKeys();

        if(turning != Phaser.NONE) {
            this.turn();
        }
    },

    checkKeys: function() {

        if(cursors.left.isDown && current != Phaser.LEFT) {
            this.checkDirection(Phaser.LEFT);
        }else if(cursors.right.isDown && current != Phaser.RIGHT) {
            this.checkDirection(Phaser.RIGHT);
        }else if(cursors.up.isDown && current != Phaser.UP) {
            this.checkDirection(Phaser.UP);
        }else if(cursors.down.isDown && current != Phaser.DOWN) {
            this.checkDirection(Phaser.DOWN);
        }else{
            turning = Phaser.NONE;
        }
    },

    checkDirection: function(turnTo) {

        if(turning == turnTo || directions[turnTo] == null || directions[turnTo].index in IMPASSABLE_TERRAIN){
            return;
        }

        if(current  == opposites[turnTo]){
            this.move(turnTo);
        }
        else{
            turning = turnTo;
            turnPoint.x = marker.x * TILE_SIZE + TILE_SIZE / 2;
            turnPoint.y = marker.y * TILE_SIZE + TILE_SIZE / 2;
        }
    },

    turn: function() {
        var cx = Math.floor(pac.x);
        var cy = Math.floor(pac.y);

        if(!this.math.fuzzyEqual(cx, turnPoint.x, threshold) || !this.math.fuzzyEqual(cy, turnPoint.y, threshold)){
            return false;
        }

        pac.x = turnPoint.x;
        pac.y = turnPoint.y;

        pac.body.reset(turnPoint.x, turnPoint.y);

        this.move(turning);

        turning = Phaser.NONE;

        return true;
    },

    move: function(direction) {
        var local_speed = speed;

        if( direction == Phaser.LEFT || direction == Phaser.UP){
            pac.scale.y = -1;
            local_speed = -local_speed;
        }else{
            pac.scale.y = 1;
        }

        if(direction == Phaser.LEFT || direction == Phaser.RIGHT) {
            pac.body.velocity.x = local_speed;
        }
        else{
            pac.body.velocity.y = local_speed;
        }

        // rotate the sprite
        this.add.tween(pac).to( {angle: this.getAngle(direction) }, turnSpeed, "Linear", true);
        current = direction;
    },

    /*
        Improved function for getting angle to rotate sprite. Using naive approach would miss rotations
        when arrow keys were pressed in quick succession. The first tween wouldn't have completed and it
        would start a second one.
     */
    getAngle: function(to) {

        var pacAngle = this.math.radToDeg(pac.rotation);

        var targetAngle = targetAngleTable[to];
        var targetAngleNeg = targetAngle - 360;

        var diffTurnRight = this.math.difference(targetAngle, pacAngle);
        var diffTurnLeft  = this.math.difference(targetAngleNeg, pacAngle);

        if(diffTurnLeft < diffTurnRight) {
            return targetAngleNeg;
        }
        return targetAngle;
    }

};
