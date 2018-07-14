$(document).ready(function(){

    $("#previewCanvas, #palette, #options-container").draggable();
    
    var palette = [
        '0,0,0',
        '255,255,255',
        '103,55,43',
        '112,164,168',
        '111,61,133',
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
    var zoomFactor = 12;
    var previewZoomFactor = 1;
    var previewZoomActive = false;
    var id = ctx.createImageData(1,1);
    var d = id.data;
    var down = false;
    var pixelColor = "0,0,0";

    // Zoom level indicator
    $('#zoom-level').val(zoomFactor);

    // Adjust canvas side depending on window size
    $(window).on('resize load', function(){
        changeCanvasSize();
    });

    function changeCanvasSize() {
        $('#container').css('width', $(window).width() + 'px').css('height', $(window).height() + 'px');
    }

    // Color palette div
    var i;
    var paletteHtml = '';
    for (i = 0; i < palette.length; ++i) {
        paletteHtml += '<div class="color' + (i == 0 ? " active" : "" ) + '" data-rgb="' + palette[i] + '" style="background-color: rgba(' + palette[i] + ',1)"></div>';
    }

    $('#palette').append(paletteHtml);

    // Load an initial image into the background
    var img = new Image();
    img.src = 'img1.png';
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        refreshPreviewCanvas();
    };

    // Change the image on select
    $('#options-container select').on('change', function() {
        img.src = this.value + '.png';
        ctx.drawImage(img, 0, 0);
        refreshPreviewCanvas();
    });

    // Clear the canvas
    $('#clear').on('click', function() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(' + pixelColor + ',1)';
        ctx.fillRect(0,0,canvas.width,canvas.height);        
        ctx.restore();
        refreshPreviewCanvas();
    });

    $('#canvas').on('hover', function() {

    });

    // Mousevents
    $(canvas).bind({
        mousedown : function(){
            down = true;  
            drawPixel(event);
        },
        mousemove : function(){
            var currentCoordinates = returnCurrentCoordinates(event);  
            $('#coor-x').val(currentCoordinates[0]);
            $('#coor-y').val(currentCoordinates[1]);            
            if(!down) return;
            drawPixel(event);
            refreshPreviewCanvas();
        },
        mouseup : function(){
            down = false;
        }
    });

    // Update coordinates 
    function returnCurrentCoordinates(event) {
        var x = Math.floor((event.clientX + container.scrollLeft ) / zoomFactor);
        var y = Math.floor((event.clientY + container.scrollTop ) / zoomFactor);
        return [x,y];
    }

    // Copying the main canvas into 
    function refreshPreviewCanvas() {
        var destCtx = previewCanvas.getContext('2d');
        destCtx.drawImage(canvas, 0, 0);    
    }

    function drawPixel(event) {
        // Calculate the position of the mouse
        var currentCoordinates = returnCurrentCoordinates(event);  
        createPixel(currentCoordinates[0], currentCoordinates[1], pixelColor);
        refreshPreviewCanvas();
    }

    function createPixel(pixelX, pixelY, color) {
        ctx.putImageData( id, pixelX, pixelY );
        ctx.fillStyle = "rgba(" + color + ",1)";
        ctx.fillRect( pixelX, pixelY, 1, 1 );
    }

    // Canvas Zoom
    canvas.onmousewheel = function (event){
        var wheel = event.wheelDelta/240;
        $('#canvas').css('zoom', zoomFactor + wheel);
        zoomFactor = zoomFactor + wheel;
        $('#zoom-level').val(zoomFactor);
    }

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
        } else {
            $('#previewCanvas').css('zoom', previewZoomFactor - 0.5);
            previewZoomFactor = previewZoomFactor - 0.5;
        }
    });

    // Disable vertical scroll on mousewheel so the zoom works fine
    $(window).on("wheel mousewheel", function(event){
        if(event.originalEvent.deltaY > 0) {
            event.preventDefault();
            return;
        } else if (event.originalEvent.wheelDeltaY < 0) {
            event.preventDefault();
            return;
        }    
    });

    $('#palette .color').on('click', function(){
        pixelColor = $(this).data('rgb');
        $('#palette .color').removeClass('active');
        $(this).addClass('active');
    });

});