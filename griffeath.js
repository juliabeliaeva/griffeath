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
$('radio-8').onchange = function() {
    var value = document.querySelector('input[name="neighborhood"]:checked').value;
    setVonNeumannNeighborhood(value == "4");
}
$('radio-4').onchange = $('radio-8').onchange
$('nstates').onchange = function() {
    field.setN($('nstates').value);
    iteration = 0;
    render();
}
$('cell').onchange = function() {
    var newValue = $('cell').value;
    if (cell != newValue) {
        cell = newValue;
        field = createField(canvas, cell);
        pixels = createPixels(ctx, field, cell);
        randomize();
        iteration = 0;
        render();
    }
}

function updateUI() {
    if (started) {
        $('start').value = "Pause";
        $('info').innerHTML = "Iteration " + iteration + "<br/>" + selectedInformation();
    } else {
        $('start').value = "Play";
        if (iteration == 0) {
            $('info').innerHTML = selectedInformation();
        } else {
            $('info').innerHTML = "Stopped after " + iteration + " iterations" + "<br/>" + selectedInformation();
        }
    }
    $('clear').disabled = started;
    $('randomize').disabled = started;
    if (field.isVonNeumann) {
        $('radio-4').checked = true;
        $('radio-8').disabled = started;
    } else {
        $('radio-8').checked = true;
        $('radio-4').disabled = started;
    }
    $('nstates').value = field.n
    $('nstates').disabled = started
    $('cell').value = cell
    $('cell').disabled = started
}

function selectedInformation() {
    if (selectedX < 0 || selectedY < 0) return "";
    return "Selected: [" + selectedX + ", " + selectedY + "] = " + field.alive[selectedX + selectedY * field.w];
}

class Field {
    constructor(width, height) {
        this.w = width;
        this.h = height;
        this.n = 15;
        this.alive = new Array(this.w * this.h);
        this.tmp = new Array(this.w * this.h);
        this.isVonNeumann = true;
    }

    setVonNeumannNeighborhood(value) {
        this.isVonNeumann = value;
    }

    setN(n) {
        this.n = n;
        for (var i = 0; i < this.w * this.h; i++) {
            this.alive[i] = this.alive[i] % this.n;
        }
    }

    getNeighborhood(value) {
        if (value) {
            return [[0, -1], [0, 1], [1, 0], [-1, 0]];
        } else {
            return [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1], [1, 0], [-1, 0]];
        }
    }

    update() {
        var changed = false;
        var neighborhood = this.getNeighborhood(this.isVonNeumann);
        for (var x = 0; x < this.w; x++) {
            for (var y = 0; y < this.h; y++) {
                var next = (this.alive[x + y * this.w] + 1) % this.n;
                this.tmp[x + y * this.w] = this.alive[x + y * this.w];
                for (var ij of neighborhood) {
                    var ii = x + ij[0];
                    var jj = y + ij[1];
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
                        break;
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
canvas.addEventListener("mousemove", onHover, false);
var ctx = canvas.getContext('2d');
var cell = 5;
var field = createField(canvas, cell);
var pixels = createPixels(ctx, field, cell);

var selectedX = -1;
var selectedY = -1;

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

function createField(canvas, cell) {
    return new Field(Math.ceil(canvas.width / cell), Math.ceil(canvas.height / cell));
}

function createPixels(ctx, field, cell) {
    var p = ctx.createImageData(field.w * cell, field.h * cell);
    for (var i = 0; i < field.w * field.h * cell * cell; i++) {
        p.data[i * 4 + 3] = 255;
    }
    return p;
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
    updateCanvas();
}

function updateCanvas() {
    ctx.putImageData(pixels, 0, 0);

    if (selectedX < 0 || selectedY < 0) return;

    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "red";
    ctx.rect(selectedX * cell, selectedY * cell, cell, cell);
    ctx.stroke();
}

function getLocation(e) {
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

    return {x: x, y: y};
}

function onClick(e) {
    if (started) return;

    var location = getLocation(e);
    x = location.x;
    y = location.y;

    field.alive[x + y * field.w] = (field.alive[x + y * field.w] + 1) % field.n;

    iteration = 0;
    render();
    updateUI();
}

function onHover(e) {
    var location = getLocation(e);

    selectedX = location.x;
    selectedY = location.y;

    render();
    updateUI();
}

function setVonNeumannNeighborhood(isVonNeumann) {
    field.setVonNeumannNeighborhood(isVonNeumann);
    iteration = 0;
    updateUI();
}

function onStart() {
    started = !started;
    updateUI();
}

function clear() {
    if (started) return;
    field.clear();
    iteration = 0;
    render();
    updateUI();
}

function randomize() {
    if (started) return;
    field.randomize();
    iteration = 0;
    render();
    updateUI();
}