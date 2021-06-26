import React, { useRef, useEffect, useState, useCallback } from 'react';
import rgbquant from 'rgbquant';
let cv = window.cv;

const Canvas = (props) => {
  const status = useScript(
    'https://cdn.jsdelivr.net/gh/wallat/compiled-opencvjs/v4.2.0/opencv.js'
  );
  const [waitForFuckingCV, setWaitForFuckingCV] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const pika = '/raw/ash-pikachu.jpg';
  const dahlia = '/raw/dahlia.jpg';

  /// set up image
  useEffect(() => {
    console.log('In useeffect, status = ' + status);
    cv = window.cv;
    if (status !== 'ready' || typeof cv === 'undefined') {
      return;
    }
    // if (cv) {
    console.log('We got here');
    console.log(cv);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let img = new Image();
    img = imgRef.current;
    img.src = imgRef.current.src;

    // console.log(localImage);

    const quantizeImage = (image) => {
      // Set the canvas the same width and height of the image

      canvas.width = image.width;
      canvas.height = image.height;

      ctx.filter = 'contrast(175%) blur(7px)';

      ctx.drawImage(image, 0, 0);

      const quantizerOptions = {
        colors: 16,
      };
      const quantizer = new rgbquant(quantizerOptions);
      quantizer.sample(canvas);
      let pal = quantizer.palette(false);
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

    const whiteToTransparent = () => {
      // have canvas/image
    };

    img.onload = () => {
      // ctx.canvas.width = img.width;
      // ctx.canvas.height = img.height;
      quantizeImage(img);
      drawEdges(canvas);
    };
  }, [waitForFuckingCV]);

  return (
    <>
      <canvas width="10" height="10" ref={canvasRef} {...props} />
      <img src={dahlia} ref={imgRef} hidden={true} alt="img" />
      <button
        onClick={() => {
          console.log('clicked');
          setWaitForFuckingCV(true);
        }}
      >
        Hopefully OpenCV is loaded ¯\_(ツ)_/¯
      </button>
      {/* <img src={pika} ref={imgRef} hidden={true} alt="img" /> */}
    </>
  );
};

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
