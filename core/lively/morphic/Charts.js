module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.ide.CodeEditor', 'lively.morphic.Widgets', 'cop.Layers').toRun(function() {

lively.morphic.Path.subclass("lively.morphic.Charts.Arrow", {
    
    initialize: function($super, aMorph) {
        this.componentMorph = aMorph;
        var arrowHeight = 10, arrowBase = 20;
        this.isLayoutable = false;
        var controlPoints = [pt(0, 0), pt(2 * arrowBase, 0), pt(arrowBase, arrowHeight), pt(0, 0)];
        
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
    showContextMenu: function(position) {
        var _this = this;
            
        var componentNames = ["ScriptFlowComponent", "MergeScript", "JsonViewer", "LinearLayoutViewer", "PrototypeComponent", "JsonFetcher"];
        
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
            this.showContextMenu(e.scaledPos);
        }
    },
    
    createComponent: function(componentName) {
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
        return result;
    }}
).beGlobal();

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

        // find owner which is Charts.Component as the CodeEditor could be nested deep inside it
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
        
        var sel = this.getSelection();
        if (sel && sel.isEmpty()) sel.selectLine();
        return result;
    },
    
    onKeyUp: function(evt) {
        // deliver CodeEditor context to onChanged
        var _this = evt.getTargetMorph();
        _this.onChanged.apply(_this, arguments);
    },
    
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
            console.log("Please override updateComponent!");
        });

        this.setLayouter(new lively.morphic.Layout.TileLayout());
        this.layout.layouter.spacing = 3;
    },
    
    backgroundColor: Color.rgb(207,225,229),
    borderColor: Color.rgb(94,94,94),
    errorColor: Color.rgb(210, 172, 172),
    
    notifyNeighborsOfDragStart: function() {
        this.neighbors = [];
        var neighbor;
        
        var _this = this;
        this.arrows.each(function(arrow){
            neighbor = _this.getComponentInDirection(1, arrow.getPositionInWorld());
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
                neighbor = _this.getComponentInDirection(1, arrow.getPositionInWorld());
                if (neighbor) {
                    neighbor.notify();
                }
            }
            _this.neighbors.invoke("notify");
        });
    },
    
    onArrowActivated: function() {
        debugger;
        this.update();
    },
    
    onArrowDeactivated: function(arrow) {
        var component = this.getComponentInDirection(1, arrow.getPositionInWorld());
       
        if (component) {
            component.notify();
        }
    },
    

    

    

    
    calculateSnappingPosition: function() {
        // snap to position below component above, if there is one
        var componentAbove = this.getComponentInDirection(-1);

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
    
    addPreviewMorph: function() {
        var morph = $morph("PreviewMorph" + this);
        if (!morph) {
            // adds the preview morph directly behind the component
            var morph = new lively.morphic.Box(rect(0,0,0,0));
            morph.setName("PreviewMorph" + this);
            morph.setBorderWidth(1);
            morph.setBorderColor(Color.black);
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
        this.removePreviewMorph();
        this.setOpacity(1);
    },
    onResizeStart: function() {
        this.addPreviewMorph();
        this.setOpacity(0.7);
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
    
    gridWidth: 20,
    
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
    getAllComponents: function() {
        return $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.Component;
        });
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
        var previewMorph = $morph("PreviewMorph" + this);
        var previewPos = this.calculateSnappingPosition();
        var previewExtent = this.calculateSnappingExtent();
        previewMorph.setPosition(previewPos);
        previewMorph.setExtent(previewExtent);

        this.realignAllComponentsInColumn();
    },
    
    onDropOn: function($super, aMorph) {
        $super();
        if (aMorph == $world) {
            var newpos = this.calculateSnappingPosition();
            this.setPosition(newpos);
            var newext = this.calculateSnappingExtent();
            this.setExtent(newext);
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
            this.setFill(this.errorColor);
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
        var _this = this;
        this.arrows.each(function (arrow){
            if (arrow.isActive()) {
                var dependentComponent = _this.getComponentInDirection(1, arrow.getPositionInWorld());
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
    
    getComponentInDirection: function(direction, point) {
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
            
            // check for the nearest DF component straight above or below myPosition
            if (-direction * elPosition.y < -direction * myPosition.y &&
                elPosition.x <= myPosition.x && el.getBounds().right() >= myPosition.x) {
                
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
        this.onDragStart({hand: $world.firstHand()});
        $world.draggedMorph = this;
    },
    
    setExtent: function($super, newExtent) {
        $super(newExtent);
        
        if (!this.isMerger()) {
            this.arrows.each(function (arrow){
                 arrow.positionAtMorph();
            });
        }

        this.adjustForNewBounds();
        
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
    

    
    getComponentsInColumn: function(point) {
        var allComponents = this.getAllComponents();
        var morphs = [];
        var myPosition = point || this.globalBounds().topCenter();
        
        allComponents.each(function(el) {
            if (el.isBeingDragged)
                return;

            var elPosition = el.getPositionInWorld();
            
            // check for all DF components equal to and below my position
            if (elPosition.x <= myPosition.x && el.getBounds().right() >= myPosition.x)
                morphs.push(el);
        }, this);
        
        return morphs;
    },
    
    realignAllComponentsInColumn : function() {
        var previewMorph = $morph("PreviewMorph" + this);
        
        // move all components below further up and close the eventual existing gap
        var components = this.getComponentsInColumn();
        // begin with the top most of them
        components.sort(function (a, b) {return a.getPosition().y - b.getPosition().y});

        var lastPosition = 0;
        components.each( function (ea) {
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
            var arrowX =  arrow.getPositionInWorld().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        if (arrowToTarget && arrowToTarget.isActive()) {
            return this.data;
        }
        return null;
    }
});
lively.morphic.Charts.Component.subclass('lively.morphic.Charts.Fan',
'default category', {
    
    initialize : function($super){
        $super();
        //delete Minimizer
        if (this.getSubmorphsByAttribute("name","Minimizer"))
        {
            this.getSubmorphsByAttribute("name","Minimizer")[0].remove();
        }
    },

    getComponentsInDirection : function($super, direction) {
        var components = [];
        var pxInterval = 150;
        
        // choose upper left corner as point
        var currentPoint = this.getPositionInWorld();
        
        var rightBoundary = this.getPositionInWorld().x + this.getExtent().x;
        while (currentPoint.x < rightBoundary) {
            
            var component = this.getComponentInDirection(direction, currentPoint)
    
            if (component) {
                components.pushIfNotIncluded(component);
                currentPoint = pt(component.getBounds().right(), currentPoint.y);
            }
                
            currentPoint = currentPoint.addPt(pt(pxInterval, 0));
        }
    
        return components;
    },
    

    updateComponent: function() {
        // do nothing
    },


    isMerger: function() {
        return true;
    },
    

    
});

lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanIn',
'default category', {

    initialize : function($super){
        $super();
        var label = this.getSubmorphsByAttribute("name","Description")[0];
        label.setTextString("FanIn");
        this.setExtent(pt(this.getExtent().x,50));
    },

    refreshData: function() {
        this.data = null;
    
        var componentsAbove = this.getComponentsInDirection(-1);
        for (var i = 0; i < componentsAbove.length; i++) {
            this.data = this.data || [];
            this.data.push(componentsAbove[i].getData(this));
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
    
    calculateSnappingPosition: function() {
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentAbove;
        if (componentsAbove.length > 0)
            componentAbove = componentsAbove.first();
        
        var preview = $morph("PreviewMorph" + this);
        if (componentAbove && !componentAbove.isMerger()) {
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
    
});
lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanOut',
'default category', {
    
    initialize : function($super){
        $super();

        var label = this.getSubmorphsByAttribute("name","Description")[0];
        label.setTextString("FanOut");
        this.setExtent(pt(this.getExtent().x,50));
    },
    refreshData: function() {
        this.data = null;

        // take the first component to the top
        // if there are multiple ones take the first from the left
        var componentsAbove = this.getComponentsInDirection(-1);
        if (componentsAbove.length) {
            componentsAbove.sort(function (a, b) {
                return b.getPosition().y - a.getPosition().y
            })
            this.data = componentsAbove[0].getData(this);
        }
    },

    
    getData : function(target){
        var arrowToTarget = this.arrows.detect(function (arrow){
            var arrowX =  arrow.getPositionInWorld().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        
        if (!arrowToTarget){
            //create new arrow for this target
            var newArrow = new lively.morphic.Charts.Arrow(this);
            var offset = this.getPosition().x;
            newArrow.setPosition(pt(target.getExtent().x/2+target.getPosition().x-newArrow.getExtent().x/2-offset,newArrow.getPosition().y));
            this.arrows.push(newArrow);
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
        this.setFillOpacity(0);
        this.setExtent(pt(50, 43));
        this.setName("Minimizer");
        this.disableEvents();
        var vertices = [pt(10,13), pt(25,25), pt(40,13)];
        this.addMorph(new lively.morphic.Path(vertices));
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown() && !e.isCtrlDown()) {
            var isMinimized = this.owner.getExtent().y == 60;
            if (isMinimized) {
                this.owner.setExtent(pt(this.owner.getExtent().x, this.oldY), true);
                var container = this.owner.getSubmorphsByAttribute("name","Container");
                if (container.length > 0){
                    container[0].setVisible(true);
                }
            }
            else {
                this.oldY = this.owner.getExtent().y;
                var container = this.owner.getSubmorphsByAttribute("name","Container");
                if (container.length > 0){
                    container[0].setVisible(false);
                }
                this.owner.setExtent(pt(this.owner.getExtent().x, 60), true);
            }

            this.owner.realignAllComponentsInColumn();
        }
    }
});

}) // end of module
