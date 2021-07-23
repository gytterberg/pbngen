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
} from '@material-ui/core';
import React, { useRef, useEffect, useState, useCallback } from 'react';

import rgbquant from 'rgbquant';
const cv = window.cv;

const Canvas = (props) => {
  const status = useScript(
    'https://cdn.jsdelivr.net/gh/wallat/compiled-opencvjs/v4.2.0/opencv.js'
  );
  // const [runProcess, setRunProcess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [palette, setPalette] = useState([]);
  const [params, setParams] = useState({
    contrast: 175,
    blur: 7,
    threshold1: 50,
    threshold2: 100,
    apertureSize: 3,
    l2Gradient: false,
  });

  const canvasRef = useRef();
  const imgRef = useRef();

  /// set up image
  const processImage = () => {
    cv = window.cv;
    if (
      status !== 'ready' ||
      typeof cv === 'undefined' ||
      typeof image === null
    ) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let img = imgRef.current;
    img.src = imgRef.current.src;

    const quantizeImage = (image) => {
      // Set the canvas the same width and height of the image

      canvas.width = image.width;
      canvas.height = image.height;

      // filter params string
      ctx.filter = `contrast(${params.contrast})% blur(${params.blur}px)`;

      ctx.drawImage(image, 0, 0);

      const quantizerOptions = {
        colors: 16,
      };
      const quantizer = new rgbquant(quantizerOptions);
      quantizer.sample(canvas);

      let paletteRGBA = quantizer.palette(false, true);
      console.log(paletteRGBA);
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

    const drawEdges = (canvas) => {
      // let quantizedImgData = ctx.getImageData(
      //   0,
      //   0,
      //   canvas.width,
      //   canvas.height
      // );

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

    quantizeImage(img);
    drawEdges(canvas);
  };

  const fileUploadHandler = (event) => {
    setLoading(true);
    const file = event.target.files[0];
    setImage(file);
    // imgRef.src = file;
    console.log(imgRef);
    imgRef.current.src = window.URL.createObjectURL(file);
  };

  const renderButtons = () => {
    return (
      <Grid container direction="column" alignItems="center">
        {/* row container for buttons */}
        <Grid item xs={10}>
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
        <Grid xs={10}>
          <Button fullWidth variant="contained" onClick={processImage}>
            Process image
          </Button>
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
      // if (Rdec < 100 && Gdec < 100 && Bdec < 100) {
      if (Rdec + Gdec + Bdec < 350) {
        return '#E8E8E8';
      } else {
        return '#484848';
      }
    };

    console.log('IN RENDERPALETTE');
    console.log(palette);
    return (
      <Grid container direction="column">
        {palette.map((color, index) => {
          return (
            <Grid item xs={12} key={color}>
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
    );
  };

  return (
    <>
      <Grid container direction="column">
        <Grid
          container
          direction="row"
          // alignItems="center"
          // justifyContent="center"
        >
          <Grid xs={2} item>
            {renderButtons()}
          </Grid>
          <Grid item xs={8}>
            <Card>
              <Grid container justifyContent="center" alignItems="center">
                <Grid item xs={12}>
                  <canvas width="800" height="600" ref={canvasRef} />
                </Grid>
              </Grid>
            </Card>
          </Grid>
          <Grid item xs={2}>
            {renderPalette()}
          </Grid>
        </Grid>

        <Grid item>
          <img src="" ref={imgRef} alt="img" hidden={true} />
        </Grid>
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
