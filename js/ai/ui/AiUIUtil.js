function changeExternalAPI(button) {
  changeSelected(button);

  const selectedValue = getSelectedValueByGroup("externalApiGroup");

  var help = getText("help_api_connect_settings");
  if ( selectedValue === "sdWebUIButton" ) {
    API_mode = apis.A1111;
    createToast("API CHANGE!", "WebUI(A1111/Forge)", 2000 );
    $('apiSettingsUrlHelpe').innerHTML = `<a href="html/API_Help/sdwebui_settings.html" target="_blank">${help}</a>`;
  } else if ( selectedValue === "comfyUIButton" ) {
    API_mode = apis.COMFYUI;
    createToast("API CHANGE!", "COMFYUI", 2000);
    // updateAiModelType();
    $('apiSettingsUrlHelpe').innerHTML = `<a href="html/API_Help/comfyui_settings.html" target="_blank">${help}</a>`;
  }

  updateWorkflowType();
  updateLayerPanel();
  putAiAllButtons();
  apiHeartbeat();
}

function changeAiModelType(button) {
  changeSelected(button);
  updateWorkflowType()

  const generateModelGroup = getSelectedValueByGroup("generateModelGroup");
  if ( generateModelGroup === "Flux" ) {
    if($("basePrompt_cfg_scale").value > 3){
      $("basePrompt_cfg_scale").value = 1.5;
    }
  }
}


function changeWorkflowType(button) {
  changeSelected(button);
  updateWorkflowType();
}
function updateWorkflowType() {
  const externalApiGroup = getSelectedValueByGroup("externalApiGroup");
  const generateModelGroup = getSelectedValueByGroup("generateModelGroup");
  const generateWorkflow = getSelectedValueByGroup("generateWorkflow");

  if ( generateModelGroup === "SD" ) {
    hideById("manualSelectWorkflowId");
    showById("negativeAreaId");
  } else if ( generateModelGroup === "Flux" ) {
    showById("manualSelectWorkflowId");
    hideById("negativeAreaId"); 
  }

  if (externalApiGroup === "comfyUIButton"){
    showById("manualSelectModelId");
    if(generateModelGroup === "Flux" && generateWorkflow === "Diffution"){
        showById("clipDropdownControle");
        showById("vaeDropdownControle");
        return;
    }
  }else if(externalApiGroup === "sdWebUIButton"){
    showById("manualSelectModelId");
    hideById("manualSelectWorkflowId");
    showById("clipDropdownControle");
    hideById("vaeDropdownControle");
    hideById("manualSelectWorkflowId");
    return;
  }

  showById("manualSelectModelId");
  hideById("clipDropdownControle");
  hideById("vaeDropdownControle");
  return;
}