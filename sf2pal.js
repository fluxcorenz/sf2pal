var obj;
var pal; //stored as array of XRGB

var phpUrl = 'http://example.com/sf2pal.php';
var transBgUrl = 'https://example.com/greyhatch8px.png';

var currentScaling = 1;

var selectedPalIdx = -1;
var highlightPalIdx = -1;

var c0 = document.getElementById("c_canvas0");
var ctx0 = c0.getContext('2d');

var c1 = document.getElementById('c_canvas1');
var ctx1 = c1.getContext('2d');

var rgb = {};
var hsv = {};
var hsl = {};
rgb.r = 128;
rgb.g = rgb.b = 64;
hsv.h = 0;
hsv.s = hsv.v = .5;
hsl.h = 0;
hsl.s = .33;
hsl.l = .38;

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

var urlVars = getUrlVars();

function processChar(json) {
  obj = JSON && JSON.parse(json) || $.parseJSON(json);
  var master=document.getElementById("palSel");
  master.options.length = 0;
  for (i=0; i<obj.palettes.length; i++){
    master.options[master.options.length] = new Option(obj.palettes[i].name, obj.palettes[i].value);
  }
  master.options[master.options.length] = new Option("Custom", "custom");

  if (typeof urlVars["pal"] != "undefined" && urlVars["pal"] !== null) {
    var input = sanitisePal(urlVars["pal"]);
    if (input == "") {
      alert("Invalid link");
    } else {
      pal = palmodToArray(input);
      master.selectedIndex = master.options.length - 1; // select the custom palette
      urlVars["pal"] = null;
    }
  }

  redraw();
}

function selectCharImpl(char) {
  var url = phpUrl + '?char=' + char + '&callback=processChar';
  var scr = document.createElement('SCRIPT');
  scr.type = 'text/javascript';
  scr.src = url;
  document.getElementsByTagName('HEAD')[0].appendChild(scr);
}

function selectChar() {
  selectCharImpl(document.getElementById("char").value);
}

function getColour(context, mousePos) {
  imageData = context.getImageData(mousePos.x, mousePos.y, 1, 1);
  return  'rgb(' + imageData.data[4] + ', ' + imageData.data[5] + ', ' + imageData.data[6] + ')' + "XRGB=0" + (imageData.data[4]).toString(16).charAt(0) + (imageData.data[5]).toString(16).charAt(0) + (imageData.data[6]).toString(16).charAt(0); 
}

function drawGrad() {
    var grad0 = ctx0.createLinearGradient(0,0,c0.width,0);
    grad0.addColorStop(0,'hsla(0,0%,100%,1)');
    grad0.addColorStop(1,'hsla(0,0%,100%,0)');
    ctx0.fillStyle = grad0;
    ctx0.fillRect(0,0,c0.width,c0.height);
    var grad1 = ctx0.createLinearGradient(0,0,0,c0.height);
    grad1.addColorStop(0,'hsla(0,0%,0%,0)');
    grad1.addColorStop(1,'hsla(0,0%,0%,1)');
    ctx0.fillStyle = grad1;
    ctx0.fillRect(0,0,c0.width,c0.height);
}

function shiftHue(context, width, height){
    context.fillStyle='hsl('+hsl.h*360+',100%,50%)';
    context.fillRect(0,0,width,height);    
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0;
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}



function hsvToRgb(h, s, v) {
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function rgbToHsv(r, g, b) {
    r = r/255, g = g/255, b = b/255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if(max == min){
        h = 0;
    }else{
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, v];
}


function convertHsv() {
    var rgbC = hsvToRgb(hsv.h,hsv.s,hsv.v);
    
    rgb.r = Math.round(rgbC[0]);
    rgb.g = Math.round(rgbC[1]);
    rgb.b = Math.round(rgbC[2]);
    
    var hslC = rgbToHsl(rgb.r,rgb.g,rgb.b);
    
    hsl.h = hslC[0];
    hsl.s = hslC[1];
    hsl.l = hslC[2];    
    redraw();
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ];
}

function drawCrosshair(){

    x = hsv.s*c0.width;
    y = (1-hsv.v)*c0.height;
   
    //reverse
    var oH = Math.round((hsl.h*360+180)%360);
    var oS = Math.round((hsl.s)*100);
    var oL = Math.round((1-hsl.l)*100)

    ctx0.beginPath();
    ctx0.moveTo(x-10,y);
    ctx0.lineTo(x+10,y);
    ctx0.moveTo(x,y-10);
    ctx0.lineTo(x,y+10);
    ctx0.lineWidth = 2;
    ctx0.strokeStyle = 'hsl('+oH+','+oS+'%,'+oL+'%)';
    ctx0.stroke();
}

function hexToGbxr(hex) {
  var r = hex.charAt(0);
  var ra = parseInt("0x" + hex.charAt(1));
  var ga = parseInt("0x" + hex.charAt(3));
  var ba = parseInt("0x" + hex.charAt(5));

  var g = hex.charAt(2);
  var b = hex.charAt(4);
  var x = 0;
  if (ra > 7) {
    x += 4;
  }
  if (ga > 7) {
    x += 2;
  }
  if (ba > 7) {
    x += 1;
  }
  return {'g': g, 'b': b, 'x': x, 'r': r};
}

function redrawPicker() {
  ctx0.clearRect(0, 0, 256, 256);
  ctx0.fillStyle = 'hsl(' + hsv.h * 360 + ', 100%, 50%)';
  ctx0.fillRect(0, 0, 256, 256);
  drawGrad();  
  drawCrosshair();

  var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  document.getElementById('hexcode').value = "#" + hex;    

  document.getElementById('rinp').value = rgb.r;
  document.getElementById('ginp').value = rgb.g;
  document.getElementById('binp').value = rgb.b;

  var gbxr = hexToGbxr(hex);
  document.getElementById('gbxr').value = gbxr.g + gbxr.b + gbxr.x + gbxr.r;
    
  if (selectedPalIdx != -1) {
    pal[selectedPalIdx] = gbxr.x + gbxr.r + gbxr.g + gbxr.b;
    var mylist=document.getElementById("palSel");
    mylist.selectedIndex = mylist.options.length - 1; // select the custom palette
    redraw();
  }
}

function updateFromRgb() {
  rgb.r = parseInt(document.getElementById('rinp').value);
  rgb.g = parseInt(document.getElementById('ginp').value);
  rgb.b = parseInt(document.getElementById('binp').value);

  var hex = rgbToHex(rgb.r, rgb.g, rgb.b); 
  updateFromHexcode("#" + hex);
}

function updateFromGBXR(gbxr) {
  updateFromHexcode("#" + gbxr.charAt(3) + "0" + gbxr.charAt(0) + "0" + gbxr.charAt(1) + "0");
}

function updateFromHexcode(hex) {
  var rgbC = hexToRgb(hex);
    
  rgb.r = Math.round(rgbC[0]);
  rgb.g = Math.round(rgbC[1]);
  rgb.b = Math.round(rgbC[2])
    
  var hsvC = rgbToHsv(rgb.r,rgb.g,rgb.b);

  hsv.h = hsvC[0];
  hsv.s = hsvC[1];
  hsv.v = hsvC[2];
     
  var hslC = rgbToHsl(rgb.r,rgb.g,rgb.b);
    
  hsl.h = hslC[0];
  hsl.s = hslC[1];
  hsl.l = hslC[2];
    
  shiftHue(ctx0, c0.width, c0.height);
  redrawPicker();
}

function drawPicker() {
  var gradient = ctx0.createLinearGradient(0, 0, c0.width, 0);
 
    var grad0 = ctx0.createLinearGradient(0,0,c0.width,0);
    grad0.addColorStop(0,'hsla(0,0%,100%,1)');
    grad0.addColorStop(1,'hsla(0,0%,100%,0)');
    ctx0.fillStyle = grad0;
    ctx0.fillRect(0,0,c0.width,c0.height);
    var grad1 = ctx0.createLinearGradient(0,0,0,c0.height);
    grad1.addColorStop(0,'hsla(0,0%,0%,0)');
    grad1.addColorStop(1,'hsla(0,0%,0%,1)');
    ctx0.fillStyle = grad1;
    ctx0.fillRect(0,0,c0.width,c0.height);
 
      c0.addEventListener('click', function(evt) {
        hsv.s = (evt.offsetX)/c0.width;
        hsv.v = (c0.height - evt.offsetY)/c0.height;
        convertHsv();
        redrawPicker();

      }, false);

  var gradH0 = ctx1.createLinearGradient(0, 0, c0.width, 0);
  gradH0.addColorStop(0, 'hsl(0,100%,50%)');
  var hue = 0;
  var step = 0;
  for (hue; hue < 360; hue++){
    step = hue / 360;
    gradH0.addColorStop(step, 'hsl('+hue+',100%,50%)');
  }
  ctx1.fillStyle = gradH0;
  ctx1.fillRect(0, 0, c0.width, 16);
    c1.addEventListener('click', function(evt) {
      var hueX = evt.offsetX;
      hsl.h = hsv.h = hueX / c1.width;
      shiftHue(ctx0, c0.width, c0.height);
      convertHsv();
      redrawPicker();
    }, false);
}

function getPos(el) {
    // yay readability
    for (var lx=0, ly=0;
         el != null;
         lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
    return {x: lx,y: ly};
}

function paletteDisplay() {
  var pal_disp = document.getElementById("pal2");
  for (var idx = 0, len = 16; idx < len; idx++) {
    var div = document.createElement('div');
    div._idx = idx;
    div.id = 'pal_' + idx;
    div.className = 'palette_color';
    if (idx > 0) { //don't allow editing the transparency colour
      div.onmouseover = function() { highlightPalIdx = this._idx; redraw();};
      div.onmouseout = function() { highlightPalIdx = -1; redraw();};
      div.onclick = function() { selectedPalIdx = this._idx; showColourPicker(this._idx) };
    }
    div.style.width="24px";
    div.style.height="24px";
    div.style.float="left";
    div.style.borderRight="1px solid white";
    div.style.borderBottom="1px solid white";
    pal_disp.appendChild( div );
  }
  var div = document.createElement('div');
  div.className = 'clear';
  pal_disp.appendChild( div );
}

function showColourPicker(idx) {
  var picker = document.getElementById('colour_pick');
  var div = document.getElementById('pal_' + idx);
  var pos = getPos(div);
  picker.style.display='block';
  picker.style.position='absolute';
  picker.style.top=div.offsetTop + 20 + "px";
  picker.style.left=div.offsetLeft + 20 + "px";

  var hexEl = document.getElementById('hexcode');
  var palcol = pal[idx];
  hexEl.value= "#" + palcol.charAt(1) + "0" + palcol.charAt(2) + "0" + palcol.charAt(3) + "0";
  updateFromHexcode(hexEl.value);
}

function redraw() {
  var mylist=document.getElementById("palSel");
  var selection = mylist.options[mylist.selectedIndex].value;

  if (mylist.selectedIndex != mylist.options.length - 1) { //should never come in here on the first call, so pal should be set.
    pal = palmodToArray(selection);
  }
  drawPalette(pal);  
  updatePalmod(pal);
  updateROM(pal);
  drawSprite(pal);
}

function updateLink(str) {
  var link = document.getElementById("link");
  link.value = document.location.protocol + "//" 
             + document.location.hostname
             + document.location.pathname 
             + "?char=" + document.getElementById("char").value 
             + "&pal=" + str;
}

function updatePalmod(palarray) {
  var palmod = document.getElementById("palmod");
  var str = "($1";
  for (var i = 0; i < palarray.length; i++) {
    str += palarray[i];
    //var palcol = palarray[i];
    //str += palcol.charAt(1) + palcol.charAt(2) + palcol.charAt(3) + palcol.charAt(0);
  }
  str += ")";
  palmod.value = str;
  updateLink(str);
}

function updateROM(palarray) {
  var rom = document.getElementById("rom");
  var byteswap = document.getElementById("byteswap").checked;

  var str = "";
  for (var i = 0; i < palarray.length; i++) {
    //palarray is XRGB
    if (byteswap) {
      str += palarray[i].charAt(2) + palarray[i].charAt(3) + palarray[i].charAt(0) + palarray[i].charAt(1);
    } else {
      str += palarray[i];
    }
  }
  rom.value = str;
}

function updateFromROM() {
  var rom = document.getElementById("rom").value;
  var byteswap = document.getElementById("byteswap").checked;
  if (rom.length != pal.length * 4) {
    alert("Malformed ROM value, 16 hex chars only please");
    return;
  }
  for (var i = 0; i < rom.length; i += 4) {
    if (byteswap) {
      pal[i/4] = rom.charAt(i + 2) + rom.charAt(i + 3) + rom.charAt(i) + rom.charAt(i + 1);
    } else {
      pal[i/4] = rom.substr(i, 4);
    }
  }
  var mylist=document.getElementById("palSel");
  mylist.selectedIndex = mylist.options.length - 1; // select the custom palette  
}

function drawPalette(palarray) {
  for (var i = 0; i < palarray.length; i++) {
    var paldiv = document.getElementById("pal_" + i);
    if (i == 0) {
      if (paldiv.style.backgroundImage == "") {
        paldiv.style.backgroundImage='url(transBgUrl)';
      }
    } else if (i == highlightPalIdx) {
      paldiv.style.backgroundColor="#F000F0";
    } else {
      var palcol = palarray[i];
      paldiv.style.backgroundColor = "#" + palcol.charAt(1) + "0" + palcol.charAt(2) + "0" + palcol.charAt(3) + "0";
    }
  }
}

function palmodToArray(palmod) {
  var arr = new Array((palmod.length - 4) / 4);
  for (var idx = 0; idx < (palmod.length - 4) / 4; idx++) { //extra minus one due to trailing bracket
    var pos = 3 + (idx * 4);
    arr[idx] = palmod.charAt(pos) + palmod.charAt(pos + 1) + palmod.charAt(pos + 2) + palmod.charAt(pos + 3);
  }
  return arr;
}

function wipeContext(context, width, height) {
  // Store the current transformation matrix
  context.save();

  // Use the identity matrix while clearing the canvas
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);

  // Restore the transform
  context.restore();
}

function drawSprite(palarray) {
  var drawingCanvas = document.getElementById('sprite');
  if (drawingCanvas.getContext) {
    var context = drawingCanvas.getContext('2d');

    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    if (isSafari) {
      drawingCanvas.width = 128;
      drawingCanvas.height = 128;
    } 

    wipeContext(context, drawingCanvas.width, drawingCanvas.height);

    var ratio = context.webkitBackingStorePixelRatio || 1;

    var tempCanvas = document.createElement("canvas");
    tempCtx = tempCanvas.getContext("2d");

    var imgd = null;
    if (ratio != 1) { //apple retina silliness
      imgd = tempCtx.webkitGetImageDataHD(0, 0, obj.width, obj.height);
    } else {
      imgd = tempCtx.getImageData(0, 0, obj.width, obj.height);
    }

    var pix = imgd.data;
    for (var i = 0; i < pix.length; i += 4) {
      var idx = obj.pixels[i/4];
      if (idx == highlightPalIdx) {
        pix[i] = 255;
        pix[i+1] = 0;
        pix[i+2] = 255;
        pix[i+3] = idx == 0 ? 0 : 255;
      } else {
        var colour = palarray[obj.pixels[i/4]];
        pix[i  ] = parseInt(colour.charAt(1), 16) * 0x10; // red channel
        pix[i+1] = parseInt(colour.charAt(2), 16) * 0x10; // green channel
        pix[i+2] = parseInt(colour.charAt(3), 16) * 0x10; // blue channel
        pix[i+3] = obj.pixels[i/4] == 0 ? 0 : 255; // alpha channel
      }
    }

    tempCtx.putImageData(imgd, 0, 0);

    if(context.webkitImageSmoothingEnabled) { //for chrome
      context.webkitImageSmoothingEnabled = false;
      if (currentScaling != 2) {    
        context.scale(2, 2);
        currentScaling = 2;
      }
    } 
    context.drawImage(tempCanvas, 0, 0);
  }
}

function checkParent(t,el) {
  while (t.parentNode) { 
    if (t == el) {
      return true;
    } 
    t = t.parentNode;
  } 
  return false;
}

function sanitiseChar(input) {
  return input.replace(/\W/g, '');
}

function sanitisePal(input) {
  if (input.length != 68 || input.slice(0, 3) != "($1" || input.slice(-1) != ")") {
    return "";
  }
  return input;
}

if (document.addEventListener) {
  // Good browsers
  document.addEventListener("DOMContentLoaded", function() {
    document.removeEventListener("DOMContentLoaded", arguments.callee, false );
  
    var hexcode = document.getElementById('hexcode');
    hexcode.addEventListener('change', function(evt) {
      updateFromHexcode(hexcode.value);
    }, false);
    
    var rinp = document.getElementById('rinp');
    rinp.addEventListener('change', function(evt) {
      updateFromRgb();
    }, false);
    var ginp = document.getElementById('ginp');
    ginp.addEventListener('change', function(evt) {
      updateFromRgb();
    }, false);
    var binp = document.getElementById('binp');
    binp.addEventListener('change', function(evt) {
      updateFromRgb();
    }, false);

    var gbxrinp = document.getElementById('gbxr');
    gbxrinp.addEventListener('change', function(evt) {
      updateFromGBXR(gbxrinp.value);
    }, false);    

    var byteswapcheckbox = document.getElementById('byteswap');
    byteswapcheckbox.addEventListener('change', function(evt) {
      updateROM(pal);
    }, false);
  
    var rominput = document.getElementById('rom');
    rominput.addEventListener('change', function(evt) {
      updateFromROM();
      redraw();
    }, false);

    var palmodinput = document.getElementById('palmod');
    palmodinput.addEventListener('change', function(evt) {
       var input = sanitisePal(palmodinput.value);
       if (input == "") {
         alert("Malformed Palmod value.");
         return;
       }
       pal=palmodToArray(input);
       var mylist=document.getElementById("palSel");
       mylist.selectedIndex = mylist.options.length - 1; // select the custom palette  
       redraw();
    }, false);

    document.onclick=check;
    function check(e) {
      var target = (e && e.target) || (event && event.srcElement);
      var pal2 = document.getElementById('pal2');
      var obj = document.getElementById('colour_pick');
      if (!checkParent(target,obj) && !checkParent(target,pal2)) {
        obj.style.display='none';
      }
    }

    paletteDisplay();

    if (typeof urlVars["char"] != "undefined" && typeof urlVars["pal"] != "undefined") {
     var char = sanitiseChar(urlVars["char"]);
     document.getElementById("char").value = char;
     selectCharImpl(char);
    } else {
      selectChar();
    }
    drawPicker();
  }, false );
}
