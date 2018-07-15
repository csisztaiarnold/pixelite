$(document).ready(function(){

    $("#preview-canvas-container, #palette-container, #options-container, #zoom").draggable({
        'handle': 'h1'
    });

    var palette = [
        '0,0,0',
        '255,255,255',
        '103,55,43',
        '112,164,178',
        '111,61,134',
        '88,141,67',
        '53,40,121',
        '184,199,111',
        '111,79,37',
        '67,57,0',
        '154,103,89',
        '68,68,68',
        '108,108,108',
        '154,210,132',
        '108,94,181',
        '149,149,149'
    ];

    var canvas = document.getElementById("canvas");
    var previewCanvas = document.getElementById("previewCanvas");
    var ctx = canvas.getContext("2d");
    var zoomFactor = 8;
    var previewZoomFactor = 1;
    var previewZoomActive = false;
    var id = ctx.createImageData(1,1);
    var d = id.data;
    var down = false;
    var pixelColor = "0,0,0";
    var hiresLimits = true;

    $("#hires-limit").on('change', function(){
        if($(this).is(':checked')){
            hiresLimits = true;
            $('.current-colors-container').show();
        }else{
            hiresLimits = false; 
            $('.current-colors-container').hide();
        }
    });

    // Zoom level indicator init
    $('#zoom-level, #zoom span').text(zoomFactor);

    // Adjust canvas side depending on window size
    $(window).on('resize load', function(){
        changeCanvasSize();
    });

    // Center the image on window load
    $(window).on('load', function(){
        $('#container').scrollLeft((($('#canvas').width()*zoomFactor) - $(window).width()) / 2);
        $('#container').scrollTop((($('#canvas').height()*zoomFactor) - $(window).height()) / 2);
    });    

    function changeCanvasSize(){
        $('#container').css('width', $(window).width() + 'px').css('height', $(window).height() + 'px');
    }

    // Color palette div
    var i;
    var paletteHtml = '';
    for (i = 0; i < palette.length; ++i){
        paletteHtml += '<div class="color' + (i == 0 ? " active" : "" ) + '" data-rgb="' + palette[i] + '" style="background-color: rgba(' + palette[i] + ',1)"></div>';
    }

    $('#palette').append(paletteHtml);

    // Load an initial image into the background
    var img = new Image();
    img.src = 'demopic.png';
    img.onload = function (){
        ctx.drawImage(img, 0, 0);
        refreshPreviewCanvas();
    };

    // Change the image on select
    $('#options-container select').on('change', function(){
        img.src = this.value + '.png';
        ctx.drawImage(img, 0, 0);
        refreshPreviewCanvas();
    });

    // Clear the canvas
    $('#clear').on('click', function(){
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(' + pixelColor + ',1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);        
        ctx.restore();
        refreshPreviewCanvas();
    });

    // Mousevents
    $(canvas).bind({
        mousedown : function(){
            down = true;  
            drawPixel(event);
        },
        mousemove : function(){
            var currentPixelCoordinates = returnCurrentPixelCoordinates(event);  
            $('#coor-x').text(currentPixelCoordinates[0]);
            $('#coor-y').text(currentPixelCoordinates[1]);

            var currentCharCoordinates = returnCurrentCharCoordinates(event);  
            $('#charcoor-x').text(currentCharCoordinates[0] + 1);
            $('#charcoor-y').text(currentCharCoordinates[1] + 1);                      

            // Place a char overlay on the current char
            $('#char-overlay').css('top', (currentCharCoordinates[1] * zoomFactor * 8) + 'px').css('left', (currentCharCoordinates[0] * zoomFactor * 8) + 'px').css('width', (zoomFactor * 8 - 1) + 'px').css('height', (zoomFactor * 8 - 1) + 'px');

            var uniqueColors = returnUniqueColorsFromCurrentCharbyCharCoordinates(currentCharCoordinates);
            if(uniqueColors.length == 1){     
                uniqueColors[1] = uniqueColors[0]; // If there's only one color, the second color is the same   
            }
            $('#current-colors .color1').css('background-color', 'rgba(' + uniqueColors[0] + ')');
            $('#current-colors .color2').css('background-color', 'rgba(' + uniqueColors[1] + ')');

            if(!down) return;
            drawPixel(event);
            refreshPreviewCanvas();
        },
        mouseup : function(){
            down = false;
        }
    });

    // Update coordinates 
    function returnCurrentPixelCoordinates(event){
        var x = Math.floor((event.clientX + container.scrollLeft) / zoomFactor);
        var y = Math.floor((event.clientY + container.scrollTop) / zoomFactor);
        return [x,y];
    }

    // Update coordinates 
    function returnCurrentCharCoordinates(event){
        var x = Math.floor((event.clientX + container.scrollLeft) / zoomFactor / 8);
        var y = Math.floor((event.clientY + container.scrollTop) / zoomFactor / 8);
        return [x,y];
    }

    // Returns the unique colors from the current char
    function returnUniqueColorsFromCurrentCharbyCharCoordinates(currentCharCoordinates){
        // Get the up left x and y coordinate of the char
        var charStartX = currentCharCoordinates[0] * 8;
        var charStartY = currentCharCoordinates[1] * 8;
        // Dump the chardata into an array
        var imgData = ctx.getImageData(charStartX,charStartY,8,8);
        var uniqueColors = colorsFromCharIntoArrayAndReturnUniques(imgData.data);
        return uniqueColors;
    }

    // Copying the main canvas into the preview
    function refreshPreviewCanvas(){
        var destCtx = previewCanvas.getContext('2d');
        destCtx.drawImage(canvas, 0, 0);    
    }

    // Draw the actual pixel on the canvas
    function drawPixel(event) {
        // Calculate the position of the mouse
        var currentPixelCoordinates = returnCurrentPixelCoordinates(event);  
        var currentCharCoordinates = returnCurrentCharCoordinates(event);  
        var uniqueColors = returnUniqueColorsFromCurrentCharbyCharCoordinates(currentCharCoordinates);
        var pixelIndexX = currentPixelCoordinates[0] - (currentCharCoordinates[0] * 8);
        var pixelIndexY = currentPixelCoordinates[1] - (currentCharCoordinates[1] * 8);
        var pixelIndex = pixelIndexX + (pixelIndexY * 8);

        if(uniqueColors.length < 2 || pixelColor + ',255' == uniqueColors[0] || pixelColor + ',255' == uniqueColors[1] || hiresLimits == false) {
            createPixel(currentPixelCoordinates[0], currentPixelCoordinates[1], pixelColor);
        } else {
            colorChange(currentCharCoordinates, pixelIndex, pixelColor);
        }
        refreshPreviewCanvas();
    }

    // Create a pixel
    function createPixel(pixelX, pixelY, color){
        ctx.putImageData( id, pixelX, pixelY );
        ctx.fillStyle = "rgba(" + color + ",1)";
        ctx.fillRect( pixelX, pixelY, 1, 1 );
    }

    // Check which pixel I want to change, get the color, and change it in the char 
    function colorChange(currentCharCoordinates, pixelIndex, newColor) {
        // Get the up left x and y coordinate of the char
        var charStartX = currentCharCoordinates[0] * 8;
        var charStartY = currentCharCoordinates[1] * 8;
        // Dump the chardata into an array
        var imgData = ctx.getImageData(charStartX,charStartY,8,8);
        var i;
        var n = 0;
        var colorArray = [];
        data = imgData.data;
        for(i = 0; i < data.length; i++){
            if(i % 4 == 0) {
                colorArray[n] = data[i] + ',' + data[i+1] + ',' + data[i+2] + ',' + data[i+3];
                n++;
            } 
        }
        colorToChange = colorArray[pixelIndex];
        for(i = 0; i < colorArray.length; i++) {
            if(colorArray[i] == colorToChange){
                colorArray[i] = pixelColor + ',255';
            }
        }
        var colorData = [];
        var n = 0;
        $.each(colorArray, function( index, value ) {
            var subarray = colorArray[index].split(',');
            for(i = 0; i < subarray.length; i++) {
                colorData[n] = subarray[i];
                n++;
            }
        });
        for (var i = 0; i < imgData.data.length; i++){
            imgData.data[i] = colorData[i]
        }
        ctx.putImageData(imgData,charStartX,charStartY);
    }

    // All colors from char into an array, then return the uniques
    function colorsFromCharIntoArrayAndReturnUniques(data){
        var i;
        var n = 0;
        var colorArray = [];
        for(i = 0; i < data.length; i++){
            if(i % 4 == 0) {
                colorArray[n] = data[i] + ',' + data[i+1] + ',' + data[i+2] + ',' + data[i+3];
                n++;
            } 
        }
        uniqueItems = [];
        $.each(colorArray, function(i, el){
            if($.inArray(el, uniqueItems) === -1) uniqueItems.push(el);
        });
        return uniqueItems;
    }

    // Canvas Zoom
    $('.zoom-option').on('click', function(){
        if($(this).hasClass('zoom-in')){
            zoomIndex = 4;
        }else{
            if(zoomFactor == 4){
                zoomIndex = 0;
            }else{
                zoomIndex = -4;
            }
        }
        $('#canvas').css('zoom', zoomFactor + zoomIndex );
        zoomFactor = zoomFactor + zoomIndex ;
        $('#zoom-level, #zoom span').text(zoomFactor);
        // Place a char overlay on the current char
        var currentCharCoordinates = returnCurrentCharCoordinates(event);  
        $('#char-overlay').css('top', (currentCharCoordinates[1] * zoomFactor * 8) + 'px').css('left', (currentCharCoordinates[0] * zoomFactor * 8) + 'px').css('width', (zoomFactor * 8 - 1) + 'px').css('height', (zoomFactor * 8 - 1) + 'px'); 
        if(zoomFactor < 4) {
            $('#char-overlay').css('background-color', 'rgba(255,255,255,0.1)');
        } else {
            $('#char-overlay').css('background', 'none');
        }
    });

    // Activate-deactive preview window
    $('#previewCanvas').on("click",function(){
        event.stopPropagation();
        previewZoomActive = true;
        $('#previewCanvas').addClass('active');
    });

    $(window).click(function() {
        previewZoomActive = false;
        $('#previewCanvas').removeClass('active');
    });

    // Preview window zoom
    $('#previewCanvas').bind('mousewheel', function(event){
        var wheel = event.originalEvent.wheelDelta;
        if (previewZoomFactor + wheel > 1) {
            $('#previewCanvas').css('zoom', previewZoomFactor + 0.5);
            previewZoomFactor = previewZoomFactor + 0.5;
            $('#preview-canvas-container h1 span em').text(previewZoomFactor);
        } else {
            $('#previewCanvas').css('zoom', 1);
            previewZoomFactor = 1;
            $('#preview-canvas-container h1 span em').text(previewZoomFactor);
        }
    });


    $('#palette .color').on('click', function(){
        pixelColor = $(this).data('rgb');
        $('#palette .color').removeClass('active');
        $(this).addClass('active');
    });

});