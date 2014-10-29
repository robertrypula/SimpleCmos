var MAX_RESISTANCE = 10000;
var MAX_PARTICLES = 5000;
var TRAN_SATURATION = 0.5;
var TRAN_SATURATION_DELTA = 0.1;

var sizeX = 30;
var sizeY = 13;
var sizePix = 40;
var canvasLevelCount = 1;

var toolMode = 0;
var canvasLevelCurrent = 0;

var squaresDb;                        // 3D array with all squares event empty
var squaresDbActive;                  // 1D array with only squares with type!==null
var squaresDbActiveCount;             // == squaresDbActive.length
var squaresDbActiveRandomPairs;       // 1D array with all active squares pairs
var squaresDbActiveRandomPairsCount;  // == squaresDbActiveRandomPairs.length

var squaresDbChanged = true;
var showNumbers = false;



function numberFormat(number, decimals, dec_point, thousands_sep) 
{
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ' ' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
        var k = Math.pow(10, prec);
        return '' + Math.round(n * k) / k;
    };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

function speedTestStart()
{
    return new Date().getTime();
}

function speedTestEnd(ts)
{
    var end = new Date().getTime();
    var time = end - ts;
    
    return time/1000.0;
} 

function setup(_sizeX, _sizeY, _sizePix, _canvasLevelCount)
{
    var cBase = $('#canvas-levels');
    var c;
    var clv, cx, cy, side;
    var clvN, cxN, cyN;
    var i;
    
    sizeX = _sizeX;
    sizeY = _sizeY;
    sizePix = _sizePix;
    canvasLevelCount = _canvasLevelCount;
    
    canvasLevelCurrent = 0;
    toolMode = 0;
    $('#toolbar > a.tool-button').removeClass('active');
    $('#toolbar > a.tool-button[type='+toolMode+']').addClass('active');
    
    
    $('#canvas-level-buttons').html('');
    for (i=0; i<canvasLevelCount; i++) {
        $('#canvas-level-buttons').append('<a href="javascript:void(0)" level="' + i + '" class="tool-button" onClick="setCanvasLevel($(this))">' + i + '</a>');
    }
    $('#canvas-level-buttons > a[level='+canvasLevelCurrent+']').addClass('active');
    
    $('#canvas-levels').html('');
    for (i=(canvasLevelCount-1); i>=0; i--) {
        $('#canvas-levels').append('<div class="canvas canvas' + i + '" level="' + i + '"></div>');
    }
    c = $('#canvas-levels > div.canvas');
    
    if (showNumbers) 
        $('#canvas-levels').addClass('show-numbers'); else
        $('#canvas-levels').removeClass('show-numbers');
    

    cBase.unbind('mousemove');
    cBase.unbind('click');
    cBase.width(sizePix*sizeX);
    cBase.height(sizePix*sizeY);
    c.width(sizePix*sizeX);
    c.height(sizePix*sizeY);
    $('#canvas-hover-box > div.t').width(sizePix);
    $('#canvas-hover-box > div.b').width(sizePix).css('top', (sizePix-1)+'px');
    $('#canvas-hover-box > div.r').height(sizePix).css('left', (sizePix-1)+'px');
    $('#canvas-hover-box > div.l').height(sizePix);
    cBase.bind('mousemove', function(e) {
        var parentOffset = $(this).offset(); 
        var relX = e.pageX - parentOffset.left;
        var relY = e.pageY - parentOffset.top;
        var x, y;

        x = Math.floor(relX / sizePix);
        y = Math.floor(relY / sizePix);

        $('#canvas-hover-box').css('left', (x*sizePix)+'px').css('top', (y*sizePix)+'px');
        squareMouseMove(x, y);
    });
    cBase.bind('click', function(e) {
        var parentOffset = $(this).offset(); 
        var relX = e.pageX - parentOffset.left;
        var relY = e.pageY - parentOffset.top;
        var x, y;

        x = Math.floor(relX / sizePix);
        y = Math.floor(relY / sizePix);

        squareClick(x, y, canvasLevelCurrent, toolMode, parseInt($('#tool-par').val()), parseInt($('#tool-res').val()), 0);
        
        e.preventDefault();
    });

    // assign memory
    squaresDb = new Array();
    for (clv=0; clv<canvasLevelCount; clv++) {
        squaresDb.push(new Array());
        for (cy=0; cy<sizeY; cy++) {
            squaresDb[clv].push(new Array());
            for (cx=0; cx<sizeX; cx++) {
                squaresDb[clv][cy].push({ lv         : clv,
                                          x          : cx,
                                          y          : cy,
                                          type       : null,
                                          state      : null,
                                          lvConn     : null,
                                          par        : null,
                                          res        : null,
                                          top        : null,
                                          right      : null,
                                          bottom     : null,
                                          left       : null,
                                          ceil       : null,
                                          floor      : null,
                                          jQObj      : null
                                        });
            }
        }
    }

    // build references map
    for (clv=0; clv<canvasLevelCount; clv++) {
        for (cy=0; cy<sizeY; cy++) {
            for (cx=0; cx<sizeX; cx++) {
                for (side=0; side<6; side++) {
                    switch (side) {
                        case 0: clvN = clv;
                                cxN = cx;
                                cyN = (cy - 1)<0 ? null : (cy - 1);
                                if (clvN!==null && cxN!==null && cyN!==null)
                                    squaresDb[clv][cy][cx].top  = squaresDb[clvN][cyN][cxN];
                                break;
                        case 1: clvN = clv;
                                cxN = (cx + 1)>=sizeX ? null : (cx + 1);
                                cyN = cy;
                                if (clvN!==null && cxN!==null && cyN!==null)
                                    squaresDb[clv][cy][cx].right  = squaresDb[clvN][cyN][cxN];
                                break;
                        case 2: clvN = clv;
                                cxN = cx
                                cyN = (cy + 1)>=sizeY ? null : (cy + 1);
                                if (clvN!==null && cxN!==null && cyN!==null)
                                    squaresDb[clv][cy][cx].bottom  = squaresDb[clvN][cyN][cxN];
                                break;
                        case 3: clvN = clv;
                                cxN = (cx - 1)<0 ? null : (cx - 1);
                                cyN = cy;
                                if (clvN!==null && cxN!==null && cyN!==null)
                                    squaresDb[clv][cy][cx].left  = squaresDb[clvN][cyN][cxN];
                                break;
                        case 4: clvN = (clv-1)<0 ? null : (clv-1);
                                cxN = cx;
                                cyN = cy;
                                if (clvN!==null && cxN!==null && cyN!==null)
                                    squaresDb[clv][cy][cx].top  = squaresDb[clvN][cyN][cxN];
                                break;
                        case 5: clvN = (clv+1)>=canvasLevelCount ? null : (clv+1);
                                cxN = cx;
                                cyN = cy;
                                if (clvN!==null && cxN!==null && cyN!==null)
                                    squaresDb[clv][cy][cx].floor  = squaresDb[clvN][cyN][cxN];
                                break;
                    }
                }
            }
        }
    }

    squaresDbActive = new Array();
    squaresDbActiveCount = 0;
}

function toolButtonClick(obj)
{
    $('#toolbar > a').removeClass('active');
    obj.addClass('active');
    toolMode = parseInt(obj.attr('type'));
}

function squareMouseMove(x, y)
{
    var sq = squaresDb[canvasLevelCurrent][y][x];

    return;
    var res  = parseInt(obj.find('> i').html());
    var par  = parseInt(obj.find('> b').html());

    res = res ? res : '-';
    par = par ? par : '-';

    $('#info-type').html( type );
    $('#info-res').html( res + (res!='-' ? ' ('+Math.round(100.0*res/MAX_RESISTANCE)+'%)' : '') );
    $('#info-par').html( par + (par!='-' ? ' ('+Math.round(100.0*par/MAX_PARTICLES)+'%)' : '') );
}

function squareInHtmlCreate(sq)
{
    var jQObj;
    
    if (sq.type===null)
        return;
    if (sq.jQObj)
        squareInHtmlDelete(sq);
    
    jQObj = $('<a href="javascript:void(0)" style="width: '+(sizePix-1)+'px; height: '+(sizePix-1)+'px; top: '+(sq.y*sizePix)+'px; left: '+(sq.x*sizePix)+'px;"></a>');
    jQObj.append('<span class="par" style="opacity: '+sq.par/MAX_PARTICLES+'">&nbsp;</span>');
    jQObj.append('<span class="res" style="opacity: '+sq.res/MAX_RESISTANCE+'">&nbsp;</span>');
    
    
    if (showNumbers) {
        jQObj.find('> span.res').html(sq.res);
        jQObj.find('> span.par').html(sq.par);
    }
    
    switch (sq.type) {
        case 1: jQObj.addClass('type'+sq.type);
                break;
        case 2: jQObj.addClass('type'+sq.type);
                break;
        case 3: jQObj.addClass('type'+sq.type);
                break;
        case 4: jQObj.addClass('type'+sq.type);
                break;
        case 5: jQObj.addClass('type'+sq.type); 
                break;
        case 6: jQObj.addClass('type'+sq.type);
                jQObj.append('<span class="state state'+sq.state+'">&nbsp;</span>');
                break;
    }
    
    $('#canvas-levels > div.canvas'+sq.lv).append(jQObj);
    sq.jQObj = jQObj;
}

function squareInHtmlUpdate(sq)
{
    if (sq.type===null)
        return;
    
    if (!sq.jQObj)
        return;
    
    sq.jQObj.find('> span.res').css('opacity', sq.res/MAX_RESISTANCE);
    sq.jQObj.find('> span.par').css('opacity', sq.par/MAX_PARTICLES);
    
    if (showNumbers) {
        sq.jQObj.find('> span.res').html(sq.res);
        sq.jQObj.find('> span.par').html(sq.par);
    }
    
    if (sq.type==6)
        sq.jQObj.find('> span.state').removeClass('state0').removeClass('state1').addClass('state'+sq.state);
}

function squareInHtmlDelete(sq)
{
    if (sq.jQObj)
        sq.jQObj.remove();
    sq.jQObj = null;
}

function squareClick(cX, cY, cLv, type, par, res, state, forceMore)
{
    var sq = squaresDb[cLv][cY][cX];
    var inForceMode;
    
    
    if (typeof forceMore === "undefined") 
        inForceMode = false; else
        inForceMode = forceMore ? true : false;


    if (type==7) {

        // toogle internal state
        if (sq.type==6) {
            sq.state = (sq.state + 1) % 2;
            squareInHtmlUpdate(sq);
        }

    } else {
        
        // reset DB and jquery object
        sq.type   = null;
        sq.state  = null;
        sq.lvConn = null;
        sq.par    = null;
        sq.res    = null;
        squareInHtmlDelete(sq);
        
        switch (type) {
            case 1: sq.type = type;
                    sq.par = par;
                    sq.res = res;
                    break;
            case 2: sq.type = type;
                    sq.par = (!inForceMode) ? Math.round(0.5*MAX_PARTICLES) : par;
                    sq.res = (!inForceMode) ? MAX_RESISTANCE : res;
                    break;
            case 3: sq.type = type;
                    sq.par = (!inForceMode) ? Math.round(0.5*MAX_PARTICLES) : par;
                    sq.res = (!inForceMode) ? 1 : res;
                    break;
            case 4: sq.type = type;
                    sq.par = MAX_PARTICLES;
                    sq.res = 1;
                    break;
            case 5: sq.type = type;
                    sq.par = 0;
                    sq.res = 1;
                    break;
            case 6: sq.type = type;
                    sq.par = (!inForceMode) ? Math.round(0.5*MAX_PARTICLES) : par;
                    sq.res = (!inForceMode) ? 1 : res;
                    sq.state = state;
                    break;
        }
        
        squareInHtmlCreate(sq);
        squaresDbChanged = true;
    }
    
}

function shuffleArray(arr, arrCount)
{
    var firstIndex, secondIndex;
    var maxIndex = arrCount - 1;
    var tmp, i;
    
    for (i=0; i<3*arrCount; i++) {
        firstIndex = Math.floor(Math.random()*(maxIndex +1));
        secondIndex = Math.floor(Math.random()*(maxIndex +1));
        
        tmp = arr[firstIndex];
        arr[firstIndex] = arr[secondIndex];
        arr[secondIndex] = tmp;
    }
}

function updateActiveSquaresArray()
{
    var sq;
    var clv, cx, cy;
    var i, side;
    
    squaresDbActive = new Array();
    squaresDbActiveCount = 0;

    for (clv=0; clv<canvasLevelCount; clv++)
        for (cy=0; cy<sizeY; cy++)
            for (cx=0; cx<sizeX; cx++) {
                sq = squaresDb[clv][cy][cx];
                
                if (sq.type) {
                    squaresDbActive.push(sq);
                    squaresDbActiveCount++;
                }
            }
            
    
    // build random square pair array
    squaresDbActiveRandomPairs = new Array();
    squaresDbActiveRandomPairsCount = 0;
    for (i=0; i<squaresDbActiveCount; i++) {
        sq = squaresDbActive[i];
        for (side=0; side<4; side++)
            switch (side) {
                case 0: if (sq.top!==null && sq.top.type) {
                            squaresDbActiveRandomPairs.push({randSqIndex: i, randSide: side});
                            squaresDbActiveRandomPairsCount++;
                        }
                        break;
                case 1: if (sq.right!==null && sq.right.type) {
                            squaresDbActiveRandomPairs.push({randSqIndex: i, randSide: side});
                            squaresDbActiveRandomPairsCount++;
                        }
                        break;
                case 2: if (sq.bottom!==null && sq.bottom.type) {
                            squaresDbActiveRandomPairs.push({randSqIndex: i, randSide: side});
                            squaresDbActiveRandomPairsCount++;
                        }
                        break;
                case 3: if (sq.left!==null && sq.left.type) {
                            squaresDbActiveRandomPairs.push({randSqIndex: i, randSide: side});
                            squaresDbActiveRandomPairsCount++;
                        }
                        break;
            }
    }
   
    shuffleArray(squaresDbActiveRandomPairs, squaresDbActiveRandomPairsCount);
    
    squaresDbChanged = false;
}

function simulateTwoSquares(sq1, sq2, side)
{
    var R1, R2, P1, P2;
    var pDiff;
    var R12;
    var particlesToMove;
    var computeCurrent = true;
    var isSq1Tran = false, isSq2Tran = false;
    var transistorMode = false;
    var transType, tranSquare, gateSquare;
    var gateParticles;
    var gateFactor, tranFactor;
    var tranResistance;
    var isSq1Switch, isSq2Switch;
    var state;


    // check is one from pair is transistor
    isSq1Tran = (sq1.type==2 || sq1.type==3) ? sq1.type : false;
    isSq2Tran = (sq2.type==2 || sq2.type==3) ? sq2.type : false;

    if ((isSq1Tran!==false && isSq2Tran===false) || (isSq1Tran===false && isSq2Tran!==false))
        if (isSq1Tran!=false) {
            // sq1 is transistor
            if (side==3) {
                transistorMode = true;
                transType = isSq1Tran;
                tranSquare = sq1;
                gateSquare = sq2;
                computeCurrent = false;
            } else
                if (side==1)
                    computeCurrent = false;

        } else {
            // sq2 is transistor
            if (side==1) {
                transistorMode = true;
                transType = isSq2Tran;
                tranSquare = sq2;
                gateSquare = sq1;
                computeCurrent = false;
            } else
                if (side==3)
                    computeCurrent = false;
        }

    // change transistor resistance
    if (transistorMode) {
        gateParticles = gateSquare.par;
        gateFactor = gateParticles / MAX_PARTICLES;
        gateFactor = gateFactor > 1.0 ? 1.0 : gateFactor;
        gateFactor = gateFactor < 0.0 ? 0.0 : gateFactor;
        switch (transType) {
            case 2: tranFactor = gateFactorToTransistorFactorType2(gateFactor); break;
            case 3: tranFactor = gateFactorToTransistorFactorType3(gateFactor); break;
        }

        tranResistance = 1 + (tranFactor * (MAX_RESISTANCE-1));
        tranResistance = Math.round(tranResistance);

        tranSquare.res = tranResistance;
    }


    // check is one from pair is switch
    isSq1Switch = (sq1.type==6) ? sq1.type : false;
    isSq2Switch = (sq2.type==6) ? sq2.type : false;
    if ((isSq1Switch!==false && isSq2Switch===false) || (isSq1Switch===false && isSq2Switch!==false))
        if (isSq1Switch!=false) {
            // sq1 is switch
            state = sq1.state;
            if ((side==2 && state==1) || (side==0 && state==0)) {
                computeCurrent = false;
            }
        } else {
            // sq2 is switch
            state = sq2.state;
            if ((side==2 && state==0) || (side==0 && state==1)) {
                computeCurrent = false;
            }
        }
    
    // compute current between squares
    if (computeCurrent) {

        P1 = sq1.par;
        P2 = sq2.par;
        R1 = sq1.res;
        R2 = sq2.res;

        R12 = R1 + R2;
        pDiff = P2 - P1;
        particlesToMove = Math.round( pDiff / R12 );
        /*
        if (particlesToMove==0 && Math.abs(pDiff)>0) {
            if (Math.random()>0.9)
                particlesToMove = (Math.random()>0.5) ? 1 : -1;
        }
        */

        P1 = P1 + particlesToMove;
        P2 = P2 - particlesToMove;

        if (P1<0) {
            P2 = P2 - P1;
            P1 = 0;
        }
        if (P2<0) {
            P1 = P1 - P2;
            P2 = 0;
        }

        // check if its power and restore power state
        if (sq1.type==4)
            P1 = MAX_PARTICLES;
        if (sq1.type==5)
            P1 = 0;
        if (sq2.type==4)
            P2 = MAX_PARTICLES;
        if (sq2.type==5)
            P2 = 0;
        

        sq1.par = P1;
        sq2.par = P2;
    }
}

function gateFactorToTransistorFactorType2(gateFactor)
{
    var tranFactor, x;

    if (gateFactor<=(TRAN_SATURATION-TRAN_SATURATION_DELTA)) {
        tranFactor = 1.0;
    } else
        if (gateFactor>=(TRAN_SATURATION+TRAN_SATURATION_DELTA)) {
            tranFactor = 0.0;
        } else {
            x = (gateFactor - (TRAN_SATURATION-TRAN_SATURATION_DELTA)) / (2*TRAN_SATURATION_DELTA);
            tranFactor = -0.5*(Math.sin(x*(Math.PI) - 0.5*Math.PI) + 1.0) + 1;
        }

    return tranFactor;
}

function gateFactorToTransistorFactorType3(gateFactor)
{
    var tranFactor, x;

    if (gateFactor<=(TRAN_SATURATION-TRAN_SATURATION_DELTA)) {
        tranFactor = 0.0;
    } else
        if (gateFactor>=(TRAN_SATURATION+TRAN_SATURATION_DELTA)) {
            tranFactor = 1.0;
        } else {
            x = (gateFactor - (TRAN_SATURATION-TRAN_SATURATION_DELTA)) / (2*TRAN_SATURATION_DELTA);
            tranFactor = 0.5*(Math.sin(x*(Math.PI) - 0.5*Math.PI) + 1.0);
        }

    return tranFactor;
}

function simulationLoop()
{
    var simActive = $('#sim-active').is(':checked');
    var simLoopsInFrame = parseInt($('#sim-loops-in-frame').val());
    var simFps = parseFloat($('#sim-fps').val());
    var i, j, side;
    var tmp;
    var sq;
    var timeFrame = 1.0/simFps;
    var timeAll;
    var timeSim;
    var timeSimOneLoop;
    var timeRender;
    var iddleInfo, iddleDiff;

    simLoopsInFrame = simLoopsInFrame>0 ? simLoopsInFrame : 1;

    // update one dimensional array
    if (simActive && squaresDbChanged)
        updateActiveSquaresArray();
    
    $('#sim-info-box').html('');

    // if there is something to simulate
    if (simActive && squaresDbActiveCount>0) {

        timeAll = speedTestStart();

        // generate pair to simulate
        timeSim = speedTestStart();
        for (j=0; j<simLoopsInFrame; j++) {
            shuffleArray(squaresDbActiveRandomPairs, squaresDbActiveRandomPairsCount);
            for (i=0; i<squaresDbActiveRandomPairsCount; i++) {
                tmp = squaresDbActiveRandomPairs[i];
                sq = squaresDbActive[tmp.randSqIndex];
                side = tmp.randSide;

                switch (side) {
                    case 0: simulateTwoSquares(sq, sq.top, side);      break;
                    case 1: simulateTwoSquares(sq, sq.right, side);    break;
                    case 2: simulateTwoSquares(sq, sq.bottom, side);   break;
                    case 3: simulateTwoSquares(sq, sq.left, side);     break;
                }
            }
        }
        timeSim = speedTestEnd(timeSim);
        timeSimOneLoop = timeSim / simLoopsInFrame;
        
        // update html
        timeRender = speedTestStart();
        for (i=0; i<squaresDbActiveCount; i++) {
            sq = squaresDbActive[i];          
            squareInHtmlUpdate(sq);
        }
        timeRender = speedTestEnd(timeRender);
        
        timeAll = speedTestEnd(timeAll);
        
        timeFrame = timeFrame < 0.002 ? 0.002 : timeFrame;
        timeAll = timeAll < 0.002 ? 0.002 : timeAll;
        timeSim = timeSim < 0.002 ? 0.002 : timeSim;
        timeSimOneLoop = timeSimOneLoop < 0.002 ? 0.002 : timeSimOneLoop;
        timeRender = timeRender < 0.002 ? 0.002 : timeRender;
        
        iddleDiff = timeFrame - timeAll;
        iddleInfo = (iddleDiff>0) ? (' iddle ' + numberFormat(iddleDiff, 3) + 'sek (' + numberFormat(((iddleDiff/timeFrame)*100.0), 1) + '%)' + '<br/>') : (' no iddle' + '<br/>');
        $('#sim-info-box').html('timeFrame&nbsp;&nbsp;: ' + numberFormat(timeFrame, 3) + 'sek (' + numberFormat(1.0/timeFrame, 1) + 'fps) ' + iddleInfo +
                                'timeAll&nbsp;&nbsp;&nbsp;&nbsp;: ' + numberFormat(timeAll, 3) + 'sek (' + numberFormat(1.0/timeAll, 1) + 'fps) ' + '<br/>' +
                                'timeSim&nbsp;&nbsp;&nbsp;&nbsp;: ' + numberFormat(timeSim, 3) + 'sek (' + numberFormat(1.0/timeSim, 1) + 'fps) ' + '<br/>' +
                                //'timeSimOneLoop: ' + numberFormat(timeSimOneLoop, 3) + ' (' + numberFormat(1.0/timeSimOneLoop, 1) + 'fps) ' + '<br/>' +
                                'timeRender&nbsp;: ' + numberFormat(timeRender, 3) + 'sek (' + numberFormat(1.0/timeRender, 1) + 'fps)'
                               );
    }
   
    setTimeout("simulationLoop()", 1000.0/simFps);
}

function saveScene()
{
    var sq, i;
    var saveArray = { sizeX            : sizeX,
                      sizeY            : sizeY,
                      sizePix          : sizePix,
                      canvasLevelCount : canvasLevelCount,
                      project          : new Array()
                    };
                    
                    
    updateActiveSquaresArray();
    for (i=0; i<squaresDbActiveCount; i++) {
        sq = squaresDbActive[i];     
        
        saveArray.project.push({ x      : sq.x,
                                 y      : sq.y,
                                 lv     : sq.lv,
                                 type   : sq.type,
                                 state  : sq.state,
                                 lvConn : sq.lvConn,
                                 par    : sq.par,
                                 res    : sq.res
                               });
    }

    $('#saved').val(JSON.stringify(saveArray));
}

function loadScene()
{
    var saveArray = JSON.parse($('#saved').val());
    var i, sq;
    
    // rebuild canvas
    $('#squares-count-x').val(saveArray.sizeX);
    $('#squares-count-y').val(saveArray.sizeY);
    $('#squares-size-pix').val(saveArray.sizePix);
    $('#canvas-levels-count').val(saveArray.canvasLevelCount);
    newScene();
    
    for (i=0; i<saveArray.project.length; i++) {
        sq = saveArray.project[i];    
        
        squareClick(parseInt(sq.x), 
                    parseInt(sq.y), 
                    parseInt(sq.lv), 
                    parseInt(sq.type), 
                    parseInt(sq.par), 
                    parseInt(sq.res), 
                    sq.state, 
                    true);
    }

    squaresDbChanged = true;
}

function newScene()
{
    var sX = parseInt($('#squares-count-x').val());
    var sY = parseInt($('#squares-count-y').val());
    var sPix = parseInt($('#squares-size-pix').val());
    var cLvCount = parseInt($('#canvas-levels-count').val());
    
    setup(sX, sY, sPix, cLvCount);
}

function setCanvasLevel(obj)
{
    var level = parseInt(obj.attr('level'));
    var canvas;
    var i;
    
    $('#canvas-level-buttons > a').removeClass('active');
    obj.addClass('active');
    canvasLevelCurrent = level;
    
    for (i=(canvasLevelCount-1); i>=0; i--) {
        canvas = $('#canvas-levels > div.canvas'+i);
        $('#canvas-levels').append(canvas);
    }
    
    $('#canvas-levels > div.canvas').removeClass('active');
    $('#canvas-levels > div.canvas').addClass('inactive');

    canvas = $('#canvas-levels > div.canvas'+canvasLevelCurrent);
    canvas.addClass('active').removeClass('inactive');
    $('#canvas-levels').append(canvas);
}

function setCanvasOpacity(obj)
{
    if (obj.is(':checked'))
        $('#canvas-levels').addClass('transparent'); else
        $('#canvas-levels').removeClass('transparent');
}


$(document).ready(function() {

    $('#squares-count-x').val(sizeX);
    $('#squares-count-y').val(sizeY);
    $('#squares-size-pix').val(sizePix);
    $('#canvas-levels-count').val(canvasLevelCount);
    $('#tool-par').val(Math.round(0.5*MAX_PARTICLES));
            
    setup(sizeX, sizeY, sizePix, canvasLevelCount);
    setTimeout("simulationLoop()", 1000.0/parseFloat($('#sim-fps').val()));
});