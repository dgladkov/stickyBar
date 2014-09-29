/*
* jQuery stickyBar Plugin
* By Kevin Giguere (https://github.com/kevthunder/)
* Version: 1.2.0 (09/17/2012)
* https://github.com/kevthunder/stickyBar
*
* Branched From Brandon S. <antizeph@gmail.com> Version: 1.1.2 (09/14/2010) http://plugins.jquery.com/project/stickyBar
*
*
* This Plugin allow a sidebare to follow the page scrolling when needed or order for it to be present as much as possible
*
* Start: define a .sticky class in your css file, and style it however you want.
*
* Simple usage :
*         $(selector).stickyBar();
* No bottom limiting
*         $(selector).stickyBar({divBounds:false});
* Position limited by a Dom element different from the parent element
*         $(selector).stickyBar({divBounds:$(selector2)});
*
*
*
* OPTIONS
*        divBounds :           Define a DOM element wich limit both top and bottom position. If true, defaults to divTarget parent.
*        showClose :           Show a close button to disable this behavior
*        scrollFirst :         If true, will try to show all the content before fixing the position. Useful when the bar is higher than the window.
*        includeBoundPadding : If true, the tab will be constrained within the divBounds padding. Defaults to true if divBounds === true.
*        divBase :             Define the starting position, defaults to divBounds if defined or divTarget
*
*
*

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function ($) {
    var defaults = {
        divBounds:           true,  // define a DOM element wich limit both top and bottom position. If true, defaults to divTarget parent.
        showClose:           false, // show a close button to disable this behavior
        scrollFirst:         true,  // if true, will try to show all the content before fixing the position. Useful when the bar is higher than the window.
        includeBoundPadding: null,  // if true, the tab will be constrained within the divBounds padding. Defaults to true if divBounds === true
        divBase:             ''     // define the starting position, defaults to divBounds if defined or divTarget
        },

        $window = $(window),
        state = [],

        MODE_UNWRAPPED = 0,
        MODE_FIXED = 1,
        MODE_MOVED = 2,
        MODE_DISABLED = 3,

        scroller = function () {
            for (var i = 0; i < state.length; i++) {
                var obj = state[i],
                    $divTarget = $(obj.divTarget),
                    $divTargetBase = $(obj.divTargetBase),
                    $divBounds = $(obj.divBounds);

                if(obj.mode == MODE_DISABLED){
                    return;
                }
                if (obj.mode == MODE_UNWRAPPED){
                    obj.stickyBarTop = $divTargetBase.offset().top;
                }
                var paddingTop = 0;
                var paddingBottom = 0;
                if (obj.includeBoundPadding) {
                    paddingTop = parseInt($divTargetBase.css("padding-top").replace('px',''));
                    paddingTop = (paddingTop?paddingTop:0);
                    paddingBottom = parseInt($divTargetBase.css("padding-bottom").replace('px',''));
                    paddingBottom = (paddingBottom?paddingBottom:0);
                }
                var StartDecale = 0;
                var scrollPos = $window.scrollTop();
                var moveOffset = 0;

                ///// disable fixing if the bar allready takes all it's available space /////
                var fixe = (!obj.divBounds || $divTarget.outerHeight(true) < $divBounds.height());

                ///// scrollFirst Behavior /////
                if (obj.scrollFirst && $divTarget.outerHeight(true) > $window.height()){
                    var lastTop = curTop; //we can know if the user is scrolling up or down by getting the last position
                    obj.curTop = $divTarget.offset().top;
                    if(lastTop + $divTarget.outerHeight(true) <= scrollPos + $window.height()){ //scroll has reached the bottom of the bar
                        moveOffset = $divTarget.outerHeight(true) - $window.height();
                    }else if(lastTop >= scrollPos){ //scroll has reached the top of the bar
                        moveOffset = 0;
                    }else{ //when there is still content in the bar that can be seen by scrolling
                        fixe = false;
                        moveOffset = lastTop - obj.stickyBarTop;
                    }
                }

                ///// divBounds bottom limiting Behavior /////
                if(obj.divBounds && (obj.includeBoundPadding?$divBounds.height():$divBounds.outerHeight()) + obj.stickyBarTop + paddingTop - $divTarget.outerHeight() + moveOffset <= scrollPos){
                    fixe = false;
                    moveOffset = (obj.includeBoundPadding?$divBounds.height():$divBounds.outerHeight()) + paddingTop - $divTarget.outerHeight();
                }

                ///// top limiting Behavior /////
                fixe = fixe && scrollPos - paddingTop >= obj.stickyBarTop;

                ///// apply position fixing and offset displacement /////
                if (fixe || moveOffset > 0){
                    //Add Wrapper if needed (if position is fixed or the tab need displacement)
                    if (obj.mode == MODE_UNWRAPPED){
                        $divTarget.wrap('<div class="sticky" id="stickybar-' + obj.divTarget + '">');

                        if (obj.showClose){
                            $divTarget.parent().append('<div class="stickyClose" style="left:95%;position:absolute;color:#fff;top:0;left:98%;cursor:pointer">x</div>');
                            $(".stickyClose",$divTarget.parent()).click(function(){
                                $divTarget.parent().slideUp();
                                setTimeout(function(){
                                    if ($divTarget.parent().attr('class') === 'sticky')
                                        $divTarget.unwrap();
                                    $(".stickyClose").remove();
                                },400);
                                obj.mode = MODE_DISABLED; //won't happen again on the page until a refresh
                            });
                        }
                    }
                    // apply fixed position if asked by behaviors
                    if(fixe && obj.mode != MODE_FIXED){
                        $divTarget.parent().css({
                            'position'    : "fixed",
                            'top'         : -moveOffset,
                            'width'       : "100%",
                            'z-index'     : "9999"
                        });
                        obj.mode = MODE_FIXED;
                    // apply position displacement if asked by behaviors
                    }else if(!fixe && moveOffset > 0 && mode != MODE_MOVED){
                        if(obj.divBounds) moveOffset += ($divBounds.offset().top - obj.offsetParent.offset().top);
                        $divTarget.parent().css({
                            'position'    : "absolute",
                            'top'         : moveOffset,
                        });
                        obj.mode = MODE_MOVED;
                    }
                //remove Wrapper if needed
                } else if (obj.mode != MODE_UNWRAPPED){
                    $(".stickyClose",$divTarget.parent()).remove();
                    if ($divTarget.parent().attr('class') === 'sticky')
                        $divTarget.unwrap();
                    obj.mode = MODE_UNWRAPPED;
                }
            }
        },

        // recover wrapper if it's somehow was removed (e.g. after ajax call)
        recover = function () {
            for (var i = 0; i < state.length; i++) {
                var obj = state[i];
                if (obj.mode != MODE_UNWRAPPED) {
                    if (!document.getElementById('stickybar-' + obj.divTarget)) {
                        $(".stickyClose",$divTarget.parent()).remove();
                        if ($divTarget.parent().attr('class') === 'sticky')
                            $divTarget.unwrap();
                        obj.mode = MODE_UNWRAPPED;
                    }
                }
            }
        };

    // register handlers
    $(window).scroll(scroller);
    $(document).ajaxComplete(recover);

    $.fn.stickyBar = function (options) {
        var settings = $.extend(defaults, options),
            divBounds = (settings.divBounds === true) ? divTargetBase = $(this).parent() : divTargetBase = settings.divBounds,
            divTargetBase = (settings.divBase) ? divTargetBase = settings.divBase : (divBounds? divTargetBase=divBounds : divTargetBase = this);
        if (settings.includeBoundPadding === null)
            settings.includeBoundPadding = (settings.divBounds === true);
        state.push($.extend(settings, {
            divTarget: this.selector,
            mode: MODE_UNWRAPPED, // initial value
            divBounds: divBounds,
            divTargetBase: divTargetBase,
            stickyBarTop: null,
            curTop: $(this).offset().top,
            offsetParent: $(this).offsetParent(),
        }));
    };

    $.fn.unstick = function() {
        for (var i = 0; i < state.length; i++) {
            var removeIdx = -1;
            if ($(state[i])[0] == this) {
                removeIdx = i;
            }

            if(removeIdx != -1){
                sticked.splice(removeIdx,1);
                if ($(this).parent().attr('class') === 'sticky') {
                    $(this).unwrap();
                }
            }
        }
    };

    $(function() {
        setTimeout(scroller, 0);
    });
}) (jQuery);
