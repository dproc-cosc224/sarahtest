/**
 * Created by Marty on 2/20/2017.
 *
 * The Game state is the main game loop. All game related logic will reside in this state. Upon completion of the game the Game state will
 * start the Achievements state to display to the user the prize they one.
 *
 */

Game.Game = function(game) { };


var TILE_SIZE    = 32;  // how many pixels per tile
var WIDTH        = 20;  // how many tiles wide
var HEIGHT       = 28;  // how many tiles high

// keep a list of terrains which are impassable
var IMPASSABLE_TERRAIN = [0];

// game entity object used for pacmans and ghosts
function GameEntity(startX, startY, speed, threshold, turnSpeed, current, turning, marker, turnPoint) {
    this.startX = startX;
    this.startY = startY;
    this.speed = speed;
    this.threshold = threshold;
    this.turnSpeed = turnSpeed;
    this.current = current;
    this.turning = turning;
    this.marker = marker;
    this.turnPoint = turnPoint;
}

function pac_man() {
    return new GameEntity( TILE_SIZE + 16, 26*TILE_SIZE + 16, 150, 8, 150, Phaser.RIGHT, Phaser.RIGHT, new Phaser.Point(), new Phaser.Point());
}

function make_ghost(startX, startY, movement_function) {
    var ghost = new GameEntity(startX, startY, 140, 7, 140, Phaser.RIGHT, Phaser.UP, new Phaser.Point(), new Phaser.Point());
    ghost.move = movement_function;
    return ghost;
}

var map;
var layer;
var tiles;
var cursors;

var pac_sprite;
var pac_obj;

var ghost_objs = [
    make_ghost(9 * TILE_SIZE + 16, 11 * TILE_SIZE + 16, ghost_1),
    make_ghost(10 * TILE_SIZE + 16, 11 * TILE_SIZE + 16, ghost_1)
];
var NUM_GHOSTS = ghost_objs.length;
var ghost_sprites = new Array(NUM_GHOSTS);

var directions = [null, null, null, null];
var opposites = [Phaser.None, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP];

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

        pac_obj = pac_man();
        pac_sprite = game.add.sprite(pac_obj.startX, pac_obj.startY, 'pacman', 0);
        pac_sprite.anchor.setTo(0.5, 0.5);
        this.physics.arcade.enable(pac_sprite);
        pac_sprite.body.collideWorldBounds =true;
        this.move(pac_sprite, pac_obj);

        for(var i = 0; i < NUM_GHOSTS; i++) {
            var ghost = game.add.sprite(ghost_objs[i].startX, ghost_objs[i].startY, 'ghost', 0);
            ghost.anchor.setTo(0.5, 0.5);
            this.physics.arcade.enable(ghost);
            ghost.body.collideWorldBounds =true;
            ghost_sprites[i] = ghost;
            this.move(ghost, ghost_objs[i]);
        }

        cursors = game.input.keyboard.createCursorKeys();

    },

    update: function(game) {

        game.physics.arcade.collide(pac_sprite, layer);
        for(var i = 0; i < NUM_GHOSTS; i++) {
            game.physics.arcade.collide(ghost_sprites[i], layer);
        }
        fixSpeeds(pac_sprite, pac_obj);
        for(var i =0; i < NUM_GHOSTS; i++) {
            fixSpeeds(ghost_sprites[i], ghost_objs[i]);
        }

        // http://phaser.io/tutorials/coding-tips-005
        pac_obj.marker.x = game.math.snapToFloor(Math.floor(pac_sprite.x), TILE_SIZE) / TILE_SIZE;
        pac_obj.marker.y = game.math.snapToFloor(Math.floor(pac_sprite.y), TILE_SIZE) / TILE_SIZE;

        var x = pac_obj.marker.x;
        var y = pac_obj.marker.y;
        var index = layer.index;
        // LEFT, RIGHT, UP, and DOWN correspond to 1, 2, 3, and 4
        directions[Phaser.LEFT] = map.getTileLeft(index, x, y);
        directions[Phaser.RIGHT] = map.getTileRight(index, x, y);
        directions[Phaser.UP] = map.getTileAbove(index, x, y);
        directions[Phaser.DOWN] = map.getTileBelow(index, x, y);

        this.checkKeys();

        if(pac_obj.turning != Phaser.NONE) {
            this.turn(pac_sprite, pac_obj);
        }

        for(var i = 0; i < NUM_GHOSTS; i++) {
            var g = ghost_objs[i];
            var g_sprite = ghost_sprites[i];
            g.marker.x = game.math.snapToFloor(Math.floor(g_sprite.x), TILE_SIZE) / TILE_SIZE;
            g.marker.y = game.math.snapToFloor(Math.floor(g_sprite.y), TILE_SIZE) / TILE_SIZE;

            x = g.marker.x;
            y = g.marker.y;

            directions[Phaser.LEFT] = map.getTileLeft(index, x, y);
            directions[Phaser.RIGHT] = map.getTileRight(index, x, y);
            directions[Phaser.UP] = map.getTileAbove(index, x, y);
            directions[Phaser.DOWN] = map.getTileBelow(index, x, y);

            g.move(this, g_sprite, g);
        }
    },

    checkKeys: function() {

        if(cursors.left.isDown && pac_obj.current != Phaser.LEFT) {
            this.checkDirection(pac_sprite, pac_obj, Phaser.LEFT);
        }else if(cursors.right.isDown && pac_obj.current != Phaser.RIGHT) {
            this.checkDirection(pac_sprite, pac_obj, Phaser.RIGHT);
        }else if(cursors.up.isDown && pac_obj.current != Phaser.UP) {
            this.checkDirection(pac_sprite, pac_obj, Phaser.UP);
        }else if(cursors.down.isDown && pac_obj.current != Phaser.DOWN) {
            this.checkDirection(pac_sprite, pac_obj, Phaser.DOWN);
        }else{
            pac_obj.turning = Phaser.NONE;
        }
    },

    checkDirection: function(sprite, obj, turnTo) {

        if(directions[turnTo] == null || directions[turnTo].index in IMPASSABLE_TERRAIN){
            return;
        }
        if(obj.current  == opposites[turnTo]){
            obj.turning = turnTo;
            this.move(sprite, obj);
        }
        else{
            obj.turning = turnTo;
            obj.turnPoint.x = obj.marker.x * TILE_SIZE + TILE_SIZE / 2;
            obj.turnPoint.y = obj.marker.y * TILE_SIZE + TILE_SIZE / 2;
        }
    },

    turn: function(sprite, obj) {
        var cx = Math.floor(sprite.x);
        var cy = Math.floor(sprite.y);

        if(!this.math.fuzzyEqual(cx, obj.turnPoint.x, obj.threshold) || !this.math.fuzzyEqual(cy, obj.turnPoint.y, obj.threshold)){
            return false;
        }

        sprite.x = obj.turnPoint.x;
        sprite.y = obj.turnPoint.y;

        sprite.body.reset(obj.turnPoint.x, obj.turnPoint.y);

        this.move(sprite, obj);

        obj.turning = Phaser.NONE;

        return true;
    },

    move: function(sprite, obj) {
        var local_speed = obj.speed;

        if( obj.turning == Phaser.LEFT || obj.turning == Phaser.UP){
            sprite.scale.y = -1;
            local_speed = -local_speed;
        }else{
            sprite.scale.y = 1;
        }

        if(obj.turning == Phaser.LEFT || obj.turning == Phaser.RIGHT) {
            sprite.body.velocity.x = local_speed;
            sprite.body.velocity.y = 0;
        }
        else{
            sprite.body.velocity.y = local_speed;
            sprite.body.velocity.x = 0;
        }

        // rotate the sprite
        this.add.tween(sprite).to( {angle: this.getAngle(sprite, obj, obj.turning) }, obj.turnSpeed, "Linear", true);
        obj.current = obj.turning;
    },

    /*
        Improved function for getting angle to rotate sprite. Using naive approach would miss rotations
        when arrow keys were pressed in quick succession. The first tween wouldn't have completed and it
        would start a second one.
     */
    getAngle: function(sprite, obj, to) {

        // use these for sprite rotations -- assumes that sprite starts facing to the right
        var targetAngleTable = {};
        targetAngleTable[Phaser.RIGHT] = 0;
        targetAngleTable[Phaser.DOWN] = 90;
        targetAngleTable[Phaser.LEFT] = 180;
        targetAngleTable[Phaser.UP] = 270;

        var curAngle = this.math.radToDeg(sprite.rotation);

        var targetAngle = targetAngleTable[to];
        var targetAngleNeg = targetAngle - 360;

        var diffTurnRight = this.math.difference(targetAngle, curAngle);
        var diffTurnLeft  = this.math.difference(targetAngleNeg, curAngle);

        if(diffTurnLeft < diffTurnRight) {
            return targetAngleNeg;
        }
        return targetAngle;
    }

};

function ghost_1(game, ghost_sprite, ghost_obj, dfs) {

    var g_x = Phaser.Math.snapToFloor(Math.floor(ghost_sprite.x), TILE_SIZE) / TILE_SIZE;
    var g_y = Phaser.Math.snapToFloor(Math.floor(ghost_sprite.y), TILE_SIZE) / TILE_SIZE;

    var p_x = Phaser.Math.snapToFloor(Math.floor(pac_sprite.x), TILE_SIZE) / TILE_SIZE;
    var p_y = Phaser.Math.snapToFloor(Math.floor(pac_sprite.y), TILE_SIZE) / TILE_SIZE;

    var index = layer.index;

    var seen = new Array(WIDTH);
    for(var i = 0; i < WIDTH; i++) {
        seen[i] = new Array(HEIGHT).fill(false);
    }

    var q = [];
    q.push([p_x, p_y]);

    while(q.length != 0) {

        // Stack vs Queue, pop will give you a DFS, shift will give you a BFS.
        var cur = 0;
        if(dfs){
            cur = q.pop();
        }else{
            cur = q.shift();
        }
        var x = cur[0];
        var y = cur[1];

        seen[x][y] = true;


        var d = [];

        d[Phaser.LEFT] = map.getTileLeft(index, x, y);
        d[Phaser.RIGHT] = map.getTileRight(index, x, y);
        d[Phaser.UP] = map.getTileAbove(index, x, y);
        d[Phaser.DOWN] = map.getTileBelow(index, x, y);

        // TODO
        // make sure we don't collide with other ghosts

        if(d[Phaser.LEFT] != null && !(d[Phaser.LEFT].index in IMPASSABLE_TERRAIN)){
            if(x - 1 == g_x && y == g_y){
                if(ghost_obj.current != Phaser.RIGHT) {
                    game.checkDirection(ghost_sprite, ghost_obj, Phaser.RIGHT);
                    if(ghost_obj.turning != Phaser.NONE){
                        game.turn(ghost_sprite, ghost_obj);
                    }
                }
                break;
            }
            if(! seen[x-1][y]){
                seen[x-1][y] = true;
                q.push([x - 1, y]);
            }
        }

        if(d[Phaser.RIGHT] != null && !(d[Phaser.RIGHT].index in IMPASSABLE_TERRAIN)){
            if(x + 1 == g_x && y == g_y){
                if(ghost_obj.current != Phaser.LEFT) {
                    game.checkDirection(ghost_sprite, ghost_obj, Phaser.LEFT);
                    if(ghost_obj.turning != Phaser.NONE){
                        game.turn(ghost_sprite, ghost_obj);
                    }
                }
                break;
            }
            if(! seen[x+1][y]){
                seen[x+1][y] = true;
                q.push([x+1, y]);
            }
        }

        if(d[Phaser.UP] != null && !(d[Phaser.UP].index in IMPASSABLE_TERRAIN)) {
            if(x == g_x && y - 1 == g_y){
                if(ghost_obj.current != Phaser.DOWN){
                    game.checkDirection(ghost_sprite, ghost_obj, Phaser.DOWN);
                    if(ghost_obj.turning != Phaser.NONE) {
                        game.turn(ghost_sprite, ghost_obj);
                    }
                }
                break;
            }
            if(! seen[x][y - 1]){
                seen[x][y - 1] = true;
                q.push([x, y - 1]);
            }
        }
        if(d[Phaser.DOWN] != null && !(d[Phaser.DOWN].index in IMPASSABLE_TERRAIN)) {
            if(x == g_x && y + 1 == g_y){
                if(ghost_obj.current != Phaser.UP) {
                    game.checkDirection(ghost_sprite, ghost_obj, Phaser.UP);
                    if(ghost_obj.turning != Phaser.NONE){
                        game.turn(ghost_sprite, ghost_obj);
                    }
                }
                break;
            }
            if(! seen[x][y + 1]){
                seen[x][y + 1] = true;
                q.push([x, y + 1]);
            }
        }
    }
}

function fixSpeeds(sprite, obj) {
    if(obj.current == Phaser.LEFT) {
        sprite.body.velocity.x = -obj.speed;
        sprite.body.velocity.y = 0;
    }else if(obj.current == Phaser.RIGHT) {
        sprite.body.velocity.x = obj.speed;
        sprite.body.velocity.y = 0;
    }else if(obj.current == Phaser.UP) {
        sprite.body.velocity.y = -obj.speed;
        sprite.body.velocity.x = 0;
    }else if(obj.current == Phaser.DOWN) {
        sprite.body.velocity.y = obj.speed;
        sprite.body.velocity.x = 0;
    }
}
