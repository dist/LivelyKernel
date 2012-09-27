module('apps.ChartBuildingBlocks').requires('lively.morphic.AdditionalMorphs', 'apps.d3').toRun(function() {


lively.morphic.Box.subclass('apps.ChartBuildingBlocks.ChartRenderer',

'Visuals', {
    activeRenderPartClassName: 'active-render-part',

    markMorph: function(morph, hook){

        morph.addStyleClassName(this.activeRenderPartClassName);

        // The owner should be a ChartGenerator which 
        // implements a function to mark morph according to their hook
        if (this.owner.markHook) {
            this.owner.markHook(morph, hook);
        }
        return morph;
    },
    unmarkAllMorphs: function() {
        this.submorphs.each(function(m){
            m.removeStyleClassName(this.activeRenderPartClassName)
        }, this);
    },

    markHooks: function() {
        var markFirst = ['prepareContext', 'setupDrawingAreas',
                'setupScales', 'drawDimensions'],
            markAll = ['drawSeries'];

        markFirst.each(function(h){
            var morphs = this.getMorphsForHook(h);
            if (morphs.length > 0) {
                this.markMorph(morphs.first(), h);
            }
        }, this);
        markAll.each(function(h){
            this.getMorphsForHook(h).each(function(morph){
                this.markMorph(morph, h);
            }, this);
        }, this);

    }

},
'Hook dispatch', {
    getMorphsForHook: function(hookName) {
        var m,
            submorphs = this.submorphs.sort(this.sortMorphsForTop),
            i = submorphs.length - 1,
            hookMorphs = [];

        for (; (m = submorphs[i]); i--) {
            var hook = m[hookName];
            if (hook && typeof hook === 'function') {
                hookMorphs.push(m);
            }
        }
        return hookMorphs;
    },

    sortMorphsForTop: function(a,b) {
        return b.getPosition().y - a.getPosition().y;
    },
    dispatchHook: function(args) {
        // Dispatches a given hook function and returns its return value.
        // If hook is not found in a submorph a default implementation is 
        // looked-up here. If no default implementation could be found, an
        // error is thrown.
        var hookName = args.callee.methodName;
        if (hookName) {
            var defaultHookName = hookName + 'Default',
                hookMorphs = this.getMorphsForHook(hookName),
                argArray = Array.prototype.slice.call(args);

            if (hookMorphs.length > 0) {
                var hookMorph = hookMorphs.first();
                // If the hook was found implemented in a submorph, go for it
                return hookMorph[hookName].apply(hookMorph, argArray);

            } else if (this[defaultHookName] && typeof this[defaultHookName] === 'function') {
                // If not, than the go for the default implementation in this ChartRenderer
                return this[defaultHookName].apply(this, argArray);

            } else {
                // Throw an error if no implementation was found at all
                throw 'Cannot render chart because hook "' + hookName + ' was not implemented.';
            }
        }
    },
    dispatchHooks: function(args) {
        // Dispatches ALL given hook functions found in submorphs.
        // If hook is not found in submorphs a default implementation is 
        // looked-up here. If no default implementation could be found, an
        // error is thrown.
        var hookName = args.callee.methodName;
        if (hookName) {
            var counter = 0,
                hookMorphs = this.getMorphsForHook(hookName),
                argArray = Array.prototype.slice.call(args),
                defaultHookName = hookName + 'Default';

            if (hookMorphs.length > 0) {
                // If the hook was found implemented in a submorph, go for it
                    hookMorphs.each(function(hookMorph) {
                        hookMorph[hookName].apply(hookMorph, argArray);
                    });
            } else if (this[defaultHookName] && typeof this[defaultHookName] === 'function') {
                // If not, than the go for the default implementation in this ChartRenderer
                return this[defaultHookName].apply(this, argArray);

            } else {
                // Throw an error if no implementation was found at all
                throw 'Cannot render chart because hook "' + hookName + ' was not implemented.';
            }
        }
    },

},

'Accessing', {

},

'Drawing hook defaults', {
    prepareContext: function() {
        // Override to customize the DOM context of the chart.
        return this.dispatchHook(arguments);
    },
    prepareContextDefault: function(context) {
        // Returns an SVG node per default
        var ctxH = $(context).height(),
            ctxW = $(context).width(),
            svg = d3.select(context).selectAll("svg").data([1]);
        svg
            .enter()
            .append("svg:svg");
        svg
            .exit()
            .remove();
        svg
            .attr("width", ctxW)
            .attr("height", ctxH);

        return svg;
    },
    //

    //
    setupDrawingAreas: function() {
	// Override to ...
        return this.dispatchHook(arguments);
    },
    setupDrawingAreasDefault: function(data, bounds) {
        // Returns a default drawing area
        return [bounds];
    },
    //

    //
    setupScales: function() {
	// Override to ...
        return this.dispatchHook(arguments);
    },
    setupScalesDefault: function() {
        return [{}];
    },
    //

    //
    drawDimensions: function() {
        // Override this method to set up and draw your chart's axes
	//
	// context: a d3 node to draw your axes onto,
	// dimensions: an array of simple dimension representations
	// (i.e. [{id: 'x', title: 'X Axis', unit: 'Time'}]).
        //
        // Returns a context for the series to be drawn onto.
        return this.dispatchHook(arguments);
    },
    drawDimensionsDefault: function(context) {
        // Returns the context created in prepareContext
        return [context];
    },
    //

    //
    drawSeries: function() {
	// Override to draw the information contained by the dataset's series
	// onto a drawing context (in general the content pane
	// generated by the 'makeContentPane' method).
        return this.dispatchHooks(arguments);
    },
    drawSeriesDefault: function() {},
},

'Drawing', {
    draw: function(context, data, optPadding) {
        // Clear the visual indiciators about which 
        // morphs are used and which ones are not
        this.unmarkAllMorphs();

        var dimensions = data.getDimensions(),
            series = data.getSeries(),
            drawingBounds = this.prepareDrawingBounds(
                $(context).width(), $(context).height(), optPadding),
            // Creates an SVG context for the chart
            contextPane = this.prepareContext(context),

            // Setup the drawing areas
            areas = this.setupDrawingAreas(data, drawingBounds),

            // Create scales for the data's dimensions
            scales = this.setupScales(data, areas),

            // Template hook for drawing axes
            drawingPanes = this.drawDimensions(contextPane, data, scales, areas);

        // Template hook for drawing the series
        this.drawSeries(drawingPanes, data, scales, areas);
    },
    normalizePadding: function(padding) {
        if (padding >= 0) {
            return [padding,padding,padding,padding];
        } else if(Array.isArray(padding)) {
            return (padding.length === 4)
                ? padding
                : [padding.first(), padding.first(),
                    padding.first(), padding.first()];
        } else {
            return [0,0,0,0];
        }
    },
    prepareDrawingBounds: function(chartWidth, chartHeight, padding) {
        var p = this.normalizePadding(padding);
        return new Rectangle(padding[3], padding[0],
            chartWidth - padding[3] - padding[1],
            chartHeight - padding[0] - padding[2]);
    },

});



lively.morphic.HtmlWrapperMorph.subclass('apps.ChartBuildingBlocks.ChartDisplay',

'init', {
    initialize: function($super, bounds) {
        $super(bounds);
        this.redrawOnResize = true;
    }
},
'drawing', {
    draw: function() {
        var context = this.renderContext().shapeNode;
        if (this.chartRenderer && this.chartRenderer.draw) {
            this.chartRenderer.draw(context, this.chartData, this.padding || [0,0,0,0]);
        } else {
            console.warn('The ChartDisplay has no ChartRenderer so nothing can be drawn right now.');
        }
        return this;
    },
    clear: function() {
        // Remove the content of the shape node
        $(this.renderContext().shapeNode).empty();
        return this;
    },
    redraw: function() {
        // Does a fresh draw (clear + draw).
        return this.clear().draw();
    }

});


}) // end of module