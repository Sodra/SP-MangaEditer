
document.addEventListener('DOMContentLoaded', function() {
  openButton = $("verticalText");
  openButton.addEventListener("click", function () {
    var selectedFont = $('fontSelector').value;
    var fontsize = $("fontSizeSlider").value
    var fontStrokeWidth = $("fontStrokeWidthSlider").value

    
    const selectedValue = getSelectedValueByGroup("align_group");
    let style = {
      top: 50,
      left: 50,
      fontSize: parseInt(fontsize),
      fontFamily: selectedFont,
      fill: $("textColorPicker").value,
      stroke: $("textOutlineColorPicker").value,
      strokeWidth: parseInt(fontStrokeWidth),
      textAlign: selectedValue,
    };
    
    const cjkText = new VerticalTextbox("new", style);
    canvas.add(cjkText);
    canvas.setActiveObject(cjkText);
    canvas.renderAll();
  });
});

fabric.VerticalTextbox = VerticalTextbox;