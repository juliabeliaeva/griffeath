// game
var w = 960;
var h = 960;
var n = 15;
var alive = new Array(w * h);
var tmp = new Array(w * h);
var started = false;

// pic
var ctx;
var pixels;
var cell = 1;
var element;
var colors = [82, 75, 155,
              255, 200, 35,
              0, 0, 255,
              255, 0, 0,
              0, 255, 0];

function init() {
    document.getElementById('start').onclick = function() {
        onStart();
    };
    document.getElementById('clear').onclick = function() {
        clear();
    };
    document.getElementById('randomize').onclick = function() {
        randomize();
    };
    element = document.getElementById('game');
    element.addEventListener("click", onClick, false);

    ctx = element.getContext('2d');

    pixels = ctx.createImageData(w * cell, h * cell);

    for (var i = 0; i < w * h * cell * cell; i++) {
        pixels.data[i * 4 + 3] = 255;
    }

    for (var i = 0; i < w * h; i++) {
        alive[i] = 0;
    }

    setInterval(clock, 100);
}

function clock() {
    updateGame();
    render();
    ctx.putImageData(pixels, 0, 0);
}

var f = 0;

function updateGame() {
    if (!started) return;
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var next = (alive[x + y * w] + 1) % n;
            tmp[x + y * w] = alive[x + y * w];
            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    if ((i * i) == (j * j)) {
                        continue;
                    }
                    var ii = x + i;
                    var jj = y + j;
                    if (ii < 0) {
                        ii += w;
                    } else if (ii == w) {
                        ii -= w;
                    }
                    if (jj < 0) {
                        jj += h;
                    } else if (jj == h) {
                        jj -= h;
                    }
                    if (alive[ii + jj * w] == next) {
                        tmp[x + y * w] = next;
                    }
                }
            }
        }
    }
    var swap = tmp;
    tmp = alive;
    alive = swap;
    f++;
}

function render() {
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var color = (Math.floor(alive[x + y * w] * 255 / n)) % 255;
            for (var i = 0; i < cell; i++) {
                for (var j = 0; j < cell; j++) {
                    var pixel = x * cell + i + ((y * cell + j) * w * cell);
                    for (var c = 0; c < 3; c++) {
                        pixels.data[pixel * 4 + c] = color;
                    }
                }
            }
        }
    }
}

function onClick(e) {
    if (started) return;
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= element.offsetLeft;
    y -= element.offsetTop;

    x = Math.max(0, Math.floor(x / cell));
    y = Math.max(0, Math.floor(y / cell));

    alive[x + y * w] = (alive[x + y * w] + 1) % n;
    render();
}

function onStart() {
    started = !started;
    render();
}

function clear() {
    if (started) return;
    for (var i = 0; i < w * h; i++) {
        alive[i] = 0;
    }
    render();
}

function randomize() {
    if (started) return;
    for (var i = 0; i < w * h; i++) {
        alive[i] = Math.floor(Math.random() * n) % n;
    }
    render();
}

init();
