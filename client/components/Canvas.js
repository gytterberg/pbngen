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
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
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
  const displayModes = {
    ORIGINAL: 'original',
    PREPROCESSED: 'preprocessed',
    QUANTIZED: 'quantized',
    EDGES: 'edges',
  };

  const paramNames = {
    CONTRAST: 'contrast',
    BLUR: 'blur',
    COLORS: 'colors',
    THRESHOLD: 'threshold',
    APERTURE: 'aperture',
    L2GRADIENT: 'l2Gradient',
  };

  const [displayMode, setDisplayMode] = useState(displayModes.ORIGINAL);

  const defaultParams = {
    // original defaults in comments
    contrast: 175, // 175
    blur: 7, // 7
    colors: 16, // 16
    threshold: [50, 100], // [50, 150]
    aperture: 3, // 3.... doesn't like anything else
    l2Gradient: 'rootsquares', // 'sum'
  };
  const [params, setParams] = useState(defaultParams);

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

    const quantizer = new rgbquant({ colors: params.colors });
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
    const source = cv.imread(canvas);
    const dest = new cv.Mat();

    // turn image grayscale for edge detection
    cv.cvtColor(source, source, cv.COLOR_RGB2GRAY, 0);

    // detect edges, keep playing with parameters
    cv.Canny(
      source,
      dest,
      params.threshold[0],
      params.threshold[1],
      params.aperture,
      params.l2Gradient === 'rootsquares' ? true : false
    );

    // invert image, turn lines black
    cv.bitwise_not(dest, dest);

    cv.imshow(canvas, dest); // display the output to canvas

    source.delete(); // remember to free the memory
    dest.delete();
  };

  const fileUploadHandler = (event) => {
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

  // const handleParamChange = (param, value) => {
  // setParams({ ...params, [param]: value })
  // switch (param) {
  //   case paramNames.CONTRAST:
  //   case paramNames.BLUR:
  //     setDisplay(displayModes.PREPROCESSED);
  //     preprocessImage();
  //     break;
  //   case paramNames.COLORS:
  //     setDisplay(displayModes.QUANTIZED);
  //     break;
  //   case paramNames.APERTURE:
  //   case paramNames.THRESHOLD:
  //   case paramNames.L2GRADIENT:
  //     setDisplay(displayModes.EDGES);
  //     break;
  // }
  // };

  // useEffect(() => {}, [params.CONTRAST, params.BLUR]);

  // watch displayMode and render appropriate display
  useEffect(() => {
    if (displayMode === '') {
      return;
    }
    console.log('In useEffect on displayMode, value:');
    console.log(displayMode);
    switch (displayMode) {
      case displayModes.ORIGINAL:
        drawImage({ filter: false });
        break;
      case displayModes.PREPROCESSED:
        preprocessImage();
        break;
      case displayModes.QUANTIZED:
        quantizeImage();
        break;
      case displayModes.EDGES:
        processEdges();
        break;
    }
  }, [displayMode]);

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
              setDisplayMode(displayModes.EDGES);
            }}
          >
            Process image
          </Button>
        </Grid>

        <Grid item>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">View stages</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="display"
                  value={displayMode}
                  name="radio-buttons-group"
                  onChange={(event, value) => setDisplayMode(value)}
                >
                  <FormControlLabel
                    value={displayModes.ORIGINAL}
                    control={<Radio />}
                    label="Original image"
                  />
                  <FormControlLabel
                    value={displayModes.PREPROCESSED}
                    control={<Radio />}
                    label="Preprocessed image"
                  />
                  <FormControlLabel
                    value={displayModes.QUANTIZED}
                    control={<Radio />}
                    label="Quantized image"
                  />
                  <FormControlLabel
                    value={displayModes.EDGES}
                    control={<Radio />}
                    label="Final image"
                  />
                </RadioGroup>
              </FormControl>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    );
  };

  const renderParamControls = () => {
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">Processing parameters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container direction="column" alignItems="stretch">
            <Grid item>
              <Typography>Contrast</Typography>
              <Slider
                value={params.contrast}
                min={0}
                max={200}
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                  setParams({ ...params, [paramNames.CONTRAST]: value })
                }
                onChangeCommitted={() => {
                  setDisplayMode(''); // is this hacky and how badly so?
                  setDisplayMode(displayModes.PREPROCESSED);
                }}
              />
            </Grid>

            <Grid item>
              <Typography>Blur</Typography>
              <Slider
                value={params.blur}
                min={0}
                max={20}
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                  setParams({ ...params, [paramNames.BLUR]: value })
                }
                onChangeCommitted={() => {
                  setDisplayMode(''); // is this hacky and how badly so?
                  setDisplayMode(displayModes.PREPROCESSED);
                }}
              />
            </Grid>

            <Grid item>
              <Typography>Colors</Typography>
              <Slider
                value={params.colors}
                min={4}
                max={32}
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                  setParams({ ...params, [paramNames.COLORS]: value })
                }
                onChangeCommitted={() => {
                  setDisplayMode(''); // is this hacky and how badly so?
                  setDisplayMode(displayModes.QUANTIZED);
                }}
              />
            </Grid>

            {/* openCV doesn't like any aperture other than 3... crashes
            <Grid item>
              <Typography>Blur aperture</Typography>
              <Slider
                value={params.aperture}
                min={0}
                max={200}
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                  setParams({ ...params, [paramNames.APERTURE]: value })
                }
                onChangeCommitted={() => {
                  setDisplayMode(''); // is this hacky and how badly so?
                  setDisplayMode(displayModes.EDGES);
                }}
              />
            </Grid> */}

            <Grid item>
              <Typography>Hysteresis threshold range</Typography>
              <Slider
                value={params.threshold}
                min={0}
                max={200}
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                  setParams({ ...params, [paramNames.THRESHOLD]: value })
                }
                onChangeCommitted={() => {
                  setDisplayMode(''); // is this hacky and how badly so?
                  setDisplayMode(displayModes.EDGES);
                }}
              />
            </Grid>

            <Grid item>
              <FormControl component="fieldset">
                <Typography>Gradient magnitude function</Typography>
                <RadioGroup
                  value={params.l2Gradient}
                  onChange={(event, value) => {
                    setParams({ ...params, [paramNames.L2GRADIENT]: value });
                    setDisplayMode(''); // is this hacky and how badly so?
                    setDisplayMode(displayModes.EDGES);
                  }}
                >
                  <FormControlLabel
                    value="sum"
                    control={<Radio />}
                    label="Sum"
                  />
                  <FormControlLabel
                    value="rootsquares"
                    control={<Radio />}
                    label="Root of squares"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
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
      <Grid container direction="row" justifyContent="space-between">
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
          <Grid
            container
            justifyContent="space-around"
            ref={canvasContainerRef}
          >
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
