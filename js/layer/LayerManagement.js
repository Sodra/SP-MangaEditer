function updateLayerPanel() {
  var layers = canvas.getObjects().slice().reverse();
  var layerContent = $("layer-content");
  layerContent.innerHTML = "";
  var guidMap = createGUIDMap(layers);
  var processedLayersFirst = new Set();
  var processedLayersSecond = new Set();

  // 最終的なレイヤー順序を保持する配列
  var finalLayerOrder = [];

  layers.forEach((layer) => {
    if (layer.guids && layer.guids.length > 0) {
    } else {
      layer.guids = [];
    }
  });

  // guidsを持つレイヤーを処理
  layers.forEach((layer) => {
    if (layer.isPanel) {
      processedLayersFirst.add(layer);
      layer.guids.forEach((guid) => {
        var matchingLayer = guidMap.get(guid);
        if (matchingLayer) {
          processedLayersFirst.add(matchingLayer);
        }
      });
    }
  });

  // guidsを持つレイヤーを処理
  layers.forEach((layer) => {
    if (layer.isPanel) {
      finalLayerOrder.push(layer);
      processedLayersSecond.add(layer);

      var guidsNow = layer.guids;
      var guidsTemp = [];
      layers.forEach((layer) => {
        var nowGuid = layer.guid;
        if (guidsNow.includes(nowGuid)) {
          guidsTemp.push(nowGuid);
        }
      });

      guidsTemp.forEach((guid) => {
        var matchingLayer = guidMap.get(guid);
        if (matchingLayer) {
          finalLayerOrder.push(matchingLayer);
          processedLayersSecond.add(matchingLayer);
        }
      });
    } else {
      if (!processedLayersFirst.has(layer)) {
        finalLayerOrder.push(layer);
      }
    }
  });



  // レイヤーパネルの更新
  finalLayerOrder.forEach((layer, index) => {
    if (!layer.excludeFromLayerPanel) {
      var layerDiv = Object.assign(document.createElement("div"), {
        className: "layer-item",
      });
      var previewDiv = Object.assign(document.createElement("div"), {
        className: "layer-preview",
      });
      var detailsDiv = Object.assign(document.createElement("div"), {
        className: "layer-details",
      });
      var nameTextArea = Object.assign(document.createElement("input"), {
        className: "layer-name",
      });
      var buttonsDiv = Object.assign(document.createElement("div"), {
        className: "layer-buttons",
      });

      if (isLayerPreview(layer)) {
        createPreviewImage(layer, previewDiv);
      } else if (isHorizontalText(layer)) {
        var fullText = layer.text;
        nameTextArea.value = fullText.substring(0, 20);
      } else if (isVerticalText(layer)) {
        var fullText = layer.name;
        if( fullText ){
          nameTextArea.value = fullText.substring(0, 15);
        }else{
          layer.name = "verticalText";
          fullText = layer.name;
          nameTextArea.value = fullText.substring(0, 15);
        }
        
      }

      setNameTextAreaProperties(layer, nameTextArea, index);

      if (isText(layer)) {
        detailsDiv.style.display = "flex";
        detailsDiv.style.alignItems = "center";
      }

      detailsDiv.appendChild(nameTextArea);

      if (isImage(layer)) {
        putCheckButton(buttonsDiv, layer, index);
      }      
      putViewButton(buttonsDiv, layer, index);

      if (layer.isPanel) {
        putRunT2iButton(buttonsDiv, layer, index);
        putSeedButton(buttonsDiv, layer, index);
        putCropImageDownloadButton(buttonsDiv, layer, index);
      }
      if (layer.type == "image") {
        putRunI2iButton(buttonsDiv, layer, index);
        putPromptButton(buttonsDiv, layer, index);
        putInterrogateButtons(buttonsDiv, layer, index);
        putImageDownloadButton(buttonsDiv, layer, index);
        putRembgButton(buttonsDiv, layer, index);
      }
      putDeleteButton(buttonsDiv, layer, index);

      layerDiv.setAttribute("data-id", layer.id);

      if (isLayerPreview(layer)) {
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

      var isMatchingLayer = layers.some(layerWithGUIDs => layerWithGUIDs.guids && layerWithGUIDs.guids.includes(layer.guid));
      if (isMatchingLayer) {
        layerDiv.style.border = 'none';
        layerDiv.style.borderLeft    = getCssValue('--boader-color-2px-solid-C');
        layerDiv.style.borderBottom  = getCssValue('--boader-color-1px-solid-D');
        layerDiv.style.marginLeft = "10px";
        layerDiv.style.paddingLeft = "5px";
      } else {
        layerDiv.style.border = 'none';
        layerDiv.style.borderTop    = getCssValue('--layer-panel-boader-color-1px-solid-B');
        layerDiv.style.borderBottom = getCssValue('--layer-panel-boader-color-1px-solid-B');
      }
      layerContent.appendChild(layerDiv);
    }
  });
}

function setNameTextAreaProperties(layer, nameTextArea, index) {
  nameTextArea.value =
    layer.name || nameTextArea.value || layer.type + `${index + 1}`;
  layer.name = nameTextArea.value;
  nameTextArea.rows = 1;
  nameTextArea.style.resize = "none";
  nameTextArea.style.width = "100%";
  nameTextArea.style.boxSizing = "border-box";
  nameTextArea.style.border = "none";
  // nameTextArea.style.borderBottom = '1px solid #cccccc';
  nameTextArea.style.outline = "none";
  nameTextArea.style.color = getCssValue("--text-color-B");
  nameTextArea.style.borderColor = getCssValue("--boader-color-1px-solid-B");
  nameTextArea.style.background = getCssValue("--background-color-B");
  nameTextArea.oninput = function () {
    layer.name = nameTextArea.value;
  };

  if (isText(layer)) {
    nameTextArea.style.flex = "1";
    nameTextArea.style.marginRight = "5px";
  }
}

function putCropImageDownloadButton(buttonsDiv, layer, index) {
  var button = document.createElement("button");
  button.innerHTML = '<i class="material-icons">download</i>';

  button.onclick = function (e) {
    e.stopPropagation();

    imageObject2DataURLByCrop(layer)
      .then((croppedDataURL) => {
        if (croppedDataURL) {
          link = getLink(croppedDataURL);
          link.click();
        } else {
          console.log("No valid activeObject");
        }
      })
      .catch((err) => {
        console.error("Error cropping image:", err);
      });
  };

  addTooltipByElement(button, "imageCropDownloadButton");
  buttonsDiv.appendChild(button);
}


function putRembgButton(buttonsDiv, layer, index) {
  var button = document.createElement("button");
  button.innerHTML = '<i class="material-icons">wallpaper</i>';

  button.onclick = function (e) {
    e.stopPropagation();
    var spinner = createSpinner(index);
    sdWebUI_RembgProcessQueue(layer, spinner.id);
  };

  addTooltipByElement(button, "rembg");
  buttonsDiv.appendChild(button);
}

function putImageDownloadButton(buttonsDiv, layer, index) {
  var button = document.createElement("button");
  button.innerHTML = '<i class="material-icons">download</i>';

  button.onclick = function (e) {
    e.stopPropagation();
    dataURL = imageObject2DataURL(layer);
    link = getLink(dataURL);
    link.click();
  };

  addTooltipByElement(button, "imageDownloadButton");
  buttonsDiv.appendChild(button);
}

function putPromptButton(buttonsDiv, layer, index) {
  var promptButton = document.createElement("button");
  promptButton.innerHTML = '<i class="material-icons">text_snippet</i>';
  promptButton.onclick = function (e) {
    e.stopPropagation();
    if (layer.tempPrompt) {
      layer.text2img_prompt = layer.tempPrompt;
      createToast("Apply Prompt", layer.text2img_prompt);
    } else {
      createToast("Nothing Prompt", "");
    }
    if (layer.tempNegativePrompt) {
      layer.text2img_negativePrompt = layer.tempNegativePrompt;
      createToast("Apply Negative Prompt", layer.text2img_negativePrompt);
    } else {
      createToast("Nothing Negative Prompt", "");
    }
  };

  addTooltipByElement(promptButton, "promptButton");
  buttonsDiv.appendChild(promptButton);
}

function putInterrogateButtons(buttonsDiv, layer, index) {
  var clipButton = document.createElement("button");
  var deepDooruButton = document.createElement("button");
  clipButton.innerHTML = "📎";
  deepDooruButton.innerHTML = "📦";

  clipButton.onclick = function (e) {
    e.stopPropagation();
    var spinner = createSpinnerSuccess(index);
    sdWebUI_Interrogate(layer, "clip", spinner.id);
  };

  deepDooruButton.onclick = function (e) {
    e.stopPropagation();
    var spinner = createSpinnerSuccess(index);
    sdWebUI_Interrogate(layer, "deepdanbooru", spinner.id);
  };
  
  addTooltipByElement(deepDooruButton, "deepDooruButton");
  addTooltipByElement(clipButton, "clipButton");

  buttonsDiv.appendChild(clipButton);
  buttonsDiv.appendChild(deepDooruButton);
}

function putPromptButton(buttonsDiv, layer, index) {
  var promptButton = document.createElement("button");
  promptButton.innerHTML = '<i class="material-icons">text_snippet</i>';
  promptButton.onclick = function (e) {
    e.stopPropagation();
    if (layer.tempPrompt) {
      layer.text2img_prompt = layer.tempPrompt;
      createToast("Apply Prompt", layer.text2img_prompt);
    } else {
      createToast("Nothing Prompt", "");
    }
    if (layer.tempNegativePrompt) {
      layer.text2img_negativePrompt = layer.tempNegativePrompt;
      createToast("Apply Negative Prompt", layer.text2img_negativePrompt);
    } else {
      createToast("Nothing Negative Prompt", "");
    }
  };

  addTooltipByElement(promptButton, "promptButton");
  buttonsDiv.appendChild(promptButton);
}


function putCheckButton(buttonsDiv, layer, index) {
  var btn = document.createElement("button");
  btn.id = "checkButton-" + index;

  if(layer.layerCheck == undefined){
    layer.layerCheck = true; 
  }

  if(layer.layerCheck){
    btn.innerHTML = '<i class="material-icons">check_circle</i>';
  }else{
    btn.innerHTML = '<i class="material-icons">radio_button_unchecked</i>';
  }

  btn.onclick = function (e) {
    layer.layerCheck = !layer.layerCheck;
    if(layer.layerCheck){
      btn.innerHTML = '<i class="material-icons">check_circle</i>';
    }else{
      btn.innerHTML = '<i class="material-icons">radio_button_unchecked</i>';
    }
  };

  addTooltipByElement(btn, "checkButton");
  buttonsDiv.appendChild(btn);
}


function putViewButton(buttonsDiv, layer, index) {
  var viewButton = document.createElement("button");
  viewButton.id = "viewButton-" + index;
  if(layer.visible){
    viewButton.innerHTML = '<i class="material-icons">visibility</i>';
  }else{
    viewButton.innerHTML = '<i class="material-icons">visibility_off</i>';
  }

  viewButton.onclick = function (e) {
    visibleChange(layer);
  };

  addTooltipByElement(viewButton, "viewButton");
  buttonsDiv.appendChild(viewButton);
}


function putRunI2iButton(buttonsDiv, layer, index) {
  var runButton = document.createElement("button");
  runButton.id = "runButton-" + index;
  runButton.innerHTML = '<i class="material-icons">directions_run</i>';
  runButton.onclick = function (e) {
    e.stopPropagation();
    var spinner = createSpinner(index);
    I2I(layer, spinner);
  };

  addTooltipByElement(runButton, "runButton");

  buttonsDiv.appendChild(runButton);
}



function putDeleteButton(buttonsDiv, layer, index) {
  var deleteButton = document.createElement("button");
  deleteButton.textContent = "✕";
  deleteButton.className = "delete-layer-button";
  deleteButton.onclick = function (e) {
    e.stopPropagation();
    removeLayer(layer);
  };
  addTooltipByElement(deleteButton, "deleteButton");
  buttonsDiv.appendChild(deleteButton);
}

function putSeedButton(buttonsDiv, layer, index) {
  var seedButton = document.createElement("button");
  seedButton.innerHTML = '<i class="material-icons">recycling</i>';
  seedButton.onclick = function (e) {
    e.stopPropagation();
    if (layer.tempSeed) {
      layer.text2img_seed = layer.tempSeed;
      createToast("Recycling Seed", layer.text2img_seed);
    } else {
      createToast("Nothing Seed", "");
    }
  };

  addTooltipByElement(seedButton, "seedButton");
  buttonsDiv.appendChild(seedButton);
}

function putRunT2iButton(buttonsDiv, layer, index) {
  var runButton = document.createElement("button");
  runButton.id = "runButton-" + index;
  runButton.innerHTML = '<i class="material-icons">directions_run</i>';
  runButton.onclick = function (e) {
    e.stopPropagation();
    var spinner = createSpinner(index);
    T2I( layer, spinner );
  };
  addTooltipByElement(runButton, "runButton");
  buttonsDiv.appendChild(runButton);
}


function calculateCenter(layer) {
  const centerX = layer.left + (layer.width / 2) * layer.scaleX;
  const centerY = layer.top + (layer.height / 2) * layer.scaleY;
  return { centerX, centerY };
}

function createPreviewImage(layer, layerDiv) {
  var previewDiv = document.createElement("div");
  var canvasSize = 120;

  var tempCanvas = document.createElement("canvas");

  tempCanvas.width = canvasSize;
  tempCanvas.height = canvasSize;
  var tempCtx = tempCanvas.getContext("2d");
  tempCtx.fillStyle = "#ffcccc";

  var nowVisible = layer.visible;
  layer.visible = true;
  
  if (isGroup(layer)) {
    var boundingBox = layer.getBoundingRect();
    var groupWidth = boundingBox.width;
    var groupHeight = boundingBox.height;

    var scale = Math.min(canvasSize / groupWidth, canvasSize / groupHeight);

    var offsetX = (canvasSize - groupWidth * scale) / 2;
    var offsetY = (canvasSize - groupHeight * scale) / 2;

    tempCtx.save();
    tempCtx.translate(offsetX, offsetY);
    tempCtx.scale(scale, scale);
    tempCtx.translate(-boundingBox.left, -boundingBox.top);

    layer.getObjects().forEach(function (obj) {
      obj.render(tempCtx);
    });

    tempCtx.restore();
  } else if (layer.type === "path") {
    // console.log("Layer is a path");
    var pathBounds = layer.getBoundingRect();
    var pathWidth = pathBounds.width;
    var pathHeight = pathBounds.height;

    var scale = Math.min(canvasSize / pathWidth, canvasSize / pathHeight);
    var offsetX = (canvasSize - pathWidth * scale) / 2;
    var offsetY = (canvasSize - pathHeight * scale) / 2;

    tempCtx.save();
    tempCtx.translate(offsetX, offsetY);
    tempCtx.scale(scale, scale);
    tempCtx.translate(-pathBounds.left, -pathBounds.top);
    layer.render(tempCtx);

    tempCtx.restore();
  } else if (isImage(layer) && typeof layer.getElement === "function") {
    var imgElement = layer.getElement();
    var imgWidth = imgElement.width;
    var imgHeight = imgElement.height;

    var scale = Math.min(canvasSize / imgWidth, canvasSize / imgHeight);
    var drawWidth = imgWidth * scale;
    var drawHeight = imgHeight * scale;

    var offsetX = (canvasSize - drawWidth) / 2;
    var offsetY = (canvasSize - drawHeight) / 2;

    tempCtx.drawImage(imgElement, offsetX, offsetY, drawWidth, drawHeight);
  } else if (isPanelType(layer)) {
    var layerCanvas = layer.toCanvasElement();
    var layerWidth = layer.width;
    var layerHeight = layer.height;

    var layerScale = Math.min(
      canvasSize / layerWidth,
      canvasSize / layerHeight
    );
    var layerDrawWidth = layerWidth * layerScale;
    var layerDrawHeight = layerHeight * layerScale;

    var layerOffsetX = (canvasSize - layerDrawWidth) / 2;
    var layerOffsetY = (canvasSize - layerDrawHeight) / 2;

    tempCtx.drawImage(
      layerCanvas,
      layerOffsetX,
      layerOffsetY,
      layerDrawWidth,
      layerDrawHeight
    );
  } else {
    layer.render(tempCtx);
  }
  layer.visible = nowVisible;
  
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
  updateLayerPanel();

  if (canvas.getActiveObject() === layer) {
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  } else {
    canvas.requestRenderAll();
  }
}

function highlightActiveLayer(activeIndex) {
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

  if( isPanel(activeObject) ){
    showT2IPrompts(activeObject);
  }else if( isImage(activeObject)){
    showI2IPrompts(activeObject);
  }

  var activeIndex = getActiveObjectIndex(canvas);
  var layers = document.querySelectorAll(".layer-item");

  var reverseIndex = layers.length - 1 - activeIndex;

  layers.forEach(function (layerDiv, index) {
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

function visibleChange(obj){
  obj.visible = !obj.visible;
  updateLayerPanel();
}





