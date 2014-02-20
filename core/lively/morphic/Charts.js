module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.ide.CodeEditor', 'lively.morphic.Widgets', 'cop.Layers').toRun(function() {

lively.morphic.Morph.subclass("lively.morphic.Charts.Component", {

    initialize: function($super, content) {
        $super();

        this.content = content;
        this.content.component = this;
        
        this.setExtent(this.content.extent);
        
        this.componentHeader = this.createComponentHeader();
        this.componentBody = this.createComponentBody();

        this.layout = {adjustForNewBounds: true};
        
        this.minimizeOnHeaderClick();
        this.makeReframeHandles();
    },
    createMinimizer: function() {
        // abstract
    },
    createComponentBody: function() {
        var componentBody = new lively.morphic.Morph();
        componentBody.setName("ComponentBody");
        componentBody.setStyleClassNames(["ComponentBody"]);
        
        var headerHeight = 24;
        componentBody.setExtent(this.getExtent().subPt(pt(2, headerHeight)));
        componentBody.setPosition(pt(0, headerHeight));
        
        componentBody.setStyleSheet(this.getBodyCSS());
        componentBody.setFill();
        componentBody.setBorderStyle();
        
        this.addMorph(componentBody);
        
        componentBody.layout = {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        };
        
        componentBody.disableGrabbing();
        componentBody.disableDragging();
        
        this.content.layout = {
            resizeWidth: true,
            resizeHeight: true
        };
        this.content.setExtent(componentBody.getExtent().subPt(pt(6, 6)));
        this.content.setPosition(pt(3, 3));
        componentBody.addMorph(this.content);
        
        return componentBody;
    },

    onContentChanged: function() {
        // abstract
    },
    minimize: function(evt) {
        if (evt.isLeftMouseButtonDown() && !evt.isCtrlDown()) {
            if (this.isMinimized) {
                this.setExtent(pt(this.getExtent().x, this.maximizedHeight));
                this.componentBody.setVisible(true);
                this.isMinimized = false;
            }
            else {
                this.maximizedHeight = this.getExtent().y;
                this.componentBody.setVisible(false);
                this.setExtent(pt(this.getExtent().x, 24));
                this.isMinimized = true;
            }
        }
    },
    
    createComponentHeader: function() {
        var headerHeight = 24;
        var header = new lively.morphic.Morph();
        header.setName("ComponentHeader");
        header.setStyleClassNames(["ComponentHeader"]);
        header.setExtent(pt(this.getExtent().x, headerHeight));
        header.ignoreEvents();
        header.setAppearanceStylingMode(false);
        header.setStyleSheet(this.getHeaderCSS());
        header.setFill();
        header.setBorderStyle();
        header.setAppearanceStylingMode(false);
        
        this.addMorph(header);
        
        header.layout = {
            adjustForNewBounds: true,
            resizeWidth: true
        };
        
        var text = new lively.morphic.Text();
        text.setName("Description");
        text.setExtent(pt(50, 24));
        text.setFillOpacity(0);
        text.setBorderWidth(0);
        text.ignoreEvents();
        text.setTextColor(Color.white);
        text.setFontSize(11);
        text.setTextString(this.content.description);
        
        this.description = text;
        header.addMorph(this.description);

        this.errorText = this.createErrorText();
        header.addMorph(this.errorText);
        
        return header;
    },
    
    createErrorText: function() {
        var t = new lively.morphic.Text();
        t.setTextString("");
        t.setName("ErrorText");
        
        // don't ask, that's lively
        var _this = this;
        setTimeout(function() {
            var descriptionWidth = _this.getSubmorphsByAttribute("name", "Description")[0].getTextBounds().width;
            t.setExtent(pt(_this.getExtent().x - descriptionWidth - 80, 20));
            t.setPosition(pt(descriptionWidth + 20, 0));            
        }, 10);

        t.setFontSize(10);
        t.setFillOpacity(0);
        t.setBorderWidth(0);
        t.layout = {resizeWidth: true};
        t.disableEvents();
        return t;
    },
    
    applyDefaultStyle: function() {
        this.componentHeader.setStyleSheet(this.getHeaderCSS());
        this.componentBody.setStyleSheet(this.getBodyCSS());
        
        this.description.setTextColor(Color.white);
        
        this.errorText.setTextColor(Color.white);
        var minimizer = this.getSubmorphsByAttribute("name", "Minimizer");
        if (minimizer.length)
        {
            minimizer[0].applyDefaultStyle();
        }
    },
    
    applyErrorStyle: function() {
        
        this.componentHeader.setStyleSheet(this.getErrorHeaderCSS());
        this.componentBody.setStyleSheet(this.getErrorBodyCSS());
        
        this.description.setTextColor(Color.rgb(169, 68, 66));
        
        this.errorText.setTextColor(Color.rgb(169, 68, 66));
        var minimizer = this.getSubmorphsByAttribute("name", "Minimizer");
        if (minimizer.length)
        {
            minimizer[0].applyErrorStyle();
        }
    },
    
    getBodyCSS: function() {
        // abstract
    },
    
    getHeaderCSS: function() {
        // abstract
    },
    
    minimizeOnHeaderClick: function() {
        var _this = this;
        this.onMouseUp = function(evt) {
            var headerClicked = _this.componentHeader.fullContainsWorldPoint(pt(evt.pageX, evt.pageY));
            if (headerClicked) {
                _this.minimize(evt);
            }
        }
    },
    
    wantsToBeDroppedInto: function(dropTarget) {
        return dropTarget == $world;
    },
    
    makeReframeHandles: function () {
        this.spacing = 4;
        // create three reframe handles (bottom, right, and bottom-right) and align them to the window
        var e = this.getExtent();
        this.reframeHandle = this.addMorph(new lively.morphic.ReframeHandle('corner', pt(14,14)));
        this.rightReframeHandle = this.addMorph(new lively.morphic.ReframeHandle('right', e.withX(this.spacing)));
        this.bottomReframeHandle = this.addMorph(new lively.morphic.ReframeHandle('bottom', e.withY(this.spacing)));
        this.alignAllHandles();
    },
    
    alignAllHandles: function () {
        var handles = [this.reframeHandle, this.bottomReframeHandle, this.rightReframeHandle];
        handles.forEach(function (each) {
            if (each && each.owner) {
                each.alignWithWindow();
            }
        })
    }
    
});

Object.extend(lively.morphic.Charts.Component, {
    create: function(componentName) {
        if (componentName == "FanIn" || componentName == "FanOut") {
            return new lively.morphic.Charts[componentName]();
        } else {
            return new lively.morphic.Charts.DataFlowComponent(new lively.morphic.Charts[componentName]());
        }
    }
});


lively.morphic.Charts.Component.subclass("lively.morphic.Charts.WindowComponent", {

    initialize: function($super, content) {
        $super(content);
        
        this.componentHeader.addMorph(this.createCloser());
        
        this.setExtent(pt(400, 300));
        this.isDragged = true;
        this.position = this.getPositionInWorld();
        
    },
    
    onDragStart: function($super, evt) {
        this.isDragged = true;
        
        $super(evt);
    },
    
    onDropOn: function($super, aMorph) {
        $super(aMorph);
        
        this.isDragged = false;
    },
    
    update: function(data) {
        this.content.update(data);
    },

    onDrag: function($super, evt) {
        $super();
        this.position = this.getPositionInWorld();
    },
    remove: function($super) {
        $super();
        
        var line = $morph("Line" + this);
        if (!this.isDragged && line)
            line.remove();
    },

    onContentChanged: function() {
        // do nothing
    },
    
    createMinimizer: function() {
        var minimizer = new lively.morphic.Charts.Minimizer();
        minimizer.setPosition(pt(this.getExtent().x - 42, 8));
        minimizer.layout = {moveHorizontal: true}
        
        return minimizer;
    },
    
    createCloser: function() {
        var closer = new lively.morphic.Charts.Closer();
        closer.setPosition(pt(this.getExtent().x - 16, 8));
        closer.layout = {moveHorizontal: true}
        
        return closer;
    },
    
    getBodyCSS: function() {
        return ".ComponentBody {\
            background-color: rgb(255, 255, 255) !important;\
            border-width: 1px !important;\
            border-color: rgb(144, 144, 144) !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: 0px !important;\
            margin-left: 0px !important;\
            margin-right: 0px !important;\
            margin-top: 0px !important;\
            padding-bottom: 0px !important;\
            padding-left: 0px !important;\
            padding-right: 0px !important;\
            padding-top: 0px !important;\
            position: relative !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
            box-shadow: 0 10px 20px rgba(0,0,0,.2) !important;\
        }";
    },
    
getHeaderCSS: function() {
    return	".ComponentHeader { \
        background-color: rgb(144, 144, 144) !important; \
        color: white !important; \
        background-attachment: scroll !important;\
        background-clip: border-box !important;\
        background-image: none !important;\
        background-origin: padding-box !important;\
        background-size: auto !important;\
        border-bottom-color: rgb(144, 144, 144) !important;\
        border-bottom-style: solid !important;\
        border-bottom-width: 1px !important;\
        border-image-outset: 0px !important;\
        border-image-repeat: stretch !important;\
        border-image-slice: 100% !important;\
        border-image-source: none !important;\
        border-image-width: 1 !important;\
        border-left-color: rgb(144, 144, 144) !important;\
        border-left-style: solid !important;\
        border-left-width: 1px !important;\
        border-right-color: rgb(144, 144, 144) !important;\
        border-right-style: solid !important;\
        border-right-width: 1px !important;\
        border-top-color: rgb(144, 144, 144) !important;\
        border-top-style: solid !important;\
        border-top-width: 1px !important;\
        box-sizing: border-box !important;\
        color: rgb(255, 255, 255) !important;\
        cursor: auto !important;\
        display: block !important;\
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
        font-size: 14px !important;\
        line-height: 20px !important;\
        margin-bottom: -1px !important;\
        padding-bottom: 10px !important;\
        padding-left: 10px !important;\
        padding-right: 15px !important;\
        padding-top: 2px !important;\
        position: relative !important;\
        text-decoration: none solid rgb(255, 255, 255) !important;\
        z-index: 2 !important;\
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
        -webkit-box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
        box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
        border-width: 1px !important;\
    }";
}
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Content", {

    update: function(data) {
        // abstract
    },

    throwError: function(error) {
        this.component.throwError(error);
    },
    
    migrateFromPart: function(oldComponent) {
        // abstract
    }
});
lively.morphic.Charts.Content.subclass("lively.morphic.Charts.NullContent", {
    
    initialize : function($super) {
        $super();
        
        this.description = "";
        this.extent = pt(400, 40);
    },

    update: function(data) {
        return data;
    },
});

lively.morphic.Path.subclass("lively.morphic.Charts.Arrow", {
    
    initialize: function($super, aMorph, positionX) {
        
        this.componentMorph = aMorph;
        var arrowHeight = 10, arrowBase = 20;
        this.isLayoutable = false;
        var controlPoints = [pt(0, 0), pt(arrowBase, arrowHeight), pt(2 * arrowBase, 0)];
        
        $super(controlPoints);
        this.setBorderColor(Color.rgb(66, 139, 202));
        this.setFill(Color.rgb(66, 139, 202));
        this.setFillOpacity(0);
        this.positionAtMorph(positionX);
        this.setBorderWidth(1);
        this.deactivate();
    },
    
    getTipPosition: function() {
        return this.getPositionInWorld().addPt(pt(this.getExtent().x / 2, this.getExtent().y));
    },
    
    isActive: function() {
        return this.activated;
    },
    
    toggle: function() {
        if(!this.activated)
            this.activate();
        else
            this.deactivate();
    },
    remove: function($super) {
        
        this.componentMorph.removeArrowFromArray(this);
        $super();
    },

    showContextMenu: function(position) {
        var _this = this;
        
        var componentNames = ["Script", "FanOut", "FanIn", "JsonViewer", "LinearLayout", "MorphCreator", "JsonFetcher", "FreeLayout", "Table"];
        
        var contextItems = componentNames.map(function(ea) {
            return [ea, function() {
                _this.activate();
                _this.createComponent(ea);
                _this.componentMorph.notifyNextComponent();
            }];
        });
        
        var menu = new lively.morphic.Menu("Add new data flow component", contextItems);
        menu.openIn($world, position);
    },

    newMethod: function() {
        // enter comment here
    },

    
    positionAtMorph: function(positionX) {
        var aMorph = this.componentMorph;
        var extent = aMorph.getExtent();
        
        var offsetX = (extent.x - this.getExtent().x) / 2;
        var offsetY = extent.y + 15;
        
        this.setPosition(pt(positionX || offsetX, offsetY));
        aMorph.addMorph(this);
        
        // Since addMorph removes the morph and adds it on the new owner,
        // remove is called on the arrow once. There it is also removed
        // from the componentMorph's arrows-array and needs to be pushed again.
        if (aMorph.arrows) {
            aMorph.arrows.push(this);
        }
    },
    
    activate: function() {
        this.activated = true;
        this.setBorderStyle('solid');
        this.componentMorph.onArrowActivated(this);
    },
    
    deactivate: function() {
        this.activated = false;
        this.setBorderStyle('dotted');
        this.componentMorph.onArrowDeactivated(this);
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.toggle();
        } else if (e.isRightMouseButtonDown()) {
            this.showContextMenu(e.scaledPos);
        }
    },
    
    createComponent: function(componentName) {
        var newComponent = new lively.morphic.Charts.Component.create(componentName);
        
        var extent =  this.componentMorph.getExtent();
        var offset = pt(0,extent.y + newComponent.componentOffset);
        
        var newPosition = this.componentMorph.getPosition().addPt(offset);
        newComponent.setPosition(newPosition);

        var componentBelow = this.componentMorph.getComponentInDirectionFrom(1, this.getTipPosition());
        if (componentBelow) {
            componentBelow.move(newComponent.getExtent().y + newComponent.componentOffset, newPosition.y + newComponent.getExtent().y);
        }
        
        $world.addMorph(newComponent);
        this.componentMorph.refreshConnectionLines();
    }
});

lively.morphic.Path.subclass("lively.morphic.Charts.Line", {
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.openDataInspector(e.getPosition());
        }
    },
    
    remove: function($super) {
        if (this.viewer) {
            this.viewer.remove();
        }
        $super();
    },
    
    openDataInspector: function(evtPosition) {
        
        this.viewer = new lively.morphic.Charts.WindowComponent(new lively.morphic.Charts.JsonViewer());
        this.viewer.update(this.data);
        this.viewer.openInHand();
        
        this.viewerLine = new lively.morphic.Path([evtPosition, evtPosition]);
        this.viewerLine.setName('Line' + this.viewer);
        this.viewerLine.setBorderColor(Color.rgb(144, 144, 144));
        
        var center = pt(this.getPositionInWorld().x, evtPosition.y);
        var circle = lively.morphic.Morph.makeEllipse(new Rectangle(center.x, center.y - 3, 6, 6));
        circle.setBorderWidth(1);
        circle.setBorderColor(Color.rgb(144, 144, 144));
        circle.setFill();
        
        this.viewerLine.addMorph(circle);
        $world.addMorph(this.viewerLine);
        
        var converter = function(pos) {
            return pos.addPt(pt(190,120));
        }
        
        connect(this.viewer, 'position', this.viewerLine.getControlPoints().last(), 'setPos', converter);
        
    },
    
    updateViewer: function(data) {
        this.data = data;
        if (this.viewer) {
            this.viewer.update(data);
        }
    },
    
    onMouseOver: function() {
        this.setBorderWidth(5);
    },
    
    onMouseOut: function() {
        this.setBorderWidth(1);
    }, 
    
    initialize: function($super, vertices) {
        $super(vertices);
        this.setBorderColor(Color.rgb(144, 144, 144));
    },

    
});

lively.morphic.Charts.Component.subclass("lively.morphic.Charts.DataFlowComponent", {
    initialize: function($super, content) {
        
        $super(content);
        var arrow = new lively.morphic.Charts.Arrow(this);
        this.arrows = [arrow];
        
        this.data = null;
    },
    

    
    updateComponent : function() {
        var newData = this.content.update(this.data);
        // check whether the return value already was a promise
        if (newData && typeof newData.done == "function") {
            return newData;
        } else {
            return new $.Deferred().resolve(newData);
        }
    },
    
    getComponentInDirection : function($super, direction) {
        var components = this.getComponentsInDirection(direction);

        if (components.length) {
            components.sort(function (a, b) {
                if (direction == -1){
                    return b.getPosition().y - a.getPosition().y
                } else return a.getPosition().y - b.getPosition().y
            })
            return components[0];
        }
        return null;
    },
    
    getComponentsInDirection : function($super, direction) {
        var components = [];
        var pxInterval = 100;
        
        // choose upper left corner as point
        var currentPoint = this.getPositionInWorld();

        var rightBoundary = this.getPositionInWorld().x + this.getExtent().x;
        while (currentPoint.x < rightBoundary) {
            
            var component = this.getComponentInDirectionFrom(direction, currentPoint)
    
            if (component) {
                components.pushIfNotIncluded(component);
            }
            
            currentPoint = currentPoint.addPt(pt(pxInterval, 0));
        }
    
        return components;
    },
    
    errorColor: Color.rgb(210, 172, 172),
    
    notifyNeighborsOfDragStart: function() {
        this.neighbors = [];
        var neighbor;
        
        var _this = this;
        this.arrows.each(function(arrow){
            if (arrow.isActive()) {
                neighbor = _this.getComponentInDirection(1, arrow.getTipPosition());
                if (neighbor) {
                    _this.neighbors.push(neighbor);
                }
            }
        });
    },
    
    drawConnectionLine: function(arrow) {
        var target = this.getComponentInDirectionFrom(1, arrow.getTipPosition());
        
        if (target && arrow.isActive()) {
            // found component to send data to, so draw connection
            
            arrow.target = target;
            
            var from = pt(arrow.getExtent().x/2,arrow.getExtent().y);
            var to = pt(from.x, target.getPositionInWorld().y - arrow.getTipPosition().y + arrow.getExtent().y);
            arrow.connectionLine = new lively.morphic.Charts.Line([from, to]);
            arrow.connectionLine.setBorderStyle('dotted');
            arrow.addMorph(arrow.connectionLine);
        }
    },
    

    
    drawAllConnectionLines: function() {
        var _this = this;
        this.arrows.each(function(ea) {
            _this.drawConnectionLine(ea);
        });
    },
    

    
    refreshConnectionLines: function() {
        this.removeAllConnectionLines();
        this.drawAllConnectionLines();
    },
    
    removeConnectionLine: function(arrow) {
        if (arrow.connectionLine) {
            arrow.target = null;
            arrow.connectionLine.remove();
            arrow.connectionLine = null;
        }
    },
    

    
    removeAllConnectionLines: function() {
        var _this = this;
        this.arrows.each(function(ea) {
            _this.removeConnectionLine(ea);
        });
    },
    

    
    notifyNeighborsOfDragEnd: function() {
        var neighbor;
        
        var _this = this;
        this.arrows.each(function (arrow){
            neighbor = _this.getComponentInDirection(1, arrow.getPositionInWorld());
            if (neighbor) {
                neighbor.notify();
            }
            
            _this.neighbors.invoke("notify");
        });
    },
    
    onArrowActivated: function(arrow) {
        this.drawConnectionLine(arrow);
        this.update();
    },
    
    onArrowDeactivated: function(arrow) {
        var component = this.getComponentInDirectionFrom(1, arrow.getPositionInWorld());

        this.removeConnectionLine(arrow);
       
        if (component) {
            component.notify();
        }
    },
    

    

    

    
    calculateSnappingPosition: function() {
        // snap to position below component above, if there is one
        var componentAbove = this.getComponentInDirection(-1, this.globalBounds().topCenter().addPt(pt(0, -50)));

        if (componentAbove && !componentAbove.isMerger()) {
            // snap below component above
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            var snappingThreshold = 200;
            if (this.getPositionInWorld().y < posBelowComponent.y + snappingThreshold) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            return this.calculateSnappingPositionInGrid();
        }
    },
    
    calculateSnappingPositionInGrid: function() {
        var pos = this.getPositionInWorld();
        var offset = pt(0, 0);
        
        // Find the nearest fitting snapping point
        var remainder = pt(pos.x % this.gridWidth, pos.y % this.gridWidth);
        if (remainder.x > this.gridWidth / 2) {
            offset.x = this.gridWidth;
        }
        if (remainder.y > this.gridWidth / 2) {
            offset.y = this.gridWidth;
        }
        return pos.subPt(remainder).addPt(offset);
    },
    
    remove: function($super) {
        
        $super();
        this.onClose();
    },
    
    addPreviewMorph: function() {
        var morph = $morph("PreviewMorph" + this);
        if (!morph) {
            // adds the preview morph directly behind the component
            var morph = new lively.morphic.Box(rect(0,0,0,0));
            morph.setName("PreviewMorph" + this);
            morph.setBorderWidth(1);
            morph.setBorderRadius(5);
            morph.setBorderColor(Color.rgb(191,166,88));
            morph.setBorderStyle('dashed');
            $world.addMorph(morph,this);
        }
        morph.setPosition(this.getPositionInWorld());
        morph.setExtent(this.getExtent());
        this.previewAdded = true;
    },
    
    removePreviewMorph: function() {
        if (this.previewAdded) {
            $morph("PreviewMorph" + this).remove();
            this.previewAdded = false;
        } else {
            assert($morph("PreviewMorph" + this) === null, "previewAdded was false, but previewMorph was still found!");
        }
    },
    

    
    onResizeEnd: function() {
        var newExtent = this.calculateSnappingExtent(true);
        this.setExtent(newExtent, this.resizingFrom);
        this.drawAllConnectionLines();
        this.removePreviewMorph();
        this.setOpacity(1);
    },
    onResizeStart: function() {
        this.removeAllConnectionLines();
        this.addPreviewMorph();
        this.setOpacity(0.7);
    },

    
    onDragStart: function($super, evt) {
        this.wasDragged = true;
        $super(evt);
        this.removeAllConnectionLines();
        
        // Save the upper neighbor, so that it can be notified to redraw
        // its connection lines. It can not be notified at the moment, since
        // since we are still below it. Notification is done in onDropOn.

        this.savedUpperNeighbors = this.getComponentsInDirection(-1);
        
        this.addPreviewMorph();
        this.setOpacity(0.7);
        this.notifyNeighborsOfDragStart();
        
        // take the dragged component out of the layout
        var componentsBelow = this.getComponentsInDirection(1);
        var _this = this;
        componentsBelow.each(function (c) {
            c.move(-_this.getExtent().y - _this.componentOffset);
        });
        
        // save cached position for the automatic layouting
        this.getAllComponents().each(function (ea) {
            ea.cachedPosition = ea.getPosition();
        });
        
        // trigger this once to avoid flickering
        this.onDrag();
    },
    
    onDragEnd: function($super, evt) {
        $super(evt);
        // positioning is done in onDropOn
        
        this.removePreviewMorph();
        this.setOpacity(1);
        
        this.getAllComponents().each(function (ea) {
            ea.cachedPosition = null;
        });
    },
    
    onClose: function() {
        // only do this if the component is really removed
        // it is temporarily removed while dragging..
        if (!this.wasDragged) {
            var _this = this;

            var componentsBelow = this.getComponentsInDirection(1);
            var componentsAbove = this.getComponentsInDirection(-1);
            
            componentsBelow.each(function (c) {
                c.move(-_this.getExtent().y - _this.componentOffset);
            });

            componentsAbove.each(function (c){
                c.refreshConnectionLines();
            });

            this.notifyNextComponent();
        }
    },
    
    gridWidth: 20,
    
    componentOffset: 50,
    
    isMerger: function() {
        return false;
    },
    
    wantsDroppedMorph: function($super, morphToDrop) {
        if (morphToDrop instanceof lively.morphic.Charts.Component) {
            return false;
        }
        return $super(morphToDrop);
    },
    wantsToBeDroppedInto: function($super, target) {
        var ownerChain = target.ownerChain();

        // find owner which is Charts.Component
        for (var i = 0; i < ownerChain.length; i++) {
            var proto = Object.getPrototypeOf(ownerChain[i]);
            while (proto != null) {
                if (proto == lively.morphic.Charts.Component.prototype)
                    return false;
                proto = Object.getPrototypeOf(proto);
            }
        }

        return $super(target);
    },



    removeArrowFromArray: function(arrow) {
        
        var index = this.arrows.indexOf(arrow);
        if (index > -1) {
            this.arrows.splice(index, 1);
        }
    },

    realignAllComponents : function() {
        var previewMorph = $morph("PreviewMorph" + this);
        
        // reset the position of all components
        var all = this.getAllComponents();
        all.each(function (ea) {
            ea.setPosition(ea.getCachedPosition());
        })

        var componentsBelow = this.getComponentsInDirection(1);
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentsToMove = [];

        // select all components the preview intersects
        componentsToMove = componentsAbove.concat(componentsBelow).filter(function (c) {
            return (c && previewMorph.globalBounds().intersects(c.innerBounds().translatedBy(c.getPosition())))
        });

        // move the components
        componentsToMove.each(function (c) {
            var distanceBelow = previewMorph.getBounds().bottom() + c.componentOffset - c.getPosition().y;
            c.move(distanceBelow, previewMorph.getBounds().bottom());
        });
    },

    move: function(y, aggregatedY) {
        var componentsBelow = this.getComponentsInDirection(1);
        var componentsAbove = this.getComponentsInDirection(-1);
        var _this = this, distanceToMove;
        if (y > 0) {
            distanceToMove = (aggregatedY + this.componentOffset) - this.getPosition().y;
            if (distanceToMove > 0) {
                // move all components below
                // also pass the aggregatedY as we first propagate the move before actually
                // updating the positions (otherwise getComponentsInDirection won't work)
                componentsBelow.each(function (ea) {
                    ea.move(distanceToMove, pt(_this.getPosition().x, aggregatedY + _this.componentOffset).addPt(pt(0, _this.getExtent().y)).y)
                });
                this.setPosition(this.getPosition().addPt(pt(0, distanceToMove)));
            }
        } else if (y < 0) {
            distanceToMove = y;
            // determine how far we can actually move to the top
            // if we can't move for the full y, take the furthest that is possible
            componentsAbove.each(function (ea) {
                distanceToMove = Math.max(distanceToMove, ea.getPosition().y + ea.getExtent().y + _this.componentOffset -  _this.getPosition().y);
            });
            // update the position accordingly and move the components below to the top as well
            this.setPosition(_this.getPosition().addPt(pt(0, distanceToMove)));
            componentsBelow.each(function (ea) {
                ea.move(distanceToMove)
            });
        }
    },

    getAllComponents: function() {
        return $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.DataFlowComponent;
        });
    },
    
    createMinimizer: function() {
        var minimizer = new lively.morphic.Charts.Minimizer();
        minimizer.setPosition(pt(this.getExtent().x - 27, 8));
        minimizer.layout = {moveHorizontal: true}
        
        return minimizer;
    },

    
    
    onDrag: function($super) {
        $super();
        var previewMorph = $morph("PreviewMorph" + this);
        var previewPos = this.calculateSnappingPosition();
        var previewExtent = this.calculateSnappingExtent();
        previewMorph.setPosition(previewPos);
        previewMorph.setExtent(previewExtent);

        this.realignAllComponents();
    },
    
    onDropOn: function($super, aMorph) {
        $super();
        if (aMorph == $world) {
            var newpos = this.calculateSnappingPosition();
            var newext = this.calculateSnappingExtent();
            this.setPosition(newpos);
            this.setExtent(newext);
        }

        var componentsAbove = this.getComponentsInDirection(-1);
        componentsAbove.concat(this.savedUpperNeighbors).each(function (neighbor) {
            neighbor.refreshConnectionLines();
        });
        this.savedUpperNeighbors = null;

        this.drawAllConnectionLines();
        this.notifyNeighborsOfDragEnd();
        this.notify();
        this.wasDragged = false;
    },
    
    update: function() {
        this.refreshData();
        
        var text = this.get("ErrorText");
        text.setTextString("");
        text.error = null;
        
        var promise;
        try {
            promise = this.updateComponent();
            this.applyDefaultStyle();
            
        } catch (e) {
            this.applyErrorStyle();
            if (!e.alreadyThrown){
                this.throwError(e);
            }
            return;
        }
        
        var _this = this;
        promise.done(function() {
            if (arguments.length == 1) {
                _this.data = arguments[0];
            } else {
                _this.data = arguments;
            }
            _this.notifyNextComponent();
        }).fail(function () {
            //don't propagate
        });
    },
    
    notifyNextComponent: function() {
        
        if (this.called>1000){
            return;
        }
        this.called = (this.called || 0)+1;
        var _this = this;
        setTimeout(function(){
            _this.called = 0;
        },10000);
        console.log(this.called);

        this.arrows.each(function (arrow){
            if (arrow.isActive()) {
                if (arrow.connectionLine) {
                    arrow.connectionLine.updateViewer(_this.data);
                }
                
                var dependentComponent = _this.getComponentInDirectionFrom(1, arrow.getPositionInWorld());
                if (dependentComponent) {
                    dependentComponent.notify();
                }
            }  
        });
        if (this.arrows.length == 0){
            //alert("Component has no arrows.");
        }
    },
    
    onContentChanged: function() {
        this.notify();
    },

    notify: function() {
        this.update();
    },
    
    onComponentChanged: function() {
        var wait = 1000;
        var now = new Date;
        
        var _this = this;
        var doIt = function() {
            _this.notify();
            _this.previous = now;
        }
        
        if (!this.previous) {
            doIt();
            return;
        }
        
        var previous = this.previous;
        
        var remaining = wait - (now - previous);
        
        if (remaining <= 0) {
            doIt();
        } else {
            // setTimeout and check that we only have one at a time
            if (!this.currentTimeout){
                this.currentTimeout = setTimeout(function() {
                    doIt();
                    _this.currentTimeout = null;
                }, remaining);
            }
        }
    },
    calculateSnappingExtent: function(ignoreComponentAbove) {

        var componentAbove = this.getComponentInDirection(-1);
        var oldExtent = this.getExtent();
        var offsetX = 0;
        var offsetY = 0;
        
        // Find the nearest fitting snapping extent
        if (oldExtent.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (oldExtent.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }

        if (componentAbove && !ignoreComponentAbove && !componentAbove.isMerger()) {
            // calculate extent depending on the extent of some other component
            return pt(componentAbove.getExtent().x, Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY);
        } else {
            // calculate new extent depending on raster
            var x = Math.floor(oldExtent.x / this.gridWidth) * this.gridWidth + offsetX;
            var y = Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY;
            return pt(x,y);
        }
    },

    
    refreshData: function() {
        var componentAbove = this.getComponentInDirection(-1);
        if (componentAbove){
            this.data = componentAbove.getData(this);
        } else {
            this.data = null;
        }
    },
    
    getComponentInDirectionFrom: function(direction, point) {
        // direction should be an int, which indicates the vertical direction
        // -1 is up and 1 is down
        var allComponents = this.getAllComponents();
        var closestComponent = null;

        // choose the top middle point as myPosition as default
        var myPosition = point || this.globalBounds().topCenter();
        var _this = this;
        allComponents.forEach(function(el) {
            if (el == _this || el.isBeingDragged)
                return;
            
            var elPosition = el.getPositionInWorld();
            
            // check for the nearest component straight above or below myPosition
            if (-direction * elPosition.y <= -direction * myPosition.y &&
                elPosition.x <= myPosition.x && elPosition.x + el.getExtent().x >= myPosition.x) {
                
                if (closestComponent == null || -direction * elPosition.y > -direction * closestComponent.getPositionInWorld().y)
                    closestComponent = el;
            }
        });
        return closestComponent;
    },
    adjustForNewBounds: function() {
        // resizeVertical, resizeHorizontal, moveVertical, moveHorizontal
        if (this.getLayouter()) {
            this.applyLayout();
            return;
        }

        var newExtent = this.getShape().getBounds().extent();
        if (!this.priorExtent) {
            this.priorExtent = newExtent;
            return;
        }

        var scalePt = newExtent.scaleByPt(this.priorExtent.invertedSafely()),
            diff = newExtent.subPt(this.priorExtent);

        for (var i = 0; i < this.submorphs.length; i++) {
            var morph = this.submorphs[i], spec = morph.layout;
            if (!spec) continue;
            var moveX = 0, moveY = 0, resizeX = 0, resizeY = 0;

            if (spec.centeredHorizontal)
                moveX = this.innerBounds().center().x - morph.bounds().center().x;
            if (spec.centeredVertical)
                moveY = this.innerBounds().center().y - morph.bounds().center().y;

            if (spec.moveHorizontal) moveX = diff.x;
            if (spec.moveVertical) moveY = diff.y;
            if (spec.resizeWidth) resizeX = diff.x;
            if (spec.resizeHeight) resizeY = diff.y;

            if (spec.scaleHorizontal || spec.scaleVertical) {
                var morphScale = pt(
                    spec.scaleHorizontal ? scalePt.x : 1,
                    spec.scaleVertical ? scalePt.y : 1);
                morph.setPosition(morph.getPosition().scaleByPt(morphScale));
                morph.setExtent(morph.getExtent().scaleByPt(morphScale));
            }

            if (moveX || moveY) morph.moveBy(pt(moveX, moveY));
            if (resizeX || resizeY) morph.setExtent(morph.getExtent().addXY(resizeX, resizeY));
        }

        this.priorExtent = newExtent;
    },


    
    onCreateFromPartsBin: function() {
        var _this = this;
        setTimeout(function () {
            if ($world.firstHand().isPressed()) {
                _this.onDragStart({hand: $world.firstHand()});
                $world.draggedMorph = _this;
            }
        }, 10);
    },
    
    setExtent: function($super, newExtent) {
        var oldExtent = this.getExtent();
        $super(newExtent);
        
        if (!this.isMerger() && this.arrows) {
            this.arrows.each(function (arrow){
                 arrow.positionAtMorph();
            });
        }

        this.adjustForNewBounds();
        
        // Before added to the world, we don't want to inform other components of changing extent
        if (this.owner) {
            var _this = this;
            var componentsBelow = this.getComponentsInDirection(1);
            componentsBelow.each(function (c) {
                c.move(newExtent.y - oldExtent.y, _this.getPosition().y + newExtent.y);
            });
        }
        
        var previewMorph = $morph("PreviewMorph" + this);
        if (previewMorph) {
            var previewExtent = this.calculateSnappingExtent(true);
            previewMorph.setExtent(previewExtent);
        }
    },

    throwError: function(error) {
        var text = this.get("ErrorText");
        text.setTextString(error.toString());
        text.error = error;
        error.alreadyThrown = true;
        throw error;
    },
       
    getData : function(target){
        
        var arrowToTarget = this.arrows.detect(function (arrow){
            var arrowX =  arrow.getTipPosition().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        if (arrowToTarget && arrowToTarget.isActive()) {
            return this.data;
        }
        return null;
    },

    getCachedPosition : function() {
        // cached position for automatic layouting
        return this.cachedPosition || this.getPosition();
    },
    
    migrateFrom : function(oldComponent){
        this.setExtent(oldComponent.getExtent());
        this.setPosition(oldComponent.getPosition());
        this.arrows = oldComponent.arrows;
        this.data = oldComponent.data;
        
        this.content.migrateFromPart(oldComponent);
        oldComponent.remove();
        $world.addMorph(this);
    },

    getBodyCSS : function() {
        return ".ComponentBody {\
            background-color: rgb(255, 255, 255) !important;\
            border-bottom-left-radius: 5px !important;\
            border-bottom-right-radius: 5px !important;\
            border-width: 1px !important;\
            border-color: rgb(66, 139, 202) !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: 0px !important;\
            margin-left: 0px !important;\
            margin-right: 0px !important;\
            margin-top: 0px !important;\
            padding-bottom: 0px !important;\
            padding-left: 0px !important;\
            padding-right: 0px !important;\
            padding-top: 0px !important;\
            position: relative !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
            box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
        }";
    },
    
    getErrorBodyCSS : function() {
        return ".ComponentBody {\
            background-color: rgb(255, 255, 255) !important;\
            border-bottom-left-radius: 5px !important;\
            border-bottom-right-radius: 5px !important;\
            border-width: 1px !important;\
            border-color: rgb(235, 204, 209) !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: 0px !important;\
            margin-left: 0px !important;\
            margin-right: 0px !important;\
            margin-top: 0px !important;\
            padding-bottom: 0px !important;\
            padding-left: 0px !important;\
            padding-right: 0px !important;\
            padding-top: 0px !important;\
            position: relative !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
            box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
        }";
    },
    
    
    getHeaderCSS: function() {
        return	".ComponentHeader { \
            background-color: rgb(66, 139, 202); !important; \
            color: white !important; \
            border-top-left-radius: 4px !important; \
            border-top-right-radius: 4px !important;\
            background-attachment: scroll !important;\
            background-clip: border-box !important;\
            background-image: none !important;\
            background-origin: padding-box !important;\
            background-size: auto !important;\
            border-bottom-color: rgb(66, 139, 202) !important;\
            border-bottom-style: solid !important;\
            border-bottom-width: 1px !important;\
            border-image-outset: 0px !important;\
            border-image-repeat: stretch !important;\
            border-image-slice: 100% !important;\
            border-image-source: none !important;\
            border-image-width: 1 !important;\
            border-left-color: rgb(66, 139, 202) !important;\
            border-left-style: solid !important;\
            border-left-width: 1px !important;\
            border-right-color: rgb(66, 139, 202) !important;\
            border-right-style: solid !important;\
            border-right-width: 1px !important;\
            border-top-color: rgb(66, 139, 202) !important;\
            border-top-style: solid !important;\
            border-top-width: 1px !important;\
            box-sizing: border-box !important;\
            color: rgb(255, 255, 255) !important;\
            cursor: auto !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: -1px !important;\
            padding-bottom: 10px !important;\
            padding-left: 10px !important;\
            padding-right: 15px !important;\
            padding-top: 2px !important;\
            position: relative !important;\
            text-decoration: none solid rgb(255, 255, 255) !important;\
            z-index: 2 !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            border-width: 1px !important;\
        }";
    },
    
    getErrorHeaderCSS: function() {
        return	".ComponentHeader { \
            background-color: rgb(235, 204, 209); !important; \
            color: white !important; \
            border-top-left-radius: 4px !important; \
            border-top-right-radius: 4px !important;\
            background-attachment: scroll !important;\
            background-clip: border-box !important;\
            background-image: none !important;\
            background-origin: padding-box !important;\
            background-size: auto !important;\
            border-bottom-color: rgb(235, 204, 209) !important;\
            border-bottom-style: solid !important;\
            border-bottom-width: 1px !important;\
            border-image-outset: 0px !important;\
            border-image-repeat: stretch !important;\
            border-image-slice: 100% !important;\
            border-image-source: none !important;\
            border-image-width: 1 !important;\
            border-left-color: rgb(235, 204, 209) !important;\
            border-left-style: solid !important;\
            border-left-width: 1px !important;\
            border-right-color: rgb(235, 204, 209) !important;\
            border-right-style: solid !important;\
            border-right-width: 1px !important;\
            border-top-color: rgb(235, 204, 209) !important;\
            border-top-style: solid !important;\
            border-top-width: 1px !important;\
            box-sizing: border-box !important;\
            color: rgb(255, 255, 255) !important;\
            cursor: auto !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: -1px !important;\
            padding-bottom: 10px !important;\
            padding-left: 10px !important;\
            padding-right: 15px !important;\
            padding-top: 2px !important;\
            position: relative !important;\
            text-decoration: none solid rgb(255, 255, 255) !important;\
            z-index: 2 !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            border-width: 1px !important;\
        }";
    },
});

lively.morphic.Charts.Content.subclass("lively.morphic.Charts.LinearLayout", {
    
    initialize: function($super) {
        $super();
        this.description = "LinearLayout";
        this.extent = pt(600, 600);
        
        this.setFill(Color.white);
        this.OFFSET = 20;
        this.currentX = this.OFFSET;
        this.setName("LinearLayout");
        this.layout = {
            resizeHeight: true,
            resizeWidth: true
        }
    },
    
    addElement: function(element){
        var morph = element.morph.duplicate();
        morph.setPosition(pt(this.currentX, this.getExtent().y - morph.getExtent().y));
        this.currentX = this.currentX + morph.getExtent().x + this.OFFSET;
        this.addMorph(morph);
    },
    
    clear: function(){
        this.currentX = this.OFFSET;
        this.removeAllMorphs();
    },
    
    update: function(data) {
        // create linear layout containing rects from data
        this.clear();
        var _this = this;
        data.each(function(ea) {
            _this.addElement(ea);
        });

        return data;
    }
} );

cop.create('FixLoadingLayer').refineClass(lively.morphic.Layout.TileLayout, {
    basicLayout: function(container, submorphs) {
        try {
        var result = cop.proceed(container, submorphs);
        } catch(e){
            console.log("Error during layout: " + e);
            return null;
        }
        return result;
    }}
).beGlobal();

lively.morphic.Charts.Content.subclass("lively.morphic.Charts.FreeLayout", {
    
    initialize: function($super) {
        $super();
        this.description = "Canvas";
        this.extent = pt(600, 600);
        
        this.setFill(Color.white);
        this.setName("Canvas");
        this.layout = {
            resizeHeight: true,
            resizeWidth: true
        };
    },

    update: function(data) {
        // create linear layout containing rects from data
        this.clear();
        var canvasMorph = new lively.morphic.Box(new rect(0, 0, 10, 10));
        var _this = this;
        data.each(function(datum){
            _this.addElement(datum, canvasMorph);
        });
        this.addMorph(canvasMorph);

        return data;
    },

    addElement: function(element, container) {
        var morph = element.morph.duplicate()
        container.addMorph(morph);
    },

    scale: function() {
        var margin = 15;
        var ownWidth = this.getExtent().x - margin;
        var ownHeight = this.getExtent().y - margin;
        var maxX = 1;
        var maxY = 1;
        
        this.submorphs.forEach(function(morph) {
            var x = morph.getBounds().right();
            var y = morph.getBounds().bottom();
            
            maxX = Math.max(x, maxX);
            maxY = Math.max(y, maxY);
        });
        
        var scaleFactor = Math.min(ownWidth/maxX, ownHeight/maxY);
        
        this.submorphs.forEach(function(morph) {
            var x = morph.getPosition().x * scaleFactor;
            var y = morph.getPosition().y * scaleFactor;
            
            morph.setPosition(pt(x,y));
        });
    },

    onResizeEnd: function($super) {        
        $super();
        this.scale();
    },
    
    clear: function(){
        this.removeAllMorphs();
    }
    
} );

lively.morphic.CodeEditor.subclass('lively.morphic.Charts.CodeEditor',
{
    initialize: function($super) {
        $super();
        this.disableGutter();
    },
    
    boundEval: function(codeStr) {
        var ctx = this.getDoitContext() || this;

        var __evalStatement = "(function() {var arrangeOnPath = " + this.arrangeOnPath + "; var createConnection = " + this.createConnection + "; var arrangeOnCircle = " + this.arrangeOnCircle + "; var data = ctx.component.data; str = eval(codeStr); ctx.data = data; return str;}).call(ctx);"
        
        // see also $super
        
        // Evaluate the string argument in a context in which "this" is
        // determined by the reuslt of #getDoitContext
        var str,
        interactiveEval = function() {
            try {
                return eval(__evalStatement);
            } catch (e) {
                return eval(__evalStatement);
            }
        };
        
        try {
            var result = interactiveEval.call(ctx);
            if (localStorage.getItem("LivelyChangesets:" + location.pathname))
                ChangeSet.logDoit(str, ctx.lvContextPath());
            return result;
        } catch(e) {throw e}
        
    },
        
    onChanged: function() {
        if (!this.isValid())
            return;
        
        var newSession =  this.aceEditor.getSession().toString();
        if (this.oldSession) {
            if (this.oldSession == newSession)
                return;
        }
        this.oldSession = newSession;
        
        this.owner.component.onContentChanged();
    },
    isValid: function() {
        var str = this.getSession();
        try {
            eval("throw 0;" + str);
        } catch (e) {
            if (e === 0)
                return true;
        }
        return false;
    },
    
    doit: function(printResult, editor) {
        var text = this.getSelectionMaybeInComment(),
            result = this.tryBoundEval(text);
        if (printResult) { this.printObject(editor, result); return; }
        
        var sel = this.getSelection();
        if (sel && sel.isEmpty()) sel.selectLine();
        return result;
    },
    
    onKeyUp: function(evt) {
        // deliver CodeEditor context to onChanged
        var _this = evt.getTargetMorph();
        _this.onChanged.apply(_this, arguments);
    },

    
    arrangeOnPath: function(path, entity, rotationCenter) {
    	var morphs = entity.pluck("morph");
	
    	if (!morphs.length)
    	    return;
    	
    	// determine overall length of the path
    	var length = path.reduce(function (sum, cur, i, all) {
    		if (i > 0)
    			return sum + cur.dist(all[i - 1]);
    		else
    			return sum;
    	}, 0);
      
        var distance;
        if (path[0].equals(path[path.length - 1])) {
            // path is closed, leave space between last and first element
    	    distance = length / (morphs.length);
        } else {
            // path is open, distribute elements evenly from start to end
            distance = length / (morphs.length - 1);
        }
        
        // set position of first morph and remove it from the array
        morphs[0].setPosition(path[0]);
        morphs.splice(0, 1);
    
    	var curPt = path[0];
    	var curPathIndex = 1;
    	var rotation = 0;
    
    	morphs.each( function (morph, index) {
    		var distanceToTravel = distance;
    		while (distanceToTravel) {
    			var pieceLength = curPt.dist(path[curPathIndex]);
    			if (pieceLength >= distanceToTravel || index == morphs.length - 1) {
    				var direction = path[curPathIndex].subPt(curPt);
    				curPt = curPt.addPt(direction.normalized().scaleBy(distanceToTravel));
    				morph.setPosition(curPt);
    				if(typeof rotationCenter !== "undefined"){
    				    rotation = rotation + (Math.asin(distance / curPt.dist(rotationCenter)));
			            morph.setRotation(rotation);
    				}
    				distanceToTravel = 0;
    			} else {
    				curPt = path[curPathIndex];
    				curPathIndex++;
    				distanceToTravel -= pieceLength;
    			}
    		}
    	})
    },
    createConnection: function (entity1, entity2, connections) {
        connections.each( function (conn) {
            conn.morph.setEnd = function (point) {this.setVertices([pt(0, 0), point.subPt(this.getPosition())])};
            // var from = conn["get" + entity1]();
            // var to = conn["get" + entity2]();
            var from = conn[entity1];
            var to = conn[entity2];
            if (to.morph && from.morph) {
                connect(from.morph, "position", conn.morph, "setPosition", {});
                connect(to.morph, "position", conn.morph, "setEnd", {});
            }
        });
    },
    
    arrangeOnCircle : function(radius, center, data) {
        var path = [];
        for (var i = 0; i <= 360; i = i + 10){
            var radianMeasure = i/360*2*Math.PI;
            var newPT = center.addPt(pt(Math.cos(radianMeasure) * radius, Math.sin(radianMeasure) * radius));
            path.push(newPT);
        }
        
        return arrangeOnPath(path, data, center);
    }

});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.MorphCreator',
'default category', {
    
    initialize : function($super){
        $super();
        this.description = "MorphCreator";
        this.extent = pt(400, 200);

        this.codeEditor = new lively.morphic.Charts.CodeEditor();
        this.codeEditor.setName("CodeEditor");
        this.codeEditor.setTextString("function map(morph, datum) {\n\tvar e = morph.getExtent(); \n\tmorph.setExtent(pt(e.x, datum * 100))\n}");
        this.codeEditor.layout = {resizeWidth: true, resizeHeight: true};
        this.addMorph(this.codeEditor);
        
        var prototypeMorph = new lively.morphic.Box(new rect(0, 0, 100, 100));
        prototypeMorph.setFill(Color.blue);
        prototypeMorph.setName("PrototypeMorph");
        prototypeMorph.layout = {moveHorizontal: true, moveVertical: true};
        this.addMorph(prototypeMorph);
    },
    
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.codeEditor.setExtent(newExtent.subPt(pt(150, 0)));
        var prototypeMorph = this.getSubmorphsByAttribute("name","PrototypeMorph");
        if (prototypeMorph.length) {
            prototypeMorph[0].setPosition(pt(this.getExtent().x - 125, this.getExtent().y - 140));
        }
    },


    
    update : function($super, data) {
        var _this = this;
        var text = this.get("ErrorText");
        text.setTextString("");
        text.error = null;
        
        if (data) {
            var prototypeMorph = this.get("PrototypeMorph");
            
            (function attachListener() {
                if (prototypeMorph.__isListenedTo == true)
                    return;
                prototypeMorph.__isListenedTo = true;
                
                var methods = ["setExtent", "setFill", "setRotation"];
                
                methods.each(function(ea) {
                   var oldFn = prototypeMorph[ea];
                   
                   prototypeMorph[ea] = function() {
                       oldFn.apply(prototypeMorph, arguments);
                       _this.update();
                   }
                });
            })();
            if (prototypeMorph) {
                var mappingFunction;
                eval("mappingFunction = " + this.codeEditor.getTextString());
                data = data.map(function(ea) {
                    var prototypeInstance = prototypeMorph.copy();
                    mappingFunction(prototypeInstance, ea);
                    // ensure that each datum is a object (primitives will get wrapped here)
                    ea = ({}).valueOf.call(ea);
                    ea.morph = prototypeInstance;
                    return ea;
                });
            } else {
                alert("No morph with name 'PrototypeMorph' found");
            }
            return data;
        }
    },
    
    
    migrateFromPart: function(oldComponent) {
        this.codeEditor.setTextString(oldComponent.content.codeEditor.getTextString());
        var newPrototype = this.getSubmorphsByAttribute("name","PrototypeMorph")[0];
        var oldPrototype = oldComponent.getSubmorphsByAttribute("name","PrototypeMorph")[0];
        var componentBody = this.component.getSubmorphsByAttribute("name","ComponentBody")[0];
        
        newPrototype.remove();
        componentBody.addMorph(oldPrototype);
    }
});
lively.morphic.Charts.Content.subclass('lively.morphic.Charts.Table', {
    
    initialize : function($super){
        $super();
        this.description = "Table";
        this.extent = pt(400,200);
        
        this.clearTable();
         
        this.rows = 0;
        this.columns = 0;
    },
    
    createTable : function(rowCount, columnCount) {
        var spec = {};
        spec.showColHeads = true;
        spec.showRowHeads = false;
            
        var table = new lively.morphic.DataGrid(rowCount, columnCount, spec);
        //set gridmode of table cells to hidden
        table.rows.each(function(row){
            row.each(function(ea){
                ea.setClipMode("hidden");
            });
        });
        
        table.disableGrabbing();
        table.disableDragging();
        
        return table;
    },
    
    updateTable : function(){
        this.submorphs.invoke("remove");
        this.table.setClipMode("auto");
        this.addMorph(this.table);
        this.table.setExtent(this.getExtent());
        this.table.layout = {resizeWidth: true, resizeHeight: true};
    },
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.table.setExtent(newExtent);
    },
    
    update : function(data){
        
        this.clearTable();
        
        if (!Object.isArray(data.first())){
            var attributes = [];
            data.each(function(ea){
                for (var key in ea){
                    attributes.pushIfNotIncluded(key);
                }
            });
            this.table = this.createTable(attributes.length, data.length + 1);
            this.table.setColNames(attributes);
        } else {
            this.table = this.createTable(data[0].length, data.length + 1);
        }
        
        var _this = this;
        data.each(function (ea, col){
            if (Object.isArray(ea)) {
                ea.each(function (el, row){
                    _this.table.atPut(row, col, el.toString())
                });
            } else {
                attributes.each(function (attr, row){
                    _this.table.atPut(row, col, ea[attr] || "-");
                });
            }
            
        });
        this.updateTable();
    },
    
    clearTable : function() {
        this.table = this.createTable(0,0);
        this.updateTable();
    },
    
    onDoubleClick : function() {
        this.updateCellWidth();
    },
    
    onClick : function() {
       
    },
    
    updateCellWidth : function() {
        if(!this.table) return;
        
        var table = this.table;
        var activeCell = table.rows[table.getActiveRowIndex()][table.getActiveColIndex()];
        var oldWidth = activeCell.getExtent().x;
        var newWidth = activeCell.getTextBounds().width + 10;
        var index = table.getActiveColIndex();
        var diff = (newWidth - oldWidth);
        table.setColWidth(index, newWidth);

        //move all columns right of index
        for (var j = index + 1; j < table.rows[0].length; j++) {
            for (var i = 0; i < table.rows.length; i++) {
                var curCell = table.rows[i][j];
                var pos = curCell.getPosition();
                curCell.setPosition(pt(pos.x + diff, pos.y));
            }
        }
    },
    
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.JsonViewer',
'default category', {
    
    initialize: function($super) {   

        $super();
        this.description = "JsonViewer";
        this.extent = pt(400, 200);
        this.objectTree = $world.loadPartItem('ObjectTree', 'PartsBin/BP2013H2');
        this.addMorph(this.objectTree);
    },
    
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.objectTree.setExtent(newExtent.subPt(pt(1, 0)));
    },
    
    update: function(data) {
        this.objectTree.inspect(data);
    }
    
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.Script',
'default category', {
    
    initialize : function($super){
        $super();
        this.description = "Script";
        this.extent = pt(400, 200);

        this.codeEditor = new lively.morphic.Charts.CodeEditor();
        this.codeEditor.setName("CodeEditor");
        this.codeEditor.layout = {
            resizeWidth: true,
            resizeHeight: true
        };
        this.addMorph(this.codeEditor);

    },
    
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.codeEditor.setExtent(newExtent);
    },
    
    update: function(data) {
        this.codeEditor.doitContext = this;
        this.data = data;
        
        if (!this.codeEditor.getSelectionRangeAce())
            return this.data;
        
        var returnValue = this.codeEditor.evalAll();
        
        if (returnValue instanceof Error) {
            this.throwError(returnValue);
        }
        
        // codeEditor saves data in this.data
        return this.data;
    },
    
    migrateFromPart: function(oldComponent) {
        this.codeEditor.setTextString(oldComponent.content.codeEditor.getTextString());
    }
});
lively.morphic.Charts.Script.subclass('lively.morphic.Charts.JsonFetcher', {
    initialize: function($super) {
        $super();
        this.description = "JsonFetcher";
        this.extent = pt(400, 100);
        this.codeEditor.setTextString('data = $.ajax("https://api.github.com/users");');
    },
});


lively.morphic.Charts.DataFlowComponent.subclass('lively.morphic.Charts.Fan',
'default category', {
    
    initialize : function($super, content){
        $super(content);
        // delete Minimizer
        var minimizer = this.getSubmorphsByAttribute("name", "Minimizer");
        if (minimizer.length)
        {
            minimizer[0].remove();
        }
        // delete componentBody
        var componentBody = this.getSubmorphsByAttribute("name", "ComponentBody");
        if (componentBody.length)
        {
            componentBody[0].remove();
        }
    },

    calculateSnappingPosition: function() {
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentAbove;
        if (componentsAbove.length > 0)
            componentAbove = componentsAbove.first();

        if (componentAbove && !componentAbove.isMerger()) {
            // snap below component above
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            var snappingThreshold = 200;
            if (this.getPositionInWorld().y < posBelowComponent.y + snappingThreshold) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            return this.calculateSnappingPositionInGrid();
        }
    },

    calculateSnappingExtent: function(ignoreComponentAbove) {
        
        var componentsAbove = this.getComponentsInDirection(-1);
        var oldExtent = this.getExtent();
        var offsetX = 0;
        var offsetY = 0;

        // Find the nearest fitting snapping extent
        if (oldExtent.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (oldExtent.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }
        
        if (componentsAbove.length > 0  && !ignoreComponentAbove) {
            // calculate extent depending on the extent of some other component
            
            if (componentsAbove.length == 1) {
                width = componentsAbove[0].getExtent().x;
            } else {
                var componentXes = componentsAbove.map(function(ea) { return ea.getPosition().x });
                var width = componentXes.max() - componentXes.min();
                width += componentsAbove.last().getExtent().x;
                width = Math.max(100, width);
            }
            return pt(width, Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY);
        } else {
            // calculate new extent depending on raster
            var x = Math.floor(oldExtent.x / this.gridWidth) * this.gridWidth + offsetX;
            var y = Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY;
            return pt(x,y);
        }
    },

    isMerger: function() {
        return true;
    },
    
    updateComponent: function() {
        // nothing needs to be done, just resolve with the old data
        return new $.Deferred().resolve(this.data);
    }
});

lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanIn',
'default category', {

    initialize : function($super){
        var nullContent = new lively.morphic.Charts.NullContent();
        nullContent.description = "FanIn";
        this.extent = pt(400, 100);
        
        $super(nullContent);
        
        this.arrows[0].positionAtMorph();
    },

    refreshData: function() {
        this.data = null;

        var componentsAbove = this.getComponentsInDirection(-1);
        for (var i = 0; i < componentsAbove.length; i++) {
            this.data = this.data || [];
            this.data.push(componentsAbove[i].getData(this));
        }
    },
});
lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanOut',
'default category', {
    
    initialize : function($super){
        var nullContent = new lively.morphic.Charts.NullContent();
        nullContent.description = "FanOut";
        this.extent = pt(400, 100);
        
        $super(nullContent);

        //delete arrow
        this.arrows[0].remove();
        this.arrows.clear();
    },

    refreshData: function() {
        this.data = null;

        // take the first component to the top
        // if there are multiple ones take the first from the left
        var componentAbove = this.getComponentInDirection(-1);
        if (componentAbove)
            this.data = componentAbove.getData(this);
    },

    getData : function(target){
        var arrowToTarget = this.arrows.detect(function (arrow){
            var arrowX =  arrow.getTipPosition().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        
        if (!arrowToTarget){
            //create new arrow for this target
            var offset = this.getPosition().x;
            var positionX = target.getExtent().x / 2 + target.getPosition().x - 20 - offset;
            var newArrow = new lively.morphic.Charts.Arrow(this, positionX);
            newArrow.activate();
            return this.data;
        }
        
        if (arrowToTarget.isActive()) {
            return this.data;
        }
        
        return null;
    }
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Minimizer",
{
    initialize: function($super) {
        $super();
        
        var width = 20;
        var height = 8;
        
        this.setFillOpacity(0);
        this.setExtent(pt(width, height));
        this.setName("Minimizer");
        this.orientation = "up";
        
        var vertices = [pt(0, height), pt(width / 2, 0), pt(width, height)];
        this.line = new lively.morphic.Path(vertices);
        this.line.setBorderColor(Color.white);
        this.line.setBorderWidth(2);
        
        this.addMorph(this.line);
        this.submorphs[0].disableEvents();
        
    },
    
onMouseUp: function(evt) {

        var component = this.owner.owner;
        
        if (evt.isLeftMouseButtonDown() && !evt.isCtrlDown()) {
            if (component.isMinimized) {
                component.setExtent(pt(component.getExtent().x, component.maximizedHeight));
                component.componentBody.setVisible(true);
                component.isMinimized = false;
            } else {
                component.maximizedHeight = component.getExtent().y;
                component.componentBody.setVisible(false);
                component.setExtent(pt(component.getExtent().x, 24 + 6));
                component.isMinimized = true;
            }
            this.flip();
        }
        
    },
    flip: function() {
        
        var points = this.submorphs[0].getControlPoints();
        var width = this.getExtent().x;
        var height = this.getExtent().y;
        
        if (this.orientation === "up") {
            points[0].setPos(pt(0, 0));
            points[1].setPos(pt(width / 2, height));
            points[2].setPos(pt(width, 0));
            this.orientation = "down";
        } else {
            points[0].setPos(pt(0, height));
            points[1].setPos(pt(width / 2, 0));
            points[2].setPos(pt(width, height));
            this.orientation = "up";
        }
        
    },
    
    applyDefaultStyle: function() {
        this.line.setBorderColor(Color.white);
    },
    
    applyErrorStyle: function() {
        this.line.setBorderColor(Color.rgb(169, 68, 66));
    }
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Closer",
{
    initialize: function($super) {
        $super();
        
        var width = 8;
        var height = 8;
        
        this.setFillOpacity(0);
        this.setExtent(pt(width, height));
        this.setName("Closer");
        
        var vertices = [pt(0, 0), pt(width, height)];
        var line = new lively.morphic.Path(vertices);
        line.setBorderColor(Color.white);
        line.setBorderWidth(2);
        this.addMorph(line);
        
        vertices = [pt(0, height), pt(width, 0)];
        line = new lively.morphic.Path(vertices);
        line.setBorderColor(Color.white);
        line.setBorderWidth(2);
        this.addMorph(line);
        
        this.submorphs[0].disableEvents();
        this.submorphs[1].disableEvents();
        
    },
    
    onMouseUp: function(evt) {

        var component = this.owner.owner;
        
        if (evt.isLeftMouseButtonDown() && !evt.isCtrlDown()) {
            component.remove();
        }
    },
});

Object.subclass('lively.morphic.Charts.EntityFactory',
'default category', {

    initialize: function($super) { },

    createEntityTypeFromList : function(entityTypeName, list, identityFunction) {

        var createEntityTypeFromList, _makeEntityType, _clearBackReferences, _addBackReferencesTo, __extractEntityTypeFromList, __extractEntityFromAttribute;

        createEntityTypeFromList = function(entityTypeName, list, identityFunction) {
          return _makeEntityType(entityTypeName, list);
        };

        __extractEntityFromAttribute = function (entityTypeName, identityFunction, sourceName) {
          return this.extractEntityFromList(entityTypeName, identityFunction, sourceName, true);
        };

        __extractEntityTypeFromList = function (entityTypeName, identityFunction, sourceListName, noArray) {
            var isFunction = function (functionToCheck) {
               var getType = {};
               return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
            };

          if (!isFunction(identityFunction)) {
              var attr = identityFunction;

              identityFunction = function(ea) { return ea[attr] };
          }

          var currentEntityType = this;
          var allNewEntities = {};

          var _getOrAdd = function(file) {
              var id = identityFunction(file);
              if (allNewEntities[id])
                  return allNewEntities[id];
              else {
                  allNewEntities[id] = file;
                  return file;
              }
          };

          // clearBackReferences
          currentEntityType.getAll().each(function(eachCurrentEntity) {
            var newEntities;
            if (noArray) {
              var eachNewEntity = eachCurrentEntity[sourceListName];
              currentEntityType._clearBackReferences(eachNewEntity);
            } else {
              newEntities = eachCurrentEntity[sourceListName];
              newEntities.each(function(eachNewEntity, index) {
                currentEntityType._clearBackReferences(eachNewEntity);
              });
            }
          });

          currentEntityType.getAll().each(function(eachCurrentEntity) {
            var newEntities;
            if (noArray) {
              var eachNewEntity = eachCurrentEntity[sourceListName];
              // replace the reference in the array to avoid multiple objects for the same entity
              eachCurrentEntity[sourceListName] = _getOrAdd(eachNewEntity);
              currentEntityType._addBackReferencesTo(eachNewEntity, eachCurrentEntity);
            } else {
              newEntities = eachCurrentEntity[sourceListName];
              newEntities.each(function(eachNewEntity, index) {
                eachNewEntity = _getOrAdd(eachNewEntity);
                // replace the reference in the array to avoid multiple objects for the same entity
                newEntities[index] = eachNewEntity;
                currentEntityType._addBackReferencesTo(eachNewEntity, eachCurrentEntity);
              });
            }
          });
    
          // convert to array
          allNewEntities = Properties.own(allNewEntities).map(function(key) {return allNewEntities[key]})

          return _makeEntityType(entityTypeName, allNewEntities);
        };

        _makeEntityType = function(entityTypeName, list) {

          var Entity = {
            items : list,
            entityTypeName : entityTypeName,
            itemsProto : {}
          };

          var proto = {
            extractEntityFromList : __extractEntityTypeFromList,
            extractEntityFromAttribute : __extractEntityFromAttribute,
            _addBackReferencesTo : _addBackReferencesTo,
            _clearBackReferences : _clearBackReferences,
            getAll : function() { return Entity.items }
          };

          Entity.__proto__ = proto;

          Entity.setIdentityAttribute = function(attributeGetter) {

            Entity.items = Entity.getAll().uniqBy(function(a, b) { return attributeGetter(a) == attributeGetter(b) });

            // Entity.getIdentity = ... ?

            return Entity.items;
          };

          Entity.mapTo = function() {
            console.warn("yet to implement");
          }

          return Entity;
        };
        
        _clearBackReferences = function(entity) {
            var attribute = "referencing" + this.entityTypeName + "s";
            entity[attribute] = [];
        };

        _addBackReferencesTo = function(entity, reference) {

          var attribute = "referencing" + this.entityTypeName + "s";

          if (!entity[attribute])
            entity[attribute] = [];

          entity[attribute].push(reference);

          Object.defineProperty(entity, attribute, {
            enumerable: false,
            writable: true
          });

          entity["get" + this.entityTypeName + "s"] = function() {
            return this[attribute];
          };

          return entity;
        };

        return _makeEntityType(entityTypeName, list);
    },



});

}) // end of module
