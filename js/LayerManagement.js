function updateLayerPanel() {
  var layers = canvas.getObjects();
  var layerContent = document.getElementById("layer-content");
  layerContent.innerHTML = "";

  layers.slice().reverse().forEach(function (layer, index) {
    if (!layer.excludeFromLayerPanel) {
      var layerDiv = document.createElement("div");
      var previewDiv = document.createElement("div");
      var detailsDiv = document.createElement("div");
      var nameTextArea = document.createElement("textarea");
      var buttonsDiv = document.createElement("div");
      var deleteButton = document.createElement("button");

      layerDiv.className = "layer-item";
      previewDiv.className = "layer-preview";
      detailsDiv.className = "layer-details";
      nameTextArea.className = "layer-name";
      buttonsDiv.className = "layer-buttons";

      if (["image", "rect", "circle", "path", "group", "polygon"].includes(layer.type)) {
        putPreviewImage(layer, previewDiv);
      } else if (layer.type === "text" || layer.type === "textbox") {
        var fullText = layer.text;
        nameTextArea.value = fullText.substring(0, 20);
      } else if (layer.type === "verticalText") {
        var fullText = layer.getObjects().map(obj => obj.text).join('');
        nameTextArea.value = fullText.substring(0, 15);
      }

      nameTextArea.value = layer.name || nameTextArea.value || layer.type + ` ${index + 1}`;
      layer.name = nameTextArea.value;
      nameTextArea.rows = 1; 
      nameTextArea.style.resize = 'none'; 
      nameTextArea.style.width = '100%';  
      nameTextArea.style.boxSizing = 'border-box';  
      nameTextArea.style.border = 'none'; 
      nameTextArea.style.borderBottom = '1px solid #cccccc';
      nameTextArea.style.outline = 'none';

      nameTextArea.oninput = function () {
        layer.name = nameTextArea.value;
      };

      deleteButton.textContent = "✕";
      deleteButton.className = "delete-layer-button";
      deleteButton.onclick = function (e) {
        e.stopPropagation();
        removeLayer(layer);
      };

      detailsDiv.appendChild(nameTextArea);

      if (layer.isPanel) {
        var t2iButton = document.createElement("button");
        t2iButton.innerHTML = '<i class="material-icons">settings</i> T2I';
        t2iButton.onclick = function (e) {
          e.stopPropagation();
          openfloatingWindowItem(layer);
        };
        buttonsDiv.appendChild(t2iButton);

        var runButton = document.createElement("button");
        runButton.id = 'runButton-' + index;
        runButton.innerHTML = '<i class="material-icons">add_photo_alternate</i> Run';
        runButton.onclick = function (e) {
          e.stopPropagation();
          var areaHeader = document.querySelector('#layer-panel .area-header');
          var spinner = document.createElement('span');
          spinner.id = 'spinner-' + index;
          spinner.className = 'spinner-border text-danger ms-1 spinner-border-sm';
          areaHeader.appendChild(spinner);

          StableDiffusionWebUI_text2ImgaeProcessQueue(layer, spinner.id);
          index++;
        };

        buttonsDiv.appendChild(runButton);

        var seedButton = document.createElement("button");
        seedButton.innerHTML = '<i class="material-icons">recycling</i> Seed';
        seedButton.onclick = function (e) {
          e.stopPropagation();
          
          if( layer.tempSeed ){
            layer.text2img_seed = layer.tempSeed;
            createToast("Recycling Seed", layer.text2img_seed);
          }else{
            createToast("Nothing Seed", "");
          }
        };
        buttonsDiv.appendChild(seedButton);
      }

      if (layer.type == 'image') {
        var i2iButton = document.createElement("button");
        i2iButton.innerHTML = '<i class="material-icons">settings</i> I2I';
        i2iButton.onclick = function (e) {
          e.stopPropagation();
          openImage2ImagefloatingWindowItem(layer);
        };
        buttonsDiv.appendChild(i2iButton);

        var runButton = document.createElement("button");
        runButton.id = 'runButton-' + index;
        runButton.innerHTML = '<i class="material-icons">add_photo_alternate</i> Run';
        runButton.onclick = function (e) {
          e.stopPropagation();
          var areaHeader = document.querySelector('#layer-panel .area-header');
          var spinner = document.createElement('span');
          spinner.id = 'spinner-' + index;
          spinner.className = 'spinner-border text-danger ms-1 spinner-border-sm';
          areaHeader.appendChild(spinner);


          StableDiffusionWebUI_Image2ImgaeProcessQueue(layer, spinner.id);
          index++;
        };

        var promptButton = document.createElement("button");
        promptButton.innerHTML = '<i class="material-icons">text_snippet</i> Prompt';
        promptButton.onclick = function (e) {
          e.stopPropagation();

          if( layer.tempPrompt ){
            layer.text2img_prompt = layer.tempPrompt;
            createToast("Apply Prompt", layer.text2img_prompt);
          }else{
            createToast("Nothing Prompt", "");
          }

          if( layer.tempNegativePrompt ){
            layer.text2img_negativePrompt = layer.tempNegativePrompt;
            createToast("Apply Negative Prompt", layer.text2img_negativePrompt);
          }else{
            createToast("Nothing Negative Prompt", "");
          }
        };

        buttonsDiv.appendChild(runButton);
        buttonsDiv.appendChild(promptButton);
      }

      buttonsDiv.appendChild(deleteButton);

      layerDiv.setAttribute("data-id", layer.id);

      if (["image", "rect", "circle", "path", "group", "polygon"].includes(layer.type)) {
        layerDiv.appendChild(previewDiv);
      }

      layerDiv.appendChild(detailsDiv);
      detailsDiv.appendChild(buttonsDiv);

      layerDiv.onclick = function () {
        canvas.setActiveObject(layer);
        canvas.renderAll();
        highlightActiveLayer(index);
        updateControls(layer);
      };

      layerContent.appendChild(layerDiv);
    }
  });
}


function calculateCenter(layer) {
  //console.log("calculateCenter:", layer.left, layer.width, layer.top, layer.height );

  const centerX = layer.left + (layer.width / 2) * layer.scaleX;
  const centerY = layer.top + (layer.height / 2) * layer.scaleY;
  
 return { centerX, centerY };
}






function putPreviewImage(layer, layerDiv) {
  var previewDiv = document.createElement("div");

  var canvasSize = 120;
  var imageSize = 100;
  var margin = (canvasSize - imageSize) / 2;

  var tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvasSize;
  tempCanvas.height = canvasSize;
  var tempCtx = tempCanvas.getContext("2d");

  if (layer.type === "image" && typeof layer.getElement === "function") {
    var imgElement = layer.getElement();
    var imgWidth = imgElement.width;
    var imgHeight = imgElement.height;

    var scale = Math.min(canvasSize / imgWidth, canvasSize / imgHeight);
    var drawWidth = imgWidth * scale;
    var drawHeight = imgHeight * scale;

    var offsetX = (canvasSize - drawWidth) / 2;
    var offsetY = (canvasSize - drawHeight) / 2;

    tempCtx.drawImage(imgElement, offsetX, offsetY, drawWidth, drawHeight);

  } else if (layer.type === "group") {
    var groupScaleFactor = Math.min(120 / layer.width, 120 / layer.height);
    tempCtx.save();
    tempCtx.translate(60, 60);
    tempCtx.scale(0.12,0.12);
    tempCtx.translate(-layer.width / 2, -layer.height / 2);
  
    layer.getObjects().forEach(function (obj) {
      tempCtx.save();
      tempCtx.translate(obj.left, obj.top);
  
      if (["rect", "circle", "polygon"].includes(obj.type)) {
        var tempCanvas = obj.toCanvasElement();
        tempCtx.drawImage(tempCanvas, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
      } else if (obj.type === "path") {
        var path = new fabric.Path(obj.path);
        path.left = -obj.width / 2;
        path.top = -obj.height / 2;
        path.render(tempCtx);
      } else {
        tempCtx.translate(-obj.width / 2, -obj.height / 2);
        obj.render(tempCtx);
      }
  
      tempCtx.restore();
    });
  
    tempCtx.restore();
  }  else if (["rect", "circle", "polygon"].includes(layer.type)) {
    var layerCanvas = layer.toCanvasElement();
    var layerWidth = layer.width;
    var layerHeight = layer.height;

    var layerScale = Math.min(imageSize / layerWidth, imageSize / layerHeight);
    var layerDrawWidth = layerWidth * layerScale;
    var layerDrawHeight = layerHeight * layerScale;

    var layerOffsetX = (canvasSize - layerDrawWidth) / 2;
    var layerOffsetY = (canvasSize - layerDrawHeight) / 2;

    tempCtx.drawImage(layerCanvas, layerOffsetX, layerOffsetY, layerDrawWidth, layerDrawHeight);

  } else if (layer.type === "path") {
    var path = new fabric.Path(layer.path);
    path.render(tempCtx);

  } else {
    layer.render(tempCtx);
  }

  var imageUrl = tempCanvas.toDataURL();
  previewDiv.style.backgroundImage = "url(" + imageUrl + ")";
  previewDiv.style.backgroundSize = "contain";
  previewDiv.style.backgroundPosition = "center";
  previewDiv.style.backgroundRepeat = "no-repeat";
  previewDiv.className = "layer-preview";
  layerDiv.appendChild(previewDiv);
}




function removeLayer(layer) {
  canvas.remove(layer);
  // if (layer === currentImage) {
  //   currentImage = null;
  // }
  updateLayerPanel();
  if (canvas.getActiveObject() === layer) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    canvas.renderAll();
  }
}

function highlightActiveLayer(activeIndex) {
  //console.log("Activating layer at index:", activeIndex);
  var layerItems = document.querySelectorAll(".layer-item");
  layerItems.forEach((layer, index) => {
    if (index === activeIndex) {
      layer.classList.add("active");
    } else {
      layer.classList.remove("active");
    }
  });
}


function highlightActiveLayerByCanvas() {
  var activeObject = canvas.getActiveObject();
  updateControls(activeObject);

  var activeIndex = getActiveObjectIndex(canvas);
  var layers = document.querySelectorAll(".layer-item");

  var reverseIndex = layers.length - 1 - activeIndex;
  layers.forEach(function(layerDiv, index) {
    if (index === reverseIndex) {
      layerDiv.classList.add("active");
    } else {
      layerDiv.classList.remove("active");
    }
  });
}

function getActiveObjectIndex(canvas) {
  var activeObject = canvas.getActiveObject();
  var objects = canvas.getObjects();
  var index = objects.indexOf(activeObject);
  return index;
}





function updateControls(activeObject) {
  if (!activeObject) {
    // 既存のコントロールのデフォルト値を設定
    document.getElementById("angle-control").value = 0;
    document.getElementById("scale-control").value = 1;
    document.getElementById("top-control").value = 0;
    document.getElementById("left-control").value = 0;
    document.getElementById("skewX-control").value = 0;
    document.getElementById("skewY-control").value = 0;
    document.getElementById("opacity-control").value = 1;
    
    document.getElementById("angleValue").innerText = 0.0.toFixed(1);
    document.getElementById("scaleValue").innerText = 1.0.toFixed(2);
    document.getElementById("topValue").innerText = 0.0.toFixed(1);
    document.getElementById("leftValue").innerText = 0.0.toFixed(1);
    document.getElementById("skewXValue").innerText = 0.0.toFixed(1);
    document.getElementById("skewYValue").innerText = 0.0.toFixed(1);
    document.getElementById("opacityValue").innerText = 1.0.toFixed(1)*100;
    
    // 新たに追加されたコントロールのデフォルト値を設定
    document.getElementById("sepiaEffect").checked = false;
    document.getElementById("grayscaleEffect").checked = false;
    document.querySelector('input[name="grayscaleMode"][value="average"]').checked = true;
    
    document.getElementById("gammaRed").value = 1.0;
    document.getElementById("gammaGreen").value = 1.0;
    document.getElementById("gammaBlue").value = 1.0;
    document.getElementById("gammaRedValue").innerText = 1.0.toFixed(1);
    document.getElementById("gammaGreenValue").innerText = 1.0.toFixed(1);
    document.getElementById("gammaBlueValue").innerText = 1.0.toFixed(1);
    
    document.getElementById("vibranceValue").value = 0.0;
    document.getElementById("vibranceValueDisplay").innerText = 0.0.toFixed(1);
    
    document.getElementById("blurValue").value = 0.0;
    document.getElementById("blurValueDisplay").innerText = 0.0.toFixed(1);
    
    document.getElementById("pixelateValue").value = 1;
    document.getElementById("pixelateValueDisplay").innerText = 1;

    return;
  }

  // 既存のコントロールの値を設定
  document.getElementById("angle-control").value = activeObject.angle || 0;
  document.getElementById("scale-control").value = activeObject.scaleX || 1;
  document.getElementById("top-control").value = activeObject.top || 0;
  document.getElementById("left-control").value = activeObject.left || 0;
  document.getElementById("skewX-control").value = activeObject.skewX || 0;
  document.getElementById("skewY-control").value = activeObject.skewY || 0;
  document.getElementById("opacity-control").value = activeObject.opacity*100 || 100;
  
  document.getElementById("angleValue").innerText = (activeObject.angle || 0).toFixed(1);
  document.getElementById("scaleValue").innerText = (activeObject.scaleX || 1.0).toFixed(2);
  document.getElementById("topValue").innerText = (activeObject.top || 0).toFixed(1);
  document.getElementById("leftValue").innerText = (activeObject.left || 0).toFixed(1);
  document.getElementById("skewXValue").innerText = (activeObject.skewX || 0).toFixed(1);
  document.getElementById("skewYValue").innerText = (activeObject.skewY || 0).toFixed(1);
  document.getElementById("opacityValue").innerText = (activeObject.opacity*100 || 100).toFixed(1);
  
  // 新たに追加されたコントロールの値を設定
  var filters = activeObject.filters || [];
  filters.forEach(function(filter) {
    if (filter.type === 'Sepia') {
      document.getElementById("sepiaEffect").checked = true;
    }
    if (filter.type === 'Grayscale') {
      document.getElementById("grayscaleEffect").checked = true;
      document.querySelector(`input[name="grayscaleMode"][value="${filter.mode}"]`).checked = true;
    }
    if (filter.type === 'Gamma') {
      document.getElementById("gammaRed").value = filter.gamma[0];
      document.getElementById("gammaGreen").value = filter.gamma[1];
      document.getElementById("gammaBlue").value = filter.gamma[2];
      document.getElementById("gammaRedValue").innerText = filter.gamma[0].toFixed(1);
      document.getElementById("gammaGreenValue").innerText = filter.gamma[1].toFixed(1);
      document.getElementById("gammaBlueValue").innerText = filter.gamma[2].toFixed(1);
    }
    if (filter.type === 'Vibrance') {
      document.getElementById("vibranceValue").value = filter.vibrance;
      document.getElementById("vibranceValueDisplay").innerText = filter.vibrance.toFixed(1);
    }
    if (filter.type === 'Blur') {
      document.getElementById("blurValue").value = filter.blur;
      document.getElementById("blurValueDisplay").innerText = filter.blur.toFixed(1);
    }
    if (filter.type === 'Pixelate') {
      document.getElementById("pixelateValue").value = filter.blocksize;
      document.getElementById("pixelateValueDisplay").innerText = filter.blocksize;
    }
  });
}


function LayersUp() {

  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.bringForward();
    canvas.renderAll();
    updateLayerPanel();
    saveState();
  }
}

function LayersDown() {

  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.sendBackwards();
    canvas.renderAll();
    updateLayerPanel();
    saveState();
  }
}