// simple check if the user is using a mac os , not the best way to detect the OS
var isMacOs = navigator.userAgent.indexOf('Mac OS') !== -1;;

var hotkeysMap = {
  toggleGrid: 'ctrl+g',
  undo: !isMacOs ? 'ctrl+z' : 'command+z',
  redo: !isMacOs ? 'ctrl+y' : 'command+y',
  toggleLayer: 'ctrl+l',
  toggleControls: 'ctrl+k',
  zoomIn: 'ctrl+8',
  zoomOut: 'ctrl+9',
  zoomFit: 'ctrl+0',
  copy: !isMacOs ? 'ctrl+c' : "command+c",
  paste: !isMacOs ? 'ctrl+v' : "command+v",
  delete: 'delete, backspace',
  moveLeft: 'left',
  moveRight: 'right',
  moveUp: 'up',
  moveDown: 'down',
}

var isLongPressDirection = false;
var longPressTimer = 0;
var activeObjectMoveStep = 0;


// bind toggle grid shortcut
hotkeys(hotkeysMap.toggleGrid, 'all' , function (e) {
  toggleGrid();
  e.preventDefault();
});

// bind undo shortcut
hotkeys(hotkeysMap.undo, 'all' , function (e) {
  if (!isEditableTagsActive()) {
    undo();
    e.preventDefault();
  }
});

// bind redo shortcut
hotkeys(hotkeysMap.redo, 'all' , function (e) {
    redo();
    e.preventDefault();
});

// bind toggle layer panel shortcut
hotkeys(hotkeysMap.toggleLayer, 'all', function (e) {
  changeView('layer-panel', $('view_layers_checkbox').checked);
  $('view_layers_checkbox').click();
  e.preventDefault();
});

// bind toggle controls shortcut
hotkeys(hotkeysMap.toggleControls, 'all', function (e) {
  changeView('controls', $('view_controles_checkbox').checked);
  $('view_controles_checkbox').click();
  e.preventDefault();
});

// bind zoom in shortcut
hotkeys(hotkeysMap.zoomIn, 'all', function (e) {
  zoomIn();
  e.preventDefault();
});

// bind zoom out shortcut
hotkeys(hotkeysMap.zoomOut, 'all', function (e) {
  zoomIn();
  e.preventDefault();
});

// bind zoom fit shortcut
hotkeys(hotkeysMap.zoomFit, 'all', function (e) {
  zoomFit();
  e.preventDefault();
});

// bind copy shortcut
hotkeys(hotkeysMap.copy, 'all', function (e) {
  if (canvas.getActiveObject()) {
    canvas.getActiveObject().clone(function(cloned) {
        window._clipboard = cloned;
    });
  }
  e.preventDefault();
});

// bind paste shortcut
hotkeys(hotkeysMap.paste, 'all', function (e) {
  if (!window._clipboard || !(window._clipboard instanceof fabric.Object)) {
    return;
  }
  window._clipboard.clone(function(clonedObj) {
          clonedObj.set({
              left: clonedObj.left + 10,
              top: clonedObj.top + 10
          });
          canvas.add(clonedObj);
          canvas.setActiveObject(clonedObj);
          canvas.requestRenderAll();
      });
  e.preventDefault();
});

// bind delete shortcut
hotkeys(hotkeysMap.delete, 'all', function (e) {
  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    removeLayer(activeObject);
    canvas.renderAll();
    e.preventDefault();
  }
});

// bind move object shortcuts
hotkeys(hotkeysMap.moveLeft, 'all', function (e) {
  moveActiveObject('left', e);
});

hotkeys(hotkeysMap.moveRight, 'all', function (e) {
  moveActiveObject('right', e);
});

hotkeys(hotkeysMap.moveUp, 'all', function (e) {
  moveActiveObject('up', e);
});

hotkeys(hotkeysMap.moveDown, 'all', function (e) {
  moveActiveObject('down' , e);
});



/**
 * @description Move the active object in the canvas
 * @param {*} direction 
 */
function moveActiveObject(direction, e) {
  var activeObject = canvas.getActiveObject();
  if (activeObject && isNotVisibleFloatingWindow()) {
    if (!isLongPressDirection) {
      activeObjectMoveStep = isGridVisible ? gridSize : 1;
    } else {
      // increase the step by 1 each time the long press is detected
      activeObjectMoveStep = activeObjectMoveStep += 1;
    }
    if (!longPressTimer) {
      longPressTimer = window.setTimeout(function () {
        isLongPressDirection = true;
      }, 500);
    }
    switch (direction) {
      case 'left':
        activeObject.left -= activeObjectMoveStep;
        break;
      case 'up':
        activeObject.top -= activeObjectMoveStep;
        break;
      case 'right':
        activeObject.left += activeObjectMoveStep;
        break;
      case 'down':
        activeObject.top += activeObjectMoveStep;
        break;
    }
    activeObject.setCoords();
    canvas.renderAll();
    e.preventDefault();
  }
}

document.addEventListener('keyup', function (event) {
  if (longPressTimer) {
    window.clearTimeout(longPressTimer);
    longPressTimer = 0;
    activeObjectMoveStep = 0;
  }
});

function isEditableTagsActive() {
   const activeElement = document.activeElement;
  // the tags that should be excluded from the default behavior
  const excludedTags = ['INPUT', 'TEXTAREA', 'DIV', 'SELECT'];

  if (excludedTags.includes(activeElement.tagName) || 
      (activeElement.isContentEditable && activeElement.tagName === 'DIV')) {
      return true;
  }
  return false;
}

document.addEventListener("paste", function (event) {
  const items = event.clipboardData.items;
  var isActive = true;
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
      const blob = items[i].getAsFile();
      const reader = new FileReader();

      reader.onload = function (event) {
        const data = event.target.result;
        fabric.Image.fromURL(data, function (img) {
          const activeObject = canvas.getActiveObject();

          if (activeObject && isActive) {
            const x =
              activeObject.left +
              (activeObject.width * activeObject.scaleX) / 2;
            const y =
              activeObject.top +
              (activeObject.height * activeObject.scaleY) / 2;
            putImageInFrame(img, x, y);
          } else {
            isActive = false;
            const canvasWidth = canvas.width / 2;
            const canvasHeight = canvas.height / 2;
            const scaleToFitX = canvasWidth / img.width;
            const scaleToFitY = canvasHeight / img.height;
            const scaleToFit = Math.min(scaleToFitX, scaleToFitY);

            img.set({
              scaleX: scaleToFit,
              scaleY: scaleToFit,
              left: (canvasWidth - img.width * scaleToFit) / 2,
              top: (canvasHeight - img.height * scaleToFit) / 2,
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            saveStateByManual();
          }
        });
      };
      reader.readAsDataURL(blob);
      updateLayerPanel();
    }
  }
});

canvas.on('mouse:down', function(options) {
  if (!options.target) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
  }
});
