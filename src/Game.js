/**
 *
 * The Game state is the main game loop. All game related logic will reside in this state. Upon completion of the game the Game state will
 * start the Achievements state to display to the user the prize they one.
 *
 */

Game.Game = function(game) { };

var map;
var layer;
var tiles;
var player;
var cursors;
var startPosX;
var startPosY;
var spd;
var wasd;
var gridsize;
var marker;
var directions;
var opposites;
var current;
var turnPoint;
var threshold;
var turning;
var turnSpeed;
var treats;
var safetile;


Game.Game.prototype = {

    create: function(game){

        //players starting position
        startPosX = 18;
        startPosY = 26;

        //speed of travel
        threshold = 8;
        spd = 150;
        turnSpeed = 150;

        //set tile/grid size
        gridsize = 32;

        //direction arrays
        // direction holds info surrounding tiles
        directions = [null, null, null, null, null];
        // opposite holds the opposite values of direction
        opposites = [ Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP ];

        //Grid coordinate where the player is located
        marker = new Phaser.Point();

        //Grid coordinate where the player wants to turn to
        turnPoint = new Phaser.Point();

        //direction the player is currently facing
        current = Phaser.RIGHT;

        //the direction that the player is wanting to turn to
        turning = Phaser.NONE;

        //sets the value of the tiles that are passable
        safetile = -1;


        game.stage.smoothed = true;

        map = this.add.tilemap('map', gridsize, gridsize);
        map.addTilesetImage('tiles');
        layer = map.createLayer(0);

        treats = this.add.physicsGroup();

        map.createFromTiles(-1, safetile, 'dot', layer, treats);

        map.setCollision(0, true, layer);

        layer.resizeWorld();

        player = this.add.sprite((startPosX * gridsize) + (gridsize/2), (startPosY * gridsize) + (gridsize/2), 'pacman', 0);
        player.anchor.setTo(0.5);

        this.physics.arcade.enable(player);
        player.body.setSize(gridsize, gridsize, 0, 0);

        cursors = this.input.keyboard.createCursorKeys();


        //add the WASD keys to the possible input
        wasd = {

            up : game.input.keyboard.addKey(Phaser.Keyboard.W),
            down: game.input.keyboard.addKey(Phaser.Keyboard.S),
            right: game.input.keyboard.addKey(Phaser.Keyboard.D),
            left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        }

        this.move(Phaser.RIGHT);


    },

    checkKeys: function () {

        //if the left key is pressed and the player not currently facing left
        if((cursors.left.isDown  || wasd.left.isDown )  && current !== Phaser.LEFT){

            this.checkDirection(Phaser.LEFT);

        }else if((cursors.right.isDown || wasd.right.isDown)  && current !== Phaser.RIGHT){

            this.checkDirection(Phaser.RIGHT );

        }else if((cursors.up.isDown || wasd.up.isDown)  && current !== Phaser.UP){

            this.checkDirection(Phaser.UP);

        }else if((cursors.down.isDown  || wasd.down.isDown )  && current !== Phaser.DOWN){

            this.checkDirection(Phaser.DOWN);

        }else{

            turning = Phaser.NONE;
        }
    },


    move: function (dir){

        var speed = spd;


        if (dir === Phaser.LEFT  || dir === Phaser.UP){

            speed = -speed;
        }

        if (dir === Phaser.LEFT || dir === Phaser.RIGHT ){

            player.body.velocity.x = speed;

        }else{

            player.body.velocity.y = speed;

        }

        player.scale.x = 1;
        player.angle = 0;

        if(dir === Phaser.LEFT)
            player.scale.x = -1;
        else if(dir === Phaser.UP)
            player.angle = 270;
        else if (dir === Phaser.DOWN)
            player.angle = 90;



        current = dir;

    },



    checkDirection : function(turningTo) {
        //3 conditions to check:
        //The player is set to turn in that direction
        //There isn't a tile in that direction
        //The tile isn't a wall

        if (turning === turningTo ||
            directions[turningTo] === null ||
            directions[turningTo].index !== -1){

            //if they are already set to turn in that direction or
            //if there isn't a tile there, or the tile's index is 0

            return;
        }

        if(current === opposites[turningTo]){
            //if the player wants to turn 180

            this.move(turningTo);

        }else{

            turning = turningTo;

            turnPoint.x = (marker.x * gridsize) + (gridsize / 2);
            turnPoint.y = (marker.y * gridsize) + (gridsize / 2);
        }
    },

    turn: function(){

        //take in the floor of the players position
        var plX = Math.floor(player.x);
        var plY = Math.floor(player.y);

        //if the player's cooridinates and the turning point
        //not within the alloted threshold, return false
        if(!this.math.fuzzyEqual(plX, turnPoint.x, threshold) ||
            !this.math.fuzzyEqual(plY, turnPoint.y, threshold)){

            return false;
        }

        //otherwise, we will align the player with the grid and
        //allow turning
        player.x = turnPoint.x;
        player.y = turnPoint.y;

        player.body.reset(turnPoint.x, turnPoint.y);

        //allow the player to turn in the desired direction
        this.move(turning);

        //reset the desired turning to none.
        turning = Phaser.NONE;

        return true;


    },

    eatTreats: function (player, treat){
        treat.kill();

        if(treats.total === 0){
            treats.callAll('revive');
        }
    },

    update: function(game) {

        //make sure the level collides with the player
        this.physics.arcade.collide(player, layer);

        //ensure the player interacts with the treat
        this.physics.arcade.overlap(player, treats, this.eatTreats, null, this);

        //find out where player is with grid coordinates
        marker.x = this.math.snapToFloor(Math.floor(player.x), gridsize) / gridsize;
        marker.y = this.math.snapToFloor(Math.floor(player.y), gridsize) / gridsize;

        var i = layer.index;
        var x = marker.x;
        var y = marker.y;

        //store the tiles around the player in the directions array
        //to be able to check if we can turn into the tile
        directions[Phaser.LEFT] = map.getTileLeft(i, x, y);
        directions[Phaser.RIGHT] = map.getTileRight(i, x, y);
        directions[Phaser.UP] = map.getTileAbove(i, x, y);
        directions[Phaser.DOWN] = map.getTileBelow(i, x, y);

        //every frame check to see if the a key is being pressed
        this.checkKeys();

        if(turning !== Phaser.NONE){
            this.turn();
        }

    },

};
