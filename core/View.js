/* Copyright © 2015 David Valdman */

define(function(require, exports, module) {
    var RenderTreeNode = require('samsara/core/nodes/RenderTreeNode');
    var Controller = require('samsara/core/Controller');
    var SizeNode = require('samsara/core/SizeNode');
    var LayoutNode = require('samsara/core/LayoutNode');
    var Transitionable = require('samsara/core/Transitionable');
    var EventHandler = require('samsara/core/EventHandler');
    var SimpleStream = require('samsara/streams/SimpleStream');
    var Stream = require('samsara/streams/Stream');
    var ResizeStream = require('samsara/streams/ResizeStream');
    var SizeObservable = require('samsara/streams/SizeObservable');
    var layoutAlgebra = require('samsara/core/algebras/layout');
    var sizeAlgebra = require('samsara/core/algebras/size');

    /**
     * A View provides encapsulation for a subtree of the scene graph. You can build
     *  complicated visual components and add them to a scene graph as you would a Surface.
     *  In addition to what a Controller provides, a View provides:
     *      Input and output streams in this.input, this.output
     *      An `add` method to build up its internal scene graph
     *      Size methods: `setSize`, `setProportions`
     *      Layout methods: `setOpacity`, `setOrigin`
     *
     * @class View
     * @constructor
     * @extends Core.Controller
     * @uses Core.SizeNode
     * @uses Core.LayoutNode
     * @uses Core.SimpleStream
     */
    var View = Controller.extend({
        _isView : true,
        defaults : {
            size : null,
            origin : null,
            opacity : 1
        },
        events : {
            change : setOptions
        },
        constructor : function View(options){
            this._size = new EventHandler();
            this._layout = new EventHandler();

            this._sizeNode = new SizeNode();
            this._layoutNode = new LayoutNode();

            this._node = new RenderTreeNode();
            this._node.tempRoot = this._node;

            this.size = ResizeStream.lift(
                function ViewSizeAlgebra (sizeSpec, parentSize){
                    if (!parentSize) return false;
                    return (sizeSpec)
                        ? sizeAlgebra(sizeSpec, parentSize)
                        : parentSize;
                },
                [this._sizeNode, this._size]
            );

            var layout = Stream.lift(
                function ViewLayoutAlgebra (parentSpec, objectSpec, size){
                    if (!parentSpec || !size) return false;
                    return (objectSpec)
                        ? layoutAlgebra(objectSpec, parentSpec, size)
                        : parentSpec;
                }.bind(this),
                [this._layout, this._layoutNode, this.size]
            );

            this._node._size.subscribe(this.size);
            this._node._layout.subscribe(layout);

            Controller.apply(this, arguments);
            if (this.options) setOptions.call(this, this.options);
        },
        /**
         * Extends the scene graph subtree with a new node.
         *
         * @method add
         * @param object {SizeNode|LayoutNode|Surface} Node
         * @return {RenderTreeNode}
         */
        add : function add(){
            return RenderTreeNode.prototype.add.apply(this._node, arguments);
        },
        /**
         * Setter for size.
         *
         * @method setSize
         * @param size {Number[]|Stream} Size as [width, height] in pixels, or a stream.
         */
        setSize : function setSize(size){
            this._sizeNode.set({size : size});
        },
        /**
         * Setter for proportions.
         *
         * @method setProportions
         * @param proportions {Number[]|Stream} Proportions as [x,y], or a stream.
         */
        setProportions : function setProportions(proportions){
            this._sizeNode.set({proportions : proportions});
        },
        /**
         * Setter for origin.
         *
         * @method setOrigin
         * @param origin {Number[]|Stream} Origin as [x,y], or a stream.
         */
        setOrigin : function setOrigin(origin){
            this._layoutNode.set({origin : origin});
        },
        /**
         * Setter for opacity.
         *
         * @method setOpacity
         * @param opacity {Number|Stream} Opacity
         */
        setOpacity : function setOpacity(opacity){
            this._layoutNode.set({opacity : opacity});
        }
    });

    function setOptions(options){
        for (var key in options){
            var value = options[key];
            switch (key){
                case 'size':
                    this.setSize(value);
                    break;
                case 'proportions':
                    this.setProportions(value);
                    break;
                case 'origin':
                    this.setOrigin(value);
                    break;
                case 'opacity':
                    this.setOpacity(value);
                    break;
            }
        }
    }

    module.exports = View;
});
