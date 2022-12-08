function clearCanvas(canvas){
    if (canvas == perspectiveCanvas){
        canvas.style.opacity = 0;
        setTimeout( function(){
            canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
            canvas.style.opacity = 0.9;
        },200);
    }

    else
    canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
}

class line{
    constructor(fX, fY, tX, tY){
        this.fromX = fX;
        this.fromY = fY;
        this.toX = tX;
        this.toY = tY;
        this.asArray = [fX, fY, tX, tY];
        this.gradient = this.getGradient();
        this.from = new point(fX, fY);
        this.to = new point(tX, tY);
    }

    getGradient(){
        if (this.toX === this.fromX) return VERTICAL_GRADIENT;
        else return((this.toY - this.fromY) / (this.toX - this.fromX));
    }

    toString(){
        return `
        from: (${this.fromX},${this.fromY})\n
        to  : (${this.toX},${this.toY})\n
        `
    }
}

class point{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    isWithinCanvas(){
        return (this.isWithinCanvasX()) && (this.isWithinCanvasY());
    }

    isWithinCanvasX(){
        return ((minW <= this.x) && (this.x <= maxW)); 
    }

    isWithinCanvasY(){
        return ((minH <= this.y) && (this.y <= maxH)); 
    }

    yTooLow(){
        return this.y < minH;
    }

    yTooHigh(){
        return this.y > maxH;
    }

    xTooLow(){
        return this.x < minW;
    }

    xTooHigh(){
        return this.x > maxW;
    }

    toString(){
        return `(${this.x}, ${this.y})`;
    }

    toStringRounded(){
        return `(${Math.round(this.x)}, ${Math.round(this.y)})`;
    }

    distanceFrom(point2){
        return Math.sqrt((this.x - point2.x)*(this.x - point2.x) + (this.y - point2.y)*(this.y - point2.y));
    }

    static distance(a,b){
        return Math.sqrt((a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y));
    }
}

//returns the intersection point of 2 straight lines
function getIntersection(line1, line2){
    let x1 = line1.fromX;
    let y1 = line1.fromY;

    let x2 = line2.fromX;
    let y2 = line2.fromY;

    let m1 = line1.gradient;
    let m2 = line2.gradient;

    //y-y1 = m(x-x1) linear equation manipulation to determine endpoints
    let x = (y2 - y1 + m1*x1 - m2*x2) / (m1 - m2);
    let y = m1*x + y1 - m1*x1;
    console.log(`x : ${x}, y : ${y}`);

    return(new point(x , y));
}

class lineDrawer{
    constructor(canvas, ctx, color){
        //first line endpoint coordinates
        this.fromX = null;
        this.fromY = null;

        //second line endpoint coordinates
        this.toX   = null;
        this.toY   = null;

        this.canvas = canvas;
        this.ctx = ctx;
        this.color = color;

        //a record of all previously drawn lines
        //to enable undoing, and extended line calculations.
        this.lineHistory = [];

        //index of the most recent line we want to display.
        this.currentLine = -1;
    }

    //takes a coordinate, figures out if it's a start or finish point,
    //updates coordinate set accordingly
    pushCoords(x,y){
        if(this.fromX){
            if (this.toX){
                //if we already have both endpoints make space for new line
                this.clearPlan();
                this.fromX = x;
                this.fromY = y
            }
            else{
                //if we just have first endpoint, store as second endpoint
                this.toX = x;
                this.toY = y;
            }
        }
        else{
            //if we have neither endpoint store as first endpoint
            this.fromX = x;
            this.fromY = y;
        }
    }

    //clear all stored endpoint coordinates 
    clearPlan(){
        this.fromX = null;
        this.toX = null;
        this.fromY = null;
        this.toY = null;
    }

    //true iff both endpoint coordinates are known
    readyToDraw(){
        return (this.fromX && this.toX && this.fromY && this.toY);
    }

    //draws a straight line on the canvas between stored endpoint coordinates
    //adds the coordinates to the line history
    drawLine(isNewLine){
        if (this.readyToDraw()){
            if (isNewLine) {
                this.lineHistory.push(new line(this.fromX, this.fromY, this.toX, this.toY));
                this.currentLine += 1;
            }
            this.ctx.strokeStyle = this.color;
            this.ctx.beginPath()
            this.ctx.moveTo(this.fromX, this.fromY);
            this.ctx.lineTo(this.toX, this.toY);
            this.ctx.stroke();
        }
    }

    //draw a line directly from a given line without overriding stored endpoints
    drawGivenLine(l, isNewLine){
            if (isNewLine) {
                this.lineHistory.push(l);
                this.currentLine += 1;
            }
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath()
            this.ctx.moveTo(l.fromX, l.fromY);
            this.ctx.lineTo(l.toX, l.toY);
            this.ctx.stroke();
    }
}



//child class to draw feint lines between deciding endpoints
class lineGuider extends lineDrawer{
    setFrom(x,y){
        this.fromX = x;
        this.fromY = y;
    }

    setTo(x,y){
        this.toX = x;
        this.toY = y;
    }

    //draws a straight line on the canvas between stored endpoint coordinates
    drawLine(){
        clearCanvas(this.canvas);        
        this.ctx.strokeStyle = this.color;
        this.ctx.beginPath()
        this.ctx.moveTo(this.fromX, this.fromY);
        this.ctx.lineTo(this.toX, this.toY);
        this.ctx.stroke();
    }

        //clear all stored endpoint coordinates 
        //AND clears the guide canvas
        clearPlan(){
            this.fromX = null;
            this.toX = null;
            this.fromY = null;
            this.toY = null;
            clearCanvas(this.canvas);
        }

}


//use y - y1 = m(x - x1) function to derive 2 valid points we can use to extend our line
function getExtremeEndpoints(point, m){
    let x1 = point[0];
    let y1 = point[1];


    let point1 = [minW, y1 - (x1 - minW)*m]
    let point2 = [maxW, y1 + (maxW - x1)*m]
    console.log("point1 - x: ", point1[0], " y: ", point1[1]);
    console.log("point2 - x: ", point2[0], " y: ", point2[1]);

    //following conditionals trim points that go beyond our canvas boundaries


    if (point1[1]> maxH){
        point1 = [(maxH - y1)/m + x1, maxH];
        console.log("point1 - x: ", point1[0], " y: ", point1[1]);
    }
    if(point1[1] < minH){
        point1 = [(minH-y1)/m + x1, minH];
        console.log("point1 - x: ", point1[0], " y: ", point1[1]);
    }
    if(point2[1] > maxH){
        point2 = [(maxH - y1)/m + x1, maxH];
        console.log("point2 - x: ", point2[0], " y: ", point2[1]);
    }
    if(point2[1] < minH){
        point2 = [(minH-y1)/m + x1, minH];
        console.log("point2 - x: ", point2[0], " y: ", point2[1]);
    }

    return([Math.floor(point1[0]), Math.floor(point1[1]), Math.floor(point2[0]), Math.floor(point2[1])])
}


//draws density number of radial lines that 
//diverge from a given vanishing point, vp
function drawRadialLines(vp, density, length){

    // let xxxx =  vp.x < 0 ? -1*vp.x : vp.x;
    // let yyyy =  vp.y < 0 ? -1*vp.y : vp.y;
    // if (xxxx > maxW + 1000 || yyyy > maxW + 1000){
    //     density = Math.round(((xxxx - maxW / 5) + (xxxx - maxH / 20)))
    //     console.log(density);
    // }
    let radialDrawer = new lineDrawer(perspectiveCanvas, perspectiveCtx, currentColor);
    increment = FULL_CIRCLE_DEGREES/ density;
    for(let d = 0; d < FULL_CIRCLE_DEGREES; d+= increment){
        let radialEnpointX = vp.x + length * Math.cos(d);
        let radialEnpointY = vp.y + length * Math.sin(d);
        let radialLine = new line(vp.x, vp.y, radialEnpointX, radialEnpointY);
        let m = radialLine.gradient;
        // radialLine = snipLine(radialLine);
        radialDrawer.drawGivenLine(radialLine);
    }
}

function calculateOffset(p1, p2, pmid){
    let a = point.distance(p1, p2);
    let b = point.distance(p1, pmid);
    let c = point.distance(p2, pmid);
    
    let offset = Math.acos( (b*b + c*c - a*a) / (2*b*c) )
    console.log("OFFSET: ", offset);
    return offset;
}

//draw radial lines from given vanishing point, such that a suitable number of lines
//are always visible within the canvas regardless of vanishing point's position
function drawStandardizedRadialLines(vp, density, length){
    let region;

    if(vp.isWithinCanvas()){
        console.log("in canvas");
        //if  vanishing point is visible then
        //radial lines can all be drawn visibly
        return drawRadialLines(vp, density, length);
    }

    //if vanishing point isn't visible calculate the range of angles,
    //a1 <= angles <= a2, in which radial lines can reach canvas
    //and angles are clockwise bearings from vertical/north

    //invisible vps will either be type 1:
        //within the canvas' boundaries in exactly 1 dimension (x xor y)
    //or type 2:
        //outside the canvas in both x and y dimensions (!x and !y)
    // (2.1)(1.1)(2.2)
    // (1.3)( c )(1.3)
    // (2.3)(1.4)(2.4)
    let angles = [0, Math.PI];
    if (vp.isWithinCanvasX() != vp.isWithinCanvasY()){
        //solve all type 1 radiations as a translated instance of type 1.1 radiation
        //feed solver function translated vanishing point as if it were 
        //a type 1.1 problem.
        //our resulting angle range will be rotated by a factor of PI/2 (90deg)
        //to corrrespond with the actual type 1 radiation we are solving.
        if (vp.xTooLow()){
            console.log("LEFT");
           angles = solveType1Radiation(new point(maxH - vp.y, minW - vp.x), new point(minW, minH) ,new point(maxW, minH) ,1.5*Math.PI);
        }
        else if (vp.xTooHigh()){
            console.log("RIGHT");

            angles = solveType1Radiation(new point(vp.y, vp.x - maxW), new point(minW, minH), new point(maxW, minH), 0.5*Math.PI);
        }
        else if(vp.yTooLow()){
            console.log("TOP");

            angles = solveType1Radiation(vp, new point(minW, minH), new point(maxW, minH), 0);
        }
        else if(vp.yTooHigh()){
            console.log("BOTTOM");

            angles = solveType1Radiation(new point(maxW - vp.x, maxH - vp.y), new point(minW, minH), new point(maxW, minH),  Math.PI);
            // angles = solveType1Radiation(vp,  new point(minW, maxH),new point(maxW, maxH), Math.PI);

        }
        else console.log("THIS SHOULD NEVER BE PRINTED");
    }
    else{
        //solve all type 2 radiations as a translated instance of type 2.1 radiation
        //feed solver function translated vanishing point as if it were 
        //a type 2.1 problem.
        //our resulting angle range will be rotated by a factor of PI/2 (90deg)
        //to corrrespond with the actual type 1 radiation we are solving.
        let type = "";
        let translatedVp = vp;
        let offset = 0;
        if (vp.xTooLow()){
            angles = [0, 2 * Math.PI]
            if (vp.yTooLow()){
                //type-2.1
                console.log("TOP-LEFT");
                offset = 0;
                translatedVp = vp;
                type = "TOP-LEFT"
            }
            else{
                //type-2.3
                console.log("BOTTOM-LEFT");
                offset = 1.5 * Math.PI;
                translatedVp = new point(minW - Math.abs(vp.y - maxH), minH - Math.abs(vp.x - minW));
                type = "BOTTOM-LEFT"

            }
        }
        else if (vp.xTooHigh()){
            if (vp.yTooLow()){
                //type-2.2
                console.log("TOP-RIGHT");
                offset = 0.5 * Math.PI;
                translatedVp = new point( minW - Math.abs(vp.y - minH), minH - Math.abs(vp.x - maxW));
                type = "TOP-RIGHT"

                // (1578, -716) doesn't fill canvas

            }
            else{
                //type-2.4
                console.log("BOTTOM-RIGHT");
                offset = Math.PI;
                translatedVp = new point(minW - Math.abs(vp.x - maxW) , minH - Math.abs(vp.y - maxH));
                type = "BOTTOM-RIGHT"

            }
        }
        else{
            console.log("THIS SHOULDN'T BE POSSIBLE")
        }
        //make a traingle between original and translated vanishing points
        //to calculate the offset.

        let midpoint = new point(midW, midH);
        offset = calculateOffset(translatedVp, vp, midpoint);
        if (type === "BOTTOM-LEFT") {
            offset = 2*Math.PI - offset;
            offset = (offset + 1.5*Math.PI) / 2;
        }
        // if (type == "TOP-RIGHT"){
        //     offset = (offset + 0.5*Math.PI) / 2;
        // }
        // if (type === "TOP-RIGHT") offset = Math.PI - offset;
        angles = solveType2Radiation(translatedVp, new point(minW, maxH), new point(maxW, minH), offset);
    }
    console.log(angles);
    let radialDrawer = new lineDrawer(perspectiveCanvas, perspectiveCtx, currentColor);
    //draw density lines between a1 and a2
    let increment = Math.abs(angles[1] - angles[0]) / (density+0.00);
    for(let d = angles[0]; d <= angles[1]; d+= increment){
        let radialEnpointX = vp.x + length * Math.cos(d);
        let radialEnpointY = vp.y + length * Math.sin(d);
        let radialLine = new line(vp.x, vp.y, radialEnpointX, radialEnpointY);
        // radialLine = snipLine(radialLine);
        radialDrawer.drawGivenLine(radialLine);
    }
}

function solveType1Radiation(vp, left, right, offset){
    lvp = point.distance(left ,vp);
    rvp = point.distance(right,vp);
    lr  = point.distance(left, right);

    let alpha, beta;
    alpha = (Math.acos((lvp*lvp + rvp*rvp - lr*lr)/(2*lvp*rvp)));
    beta = (Math.atan(Math.abs(vp.y - right.y)/ Math.abs(vp.x - right.x)));
    let start = (offset + beta)
    let end = (offset + beta + alpha)
    console.log(`from ${beta + offset} to  ${beta + offset + alpha}!`)
    return [start, end];
}


function solveType2Radiation(vp, left, right, offset){
    let c = point.distance(vp, left);
    let b = point.distance(vp, right);
    let a = point.distance(left, right);
    let d = Math.abs( vp.y - right.y );
    let e = Math.abs( vp.x - right.x );
    let alpha, beta;
    alpha = Math.acos( (b*b + c*c - a*a) / (2*b*c) );
    beta  = Math.atan( d/e );

    let start = offset + beta;
    let end   = offset + beta + alpha;
    console.log(`from ${beta + offset} to  ${beta + offset + alpha}!`)
    console.log("ALPHA", alpha);
    return [start,end];


}

//draws a set of uniform lines parallel to given gradient all over the canvas
//represents a vanishing point at infinite distance
drawUniformLines = function(gradient, density, length, isGuide){
    let canv = isGuide ? guideCanvas : perspectiveCanvas
    let uniformDrawer = new lineDrawer(canv, canv.getContext('2d'), currentColor);

    //if its vertical lines we will handle as if we are drawing 
    //from the y axis down
    if (gradient === VERTICAL_GRADIENT){
        let spacing = maxW / density;
        // let initialH = -1 * (minH + Math.sqrt(length*length - maxW * maxW));
        for(let w = 0; w<=maxW; w+=spacing){
            let uniformEndpointX = w;
            let uniformEndpointY = maxH;
            let uniformLine = new line(w,0,uniformEndpointX,uniformEndpointY);
            uniformLine = snipLine(uniformLine);
            uniformDrawer.drawGivenLine(uniformLine);
        }

    }
    else{
        let spacing = maxH / density;


        let initialH = -1 * (minH + Math.sqrt(length*length - maxW * maxW));
        console.log("initial h: ", initialH);
        for(let h = initialH; h<=maxH; h+=spacing){
            let uniformEndpointX = length;
            let uniformEndpointY = h + length * gradient;
            let uniformLine = new line(0,h,uniformEndpointX,uniformEndpointY);
            // uniformLine = snipLine(uniformLine);
            uniformDrawer.drawGivenLine(uniformLine);
        }
    }
}


 function snipLine2(l){
    let m = l.gradient;
    let from = l.from;
    let to = l.to;
    //if both endpoints are within canvas we are fine
    if (from.isWithinCanvas() && to.isWithinCanvas()){
        return l;
    }

    if (m == 0){
        return new line(minW, l.from.y, maxW, l.from.y);
    }

    if (m == VERTICAL_GRADIENT){
        return new line(l.from.x, minH, l.from.x, maxH);
    }
    //if from is out of canvas
    if (!from.isWithinCanvas()){
        //FIND OUT THE TWO EDGES IT INTERSECTS
        //set x to minimum
        let p = l.from;
        validPoints = []
        let potentialPoints = [
            new point (minW, (p.y + (p.x - minW)*m)),
            new point(maxW, (p.y + (maxW - p.x)*m)),
            new point ((p.x + (p.y - minH)/m), minH),
            new point ((p.x + (maxH - p.y)/m), maxH)
        ]
        for (q of potentialPoints){
            console.log(q.toString());
        }
        for (q of potentialPoints){
            if (q.isWithinCanvas()){
                console.log("BASED!", q.toString());
                validPoints.push(q);
            }
        }
        
    }

    return new line(
        validPoints[0].fromX,
        validPoints[0].toX,
        validPoints[1].fromY,
        validPoints[1].toY)


}

//takes a line and returns a new line that 
//fits within the boundaries of the canvas
 function snipLine(l){
    // let m = l.gradient;
    // if (l.toY> maxH){
    //     l.toX = (maxH - l.fromY)/m + l.fromX;
    //     l.toY = (maxH);
    // }
    
    // if(l.toY < minH){
    //     l.toX = (minH - l.fromY)/m + l.fromX;
    //     l.toY = minH;
    // }


    // console.log("line Snipped to:\n", l.toString())
    // return l;
    return snipLine2(l);
}

//extends a line by calculating its gradient
//and using linear extrapolation
function drawFullLine(l){
    let fromX = l.fromX;
    let fromY = l.fromY;
    let toX = l.toX;
    let toY = l.toY;
    console.log(l);
    console.log(`HEYYYYY, x: ${fromX} y: ${fromY} x2: ${toX} y2: ${toY}`)

    let gradient = 0.00 + (toY - fromY) / (toX - fromX);
    let pts = getExtremeEndpoints([toX, toY], gradient);
    // let temp = new lineDrawer(canvas, ctx, "blue");
    console.log(pts)
    // LINE_DRAWER.clearPlan();
    LINE_DRAWER.pushCoords(pts[0], pts[1]);
    LINE_DRAWER.pushCoords(pts[2], pts[3]);
    LINE_DRAWER.drawLine(false);
}

function getVanishingPoint(drawer){
    let cpy= [...drawer.lineHistory];
    if (drawer.lineHistory.length >= 2 && drawer.lineHistory.length % 2 == 0){
        let point = getIntersection(cpy[cpy.length - 1], cpy[cpy.length - 2]);

        return point;
    }
    else{
        VANISHING_POINT_DISPLAY.textContent = (`Draw Second Line.`);
        return new point(0,0);
    }
}


function getMousePosition(event){
    // get canvas' dimensionality and
    // positioning relative to our viewport
    let rect = canvas.getBoundingClientRect();

    let canvasX = rect.x;//px distance between viewport's left edge and canvas' left edge
    let canvasY = rect.y;//px distance between viewport's top edge and canvas' top edge
    // console.log(`x: ${canvasX}, y: ${canvasY}`);

    let mouseX = event.clientX;//perpendicular px distance betweem viewport left edge and mouse
    let mouseY = event.clientY;//perpendicular px distance betweem viewport top edge and mouse
    // console.log(`mouse x: ${mouseX}, mousey: ${mouseY}`);

    let lineEndpointX = mouseX - canvasX;//line endpoints relative to canvas corner
    let lineEndpointY = mouseY - canvasY;

    
    return [lineEndpointX, lineEndpointY];
}


//removes the most recent visible line
//by clearing canvas and redrawing lines from drawer's memory,
//ommitting and forgetting most recent line
function undo(){
    LINE_DRAWER.clearPlan();
    if(LINE_DRAWER.lineHistory.length > 0){
        LINE_DRAWER.currentLine -=1;
        //removes most recent line from memory
        LINE_DRAWER.lineHistory.pop() 
        clearCanvas(canvas);

        //redraw every line from drawer's updated memory one-by-one,
        //oldest first.
        for(let i = 0; i<=LINE_DRAWER.currentLine; i++){
            let l = LINE_DRAWER.lineHistory[i];
            // console.log("line", line);
            LINE_DRAWER.pushCoords(l.fromX,l.fromY);
            LINE_DRAWER.pushCoords(l.toX,l.toY);
            LINE_DRAWER.drawLine(false);
        }

        //get ready to start drawing new lines
        lineStarted = false;
        LINE_GUIDER.clearPlan();
        LINE_DRAWER.clearPlan();
    }
    else{
        window.alert("nothing to undo");
    }
}


//when a file is uploaded update the reference image
const fileInput = document.getElementById("reference-image-input");
fileInput.onchange = function() {
    const selectedFile = fileInput.files[0];
    if (selectedFile){
        let source = URL.createObjectURL(selectedFile);
        referenceImage.src = source;
        referenceImage.onload = function(){
            console.log(
                `w: ${referenceImage.width}
                 h: ${referenceImage.height}
                 `
            )
            let widthRatio = referenceImage.width / perspectiveCanvas.width;
            let heightRatio = referenceImage.height / perspectiveCanvas.height;
            console.log(
                `width ratio: ${widthRatio}
                 height ratio: ${heightRatio}
                 `
            )
            if(widthRatio >1 || heightRatio > 1){
                if (widthRatio > heightRatio){
                    referenceImage.width /= widthRatio;
                }
                else{
                    referenceImage.height /= heightRatio;
                }
            }

        }
    }

}
  

const canvasContainer = document.getElementById("canvas-container");
const canvas = document.getElementById("reference-image-canvas");
const perspectiveCanvas = document.getElementById("perspective-lines-canvas");
const perspectiveCtx = perspectiveCanvas.getContext('2d');
const ctx = canvas.getContext('2d');
const guideCanvas = document.getElementById("guide-canvas");
const guideCtx = guideCanvas.getContext('2d');

const LINE_DRAWER = new lineDrawer(canvas, ctx, "green");
const LINE_GUIDER = new lineGuider(guideCanvas, guideCtx, "red");

const LINE_DENSITY_SLIDER = document.getElementById("line-density-slider");
const LINE_DENSITY_LABEL = document.getElementById("line-density-label");

const DIAGONAL_LINE_SLIDER = document.getElementById("diagonal-line-slider");
const VERTICAL_LINE_SLIDER = document.getElementById("vertical-line-slider");
const HORIZONTAL_LINE_SLIDER = document.getElementById("horizontal-line-slider");
const VANISHING_POINT_DISPLAY = document.getElementById("current-vanishing-point");
let referenceImage = document.getElementById("reference-image");
const HIDE_IMAGE_BUTTON = document.getElementById("hide-image-button");

const colorPicker = document.getElementById("color-picker");//American spelling cause I'm being annoying :)
let currentColor = "green";
const DOWNLOAD_CANVAS_BUTTON = document.getElementById("download-canvas-button");
const VERTICAL_GRADIENT = 100000;
const FULL_CIRCLE_DEGREES = 2 * Math.PI;
const minW = 1;
const maxW = canvas.width - 1;
const minH = 1;
const maxH = canvas.height - 1;
const midW = minW + (maxW - minW) /2;
const midH = minH + (maxH - minH) /2;
let currentVanishingPoint;
let lineDensity = 30;
let lineStarted = false;

// ctx.fillStyle = "rgb(200, 0, 0)";
// ctx.fillRect(10, 10, 50, 50);
// ctx.beginPath()
// ctx.moveTo(75, 50);
// ctx.lineTo(75, 100);
// ctx.stroke();


//adds a new co-ordinate to the drawer's working memory,
//drawing a line if both endpoints are now known.
canvasContainer.addEventListener("mousedown", e => {
    console.log("bottom touched")
    let endpoint = getMousePosition(e);
    LINE_DRAWER.pushCoords(endpoint[0], endpoint[1]);
    if(lineStarted){
        lineStarted = false;
        LINE_DRAWER.drawLine(true);
        LINE_GUIDER.clearPlan();
        drawFullLine(LINE_DRAWER.lineHistory[LINE_DRAWER.currentLine]);
        let vp = getVanishingPoint(LINE_DRAWER);
        if (LINE_DRAWER.lineHistory.length % 2 == 0){
            VANISHING_POINT_DISPLAY.textContent = (`Vanishing Point @ ${vp.toStringRounded()}`);
            
        }
        currentVanishingPoint = vp;

    }
    else{
        lineStarted = true;
        LINE_GUIDER.setFrom(endpoint[0], endpoint[1]);
    }
})

//draw a guide line that follows the mouse
//if one end point is known
guideCanvas.addEventListener("mousemove", e => {
        // console.log("GUIDE MOVES");
        let endpoint = getMousePosition(e);
    
        if(lineStarted){
            LINE_GUIDER.setTo(endpoint[0], endpoint[1]);
            LINE_GUIDER.drawLine();
        }
    }
)

function drawVerticalLines(){
    drawUniformLines(VERTICAL_GRADIENT, lineDensity, maxH, false);
}

function drawHorizontalLines(){
    drawUniformLines(0, lineDensity, maxW, false);
 }


function drawDiagonalLines(){
    clearCanvas(guideCanvas);
    let degree = (DIAGONAL_LINE_SLIDER.value/180) * Math.PI //convert to radians
    let dy = Math.sin(degree);
    let dx = Math.cos(degree);
    let gradient = dx === 0 ? VERTICAL_GRADIENT : dy/dx;
    drawUniformLines(gradient, 30, 1200, false);
    clearCanvas(guideCanvas);
 }

 function generateVanishingLines(){
    if (currentVanishingPoint){
        drawStandardizedRadialLines(currentVanishingPoint, lineDensity, 30000);
        // drawRadialLines(currentVanishingPoint, lineDensity,30000);
        clearCanvas(canvas);
        VANISHING_POINT_DISPLAY.textContent = (`Draw First Line.`);
    }
    else window.alert("locate a vanishing point")


 }

function hideImage(btn){
    if(referenceImage.style.visibility === 'hidden'){
        referenceImage.style.visibility = 'visible';
        btn.textContent = "Hide Image"


    }
    else {
        referenceImage.style.visibility = 'hidden';
        btn.textContent = "Show Image"
    }

 }


 if (DIAGONAL_LINE_SLIDER){
    DIAGONAL_LINE_SLIDER.addEventListener('change', function(){
        clearCanvas(guideCanvas);
        let degree = (DIAGONAL_LINE_SLIDER.value/180) * Math.PI //convert to radians
        let dy = Math.sin(degree);
        let dx = Math.cos(degree);
        let gradient = dx === 0 ? VERTICAL_GRADIENT : dy/dx;
        drawUniformLines(gradient, 30, 1200, true);
     })
 }


 LINE_DENSITY_SLIDER.addEventListener('onload', e => {
    lineDensity = e.target.value;
    LINE_DENSITY_LABEL.textContent = `Line Density: ${lineDensity}`;
})

LINE_DENSITY_SLIDER.addEventListener('change', e => {
    lineDensity = e.target.value;
    LINE_DENSITY_LABEL.textContent = `Line Density: ${lineDensity}`;
})

DOWNLOAD_CANVAS_BUTTON.addEventListener("click",
 function(){
    // let dt = perspectiveCanvas.toDataURL('image/png');
    // document.getElementById("download-canvas-button").href = dt;
    // console.log(dt);
    if (window.navigator.msSaveBlob){
        window.navigator.msSaveBlob(perspectiveCanvas.msToBlob(), "canvas-image.png");
    }
    else{
        const a = document.createElement("a");
        
        document.body.appendChild(a);
        a.href = perspectiveCanvas.toDataURL();
        a.download = "canvas-img.png";
        a.click();
        document.body.removeChild(a);
    }
 })
 

 colorPicker.addEventListener("change", function(){
    currentColor = colorPicker.value;
 })
