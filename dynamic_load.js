var ply_$ = null;
(function(){
    /*global UTIL:false */
    "use strict";
    // pure JS serial script loading
    // Usage: if is a single file and no cb provided, it will set the load as async    
    function loadjs(url,cb){var x=document.body.appendChild(document.createElement('script'));x.src=url;x.onload=function(){console.log("Dynamically loaded "+url);if(cb){cb();}};if(!cb){x.setAttribute('async','')}}

    loadjs("https://raw.github.com/unphased/ply/master/towel.js", function(){
        var jQ = window.jQuery;
        // only if jQuery already exists on the page we're injecting to should noConflict be invoked. 
        UTIL.async_load([
            // loads independent jquery if existing version != 2.x (this code good till jQuery 3)
            !jQ || (jQ && jQ().jquery.indexOf('2') === 0) ? {
                url: "https://raw.github.com/unphased/ply/master/jquery-2.0.0b2.js",
                tag: "script",
                cb: jQ && function(){ 
                    console.log("creating ply_$ because jquery "+jQ.jquery+" already found"); 
                    window.ply_$ = $.noConflict(true);
                }
            } : null,
            {url: "https://raw.github.com/unphased/ply/master/modernizr-2.6.2.min.js", tag: "script"}
        ], function() {
            UTIL.js_load(['https://raw.github.com/unphased/ply/master/debug.js','https://raw.github.com/unphased/ply/master/ply.js'],function(){
                // as the finishing scripts, these do not need to use async_load as we 
                // are not concerned about when they are all done loading
                loadjs('https://raw.github.com/unphased/ply/master/ply_L2.js');
                loadjs('https://raw.github.com/unphased/ply/master/ply_L3.js');
                loadjs('https://raw.github.com/unphased/ply/master/ply_L4.js');
                /*global PLY:false DEBUG:false*/

                // defines some UI to allow selection of features via my debug lib
                // In order to preserve regular site functionality as much as possible,
                // a double-tap custom gesture is required to start selection mode.

                var start_time = 0;
                var highlight_active = false;
                var mouse_down_at;
                var element_selected;
                var enable_ctx_menu = true;
                PLY.attach_handlers_on_document({
                    keyup: function(evt) {
                        // secret shortcut keys
                        if (evt.shiftKey && evt.altKey && evt.ctrlKey) {
                            switch (evt.which) {
                                case 65: // a
                                    highlight_active = true;
                                break;
                                case 66: // b
                                break;
                                default:
                                break;
                            }
                        }
                        if (evt.which === 27) { // esc should abort immediate action
                            // currently aborts *everything*
                            element_selected = null;
                            DEBUG.focused(null);
                            highlight_active = false;
                            DEBUG.highlight(null);
                        }
                    },
                    mousedown: function(evt) { //console.log("mousedown");
                        mouse_down_at = {x: evt.clientX, y: evt.clientY};
                        enable_ctx_menu = true;
                        if (evt.which === 3) {
                            //evt.preventDefault(); // this appears to not be able to prevent context menu
                            if (!evt.shiftKey) { 
                                DEBUG.highlight(evt.target, DEBUG.get_focused());
                                element_selected = evt.target;
                                highlight_active = true;
                            }
                        } else if (evt.which === 1) {
                            // treat double-click also as starting selection (nice for touchpad users)
                            if (Date.now() - start_time < 300) {
                                evt.preventDefault(); // this hopefully suppresses selection of text. 
                                DEBUG.highlight(evt.target, DEBUG.get_focused());
                                element_selected = evt.target;
                                highlight_active = true;
                            }
                            start_time = Date.now();
                        }
                    },
                    // a right-click overload (very nice for mouse users)
                    // unfortunately does break on OS X due to ctxmenu event 
                    // coming in before the mouseup. There is a workaround though
                    // and that is hold Shift to get the menu :)
                    contextmenu: function(evt) { 
                        if (!enable_ctx_menu || highlight_active) {
                            evt.preventDefault();
                        }
                    },
                    mouseup: function(evt) { //console.log("mouseup");
                        if (highlight_active) {
                            if (enable_ctx_menu && evt.which === 3) { // if we're about to trigger ctxmenu
                                // do not go on to select, just abort the action
                                highlight_active = false;
                                DEBUG.highlight(null);
                                // not interfere with focused 
                            } else {
                                highlight_active = false;
                                DEBUG.highlight(null);
                                DEBUG.focused(element_selected); 
                            }
                        }
                    },
                    mousemove: function(evt) {
                        if (mouse_down_at && (Math.abs(mouse_down_at.x-evt.clientX) + Math.abs(mouse_down_at.y-evt.clientY)) > 5) {
                            enable_ctx_menu = false;
                        }
                    }, 
                    mouseover: function(evt) { //console.log("highlight_active",highlight_active);
                        if (highlight_active) {
                            DEBUG.highlight(evt.target);
                            element_selected = evt.target;
                        }
                    },
                    touchstart: function(evt) {
                        // todo: make this not depend on clean start (i.e. allow double tap with non first finger)
                        if (Date.now() - start_time < 300 && evt.touches.length === 1) {
                            // is second tap start
                            evt.preventDefault(); // stop scroll, stop "copy" popup and selector 
                            highlight_active = true;
                            DEBUG.highlight(evt.target, DEBUG.get_focused());
                            element_selected = evt.target;
                        } 
                        // if not fast enough, just function as normal
                        start_time = Date.now();
                    },
                    touchmove: function(evt) {
                        if (highlight_active) {
                            var e = document.elementFromPoint(evt.changedTouches[0].clientX,evt.changedTouches[0].clientY);
                            DEBUG.highlight(e);
                            element_selected = e;
                        }
                    },
                    touchend: function(evt) {
                        // todo: make me a bit less dumb by remembering the finger ID of the triggering finger
                        if (evt.touches.length === 0 && highlight_active) { 
                            // no touches = terminate selection
                            DEBUG.highlight(null);
                            DEBUG.focused(element_selected);
                            highlight_active = false;
                        }
                    }
                }); // PLY.attach_handlers_on_document
            }); // load(ply.js)
        }); // UTIL.async_load
    }); // load utils
})(); // function wrapper