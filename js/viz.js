// These two are tha maximum size of any of the image's dimension
var selectedSize = 100;
var normalSize = 10;

var selectedClasses = new Set();

var selectedImageImg = document.querySelector('#selected-image-img');
var selectedPoint = undefined;

var tableau20 = [
  '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c',
  '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
  '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f',
  '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9eda16'];

Viewport = function(x, y, width, height){
  this.x = x;
  this.y = y;
  this.originalWidth = width;
  this.originalHeight = height;
  this.width = width;
  this.height = height;
  this._scale = 1;
};
Viewport.prototype.scaleCallback = function(s) {};
Viewport.prototype.translateCallback = function(dx, dy) {};
Viewport.prototype.scale = function(alpha) {
  // Scale with x, y as center
  this._scale = alpha;
  this.translate(-this.width / 2, -this.height / 2);
  this.width = this.originalWidth * this._scale;
  this.height = this.originalHeight * this._scale;
  this.translate(this.width / 2, this.height / 2);
  this.scaleCallback(alpha);
};
Viewport.prototype.zoom = function(ds) {
  this.scale(this._scale + ds);
}
Viewport.prototype.translate = function(dx, dy) {
  this.x = Math.min(1.0 * this.x + dx, this.originalWidth);
  this.y = Math.min(1.0 * this.y + dy, this.originalHeight);
  this.translateCallback(dx, dy);
};
Viewport.prototype.convertWidth = function(width) {
  return ~~(width * this._scale);
};
Viewport.prototype.convertHeight = function(height) {
  return ~~(height * this._scale);
};
Viewport.prototype.convertPos = function(x, y) {
  return {
    x: ~~((x - this.x) * this.width / this.originalWidth),
    y: ~~((y - this.y) * this.height / this.originalHeight)};
};
Viewport.prototype.inversePos = function(x, y) {
  return {
    x: this.x + (this.originalWidth / this.width * x),
    y: this.y + (this.originalHeight / this.height * y),
  };
}
Viewport.prototype.reset = function() {
  this.x = 0;
  this.y = 0;
  this.scale = 1;
  this.width = this.originalWidth;
  this.height = this.originalHeight;
}

var viewport = undefined;

function imageSizeInBox(w, h, size) {
  if(w > size || h > size) {
    if(w > h) {
      h = ~~(1.0 * size / w * h);
      w = size;
    } else {
      w = ~~(1.0 * size / h * w);
      h = size;
    }
  }
  return {w: w, h: h};
}

function updateProgressBar(rate) {
  var progressBar = document.querySelector('#images-load-progress');
  progressBar.style = 'width: ' + rate * 100 + '%;';
}

function resetProgressBar() {
  updateProgressBar(0);
}

function updateDataInfo(data) {
  // Show image and information on table
  selectedImageImg.src = selectedPoint.file;

  // Fill table with parameters
  document.querySelector('#selected-image-id').innerHTML = selectedPoint.id;
  document.querySelector('#selected-image-file').innerHTML = selectedPoint.file;
  document.querySelector('#selected-image-class').innerHTML = selectedPoint.class;
  document.querySelector('#selected-image-x').innerHTML = selectedPoint.x;
  document.querySelector('#selected-image-y').innerHTML = selectedPoint.y;
}

// From http://stackoverflow.com/a/17130415/356925
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

// Draw data point on the selected canvas with the given maximum side size
function drawPoint(ctx, dataPoint, size) {
  var imSize = imageSizeInBox(dataPoint.image.width, dataPoint.image.height, size);
  var imgWidth = imSize.w;
  var imgHeight = imSize.h;

  var x = dataPoint.x - imgWidth / 2;
  var y = dataPoint.y - imgHeight / 2;

  var xy = viewport.convertPos(x, y);
  x = xy.x;
  y = xy.y;

  imgWidth = viewport.convertWidth(imgWidth);
  imgHeight = viewport.convertHeight(imgHeight);

  ctx.drawImage(dataPoint.image, x, y, imgWidth, imgHeight);
}

function selectPoint(dataPoint, ctx, fullCtx) {
  // Reset selection part
  if(selectedPoint != undefined) {
    var imSize = imageSizeInBox(
        selectedPoint.image.width, selectedPoint.image.height, selectedSize);
    var xy = viewport.convertPos(
        selectedPoint.x - imSize.w / 2,
        selectedPoint.y - imSize.h / 2);
    ctx.putImageData(selectedPoint.underlyingImageData,
        xy.x, xy.y);
  }
  selectedPoint = dataPoint;
  var imSize = imageSizeInBox(
      dataPoint.image.width, dataPoint.image.height,
      selectedSize);

  ctx.fillStyle = dataPoint.classColor;
  var xy = viewport.convertPos(
      selectedPoint.x - imSize.w / 2,
      selectedPoint.y - imSize.h / 2);
  x = xy.x;
  y = xy.y;

  // Underlying image data
  var imageData = ctx.getImageData(
      xy.x, xy.y,
      viewport.convertWidth(imSize.w),
      viewport.convertHeight(imSize.h));
  selectedPoint.underlyingImageData = imageData;

  ctx.fillRect(x, y,
      viewport.convertWidth(imSize.w),
      viewport.convertHeight(imSize.h));

  drawPoint(ctx, selectedPoint, selectedSize - 10);

  updateDataInfo(dataPoint);
}

function drawCanvas(ctx, fullCtx, data, x, y, w, h, callback) {
  // Draw images on canvas
  // This is the slowest part
  var i = 0;
  var supPos = viewport.inversePos(x, y);
  var supW = viewport.convertWidth(w);
  var supH = viewport.convertHeight(h);
  data.forEach(function(d) {
    var im;
    if(d.image != undefined) {
      if(d.x - supPos.x >= 0 && d.x - supPos.x < supW
          && d.y - supPos.y >= 0 && d.y - supPos.y <= supH) {
        drawPoint(fullCtx, d, normalSize);
      }
      updateProgressBar(1.0 * i / data.length);
      if(i == data.length - 1) {
        callback();
      }
    } else {
      var im = new Image();
      im.src = d.thumbnail;

      im.onload = (function(i) {
        return function() {
          d.image = im;
          drawPoint(fullCtx, d, normalSize);
          updateProgressBar(1.0 * i / data.length);
          if(i == data.length - 1) {
            callback();
          }
        };
      })(i);
    }
    i += 1;
  });
}

function drawMinimap(ctx) {
  // Draw viewport minimap
  var minimapWidth = 100;
  var minimapMargin = 10;
  var minimapHeight = ctx.canvas.height * minimapWidth / ctx.canvas.width;

  var width = ctx.canvas.width;
  var height = ctx.canvas.height;
  ctx.fillStyle = 'rgba(1,1,1,0.4)';
  ctx.fillRect(
      width - minimapMargin - minimapWidth,
      height - minimapMargin - minimapHeight,
      minimapWidth, minimapHeight);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(
      width - minimapMargin - minimapWidth + minimapWidth * viewport.x / width,
      height - minimapMargin - minimapHeight + minimapHeight * viewport.y / height,
      minimapWidth * width / viewport.width,
      minimapHeight * height / viewport.height);
}

// Draw a semitransparent overlay over non-selected images
// This won't work very well at overlapping classes, but it shouldn't be
// a big issue as classes shouldn't overlap anyway
function updateSelection(data, ctx) {
  ctx.putImageData(
      fullCtx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height),
      0, 0);
  var size = normalSize;
  data.forEach(function(d) {
    if(selectedClasses.has(d.class)) {
      if(d.hidden) { // Point is hidden but shouldn't -> copy from buffer
        var xy = viewport.convertPos(
            d.x - d.image.width / 2,
            d.y - d.image.height / 2);
        var w = viewport.convertWidth(d.image.width);
        var h = viewport.convertHeight(d.image.height);
        ctx.putImageData(fullCtx.getImageData(xy.x, xy.y, w, h), xy.x, xy.y);
        d.hidden = false;
      }
      return;
    } else if(d.hidden) { // If point was already hidden, continue.
    }
    var imSize = imageSizeInBox(d.image.width, d.image.height, size);
    var imgWidth = imSize.w;
    var imgHeight = imSize.h;

    var x = d.x - imgWidth / 2;
    var y = d.y - imgHeight / 2;

    var xy = viewport.convertPos(x, y);
    x = xy.x;
    y = xy.y;

    imgWidth = viewport.convertWidth(imgWidth);
    imgHeight = viewport.convertHeight(imgHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(x, y, imgWidth, imgHeight);
    d.hidden = true;
  });
}

d3.csv('data.csv', function(data) {
  dt = data;
  var canvas = document.querySelector('#imgs-canvas');
  ctx = canvas.getContext('2d');

  var canvasHeight = canvas.height;
  var canvasWidth = canvas.width;
  viewport = new Viewport(0, 0, canvasWidth, canvasHeight);


  // Add arrows and +/- key events for panning and zooming
  document.querySelector('body').addEventListener('keydown', function(e) {
    switch(e.key) {
      case '-':
        viewport.zoom(-0.1);
        break;
      case '+':
        viewport.zoom(+0.1);
        break;
      case 'ArrowLeft':
        viewport.translate(-5, 0);
        break;
      case 'ArrowRight':
        viewport.translate(+5, 0);
        break;
      case 'ArrowDown':
        viewport.translate(0, +5);
        break;
      case 'ArrowUp':
        viewport.translate(0, -5);
        break;
      case 'r':
        viewport.reset();
        break;
    }
  })

  // Create a buffer canvas to hold the full image data. The regular canvas
  // is the one that will actually display the data
  var fullCanvas = document.createElement("canvas");
  fullCtx = fullCanvas.getContext("2d");
  fullCanvas.width = canvasWidth;
  fullCanvas.height= canvasHeight;

  // Create classes toggle buttons
  var classes = new Set(data.map(function(d) { return d.class; }));
  selectedClasses = classes;

  classColor = {};
  Array.from(classes).forEach(function(cls, i) {
    classColor[cls] = tableau20[i];
  })
  Array.from(classes).sort().forEach(function(cls) {
    document.querySelector('#class-selector').innerHTML += '<li class="class-select" data-class="' + cls + '" data-status="on" style="background-color: ' + classColor[cls] +'">' + cls + '</li>';
  });

  // Read the data
  // Convert data position points to integers
  data.forEach(function(d) {
    d.id = +d.id;
    d.x = ~~(+d.x * canvasWidth);
    d.y = ~~((1 - d.y) * canvasHeight); // Use xy coordinates instead of ij
    d.image = undefined;
    d.hidden = false;
    d.classColor = classColor[d.class];
  });

  // Create class selector toggle event
  document.querySelectorAll('.class-select').forEach(function(element) {
    element.addEventListener('click', function(e) {
      if(element.dataset.status == 'on') {
        element.dataset.status = 'off';
        selectedClasses.delete(element.dataset.class);
      } else {
        element.dataset.status = 'on';
        selectedClasses.add(element.dataset.class);
      }
      updateSelection(data, ctx);
    });
  });

  // Build KD tree for fast mouse integration
  tree = KDTree()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    (data);

  // redraw canvas function. It will redraw only the given rectangle
  redrawCanvas = function(x, y, w, h) {
    fullCtx.clearRect(x, y, w, h);
    drawCanvas(ctx, fullCtx, data, x, y, w, h, function() {
      ctx.putImageData(fullCtx.getImageData(x, y, w, h), x, y);
      drawMinimap(ctx);
      resetProgressBar();
      // Register event only after images are loaded
      canvas.onmousemove = function(e) {
        var mousePos = getMousePos(canvas, e);
        var xy = viewport.inversePos(mousePos.x, mousePos.y);
        var closestDataPoint = tree.find([xy.x, xy.y]).node.datum;
        if(selectedClasses.has(closestDataPoint.class)) {
          updateSelection(data, ctx);
          selectPoint(closestDataPoint, ctx, fullCtx);
        }
      }
    });
    updateSelection(data, ctx);
  }
  // Draw the full canvas intially
  redrawCanvas(0, 0, canvasWidth, canvasHeight);

  // Partial redraw functions for panning and zooming
  viewport.translateCallback = function(dx, dy) {
    dx = viewport.convertWidth(dx);
    dy = viewport.convertWidth(dy);
    // Translate buffer canvas by rerendering itself with the proper shift
    fullCtx.putImageData(fullCtx.getImageData(0, 0, canvasWidth, canvasHeight), -dx, -dy);
    // Render the missing data
    if(dx > 0) { // Right -> Redraw left rectangle
      redrawCanvas(canvasWidth - dx, 0, dx, canvasHeight);
    } else if(dx < 0) { // Left -> Redraw right rectangle
      redrawCanvas(0, 0, -dx, canvasHeight);
    } else if(dy > 0) { // Down -> Redraw top rectangle
      redrawCanvas(0, canvasHeight - dy, canvasWidth, dy);
    } else if(dy < 0) { // Up-> Redraw bottom rectangle
      redrawCanvas(0, 0, canvasWidth, -dy);
    }

    // Redraw minimap
    ctx.putImageData(fullCtx.getImageData(0, 0, canvasWidth, canvasHeight), 0, 0);
    drawMinimap(ctx);
    updateSelection(data, ctx);
  };

  viewport.scaleCallback = function(scale) {
    redrawCanvas(0, 0, canvasWidth, canvasHeight);
    updateSelection(data, ctx);
  };

});
