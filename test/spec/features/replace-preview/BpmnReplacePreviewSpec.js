'use strict';

var TestHelper = require('../../../TestHelper');

/* global bootstrapModeler, inject */

var replacePreviewModule = require('../../../../lib/features/replace-preview'),
    modelingModule = require('../../../../lib/features/modeling'),
    coreModule = require('../../../../lib/core');

var Events = require('diagram-js/test/util/Events');

var assign = require('lodash/object/assign');


describe('features/replace-preview', function() {

  var testModules = [ replacePreviewModule, modelingModule, coreModule ];

  var diagramXML = require('../../../fixtures/bpmn/event-sub-processes.bpmn');

  var startEvent_1,
      rootElement,
      Event;

  var getGfx,
      moveShape;

  beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));

  beforeEach(inject(function(canvas, elementRegistry, elementFactory, move, dragging) {

    Event = Events.target(canvas._svg);

    startEvent_1 = elementRegistry.get('StartEvent_1');
    rootElement = canvas.getRootElement();

    /**
     * returns the gfx representation of an element type
     *
     * @param  {Object} elementData
     *
     * @return {Object}
     */
    getGfx = function(elementData) {
      assign(elementData, { x: 0, y: 0 });

      var tempShape = elementFactory.createShape(elementData);

      canvas.addShape(tempShape, rootElement);

      var gfx = elementRegistry.getGraphics(tempShape).clone();

      canvas.removeShape(tempShape);

      return gfx;
    };

    moveShape = function(shape, target, position) {
      var startPosition = { x: shape.x + 10 + (shape.width / 2), y: shape.y + 30 + (shape.height / 2) };

      move.start(Event.create(startPosition), shape);

      dragging.hover({
        element: target,
        gfx: elementRegistry.getGraphics(target)
      });

      dragging.move(Event.create(position));
    };

  }));

  it('should replace visuals at the same position as the replaced visual', inject(function(dragging) {

    // when
    moveShape(startEvent_1, rootElement, { x: 280, y: 120 });

    // then
    var dragGroup = dragging.active().data.context.dragGroup;

    dragGroup[0].attr('display', 'inline');

    expect(dragGroup[0].getBBox()).to.eql(dragGroup[1].getBBox());

  }));


  it('should hide the replaced visual',
    inject(function(dragging) {

    // when
    moveShape(startEvent_1, rootElement, { x: 280, y: 120 });

    // then
    var dragGroup = dragging.active().data.context.dragGroup;

    expect(dragGroup[0].attr('display')).to.equal('none');

  }));


  it('should not replace non-interrupting start event while hover over same event sub process',
    inject(function(dragging, elementRegistry) {

    // given
    var subProcess_1 = elementRegistry.get('SubProcess_1');

    // when
    moveShape(startEvent_1, subProcess_1, { x: 210, y: 180 });

    var context = dragging.active().data.context;

    // then
    // check if the visual representation remains a non interrupting message start event
    var startEventGfx = getGfx({
      type: 'bpmn:StartEvent',
      isInterrupting: false,
      _eventDefinitionType: 'bpmn:MessageEventDefinition'
    });

    expect(context.dragGroup[0].innerSVG()).to.equal(startEventGfx.innerSVG());

  }));


  it('should replace non-interrupting start event while hover over root element',
    inject(function(dragging, elementRegistry) {

    // when
    moveShape(startEvent_1, rootElement, { x: 280, y: 120 });

    var context = dragging.active().data.context;

    // then
    // check if the visual replacement is a blank interrupting start event
    var startEventGfx = getGfx({ type: 'bpmn:StartEvent' });

    expect(context.dragGroup[1].innerSVG()).to.equal(startEventGfx.innerSVG());

  }));


  it('should not replace non-interrupting start event while hover over another event sub process',
    inject(function(dragging, elementRegistry) {

    // given
    var subProcess_2 = elementRegistry.get('SubProcess_2');

    // when
    moveShape(startEvent_1, subProcess_2, { x: 350, y: 120 });

    var context = dragging.active().data.context;

    // then
    // check if the visual representation remains a non interrupting message start event
    var startEventGfx = getGfx({
      type: 'bpmn:StartEvent',
      isInterrupting: false,
      _eventDefinitionType: 'bpmn:MessageEventDefinition'
    });

    expect(context.dragGroup[0].innerSVG()).to.equal(startEventGfx.innerSVG());

  }));


  it('should replace non-interrupting start event while hover over regular sub process',
    inject(function(dragging, elementRegistry) {

    // given
    var subProcess_3 = elementRegistry.get('SubProcess_3');

    // when
    moveShape(startEvent_1, subProcess_3, { x: 600, y: 120 });

    var context = dragging.active().data.context;

    // then
    // check if the visual representation remains a non interrupting message start event
    var startEventGfx = getGfx({ type: 'bpmn:StartEvent' });

    expect(context.dragGroup[1].innerSVG()).to.equal(startEventGfx.innerSVG());

  }));


  it('should replace all non-interrupting start events in a selection of multiple elements',
    inject(function(move, dragging, elementRegistry, selection) {

    // given
    var startEvent_2 = elementRegistry.get('StartEvent_2'),
        startEvent_3 = elementRegistry.get('StartEvent_3');

    // when
    selection.select([ startEvent_1, startEvent_2, startEvent_3 ]);

    moveShape(startEvent_1, rootElement, { x: 150, y: 250 });

    var context = dragging.active().data.context;

    // then
    // check if the visual replacements are blank interrupting start events
    var startEventGfx = getGfx({ type: 'bpmn:StartEvent' });

    expect(context.dragGroup[1].innerSVG()).to.equal(startEventGfx.innerSVG());
    expect(context.dragGroup[3].innerSVG()).to.equal(startEventGfx.innerSVG());
    expect(context.dragGroup[4].innerSVG()).to.equal(startEventGfx.innerSVG());

  }));


  it('should not replace any non-interrupting start events in a selection of multiple elements',
    inject(function(move, dragging, elementRegistry, selection) {

    // given
    var startEvent_2 = elementRegistry.get('StartEvent_2'),
        startEvent_3 = elementRegistry.get('StartEvent_3'),
        subProcess_2 = elementRegistry.get('SubProcess_2');

    var messageStartEventGfx = getGfx({
      type: 'bpmn:StartEvent',
      isInterrupting: false,
      _eventDefinitionType: 'bpmn:MessageEventDefinition'
    });

    var timerStartEventGfx = getGfx({
      type: 'bpmn:StartEvent',
      isInterrupting: false,
      _eventDefinitionType: 'bpmn:TimerEventDefinition'
    });

    var startEventGfx = getGfx({ type: 'bpmn:StartEvent' });

    // when
    selection.select([ startEvent_1, startEvent_2, startEvent_3 ]);

    moveShape(startEvent_1, subProcess_2, { x: 350, y: 120 });

    var context = dragging.active().data.context;

    // then
    expect(context.dragGroup[0].innerSVG()).to.equal(messageStartEventGfx.innerSVG());
    expect(context.dragGroup[1].innerSVG()).to.equal(startEventGfx.innerSVG());
    expect(context.dragGroup[2].innerSVG()).to.equal(timerStartEventGfx.innerSVG());

  }));

});