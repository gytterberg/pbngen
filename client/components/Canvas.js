import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Grid,
  Input,
  Paper,
  Typography,
  Slider,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@material-ui/core';
import { ExpandMoreIcon } from '@mui/icons-material';
import React, { useRef, useEffect, useState, useCallback } from 'react';

import rgbquant from 'rgbquant';

const Canvas = (props) => {
  const status = useScript(
    'https://cdn.jsdelivr.net/gh/wallat/compiled-opencvjs/v4.2.0/opencv.js'
  );
  // const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [palette, setPalette] = useState([]);
  // display options: original, preprocessed, quantized, edges
  const [display, setDisplay] = useState('original');

  const [params, setParams] = useState({
    contrast: 175, // 175
    blur: 7, // 7
    threshold1: 50,
    threshold2: 100,
    apertureSize: 3,
    l2Gradient: false,
  });

  const canvasRef = useRef();
  const imgRef = useRef();
  const canvasContainerRef = useRef();

  /*
   *
   *
   *   Image processing
   *
   *
   *
   *
   */
  const drawImage = (options = { filter: true }) => {
    const canvas = canvasRef.current;
    const image = imgRef.current;
    const ctx = canvas.getContext('2d');

    console.log('Canvas container:', canvasContainerRef);

    // have max width of canvas in canvasContainerRef
    if (options.filter) {
      ctx.filter = `contrast(${params.contrast}%) blur(${params.blur}px)`;
    } else {
      ctx.filter = 'none';
    }

    // do we need to scale the image?
    if (canvasContainerRef.current.offsetWidth < image.width) {
      // scale image
      const imageRatio = image.naturalHeight / image.naturalWidth;
      let scaledHeight = canvasContainerRef.current.offsetWidth * imageRatio;
      let scaledWidth = canvasContainerRef.current.offsetWidth;
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      if (options.filter) {
        ctx.filter = `contrast(${params.contrast}%) blur(${params.blur}px)`;
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
    } else {
      // don't scale
      canvas.width = image.width;
      canvas.height = image.height;
      if (options.filter) {
        ctx.filter = `contrast(${params.contrast}%) blur(${params.blur}px)`;
      }
      ctx.drawImage(image, 0, 0);
    }
  };

  const preprocessImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawImage({ filter: true });
  };

  const quantizeImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imgRef.current;

    drawImage({ filter: true });

    const quantizerOptions = {
      colors: 16,
    };
    const quantizer = new rgbquant(quantizerOptions);
    quantizer.sample(canvas);
    let paletteRGBA = quantizer.palette(false, true);
    let palette32 = [];
    for (let i = 0; i < paletteRGBA.length; i += 4) {
      palette32.push(
        '#' +
          paletteRGBA[i].toString(16).padStart(2, '0') +
          paletteRGBA[i + 1].toString(16).toString(16).padStart(2, '0') +
          paletteRGBA[i + 2].toString(16).toString(16).padStart(2, '0')
      );
    }
    setPalette(palette32);

    let out = quantizer.reduce(canvas);
    let outImg = new ImageData(
      new Uint8ClampedArray(out),
      canvas.width,
      canvas.height
    );

    ctx.putImageData(outImg, 0, 0);
  };

  const processEdges = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cv = window.cv;
    if (
      status !== 'ready' ||
      typeof cv === 'undefined' ||
      typeof image === null
    ) {
      return;
    }
    quantizeImage();
    const source = cv.imread(canvas); // load the image from <img>
    const dest = new cv.Mat();

    // turn image grayscale for edge detection
    cv.cvtColor(source, source, cv.COLOR_RGB2GRAY, 0);

    // detect edges, keep playing with parameters
    cv.Canny(source, dest, 50, 100, 3, false);

    // invert image, turn lines black
    cv.bitwise_not(dest, dest);

    cv.imshow(canvas, dest); // display the output to canvas

    source.delete(); // remember to free the memory
    dest.delete();
  };

  const fileUploadHandler = (event) => {
    // setLoading(true);
    const file = event.target.files[0];
    setImage(file);
    imgRef.current.src = window.URL.createObjectURL(file);
  };

  /*
   *   ^^ End image processing
   *
   *
   *
   *
   *
   *   vv Event handlers
   */

  const handleParamChange = (param, value) => {
    params[param] = value;
    setParams(params);
    setDisplay('preprocessed');
    preprocessImage();
  };

  const handleDisplayChange = (value) => {
    // display options: original, preprocessed, quantized, edges
    setDisplay(value);
    switch (value) {
      case 'original':
        drawImage({ filter: false });
        break;
      case 'preprocessed':
        preprocessImage();
        break;
      case 'quantized':
        quantizeImage();
        break;
      case 'edges':
        processEdges();
        break;
    }
  };

  /*
   *   ^^ End event handlers
   *
   *
   *
   *
   *
   *   vv Rendering
   */

  const renderControls = () => {
    return (
      <Grid container direction="column" alignItems="stretch">
        {/* row container for buttons */}
        <Grid item>
          <input
            hidden
            type="file"
            id="fileInput"
            onChange={fileUploadHandler}
          />
          <label htmlFor="fileInput">
            <Button fullWidth variant="contained" component="span">
              Choose image
            </Button>
          </label>
        </Grid>
        <Grid item>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setDisplay('edges');
              processEdges();
            }}
          >
            Process image
          </Button>
        </Grid>

        <Grid item>
          <FormControl component="fieldset">
            {/* <FormLabel component="legend">Display</FormLabel> */}
            <RadioGroup
              aria-label="display"
              value={display}
              name="radio-buttons-group"
              onChange={(event, value) => handleDisplayChange(value)}
            >
              {console.log('Value of display: ' + display)}
              <FormControlLabel
                value="original"
                control={<Radio />}
                label="Original image"
              />
              <FormControlLabel
                value="preprocessed"
                control={<Radio />}
                label="Preprocessed image"
              />
              <FormControlLabel
                value="quantized"
                control={<Radio />}
                label="Quantized image"
              />
              <FormControlLabel
                value="edges"
                control={<Radio />}
                label="Final image"
              />
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
    );
  };

  const renderParamControls = () => {
    // param: contrast
    // param: blur
    return (
      <Grid container direction="row">
        <Grid item xs={1}></Grid>
        <Grid item xs={10}>
          <Grid container direction="column" alignItems="stretch">
            <Grid item>
              <Typography>Contrast</Typography>
              <Slider
                key={'slider-contrast-' + params.contrast}
                // value={params.contrast}
                defaultValue={params.contrast}
                min={0}
                max={200}
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                  handleParamChange('contrast', value)
                }
              />
            </Grid>

            <Grid item>
              <Typography>Blur</Typography>
              <Slider
                key={'slider-blur-' + params.blur}
                // value={params.contrast}
                defaultValue={params.blur}
                min={0}
                max={20}
                valueLabelDisplay="auto"
                onChange={(event, value) => handleParamChange('blur', value)}
              />
            </Grid>

            <Grid item>
              <Typography>Contrast</Typography>
              <Slider
                key={'slider' + params.contrast}
                // value={params.contrast}
                defaultValue={params.contrast}
                min={0}
                max={200}
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                  handleParamChange('contrast', value)
                }
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  const renderPalette = () => {
    // return a grid of rectangles filled with palette colors
    const contrastTextColor = (hexColor) => {
      // hexColor is like #818283
      let Rdec = parseInt('0x' + hexColor.slice(1, 3)); // R value, 0x81
      let Gdec = parseInt('0x' + hexColor.slice(3, 5)); // G value, 0x82
      let Bdec = parseInt('0x' + hexColor.slice(5, 7)); // B value, 0x83
      if (Rdec + Gdec + Bdec < 350) {
        return '#E8E8E8';
      } else {
        return '#484848';
      }
    };

    return (
      <Grid container direction="row">
        <Grid item xs={1}></Grid>
        <Grid item xs={10}>
          <Grid container direction="column" alignItems="stretch">
            {palette.map((color, index) => {
              return (
                <Grid item key={color}>
                  <Paper
                    elevation={5}
                    style={{
                      backgroundColor: color,
                    }}
                  >
                    <Typography
                      style={{ color: contrastTextColor(color) }}
                      align="center"
                    >
                      {(index + 1).toString() + ' - ' + color.toUpperCase()}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
    );
  };

  return (
    <>
      <Grid container direction="row" justify="space-between">
        <Grid item xs={2}>
          <Grid container direction="row">
            <Grid item xs={1}></Grid>
            <Grid item xs={10}>
              <Grid container direction="column">
                <Grid item>{renderControls()}</Grid>
                <Grid item>{renderParamControls()}</Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={8}>
          <Grid container justify="space-around" ref={canvasContainerRef}>
            <canvas width="800" height="600" ref={canvasRef} />
          </Grid>
        </Grid>
        <Grid item xs={2}>
          {renderPalette()}
        </Grid>
      </Grid>

      <Grid item>
        <img
          onLoad={() => drawImage({ filter: false })}
          src=""
          ref={imgRef}
          alt="img"
          hidden={true}
        />
      </Grid>
    </>
  );
};

/*
 *
 *
 *
 * script loading hook below
 *
 *
 *
 */

// Hook from https://usehooks.com/useScript/
function useScript(src) {
  // Keep track of script status ("idle", "loading", "ready", "error")
  const [status, setStatus] = useState(src ? 'loading' : 'idle');
  useEffect(
    () => {
      // Allow falsy src value if waiting on other data needed for
      // constructing the script URL passed to this hook.
      if (!src) {
        setStatus('idle');
        return;
      }
      // Fetch existing script element by src
      // It may have been added by another intance of this hook
      let script = document.querySelector(`script[src="${src}"]`);
      if (!script) {
        // Create script
        script = document.createElement('script');
        script.src = src;
        // script.async = true;
        script.setAttribute('data-status', 'loading');
        // Add script to document body
        document.body.appendChild(script);
        // Store status in attribute on script
        // This can be read by other instances of this hook
        const setAttributeFromEvent = (event) => {
          script.setAttribute(
            'data-status',
            event.type === 'load' ? 'ready' : 'error'
          );
        };
        script.addEventListener('load', setAttributeFromEvent);
        script.addEventListener('error', setAttributeFromEvent);
      } else {
        // Grab existing script status from attribute and set to state.
        setStatus(script.getAttribute('data-status'));
      }
      // Script event handler to update status in state
      // Note: Even if the script already exists we still need to add
      // event handlers to update the state for *this* hook instance.
      const setStateFromEvent = (event) => {
        setStatus(event.type === 'load' ? 'ready' : 'error');
      };
      // Add event listeners
      script.addEventListener('load', setStateFromEvent);
      script.addEventListener('error', setStateFromEvent);
      // Remove event listeners on cleanup
      return () => {
        if (script) {
          script.removeEventListener('load', setStateFromEvent);
          script.removeEventListener('error', setStateFromEvent);
        }
      };
    },
    [src] // Only re-run effect if script src changes
  );
  return status;
}

export default Canvas;
