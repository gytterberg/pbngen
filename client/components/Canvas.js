import React, { useRef, useEffect, useState, useCallback } from 'react';
// import localImage from '../../public/raw/ash-pikachu.jpg';

const Canvas = (props) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  // const [canvas, setCanvas] = useState(null);
  // // let img = useRef(null);
  // const [ctx, setCtx] = useState(null);

  const remoteImg =
    'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/dahlia-1508785047.jpg?crop=1.00xw:0.669xh;0,0.0136xh&resize=480:*';
  //'https://secure.img1-fg.wfcdn.com/im/02238154/compr-r85/8470/84707680/pokemon-pikachu-wall-decal.jpg';
  const localImg = '/raw/ash-pikachu.jpg';
  // const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const invert = (data) => {
    for (let i = 0; i < data.length; i++) {
      data[i] = 100;
    }
  };

  /// set up image
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let img = new Image();
    img = imgRef.current;
    img.src = imgRef.current.src;

    // console.log(localImage);

    const drawImage = (image) => {
      // Set the canvas the same width and height of the image

      canvas.width = image.width;
      canvas.height = image.height;

      ctx.filter = 'contrast(175%) blur(15px)';

      ctx.drawImage(invert(image), 0, 0);
    };

    img.onload = () => {
      // ctx.canvas.width = img.width;
      // ctx.canvas.height = img.height;
      drawImage(img);
    };
  }, []);

  return (
    <>
      <canvas width="10" height="10" ref={canvasRef} {...props} />
      <img src={localImg} ref={imgRef} hidden={true} alt="img" />
    </>
  );
};

export default Canvas;

// const draw = (ctx, frameCount) => {
//   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//   ctx.fillStyle = '#000000';
//   ctx.beginPath();
//   ctx.arc(50, 100, 20 * Math.sin(frameCount * 0.05) ** 2, 0, 2 * Math.PI);
//   ctx.fill();
// };

// useEffect(() => {
// let frameCount = 0;
// let animationFrameId;
// //Our draw came here
// const render = () => {
//   frameCount++;
//   draw(ctx, frameCount);
//   animationFrameId = window.requestAnimationFrame(render);
// };
// render();
// return () => {
//   window.cancelAnimationFrame(animationFrameId);
// };
// }, []);
