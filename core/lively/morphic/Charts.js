module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.ide.CodeEditor', 'lively.morphic.Widgets', 'cop.Layers').toRun(function() {

lively.morphic.Path.subclass("lively.morphic.Charts.Arrow", {
    
    initialize: function($super, aMorph) {
        this.componentMorph = aMorph;
        var arrowHeight = 10, arrowBase = 20;
        this.isLayoutable = false;
        var controlPoints;
        controlPoints = [pt(000, 000), pt(2 * arrowBase, 000), pt(arrowBase, arrowHeight), pt(000, 000)];
        
        $super(controlPoints);
        this.setBorderColor(Color.rgb(94,94,94));
        this.deactivate();
        this.positionAtMorph();
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
    
    positionAtMorph: function() {
        var aMorph = this.componentMorph;
        var extent = aMorph.getExtent();
        
        var offsetX = (extent.x - this.getExtent().x) / 2;
        var offsetY = extent.y;
        
        this.setPosition(pt(offsetX, offsetY));
        aMorph.addMorph(this);
    },
    
    activate: function() {
        this.activated = true;
        this.componentMorph.onArrowActivated();
        this.setFill(Color.rgbHex("77D88B"));
    },
    
    deactivate: function() {
        this.activated = false;
        this.componentMorph.onArrowDeactivated(this);
        this.setFill(Color.rgb(94,94,94));
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.toggle();
        } else if (e.isRightMouseButtonDown()) {
            var _this = this;
            
            var componentNames = ["ScriptFlowComponent", "MergeScript", "JsonViewer", "LinearLayoutViewer", "PrototypeComponent", "JsonFetcher"];
            
            var contextItems = componentNames.map(function(ea) {
                return [ea, function() {
                    _this.activate();
                    _this.createComponentWithOffset(ea);
                    _this.componentMorph.notifyNextComponent();
                }];
            });
            
            var menu = new lively.morphic.Menu("Add new data flow component", contextItems);
            menu.openIn($world, e.scaledPos);
        }
    },
    
    createComponentWithOffset: function(componentName) {
        var newComponent = $world.loadPartItem(componentName, 'PartsBin/BP2013H2');
        var extent =  this.componentMorph.getExtent();
        var offset = pt(0,extent.y + 20);
        
        newComponent.setPosition(
            this.componentMorph.getPosition().addPt(offset)
        );
        
        $world.addMorph(newComponent);
    }
});

lively.morphic.Morph.subclass("lively.morphic.Charts.LinearLayout", {
    
    initialize: function($super, w, h) {
        $super();
        this.setFill(Color.white);
        this.setExtent(pt(w, h));
        this.OFFSET = 20;
        this.currentX = this.OFFSET;
    },
    
    addElement: function(element){
        element.setPosition(pt(this.currentX, this.getExtent().y - element.getExtent().y));
        this.currentX = this.currentX + element.getExtent().x + this.OFFSET;
        this.addMorph(element);
        return this.currentX;
    },
    
    clear: function(){
        this.currentX = this.OFFSET;
        this.removeAllMorphs();
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
        return result
undefined},
}).beGlobal();

lively.morphic.Morph.subclass("lively.morphic.Charts.FreeLayout", {
    
    initialize: function($super, w, h) {
        $super();
        this.setFill(Color.white);
        this.setExtent(pt(w, h));
    },
    
    addElement: function(element){
        this.addMorph(element);
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
        ctx.refreshData();
        
        var __evalStatement = "(function() {var data = ctx.data; str = eval(codeStr); ctx.data = data; return str;}).call(ctx);"
        
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
        
        var ownerChain = this.ownerChain();

        for (var i = 0; i < ownerChain.length; i++) {       
            if (ownerChain[i] instanceof lively.morphic.Charts.Component){
                ownerChain[i].onComponentChanged();     
                break;      
          }       
        }
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
        
        // if (result && result instanceof Error && lively.Config.get('showDoitErrorMessages') && this.world()) {
        //     this.world().alert(String(result));
        // }
        
        var sel = this.getSelection();
        if (sel && sel.isEmpty()) sel.selectLine();
        return result;
    },
    
    onKeyUp: function(evt) {
        var _this = evt.getTargetMorph();
        _this.onChanged.apply(_this, arguments);
    }
 
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Component", {
    initialize: function($super) {
        $super();

        this.arrows = [new lively.morphic.Charts.Arrow(this)];
         
        this.setExtent(pt(500, 250));
        this.setFill(this.backgroundColor);
        this.setBorderColor(this.borderColor);
        this.setBorderWidth(3);
        this.propagationEnabled = true;
        this.data = null;
        
        this.createLabel();
        this.createErrorText();
        this.createMinimizer();

        this.addScript(function updateComponent() {
            // put your code here
        });

        this.setLayouter(new lively.morphic.Layout.TileLayout());
        this.layout.layouter.spacing = 3;
    },
    
    backgroundColor: Color.rgb(207,225,229),
    borderColor: Color.rgb(94,94,94),
    
    notifyNeighborsOfDragStart: function() {
        this.neighbors = [];
        var neighbor;
        
        var _this = this;
        this.arrows.each(function(arrow){
            neighbor = _this.getComponentInDirection(1, arrow.getPosition());
            if (neighbor) {
                _this.neighbors.push(neighbor);
            }
        });
    },
    
    notifyNeighborsOfDragEnd: function() {
        var neighbor;
        
        var _this = this;
        this.arrows.each(function (arrow){
            if (arrow.isActive()) {
                neighbor = _this.getComponentInDirection(1, arrow.getPosition());
                if (neighbor) {
                    neighbor.notify();
                }
            }
            _this.neighbors.each(function(ea) {
                ea.notify();
            });
        });
    },
    
    onArrowActivated: function() {
        this.update();
    },
    
    onArrowDeactivated: function(arrow) {
        var component = this.getComponentInDirection(1, arrow.getPosition());
       
        if (component) {
            component.notify();
        }
    },
    
    setPropagateResizing: function(bool) {
        this.propagateResizing = bool;
    },
    
    shouldPropagateResizing: function() {
        return this.propagateResizing;
    },
    
    setPropagatedExtent: function(newExtent, resizeType) {
        // just use the x-component for setting the propagated extent
        this.setExtent(pt(newExtent.x,this.getExtent().y), resizeType);
    },
    
    calculateSnappingPosition: function() {
        // Snap to position below component above, if there is one
        
        var componentAbove = this.getComponentInDirection(-1);

        var preview = $morph("PreviewMorph" + this);
        if (componentAbove) {
            // snap below component above
            if (preview) {
                preview.setExtent(this.calculateSnappingExtent());
            }
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            if (this.getPositionInWorld().y < componentAbove.getPosition().y + componentAbove.getExtent().y + this.componentOffset + 200) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            // snap to the grid
            if (preview) {
                preview.setExtent(this.getExtent());
            }
            return this.calculateSnappingPositionInGrid();
        }
    },
    
    calculateSnappingPositionInGrid: function() {
        var pos = this.getPositionInWorld();
        var offsetX = 0;
        var offsetY = 0;
        
        // Find the nearest fitting snapping point
        if (pos.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (pos.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }
        return pt(Math.floor(pos.x/this.gridWidth)*this.gridWidth + offsetX,Math.floor(pos.y/this.gridWidth)*this.gridWidth + offsetY);
    },
    
    addPreviewMorph: function() {
        // adds the preview morph directly behind the component
        var morph = new lively.morphic.Box(rect(0,0,0,0));
        morph.setName("PreviewMorph" + this);
        morph.setPosition(this.getPositionInWorld());
        morph.setExtent(this.getExtent());
        morph.setBorderWidth(1);
        morph.setBorderColor(Color.black);
        morph.setBorderStyle('dashed');
        $world.addMorph(morph,this);
        this.previewAdded = true;
    },
    
    removePreviewMorph: function() {
        if (this.previewAdded) {
            $morph("PreviewMorph" + this).remove();
            this.previewAdded = false;
        }
    },
    
    onResizeStart: function() {
        // nothing to do for now
    },
    
    onResizeEnd: function() {
        this.setPropagateResizing(false);
        var newExtent = this.calculateSnappingExtent();
        this.setExtent(newExtent, this.resizingFrom);
        if (this.resizingFrom === "propagatedFromAbove" || this.resizingFrom === "active") {
            var componentBelow = this.getComponentInDirection(1);
            if (componentBelow) {
                componentBelow.onResizeEnd();
            }
        }
        if (this.resizingFrom === "propagatedFromBelow" || this.resizingFrom === "active") {
            var componentAbove = this.getComponentInDirection(-1);
            if (componentAbove) {
                componentAbove.onResizeEnd();
            }
        }
        
        this.removePreviewMorph();
        this.setOpacity(1);
        this.setPropagateResizing(true);
    },
    
    onDragStart: function($super, evt) {
        $super(evt);
        this.addPreviewMorph();
        this.setOpacity(0.7);
        this.notifyNeighborsOfDragStart();
    },
    
    onDragEnd: function($super, evt) {
        $super(evt);
        // positioning is done in onDropOn
        this.notifyNeighborsOfDragEnd();
        this.removePreviewMorph();
        this.setOpacity(1);
    },
    
    gridWidth: 50,
    
    componentOffset: 20,
    
    isMerger: function() {
        return false;
    },
    
    wantsDroppedMorph: function($super, morphToDrop) {
        if (morphToDrop instanceof lively.morphic.Charts.Component) {
            return false;
        }
        return $super(morphToDrop);
    },
    createErrorText: function() {
        var t = new lively.morphic.Text();
        t.setTextString("");
        t.setName("ErrorText");
        t.setExtent(pt(140, 20));
        t.setPosition(pt(200, 12));
        t.setOrigin(pt(-5, -5));
        t.setFontSize(10);
        t.setFillOpacity(0);
        t.setBorderWidth(0);
        this.addMorph(t);
    },

    createMinimizer: function() {
        var minimizer = new lively.morphic.Charts.Minimizer();
        minimizer.setPosition(pt(this.getExtent().x - 60, 15));
        this.addMorph(minimizer);
    },

    
    
    onDrag: function($super) {
        $super();
        var previewPos = this.calculateSnappingPosition();
        $morph("PreviewMorph" + this).setPosition(previewPos);
        
        this.realignAllComponentsInColumn();
    },
    
    onDropOn: function($super, aMorph) {
        $super();
        if (aMorph == $world) {
            var newpos = this.calculateSnappingPosition();
            this.setPosition(newpos);
            this.setPropagateResizing(false);
            this.resizingFrom = "snapping";
            var newext = this.calculateSnappingExtent();
            this.setExtent(newext, "snapping");
            this.setPropagateResizing(true);
        }
        this.notify();
    },
    

    
    createLabel: function() {
        var t = new lively.morphic.Text();
        t.setTextString("DataFlowComponent");
        t.setName("Description");
        t.setExtent(pt(160, 20));
        t.setPosition(pt(10, 10));
        t.setOrigin(pt(-5, -5));
        t.setFontSize(12);
        t.setFillOpacity(0);
        t.setBorderWidth(0);
        this.addMorph(t);
    },
    

    
    update: function() {
        this.refreshData();

        var promise;
        try {
            promise = this.updateComponent();
            this.setFill(this.backgroundColor); 
        } catch (e) {
            this.setFill(Color.rgb(210, 172, 172));
            if (!e.alreadyThrown){
                this.throwError(e);
            }
            return;
        }
        if (this.propagationEnabled){
            var _this = this;
            if (promise && typeof promise.done == "function") {
                promise.done(function() {
                    _this.notifyNextComponent();
                });
            } else {
                this.notifyNextComponent();
            }
        }
    },
    
    notifyNextComponent: function() {
        var dependentComponent;
        
        var _this = this;
        this.arrows.each(function (arrow){
            if (arrow.isActive()) {
                dependentComponent = _this.getComponentInDirection(1, arrow.getPosition());
                if (dependentComponent) {
                    dependentComponent.notify();
                }
            }  
        });
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
    calculateSnappingExtent: function(forPreview) {
        
        var componentAbove = this.getComponentInDirection(-1);
        var oldExtent = this.getExtent();
        var offsetX = 0;
        var offsetY = 0;
        debugger;
        // Find the nearest fitting snapping extent
        if (oldExtent.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (oldExtent.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }
        
        if (componentAbove) {
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
    
    getComponentInDirection: function(direction, point) {
        // direction should be an int, which indicates the vertical direction
        // -1 is up and 1 is down
        
        var parentMorph = $world;
        
        var allDFComponents = parentMorph.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.Component;
        });
        
        var closestComponent = null;
        
        // choose the top middle point as myPosition as default
        var myPosition = point || this.getPositionInWorld().addPt(pt(this.getExtent().x / 2, 0));
        var _this = this;
        allDFComponents.forEach(function(el) {
            if (el == _this || el.isBeingDragged)
                return;
            
            var elPosition = el.getPositionInWorld();
            
            // check for the nearest DF component straight above or below myPosition
            if (-direction * elPosition.y < -direction * myPosition.y &&
                elPosition.x <= myPosition.x && elPosition.x + el.getExtent().x >= myPosition.x)
                
                if (closestComponent == null || -direction * elPosition.y > -direction * closestComponent.getPositionInWorld().y)
                    closestComponent = el;
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
        this.draggingFromPartsBin = true;
    },
    
    setExtent: function($super, newExtent, resizeType) {
        // if it is a merger: resize this
        // else: only resize if directly initiated
        
        if (!(this.isMerger() && (resizeType == "propagatedFromAbove" || resizeType == "propagatedFromBelow"))) {
            $super(newExtent);
        	this.arrows.each(function (arrow){
            	arrow.positionAtMorph();
        	});
            this.layoutCodeEditor(newExtent);
        }
        
        if (resizeType != "maximized" && !this.previewAdded && !this.draggingFromPartsBin && this.shouldPropagateResizing()) {
            this.addPreviewMorph();
            this.setOpacity(0.7);
        }
        this.draggingFromPartsBin = false;
        
        // resizeType defines what issued the setExtent request.
        // If it is not set, the component itself was resized using the halo,
        // so we try to inform both neighbors. Therefore we set it to "active".
        // If it is "propagatedFromAbove", the request came from above, so we inform the component
        // below, if it is "propagatedFromBelow" the other way around.
        if (!resizeType && !this.isMerger()) {
            resizeType = "active";
        }

        if ((resizeType === "propagatedFromAbove" || resizeType === "active") && this.shouldPropagateResizing() && !this.isMerger()) {
            var componentBelow = this.getComponentInDirection(1);

            if (componentBelow) {
                componentBelow.setPropagatedExtent(newExtent, "propagatedFromAbove");
            }
        }
        
        if ((resizeType === "propagatedFromBelow" || resizeType === "active") && this.shouldPropagateResizing() && !this.isMerger()) {
            var componentAbove = this.getComponentInDirection(-1);

            if (componentAbove) {
                componentAbove.setPropagatedExtent(newExtent, "propagatedFromBelow");
            }
        }
        this.resizingFrom = resizeType;
        this.adjustForNewBounds();
        
        if ($morph("PreviewMorph" + this)) {
            var previewExtent = this.calculateSnappingExtent(true);
            $morph("PreviewMorph" + this).setExtent(previewExtent);
        }
        
        // get the width of the description text to adjust the width of the error text
        var description = this.getSubmorphsByAttribute("name", "Description");
        var descriptionWidth = 150;
        if (description.length) {
            descriptionWidth = description[0].getExtent().x + 70;
        }
        
        var errorText = this.getSubmorphsByAttribute("name", "ErrorText");
        if (errorText.length) {
            errorText[0].setExtent(pt(this.getExtent().x - descriptionWidth, errorText[0].getExtent().y));
        }

    },
    
    throwError: function(error) {
        throw error;
    },
    
    layoutCodeEditor: function(newExtent) {
        var codeEditor = this.getSubmorphsByAttribute("shouldResize", true);
        if (codeEditor.length) {
            codeEditor[0].setExtent(pt(newExtent.x - 7,newExtent.y - 52));
        }
    },
    
    getMorphsInColumn: function(point) {
        var allDFComponents = $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.Component;
        });
        var morphs = [];
        var myPosition = point || this.getPositionInWorld().addPt(pt(this.getExtent().x / 2, 0));
        
        allDFComponents.each(function(el) {
            if (el.isBeingDragged)
                return;

            var elPosition = el.getPositionInWorld();
            
            // check for all DF components equal to and below my position
            if (elPosition.x <= myPosition.x && elPosition.x + el.getExtent().x >= myPosition.x)
                morphs.push(el);
        }, this);
        
        return morphs;
    },
    
    realignAllComponentsInColumn : function() {
        var previewMorph = $morph("PreviewMorph" + this);
        
        // move all morphs below further up and close the eventual existing gap
        var morphs = this.getMorphsInColumn();
        // begin with the top most of them
        morphs.sort(function (a, b) {return a.getPosition().y - b.getPosition().y});

        var lastPosition = 0;
        morphs.each( function (ea) {
            // initialize lastPosition to the one of the first component
            // or the previewMorphs one, if it's at the very top
            if (!lastPosition) {
                if (previewMorph && previewMorph.getPosition().y < ea.getPosition().y)
                    lastPosition = pt(ea.calculateSnappingPosition().x, previewMorph.getPosition().y);
                else
                    lastPosition = ea.calculateSnappingPosition();
            }
            
            // move the component a little bit down and snap to its position
            ea.setPosition(pt(lastPosition.x, lastPosition.y + 5));
            lastPosition = ea.calculateSnappingPosition();

            // if there is a preview morph, move the next component below it
            if (previewMorph && lastPosition.y <= previewMorph.getPosition().y + previewMorph.getExtent().y &&
                lastPosition.y >= previewMorph.getPosition().y) {
                lastPosition = pt(lastPosition.x, previewMorph.getPosition().y + previewMorph.getExtent().y + ea.componentOffset);
            }
            ea.setPosition(lastPosition);
        })
    },
    
    getData : function(target){
        var arrowToTarget = this.arrows.detect(function (arrow){
            var arrowX =  arrow.getPosition().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        if (arrowToTarget && arrowToTarget.isActive()) {
            return this.data;
        }
        return null;
    }
});
lively.morphic.Charts.Component.subclass('lively.morphic.Charts.FanIn',
'default category', {

    getComponentsInDirection : function($super, direction) {
        var components = [];
        var pxInterval = 50;
        
        // choose upper left corner as point
        var currentPoint = this.getPositionInWorld();
        
        var rightBoundary = this.getPositionInWorld().x + this.getExtent().x;
        while (currentPoint.x < rightBoundary) {
            
            var component = this.getComponentInDirection(direction, currentPoint)
    
            if (component)
                components.pushIfNotIncluded(component);
                
            currentPoint = currentPoint.addPt(pt(pxInterval, 0));
        }
    
        return components;
    },
    updateComponent: function() {
        c = this.get("CodeEditor");
        c.doitContext = this;
        
        var text = this.get("ErrorText");
        text.setTextString("");
        text.error = null;
        
        var returnValue = c.evalAll();
        
        if (returnValue instanceof Error) {
            this.throwError(returnValue);
        }
    },
    throwError: function(e) {
        var text = this.get("ErrorText");
        text.setTextString(e.toString());
        text.error = e;
        e.alreadyThrown = true;
        throw e;
    },

    refreshData: function() {
        this.data = null;
    
        var componentsAbove = this.getComponentsInDirection(-1);
        for (var i = 0; i < componentsAbove.length; i++) {
            this.data = this.data || [];
            this.data.push(componentsAbove[i].data);
        }
    },


    // shouldPropagateResizing: function() {
    //     return false;
    // },
    isMerger: function() {
        return true;
    },
    calculateSnappingExtent: function($super, forPreview) {
        
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
        
        if (componentsAbove.length > 0  /*&& !forPreview && (this.shouldPropagateResizing() || this.draggingFromPartsBin || this.resizingFrom === "snapping")*/) {
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
    calculateSnappingPosition: function() {
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentAbove;
        if (componentsAbove.length> 0)
            componentAbove = componentsAbove.first();
        
        var preview = $morph("PreviewMorph" + this);
        if (componentAbove) {
            // snap below components above
            if (preview) {
                preview.setExtent(this.calculateSnappingExtent());
            }
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            if (this.getPositionInWorld().y < componentAbove.getPosition().y + componentAbove.getExtent().y + this.componentOffset + 200) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            // snap to the grid
            if (preview) {
                preview.setExtent(this.getExtent());
            }
            return this.calculateSnappingPositionInGrid();
        }
    },
    onDropOn: function($super, aMorph) {
        $super();
        if (aMorph == $world) {
            var newext = this.calculateSnappingExtent();
            var newpos = this.calculateSnappingPosition();
            this.setPosition(newpos);
            this.setPropagateResizing(false);
            this.resizingFrom = "snapping";
            
            
            this.setExtent(newext, "snapping");
            this.setPropagateResizing(true);
        }
        this.notify();
    },
    
});
lively.morphic.Morph.subclass("lively.morphic.Charts.Minimizer",
{
    initialize: function($super) {
        $super();
        this.setFillOpacity(0);
        this.setExtent(pt(50, 43));
        this.setName("Minimizer");
        var vertices = [];
        vertices.push(pt(10,13));
        vertices.push(pt(25,25));
        vertices.push(pt(40,13));
        this.addMorph(new lively.morphic.Path(vertices));
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown() && !e.isCtrlDown()) {
            
            if (this.owner.getExtent().y == 50) {
                this.owner.setExtent(pt(this.owner.getExtent().x, this.oldY),"maximized");
                var prototype = this.owner.getSubmorphsByAttribute("name", "PrototypeMorph")[0];
                if (prototype)
                    prototype.setVisible(true);
            }
            else {
                this.oldY = this.owner.getExtent().y;
                this.owner.setExtent(pt(this.owner.getExtent().x, 50), "maximized");
                var prototype = this.owner.getSubmorphsByAttribute("name", "PrototypeMorph")[0];
                if (prototype)
                    prototype.setVisible(false);
            }
            this.owner.realignAllComponentsInColumn();
        }
    }
});
}) // end of module
