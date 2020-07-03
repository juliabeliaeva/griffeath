function $(id) {
    return document.getElementById(id);
}

$('start').onclick = function() {
    onStart();
};
$('clear').onclick = function() {
    clear();
};
$('randomize').onclick = function() {
    randomize();
};

function updateUI() {
    if (started) {
        $('start').value = "Pause"
    } else {
        $('start').value = "Play"
    }
    $('clear').disabled = started;
    $('randomize').disabled = started;
}

class Field {
    constructor(width, height) {
        this.w = width;
        this.h = height;
        this.n = 15;
        this.alive = new Array(this.w * this.h);
        this.tmp = new Array(this.w * this.h);
    }

    update() {
        var changed = false;
        for (var x = 0; x < this.w; x++) {
            for (var y = 0; y < this.h; y++) {
                var next = (this.alive[x + y * this.w] + 1) % this.n;
                this.tmp[x + y * this.w] = this.alive[x + y * this.w];
                for (var i = -1; i < 2; i++) {
                    for (var j = -1; j < 2; j++) {
                        if ((i * i) == (j * j)) {
                            continue;
                        }
                        var ii = x + i;
                        var jj = y + j;
                        if (ii < 0) {
                            ii += this.w;
                        } else if (ii == this.w) {
                            ii -= this.w;
                        }
                        if (jj < 0) {
                            jj += this.h;
                        } else if (jj == this.h) {
                            jj -= this.h;
                        }
                        if (this.alive[ii + jj * this.w] == next) {
                            this.tmp[x + y * this.w] = next;
                            changed = true;
                        }
                    }
                }
            }
        }
        var swap = this.tmp;
        this.tmp = this.alive;
        this.alive = swap;

        return changed;
    }

    randomize() {
        for (var i = 0; i < this.w * this.h; i++) {
            this.alive[i] = Math.floor(Math.random() * this.n) % this.n;
        }
    }

    clear() {
        for (var i = 0; i < this.w * this.h; i++) {
            this.alive[i] = 0;
        }
    }
}

var canvas = $('game');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
canvas.addEventListener("click", onClick, false);
var ctx = canvas.getContext('2d');
var cell = 5;
var field = new Field(Math.ceil(canvas.width / cell), Math.ceil(canvas.height / cell));

var pixels = ctx.createImageData(field.w * cell, field.h * cell);
for (var i = 0; i < field.w * field.h * cell * cell; i++) {
   pixels.data[i * 4 + 3] = 255;
}

var started = false;
var iteration = 0;

field.randomize();
render();
updateUI();

setInterval(clock, 100);
function clock() {
    if (!started) return;
    var changed = field.update();
    iteration++;
    render();
    if (!changed) {
        started = false;
    }
    updateUI();
}

function render() {
    for (var x = 0; x < field.w; x++) {
        for (var y = 0; y < field.h; y++) {
            var color = (Math.floor(field.alive[x + y * field.w] * 255 / field.n)) % 255;
            for (var i = 0; i < cell; i++) {
                for (var j = 0; j < cell; j++) {
                    var pixel = x * cell + i + ((y * cell + j) * field.w * cell);
                    for (var c = 0; c < 3; c++) {
                        pixels.data[pixel * 4 + c] = color;
                    }
                }
            }
        }
    }
    ctx.putImageData(pixels, 0, 0);
}

function onClick(e) {
    console.log("click")

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
    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;

    x = Math.max(0, Math.floor(x / cell));
    y = Math.max(0, Math.floor(y / cell));

    field.alive[x + y * field.w] = (field.alive[x + y * field.w] + 1) % field.n;
    render();
}

function onStart() {
    started = !started;
    if (started) iteration = 0;
    updateUI();
}

function clear() {
    if (started) return;
    field.clear();
    render();
}

function randomize() {
    if (started) return;
    field.randomize();
    render();
}
