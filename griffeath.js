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
        field = createField(canvas, cell, field.n);
        pixels = createPixels(canvas);
        randomize();
        iteration = 0;
        render();
    }
}

function updateUI() {
    if (started) {
        $('start').value = "Pause";
    } else {
        $('start').value = "Play";
    }
    $('info').innerHTML = getInformation();
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

function getInformation() {
    var fieldInfo = "Field size " + field.w + "x" + field.h;

    var selectionInfo = "";
    if (selectedX >= 0 && selectedY >= 0) {
       selectionInfo = "Selected [" + selectedX % field.w + ", " + selectedY % field.h + "] = " + field.getAlive(selectedX, selectedY);
    }

    var iterationInfo = "";
    if (started) {
        iterationInfo = "Iteration " + iteration;
    } else {
        if (iteration > 0) {
            iterationInfo = "Stopped after " + iteration + " iterations";
        }
    }

    return fieldInfo + "<br/>" + selectionInfo + "<br/>" + iterationInfo;
}

class Field {
    constructor(width, height, n) {
        this.w = width;
        this.h = height;
        this.n = n;
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

    getAlive(x, y) {
        return this.alive[(x % this.w) + (y % this.h) * this.w];
    }

    setAlive(x, y, value) {
        this.alive[(x % this.w) + (y % this.h) * this.w] = value % this.n;
    }
}

var canvas = $('game');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
canvas.addEventListener("click", onClick, false);
canvas.addEventListener("mousemove", onHover, false);

var cell = 5;
var field = createField(canvas, cell, 15);
var pixels = createPixels(canvas);

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

function createField(canvas, cell, n) {
    return new Field(Math.floor(canvas.width / cell), Math.floor(canvas.height / cell), n);
}

function createPixels(canvas) {
    var p = canvas.getContext('2d').createImageData(canvas.width, canvas.height);
    for (var i = 0; i < canvas.width * canvas.height; i++) {
        p.data[i * 4 + 3] = 255; // set alpha value
    }
    return p;
}

function render() {
    var extW = Math.ceil(canvas.width / cell);
    var extH = Math.ceil(canvas.height / cell);
    for (var x = 0; x < extW; x++) {
        for (var y = 0; y < extH; y++) {
            var color = (Math.floor(field.getAlive(x, y) * 255 / field.n)) % 255;
            for (var i = 0; i < cell; i++) {
                var canvasX = x * cell + i;
                if (canvasX >= canvas.width) break;
                for (var j = 0; j < cell; j++) {
                    var canvasY = y * cell + j;
                    if (canvasY >= canvas.height) break;
                    var pixel = canvasX + (canvasY * canvas.width);
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
    var ctx = canvas.getContext('2d');
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

    field.setAlive(x, y, field.getAlive(x, y) + 1);

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