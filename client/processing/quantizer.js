class Quantizer {
  constructor(canvas) {
    /*
      do we really need a canvas reference or can we dump in all the pixels?

      pointGroups is the main storage area
      it starts off with everything and is gradually split

      do we care about cuts? I don't remember what that is
    */

    this.canvas = canvas;
    this.pointGroups = [];
    this.cuts = [];
  }

  sample() {
    debugger;
    const firstGroup = {
      points: [],
      xMin: 0,
      xMax: 255,
      yMin: 0,
      yMax: 255,
      zMin: 0,
      zMax: 255,
    };
    // generate array of pixels
    for (let x = 0; x < this.canvas.width; x++) {
      for (let y = 0; y < this.canvas.height; y++) {
        const pixel = this.canvas
          .getContext('2d')
          .getImageData(x, y, 1, 1).data;
        firstGroup.points.push({
          x,
          y,
          red: pixel[0],
          green: pixel[1],
          blue: pixel[2],
        });
      }
    }
    this.pointGroups.push(firstGroup);
    console.log('>>>>>>>>>');
    console.log(this.pointGroups);
  }

  quantize(colors) {
    console.log('In Quantizer.quantize');
    this.sample();
    console.log(this.pointGroups);

    for (let i = 0; i < colors; i++) {
      const groupToSplitStats = this.findNextSplit();
      const splitGroups = this.splitGroup(groupToSplitStats);
      // cuts.push(splitGroups.cut);
      // remove the group we just split and add the groups we split it into
      this.pointGroups = this.pointGroups.filter(
        (group) => group.index !== groupToSplitStats.index
      );
      this.pointGroups.push(splitGroups[0]);
      this.pointGroups.push(splitGroups[1]);
    }
    this.reassignColors();
    this.draw();
  }

  reassignColors() {
    const computeAverageColor = (pixels) => {
      const totalRed = pixels.reduce((acc, pixel) => (acc += pixel.red), 0);
      const totalGreen = pixels.reduce((acc, pixel) => (acc += pixel.green), 0);
      const totalBlue = pixels.reduce((acc, pixel) => (acc += pixel.blue), 0);

      return {
        red: parseInt(totalRed / pixels.length),
        green: parseInt(totalGreen / pixels.length),
        blue: parseInt(totalBlue / pixels.length),
      };
    };

    // walk through groups in pointGroups
    // compute average red, green, blue value for each group
    // set all pixels in that group to average color
    this.pointGroups = this.pointGroups.map((group) => {
      // compute average color value for this group
      group.averageColor = computeAverageColor(group.points);
      group.points = group.points.map((point) => {
        point.red = group.averageColor.red;
        point.green = group.averageColor.green;
        point.blue = group.averageColor.blue;
      });
      return group;
    });
  }

  draw() {
    // pixel groups in pointGroups are now uniform colors, draw back to canvas
    // walk through all points in all groups, draw color at x,y coordinate
    const context = this.canvas.getContext('2d');
    this.pointGroups.forEach((group) => {
      console.log(group);
      group.points.forEach((point) => {
        context.fillStyle = `rgb(${group.averageColor.red}, ${group.averageColor.green}, ${group.averageColor.blue}`;
        console.log(point);
        context.fillRect(point.x, point.y, 1, 1);
      });
    });
  }

  palette() {}

  findNextSplit() {
    // determine which group to split
    // (which has the greatest variation along one dimension)

    // walk through point groups
    // on each group, generate statistics about the individual color channels in that group
    // (min and max value, variance)
    // return the channel stats object with the greatest range
    let groupInfo = this.pointGroups.map((group, index) => {
      let reds = group.points.map((point) => point.red);
      let greens = group.points.map((point) => point.green);
      let blues = group.points.map((point) => point.blue);

      let sumRed = reds.reduce((acc, redVal) => acc + redVal, 0);
      let sumGreen = reds.reduce((acc, greenVal) => acc + greenVal, 0);
      let sumBlue = reds.reduce((acc, blueVal) => acc + blueVal, 0);

      let avgRed = sumRed / reds.length;
      let avgGreen = sumGreen / greens.length;
      let avgBlue = sumBlue / blues.length;

      // do I need index inside of here?
      // or the actual group? I don't think so
      let stats = [
        {
          groupIndex: index,
          group: this.pointGroups[index],
          name: 'red',
          splitDimension: 'x',
          index: 0,
          range: Math.max(reds) - Math.min(reds),
          variance: reds.reduce(
            (acc, redVal) => acc + Math.pow(redVal - avgRed, 2),
            0
          ),
        },
        {
          groupIndex: index,
          group: this.pointGroups[index],
          name: 'green',
          splitDimension: 'y',
          index: 1,
          range: Math.max(greens) - Math.min(greens),
          variance: greens.reduce(
            (acc, greenVal) => acc + Math.pow(greenVal - avgGreen, 2),
            0
          ),
        },
        {
          groupIndex: index,
          group: this.pointGroups[index],
          name: 'blue',
          splitDimension: 'z',
          index: 2,
          range: Math.max(blues) - Math.min(blues),
          variance: blues.reduce(
            (acc, blueVal) => acc + Math.pow(blueVal - avgBlue, 2),
            0
          ),
        },
      ];

      // return the group stats object with the greatest range for this group

      return stats.sort((first, second) =>
        first.range < second.range ? 1 : -1
      )[0];
    });

    // return the overall group stats object with the greatest range
    return groupInfo.sort((first, second) =>
      first.range < second.range ? 1 : -1
    )[0];
  }

  splitGroup(groupStats) {
    // split the group based on the median value

    // sort points in the group according to the channel value/dimension that we're splitting on

    const splitGroup = this.pointGroups[groupStats.groupIndex];

    const sortedPoints = splitGroup.points.sort((firstPoint, secondPoint) =>
      firstPoint[groupStats.name] < secondPoint[groupStats.name] ? 1 : -1
    );

    // find the median index and value
    const medianIndex = parseInt(sortedPoints.length / 2);
    const medianValue = sortedPoints[medianIndex][groupStats.name];

    const groupA = {
      points: [],
      xMin: groupStats.group.xMin,
      xMax: groupStats.group.xMax,
      yMin: groupStats.group.yMin,
      yMax: groupStats.group.yMax,
      zMin: groupStats.group.zMin,
      zMax: groupStats.group.zMmax,
    };

    const groupB = {
      points: [],
      xMin: groupStats.group.xMin,
      xMax: groupStats.group.xMax,
      yMn: groupStats.group.yMin,
      yMax: groupStats.group.yMax,
      zMin: groupStats.group.zMin,
      zMax: groupStats.group.zMax,
    };

    switch (groupStats.splitDimension) {
      case 'x':
        groupA.xMax = medianValue;
        groupB.xMin = medianValue;
      case 'y':
        groupA.yMax = medianValue;
        groupB.yMin = medianValue;
      case 'z':
        groupA.zMax = medianValue;
        groupB.zMin = medianValue;
    }

    groupStats.group.points.forEach((point) => {
      if (point[groupStats.name] < medianValue) {
        groupA.points.push(point);
      } else {
        groupB.points.push(point);
      }
    });
    return [groupA, groupB];
  }
}

export default Quantizer;
