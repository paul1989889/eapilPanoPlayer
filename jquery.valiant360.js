/**
 * @author xiefeng / http://www.eapil.com
 * @copyright  Copyright (C) 2016-2020 EAPIL Co.,Ltd. All rights reserved.
 * @licence Licensed MIT http://www.opensource.org/licenses/mit-license.php
 * @description it only can be used for phone web browser (safari,firefox,chrome,opera on IOS 10,firefox,chrome,opera on Android)
 */


var Detector = {

        canvas: !! window.CanvasRenderingContext2D,
        webgl: ( function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )(),
        workers: !! window.Worker,
        fileapi: window.File && window.FileReader && window.FileList && window.Blob,

        getWebGLErrorMessage: function () {

                var element = document.createElement( 'div' );
                element.id = 'webgl-error-message';
                element.style.fontFamily = 'monospace';
                element.style.fontSize = '13px';
                element.style.fontWeight = 'normal';
                element.style.textAlign = 'center';
                element.style.background = '#fff';
                element.style.color = '#000';
                element.style.padding = '1.5em';
                element.style.width = '400px';
                element.style.margin = '5em auto 0';

                if ( ! this.webgl ) {

                        element.innerHTML = window.WebGLRenderingContext ? [
                                'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
                                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
                        ].join( '\n' ) : [
                                'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
                                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
                        ].join( '\n' );

                }

                return element;

        },

        addGetWebGLMessage: function ( parameters ) {

                var parent, id, element;

                parameters = parameters || {};

                parent = parameters.parent !== undefined ? parameters.parent : document.body;
                id = parameters.id !== undefined ? parameters.id : 'oldie';

                element = Detector.getWebGLErrorMessage();
                element.id = id;

                parent.appendChild( element );

        }

};

/*!
 * Valiant360 panorama video player/photo viewer jquery plugin
 *
 * Copyright (c) 2014 Charlie Hoey <@flimshaw>
 *
 * Released under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Jquery plugin pattern based on https://github.com/jquery-boilerplate/jquery-patterns/blob/master/patterns/jquery.basic.plugin-boilerplate.js 
 */

/* REQUIREMENTS:

jQuery 1.7.2 or greater
three.js r65 or higher

*/


/*!
 * jQuery lightweight plugin boilerplate
 * Original author: @ajpiano
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
 */

// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
;(function ( $, THREE, Detector, window, document, undefined ) {

    // undefined is used here as the undefined global
    // variable in ECMAScript 3 and is mutable (i.e. it can
    // be changed by someone else). undefined isn't really
    // being passed in so we can ensure that its value is
    // truly undefined. In ES5, undefined can no longer be
    // modified.

    // window and document are passed through as local
    // variables rather than as globals, because this (slightly)
    // quickens the resolution process and can be more
    // efficiently minified (especially when both are
    // regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "Valiant360",
        plugin, // will hold reference to instantiated Plugin
        defaults = {
            crossOrigin: 'anonymous',
            clickAndDrag: true,
            fov: 10,
            fovMin: 3,
            fovMax: 100,
            hideControls: false,
            lon: 0,
            lat: 0,
            loop: "loop",
            muted: true,
            debug: false,
            autoplay: true,
            preload:true,
            flatProjection: false,
            beginLon:0.0,
            beginLat:0.0,
            beginFov:0.0,
            playType:false,
            translateZ:100.0,
            translateZMin:1.0,
            translateZMax:3000.0,
            beginTranslateZ:0.0,
            beginDistance :0.0,
	    firstIn: true
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method that merges the
        // contents of two or more objects, storing the
        // result in the first object. The first object
        // is generally empty because we don't want to alter
        // the default options for future instances of the plugin
        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).

            // instantiate some local variables we're going to need
            this._time = new Date().getTime();
            this._controls = {};
            this._id = this.generateUUID();

            this._requestAnimationId = ''; // used to cancel requestAnimationFrame on destroy
            this._isVideo = false;
            this._isPhoto = false;
            this._isFullscreen = false;
            this._mouseDown = false;
            this._dragStart = {};
           
            this._lat = this.options.lat;
            this._lon = this.options.lon;
            this._fov = this.options.fov;

            // save our original height and width for returning from fullscreen
            this._originalWidth = $(this.element).find('canvas').width();
            this._originalHeight = $(this.element).find('canvas').height();

            // add a class to our element so it inherits the appropriate styles
            $(this.element).addClass('Valiant360_default');

            this.createMediaPlayer();
            this.createControls();

        },

        generateUUID: function(){
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c==='x' ? r : (r&0x7|0x8)).toString(16);
            });
            return uuid;
        },

        createMediaPlayer: function() {

            // create a local THREE.js scene
            this._fov = 4.0;
            this._lat = -60;
            this._lon = -90;
            this._scene = new THREE.Scene();
            this._camera = new THREE.PerspectiveCamera(45, $(this.element).width() / $(this.element).height(), 1, 5000);
            //this._camera.setLens(this._fov);
            // create ThreeJS renderer and append it to our object

            this._renderer = Detector.webgl? new THREE.WebGLRenderer(): new THREE.CanvasRenderer();
            this._renderer.setSize( $(this.element).width(), $(this.element).height());

            this._renderer.autoClear = false;
            this._renderer.setClearColor( 0xffffff, 1 );

            this._renderer.setFaceCulling( THREE.CullFaceBack );

            this._scene.matrixAutoUpdate = true;

            // append the rendering element to this div
            $(this.element).append(this._renderer.domElement);
           // this._renderer.setViewPort(0,0,($this.element).width,($this.element).height);
            // figure out our texturing situation, based on what our source is
            if( $(this.element).attr('data-photo-src') ) {
                this._isPhoto = true;
                THREE.ImageUtils.crossOrigin = this.options.crossOrigin;
                this._texture = THREE.ImageUtils.loadTexture( $(this.element).attr('data-photo-src') );
            } else {
                this._isVideo = true;
                // create off-dom video player
                this._video = document.createElement( 'video' );
                this._video.setAttribute('crossorigin', this.options.crossOrigin);
                this._video.setAttribute('autoplay','true');
                this._video.setAttribute('preload','metadata');
                this._video.setAttribute('controls','controls');
				this._video.setAttribute('playsinline',true);

                if(navigator.userAgent.indexOf("iPhone")>0){
                this._video.setAttribute('style','display:none;');
                }
                $(this.element).append( this._video );
                this._texture = new THREE.Texture( this._video );

                // make a self reference we can pass to our callbacks
                var self = this;

                // attach video player event listeners
                this._video.addEventListener("ended", function() {

                });

                // Progress Meter
                this._video.addEventListener("progress", function() {
                    var percent = null;
                    if (self._video && self._video.buffered && self._video.buffered.length > 0 && self._video.buffered.end && self._video.duration) {
                        percent = self._video.buffered.end(0) / self._video.duration;
                    }
                    // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
                    // to be anything other than 0. If the byte count is available we use this instead.
                    // Browsers that support the else if do not seem to have the bufferedBytes value and
                    // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
                    else if (self._video && self._video.bytesTotal !== undefined && self._video.bytesTotal > 0 && self._video.bufferedBytes !== undefined) {
                        percent = self._video.bufferedBytes / self._video.bytesTotal;
                    }

                    // Someday we can have a loading animation for videos
                    var cpct = Math.round(percent * 100);
                    if(cpct === 100) {
                        // do something now that we are done
                    } else {
                        // do something with this percentage info (cpct)
                    }
                });


                // Video Play Listener, fires after video loads
                this._video.addEventListener("canplaythrough", function() {

                    if(self.options.autoplay == true) {
                        self._video.play();
                        self._videoReady = true;
                    }
                });

                // set the video src and begin loading
                this._video.src = $(this.element).attr('data-video-src');
                this._video.type = "application/vnd.apple.mpegurl";
                this._video.controls = "controls";
            }

            this._texture.generateMipmaps = false;
            this._texture.minFilter = THREE.LinearFilter;
            this._texture.magFilter = THREE.LinearFilter;
            this._texture.format = THREE.RGBFormat;

            // create ThreeJS mesh sphere onto which our texture will be drawn
            this._mesh = new THREE.Mesh( new THREE.SphereGeometry( 500, 80, 50 ), new THREE.MeshBasicMaterial( { map: this._texture } ) );
            this._mesh.scale.x = -1; // mirror the texture, since we're looking from the inside out
            this._scene.add(this._mesh);
            //this._mesh.matrixAutoUpdate = true;

            this.animate();
        },

        // creates div and buttons for onscreen video controls
        createControls: function() {

            var muteControl = this.options.muted ? 'fa-volume-off' : 'fa-volume-up';
            var playPauseControl = this.options.autoplay ? 'fa-pause' : 'fa-play';

            var controlsHTML = ' \
                <div class="controls"> \
                    <a href="#" class="playButton button fa '+ playPauseControl +'"></a> \
                    <a href="#" class="muteButton button fa '+ muteControl +'"></a> \
                    <a href="#" class="fullscreenButton button fa fa-expand"></a> \
                </div> \
            ';

            $(this.element).append(controlsHTML, true);

            // hide controls if option is set
            if(this.options.hideControls) {
                $(this.element).find('.controls').hide();
            }

            // wire up controller events to dom elements
            this.attachControlEvents();
        },

        attachControlEvents: function() {

            // create a self var to pass to our controller functions
            var self = this;

            this.element.addEventListener( 'touchmove', this.onMouseMove.bind(this), false );
            this.element.addEventListener( 'touchstart', this.onMouseDown.bind(this), false);
            this.element.addEventListener( 'touchend', this.onMouseUp.bind(this), false);


            $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange',this.fullscreen.bind(this));

            $(window).resize(function() {
                self.resizeGL($(self.element).width(), $(self.element).height());
            });

            // Player Controls
            $(this.element).find('.playButton').click(function(e) {
                e.preventDefault();
                if($(this).hasClass('fa-pause')) {
                    $(this).removeClass('fa-pause').addClass('fa-play');
                    self.pause();
                } else {
                    $(this).removeClass('fa-play').addClass('fa-pause');
                    self.play();
                }
            });
			
	    $(this.element).find(".fullscreenButton").css('visibility', 'hidden');

            $(this.element).find(".muteButton").click(function(e) {
                e.preventDefault();
                if($(this).hasClass('fa-volume-off')) {
                    $(this).removeClass('fa-volume-off').addClass('fa-volume-up');
                    self._video.muted = true;
                    self.switchType(true);
                } else {
                    $(this).removeClass('fa-volume-up').addClass('fa-volume-off');
                    self._video.muted = false;
                    self.switchType(false);
                }
            });

        },

        onMouseMove: function(event) {
            event.preventDefault();// 阻止浏览器默认事件，重要
            if (event.targetTouches.length == 1) {
                //event.preventDefault();// 阻止浏览器默认事件，重要
                var touch = event.targetTouches[0];

                var x, y;

                if (this.options.clickAndDrag) {
                    if (this._mouseDown) {
                        x = touch.pageX - this._dragStart.x;
                        y = touch.pageY - this._dragStart.y;
                        this._dragStart.x = touch.pageX;
                        this._dragStart.y = touch.pageY;
                        this._lon -= x / 2;
                        this._lat += y / 2;
                        this.options.beginLon = -x / 2;
                        this.options.beginLat = y / 2;
                    }
                } else {
                    x = touch.pageX - $(this.element).find('canvas').offset().left;
                    y = touch.pageY - $(this.element).find('canvas').offset().top;
                    this._lon = ( x / $(this.element).find('canvas').width() ) * 430 - 225;
                    this._lat = ( y / $(this.element).find('canvas').height() ) * -180 + 90;
                }

            }else if(event.targetTouches.length == 2){
                var touchone = event.targetTouches[0];
                var touchtwo = event.targetTouches[1];

                var distance = Math.sqrt(Math.pow(touchone.pageX-touchtwo.pageX,2)+Math.pow(touchtwo.pageY-touchtwo.pageY,2));

                var tempDistance = this.options.beginDistance-distance;

                if(this.options.playType)
                {
                    this.options.translateZ += tempDistance *12.0;
                    this.options.beginTranslateZ = tempDistance *12.0;
                }else{
					this._fov -= tempDistance * 1/12.0;
                    this.options.beginFov = -tempDistance * 1/12.0;
				}

                this.options.beginDistance = distance;
            }
        },

        onMouseWheel: function(event) {

            var wheelSpeed = -0.01;

            // WebKit
            if ( event.wheelDeltaY )
            {
                if(this.options.playType)
                {
                    this.options.translateZ += event.wheelDeltaY * wheelSpeed*30.0;
                    this.options.beginTranslateZ = event.wheelDeltaY * wheelSpeed*30.0;
                }
                else
                {
                    this._fov -= event.wheelDeltaY * wheelSpeed/2.0;
                    this.options.beginFov = -event.wheelDeltaY * wheelSpeed/2.0;
                }
            // Opera / Explorer 9
            }
            else if ( event.wheelDelta )
            {
                if(this.options.playType)
                {
                    this.options.translateZ += event.wheelDelta * wheelSpeed*30.0;
                    this.options.beginTranslateZ = event.wheelDelta * wheelSpeed*30.0;
                }
                else
                {
                    this._fov -= event.wheelDelta * wheelSpeed/2.0;
                    this.options.beginFov = -event.wheelDelta * wheelSpeed/2.0;
                }
            // Firefox
            }
            else if ( event.detail )
            {
                if(this.options.playType)
                {
                    this.options.translateZ += -event.detail *30.0;
                    this.options.beginTranslateZ = -event.detail *30.0;
                }
                else
                {
                    this._fov += event.detail * 1.0/2.0;
                    this.options.beginFov = event.detail * 1.0/2.0;
                }
            }

            if(this._fov < this.options.fovMin) {
                this._fov = this.options.fovMin;
            } else if(this._fov > this.options.fovMax) {
                this._fov = this.options.fovMax;
            }

            //this._camera.setLens(this._fov);
            event.preventDefault();
        },

        onMouseDown: function(event) {
            this._mouseDown = true;
            if(event.targetTouches.length == 1){
                //event.preventDefault();// 阻止浏览器默认事件，重要
                var touch = event.targetTouches[0];
                this._dragStart.x = touch.pageX;
                this._dragStart.y = touch.pageY;
				if(this.options.firstIn == true){
					this._video.play();
					this.options.firstIn = false;
				}
            }
            if(event.targetTouches.length == 2){
                var touchone = event.targetTouches[0];
                var touchtwo = event.targetTouches[1];

                this.options.beginDistance = Math.sqrt(Math.pow(touchone.pageX-touchtwo.pageX,2)+Math.pow(touchtwo.pageY-touchtwo.pageY,2));
            }
        },

        onMouseUp: function(event) {
            this._mouseDown = false;
        },

        animate: function() {
            // set our animate function to fire next time a frame is ready
            this._requestAnimationId = requestAnimationFrame( this.animate.bind(this) );

            if( this._isVideo ) {
                if ( this._video.readyState === this._video.HAVE_ENOUGH_DATA) {
                    if(typeof(this._texture) !== "undefined" ) {
                        var ct = new Date().getTime();
                        if(ct - this._time >= 30) {
                            this._texture.needsUpdate = true;
                            this._time = ct;
                        }
                    }
                }
            }

            this.render();
        },

        render: function() {
            this._lon += this.options.beginLon;
            this._lat += this.options.beginLat;
            this._lat = Math.max( - 90, Math.min( 90, this._lat ) );
            this.options.beginLon = this.options.beginLon/1.06;
            this.options.beginLat = this.options.beginLat/1.06;

            this.options.translateZ +=this.options.beginTranslateZ;
            this.options.beginTranslateZ/=1.4;
            this.options.translateZ = Math.max(this.options.translateZMin, Math.min( this.options.translateZMax, this.options.translateZ  ) );

            this._fov +=this.options.beginFov;
            this.options.beginFov= this.options.beginFov/1.06;
            this._fov = Math.max(this.options.fovMin, Math.min( this.options.fovMax, this._fov ) );

            this._scene.matrix.identity();
            var rotMatrixX;
            var rotMatrixY;
            var rotMatrixZ;
            var modelMatrix;
            var translateMatrix;
            //普通球模式
            if(this.options.playType)
            {
                this._camera.setLens(25.0);
                translateMatrix = new THREE.Matrix4().makeTranslation(0,0,-this.options.translateZ);
                rotMatrixX = new THREE.Matrix4().makeRotationX(-this._lat * Math.PI / 180);
                rotMatrixY = new THREE.Matrix4().makeRotationY(this._lon * Math.PI / 180);
                rotMatrixZ = new THREE.Matrix4().makeRotationZ(-this._lat * Math.PI / 180);
                modelMatrix = rotMatrixY.multiply(rotMatrixX,rotMatrixY);
                modelMatrix = rotMatrixY.multiply(translateMatrix,modelMatrix);
                this._scene.applyMatrix(modelMatrix);
            }
            //小星球模式
            else
            {
                translateMatrix = new THREE.Matrix4().makeTranslation(0,0,-500.0);
                rotMatrixX = new THREE.Matrix4().makeRotationX(-this._lat * Math.PI / 180);
                rotMatrixY = new THREE.Matrix4().makeRotationY(this._lon * Math.PI / 180);
                rotMatrixZ = new THREE.Matrix4().makeRotationZ(-this._lat * Math.PI / 180);
                modelMatrix = rotMatrixY.multiply(rotMatrixX,rotMatrixY);
                modelMatrix = rotMatrixY.multiply(translateMatrix,modelMatrix);
                this._camera.setLens(this._fov);
                this._scene.applyMatrix(modelMatrix);
            }
            this._renderer.clear();
            this._renderer.render( this._scene, this._camera );
        },

        switchType:function (types) {
            this.options.playType = types;
            if(types == true){
                this._lat = 0;
                this._lon = 0;
                this.options.translateZ = 600;
            }else{
                this._fov = 4.0;
                this._lat = -60;
                this._lon = -90;
            }
        },

        // Video specific functions, exposed to controller
        play: function() {
            //code to play media
            this._video.play();
        },

        pause: function() {
            //code to stop media
            this._video.pause();
        },

        loadVideo: function(videoFile) {
            this._video.src = videoFile;
        },
        unloadVideo: function() {
            // overkill unloading to avoid dreaded video 'pending' bug in Chrome. See https://code.google.com/p/chromium/issues/detail?id=234779
            this.pause();
            this._video.src = '';
            this._video.removeAttribute('src');
        },
        loadPhoto: function(photoFile) {
            this._texture = THREE.ImageUtils.loadTexture( photoFile );
        },

        fullscreen: function() {
            if($(this.element).find('a.fa-expand').length > 0) {
                this.resizeGL(screen.width, screen.height);

                $(this.element).addClass('fullscreen');
                $(this.element).find('a.fa-expand').removeClass('fa-expand').addClass('fa-compress');

                this._isFullscreen = true;
            } else {
                this.resizeGL(this._originalWidth, this._originalHeight);

                $(this.element).removeClass('fullscreen');
                $(this.element).find('a.fa-compress').removeClass('fa-compress').addClass('fa-expand');

                this._isFullscreen = false;
            }
        },

        resizeGL: function(w, h) {
            this._renderer.setSize(w, h);
            this._camera.aspect = w / h;
            this._camera.updateProjectionMatrix();
        },

        destroy: function() {
            window.cancelAnimationFrame(this._requestAnimationId);
            this._requestAnimationId = '';
            this._texture.dispose();
            this._scene.remove(this._mesh);
            if(this._isVideo) {
                this.unloadVideo();
            }
            $(this._renderer.domElement).remove();
        }
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if(typeof options === 'object' || !options) {
                // A really lightweight plugin wrapper around the constructor,
                // preventing against multiple instantiations
                this.plugin = new Plugin(this, options);
                if (!$.data(this, "plugin_" + pluginName)) {
                    $.data(this, "plugin_" + pluginName, this.plugin);
                }
            } else if(this.plugin[options]) {
                // Allows plugin methods to be called
                return this.plugin[options].apply(this.plugin, Array.prototype.slice.call(arguments, 1))
            }
        });
    };

})( jQuery, THREE, Detector, window, document );
