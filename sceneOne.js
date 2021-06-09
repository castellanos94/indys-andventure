
//Aliases
var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    Graphics = PIXI.Graphics;

//Create a Pixi stage and renderer and add the 
//renderer.view to the DOM
var stage = new Container(),
    renderer = autoDetectRenderer(512, 512);
   
 var b=new Bump(PIXI);
 var c = new Charm(PIXI);
document.body.appendChild(renderer.view);
/*
 Working with sound files
=================================
*/

//Load the sounds
sounds.load([
  "sounds/overworld_L.ogg"
]);

///
loader
  .add("images/indyAdventure.json")
  .load(setup);
//Define variables that might be used in more 
//than one function
var state, explorer, treasure, blobs, dungeon,trolls,explorerShe,
    door, healthBar, message,  id, hasTreasure = false;
var gameScene, gameOverScene, gameSceneTwo;
function setup() {

  //Make the game scene and add it to the stage
  gameScene = new Container();
  stage.addChild(gameScene);
  sounds.whenLoaded=setupSound;
  //Make the sprites and add them to the `gameScene`
  //Create an alias for the texture atlas frame ids
  id = resources["images/indyAdventure.json"].textures;

  //Dungeon
  dungeon = new Sprite(id["dungeon.png"]);
  gameScene.addChild(dungeon);

  //Door
  door = new Sprite(id["door.png"]); 
  door.position.set(32, 0);
  gameScene.addChild(door);

  //Explorer
  explorer = new Sprite(id["explorerFin.png"]);
  explorer.x = 68;
  explorer.y = gameScene.height / 2 - explorer.height / 2;
  explorer.vx = 0;
  explorer.vy = 0;
  gameScene.addChild(explorer);
  
  //Treasure
  treasure = new Sprite(id["treasure.png"]);
  treasure.x = gameScene.width - treasure.width - 48;
  treasure.y = gameScene.height / 2 - treasure.height / 2;
  gameScene.addChild(treasure);

  //Make the blobs
  var numberOfBlobs = 7,
      spacing = 48,
      xOffset = 150,
      speed = 2,
      direction = 1;

  //An array to store all the blob monsters
  blobs = [];

  //Make as many blobs as there are `numberOfBlobs`
  for (var i = 0; i < numberOfBlobs; i++) {

    //Make a blob
    var blob = new Sprite(id["blob.png"]);

    //Space each blob horizontally according to the `spacing` value.
    //`xOffset` determines the point from the left of the screen
    //at which the first blob should be added
    var x = spacing * i + xOffset;

    //Give the blob a random y position
    var y = randomInt(0, stage.height - blob.height);

    //Set the blob's position
    blob.x = x;
    blob.y = y;

    //Set the blob's vertical velocity. `direction` will be either `1` or
    //`-1`. `1` means the enemy will move down and `-1` means the blob will
    //move up. Multiplying `direction` by `speed` determines the blob's
    //vertical direction
    blob.vy = speed * direction;

    //Reverse the direction for the next blob
    direction *= -1;

    //Push the blob into the `blobs` array
    blobs.push(blob);

    //Add the blob to the `gameScene`
    gameScene.addChild(blob);
    

  }

  

  //Create the health bar
  healthBar = new Container();
  healthBar.position.set(stage.width - 170, 6)
  gameScene.addChild(healthBar);

  //Create the black background rectangle
  //drawRoundedRect(x, y, width, height, cornerRadius)
  //The last argument, cornerRadius is a number in pixels that determines by how much the corners should be rounded.
  var innerBar = new Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  //Create the front red rectangle
  var outerBar = new Graphics();
  outerBar.beginFill(0xFF2000);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;
 
  gameOver();
  controlPlayer();
  //Set the game state
  state = play;
 
  //Start the game loop
  gameLoop();
}

function gameLoop(){

  //Loop this function 60 times per second
  requestAnimationFrame(gameLoop);

  //Update the current game state
  state();
  c.update();
  //Render the stage
  renderer.render(stage);
}
function gameLoop2(){
   //Loop this function 60 times per second
  requestAnimationFrame(gameLoop2);

  //Update the current game state
  state();
  c.update();
  //Render the stage
  renderer.render(stage);
}

function play() {

  //use the explorer's velocity to make it move
  explorer.x += explorer.vx;
  explorer.y += explorer.vy;

  //Contain the explorer inside the area of the dungeon
  b.contain(explorer, {x: 28, y: 10, width: 488, height: 480});
  //contain(explorer, stage);

  //Set `explorerHit` to `false` before checking for a collision
  var explorerHit = false;
 
  //Loop through all the sprites in the `enemies` array
  blobs.forEach(function(blob) {

    //Move the blob
    blob.y += blob.vy;

    //Check the blob's screen boundaries
    /*The difference is scoping-LET-. var is scoped to the nearest function block 
    and let is scoped to the nearest enclosing block (both are global if outside 
    any block), which can be smaller than a function block. */
    let blobHitsWall = b.contain(blob, {x: 28, y: 10, width: 488, height: 480});
    //If the blob hits the top or bottom of the stage, reverse
    //its direction
    if(blobHitsWall) {
		if (blobHitsWall.has("top") || blobHitsWall.has("bottom")) {
		blob.vy *= -1;
		}
	}

    //Test for a collision. If any of the enemies are touching
    //the explorer, set `explorerHit` to `true`
    if(b.hitTestRectangle(explorer, blob)) {
      explorerHit = true;
    }
  });

  //If the explorer is hit...
  if(explorerHit) {

    //Make the explorer semi-transparent
    explorer.alpha = 0.5;
    //console.log(hasTreasure);
    //Reduce the width of the health bar's inner rectangle by 1 pixel
    healthBar.outer.width -= 1;
    if(hasTreasure){
      //console.log("here");
      treasure.x= explorer.x+38;
      treasure.y= explorer.y+10;
      b.contain(treasure, {x: 28, y: 10, width: 500, height: 480});
      hasTreasure=false;
    }
    explosionSound();
  } else {

    //Make the explorer fully opaque (non-transparent) if it hasn't been hit
    explorer.alpha = 1;
  }

  //Check for a collision between the explorer and the treasure
  if (b.hitTestRectangle(explorer, treasure)) {
    hasTreasure=true;
    //If the treasure is touching the explorer, center it over the explorer
    treasure.x = explorer.x + 8;
    treasure.y = explorer.y + 20;
  }

  //Does the explorer have enough health? If the width of the `innerBar`
  //is less than zero, end the game and display "You lost!"
  if (healthBar.outer.width < 0) {
     message.text = "You lost!";
    state = end;
   
  }

  //If the explorer has brought the treasure to the exit,
  //end the game and display "You won!"
  if (b.hitTestRectangle(treasure, door)) {
    message.text = "Level 2!";
    state = changeScene;
    bonusSound();
    
  } 
}
function play2(){
  //use the explorer's velocity to make it move
  explorer.x += explorer.vx;
  explorer.y += explorer.vy;

  //Contain the explorer inside the area of the dungeon
  b.contain(explorer, {x: 10, y: 90, width: 488, height: 480});
  //contain(explorer, stage);

  //Set `explorerHit` to `false` before checking for a collision
  var explorerHit = false;
 
  //Loop through all the sprites in the `enemies` array
  trolls.forEach(function(troll) {

    //Move the troll
    troll.x += troll.vx;

    //Check the troll's screen boundaries
    /*The difference is scoping-LET-. var is scoped to the nearest function block 
    and let is scoped to the nearest enclosing block (both are global if outside 
    any block), which can be smaller than a function block. */
    let trollHitsWall = b.contain(troll, {x: 10, y: 90, width: 488, height: 480});
    //If the troll hits the right or left of the stage, reverse
    //its direction
    if(trollHitsWall) {
    if (trollHitsWall.has("right") || trollHitsWall.has("left")) {
    troll.vx *= -1;
    }
  }

    //Test for a collision. If any of the enemies are touching
    //the explorer, set `explorerHit` to `true`
    if(b.hitTestRectangle(explorer, troll)) {
      explorerHit = true;
    }
  });

  //If the explorer is hit...
  if(explorerHit) {

    //Make the explorer semi-transparent
    explorer.alpha = 0.5;
    //console.log(hasTreasure);
    //Reduce the width of the health bar's inner rectangle by 1 pixel
    healthBar.outer.width -= 1;
    if(hasTreasure){
      //console.log("here");
      treasure.x= explorer.x+38;
      treasure.y= explorer.y+10;
      b.contain(treasure, {x: 10, y: 90, width: 500, height: 480});
      hasTreasure=false;
    }
    explosionSound();
  } else {

    //Make the explorer fully opaque (non-transparent) if it hasn't been hit
    explorer.alpha = 1;
  }

  //Check for a collision between the explorer and the treasure
  if (b.hitTestRectangle(explorer, treasure)) {
    hasTreasure=true;
    //If the treasure is touching the explorer, center it over the explorer
    treasure.x = explorer.x + 8;
    treasure.y = explorer.y + 20;
  }

  //Does the explorer have enough health? If the width of the `innerBar`
  //is less than zero, end the game and display "You lost!"
  if (healthBar.outer.width < 0) {
    message.text = "You lost!";
    state = end;
    
  }

  //If the explorer has brought the treasure to the exit,
  //end the game and display "You won!"
  if (b.hitTestRectangle(treasure, explorerShe)) {
    
    state = end;
    message.text = "You won!";
    bonusSound();
    
  } 
}

function end() {
  gameOverScene.visible = true;
  c.slide(gameOverScene, 0, 0);
  c.slide(gameScene, -renderer.width, 0);
  gameScene.visible = false;
}
function changeScene(){
  gameOverScene.visible = true;
  c.slide(gameOverScene, 0, 0);
  c.slide(gameScene, -renderer.width, 0);
  gameScene.visible = false;
  ///
loader
  .add("images/sceneTwo.json")
  .load(setup2);
  
}
function setup2(){

  //Make the game scene and add it to the stage
  gameScene = new Container();
  stage.addChild(gameScene);
  sounds.whenLoaded=setupSound;
  //Make the sprites and add them to the `gameScene`
  //Create an alias for the texture atlas frame ids
  id = resources["images/sceneTwo.json"].textures;

  //Dungeon
  dungeon = new Sprite(id["sceneTwo.png"]);
  gameScene.addChild(dungeon);

  

  //Explorer
  explorer = new Sprite(id["explorerFin.png"]);
  explorer.x = 50;
  explorer.y = 500 - explorer.height ;
  explorer.vx = 0;
  explorer.vy = 0;
  gameScene.addChild(explorer);
  
  //Treasure
  treasure = new Sprite(id["treasure.png"]);
  treasure.x = explorer.x + 8;
  treasure.y = explorer.y + 20;
  gameScene.addChild(treasure);

  //Explorer she
  explorerShe = new Sprite(id["explorerShe.png"]);
  explorerShe.x = gameScene.width - explorerShe.width - 48;
  explorerShe.y = 100;
  explorerShe.vx = 0;
  explorerShe.vy = 0;
  gameScene.addChild(explorerShe);

  //Make the trolls
  var numberOfTrolls = 4,
      spacing = 65,
      yOffset = 120,
      speed = 2,
      direction = 1;

  //An array to store all the troll monsters
  trolls = [];

  //Make as many trolls as there are `numberOftrolls`
  for (var i = 0; i < numberOfTrolls; i++) {

    //Make a troll
    var troll = new Sprite(id["troll_1.png"]);

    //Space each troll horizontally according to the `spacing` value.
    //`xOffset` determines the point from the left of the screen
    //at which the first troll should be added
    var x = randomInt(0, stage.height - troll.height);

    //Give the troll a random y position
    var y = spacing * i + yOffset;

    //Set the troll's position
    troll.x = x;
    troll.y = y;

    //Set the troll's vertical velocity. `direction` will be either `1` or
    //`-1`. `1` means the enemy will move down and `-1` means the troll will
    //move up. Multiplying `direction` by `speed` determines the troll's
    //vertical direction
    troll.vx = speed * direction;

    //Reverse the direction for the next troll
    direction *= -1;

    //Push the troll into the `trolls` array
    trolls.push(troll);

    //Add the troll to the `gameScene`
    gameScene.addChild(troll);
    

  }

  

  //Create the health bar
  healthBar = new Container();
  healthBar.position.set(stage.width - 170, 6)
  gameScene.addChild(healthBar);

  //Create the black background rectangle
  //drawRoundedRect(x, y, width, height, cornerRadius)
  //The last argument, cornerRadius is a number in pixels that determines by how much the corners should be rounded.
  var innerBar = new Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  //Create the front red rectangle
  var outerBar = new Graphics();
  outerBar.beginFill(0xFF2000);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;
  
  controlPlayer();
  //Set the game state
  state = play2;
 
  //Start the game loop
  gameLoop2();
}

function gameOver(){
   //----------------------GAME OVER-------------------------
  //Create the `gameOver` scene
  gameOverScene = new Container();
  //slide trans
  gameOverScene.x=renderer.width;

  stage.addChild(gameOverScene);

  //Make the `gameOver` scene invisible when the game first starts
  gameOverScene.visible = false;

  //Create the text sprite and add it to the `gameOver` scene
  message = new Text(
    "The End!", 
    {font: "64px Futura", fill: "white"}
  );
  message.x = 120;
  message.y = stage.height / 2 - 32;
  gameOverScene.addChild(message);

}
/* Helper functions */

//The `randomInt` helper function
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//The `keyboard` helper function
function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}
function controlPlayer(){
  //Capture the keyboard arrow keys
  var left = keyboard(37),
      up = keyboard(38),
      right = keyboard(39),
      down = keyboard(40);

  //Left arrow key `press` method
  left.press = function() {

    //Change the explorer's velocity when the key is pressed
    explorer.vx = -5;
    explorer.vy = 0;
  };

  //Left arrow key `release` method
  left.release = function() {

    //If the left arrow has been released, and the right arrow isn't down,
    //and the explorer isn't moving vertically:
    //Stop the explorer
    if (!right.isDown && explorer.vy === 0) {
      explorer.vx = 0;
    }
  };

  //Up
  up.press = function() {
    explorer.vy = -5;
    explorer.vx = 0;
  };
  up.release = function() {
    if (!down.isDown && explorer.vx === 0) {
      explorer.vy = 0;
    }
  };

  //Right
  right.press = function() {
    explorer.vx = 5;
    explorer.vy = 0;
  };
  right.release = function() {
    if (!left.isDown && explorer.vy === 0) {
      explorer.vx = 0;
    }
  };

  //Down
  down.press = function() {
    explorer.vy = 5;
    explorer.vx = 0;
  };
  down.release = function() {
    if (!up.isDown && explorer.vx === 0) {
      explorer.vy = 0;
    }
  };

}
//The sound effect functions
function setupSound() {
    //Create the sounds
  var   music = sounds["sounds/overworld_L.ogg"];

  //Make the music loop
  music.loop = true;

  //Set the pan 
  music.pan = 0;

  //Set the music volume
  music.volume = 0.7;  

  //Capture the keyboard events
  music.play();
  var p = keyboard(80),
      m = keyboard(77);
     
  //Control the sounds based on which keys are pressed

  //Play the loaded music sound
  p.press = function() {
    if (!music.playing) {
      music.play();
    }
  }

  //Pause the music 
  m.press = function() {
    music.pause();
    };
}
//The explosion sound
function explosionSound() {
  soundEffect(
    16,          //frequency
    0,           //attack
    1,           //decay
    "sawtooth",  //waveform
    .5,           //volume
    0,           //pan
    0,           //wait before playing
    0,           //pitch bend amount
    false,       //reverse
    0,           //random pitch range
    50,          //dissonance
    undefined,   //echo: [delay, feedback, filter]
    undefined    //reverb: [duration, decay, reverse?]
  );
}

//The bonus points sound
function bonusSound() {
  //D
  soundEffect(587.33, 0, 0.2, "square", 1, 0, 0);
  //A
  soundEffect(880, 0, 0.2, "square", 1, 0, 0.1);
  //High D
  soundEffect(1174.66, 0, 0.3, "square", 1, 0, 0.2);
}