function Board(setup) {
  //All boards must be able to recreate themselves based on this.getSetup()
  if(setup && setup.pinKeyframes){
    this.pinKeyframes = setup.pinKeyframes;
  }
}

Board.prototype.canvasWidth = null;
Board.prototype.canvasHeight = null;
Board.prototype.context = null;
Board.prototype.pinKeyframes = [];
Board.prototype.DOMKeyframes = [];

Board.prototype.imageURL = null;
Board.prototype.type = "Board";

Board.prototype.setContext = function(context){
  this.context = context;
}

Board.prototype.drawInfo = function(ctx, frame, index, frameManager){
  ctx.globalAlpha = 1;
  ctx.fillStyle = "black";
  ctx.font = "15px monospace";
  ctx.fillText("Frame: " + index, this.shieldImg.width + 10, 15);
  ctx.fillText("PostDelay: " + frame.postDelay, this.shieldImg.width + 10, 35);
  ctx.fillText("By " + this.context.name, this.shieldImg.width + 10, 55);
  ctx.fillText("Exercise " + this.context.exerciseNumber, this.shieldImg.width + 10, 75);

  ctx.fillText(this.context.dateString, this.shieldImg.width + 10, 115);
  ctx.fillText(this.context.timeString, this.shieldImg.width + 10, 135);

  ctx.font = "bold 15px monospace";
  ctx.fillStyle = ((typeof(this.context.isCorrect) === "undefined") || (this.context.isCorrect === false)) ? "red" : "green";
  var gradeText = (this.context.isCorrect === true) ? "Correct" : ((this.context.isCorrect === false) ? "Incorrect" : "Ungraded");
  ctx.fillText(gradeText, this.shieldImg.width + 10, 175);
}

Board.prototype.draw = function(ctx, frame, index, frameManager) {
  this.drawInfo();
}

Board.prototype.removeKeyframe = function (keyframe) {
  this.DOMKeyframes.remove($(keyframe).parent().parent()[0]);
  $(keyframe).parent().parent().remove();
  saveContext(); //runs updateInputs
}

Board.prototype.addKeyframe = function(time, pin, value) {
  var newContent = $(`<tr class="input-keyframe">
  <td><input type="number" class="form-control keyframe-time" value="0" min="0"/></td>
  <td><input type="number" class="form-control keyframe-pin" value="0" min="0" max="255"/></td>
  <td><input type="number" class="form-control keyframe-value" value="0" min="0" max="1023"/></td>
  <td><button class="btn btn-danger keyframe-remove" onclick="currentBoard.removeKeyframe(this)">-</button></td>
  </tr>`);
  $("#keyframe-table-tbody").append(newContent);

  if (time) {
    timeField = newContent.find(".keyframe-time")[0];
    timeField.valueAsNumber = Number(time);
  }

  if (pin) {
    pinField = newContent.find(".keyframe-pin")[0];
    pinField.valueAsNumber = Number(pin);
  }

  if (value) {
    valueField = newContent.find(".keyframe-value")[0];
    valueField.valueAsNumber = Number(value);
  }

  this.DOMKeyframes.push(newContent[0]);

}

Board.prototype.activate = function(){
  var setup = $(`
          <table class="table" id="keyframe-table">
            <thead>
              <tr>
                <th>At time (ms)</th>
                <th>Change pin</th>
                <th>To value</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody id="keyframe-table-tbody"></tbody>
          </table>
          <button class="btn btn-success" id="add-keyframe" onclick="currentBoard.addKeyframe(); saveContext()">Add</button>`);

  $("#edit").append(setup);

  for (var i = 0; i < this.pinKeyframes.length; i++) {
    var keyframe = this.pinKeyframes[i];
    this.addKeyframe(keyframe.time, keyframe.pin, keyframe.value);
  }
};

Board.prototype.getSetup = function(){
  this.updateInputs();
  return {pinKeyframes: this.pinKeyframes};
};

Board.prototype.updateInputs = function(){
  var out = [];
  for (var i = 0; i < this.DOMKeyframes.length; i++) {
    var keyframe = $(this.DOMKeyframes[i]);
    var keyframeTime = keyframe.find(".keyframe-time")[0].valueAsNumber;
    var keyframePin = keyframe.find(".keyframe-pin")[0].valueAsNumber;
    var keyframeValue = keyframe.find(".keyframe-value")[0].valueAsNumber;
    out.push({time: keyframeTime, pin: keyframePin, value: keyframeValue});
  }
  this.pinKeyframes = out;
};

/**
  Light Sculpture Board
**/
function LEDBoard(setup) {
  this.ledLookup = {
    2: {x: 87, y: 165, color: "red"},
    3: {x: 87, y: 140, color: "green"},
    4: {x: 87, y: 115, color: "red"},
    5: {x: 87, y: 90, color: "green"},
    6: {x: 87, y: 65, color: "red"},
    7: {x: 87, y: 35, color: "green"},
    8: {x: 87, y: 10, color: "red"},

    9: {x: 5, y: 165, color: "orange"},
    10: {x: 5, y: 140, color: "orange"},
    11: {x: 5, y: 115, color: "orange"},
    12: {x: 5, y: 90, color: "blue"},
    13: {x: 5, y: 65, color: "blue"},
    14: {x: 5, y: 35, color: "yellow"},
    15: {x: 5, y: 7, color: "yellow"}
  };

  if(setup && setup.pinKeyframes){
    this.pinKeyframes = setup.pinKeyframes;
  }

}

LEDBoard.prototype = Object.create(Board.prototype);
LEDBoard.prototype.imageURL = "/img/LED-Shield.gif";
LEDBoard.prototype.type = "LED Board";
LEDBoard.prototype.canvasWidth = 300;
LEDBoard.prototype.canvasHeight = 195;

LEDBoard.prototype.advance = function(frame, index, frameManager) {
  this.currentFrame = frame;
  this.currentIndex = index;
  this.frameManager = frameManager;
};

LEDBoard.prototype.draw = function(ctx) {
  var frame = this.currentFrame;
  var index = this.currentIndex;
  var frameManager = this.frameManager;

  ctx.drawImage(this.shieldImg, 0, 0);

  for (var i = 2; i <= 15; i++) {
    if (frame.getPinState(i) >= 1) { //if it's on
      var alpha = (frame.getPinMode(i) === OUTPUT) ? 1 : 0.2; //Make sure it's an output, otherwise dim it
      alpha *= frame.getPinState(i) / ANALOG_MAX;
      alpha = Math.max(alpha, 0.3); //Clamp it for usability purposes
      var radius = 7;
      var ledDescriptor = this.ledLookup[i];
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ledDescriptor.color;
      ctx.strokeStyle = ledDescriptor.color;
      ctx.beginPath();
      ctx.arc(ledDescriptor.x + radius, ledDescriptor.y + radius, radius, 0, 2 * Math.PI, false);
      ctx.closePath();
      ctx.fill();
    }
  }

  this.drawInfo(ctx, frame, index, frameManager);
};

/**
  Kinetic Sculpture Board
**/
function KSBoard(setup) {
  if(setup && setup.pinKeyframes){
    this.pinKeyframes = setup.pinKeyframes;
    console.log(setup);
  }
}

KSBoard.prototype = Object.create(Board.prototype);

KSBoard.prototype.imageURL = "/img/KS-Shield.gif";
KSBoard.prototype.type = "KS Board";
KSBoard.prototype.canvasWidth = 450;
KSBoard.prototype.canvasHeight = 350;

/*
  A5/D54: BTN-UP
  A6/D55: BTN-MODE
  A7/D56: BTN-DOWN

  D13: D1

  D12: M2 SPD
  D11: M1 SPD

  D14: M2 DIR
  D15: M1 DIR

  D18: TACH 2
  D19: TACH 1

  D6: LED GRN
  D7: LED BLUE
  D8: LED RED

  D4: US TRIG
  D3: US ECHO

*/

KSBoard.prototype.advance = function(frame, index, frameManager) {
  this.currentFrame = frame;
  this.currentIndex = index;
  this.frameManager = frameManager;
};

KSBoard.prototype.draw = function(ctx){
  var frame = this.currentFrame;
  var index = this.currentIndex;
  var frameManager = this.frameManager;

  ctx.drawImage(this.shieldImg, 0, 0, 450, 255);

  //Draw D1
  if (frame.getPinState(13) >= 1) { //if it's on
    var alpha = (frame.getPinMode(13) === OUTPUT) ? 1 : 0.2; //Make sure it's an output, otherwise dim it
    alpha *= frame.getPinState(13) / ANALOG_MAX;
    alpha = Math.max(alpha, 0.3); //Clamp it for usability purposes
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(209, 171, 7, 0, 2 * Math.PI);
    ctx.fill();
  }

  //Draw LEDs
  var r = 0;
  var g = 0;
  var b = 0;
  if(frame.getPinMode(8) === OUTPUT){
    r = Math.floor(frame.getPinState(8) * 255 / ANALOG_MAX);
  }
  if(frame.getPinMode(6) === OUTPUT){
    g = Math.floor(frame.getPinState(6) * 255 / ANALOG_MAX);
  }
  if(frame.getPinMode(7) === OUTPUT){
    b = Math.floor(frame.getPinState(7) * 255 / ANALOG_MAX);
  }
  ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + (Math.max(r,g,b)/255) + ")";
  for (var x = 15; x < 150; x += 53) {
    ctx.beginPath();
    ctx.arc(x, 33, 7, 0, 2 * Math.PI);
    ctx.fill();
  }

  //Draw buttons
  ctx.fillStyle = "saddlebrown";
  if(frame.getPinState(56) === ANALOG_MAX){
    ctx.beginPath();
    ctx.arc(270, 127, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
  if(frame.getPinState(55) === ANALOG_MAX){
    ctx.beginPath();
    ctx.arc(295, 127, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
  if(frame.getPinState(54) === ANALOG_MAX){
    ctx.beginPath();
    ctx.arc(320, 127, 5, 0, 2 * Math.PI);
    ctx.fill();
  }

  //Draw motor directions


  //Draw motor speeds


  //Draw US
  if (frame.getPinState(4) >= 1 && frame.getPinMode(4) === OUTPUT) {
    ctx.strokeStyle = "red";
    for (var i = 140; i > 90; i -= 10) {
      ctx.beginPath();
      ctx.arc(i, 105, 100, Math.PI - 0.4, Math.PI + 0.4);
      ctx.stroke();
    }
  }
  if (frame.getPinState(3) >= 1 && frame.getPinMode(3) === INPUT) {
    ctx.strokeStyle = "red";
    for (var i = 140; i > 90; i -= 10) {
      ctx.beginPath();
      ctx.arc(i - 200, 165, 100, -0.4, 0.4);
      ctx.stroke();
    }
  }

  this.drawInfo(ctx, frame, index, frameManager);
};

var BOARDS = {
  "LED Board": LEDBoard,
  "KS Board": KSBoard
};

for(var b in BOARDS){
  if(BOARDS.hasOwnProperty(b)){
    BOARDS[b].prototype.shieldImg = new Image;
    BOARDS[b].prototype.shieldImg.src = BOARDS[b].prototype.imageURL;
    console.log("Loading background image for board: " + b);
    var o = document.createElement("option");
    o.innerHTML = BOARDS[b].prototype.type;
    $("#board").append(o);
  }
}

function createBoard(type, setup){
  if(type === null || !(type in BOARDS)){
    console.log("Invalid board type -- loading defaultBoard");
    return new LEDBoard();;
  }
  var m;
  //Thanks javascript...
  if(typeof setup === 'string' || setup instanceof String){
    try {
      m = JSON.parse(setup);
    } catch (e) {
      console.log("Invalid setup -- loading with setup = {}");
      m = {};
    }
  } else {
    m = setup;
  }
  return new BOARDS[type](m);
}
