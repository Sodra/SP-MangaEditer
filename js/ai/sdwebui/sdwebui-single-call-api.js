async function processQueue(layer, spinnerId, fetchFunction, imageName) {
  console.log(`Processing queue for ${imageName}`);
  try {
    const { img, responseData } = await sdQueue.add(() => sdwebui_generateImage(layer, fetchFunction));
    if (img) {
      await handleSuccessfulGeneration(img, responseData, layer, imageName);
    } else {
      createToastError("Generation error", "");
    }
  } catch (error) {
    console.error("processQueue", error);
  } finally {
    removeSpinner(spinnerId);
  }
}

async function handleSuccessfulGeneration(img, responseData, layer, imageName) {
  // Temporarily disable history saving to prevent saving both image addition and layer visibility change
  changeDoNotSaveHistory();
  
  const webpImg = await img2webp(img);
  webpImg.name = imageName;
  setImage2ImageInitPrompt(webpImg);
  
  // Don't hide the original panel layer
  
  const { centerX, centerY } = calculateCenter(layer);
  
  // Put the image in frame but without letting putImageInFrame save state
  putImageInFrame(webpImg, centerX, centerY, false, false, true, true);

  const infoObject = JSON.parse(responseData.info);
  if (layer) {
    layer.tempSeed = infoObject.seed;
  }
  webpImg.tempPrompt = infoObject.prompt;
  webpImg.tempNegative = infoObject.negative_prompt;
  
  // Re-enable history saving and save a single state for the entire operation
  changeDoSaveHistory();
  saveStateByManual();
}

const sdwebui_T2IProcessQueue = (layer, spinnerId) => processQueue(layer, spinnerId, sdwebui_fetchText2Image, "t2i");
const sdwebui_I2IProcessQueue = (layer, spinnerId) => processQueue(layer, spinnerId, sdwebui_fetchImage2Image, "i2i");

async function sdwebui_fetchText2Image(layer) {
  return post(sdWebUIUrls.t2i, baseRequestData(layer));
}

async function sdwebui_fetchImage2Image(layer) {
  const base64Image = imageObject2Base64ImageEffectKeep(layer);
  const requestData = {
    ...baseRequestData(layer),
    init_images: [base64Image.split(',')[1]],
    denoising_strength: layer.img2img_denoise
  };
  console.log( "sdwebui_fetchImage2Image requestData", requestData );
  return post(sdWebUIUrls.i2i, requestData);
}

async function post(url, requestData) {
  try {
    console.log("requestData:", requestData);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    return await response.json();
  } catch (error) {
    var checkSD = getText("checkSD_webUI_Text");
    createToastError("Fetch Error", checkSD);
    return null;
  }
}

async function sdwebui_generateImage(layer, fetchFunction) {
  const responseData = await fetchFunction(layer);
  if (!responseData) return null;

  const base64ImageData = responseData.images[0];
  const imageSrc = 'data:image/png;base64,' + base64ImageData;

  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(imageSrc, (img) => {
      img ? resolve({ img, responseData }) : reject(new Error('Failed to create a fabric.Image object'));
    });
  });
}

async function sdWebUI_RembgProcessQueue(layer, spinnerId) {
  console.log("Processing queue for rembg");
  try {
    const responseData = await sdQueue.add(() => sdwebui_removeBackground(layer));
    if (responseData && typeof responseData === 'string') {
      await handleSuccessfulRembg(responseData, layer);
    } else {
      createToastError("Invalid background removal response", "");
    }
  } catch (error) {
    console.error("sdWebUI_RembgProcessQueue", error);
  } finally {
    removeSpinner(spinnerId);
  }
}

async function sdwebui_removeBackground(layer) {
  const base64Image = imageObject2Base64ImageEffectKeep(layer);

  const requestData = rembgRequestData(layer);
  requestData.input_image = base64Image.split(',')[1];
  const response = await post(sdWebUIUrls.rembg, requestData);

  if (typeof response === 'object' && response.hasOwnProperty('image')) {
    return response.image;
  } else if (typeof response === 'string') {
    return response;
  } else {
    throw new Error('Unexpected response format from rembg API');
  }
}

async function handleSuccessfulRembg(responseData, layer) {
  if (!responseData.startsWith('data:image')) {
    responseData = 'data:image/png;base64,' + responseData;
  }

  // Disable history saving to prevent multiple entries
  changeDoNotSaveHistory();

  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(responseData, (img) => {
      if (img) {
        const { centerX, centerY } = calculateCenter(layer);
        putImageInFrame(img, centerX, centerY, false, false, true, true);
        resolve(img);
        
        // Don't hide the original layer
        
        // Re-enable history saving and save a single entry
        changeDoSaveHistory();
        saveStateByManual();
      } else {
        changeDoSaveHistory(); // Make sure to re-enable even on error
        reject(new Error('Failed to create a fabric.Image object from rembg result'));
      }
    }, { crossOrigin: 'anonymous' });
  });
}
