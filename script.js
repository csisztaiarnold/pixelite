$(document).ready(function(){
    
    // Prevent accidental tab closing
    window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = "Are you sure you want to leave the page?";
        e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
        return confirmationMessage;              // Gecko, WebKit, Chrome <34
    });

    // Context menu is for fools
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    }, false);

    // Draggable settings for the modal windows
    $("#preview-canvas-container, #palette-container, #options-container, #zoom").draggable({
        'handle': 'h1'
    });

    var canvas = document.getElementById("canvas"); // Main canvas
    var previewCanvas = document.getElementById("preview-canvas"); // Preview window canvas
    var ctx = canvas.getContext("2d"); // The context
    var zoomFactor = 32; // Initial zoom
    var previewZoomFactor = 1; // Initial zoom of the preview window
    var previewZoomActive = false; // This has no use at the moment. TODO: refactor
    var id = ctx.createImageData(1,1); // Pixel size
    var d = id.data; // Pixel data
    var down = false; // Is mouse clicked?
    var pixelColor = "0,0,0"; // Initial primary pixel color
    var secondaryPixelColor = "255,255,255"; // Initial secondary pixel color
    var hiresLimits = true; // Are hires limitation turned on?
    var ditherBrush = false;
    // Only the following pixelindexes will show up during pixelling if ditherBrush is set to true
    // TODO: (for the far future) brush editor
    var brush_1 = [
            1,    3,    5,    7, 
         8,   10,   12,   14, 
           17,   19,   21,   23,
        24,   26,   28,   30,
           33,   35,   37,   39,
        40,   42,   44,   46,
           49,   51,   53,   55,
        56,   58,   60,   62
    ];
    var bufferKey = 0; // For saving undo states
    var undoStates = [];
    var canvasWidth = 320;
    var canvasHeight = 200;
    var imgDataForSave;

    $('#canvas').attr('width', canvasWidth).attr('height', canvasHeight);
    $('#preview-canvas').attr('width', canvasWidth).attr('height', canvasHeight);

    // Resize canvas
    $('#canvas-resize').on('click', function(){
        if(confirm('Are you sure you want to resize the canvas? This can\t be undone!')) {
            // Copy current state of canvas
            var imgDataBeforeResize = ctx.getImageData(0,0,canvasWidth,canvasHeight);
            // Clear canvas
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);       
            ctx.clearRect(0,0,canvasWidth,canvasHeight);  
            canvasWidth = $('#canvas-size-x').val();
            canvasHeight = $('#canvas-size-y').val();
            if(canvasWidth % 8 != 0) {
                canvasWidth = Math.round(canvasWidth / 8) * 8;
            }
            if(canvasHeight % 8 != 0) {
                canvasHeight = Math.round(canvasHeight / 8) * 8;
            }   
            $('#canvas-size-x').val(canvasWidth);
            $('#canvas-size-y').val(canvasHeight);
            $('#canvas').attr('width', canvasWidth).attr('height', canvasHeight);
            $('#preview-canvas').attr('width', canvasWidth).attr('height', canvasHeight);
            // Fill the resized part with the current selected color
            ctx.fillStyle = 'rgba(' + $('.left-click').data('rgb') + ',1)';
            ctx.fillRect(0,0,canvasWidth,canvasHeight); 
            ctx.restore();
            refreshPreviewCanvas();              
            // Put back image data before resize
            ctx.putImageData(imgDataBeforeResize,0,0);
            refreshPreviewCanvas();
        }
    });

    $('#brush_1').on('click', function(){
        toggleDitherBrush($('#brush_1'));
    });

    function toggleDitherBrush(el){
        if(el.hasClass('active')){
            ditherBrush = false;
            ditherBrushArray = [];
            el.removeClass('active');
        }else{
            ditherBrush = true;
            ditherBrushArray = brush_1;
            el.addClass('active');
        }
    }
    
    document.onkeyup = function(event) {
        // Keypress b 
        if(event.which == 66){
            toggleDitherBrush($('#brush_1'))
        }  

        // CTRL+z
        if(event.ctrlKey && event.which == 90) {
           undo();
           refreshPreviewCanvas();
        }        
    };    

    // Set the initial zoom to the main canvas
    $('#canvas').css('zoom', zoomFactor); 

    // Set the initial zoom to the main canvas
    $('#preview-canvas').css('zoom', previewZoomFactor); 

    // Are the hi-res limitations turned on?
    // TODO: this will need refactoring once multicolor is introduced
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

    // Create the color palette div based on the current palette array
    var i = 1;
    var paletteHtml = '';
    var paletteSelector = '<select id="palette-change">';
    for (var key in palette){
      var p;
      paletteSelector += '<option value="palette_' + i + '">' + key + '</option>';
      paletteHtml += '<div class="palette-table palette_' + i + (i == 1 ? " active" : "" ) + '">';
      for(p = 0; p < palette[key].length; p++) {
        paletteHtml += '<div class="color' + (i == 0 ? " active" : "" ) + '" data-rgb="' + palette[key][p] + '" style="background-color: rgba(' + palette[key][p] + ',1)"></div>';
      }
      paletteHtml += '</div>';
      i++;
    }
    paletteSelector += '</select>';
    $('#palette-selector').append(paletteSelector);
    $('#palette').append(paletteHtml);

    $('#palette-change').on('change', function(){
        $('.palette-table').removeClass('active');
        $('.' + $(this).val()).addClass('active');
    });

    // Load an initial image into the background
    var img = new Image();
    img.src = 'demopic.png';
    img.onload = function (){
        ctx.drawImage(img, 0, 0);
        refreshPreviewCanvas();
    };

    // Clear the canvas
    $('#clear').on('click', function(){
        if(confirm('Are you sure you want to clear the canvas? This can\'t be undone!')) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = 'rgba(' + pixelColor + ',1)';
            ctx.fillRect(0,0,canvasWidth,canvasHeight);        
            ctx.restore();
            refreshPreviewCanvas();
        }
    });

    // Mousevents
    $(canvas).bind({
        mousedown : function(){
            imgDataForSave = ctx.getImageData(0,0,canvasWidth,canvasHeight);
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
            // Save undo state
            saveUndosState(imgDataForSave);
            down = false;
        }
    });

    // Update pixel coordinates 
    function returnCurrentPixelCoordinates(event){
        var x = Math.floor((event.clientX + container.scrollLeft) / zoomFactor);
        var y = Math.floor((event.clientY + container.scrollTop) / zoomFactor);
        return [x,y];
    }

    // Update char coordinates 
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
        // Which pixel in order are we changing in the char (need it for the array index)?
        var pixelIndexX = currentPixelCoordinates[0] - (currentCharCoordinates[0] * 8);
        var pixelIndexY = currentPixelCoordinates[1] - (currentCharCoordinates[1] * 8);
        var pixelIndex = pixelIndexX + (pixelIndexY * 8);
        if(event.which == 3){
            pixelColor = secondaryPixelColor;
        } else {
            pixelColor = pixelColor
        }
        // Hires limits apply if they're turned on, this will change eventually if I introduce multicolor graphics mode
        if(uniqueColors.length < 2 || pixelColor + ',255' == uniqueColors[0] || pixelColor + ',255' == uniqueColors[1] || hiresLimits == false) {
            // If ditherbrush is turned on, put pixels only on the indexes which are defined in the ditherBrush array
            if(ditherBrush == true && $.inArray(pixelIndex, ditherBrushArray) != -1) {
                return false;
            }
            createPixel(currentPixelCoordinates[0], currentPixelCoordinates[1], pixelColor);
        } else {
            colorChange(currentCharCoordinates, pixelIndex, pixelColor);
        }
        // Reset colors
        pixelColor = $('.color-indicators .left-click').data('rgb');
        secondaryPixelColor = $('.color-indicators .right-click').data('rgb');
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
        // Find and change the matching color in the array
        colorToChange = colorArray[pixelIndex];
        for(i = 0; i < colorArray.length; i++) {
            if(colorArray[i] == colorToChange){
                colorArray[i] = pixelColor + ',255';
            }
        }
        // Finally, reverse it back to the image data and put it back to the canvas
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

    // Puts all colors from the actual char into an array, then return the uniques
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

    // Canvas Zoom (scrollwheel zoom was removed till I think of a better way of handling it)
    // TODO: keyboard shortcut, zooming proportionally from the center of the current viewport
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

    // Activate-deactive preview window (this has no practical use currently)
    // TODO: think of a better way to zoom the preview window (keyboard shortcut?)
    $('#preview-canvas').on("click",function(){
        event.stopPropagation();
        previewZoomActive = true;
        $('#preview-canvas').addClass('active');
    });

    $(window).click(function() {
        previewZoomActive = false;
        $('#preview-canvas').removeClass('active');
    });

    // Preview window zoom
    $('#preview-canvas').bind('mousewheel', function(event){
        var wheel = event.originalEvent.wheelDelta;
        if (previewZoomFactor + wheel > 1) {
            $(this).css('zoom', previewZoomFactor + 0.5);
            previewZoomFactor = previewZoomFactor + 0.5;
            $('#preview-canvas-container h1 span em').text(previewZoomFactor);
        } else {
            $(this).css('zoom', 1);
            previewZoomFactor = 1;
            $('#preview-canvas-container h1 span em').text(previewZoomFactor);
        }
    });

    // Visual clue for the current color
    $('#palette .color').on('click', function(){
        pixelColor = $(this).data('rgb');
        $('#palette .color').removeClass('active');
        $('.color-indicators .left-click').css('background-color', 'rgba(' + pixelColor + ',255)');
        $('.color-indicators .left-click').data('rgb', pixelColor);
        $(this).addClass('active');
    });

    // Set secondary (right click) color
    $("#palette .color").mousedown(function(event){
        if(event.which == 3){
            secondaryPixelColor = $(this).data('rgb');
            $('.color-indicators .right-click').css('background-color', 'rgba(' + secondaryPixelColor + ',255)');
            $('.color-indicators .right-click').data('rgb', secondaryPixelColor);
        }
    });

    // Save the picture (a quite naive solution, this should be rewritten later)
    $('#save-image').on('click', function(){
        var canvas = document.getElementById("canvas");
        var d = canvas.toDataURL("image/png");
        var w = window.open('about:blank','image from canvas');
        w.document.write("<img src='"+d+"' alt='from canvas'/>");
    });

    // Save an undoState buffer
    function saveUndosState(value) {
       undoStates[bufferKey] = value;
       bufferKey++;
    }
    
    // Retreive an older state from the undoState buffer
    function undo() {
        var previousState = bufferKey-1;
        imgData = undoStates[previousState];
        ctx.putImageData(imgData,0,0);
        if(bufferKey > 1) {
            bufferKey = bufferKey - 1;
        }
    }

});