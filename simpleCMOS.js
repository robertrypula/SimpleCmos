var MAX_RESISTANCE = 10000;
var MAX_PARTICLES = 5000;
var TRAN_SATURATION = 0.5;
var TRAN_SATURATION_DELTA = 0.1;
var sizeX = 4;
var sizeY = 3;
var sizePix = 40;
var toolMode = 0;
var canvasLevelCurrent = 0;
var canvasLevelCount = 2;
var activeSquares = new Array();
var activeSquaresIndexes = new Array();
var activeSquaresCount = 0;
var squareSides = new Array();
var sceneChanged = true;
var squaresDb;

function shuffle(inputArr)
{
    var valArr = [],
    k = '',
    i = 0,
    strictForIn = false,
    populateArr = [];

    for (k in inputArr) { // Get key and value arrays
        if (inputArr.hasOwnProperty(k)) {
            valArr.push(inputArr[k]);
            if (strictForIn) {
                delete inputArr[k];
            }
        }
    }
    valArr.sort(function () {
        return 0.5 - Math.random();
    });

    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js.ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;

    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
        populateArr[i] = valArr[i];
    }

    return strictForIn || populateArr;
}

function setup()
{
    var cBase = $('#canvas-levels');
    var c = $('#canvas-levels > div.canvas');
    var clv, cx, cy, side;
    var clvN, cxN, cyN;

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

        squareClick(x, y);
    });

    // assign memory
    squaresDb = new Array();
    for (clv=0; clv<canvasLevelCount; clv++) {
        squaresDb.push(new Array());
        for (cy=0; cy<sizeY; cy++) {
            squaresDb[clv].push(new Array());
            for (cx=0; cx<sizeX; cx++) {
                squaresDb[clv][cy].push({ lv     : clv,
                                          x      : cx,
                                          y      : cy,
                                          type   : null,
                                          state  : null,
                                          lvConn : null,
                                          par    : null,
                                          res    : null,
                                          parNew : null,
                                          resNew : null,
                                          top    : null,
                                          right  : null,
                                          bottom : null,
                                          left   : null,
                                          ceil   : null,
                                          floor  : null,
                                          jQObj  : null
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

    squareSides.push(0);
    squareSides.push(1);
    squareSides.push(2);
    squareSides.push(3);

    $('#tool-par').val(Math.round(0.5*MAX_PARTICLES));
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
//    console.log(sq);
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
//                squaresDb[clv][cy].push({ lv     : clv,
//                                          x      : cx,
//                                          y      : cy,
//                                          type   : null,
//                                          state  : null,
//                                          lvConn : null,
//                                          par    : null,
//                                          res    : null,
    if (sq.type===null)
        return;
    if (sq.jQObj)
        squareInHtmlDelete(sq);
    

    jQObj = $('<a href="javascript:void(0)"></a>');
    
    switch (toolMode) {
        case 0: 
                break;
        case 1: obj.addClass('type'+toolMode).addClass('active');
                obj.attr('type', type);
                obj.append('<b>'+toolPar+'</b>').
                    append('<i>'+toolRes+'</i>');
                obj.find('> b').css('opacity', toolPar/MAX_PARTICLES); 
                obj.find('> i').css('opacity', toolRes/MAX_RESISTANCE); 
                break;
        case 2: obj.addClass('type'+toolMode).addClass('active');
                obj.attr('type', toolMode);
                obj.append('<b>'+toolPar+'</b>').
                    append('<i>'+MAX_RESISTANCE+'</i>');
                obj.find('> b').css('opacity', toolPar/MAX_PARTICLES); 
                obj.find('> i').css('opacity', MAX_RESISTANCE/MAX_RESISTANCE); 
                break;
        case 3: obj.addClass('type'+toolMode).addClass('active');
                obj.attr('type', toolMode);
                obj.append('<b>'+toolPar+'</b>').
                    append('<i>'+1+'</i>');
                obj.find('> b').css('opacity', toolPar/MAX_PARTICLES); 
                obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                break;
        case 4: obj.addClass('type'+toolMode).addClass('active');
                obj.attr('type', toolMode);
                obj.append('<b>'+MAX_PARTICLES+'</b>').
                    append('<i>'+1+'</i>');
                obj.find('> b').css('opacity', MAX_PARTICLES/MAX_PARTICLES); 
                obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                break;
        case 5: obj.addClass('type'+toolMode).addClass('active');
                obj.attr('type', toolMode);
                obj.append('<b>'+0+'</b>').
                    append('<i>'+1+'</i>');
                obj.find('> b').css('opacity', 0/MAX_PARTICLES); 
                obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                break;
        case 6: obj.addClass('type'+toolMode).addClass('active');
                obj.attr('type', toolMode);
                obj.attr('state', 0);
                obj.append('<b>'+Math.round(0.5*MAX_PARTICLES)+'</b>').
                    append('<i>'+1+'</i>');
                obj.find('> b').css('opacity', 0.5*MAX_PARTICLES); 
                obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                break;
    }
}

function squareInHtmlUpdate(sq)
{
    sq.jQObj;
}

function squareInHtmlDelete(sq)
{
    sq.jQObj.remove();
    sq.jQObj = null;
}

function squareClick(x, y)
{
    var sq = squaresDb[canvasLevelCurrent][y][x];
    console.log(sq);
    return;
    var toolRes = $('#tool-res').val();
    var toolPar = $('#tool-par').val();



    if (toolMode==7) {

        // toogle internal state
        if (parseInt(obj.attr('type'))==6) {
            state = parseInt(obj.attr('state'));
            state = (state + 1) % 2;
            obj.attr('state', state);
        }

    } else {

        // clear square


        switch (toolMode) {
            case 0: 
                    break;
            case 1: obj.addClass('type'+toolMode).addClass('active');
                    obj.attr('type', type);
                    obj.append('<b>'+toolPar+'</b>').
                        append('<i>'+toolRes+'</i>');
                    obj.find('> b').css('opacity', toolPar/MAX_PARTICLES); 
                    obj.find('> i').css('opacity', toolRes/MAX_RESISTANCE); 
                    break;
            case 2: obj.addClass('type'+toolMode).addClass('active');
                    obj.attr('type', toolMode);
                    obj.append('<b>'+toolPar+'</b>').
                        append('<i>'+MAX_RESISTANCE+'</i>');
                    obj.find('> b').css('opacity', toolPar/MAX_PARTICLES); 
                    obj.find('> i').css('opacity', MAX_RESISTANCE/MAX_RESISTANCE); 
                    break;
            case 3: obj.addClass('type'+toolMode).addClass('active');
                    obj.attr('type', toolMode);
                    obj.append('<b>'+toolPar+'</b>').
                        append('<i>'+1+'</i>');
                    obj.find('> b').css('opacity', toolPar/MAX_PARTICLES); 
                    obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                    break;
            case 4: obj.addClass('type'+toolMode).addClass('active');
                    obj.attr('type', toolMode);
                    obj.append('<b>'+MAX_PARTICLES+'</b>').
                        append('<i>'+1+'</i>');
                    obj.find('> b').css('opacity', MAX_PARTICLES/MAX_PARTICLES); 
                    obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                    break;
            case 5: obj.addClass('type'+toolMode).addClass('active');
                    obj.attr('type', toolMode);
                    obj.append('<b>'+0+'</b>').
                        append('<i>'+1+'</i>');
                    obj.find('> b').css('opacity', 0/MAX_PARTICLES); 
                    obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                    break;
            case 6: obj.addClass('type'+toolMode).addClass('active');
                    obj.attr('type', toolMode);
                    obj.attr('state', 0);
                    obj.append('<b>'+Math.round(0.5*MAX_PARTICLES)+'</b>').
                        append('<i>'+1+'</i>');
                    obj.find('> b').css('opacity', 0.5*MAX_PARTICLES); 
                    obj.find('> i').css('opacity', 1/MAX_RESISTANCE); 
                    break;
        }
    }

    sceneChanged = true;
}

function updateScene()
{
    var sq, _x, _y;

    activeSquares = new Array();
    activeSquaresIndexes = new Array();
    activeSquaresCount = 0;
    $('#canvas > a.active').each(function() {
        _x = parseInt($(this).attr('x'));
        _y = parseInt($(this).attr('y'));

        sq = { obj    : $(this),
               x      : _x,
               y      : _y,
               left   : (($('#canvas > #sq-'+(_x-1)+'-'+_y+'.active').size()==1) ? $('#canvas > #sq-'+(_x-1)+'-'+_y+'.active') : null),
               right  : (($('#canvas > #sq-'+(_x+1)+'-'+_y+'.active').size()==1) ? $('#canvas > #sq-'+(_x+1)+'-'+_y+'.active') : null),
               top    : (($('#canvas > #sq-'+_x+'-'+(_y-1)+'.active').size()==1) ? $('#canvas > #sq-'+_x+'-'+(_y-1)+'.active') : null),
               bottom : (($('#canvas > #sq-'+_x+'-'+(_y+1)+'.active').size()==1) ? $('#canvas > #sq-'+_x+'-'+(_y+1)+'.active') : null)
             };

        activeSquares.push(sq);
        activeSquaresIndexes.push(activeSquaresCount);
        activeSquaresCount++;
    });

    console.log('updated');
    sceneChanged = false;
}

function simulateTwoSquares(sq1, sq2, side)
{
    var sq1Type, sq2Type;
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
    isSq1Tran = sq1.attr('type') ? parseInt(sq1.attr('type')) : false;
    isSq2Tran = sq2.attr('type') ? parseInt(sq2.attr('type')) : false;
    isSq1Tran = (isSq1Tran==2 || isSq1Tran==3) ? isSq1Tran : false;
    isSq2Tran = (isSq2Tran==2 || isSq2Tran==3) ? isSq2Tran : false;

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
        gateParticles = parseInt(gateSquare.find('> b').html());
        gateFactor = gateParticles / MAX_PARTICLES;
        gateFactor = gateFactor > 1.0 ? 1.0 : gateFactor;
        gateFactor = gateFactor < 0.0 ? 0.0 : gateFactor;
        switch (transType) {
            case 2: tranFactor = gateFactorToTransistorFactorType2(gateFactor); break;
            case 3: tranFactor = gateFactorToTransistorFactorType3(gateFactor); break;
        }

        tranResistance = 1 + (tranFactor * (MAX_RESISTANCE-1));
        tranResistance = Math.round(tranResistance);

        tranSquare.find('> i').html(tranResistance).css('opacity', (tranResistance/MAX_RESISTANCE));
    }


    // check is one from pair is switch
    isSq1Switch = sq1.attr('type') ? parseInt(sq1.attr('type')) : false;
    isSq2Switch = sq2.attr('type') ? parseInt(sq2.attr('type')) : false;
    isSq1Switch = (isSq1Switch==6) ? isSq1Switch : false;
    isSq2Switch = (isSq2Switch==6) ? isSq2Switch : false;
    if ((isSq1Switch!==false && isSq2Switch===false) || (isSq1Switch===false && isSq2Switch!==false))
        if (isSq1Switch!=false) {
            // sq1 is switch
            state = parseInt(sq1.attr('state'));
            if ((side==2 && state==1) || (side==0 && state==0)) {
                computeCurrent = false;
            }
        } else {
            // sq2 is switch
            state = parseInt(sq2.attr('state'));
            if ((side==2 && state==0) || (side==0 && state==1)) {
                computeCurrent = false;
            }
        }

    // compute current between squares
    if (computeCurrent) {

        sq1Type = parseInt(sq1.attr('type'));
        sq2Type = parseInt(sq2.attr('type'));

        P1 = parseInt(sq1.find('> b').html());
        P2 = parseInt(sq2.find('> b').html());
        R1 = parseInt(sq1.find('> i').html());
        R2 = parseInt(sq2.find('> i').html());

        R12 = R1 + R2;
        pDiff = P2 - P1;
        particlesToMove = Math.round( pDiff / R12 );
        if (particlesToMove==0 && Math.abs(pDiff)>0) {
            if (Math.random()>0.9)
                particlesToMove = (Math.random()>0.5) ? 1 : -1;
        }

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
        if (sq1Type==4)
            P1 = MAX_PARTICLES;
        if (sq1Type==5)
            P1 = 0;
        if (sq2Type==4)
            P2 = MAX_PARTICLES;
        if (sq2Type==5)
            P2 = 0;

        sq1.find('> b').html(P1).css('opacity', P1/MAX_PARTICLES); 
        sq2.find('> b').html(P2).css('opacity', P2/MAX_PARTICLES);

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
    var i, j, sqRandIdx, sideRandIdx;
    var sq;

    if ($('#sim-active').is(':checked') && sceneChanged) {
        updateScene();
    }

    if ($('#sim-active').is(':checked') && activeSquaresCount>0) {

        activeSquaresIndexes = shuffle(activeSquaresIndexes);
        for (i=0; i<activeSquaresCount; i++) {
            sqRandIdx = activeSquaresIndexes[i];
            squareSides = shuffle(squareSides);
            for (j=0; j<4; j++) {
                sideRandIdx = squareSides[j];


//                            // A->B is the same as B->A
//                            if (sideRandIdx>=2)
//                                continue;

                sq = activeSquares[sqRandIdx];

                switch (sideRandIdx) {
                    case 0: if (sq.top!==null) {
                                simulateTwoSquares(sq.obj, sq.top, sideRandIdx);
                            }
                            break;
                    case 1: if (sq.right!==null) { 
                                simulateTwoSquares(sq.obj, sq.right, sideRandIdx);
                            }
                            break;
                    case 2: if (sq.bottom!==null) {
                                simulateTwoSquares(sq.obj, sq.bottom, sideRandIdx);
                            }
                            break;
                    case 3: if (sq.left!==null) {
                                simulateTwoSquares(sq.obj, sq.left, sideRandIdx);
                            }
                            break;
                }
            }
        }

    }
    setTimeout("simulationLoop()", 1000.0/parseFloat($('#sim-fps').val()));
}

function saveScene()
{
    var sq;
    var _x, _y, _type;
    var saveArray = new Array();

    $('#canvas > a.active').each(function() {
        _x = parseInt($(this).attr('x'));
        _y = parseInt($(this).attr('y'));
        _type = $(this).attr('type') ? parseInt($(this).attr('type')) : false;

        sq = { x      : _x,
               y      : _y,
               state  : (_type==6) ? parseInt($(this).attr('state')) : false,
               type   : _type,
               par    : parseInt($(this).find('> b').html()),
               res    : parseInt($(this).find('> i').html())
             };

        saveArray.push(sq);
    });

    $('#saved').val(JSON.stringify(saveArray));
}

function loadScene()
{
    var saveArray = JSON.parse($('#saved').val());
    var i;
    var aObj;
    var sa;

    $('#canvas > a').each(function() { 
        $(this).html('');
        $(this).removeAttr('type');
        $(this).removeAttr('state');
        $(this).removeClass('type1').removeClass('type2').removeClass('type3').removeClass('type4').removeClass('type5').removeClass('type6').removeClass('active');
    });

    for (i=0; i<saveArray.length; i++) {
        sa = saveArray[i];

        aObj = $('#sq-'+sa.x+'-'+sa.y);
        aObj.addClass('type'+sa.type).addClass('active')
        aObj.attr('type', sa.type);
        if (sa.type==6) {
            aObj.attr('state', sa.state);
        }
        aObj.append('<b>'+sa.par+'</b>')
        aObj.append('<i>'+sa.res+'</i>');
        aObj.find('> b').css('opacity', sa.par/MAX_PARTICLES)
        aObj.find('> i').css('opacity', sa.res/MAX_RESISTANCE);
    }

    sceneChanged = true;
}

$(document).ready(function() {

    setup();
    setTimeout("simulationLoop()", 1000.0/parseFloat($('#sim-fps').val()));
});