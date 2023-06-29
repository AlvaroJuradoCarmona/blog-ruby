(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name3 in all)
      __defProp(target, name3, { get: all[name3], enumerable: true });
  };

  // ../../node_modules/@hotwired/stimulus/dist/stimulus.js
  var EventListener = class {
    constructor(eventTarget, eventName, eventOptions) {
      this.eventTarget = eventTarget;
      this.eventName = eventName;
      this.eventOptions = eventOptions;
      this.unorderedBindings = /* @__PURE__ */ new Set();
    }
    connect() {
      this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
    }
    disconnect() {
      this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
    }
    bindingConnected(binding) {
      this.unorderedBindings.add(binding);
    }
    bindingDisconnected(binding) {
      this.unorderedBindings.delete(binding);
    }
    handleEvent(event) {
      const extendedEvent = extendEvent(event);
      for (const binding of this.bindings) {
        if (extendedEvent.immediatePropagationStopped) {
          break;
        } else {
          binding.handleEvent(extendedEvent);
        }
      }
    }
    hasBindings() {
      return this.unorderedBindings.size > 0;
    }
    get bindings() {
      return Array.from(this.unorderedBindings).sort((left, right) => {
        const leftIndex = left.index, rightIndex = right.index;
        return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
      });
    }
  };
  function extendEvent(event) {
    if ("immediatePropagationStopped" in event) {
      return event;
    } else {
      const { stopImmediatePropagation } = event;
      return Object.assign(event, {
        immediatePropagationStopped: false,
        stopImmediatePropagation() {
          this.immediatePropagationStopped = true;
          stopImmediatePropagation.call(this);
        }
      });
    }
  }
  var Dispatcher = class {
    constructor(application2) {
      this.application = application2;
      this.eventListenerMaps = /* @__PURE__ */ new Map();
      this.started = false;
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.eventListeners.forEach((eventListener) => eventListener.connect());
      }
    }
    stop() {
      if (this.started) {
        this.started = false;
        this.eventListeners.forEach((eventListener) => eventListener.disconnect());
      }
    }
    get eventListeners() {
      return Array.from(this.eventListenerMaps.values()).reduce((listeners, map) => listeners.concat(Array.from(map.values())), []);
    }
    bindingConnected(binding) {
      this.fetchEventListenerForBinding(binding).bindingConnected(binding);
    }
    bindingDisconnected(binding, clearEventListeners = false) {
      this.fetchEventListenerForBinding(binding).bindingDisconnected(binding);
      if (clearEventListeners)
        this.clearEventListenersForBinding(binding);
    }
    handleError(error3, message, detail = {}) {
      this.application.handleError(error3, `Error ${message}`, detail);
    }
    clearEventListenersForBinding(binding) {
      const eventListener = this.fetchEventListenerForBinding(binding);
      if (!eventListener.hasBindings()) {
        eventListener.disconnect();
        this.removeMappedEventListenerFor(binding);
      }
    }
    removeMappedEventListenerFor(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      eventListenerMap.delete(cacheKey);
      if (eventListenerMap.size == 0)
        this.eventListenerMaps.delete(eventTarget);
    }
    fetchEventListenerForBinding(binding) {
      const { eventTarget, eventName, eventOptions } = binding;
      return this.fetchEventListener(eventTarget, eventName, eventOptions);
    }
    fetchEventListener(eventTarget, eventName, eventOptions) {
      const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
      const cacheKey = this.cacheKey(eventName, eventOptions);
      let eventListener = eventListenerMap.get(cacheKey);
      if (!eventListener) {
        eventListener = this.createEventListener(eventTarget, eventName, eventOptions);
        eventListenerMap.set(cacheKey, eventListener);
      }
      return eventListener;
    }
    createEventListener(eventTarget, eventName, eventOptions) {
      const eventListener = new EventListener(eventTarget, eventName, eventOptions);
      if (this.started) {
        eventListener.connect();
      }
      return eventListener;
    }
    fetchEventListenerMapForEventTarget(eventTarget) {
      let eventListenerMap = this.eventListenerMaps.get(eventTarget);
      if (!eventListenerMap) {
        eventListenerMap = /* @__PURE__ */ new Map();
        this.eventListenerMaps.set(eventTarget, eventListenerMap);
      }
      return eventListenerMap;
    }
    cacheKey(eventName, eventOptions) {
      const parts = [eventName];
      Object.keys(eventOptions).sort().forEach((key) => {
        parts.push(`${eventOptions[key] ? "" : "!"}${key}`);
      });
      return parts.join(":");
    }
  };
  var defaultActionDescriptorFilters = {
    stop({ event, value }) {
      if (value)
        event.stopPropagation();
      return true;
    },
    prevent({ event, value }) {
      if (value)
        event.preventDefault();
      return true;
    },
    self({ event, value, element }) {
      if (value) {
        return element === event.target;
      } else {
        return true;
      }
    }
  };
  var descriptorPattern = /^(?:(.+?)(?:\.(.+?))?(?:@(window|document))?->)?(.+?)(?:#([^:]+?))(?::(.+))?$/;
  function parseActionDescriptorString(descriptorString) {
    const source = descriptorString.trim();
    const matches = source.match(descriptorPattern) || [];
    let eventName = matches[1];
    let keyFilter = matches[2];
    if (keyFilter && !["keydown", "keyup", "keypress"].includes(eventName)) {
      eventName += `.${keyFilter}`;
      keyFilter = "";
    }
    return {
      eventTarget: parseEventTarget(matches[3]),
      eventName,
      eventOptions: matches[6] ? parseEventOptions(matches[6]) : {},
      identifier: matches[4],
      methodName: matches[5],
      keyFilter
    };
  }
  function parseEventTarget(eventTargetName) {
    if (eventTargetName == "window") {
      return window;
    } else if (eventTargetName == "document") {
      return document;
    }
  }
  function parseEventOptions(eventOptions) {
    return eventOptions.split(":").reduce((options, token) => Object.assign(options, { [token.replace(/^!/, "")]: !/^!/.test(token) }), {});
  }
  function stringifyEventTarget(eventTarget) {
    if (eventTarget == window) {
      return "window";
    } else if (eventTarget == document) {
      return "document";
    }
  }
  function camelize(value) {
    return value.replace(/(?:[_-])([a-z0-9])/g, (_2, char) => char.toUpperCase());
  }
  function namespaceCamelize(value) {
    return camelize(value.replace(/--/g, "-").replace(/__/g, "_"));
  }
  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  function dasherize(value) {
    return value.replace(/([A-Z])/g, (_2, char) => `-${char.toLowerCase()}`);
  }
  function tokenize(value) {
    return value.match(/[^\s]+/g) || [];
  }
  var Action = class {
    constructor(element, index, descriptor, schema2) {
      this.element = element;
      this.index = index;
      this.eventTarget = descriptor.eventTarget || element;
      this.eventName = descriptor.eventName || getDefaultEventNameForElement(element) || error("missing event name");
      this.eventOptions = descriptor.eventOptions || {};
      this.identifier = descriptor.identifier || error("missing identifier");
      this.methodName = descriptor.methodName || error("missing method name");
      this.keyFilter = descriptor.keyFilter || "";
      this.schema = schema2;
    }
    static forToken(token, schema2) {
      return new this(token.element, token.index, parseActionDescriptorString(token.content), schema2);
    }
    toString() {
      const eventFilter = this.keyFilter ? `.${this.keyFilter}` : "";
      const eventTarget = this.eventTargetName ? `@${this.eventTargetName}` : "";
      return `${this.eventName}${eventFilter}${eventTarget}->${this.identifier}#${this.methodName}`;
    }
    isFilterTarget(event) {
      if (!this.keyFilter) {
        return false;
      }
      const filteres = this.keyFilter.split("+");
      const modifiers = ["meta", "ctrl", "alt", "shift"];
      const [meta, ctrl, alt, shift] = modifiers.map((modifier) => filteres.includes(modifier));
      if (event.metaKey !== meta || event.ctrlKey !== ctrl || event.altKey !== alt || event.shiftKey !== shift) {
        return true;
      }
      const standardFilter = filteres.filter((key) => !modifiers.includes(key))[0];
      if (!standardFilter) {
        return false;
      }
      if (!Object.prototype.hasOwnProperty.call(this.keyMappings, standardFilter)) {
        error(`contains unknown key filter: ${this.keyFilter}`);
      }
      return this.keyMappings[standardFilter].toLowerCase() !== event.key.toLowerCase();
    }
    get params() {
      const params2 = {};
      const pattern = new RegExp(`^data-${this.identifier}-(.+)-param$`, "i");
      for (const { name: name3, value } of Array.from(this.element.attributes)) {
        const match = name3.match(pattern);
        const key = match && match[1];
        if (key) {
          params2[camelize(key)] = typecast(value);
        }
      }
      return params2;
    }
    get eventTargetName() {
      return stringifyEventTarget(this.eventTarget);
    }
    get keyMappings() {
      return this.schema.keyMappings;
    }
  };
  var defaultEventNames = {
    a: () => "click",
    button: () => "click",
    form: () => "submit",
    details: () => "toggle",
    input: (e2) => e2.getAttribute("type") == "submit" ? "click" : "input",
    select: () => "change",
    textarea: () => "input"
  };
  function getDefaultEventNameForElement(element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName in defaultEventNames) {
      return defaultEventNames[tagName](element);
    }
  }
  function error(message) {
    throw new Error(message);
  }
  function typecast(value) {
    try {
      return JSON.parse(value);
    } catch (o_O) {
      return value;
    }
  }
  var Binding = class {
    constructor(context, action) {
      this.context = context;
      this.action = action;
    }
    get index() {
      return this.action.index;
    }
    get eventTarget() {
      return this.action.eventTarget;
    }
    get eventOptions() {
      return this.action.eventOptions;
    }
    get identifier() {
      return this.context.identifier;
    }
    handleEvent(event) {
      if (this.willBeInvokedByEvent(event) && this.applyEventModifiers(event)) {
        this.invokeWithEvent(event);
      }
    }
    get eventName() {
      return this.action.eventName;
    }
    get method() {
      const method = this.controller[this.methodName];
      if (typeof method == "function") {
        return method;
      }
      throw new Error(`Action "${this.action}" references undefined method "${this.methodName}"`);
    }
    applyEventModifiers(event) {
      const { element } = this.action;
      const { actionDescriptorFilters } = this.context.application;
      let passes = true;
      for (const [name3, value] of Object.entries(this.eventOptions)) {
        if (name3 in actionDescriptorFilters) {
          const filter = actionDescriptorFilters[name3];
          passes = passes && filter({ name: name3, value, event, element });
        } else {
          continue;
        }
      }
      return passes;
    }
    invokeWithEvent(event) {
      const { target, currentTarget } = event;
      try {
        const { params: params2 } = this.action;
        const actionEvent = Object.assign(event, { params: params2 });
        this.method.call(this.controller, actionEvent);
        this.context.logDebugActivity(this.methodName, { event, target, currentTarget, action: this.methodName });
      } catch (error3) {
        const { identifier, controller, element, index } = this;
        const detail = { identifier, controller, element, index, event };
        this.context.handleError(error3, `invoking action "${this.action}"`, detail);
      }
    }
    willBeInvokedByEvent(event) {
      const eventTarget = event.target;
      if (event instanceof KeyboardEvent && this.action.isFilterTarget(event)) {
        return false;
      }
      if (this.element === eventTarget) {
        return true;
      } else if (eventTarget instanceof Element && this.element.contains(eventTarget)) {
        return this.scope.containsElement(eventTarget);
      } else {
        return this.scope.containsElement(this.action.element);
      }
    }
    get controller() {
      return this.context.controller;
    }
    get methodName() {
      return this.action.methodName;
    }
    get element() {
      return this.scope.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  var ElementObserver = class {
    constructor(element, delegate) {
      this.mutationObserverInit = { attributes: true, childList: true, subtree: true };
      this.element = element;
      this.started = false;
      this.delegate = delegate;
      this.elements = /* @__PURE__ */ new Set();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.refresh();
      }
    }
    pause(callback) {
      if (this.started) {
        this.mutationObserver.disconnect();
        this.started = false;
      }
      callback();
      if (!this.started) {
        this.mutationObserver.observe(this.element, this.mutationObserverInit);
        this.started = true;
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        const matches = new Set(this.matchElementsInTree());
        for (const element of Array.from(this.elements)) {
          if (!matches.has(element)) {
            this.removeElement(element);
          }
        }
        for (const element of Array.from(matches)) {
          this.addElement(element);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      if (mutation.type == "attributes") {
        this.processAttributeChange(mutation.target, mutation.attributeName);
      } else if (mutation.type == "childList") {
        this.processRemovedNodes(mutation.removedNodes);
        this.processAddedNodes(mutation.addedNodes);
      }
    }
    processAttributeChange(node, attributeName) {
      const element = node;
      if (this.elements.has(element)) {
        if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
          this.delegate.elementAttributeChanged(element, attributeName);
        } else {
          this.removeElement(element);
        }
      } else if (this.matchElement(element)) {
        this.addElement(element);
      }
    }
    processRemovedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element) {
          this.processTree(element, this.removeElement);
        }
      }
    }
    processAddedNodes(nodes) {
      for (const node of Array.from(nodes)) {
        const element = this.elementFromNode(node);
        if (element && this.elementIsActive(element)) {
          this.processTree(element, this.addElement);
        }
      }
    }
    matchElement(element) {
      return this.delegate.matchElement(element);
    }
    matchElementsInTree(tree = this.element) {
      return this.delegate.matchElementsInTree(tree);
    }
    processTree(tree, processor) {
      for (const element of this.matchElementsInTree(tree)) {
        processor.call(this, element);
      }
    }
    elementFromNode(node) {
      if (node.nodeType == Node.ELEMENT_NODE) {
        return node;
      }
    }
    elementIsActive(element) {
      if (element.isConnected != this.element.isConnected) {
        return false;
      } else {
        return this.element.contains(element);
      }
    }
    addElement(element) {
      if (!this.elements.has(element)) {
        if (this.elementIsActive(element)) {
          this.elements.add(element);
          if (this.delegate.elementMatched) {
            this.delegate.elementMatched(element);
          }
        }
      }
    }
    removeElement(element) {
      if (this.elements.has(element)) {
        this.elements.delete(element);
        if (this.delegate.elementUnmatched) {
          this.delegate.elementUnmatched(element);
        }
      }
    }
  };
  var AttributeObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeName = attributeName;
      this.delegate = delegate;
      this.elementObserver = new ElementObserver(element, this);
    }
    get element() {
      return this.elementObserver.element;
    }
    get selector() {
      return `[${this.attributeName}]`;
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get started() {
      return this.elementObserver.started;
    }
    matchElement(element) {
      return element.hasAttribute(this.attributeName);
    }
    matchElementsInTree(tree) {
      const match = this.matchElement(tree) ? [tree] : [];
      const matches = Array.from(tree.querySelectorAll(this.selector));
      return match.concat(matches);
    }
    elementMatched(element) {
      if (this.delegate.elementMatchedAttribute) {
        this.delegate.elementMatchedAttribute(element, this.attributeName);
      }
    }
    elementUnmatched(element) {
      if (this.delegate.elementUnmatchedAttribute) {
        this.delegate.elementUnmatchedAttribute(element, this.attributeName);
      }
    }
    elementAttributeChanged(element, attributeName) {
      if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
        this.delegate.elementAttributeValueChanged(element, attributeName);
      }
    }
  };
  function add(map, key, value) {
    fetch2(map, key).add(value);
  }
  function del(map, key, value) {
    fetch2(map, key).delete(value);
    prune(map, key);
  }
  function fetch2(map, key) {
    let values = map.get(key);
    if (!values) {
      values = /* @__PURE__ */ new Set();
      map.set(key, values);
    }
    return values;
  }
  function prune(map, key) {
    const values = map.get(key);
    if (values != null && values.size == 0) {
      map.delete(key);
    }
  }
  var Multimap = class {
    constructor() {
      this.valuesByKey = /* @__PURE__ */ new Map();
    }
    get keys() {
      return Array.from(this.valuesByKey.keys());
    }
    get values() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((values, set) => values.concat(Array.from(set)), []);
    }
    get size() {
      const sets = Array.from(this.valuesByKey.values());
      return sets.reduce((size, set) => size + set.size, 0);
    }
    add(key, value) {
      add(this.valuesByKey, key, value);
    }
    delete(key, value) {
      del(this.valuesByKey, key, value);
    }
    has(key, value) {
      const values = this.valuesByKey.get(key);
      return values != null && values.has(value);
    }
    hasKey(key) {
      return this.valuesByKey.has(key);
    }
    hasValue(value) {
      const sets = Array.from(this.valuesByKey.values());
      return sets.some((set) => set.has(value));
    }
    getValuesForKey(key) {
      const values = this.valuesByKey.get(key);
      return values ? Array.from(values) : [];
    }
    getKeysForValue(value) {
      return Array.from(this.valuesByKey).filter(([_key, values]) => values.has(value)).map(([key, _values]) => key);
    }
  };
  var SelectorObserver = class {
    constructor(element, selector, delegate, details = {}) {
      this.selector = selector;
      this.details = details;
      this.elementObserver = new ElementObserver(element, this);
      this.delegate = delegate;
      this.matchesByElement = new Multimap();
    }
    get started() {
      return this.elementObserver.started;
    }
    start() {
      this.elementObserver.start();
    }
    pause(callback) {
      this.elementObserver.pause(callback);
    }
    stop() {
      this.elementObserver.stop();
    }
    refresh() {
      this.elementObserver.refresh();
    }
    get element() {
      return this.elementObserver.element;
    }
    matchElement(element) {
      const matches = element.matches(this.selector);
      if (this.delegate.selectorMatchElement) {
        return matches && this.delegate.selectorMatchElement(element, this.details);
      }
      return matches;
    }
    matchElementsInTree(tree) {
      const match = this.matchElement(tree) ? [tree] : [];
      const matches = Array.from(tree.querySelectorAll(this.selector)).filter((match2) => this.matchElement(match2));
      return match.concat(matches);
    }
    elementMatched(element) {
      this.selectorMatched(element);
    }
    elementUnmatched(element) {
      this.selectorUnmatched(element);
    }
    elementAttributeChanged(element, _attributeName) {
      const matches = this.matchElement(element);
      const matchedBefore = this.matchesByElement.has(this.selector, element);
      if (!matches && matchedBefore) {
        this.selectorUnmatched(element);
      }
    }
    selectorMatched(element) {
      if (this.delegate.selectorMatched) {
        this.delegate.selectorMatched(element, this.selector, this.details);
        this.matchesByElement.add(this.selector, element);
      }
    }
    selectorUnmatched(element) {
      this.delegate.selectorUnmatched(element, this.selector, this.details);
      this.matchesByElement.delete(this.selector, element);
    }
  };
  var StringMapObserver = class {
    constructor(element, delegate) {
      this.element = element;
      this.delegate = delegate;
      this.started = false;
      this.stringMap = /* @__PURE__ */ new Map();
      this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
    }
    start() {
      if (!this.started) {
        this.started = true;
        this.mutationObserver.observe(this.element, { attributes: true, attributeOldValue: true });
        this.refresh();
      }
    }
    stop() {
      if (this.started) {
        this.mutationObserver.takeRecords();
        this.mutationObserver.disconnect();
        this.started = false;
      }
    }
    refresh() {
      if (this.started) {
        for (const attributeName of this.knownAttributeNames) {
          this.refreshAttribute(attributeName, null);
        }
      }
    }
    processMutations(mutations) {
      if (this.started) {
        for (const mutation of mutations) {
          this.processMutation(mutation);
        }
      }
    }
    processMutation(mutation) {
      const attributeName = mutation.attributeName;
      if (attributeName) {
        this.refreshAttribute(attributeName, mutation.oldValue);
      }
    }
    refreshAttribute(attributeName, oldValue) {
      const key = this.delegate.getStringMapKeyForAttribute(attributeName);
      if (key != null) {
        if (!this.stringMap.has(attributeName)) {
          this.stringMapKeyAdded(key, attributeName);
        }
        const value = this.element.getAttribute(attributeName);
        if (this.stringMap.get(attributeName) != value) {
          this.stringMapValueChanged(value, key, oldValue);
        }
        if (value == null) {
          const oldValue2 = this.stringMap.get(attributeName);
          this.stringMap.delete(attributeName);
          if (oldValue2)
            this.stringMapKeyRemoved(key, attributeName, oldValue2);
        } else {
          this.stringMap.set(attributeName, value);
        }
      }
    }
    stringMapKeyAdded(key, attributeName) {
      if (this.delegate.stringMapKeyAdded) {
        this.delegate.stringMapKeyAdded(key, attributeName);
      }
    }
    stringMapValueChanged(value, key, oldValue) {
      if (this.delegate.stringMapValueChanged) {
        this.delegate.stringMapValueChanged(value, key, oldValue);
      }
    }
    stringMapKeyRemoved(key, attributeName, oldValue) {
      if (this.delegate.stringMapKeyRemoved) {
        this.delegate.stringMapKeyRemoved(key, attributeName, oldValue);
      }
    }
    get knownAttributeNames() {
      return Array.from(new Set(this.currentAttributeNames.concat(this.recordedAttributeNames)));
    }
    get currentAttributeNames() {
      return Array.from(this.element.attributes).map((attribute) => attribute.name);
    }
    get recordedAttributeNames() {
      return Array.from(this.stringMap.keys());
    }
  };
  var TokenListObserver = class {
    constructor(element, attributeName, delegate) {
      this.attributeObserver = new AttributeObserver(element, attributeName, this);
      this.delegate = delegate;
      this.tokensByElement = new Multimap();
    }
    get started() {
      return this.attributeObserver.started;
    }
    start() {
      this.attributeObserver.start();
    }
    pause(callback) {
      this.attributeObserver.pause(callback);
    }
    stop() {
      this.attributeObserver.stop();
    }
    refresh() {
      this.attributeObserver.refresh();
    }
    get element() {
      return this.attributeObserver.element;
    }
    get attributeName() {
      return this.attributeObserver.attributeName;
    }
    elementMatchedAttribute(element) {
      this.tokensMatched(this.readTokensForElement(element));
    }
    elementAttributeValueChanged(element) {
      const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element);
      this.tokensUnmatched(unmatchedTokens);
      this.tokensMatched(matchedTokens);
    }
    elementUnmatchedAttribute(element) {
      this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
    }
    tokensMatched(tokens) {
      tokens.forEach((token) => this.tokenMatched(token));
    }
    tokensUnmatched(tokens) {
      tokens.forEach((token) => this.tokenUnmatched(token));
    }
    tokenMatched(token) {
      this.delegate.tokenMatched(token);
      this.tokensByElement.add(token.element, token);
    }
    tokenUnmatched(token) {
      this.delegate.tokenUnmatched(token);
      this.tokensByElement.delete(token.element, token);
    }
    refreshTokensForElement(element) {
      const previousTokens = this.tokensByElement.getValuesForKey(element);
      const currentTokens = this.readTokensForElement(element);
      const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken));
      if (firstDifferingIndex == -1) {
        return [[], []];
      } else {
        return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
      }
    }
    readTokensForElement(element) {
      const attributeName = this.attributeName;
      const tokenString = element.getAttribute(attributeName) || "";
      return parseTokenString(tokenString, element, attributeName);
    }
  };
  function parseTokenString(tokenString, element, attributeName) {
    return tokenString.trim().split(/\s+/).filter((content) => content.length).map((content, index) => ({ element, attributeName, content, index }));
  }
  function zip(left, right) {
    const length = Math.max(left.length, right.length);
    return Array.from({ length }, (_2, index) => [left[index], right[index]]);
  }
  function tokensAreEqual(left, right) {
    return left && right && left.index == right.index && left.content == right.content;
  }
  var ValueListObserver = class {
    constructor(element, attributeName, delegate) {
      this.tokenListObserver = new TokenListObserver(element, attributeName, this);
      this.delegate = delegate;
      this.parseResultsByToken = /* @__PURE__ */ new WeakMap();
      this.valuesByTokenByElement = /* @__PURE__ */ new WeakMap();
    }
    get started() {
      return this.tokenListObserver.started;
    }
    start() {
      this.tokenListObserver.start();
    }
    stop() {
      this.tokenListObserver.stop();
    }
    refresh() {
      this.tokenListObserver.refresh();
    }
    get element() {
      return this.tokenListObserver.element;
    }
    get attributeName() {
      return this.tokenListObserver.attributeName;
    }
    tokenMatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).set(token, value);
        this.delegate.elementMatchedValue(element, value);
      }
    }
    tokenUnmatched(token) {
      const { element } = token;
      const { value } = this.fetchParseResultForToken(token);
      if (value) {
        this.fetchValuesByTokenForElement(element).delete(token);
        this.delegate.elementUnmatchedValue(element, value);
      }
    }
    fetchParseResultForToken(token) {
      let parseResult = this.parseResultsByToken.get(token);
      if (!parseResult) {
        parseResult = this.parseToken(token);
        this.parseResultsByToken.set(token, parseResult);
      }
      return parseResult;
    }
    fetchValuesByTokenForElement(element) {
      let valuesByToken = this.valuesByTokenByElement.get(element);
      if (!valuesByToken) {
        valuesByToken = /* @__PURE__ */ new Map();
        this.valuesByTokenByElement.set(element, valuesByToken);
      }
      return valuesByToken;
    }
    parseToken(token) {
      try {
        const value = this.delegate.parseValueForToken(token);
        return { value };
      } catch (error3) {
        return { error: error3 };
      }
    }
  };
  var BindingObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.bindingsByAction = /* @__PURE__ */ new Map();
    }
    start() {
      if (!this.valueListObserver) {
        this.valueListObserver = new ValueListObserver(this.element, this.actionAttribute, this);
        this.valueListObserver.start();
      }
    }
    stop() {
      if (this.valueListObserver) {
        this.valueListObserver.stop();
        delete this.valueListObserver;
        this.disconnectAllActions();
      }
    }
    get element() {
      return this.context.element;
    }
    get identifier() {
      return this.context.identifier;
    }
    get actionAttribute() {
      return this.schema.actionAttribute;
    }
    get schema() {
      return this.context.schema;
    }
    get bindings() {
      return Array.from(this.bindingsByAction.values());
    }
    connectAction(action) {
      const binding = new Binding(this.context, action);
      this.bindingsByAction.set(action, binding);
      this.delegate.bindingConnected(binding);
    }
    disconnectAction(action) {
      const binding = this.bindingsByAction.get(action);
      if (binding) {
        this.bindingsByAction.delete(action);
        this.delegate.bindingDisconnected(binding);
      }
    }
    disconnectAllActions() {
      this.bindings.forEach((binding) => this.delegate.bindingDisconnected(binding, true));
      this.bindingsByAction.clear();
    }
    parseValueForToken(token) {
      const action = Action.forToken(token, this.schema);
      if (action.identifier == this.identifier) {
        return action;
      }
    }
    elementMatchedValue(element, action) {
      this.connectAction(action);
    }
    elementUnmatchedValue(element, action) {
      this.disconnectAction(action);
    }
  };
  var ValueObserver = class {
    constructor(context, receiver) {
      this.context = context;
      this.receiver = receiver;
      this.stringMapObserver = new StringMapObserver(this.element, this);
      this.valueDescriptorMap = this.controller.valueDescriptorMap;
    }
    start() {
      this.stringMapObserver.start();
      this.invokeChangedCallbacksForDefaultValues();
    }
    stop() {
      this.stringMapObserver.stop();
    }
    get element() {
      return this.context.element;
    }
    get controller() {
      return this.context.controller;
    }
    getStringMapKeyForAttribute(attributeName) {
      if (attributeName in this.valueDescriptorMap) {
        return this.valueDescriptorMap[attributeName].name;
      }
    }
    stringMapKeyAdded(key, attributeName) {
      const descriptor = this.valueDescriptorMap[attributeName];
      if (!this.hasValue(key)) {
        this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), descriptor.writer(descriptor.defaultValue));
      }
    }
    stringMapValueChanged(value, name3, oldValue) {
      const descriptor = this.valueDescriptorNameMap[name3];
      if (value === null)
        return;
      if (oldValue === null) {
        oldValue = descriptor.writer(descriptor.defaultValue);
      }
      this.invokeChangedCallback(name3, value, oldValue);
    }
    stringMapKeyRemoved(key, attributeName, oldValue) {
      const descriptor = this.valueDescriptorNameMap[key];
      if (this.hasValue(key)) {
        this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), oldValue);
      } else {
        this.invokeChangedCallback(key, descriptor.writer(descriptor.defaultValue), oldValue);
      }
    }
    invokeChangedCallbacksForDefaultValues() {
      for (const { key, name: name3, defaultValue, writer } of this.valueDescriptors) {
        if (defaultValue != void 0 && !this.controller.data.has(key)) {
          this.invokeChangedCallback(name3, writer(defaultValue), void 0);
        }
      }
    }
    invokeChangedCallback(name3, rawValue, rawOldValue) {
      const changedMethodName = `${name3}Changed`;
      const changedMethod = this.receiver[changedMethodName];
      if (typeof changedMethod == "function") {
        const descriptor = this.valueDescriptorNameMap[name3];
        try {
          const value = descriptor.reader(rawValue);
          let oldValue = rawOldValue;
          if (rawOldValue) {
            oldValue = descriptor.reader(rawOldValue);
          }
          changedMethod.call(this.receiver, value, oldValue);
        } catch (error3) {
          if (error3 instanceof TypeError) {
            error3.message = `Stimulus Value "${this.context.identifier}.${descriptor.name}" - ${error3.message}`;
          }
          throw error3;
        }
      }
    }
    get valueDescriptors() {
      const { valueDescriptorMap } = this;
      return Object.keys(valueDescriptorMap).map((key) => valueDescriptorMap[key]);
    }
    get valueDescriptorNameMap() {
      const descriptors = {};
      Object.keys(this.valueDescriptorMap).forEach((key) => {
        const descriptor = this.valueDescriptorMap[key];
        descriptors[descriptor.name] = descriptor;
      });
      return descriptors;
    }
    hasValue(attributeName) {
      const descriptor = this.valueDescriptorNameMap[attributeName];
      const hasMethodName = `has${capitalize(descriptor.name)}`;
      return this.receiver[hasMethodName];
    }
  };
  var TargetObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.targetsByName = new Multimap();
    }
    start() {
      if (!this.tokenListObserver) {
        this.tokenListObserver = new TokenListObserver(this.element, this.attributeName, this);
        this.tokenListObserver.start();
      }
    }
    stop() {
      if (this.tokenListObserver) {
        this.disconnectAllTargets();
        this.tokenListObserver.stop();
        delete this.tokenListObserver;
      }
    }
    tokenMatched({ element, content: name3 }) {
      if (this.scope.containsElement(element)) {
        this.connectTarget(element, name3);
      }
    }
    tokenUnmatched({ element, content: name3 }) {
      this.disconnectTarget(element, name3);
    }
    connectTarget(element, name3) {
      var _a;
      if (!this.targetsByName.has(name3, element)) {
        this.targetsByName.add(name3, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetConnected(element, name3));
      }
    }
    disconnectTarget(element, name3) {
      var _a;
      if (this.targetsByName.has(name3, element)) {
        this.targetsByName.delete(name3, element);
        (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetDisconnected(element, name3));
      }
    }
    disconnectAllTargets() {
      for (const name3 of this.targetsByName.keys) {
        for (const element of this.targetsByName.getValuesForKey(name3)) {
          this.disconnectTarget(element, name3);
        }
      }
    }
    get attributeName() {
      return `data-${this.context.identifier}-target`;
    }
    get element() {
      return this.context.element;
    }
    get scope() {
      return this.context.scope;
    }
  };
  function readInheritableStaticArrayValues(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return Array.from(ancestors.reduce((values, constructor2) => {
      getOwnStaticArrayValues(constructor2, propertyName).forEach((name3) => values.add(name3));
      return values;
    }, /* @__PURE__ */ new Set()));
  }
  function readInheritableStaticObjectPairs(constructor, propertyName) {
    const ancestors = getAncestorsForConstructor(constructor);
    return ancestors.reduce((pairs, constructor2) => {
      pairs.push(...getOwnStaticObjectPairs(constructor2, propertyName));
      return pairs;
    }, []);
  }
  function getAncestorsForConstructor(constructor) {
    const ancestors = [];
    while (constructor) {
      ancestors.push(constructor);
      constructor = Object.getPrototypeOf(constructor);
    }
    return ancestors.reverse();
  }
  function getOwnStaticArrayValues(constructor, propertyName) {
    const definition = constructor[propertyName];
    return Array.isArray(definition) ? definition : [];
  }
  function getOwnStaticObjectPairs(constructor, propertyName) {
    const definition = constructor[propertyName];
    return definition ? Object.keys(definition).map((key) => [key, definition[key]]) : [];
  }
  var OutletObserver = class {
    constructor(context, delegate) {
      this.context = context;
      this.delegate = delegate;
      this.outletsByName = new Multimap();
      this.outletElementsByName = new Multimap();
      this.selectorObserverMap = /* @__PURE__ */ new Map();
    }
    start() {
      if (this.selectorObserverMap.size === 0) {
        this.outletDefinitions.forEach((outletName) => {
          const selector = this.selector(outletName);
          const details = { outletName };
          if (selector) {
            this.selectorObserverMap.set(outletName, new SelectorObserver(document.body, selector, this, details));
          }
        });
        this.selectorObserverMap.forEach((observer) => observer.start());
      }
      this.dependentContexts.forEach((context) => context.refresh());
    }
    stop() {
      if (this.selectorObserverMap.size > 0) {
        this.disconnectAllOutlets();
        this.selectorObserverMap.forEach((observer) => observer.stop());
        this.selectorObserverMap.clear();
      }
    }
    refresh() {
      this.selectorObserverMap.forEach((observer) => observer.refresh());
    }
    selectorMatched(element, _selector, { outletName }) {
      const outlet = this.getOutlet(element, outletName);
      if (outlet) {
        this.connectOutlet(outlet, element, outletName);
      }
    }
    selectorUnmatched(element, _selector, { outletName }) {
      const outlet = this.getOutletFromMap(element, outletName);
      if (outlet) {
        this.disconnectOutlet(outlet, element, outletName);
      }
    }
    selectorMatchElement(element, { outletName }) {
      return this.hasOutlet(element, outletName) && element.matches(`[${this.context.application.schema.controllerAttribute}~=${outletName}]`);
    }
    connectOutlet(outlet, element, outletName) {
      var _a;
      if (!this.outletElementsByName.has(outletName, element)) {
        this.outletsByName.add(outletName, outlet);
        this.outletElementsByName.add(outletName, element);
        (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletConnected(outlet, element, outletName));
      }
    }
    disconnectOutlet(outlet, element, outletName) {
      var _a;
      if (this.outletElementsByName.has(outletName, element)) {
        this.outletsByName.delete(outletName, outlet);
        this.outletElementsByName.delete(outletName, element);
        (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletDisconnected(outlet, element, outletName));
      }
    }
    disconnectAllOutlets() {
      for (const outletName of this.outletElementsByName.keys) {
        for (const element of this.outletElementsByName.getValuesForKey(outletName)) {
          for (const outlet of this.outletsByName.getValuesForKey(outletName)) {
            this.disconnectOutlet(outlet, element, outletName);
          }
        }
      }
    }
    selector(outletName) {
      return this.scope.outlets.getSelectorForOutletName(outletName);
    }
    get outletDependencies() {
      const dependencies3 = new Multimap();
      this.router.modules.forEach((module3) => {
        const constructor = module3.definition.controllerConstructor;
        const outlets = readInheritableStaticArrayValues(constructor, "outlets");
        outlets.forEach((outlet) => dependencies3.add(outlet, module3.identifier));
      });
      return dependencies3;
    }
    get outletDefinitions() {
      return this.outletDependencies.getKeysForValue(this.identifier);
    }
    get dependentControllerIdentifiers() {
      return this.outletDependencies.getValuesForKey(this.identifier);
    }
    get dependentContexts() {
      const identifiers = this.dependentControllerIdentifiers;
      return this.router.contexts.filter((context) => identifiers.includes(context.identifier));
    }
    hasOutlet(element, outletName) {
      return !!this.getOutlet(element, outletName) || !!this.getOutletFromMap(element, outletName);
    }
    getOutlet(element, outletName) {
      return this.application.getControllerForElementAndIdentifier(element, outletName);
    }
    getOutletFromMap(element, outletName) {
      return this.outletsByName.getValuesForKey(outletName).find((outlet) => outlet.element === element);
    }
    get scope() {
      return this.context.scope;
    }
    get identifier() {
      return this.context.identifier;
    }
    get application() {
      return this.context.application;
    }
    get router() {
      return this.application.router;
    }
  };
  var Context = class {
    constructor(module3, scope) {
      this.logDebugActivity = (functionName, detail = {}) => {
        const { identifier, controller, element } = this;
        detail = Object.assign({ identifier, controller, element }, detail);
        this.application.logDebugActivity(this.identifier, functionName, detail);
      };
      this.module = module3;
      this.scope = scope;
      this.controller = new module3.controllerConstructor(this);
      this.bindingObserver = new BindingObserver(this, this.dispatcher);
      this.valueObserver = new ValueObserver(this, this.controller);
      this.targetObserver = new TargetObserver(this, this);
      this.outletObserver = new OutletObserver(this, this);
      try {
        this.controller.initialize();
        this.logDebugActivity("initialize");
      } catch (error3) {
        this.handleError(error3, "initializing controller");
      }
    }
    connect() {
      this.bindingObserver.start();
      this.valueObserver.start();
      this.targetObserver.start();
      this.outletObserver.start();
      try {
        this.controller.connect();
        this.logDebugActivity("connect");
      } catch (error3) {
        this.handleError(error3, "connecting controller");
      }
    }
    refresh() {
      this.outletObserver.refresh();
    }
    disconnect() {
      try {
        this.controller.disconnect();
        this.logDebugActivity("disconnect");
      } catch (error3) {
        this.handleError(error3, "disconnecting controller");
      }
      this.outletObserver.stop();
      this.targetObserver.stop();
      this.valueObserver.stop();
      this.bindingObserver.stop();
    }
    get application() {
      return this.module.application;
    }
    get identifier() {
      return this.module.identifier;
    }
    get schema() {
      return this.application.schema;
    }
    get dispatcher() {
      return this.application.dispatcher;
    }
    get element() {
      return this.scope.element;
    }
    get parentElement() {
      return this.element.parentElement;
    }
    handleError(error3, message, detail = {}) {
      const { identifier, controller, element } = this;
      detail = Object.assign({ identifier, controller, element }, detail);
      this.application.handleError(error3, `Error ${message}`, detail);
    }
    targetConnected(element, name3) {
      this.invokeControllerMethod(`${name3}TargetConnected`, element);
    }
    targetDisconnected(element, name3) {
      this.invokeControllerMethod(`${name3}TargetDisconnected`, element);
    }
    outletConnected(outlet, element, name3) {
      this.invokeControllerMethod(`${namespaceCamelize(name3)}OutletConnected`, outlet, element);
    }
    outletDisconnected(outlet, element, name3) {
      this.invokeControllerMethod(`${namespaceCamelize(name3)}OutletDisconnected`, outlet, element);
    }
    invokeControllerMethod(methodName, ...args) {
      const controller = this.controller;
      if (typeof controller[methodName] == "function") {
        controller[methodName](...args);
      }
    }
  };
  function bless(constructor) {
    return shadow(constructor, getBlessedProperties(constructor));
  }
  function shadow(constructor, properties) {
    const shadowConstructor = extend(constructor);
    const shadowProperties = getShadowProperties(constructor.prototype, properties);
    Object.defineProperties(shadowConstructor.prototype, shadowProperties);
    return shadowConstructor;
  }
  function getBlessedProperties(constructor) {
    const blessings = readInheritableStaticArrayValues(constructor, "blessings");
    return blessings.reduce((blessedProperties, blessing) => {
      const properties = blessing(constructor);
      for (const key in properties) {
        const descriptor = blessedProperties[key] || {};
        blessedProperties[key] = Object.assign(descriptor, properties[key]);
      }
      return blessedProperties;
    }, {});
  }
  function getShadowProperties(prototype, properties) {
    return getOwnKeys(properties).reduce((shadowProperties, key) => {
      const descriptor = getShadowedDescriptor(prototype, properties, key);
      if (descriptor) {
        Object.assign(shadowProperties, { [key]: descriptor });
      }
      return shadowProperties;
    }, {});
  }
  function getShadowedDescriptor(prototype, properties, key) {
    const shadowingDescriptor = Object.getOwnPropertyDescriptor(prototype, key);
    const shadowedByValue = shadowingDescriptor && "value" in shadowingDescriptor;
    if (!shadowedByValue) {
      const descriptor = Object.getOwnPropertyDescriptor(properties, key).value;
      if (shadowingDescriptor) {
        descriptor.get = shadowingDescriptor.get || descriptor.get;
        descriptor.set = shadowingDescriptor.set || descriptor.set;
      }
      return descriptor;
    }
  }
  var getOwnKeys = (() => {
    if (typeof Object.getOwnPropertySymbols == "function") {
      return (object) => [...Object.getOwnPropertyNames(object), ...Object.getOwnPropertySymbols(object)];
    } else {
      return Object.getOwnPropertyNames;
    }
  })();
  var extend = (() => {
    function extendWithReflect(constructor) {
      function extended() {
        return Reflect.construct(constructor, arguments, new.target);
      }
      extended.prototype = Object.create(constructor.prototype, {
        constructor: { value: extended }
      });
      Reflect.setPrototypeOf(extended, constructor);
      return extended;
    }
    function testReflectExtension() {
      const a2 = function() {
        this.a.call(this);
      };
      const b2 = extendWithReflect(a2);
      b2.prototype.a = function() {
      };
      return new b2();
    }
    try {
      testReflectExtension();
      return extendWithReflect;
    } catch (error3) {
      return (constructor) => class extended extends constructor {
      };
    }
  })();
  function blessDefinition(definition) {
    return {
      identifier: definition.identifier,
      controllerConstructor: bless(definition.controllerConstructor)
    };
  }
  var Module = class {
    constructor(application2, definition) {
      this.application = application2;
      this.definition = blessDefinition(definition);
      this.contextsByScope = /* @__PURE__ */ new WeakMap();
      this.connectedContexts = /* @__PURE__ */ new Set();
    }
    get identifier() {
      return this.definition.identifier;
    }
    get controllerConstructor() {
      return this.definition.controllerConstructor;
    }
    get contexts() {
      return Array.from(this.connectedContexts);
    }
    connectContextForScope(scope) {
      const context = this.fetchContextForScope(scope);
      this.connectedContexts.add(context);
      context.connect();
    }
    disconnectContextForScope(scope) {
      const context = this.contextsByScope.get(scope);
      if (context) {
        this.connectedContexts.delete(context);
        context.disconnect();
      }
    }
    fetchContextForScope(scope) {
      let context = this.contextsByScope.get(scope);
      if (!context) {
        context = new Context(this, scope);
        this.contextsByScope.set(scope, context);
      }
      return context;
    }
  };
  var ClassMap = class {
    constructor(scope) {
      this.scope = scope;
    }
    has(name3) {
      return this.data.has(this.getDataKey(name3));
    }
    get(name3) {
      return this.getAll(name3)[0];
    }
    getAll(name3) {
      const tokenString = this.data.get(this.getDataKey(name3)) || "";
      return tokenize(tokenString);
    }
    getAttributeName(name3) {
      return this.data.getAttributeNameForKey(this.getDataKey(name3));
    }
    getDataKey(name3) {
      return `${name3}-class`;
    }
    get data() {
      return this.scope.data;
    }
  };
  var DataMap = class {
    constructor(scope) {
      this.scope = scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get(key) {
      const name3 = this.getAttributeNameForKey(key);
      return this.element.getAttribute(name3);
    }
    set(key, value) {
      const name3 = this.getAttributeNameForKey(key);
      this.element.setAttribute(name3, value);
      return this.get(key);
    }
    has(key) {
      const name3 = this.getAttributeNameForKey(key);
      return this.element.hasAttribute(name3);
    }
    delete(key) {
      if (this.has(key)) {
        const name3 = this.getAttributeNameForKey(key);
        this.element.removeAttribute(name3);
        return true;
      } else {
        return false;
      }
    }
    getAttributeNameForKey(key) {
      return `data-${this.identifier}-${dasherize(key)}`;
    }
  };
  var Guide = class {
    constructor(logger2) {
      this.warnedKeysByObject = /* @__PURE__ */ new WeakMap();
      this.logger = logger2;
    }
    warn(object, key, message) {
      let warnedKeys = this.warnedKeysByObject.get(object);
      if (!warnedKeys) {
        warnedKeys = /* @__PURE__ */ new Set();
        this.warnedKeysByObject.set(object, warnedKeys);
      }
      if (!warnedKeys.has(key)) {
        warnedKeys.add(key);
        this.logger.warn(message, object);
      }
    }
  };
  function attributeValueContainsToken(attributeName, token) {
    return `[${attributeName}~="${token}"]`;
  }
  var TargetSet = class {
    constructor(scope) {
      this.scope = scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get schema() {
      return this.scope.schema;
    }
    has(targetName) {
      return this.find(targetName) != null;
    }
    find(...targetNames) {
      return targetNames.reduce((target, targetName) => target || this.findTarget(targetName) || this.findLegacyTarget(targetName), void 0);
    }
    findAll(...targetNames) {
      return targetNames.reduce((targets, targetName) => [
        ...targets,
        ...this.findAllTargets(targetName),
        ...this.findAllLegacyTargets(targetName)
      ], []);
    }
    findTarget(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findElement(selector);
    }
    findAllTargets(targetName) {
      const selector = this.getSelectorForTargetName(targetName);
      return this.scope.findAllElements(selector);
    }
    getSelectorForTargetName(targetName) {
      const attributeName = this.schema.targetAttributeForScope(this.identifier);
      return attributeValueContainsToken(attributeName, targetName);
    }
    findLegacyTarget(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.deprecate(this.scope.findElement(selector), targetName);
    }
    findAllLegacyTargets(targetName) {
      const selector = this.getLegacySelectorForTargetName(targetName);
      return this.scope.findAllElements(selector).map((element) => this.deprecate(element, targetName));
    }
    getLegacySelectorForTargetName(targetName) {
      const targetDescriptor = `${this.identifier}.${targetName}`;
      return attributeValueContainsToken(this.schema.targetAttribute, targetDescriptor);
    }
    deprecate(element, targetName) {
      if (element) {
        const { identifier } = this;
        const attributeName = this.schema.targetAttribute;
        const revisedAttributeName = this.schema.targetAttributeForScope(identifier);
        this.guide.warn(element, `target:${targetName}`, `Please replace ${attributeName}="${identifier}.${targetName}" with ${revisedAttributeName}="${targetName}". The ${attributeName} attribute is deprecated and will be removed in a future version of Stimulus.`);
      }
      return element;
    }
    get guide() {
      return this.scope.guide;
    }
  };
  var OutletSet = class {
    constructor(scope, controllerElement) {
      this.scope = scope;
      this.controllerElement = controllerElement;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get schema() {
      return this.scope.schema;
    }
    has(outletName) {
      return this.find(outletName) != null;
    }
    find(...outletNames) {
      return outletNames.reduce((outlet, outletName) => outlet || this.findOutlet(outletName), void 0);
    }
    findAll(...outletNames) {
      return outletNames.reduce((outlets, outletName) => [...outlets, ...this.findAllOutlets(outletName)], []);
    }
    getSelectorForOutletName(outletName) {
      const attributeName = this.schema.outletAttributeForScope(this.identifier, outletName);
      return this.controllerElement.getAttribute(attributeName);
    }
    findOutlet(outletName) {
      const selector = this.getSelectorForOutletName(outletName);
      if (selector)
        return this.findElement(selector, outletName);
    }
    findAllOutlets(outletName) {
      const selector = this.getSelectorForOutletName(outletName);
      return selector ? this.findAllElements(selector, outletName) : [];
    }
    findElement(selector, outletName) {
      const elements = this.scope.queryElements(selector);
      return elements.filter((element) => this.matchesElement(element, selector, outletName))[0];
    }
    findAllElements(selector, outletName) {
      const elements = this.scope.queryElements(selector);
      return elements.filter((element) => this.matchesElement(element, selector, outletName));
    }
    matchesElement(element, selector, outletName) {
      const controllerAttribute = element.getAttribute(this.scope.schema.controllerAttribute) || "";
      return element.matches(selector) && controllerAttribute.split(" ").includes(outletName);
    }
  };
  var Scope = class {
    constructor(schema2, element, identifier, logger2) {
      this.targets = new TargetSet(this);
      this.classes = new ClassMap(this);
      this.data = new DataMap(this);
      this.containsElement = (element2) => {
        return element2.closest(this.controllerSelector) === this.element;
      };
      this.schema = schema2;
      this.element = element;
      this.identifier = identifier;
      this.guide = new Guide(logger2);
      this.outlets = new OutletSet(this.documentScope, element);
    }
    findElement(selector) {
      return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
    }
    findAllElements(selector) {
      return [
        ...this.element.matches(selector) ? [this.element] : [],
        ...this.queryElements(selector).filter(this.containsElement)
      ];
    }
    queryElements(selector) {
      return Array.from(this.element.querySelectorAll(selector));
    }
    get controllerSelector() {
      return attributeValueContainsToken(this.schema.controllerAttribute, this.identifier);
    }
    get isDocumentScope() {
      return this.element === document.documentElement;
    }
    get documentScope() {
      return this.isDocumentScope ? this : new Scope(this.schema, document.documentElement, this.identifier, this.guide.logger);
    }
  };
  var ScopeObserver = class {
    constructor(element, schema2, delegate) {
      this.element = element;
      this.schema = schema2;
      this.delegate = delegate;
      this.valueListObserver = new ValueListObserver(this.element, this.controllerAttribute, this);
      this.scopesByIdentifierByElement = /* @__PURE__ */ new WeakMap();
      this.scopeReferenceCounts = /* @__PURE__ */ new WeakMap();
    }
    start() {
      this.valueListObserver.start();
    }
    stop() {
      this.valueListObserver.stop();
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    parseValueForToken(token) {
      const { element, content: identifier } = token;
      const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
      let scope = scopesByIdentifier.get(identifier);
      if (!scope) {
        scope = this.delegate.createScopeForElementAndIdentifier(element, identifier);
        scopesByIdentifier.set(identifier, scope);
      }
      return scope;
    }
    elementMatchedValue(element, value) {
      const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
      this.scopeReferenceCounts.set(value, referenceCount);
      if (referenceCount == 1) {
        this.delegate.scopeConnected(value);
      }
    }
    elementUnmatchedValue(element, value) {
      const referenceCount = this.scopeReferenceCounts.get(value);
      if (referenceCount) {
        this.scopeReferenceCounts.set(value, referenceCount - 1);
        if (referenceCount == 1) {
          this.delegate.scopeDisconnected(value);
        }
      }
    }
    fetchScopesByIdentifierForElement(element) {
      let scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
      if (!scopesByIdentifier) {
        scopesByIdentifier = /* @__PURE__ */ new Map();
        this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
      }
      return scopesByIdentifier;
    }
  };
  var Router = class {
    constructor(application2) {
      this.application = application2;
      this.scopeObserver = new ScopeObserver(this.element, this.schema, this);
      this.scopesByIdentifier = new Multimap();
      this.modulesByIdentifier = /* @__PURE__ */ new Map();
    }
    get element() {
      return this.application.element;
    }
    get schema() {
      return this.application.schema;
    }
    get logger() {
      return this.application.logger;
    }
    get controllerAttribute() {
      return this.schema.controllerAttribute;
    }
    get modules() {
      return Array.from(this.modulesByIdentifier.values());
    }
    get contexts() {
      return this.modules.reduce((contexts, module3) => contexts.concat(module3.contexts), []);
    }
    start() {
      this.scopeObserver.start();
    }
    stop() {
      this.scopeObserver.stop();
    }
    loadDefinition(definition) {
      this.unloadIdentifier(definition.identifier);
      const module3 = new Module(this.application, definition);
      this.connectModule(module3);
      const afterLoad = definition.controllerConstructor.afterLoad;
      if (afterLoad) {
        afterLoad(definition.identifier, this.application);
      }
    }
    unloadIdentifier(identifier) {
      const module3 = this.modulesByIdentifier.get(identifier);
      if (module3) {
        this.disconnectModule(module3);
      }
    }
    getContextForElementAndIdentifier(element, identifier) {
      const module3 = this.modulesByIdentifier.get(identifier);
      if (module3) {
        return module3.contexts.find((context) => context.element == element);
      }
    }
    handleError(error3, message, detail) {
      this.application.handleError(error3, message, detail);
    }
    createScopeForElementAndIdentifier(element, identifier) {
      return new Scope(this.schema, element, identifier, this.logger);
    }
    scopeConnected(scope) {
      this.scopesByIdentifier.add(scope.identifier, scope);
      const module3 = this.modulesByIdentifier.get(scope.identifier);
      if (module3) {
        module3.connectContextForScope(scope);
      }
    }
    scopeDisconnected(scope) {
      this.scopesByIdentifier.delete(scope.identifier, scope);
      const module3 = this.modulesByIdentifier.get(scope.identifier);
      if (module3) {
        module3.disconnectContextForScope(scope);
      }
    }
    connectModule(module3) {
      this.modulesByIdentifier.set(module3.identifier, module3);
      const scopes = this.scopesByIdentifier.getValuesForKey(module3.identifier);
      scopes.forEach((scope) => module3.connectContextForScope(scope));
    }
    disconnectModule(module3) {
      this.modulesByIdentifier.delete(module3.identifier);
      const scopes = this.scopesByIdentifier.getValuesForKey(module3.identifier);
      scopes.forEach((scope) => module3.disconnectContextForScope(scope));
    }
  };
  var defaultSchema = {
    controllerAttribute: "data-controller",
    actionAttribute: "data-action",
    targetAttribute: "data-target",
    targetAttributeForScope: (identifier) => `data-${identifier}-target`,
    outletAttributeForScope: (identifier, outlet) => `data-${identifier}-${outlet}-outlet`,
    keyMappings: Object.assign(Object.assign({ enter: "Enter", tab: "Tab", esc: "Escape", space: " ", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", home: "Home", end: "End" }, objectFromEntries("abcdefghijklmnopqrstuvwxyz".split("").map((c2) => [c2, c2]))), objectFromEntries("0123456789".split("").map((n2) => [n2, n2])))
  };
  function objectFromEntries(array) {
    return array.reduce((memo, [k2, v2]) => Object.assign(Object.assign({}, memo), { [k2]: v2 }), {});
  }
  var Application = class {
    constructor(element = document.documentElement, schema2 = defaultSchema) {
      this.logger = console;
      this.debug = false;
      this.logDebugActivity = (identifier, functionName, detail = {}) => {
        if (this.debug) {
          this.logFormattedMessage(identifier, functionName, detail);
        }
      };
      this.element = element;
      this.schema = schema2;
      this.dispatcher = new Dispatcher(this);
      this.router = new Router(this);
      this.actionDescriptorFilters = Object.assign({}, defaultActionDescriptorFilters);
    }
    static start(element, schema2) {
      const application2 = new this(element, schema2);
      application2.start();
      return application2;
    }
    async start() {
      await domReady();
      this.logDebugActivity("application", "starting");
      this.dispatcher.start();
      this.router.start();
      this.logDebugActivity("application", "start");
    }
    stop() {
      this.logDebugActivity("application", "stopping");
      this.dispatcher.stop();
      this.router.stop();
      this.logDebugActivity("application", "stop");
    }
    register(identifier, controllerConstructor) {
      this.load({ identifier, controllerConstructor });
    }
    registerActionOption(name3, filter) {
      this.actionDescriptorFilters[name3] = filter;
    }
    load(head, ...rest) {
      const definitions = Array.isArray(head) ? head : [head, ...rest];
      definitions.forEach((definition) => {
        if (definition.controllerConstructor.shouldLoad) {
          this.router.loadDefinition(definition);
        }
      });
    }
    unload(head, ...rest) {
      const identifiers = Array.isArray(head) ? head : [head, ...rest];
      identifiers.forEach((identifier) => this.router.unloadIdentifier(identifier));
    }
    get controllers() {
      return this.router.contexts.map((context) => context.controller);
    }
    getControllerForElementAndIdentifier(element, identifier) {
      const context = this.router.getContextForElementAndIdentifier(element, identifier);
      return context ? context.controller : null;
    }
    handleError(error3, message, detail) {
      var _a;
      this.logger.error(`%s

%o

%o`, message, error3, detail);
      (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, message, "", 0, 0, error3);
    }
    logFormattedMessage(identifier, functionName, detail = {}) {
      detail = Object.assign({ application: this }, detail);
      this.logger.groupCollapsed(`${identifier} #${functionName}`);
      this.logger.log("details:", Object.assign({}, detail));
      this.logger.groupEnd();
    }
  };
  function domReady() {
    return new Promise((resolve) => {
      if (document.readyState == "loading") {
        document.addEventListener("DOMContentLoaded", () => resolve());
      } else {
        resolve();
      }
    });
  }
  function ClassPropertiesBlessing(constructor) {
    const classes = readInheritableStaticArrayValues(constructor, "classes");
    return classes.reduce((properties, classDefinition) => {
      return Object.assign(properties, propertiesForClassDefinition(classDefinition));
    }, {});
  }
  function propertiesForClassDefinition(key) {
    return {
      [`${key}Class`]: {
        get() {
          const { classes } = this;
          if (classes.has(key)) {
            return classes.get(key);
          } else {
            const attribute = classes.getAttributeName(key);
            throw new Error(`Missing attribute "${attribute}"`);
          }
        }
      },
      [`${key}Classes`]: {
        get() {
          return this.classes.getAll(key);
        }
      },
      [`has${capitalize(key)}Class`]: {
        get() {
          return this.classes.has(key);
        }
      }
    };
  }
  function OutletPropertiesBlessing(constructor) {
    const outlets = readInheritableStaticArrayValues(constructor, "outlets");
    return outlets.reduce((properties, outletDefinition) => {
      return Object.assign(properties, propertiesForOutletDefinition(outletDefinition));
    }, {});
  }
  function propertiesForOutletDefinition(name3) {
    const camelizedName = namespaceCamelize(name3);
    return {
      [`${camelizedName}Outlet`]: {
        get() {
          const outlet = this.outlets.find(name3);
          if (outlet) {
            const outletController = this.application.getControllerForElementAndIdentifier(outlet, name3);
            if (outletController) {
              return outletController;
            } else {
              throw new Error(`Missing "data-controller=${name3}" attribute on outlet element for "${this.identifier}" controller`);
            }
          }
          throw new Error(`Missing outlet element "${name3}" for "${this.identifier}" controller`);
        }
      },
      [`${camelizedName}Outlets`]: {
        get() {
          const outlets = this.outlets.findAll(name3);
          if (outlets.length > 0) {
            return outlets.map((outlet) => {
              const controller = this.application.getControllerForElementAndIdentifier(outlet, name3);
              if (controller) {
                return controller;
              } else {
                console.warn(`The provided outlet element is missing the outlet controller "${name3}" for "${this.identifier}"`, outlet);
              }
            }).filter((controller) => controller);
          }
          return [];
        }
      },
      [`${camelizedName}OutletElement`]: {
        get() {
          const outlet = this.outlets.find(name3);
          if (outlet) {
            return outlet;
          } else {
            throw new Error(`Missing outlet element "${name3}" for "${this.identifier}" controller`);
          }
        }
      },
      [`${camelizedName}OutletElements`]: {
        get() {
          return this.outlets.findAll(name3);
        }
      },
      [`has${capitalize(camelizedName)}Outlet`]: {
        get() {
          return this.outlets.has(name3);
        }
      }
    };
  }
  function TargetPropertiesBlessing(constructor) {
    const targets = readInheritableStaticArrayValues(constructor, "targets");
    return targets.reduce((properties, targetDefinition) => {
      return Object.assign(properties, propertiesForTargetDefinition(targetDefinition));
    }, {});
  }
  function propertiesForTargetDefinition(name3) {
    return {
      [`${name3}Target`]: {
        get() {
          const target = this.targets.find(name3);
          if (target) {
            return target;
          } else {
            throw new Error(`Missing target element "${name3}" for "${this.identifier}" controller`);
          }
        }
      },
      [`${name3}Targets`]: {
        get() {
          return this.targets.findAll(name3);
        }
      },
      [`has${capitalize(name3)}Target`]: {
        get() {
          return this.targets.has(name3);
        }
      }
    };
  }
  function ValuePropertiesBlessing(constructor) {
    const valueDefinitionPairs = readInheritableStaticObjectPairs(constructor, "values");
    const propertyDescriptorMap = {
      valueDescriptorMap: {
        get() {
          return valueDefinitionPairs.reduce((result, valueDefinitionPair) => {
            const valueDescriptor = parseValueDefinitionPair(valueDefinitionPair, this.identifier);
            const attributeName = this.data.getAttributeNameForKey(valueDescriptor.key);
            return Object.assign(result, { [attributeName]: valueDescriptor });
          }, {});
        }
      }
    };
    return valueDefinitionPairs.reduce((properties, valueDefinitionPair) => {
      return Object.assign(properties, propertiesForValueDefinitionPair(valueDefinitionPair));
    }, propertyDescriptorMap);
  }
  function propertiesForValueDefinitionPair(valueDefinitionPair, controller) {
    const definition = parseValueDefinitionPair(valueDefinitionPair, controller);
    const { key, name: name3, reader: read, writer: write } = definition;
    return {
      [name3]: {
        get() {
          const value = this.data.get(key);
          if (value !== null) {
            return read(value);
          } else {
            return definition.defaultValue;
          }
        },
        set(value) {
          if (value === void 0) {
            this.data.delete(key);
          } else {
            this.data.set(key, write(value));
          }
        }
      },
      [`has${capitalize(name3)}`]: {
        get() {
          return this.data.has(key) || definition.hasCustomDefaultValue;
        }
      }
    };
  }
  function parseValueDefinitionPair([token, typeDefinition], controller) {
    return valueDescriptorForTokenAndTypeDefinition({
      controller,
      token,
      typeDefinition
    });
  }
  function parseValueTypeConstant(constant) {
    switch (constant) {
      case Array:
        return "array";
      case Boolean:
        return "boolean";
      case Number:
        return "number";
      case Object:
        return "object";
      case String:
        return "string";
    }
  }
  function parseValueTypeDefault(defaultValue) {
    switch (typeof defaultValue) {
      case "boolean":
        return "boolean";
      case "number":
        return "number";
      case "string":
        return "string";
    }
    if (Array.isArray(defaultValue))
      return "array";
    if (Object.prototype.toString.call(defaultValue) === "[object Object]")
      return "object";
  }
  function parseValueTypeObject(payload) {
    const typeFromObject = parseValueTypeConstant(payload.typeObject.type);
    if (!typeFromObject)
      return;
    const defaultValueType = parseValueTypeDefault(payload.typeObject.default);
    if (typeFromObject !== defaultValueType) {
      const propertyPath = payload.controller ? `${payload.controller}.${payload.token}` : payload.token;
      throw new Error(`The specified default value for the Stimulus Value "${propertyPath}" must match the defined type "${typeFromObject}". The provided default value of "${payload.typeObject.default}" is of type "${defaultValueType}".`);
    }
    return typeFromObject;
  }
  function parseValueTypeDefinition(payload) {
    const typeFromObject = parseValueTypeObject({
      controller: payload.controller,
      token: payload.token,
      typeObject: payload.typeDefinition
    });
    const typeFromDefaultValue = parseValueTypeDefault(payload.typeDefinition);
    const typeFromConstant = parseValueTypeConstant(payload.typeDefinition);
    const type = typeFromObject || typeFromDefaultValue || typeFromConstant;
    if (type)
      return type;
    const propertyPath = payload.controller ? `${payload.controller}.${payload.typeDefinition}` : payload.token;
    throw new Error(`Unknown value type "${propertyPath}" for "${payload.token}" value`);
  }
  function defaultValueForDefinition(typeDefinition) {
    const constant = parseValueTypeConstant(typeDefinition);
    if (constant)
      return defaultValuesByType[constant];
    const defaultValue = typeDefinition.default;
    if (defaultValue !== void 0)
      return defaultValue;
    return typeDefinition;
  }
  function valueDescriptorForTokenAndTypeDefinition(payload) {
    const key = `${dasherize(payload.token)}-value`;
    const type = parseValueTypeDefinition(payload);
    return {
      type,
      key,
      name: camelize(key),
      get defaultValue() {
        return defaultValueForDefinition(payload.typeDefinition);
      },
      get hasCustomDefaultValue() {
        return parseValueTypeDefault(payload.typeDefinition) !== void 0;
      },
      reader: readers[type],
      writer: writers[type] || writers.default
    };
  }
  var defaultValuesByType = {
    get array() {
      return [];
    },
    boolean: false,
    number: 0,
    get object() {
      return {};
    },
    string: ""
  };
  var readers = {
    array(value) {
      const array = JSON.parse(value);
      if (!Array.isArray(array)) {
        throw new TypeError(`expected value of type "array" but instead got value "${value}" of type "${parseValueTypeDefault(array)}"`);
      }
      return array;
    },
    boolean(value) {
      return !(value == "0" || String(value).toLowerCase() == "false");
    },
    number(value) {
      return Number(value);
    },
    object(value) {
      const object = JSON.parse(value);
      if (object === null || typeof object != "object" || Array.isArray(object)) {
        throw new TypeError(`expected value of type "object" but instead got value "${value}" of type "${parseValueTypeDefault(object)}"`);
      }
      return object;
    },
    string(value) {
      return value;
    }
  };
  var writers = {
    default: writeString,
    array: writeJSON,
    object: writeJSON
  };
  function writeJSON(value) {
    return JSON.stringify(value);
  }
  function writeString(value) {
    return `${value}`;
  }
  var Controller = class {
    constructor(context) {
      this.context = context;
    }
    static get shouldLoad() {
      return true;
    }
    static afterLoad(_identifier, _application) {
      return;
    }
    get application() {
      return this.context.application;
    }
    get scope() {
      return this.context.scope;
    }
    get element() {
      return this.scope.element;
    }
    get identifier() {
      return this.scope.identifier;
    }
    get targets() {
      return this.scope.targets;
    }
    get outlets() {
      return this.scope.outlets;
    }
    get classes() {
      return this.scope.classes;
    }
    get data() {
      return this.scope.data;
    }
    initialize() {
    }
    connect() {
    }
    disconnect() {
    }
    dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true } = {}) {
      const type = prefix ? `${prefix}:${eventName}` : eventName;
      const event = new CustomEvent(type, { detail, bubbles, cancelable });
      target.dispatchEvent(event);
      return event;
    }
  };
  Controller.blessings = [
    ClassPropertiesBlessing,
    TargetPropertiesBlessing,
    ValuePropertiesBlessing,
    OutletPropertiesBlessing
  ];
  Controller.targets = [];
  Controller.outlets = [];
  Controller.values = {};

  // ../../node_modules/@rails/actioncable/app/assets/javascripts/actioncable.esm.js
  var adapters = {
    logger: self.console,
    WebSocket: self.WebSocket
  };
  var logger = {
    log(...messages) {
      if (this.enabled) {
        messages.push(Date.now());
        adapters.logger.log("[ActionCable]", ...messages);
      }
    }
  };
  var now = () => (/* @__PURE__ */ new Date()).getTime();
  var secondsSince = (time) => (now() - time) / 1e3;
  var ConnectionMonitor = class {
    constructor(connection) {
      this.visibilityDidChange = this.visibilityDidChange.bind(this);
      this.connection = connection;
      this.reconnectAttempts = 0;
    }
    start() {
      if (!this.isRunning()) {
        this.startedAt = now();
        delete this.stoppedAt;
        this.startPolling();
        addEventListener("visibilitychange", this.visibilityDidChange);
        logger.log(`ConnectionMonitor started. stale threshold = ${this.constructor.staleThreshold} s`);
      }
    }
    stop() {
      if (this.isRunning()) {
        this.stoppedAt = now();
        this.stopPolling();
        removeEventListener("visibilitychange", this.visibilityDidChange);
        logger.log("ConnectionMonitor stopped");
      }
    }
    isRunning() {
      return this.startedAt && !this.stoppedAt;
    }
    recordPing() {
      this.pingedAt = now();
    }
    recordConnect() {
      this.reconnectAttempts = 0;
      this.recordPing();
      delete this.disconnectedAt;
      logger.log("ConnectionMonitor recorded connect");
    }
    recordDisconnect() {
      this.disconnectedAt = now();
      logger.log("ConnectionMonitor recorded disconnect");
    }
    startPolling() {
      this.stopPolling();
      this.poll();
    }
    stopPolling() {
      clearTimeout(this.pollTimeout);
    }
    poll() {
      this.pollTimeout = setTimeout(() => {
        this.reconnectIfStale();
        this.poll();
      }, this.getPollInterval());
    }
    getPollInterval() {
      const { staleThreshold, reconnectionBackoffRate } = this.constructor;
      const backoff = Math.pow(1 + reconnectionBackoffRate, Math.min(this.reconnectAttempts, 10));
      const jitterMax = this.reconnectAttempts === 0 ? 1 : reconnectionBackoffRate;
      const jitter = jitterMax * Math.random();
      return staleThreshold * 1e3 * backoff * (1 + jitter);
    }
    reconnectIfStale() {
      if (this.connectionIsStale()) {
        logger.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, time stale = ${secondsSince(this.refreshedAt)} s, stale threshold = ${this.constructor.staleThreshold} s`);
        this.reconnectAttempts++;
        if (this.disconnectedRecently()) {
          logger.log(`ConnectionMonitor skipping reopening recent disconnect. time disconnected = ${secondsSince(this.disconnectedAt)} s`);
        } else {
          logger.log("ConnectionMonitor reopening");
          this.connection.reopen();
        }
      }
    }
    get refreshedAt() {
      return this.pingedAt ? this.pingedAt : this.startedAt;
    }
    connectionIsStale() {
      return secondsSince(this.refreshedAt) > this.constructor.staleThreshold;
    }
    disconnectedRecently() {
      return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
    }
    visibilityDidChange() {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          if (this.connectionIsStale() || !this.connection.isOpen()) {
            logger.log(`ConnectionMonitor reopening stale connection on visibilitychange. visibilityState = ${document.visibilityState}`);
            this.connection.reopen();
          }
        }, 200);
      }
    }
  };
  ConnectionMonitor.staleThreshold = 6;
  ConnectionMonitor.reconnectionBackoffRate = 0.15;
  var INTERNAL = {
    message_types: {
      welcome: "welcome",
      disconnect: "disconnect",
      ping: "ping",
      confirmation: "confirm_subscription",
      rejection: "reject_subscription"
    },
    disconnect_reasons: {
      unauthorized: "unauthorized",
      invalid_request: "invalid_request",
      server_restart: "server_restart"
    },
    default_mount_path: "/cable",
    protocols: ["actioncable-v1-json", "actioncable-unsupported"]
  };
  var { message_types, protocols } = INTERNAL;
  var supportedProtocols = protocols.slice(0, protocols.length - 1);
  var indexOf = [].indexOf;
  var Connection = class {
    constructor(consumer3) {
      this.open = this.open.bind(this);
      this.consumer = consumer3;
      this.subscriptions = this.consumer.subscriptions;
      this.monitor = new ConnectionMonitor(this);
      this.disconnected = true;
    }
    send(data) {
      if (this.isOpen()) {
        this.webSocket.send(JSON.stringify(data));
        return true;
      } else {
        return false;
      }
    }
    open() {
      if (this.isActive()) {
        logger.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`);
        return false;
      } else {
        logger.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${protocols}`);
        if (this.webSocket) {
          this.uninstallEventHandlers();
        }
        this.webSocket = new adapters.WebSocket(this.consumer.url, protocols);
        this.installEventHandlers();
        this.monitor.start();
        return true;
      }
    }
    close({ allowReconnect } = {
      allowReconnect: true
    }) {
      if (!allowReconnect) {
        this.monitor.stop();
      }
      if (this.isOpen()) {
        return this.webSocket.close();
      }
    }
    reopen() {
      logger.log(`Reopening WebSocket, current state is ${this.getState()}`);
      if (this.isActive()) {
        try {
          return this.close();
        } catch (error3) {
          logger.log("Failed to reopen WebSocket", error3);
        } finally {
          logger.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`);
          setTimeout(this.open, this.constructor.reopenDelay);
        }
      } else {
        return this.open();
      }
    }
    getProtocol() {
      if (this.webSocket) {
        return this.webSocket.protocol;
      }
    }
    isOpen() {
      return this.isState("open");
    }
    isActive() {
      return this.isState("open", "connecting");
    }
    isProtocolSupported() {
      return indexOf.call(supportedProtocols, this.getProtocol()) >= 0;
    }
    isState(...states) {
      return indexOf.call(states, this.getState()) >= 0;
    }
    getState() {
      if (this.webSocket) {
        for (let state in adapters.WebSocket) {
          if (adapters.WebSocket[state] === this.webSocket.readyState) {
            return state.toLowerCase();
          }
        }
      }
      return null;
    }
    installEventHandlers() {
      for (let eventName in this.events) {
        const handler = this.events[eventName].bind(this);
        this.webSocket[`on${eventName}`] = handler;
      }
    }
    uninstallEventHandlers() {
      for (let eventName in this.events) {
        this.webSocket[`on${eventName}`] = function() {
        };
      }
    }
  };
  Connection.reopenDelay = 500;
  Connection.prototype.events = {
    message(event) {
      if (!this.isProtocolSupported()) {
        return;
      }
      const { identifier, message, reason, reconnect, type } = JSON.parse(event.data);
      switch (type) {
        case message_types.welcome:
          this.monitor.recordConnect();
          return this.subscriptions.reload();
        case message_types.disconnect:
          logger.log(`Disconnecting. Reason: ${reason}`);
          return this.close({
            allowReconnect: reconnect
          });
        case message_types.ping:
          return this.monitor.recordPing();
        case message_types.confirmation:
          this.subscriptions.confirmSubscription(identifier);
          return this.subscriptions.notify(identifier, "connected");
        case message_types.rejection:
          return this.subscriptions.reject(identifier);
        default:
          return this.subscriptions.notify(identifier, "received", message);
      }
    },
    open() {
      logger.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`);
      this.disconnected = false;
      if (!this.isProtocolSupported()) {
        logger.log("Protocol is unsupported. Stopping monitor and disconnecting.");
        return this.close({
          allowReconnect: false
        });
      }
    },
    close(event) {
      logger.log("WebSocket onclose event");
      if (this.disconnected) {
        return;
      }
      this.disconnected = true;
      this.monitor.recordDisconnect();
      return this.subscriptions.notifyAll("disconnected", {
        willAttemptReconnect: this.monitor.isRunning()
      });
    },
    error() {
      logger.log("WebSocket onerror event");
    }
  };
  var extend2 = function(object, properties) {
    if (properties != null) {
      for (let key in properties) {
        const value = properties[key];
        object[key] = value;
      }
    }
    return object;
  };
  var Subscription = class {
    constructor(consumer3, params2 = {}, mixin) {
      this.consumer = consumer3;
      this.identifier = JSON.stringify(params2);
      extend2(this, mixin);
    }
    perform(action, data = {}) {
      data.action = action;
      return this.send(data);
    }
    send(data) {
      return this.consumer.send({
        command: "message",
        identifier: this.identifier,
        data: JSON.stringify(data)
      });
    }
    unsubscribe() {
      return this.consumer.subscriptions.remove(this);
    }
  };
  var SubscriptionGuarantor = class {
    constructor(subscriptions) {
      this.subscriptions = subscriptions;
      this.pendingSubscriptions = [];
    }
    guarantee(subscription2) {
      if (this.pendingSubscriptions.indexOf(subscription2) == -1) {
        logger.log(`SubscriptionGuarantor guaranteeing ${subscription2.identifier}`);
        this.pendingSubscriptions.push(subscription2);
      } else {
        logger.log(`SubscriptionGuarantor already guaranteeing ${subscription2.identifier}`);
      }
      this.startGuaranteeing();
    }
    forget(subscription2) {
      logger.log(`SubscriptionGuarantor forgetting ${subscription2.identifier}`);
      this.pendingSubscriptions = this.pendingSubscriptions.filter((s2) => s2 !== subscription2);
    }
    startGuaranteeing() {
      this.stopGuaranteeing();
      this.retrySubscribing();
    }
    stopGuaranteeing() {
      clearTimeout(this.retryTimeout);
    }
    retrySubscribing() {
      this.retryTimeout = setTimeout(() => {
        if (this.subscriptions && typeof this.subscriptions.subscribe === "function") {
          this.pendingSubscriptions.map((subscription2) => {
            logger.log(`SubscriptionGuarantor resubscribing ${subscription2.identifier}`);
            this.subscriptions.subscribe(subscription2);
          });
        }
      }, 500);
    }
  };
  var Subscriptions = class {
    constructor(consumer3) {
      this.consumer = consumer3;
      this.guarantor = new SubscriptionGuarantor(this);
      this.subscriptions = [];
    }
    create(channelName, mixin) {
      const channel = channelName;
      const params2 = typeof channel === "object" ? channel : {
        channel
      };
      const subscription2 = new Subscription(this.consumer, params2, mixin);
      return this.add(subscription2);
    }
    add(subscription2) {
      this.subscriptions.push(subscription2);
      this.consumer.ensureActiveConnection();
      this.notify(subscription2, "initialized");
      this.subscribe(subscription2);
      return subscription2;
    }
    remove(subscription2) {
      this.forget(subscription2);
      if (!this.findAll(subscription2.identifier).length) {
        this.sendCommand(subscription2, "unsubscribe");
      }
      return subscription2;
    }
    reject(identifier) {
      return this.findAll(identifier).map((subscription2) => {
        this.forget(subscription2);
        this.notify(subscription2, "rejected");
        return subscription2;
      });
    }
    forget(subscription2) {
      this.guarantor.forget(subscription2);
      this.subscriptions = this.subscriptions.filter((s2) => s2 !== subscription2);
      return subscription2;
    }
    findAll(identifier) {
      return this.subscriptions.filter((s2) => s2.identifier === identifier);
    }
    reload() {
      return this.subscriptions.map((subscription2) => this.subscribe(subscription2));
    }
    notifyAll(callbackName, ...args) {
      return this.subscriptions.map((subscription2) => this.notify(subscription2, callbackName, ...args));
    }
    notify(subscription2, callbackName, ...args) {
      let subscriptions;
      if (typeof subscription2 === "string") {
        subscriptions = this.findAll(subscription2);
      } else {
        subscriptions = [subscription2];
      }
      return subscriptions.map((subscription3) => typeof subscription3[callbackName] === "function" ? subscription3[callbackName](...args) : void 0);
    }
    subscribe(subscription2) {
      if (this.sendCommand(subscription2, "subscribe")) {
        this.guarantor.guarantee(subscription2);
      }
    }
    confirmSubscription(identifier) {
      logger.log(`Subscription confirmed ${identifier}`);
      this.findAll(identifier).map((subscription2) => this.guarantor.forget(subscription2));
    }
    sendCommand(subscription2, command) {
      const { identifier } = subscription2;
      return this.consumer.send({
        command,
        identifier
      });
    }
  };
  var Consumer = class {
    constructor(url) {
      this._url = url;
      this.subscriptions = new Subscriptions(this);
      this.connection = new Connection(this);
    }
    get url() {
      return createWebSocketURL(this._url);
    }
    send(data) {
      return this.connection.send(data);
    }
    connect() {
      return this.connection.open();
    }
    disconnect() {
      return this.connection.close({
        allowReconnect: false
      });
    }
    ensureActiveConnection() {
      if (!this.connection.isActive()) {
        return this.connection.open();
      }
    }
  };
  function createWebSocketURL(url) {
    if (typeof url === "function") {
      url = url();
    }
    if (url && !/^wss?:/i.test(url)) {
      const a2 = document.createElement("a");
      a2.href = url;
      a2.href = a2.href;
      a2.protocol = a2.protocol.replace("http", "ws");
      return a2.href;
    } else {
      return url;
    }
  }
  function createConsumer(url = getConfig("url") || INTERNAL.default_mount_path) {
    return new Consumer(url);
  }
  function getConfig(name3) {
    const element = document.head.querySelector(`meta[name='action-cable-${name3}']`);
    if (element) {
      return element.getAttribute("content");
    }
  }

  // channels/consumer.js
  var consumer_default = createConsumer();

  // controllers/application.js
  var application = Application.start();
  application.debug = false;
  application.consumer = consumer_default;
  window.Stimulus = application;

  // controllers/application_controller.js
  var application_controller_exports = {};
  __export(application_controller_exports, {
    default: () => application_controller_default
  });

  // ../../node_modules/morphdom/dist/morphdom-esm.js
  var DOCUMENT_FRAGMENT_NODE = 11;
  function morphAttrs(fromNode, toNode) {
    var toNodeAttrs = toNode.attributes;
    var attr;
    var attrName;
    var attrNamespaceURI;
    var attrValue;
    var fromValue;
    if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE || fromNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
      return;
    }
    for (var i2 = toNodeAttrs.length - 1; i2 >= 0; i2--) {
      attr = toNodeAttrs[i2];
      attrName = attr.name;
      attrNamespaceURI = attr.namespaceURI;
      attrValue = attr.value;
      if (attrNamespaceURI) {
        attrName = attr.localName || attrName;
        fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);
        if (fromValue !== attrValue) {
          if (attr.prefix === "xmlns") {
            attrName = attr.name;
          }
          fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
        }
      } else {
        fromValue = fromNode.getAttribute(attrName);
        if (fromValue !== attrValue) {
          fromNode.setAttribute(attrName, attrValue);
        }
      }
    }
    var fromNodeAttrs = fromNode.attributes;
    for (var d2 = fromNodeAttrs.length - 1; d2 >= 0; d2--) {
      attr = fromNodeAttrs[d2];
      attrName = attr.name;
      attrNamespaceURI = attr.namespaceURI;
      if (attrNamespaceURI) {
        attrName = attr.localName || attrName;
        if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
          fromNode.removeAttributeNS(attrNamespaceURI, attrName);
        }
      } else {
        if (!toNode.hasAttribute(attrName)) {
          fromNode.removeAttribute(attrName);
        }
      }
    }
  }
  var range;
  var NS_XHTML = "http://www.w3.org/1999/xhtml";
  var doc = typeof document === "undefined" ? void 0 : document;
  var HAS_TEMPLATE_SUPPORT = !!doc && "content" in doc.createElement("template");
  var HAS_RANGE_SUPPORT = !!doc && doc.createRange && "createContextualFragment" in doc.createRange();
  function createFragmentFromTemplate(str) {
    var template2 = doc.createElement("template");
    template2.innerHTML = str;
    return template2.content.childNodes[0];
  }
  function createFragmentFromRange(str) {
    if (!range) {
      range = doc.createRange();
      range.selectNode(doc.body);
    }
    var fragment = range.createContextualFragment(str);
    return fragment.childNodes[0];
  }
  function createFragmentFromWrap(str) {
    var fragment = doc.createElement("body");
    fragment.innerHTML = str;
    return fragment.childNodes[0];
  }
  function toElement(str) {
    str = str.trim();
    if (HAS_TEMPLATE_SUPPORT) {
      return createFragmentFromTemplate(str);
    } else if (HAS_RANGE_SUPPORT) {
      return createFragmentFromRange(str);
    }
    return createFragmentFromWrap(str);
  }
  function compareNodeNames(fromEl, toEl) {
    var fromNodeName = fromEl.nodeName;
    var toNodeName = toEl.nodeName;
    var fromCodeStart, toCodeStart;
    if (fromNodeName === toNodeName) {
      return true;
    }
    fromCodeStart = fromNodeName.charCodeAt(0);
    toCodeStart = toNodeName.charCodeAt(0);
    if (fromCodeStart <= 90 && toCodeStart >= 97) {
      return fromNodeName === toNodeName.toUpperCase();
    } else if (toCodeStart <= 90 && fromCodeStart >= 97) {
      return toNodeName === fromNodeName.toUpperCase();
    } else {
      return false;
    }
  }
  function createElementNS(name3, namespaceURI) {
    return !namespaceURI || namespaceURI === NS_XHTML ? doc.createElement(name3) : doc.createElementNS(namespaceURI, name3);
  }
  function moveChildren(fromEl, toEl) {
    var curChild = fromEl.firstChild;
    while (curChild) {
      var nextChild = curChild.nextSibling;
      toEl.appendChild(curChild);
      curChild = nextChild;
    }
    return toEl;
  }
  function syncBooleanAttrProp(fromEl, toEl, name3) {
    if (fromEl[name3] !== toEl[name3]) {
      fromEl[name3] = toEl[name3];
      if (fromEl[name3]) {
        fromEl.setAttribute(name3, "");
      } else {
        fromEl.removeAttribute(name3);
      }
    }
  }
  var specialElHandlers = {
    OPTION: function(fromEl, toEl) {
      var parentNode = fromEl.parentNode;
      if (parentNode) {
        var parentName = parentNode.nodeName.toUpperCase();
        if (parentName === "OPTGROUP") {
          parentNode = parentNode.parentNode;
          parentName = parentNode && parentNode.nodeName.toUpperCase();
        }
        if (parentName === "SELECT" && !parentNode.hasAttribute("multiple")) {
          if (fromEl.hasAttribute("selected") && !toEl.selected) {
            fromEl.setAttribute("selected", "selected");
            fromEl.removeAttribute("selected");
          }
          parentNode.selectedIndex = -1;
        }
      }
      syncBooleanAttrProp(fromEl, toEl, "selected");
    },
    /**
     * The "value" attribute is special for the <input> element since it sets
     * the initial value. Changing the "value" attribute without changing the
     * "value" property will have no effect since it is only used to the set the
     * initial value.  Similar for the "checked" attribute, and "disabled".
     */
    INPUT: function(fromEl, toEl) {
      syncBooleanAttrProp(fromEl, toEl, "checked");
      syncBooleanAttrProp(fromEl, toEl, "disabled");
      if (fromEl.value !== toEl.value) {
        fromEl.value = toEl.value;
      }
      if (!toEl.hasAttribute("value")) {
        fromEl.removeAttribute("value");
      }
    },
    TEXTAREA: function(fromEl, toEl) {
      var newValue = toEl.value;
      if (fromEl.value !== newValue) {
        fromEl.value = newValue;
      }
      var firstChild = fromEl.firstChild;
      if (firstChild) {
        var oldValue = firstChild.nodeValue;
        if (oldValue == newValue || !newValue && oldValue == fromEl.placeholder) {
          return;
        }
        firstChild.nodeValue = newValue;
      }
    },
    SELECT: function(fromEl, toEl) {
      if (!toEl.hasAttribute("multiple")) {
        var selectedIndex = -1;
        var i2 = 0;
        var curChild = fromEl.firstChild;
        var optgroup;
        var nodeName;
        while (curChild) {
          nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
          if (nodeName === "OPTGROUP") {
            optgroup = curChild;
            curChild = optgroup.firstChild;
          } else {
            if (nodeName === "OPTION") {
              if (curChild.hasAttribute("selected")) {
                selectedIndex = i2;
                break;
              }
              i2++;
            }
            curChild = curChild.nextSibling;
            if (!curChild && optgroup) {
              curChild = optgroup.nextSibling;
              optgroup = null;
            }
          }
        }
        fromEl.selectedIndex = selectedIndex;
      }
    }
  };
  var ELEMENT_NODE = 1;
  var DOCUMENT_FRAGMENT_NODE$1 = 11;
  var TEXT_NODE = 3;
  var COMMENT_NODE = 8;
  function noop() {
  }
  function defaultGetNodeKey(node) {
    if (node) {
      return node.getAttribute && node.getAttribute("id") || node.id;
    }
  }
  function morphdomFactory(morphAttrs2) {
    return function morphdom2(fromNode, toNode, options) {
      if (!options) {
        options = {};
      }
      if (typeof toNode === "string") {
        if (fromNode.nodeName === "#document" || fromNode.nodeName === "HTML" || fromNode.nodeName === "BODY") {
          var toNodeHtml = toNode;
          toNode = doc.createElement("html");
          toNode.innerHTML = toNodeHtml;
        } else {
          toNode = toElement(toNode);
        }
      }
      var getNodeKey = options.getNodeKey || defaultGetNodeKey;
      var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
      var onNodeAdded = options.onNodeAdded || noop;
      var onBeforeElUpdated = options.onBeforeElUpdated || noop;
      var onElUpdated = options.onElUpdated || noop;
      var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
      var onNodeDiscarded = options.onNodeDiscarded || noop;
      var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
      var childrenOnly = options.childrenOnly === true;
      var fromNodesLookup = /* @__PURE__ */ Object.create(null);
      var keyedRemovalList = [];
      function addKeyedRemoval(key) {
        keyedRemovalList.push(key);
      }
      function walkDiscardedChildNodes(node, skipKeyedNodes) {
        if (node.nodeType === ELEMENT_NODE) {
          var curChild = node.firstChild;
          while (curChild) {
            var key = void 0;
            if (skipKeyedNodes && (key = getNodeKey(curChild))) {
              addKeyedRemoval(key);
            } else {
              onNodeDiscarded(curChild);
              if (curChild.firstChild) {
                walkDiscardedChildNodes(curChild, skipKeyedNodes);
              }
            }
            curChild = curChild.nextSibling;
          }
        }
      }
      function removeNode(node, parentNode, skipKeyedNodes) {
        if (onBeforeNodeDiscarded(node) === false) {
          return;
        }
        if (parentNode) {
          parentNode.removeChild(node);
        }
        onNodeDiscarded(node);
        walkDiscardedChildNodes(node, skipKeyedNodes);
      }
      function indexTree(node) {
        if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
          var curChild = node.firstChild;
          while (curChild) {
            var key = getNodeKey(curChild);
            if (key) {
              fromNodesLookup[key] = curChild;
            }
            indexTree(curChild);
            curChild = curChild.nextSibling;
          }
        }
      }
      indexTree(fromNode);
      function handleNodeAdded(el) {
        onNodeAdded(el);
        var curChild = el.firstChild;
        while (curChild) {
          var nextSibling = curChild.nextSibling;
          var key = getNodeKey(curChild);
          if (key) {
            var unmatchedFromEl = fromNodesLookup[key];
            if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
              curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
              morphEl(unmatchedFromEl, curChild);
            } else {
              handleNodeAdded(curChild);
            }
          } else {
            handleNodeAdded(curChild);
          }
          curChild = nextSibling;
        }
      }
      function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
        while (curFromNodeChild) {
          var fromNextSibling = curFromNodeChild.nextSibling;
          if (curFromNodeKey = getNodeKey(curFromNodeChild)) {
            addKeyedRemoval(curFromNodeKey);
          } else {
            removeNode(
              curFromNodeChild,
              fromEl,
              true
              /* skip keyed nodes */
            );
          }
          curFromNodeChild = fromNextSibling;
        }
      }
      function morphEl(fromEl, toEl, childrenOnly2) {
        var toElKey = getNodeKey(toEl);
        if (toElKey) {
          delete fromNodesLookup[toElKey];
        }
        if (!childrenOnly2) {
          if (onBeforeElUpdated(fromEl, toEl) === false) {
            return;
          }
          morphAttrs2(fromEl, toEl);
          onElUpdated(fromEl);
          if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
            return;
          }
        }
        if (fromEl.nodeName !== "TEXTAREA") {
          morphChildren(fromEl, toEl);
        } else {
          specialElHandlers.TEXTAREA(fromEl, toEl);
        }
      }
      function morphChildren(fromEl, toEl) {
        var curToNodeChild = toEl.firstChild;
        var curFromNodeChild = fromEl.firstChild;
        var curToNodeKey;
        var curFromNodeKey;
        var fromNextSibling;
        var toNextSibling;
        var matchingFromEl;
        outer:
          while (curToNodeChild) {
            toNextSibling = curToNodeChild.nextSibling;
            curToNodeKey = getNodeKey(curToNodeChild);
            while (curFromNodeChild) {
              fromNextSibling = curFromNodeChild.nextSibling;
              if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
                curToNodeChild = toNextSibling;
                curFromNodeChild = fromNextSibling;
                continue outer;
              }
              curFromNodeKey = getNodeKey(curFromNodeChild);
              var curFromNodeType = curFromNodeChild.nodeType;
              var isCompatible = void 0;
              if (curFromNodeType === curToNodeChild.nodeType) {
                if (curFromNodeType === ELEMENT_NODE) {
                  if (curToNodeKey) {
                    if (curToNodeKey !== curFromNodeKey) {
                      if (matchingFromEl = fromNodesLookup[curToNodeKey]) {
                        if (fromNextSibling === matchingFromEl) {
                          isCompatible = false;
                        } else {
                          fromEl.insertBefore(matchingFromEl, curFromNodeChild);
                          if (curFromNodeKey) {
                            addKeyedRemoval(curFromNodeKey);
                          } else {
                            removeNode(
                              curFromNodeChild,
                              fromEl,
                              true
                              /* skip keyed nodes */
                            );
                          }
                          curFromNodeChild = matchingFromEl;
                        }
                      } else {
                        isCompatible = false;
                      }
                    }
                  } else if (curFromNodeKey) {
                    isCompatible = false;
                  }
                  isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
                  if (isCompatible) {
                    morphEl(curFromNodeChild, curToNodeChild);
                  }
                } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                  isCompatible = true;
                  if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
                    curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                  }
                }
              }
              if (isCompatible) {
                curToNodeChild = toNextSibling;
                curFromNodeChild = fromNextSibling;
                continue outer;
              }
              if (curFromNodeKey) {
                addKeyedRemoval(curFromNodeKey);
              } else {
                removeNode(
                  curFromNodeChild,
                  fromEl,
                  true
                  /* skip keyed nodes */
                );
              }
              curFromNodeChild = fromNextSibling;
            }
            if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
              fromEl.appendChild(matchingFromEl);
              morphEl(matchingFromEl, curToNodeChild);
            } else {
              var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
              if (onBeforeNodeAddedResult !== false) {
                if (onBeforeNodeAddedResult) {
                  curToNodeChild = onBeforeNodeAddedResult;
                }
                if (curToNodeChild.actualize) {
                  curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
                }
                fromEl.appendChild(curToNodeChild);
                handleNodeAdded(curToNodeChild);
              }
            }
            curToNodeChild = toNextSibling;
            curFromNodeChild = fromNextSibling;
          }
        cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);
        var specialElHandler = specialElHandlers[fromEl.nodeName];
        if (specialElHandler) {
          specialElHandler(fromEl, toEl);
        }
      }
      var morphedNode = fromNode;
      var morphedNodeType = morphedNode.nodeType;
      var toNodeType = toNode.nodeType;
      if (!childrenOnly) {
        if (morphedNodeType === ELEMENT_NODE) {
          if (toNodeType === ELEMENT_NODE) {
            if (!compareNodeNames(fromNode, toNode)) {
              onNodeDiscarded(fromNode);
              morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
            }
          } else {
            morphedNode = toNode;
          }
        } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) {
          if (toNodeType === morphedNodeType) {
            if (morphedNode.nodeValue !== toNode.nodeValue) {
              morphedNode.nodeValue = toNode.nodeValue;
            }
            return morphedNode;
          } else {
            morphedNode = toNode;
          }
        }
      }
      if (morphedNode === toNode) {
        onNodeDiscarded(fromNode);
      } else {
        if (toNode.isSameNode && toNode.isSameNode(morphedNode)) {
          return;
        }
        morphEl(morphedNode, toNode, childrenOnly);
        if (keyedRemovalList) {
          for (var i2 = 0, len = keyedRemovalList.length; i2 < len; i2++) {
            var elToRemove = fromNodesLookup[keyedRemovalList[i2]];
            if (elToRemove) {
              removeNode(elToRemove, elToRemove.parentNode, false);
            }
          }
        }
      }
      if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
        if (morphedNode.actualize) {
          morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
        }
        fromNode.parentNode.replaceChild(morphedNode, fromNode);
      }
      return morphedNode;
    };
  }
  var morphdom = morphdomFactory(morphAttrs);
  var morphdom_esm_default = morphdom;

  // ../../node_modules/cable_ready/dist/cable_ready.js
  var name = "cable_ready";
  var version = "5.0.0-rc2";
  var description = "CableReady helps you create great real-time user experiences by making it simple to trigger client-side DOM changes from server-side Ruby.";
  var keywords = ["ruby", "rails", "websockets", "actioncable", "cable", "ssr", "stimulus_reflex", "client-side", "dom"];
  var homepage = "https://cableready.stimulusreflex.com";
  var bugs = "https://github.com/stimulusreflex/cable_ready/issues";
  var repository = "https://github.com/stimulusreflex/cable_ready";
  var license = "MIT";
  var author = "Nathan Hopkins <natehop@gmail.com>";
  var contributors = ["Andrew Mason <andrewmcodes@protonmail.com>", "Julian Rubisch <julian@julianrubisch.at>", "Marco Roth <marco.roth@intergga.ch>", "Nathan Hopkins <natehop@gmail.com>"];
  var main = "./dist/cable_ready.js";
  var module = "./dist/cable_ready.js";
  var browser = "./dist/cable_ready.js";
  var unpkg = "./dist/cable_ready.umd.js";
  var umd = "./dist/cable_ready.umd.js";
  var files = ["dist/*", "javascript/*"];
  var scripts = {
    lint: "yarn run format --check",
    format: "yarn run prettier-standard ./javascript/**/*.js rollup.config.mjs",
    build: "yarn rollup -c",
    watch: "yarn rollup -wc",
    test: "web-test-runner javascript/test/**/*.test.js",
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs && cp ./docs/_redirects ./docs/.vitepress/dist",
    "docs:preview": "vitepress preview docs"
  };
  var dependencies = {
    morphdom: "2.6.1"
  };
  var devDependencies = {
    "@open-wc/testing": "^3.1.7",
    "@rollup/plugin-json": "^6.0.0",
    "@rollup/plugin-node-resolve": "^15.0.1",
    "@rollup/plugin-terser": "^0.4.0",
    "@web/dev-server-esbuild": "^0.3.3",
    "@web/dev-server-rollup": "^0.3.21",
    "@web/test-runner": "^0.15.1",
    "prettier-standard": "^16.4.1",
    rollup: "^3.19.1",
    sinon: "^15.0.2",
    vite: "^4.1.4",
    vitepress: "^1.0.0-alpha.56",
    "vitepress-plugin-search": "^1.0.4-alpha.19"
  };
  var packageInfo = {
    name,
    version,
    description,
    keywords,
    homepage,
    bugs,
    repository,
    license,
    author,
    contributors,
    main,
    module,
    browser,
    import: "./dist/cable_ready.js",
    unpkg,
    umd,
    files,
    scripts,
    dependencies,
    devDependencies
  };
  var inputTags = {
    INPUT: true,
    TEXTAREA: true,
    SELECT: true
  };
  var mutableTags = {
    INPUT: true,
    TEXTAREA: true,
    OPTION: true
  };
  var textInputTypes = {
    "datetime-local": true,
    "select-multiple": true,
    "select-one": true,
    color: true,
    date: true,
    datetime: true,
    email: true,
    month: true,
    number: true,
    password: true,
    range: true,
    search: true,
    tel: true,
    text: true,
    textarea: true,
    time: true,
    url: true,
    week: true
  };
  var activeElement;
  var ActiveElement = {
    get element() {
      return activeElement;
    },
    set(element) {
      activeElement = element;
    }
  };
  var isTextInput = (element) => inputTags[element.tagName] && textInputTypes[element.type];
  var assignFocus = (selector) => {
    const element = selector && selector.nodeType === Node.ELEMENT_NODE ? selector : document.querySelector(selector);
    const focusElement = element || ActiveElement.element;
    if (focusElement && focusElement.focus)
      focusElement.focus();
  };
  var dispatch = (element, name3, detail = {}) => {
    const init = {
      bubbles: true,
      cancelable: true,
      detail
    };
    const event = new CustomEvent(name3, init);
    element.dispatchEvent(event);
    if (window.jQuery)
      window.jQuery(element).trigger(name3, detail);
  };
  var xpathToElement = (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  var xpathToElementArray = (xpath, reverse = false) => {
    const snapshotList = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const snapshots = [];
    for (let i2 = 0; i2 < snapshotList.snapshotLength; i2++) {
      snapshots.push(snapshotList.snapshotItem(i2));
    }
    return reverse ? snapshots.reverse() : snapshots;
  };
  var getClassNames = (names) => Array.from(names).flat();
  var processElements = (operation, callback) => {
    Array.from(operation.selectAll ? operation.element : [operation.element]).forEach(callback);
  };
  var kebabize = createCompounder(function(result, word, index) {
    return result + (index ? "-" : "") + word.toLowerCase();
  });
  function createCompounder(callback) {
    return function(str) {
      return words(str).reduce(callback, "");
    };
  }
  var words = (str) => {
    str = str == null ? "" : str;
    return str.match(/([A-Z]{2,}|[0-9]+|[A-Z]?[a-z]+|[A-Z])/g) || [];
  };
  var operate = (operation, callback) => {
    if (!operation.cancel) {
      operation.delay ? setTimeout(callback, operation.delay) : callback();
      return true;
    }
    return false;
  };
  var before = (target, operation) => dispatch(target, `cable-ready:before-${kebabize(operation.operation)}`, operation);
  var after = (target, operation) => dispatch(target, `cable-ready:after-${kebabize(operation.operation)}`, operation);
  function debounce(fn2, delay = 250) {
    let timer;
    return (...args) => {
      const callback = () => fn2.apply(this, args);
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(callback, delay);
    };
  }
  function handleErrors(response2) {
    if (!response2.ok)
      throw Error(response2.statusText);
    return response2;
  }
  function safeScalar(val) {
    if (val !== void 0 && !["string", "number", "boolean"].includes(typeof val))
      console.warn(`Operation expects a string, number or boolean, but got ${val} (${typeof val})`);
    return val != null ? val : "";
  }
  function safeString(str) {
    if (str !== void 0 && typeof str !== "string")
      console.warn(`Operation expects a string, but got ${str} (${typeof str})`);
    return str != null ? String(str) : "";
  }
  function safeArray(arr) {
    if (arr !== void 0 && !Array.isArray(arr))
      console.warn(`Operation expects an array, but got ${arr} (${typeof arr})`);
    return arr != null ? Array.from(arr) : [];
  }
  function safeObject(obj) {
    if (obj !== void 0 && typeof obj !== "object")
      console.warn(`Operation expects an object, but got ${obj} (${typeof obj})`);
    return obj != null ? Object(obj) : {};
  }
  function safeStringOrArray(elem) {
    if (elem !== void 0 && !Array.isArray(elem) && typeof elem !== "string")
      console.warn(`Operation expects an Array or a String, but got ${elem} (${typeof elem})`);
    return elem == null ? "" : Array.isArray(elem) ? Array.from(elem) : String(elem);
  }
  function fragmentToString(fragment) {
    return new XMLSerializer().serializeToString(fragment);
  }
  async function graciouslyFetch(url, additionalHeaders) {
    try {
      const response2 = await fetch(url, {
        headers: {
          "X-REQUESTED-WITH": "XmlHttpRequest",
          ...additionalHeaders
        }
      });
      if (response2 == void 0)
        return;
      handleErrors(response2);
      return response2;
    } catch (e2) {
      console.error(`Could not fetch ${url}`);
    }
  }
  var utils = Object.freeze({
    __proto__: null,
    after,
    assignFocus,
    before,
    debounce,
    dispatch,
    fragmentToString,
    getClassNames,
    graciouslyFetch,
    handleErrors,
    isTextInput,
    kebabize,
    operate,
    processElements,
    safeArray,
    safeObject,
    safeScalar,
    safeString,
    safeStringOrArray,
    xpathToElement,
    xpathToElementArray
  });
  var shouldMorph = (operation) => (fromEl, toEl) => !shouldMorphCallbacks.map((callback) => typeof callback === "function" ? callback(operation, fromEl, toEl) : true).includes(false);
  var didMorph = (operation) => (el) => {
    didMorphCallbacks.forEach((callback) => {
      if (typeof callback === "function")
        callback(operation, el);
    });
  };
  var verifyNotMutable = (detail, fromEl, toEl) => {
    if (!mutableTags[fromEl.tagName] && fromEl.isEqualNode(toEl))
      return false;
    return true;
  };
  var verifyNotContentEditable = (detail, fromEl, toEl) => {
    if (fromEl === ActiveElement.element && fromEl.isContentEditable)
      return false;
    return true;
  };
  var verifyNotPermanent = (detail, fromEl, toEl) => {
    const { permanentAttributeName } = detail;
    if (!permanentAttributeName)
      return true;
    const permanent = fromEl.closest(`[${permanentAttributeName}]`);
    if (!permanent && fromEl === ActiveElement.element && isTextInput(fromEl)) {
      const ignore = {
        value: true
      };
      Array.from(toEl.attributes).forEach((attribute) => {
        if (!ignore[attribute.name])
          fromEl.setAttribute(attribute.name, attribute.value);
      });
      return false;
    }
    return !permanent;
  };
  var shouldMorphCallbacks = [verifyNotMutable, verifyNotPermanent, verifyNotContentEditable];
  var didMorphCallbacks = [];
  var morph_callbacks = Object.freeze({
    __proto__: null,
    didMorph,
    didMorphCallbacks,
    shouldMorph,
    shouldMorphCallbacks,
    verifyNotContentEditable,
    verifyNotMutable,
    verifyNotPermanent
  });
  var Operations = {
    // DOM Mutations
    append: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { html, focusSelector } = operation;
          element.insertAdjacentHTML("beforeend", safeScalar(html));
          assignFocus(focusSelector);
        });
        after(element, operation);
      });
    },
    graft: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { parent, focusSelector } = operation;
          const parentElement = document.querySelector(parent);
          if (parentElement) {
            parentElement.appendChild(element);
            assignFocus(focusSelector);
          }
        });
        after(element, operation);
      });
    },
    innerHtml: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { html, focusSelector } = operation;
          element.innerHTML = safeScalar(html);
          assignFocus(focusSelector);
        });
        after(element, operation);
      });
    },
    insertAdjacentHtml: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { html, position, focusSelector } = operation;
          element.insertAdjacentHTML(position || "beforeend", safeScalar(html));
          assignFocus(focusSelector);
        });
        after(element, operation);
      });
    },
    insertAdjacentText: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { text, position, focusSelector } = operation;
          element.insertAdjacentText(position || "beforeend", safeScalar(text));
          assignFocus(focusSelector);
        });
        after(element, operation);
      });
    },
    outerHtml: (operation) => {
      processElements(operation, (element) => {
        const parent = element.parentElement;
        const idx = parent && Array.from(parent.children).indexOf(element);
        before(element, operation);
        operate(operation, () => {
          const { html, focusSelector } = operation;
          element.outerHTML = safeScalar(html);
          assignFocus(focusSelector);
        });
        after(parent ? parent.children[idx] : document.documentElement, operation);
      });
    },
    prepend: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { html, focusSelector } = operation;
          element.insertAdjacentHTML("afterbegin", safeScalar(html));
          assignFocus(focusSelector);
        });
        after(element, operation);
      });
    },
    remove: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { focusSelector } = operation;
          element.remove();
          assignFocus(focusSelector);
        });
        after(document, operation);
      });
    },
    replace: (operation) => {
      processElements(operation, (element) => {
        const parent = element.parentElement;
        const idx = parent && Array.from(parent.children).indexOf(element);
        before(element, operation);
        operate(operation, () => {
          const { html, focusSelector } = operation;
          element.outerHTML = safeScalar(html);
          assignFocus(focusSelector);
        });
        after(parent ? parent.children[idx] : document.documentElement, operation);
      });
    },
    textContent: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { text, focusSelector } = operation;
          element.textContent = safeScalar(text);
          assignFocus(focusSelector);
        });
        after(element, operation);
      });
    },
    // Element Property Mutations
    addCssClass: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3 } = operation;
          element.classList.add(...getClassNames([safeStringOrArray(name3)]));
        });
        after(element, operation);
      });
    },
    removeAttribute: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3 } = operation;
          element.removeAttribute(safeString(name3));
        });
        after(element, operation);
      });
    },
    removeCssClass: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3 } = operation;
          element.classList.remove(...getClassNames([safeStringOrArray(name3)]));
          if (element.classList.length === 0)
            element.removeAttribute("class");
        });
        after(element, operation);
      });
    },
    setAttribute: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3, value } = operation;
          element.setAttribute(safeString(name3), safeScalar(value));
        });
        after(element, operation);
      });
    },
    setDatasetProperty: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3, value } = operation;
          element.dataset[safeString(name3)] = safeScalar(value);
        });
        after(element, operation);
      });
    },
    setProperty: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3, value } = operation;
          if (name3 in element)
            element[safeString(name3)] = safeScalar(value);
        });
        after(element, operation);
      });
    },
    setStyle: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3, value } = operation;
          element.style[safeString(name3)] = safeScalar(value);
        });
        after(element, operation);
      });
    },
    setStyles: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { styles } = operation;
          for (let [name3, value] of Object.entries(styles))
            element.style[safeString(name3)] = safeScalar(value);
        });
        after(element, operation);
      });
    },
    setValue: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { value } = operation;
          element.value = safeScalar(value);
        });
        after(element, operation);
      });
    },
    // DOM Events and Meta-Operations
    dispatchEvent: (operation) => {
      processElements(operation, (element) => {
        before(element, operation);
        operate(operation, () => {
          const { name: name3, detail } = operation;
          dispatch(element, safeString(name3), safeObject(detail));
        });
        after(element, operation);
      });
    },
    setMeta: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { name: name3, content } = operation;
        let meta = document.head.querySelector(`meta[name='${name3}']`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = safeString(name3);
          document.head.appendChild(meta);
        }
        meta.content = safeScalar(content);
      });
      after(document, operation);
    },
    setTitle: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { title } = operation;
        document.title = safeScalar(title);
      });
      after(document, operation);
    },
    // Browser Manipulations
    clearStorage: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { type } = operation;
        const storage = type === "session" ? sessionStorage : localStorage;
        storage.clear();
      });
      after(document, operation);
    },
    go: (operation) => {
      before(window, operation);
      operate(operation, () => {
        const { delta } = operation;
        history.go(delta);
      });
      after(window, operation);
    },
    pushState: (operation) => {
      before(window, operation);
      operate(operation, () => {
        const { state, title, url } = operation;
        history.pushState(safeObject(state), safeString(title), safeString(url));
      });
      after(window, operation);
    },
    redirectTo: (operation) => {
      before(window, operation);
      operate(operation, () => {
        let { url, action, turbo } = operation;
        action = action || "advance";
        url = safeString(url);
        if (turbo === void 0)
          turbo = true;
        if (turbo) {
          if (window.Turbo)
            window.Turbo.visit(url, {
              action
            });
          if (window.Turbolinks)
            window.Turbolinks.visit(url, {
              action
            });
          if (!window.Turbo && !window.Turbolinks)
            window.location.href = url;
        } else {
          window.location.href = url;
        }
      });
      after(window, operation);
    },
    reload: (operation) => {
      before(window, operation);
      operate(operation, () => {
        window.location.reload();
      });
      after(window, operation);
    },
    removeStorageItem: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { key, type } = operation;
        const storage = type === "session" ? sessionStorage : localStorage;
        storage.removeItem(safeString(key));
      });
      after(document, operation);
    },
    replaceState: (operation) => {
      before(window, operation);
      operate(operation, () => {
        const { state, title, url } = operation;
        history.replaceState(safeObject(state), safeString(title), safeString(url));
      });
      after(window, operation);
    },
    scrollIntoView: (operation) => {
      const { element } = operation;
      before(element, operation);
      operate(operation, () => {
        element.scrollIntoView(operation);
      });
      after(element, operation);
    },
    setCookie: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { cookie } = operation;
        document.cookie = safeScalar(cookie);
      });
      after(document, operation);
    },
    setFocus: (operation) => {
      const { element } = operation;
      before(element, operation);
      operate(operation, () => {
        assignFocus(element);
      });
      after(element, operation);
    },
    setStorageItem: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { key, value, type } = operation;
        const storage = type === "session" ? sessionStorage : localStorage;
        storage.setItem(safeString(key), safeScalar(value));
      });
      after(document, operation);
    },
    // Notifications
    consoleLog: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { message, level } = operation;
        level && ["warn", "info", "error"].includes(level) ? console[level](message) : console.log(message);
      });
      after(document, operation);
    },
    consoleTable: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { data, columns } = operation;
        console.table(data, safeArray(columns));
      });
      after(document, operation);
    },
    notification: (operation) => {
      before(document, operation);
      operate(operation, () => {
        const { title, options } = operation;
        Notification.requestPermission().then((result) => {
          operation.permission = result;
          if (result === "granted")
            new Notification(safeString(title), safeObject(options));
        });
      });
      after(document, operation);
    },
    // Morph operations
    morph: (operation) => {
      processElements(operation, (element) => {
        const { html } = operation;
        const template2 = document.createElement("template");
        template2.innerHTML = String(safeScalar(html)).trim();
        operation.content = template2.content;
        const parent = element.parentElement;
        const idx = parent && Array.from(parent.children).indexOf(element);
        before(element, operation);
        operate(operation, () => {
          const { childrenOnly, focusSelector } = operation;
          morphdom_esm_default(element, childrenOnly ? template2.content : template2.innerHTML, {
            childrenOnly: !!childrenOnly,
            onBeforeElUpdated: shouldMorph(operation),
            onElUpdated: didMorph(operation)
          });
          assignFocus(focusSelector);
        });
        after(parent ? parent.children[idx] : document.documentElement, operation);
      });
    }
  };
  var operations = Operations;
  var add2 = (newOperations) => {
    operations = {
      ...operations,
      ...newOperations
    };
  };
  var addOperations = (operations2) => {
    add2(operations2);
  };
  var addOperation = (name3, operation) => {
    const operations2 = {};
    operations2[name3] = operation;
    add2(operations2);
  };
  var OperationStore = {
    get all() {
      return operations;
    }
  };
  var missingElement = "warn";
  var MissingElement$1 = {
    get behavior() {
      return missingElement;
    },
    set(value) {
      if (["warn", "ignore", "event", "exception"].includes(value))
        missingElement = value;
      else
        console.warn("Invalid 'onMissingElement' option. Defaulting to 'warn'.");
    }
  };
  var perform = (operations2, options = {
    onMissingElement: MissingElement$1.behavior
  }) => {
    const batches = {};
    operations2.forEach((operation) => {
      if (!!operation.batch)
        batches[operation.batch] = batches[operation.batch] ? ++batches[operation.batch] : 1;
    });
    operations2.forEach((operation) => {
      const name3 = operation.operation;
      try {
        if (operation.selector) {
          if (operation.xpath) {
            operation.element = operation.selectAll ? xpathToElementArray(operation.selector) : xpathToElement(operation.selector);
          } else {
            operation.element = operation.selectAll ? document.querySelectorAll(operation.selector) : document.querySelector(operation.selector);
          }
        } else {
          operation.element = document;
        }
        if (operation.element || options.onMissingElement !== "ignore") {
          ActiveElement.set(document.activeElement);
          const cableReadyOperation = OperationStore.all[name3];
          if (cableReadyOperation) {
            cableReadyOperation(operation);
            if (!!operation.batch && --batches[operation.batch] === 0)
              dispatch(document, "cable-ready:batch-complete", {
                batch: operation.batch
              });
          } else {
            console.error(`CableReady couldn't find the "${name3}" operation. Make sure you use the camelized form when calling an operation method.`);
          }
        }
      } catch (e2) {
        if (operation.element) {
          console.error(`CableReady detected an error in ${name3 || "operation"}: ${e2.message}. If you need to support older browsers make sure you've included the corresponding polyfills. https://docs.stimulusreflex.com/setup#polyfills-for-ie11.`);
          console.error(e2);
        } else {
          const warning = `CableReady ${name3 || ""} operation failed due to missing DOM element for selector: '${operation.selector}'`;
          switch (options.onMissingElement) {
            case "ignore":
              break;
            case "event":
              dispatch(document, "cable-ready:missing-element", {
                warning,
                operation
              });
              break;
            case "exception":
              throw warning;
            default:
              console.warn(warning);
          }
        }
      }
    });
  };
  var performAsync = (operations2, options = {
    onMissingElement: MissingElement$1.behavior
  }) => new Promise((resolve, reject) => {
    try {
      resolve(perform(operations2, options));
    } catch (err) {
      reject(err);
    }
  });
  var SubscribingElement = class extends HTMLElement {
    static get tagName() {
      throw new Error("Implement the tagName() getter in the inheriting class");
    }
    static define() {
      if (!customElements.get(this.tagName)) {
        customElements.define(this.tagName, this);
      }
    }
    disconnectedCallback() {
      if (this.channel)
        this.channel.unsubscribe();
    }
    createSubscription(consumer3, channel, receivedCallback) {
      this.channel = consumer3.subscriptions.create({
        channel,
        identifier: this.identifier
      }, {
        received: receivedCallback
      });
    }
    get preview() {
      return document.documentElement.hasAttribute("data-turbolinks-preview") || document.documentElement.hasAttribute("data-turbo-preview");
    }
    get identifier() {
      return this.getAttribute("identifier");
    }
  };
  var consumer;
  var BACKOFF = [25, 50, 75, 100, 200, 250, 500, 800, 1e3, 2e3];
  var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  var getConsumerWithRetry = async (retry = 0) => {
    if (consumer)
      return consumer;
    if (retry >= BACKOFF.length) {
      throw new Error("Couldn't obtain a Action Cable consumer within 5s");
    }
    await wait(BACKOFF[retry]);
    return await getConsumerWithRetry(retry + 1);
  };
  var CableConsumer = {
    setConsumer(value) {
      consumer = value;
    },
    get consumer() {
      return consumer;
    },
    async getConsumer() {
      return await getConsumerWithRetry();
    }
  };
  var StreamFromElement = class extends SubscribingElement {
    static get tagName() {
      return "cable-ready-stream-from";
    }
    async connectedCallback() {
      if (this.preview)
        return;
      const consumer3 = await CableConsumer.getConsumer();
      if (consumer3) {
        this.createSubscription(consumer3, "CableReady::Stream", this.performOperations.bind(this));
      } else {
        console.error("The `cable_ready_stream_from` helper cannot connect. You must initialize CableReady with an Action Cable consumer.");
      }
    }
    performOperations(data) {
      if (data.cableReady)
        perform(data.operations, {
          onMissingElement: this.onMissingElement
        });
    }
    get onMissingElement() {
      const value = this.getAttribute("missing") || MissingElement$1.behavior;
      if (["warn", "ignore", "event"].includes(value))
        return value;
      else {
        console.warn("Invalid 'missing' attribute. Defaulting to 'warn'.");
        return "warn";
      }
    }
  };
  var debugging = false;
  var Debug2 = {
    get enabled() {
      return debugging;
    },
    get disabled() {
      return !debugging;
    },
    get value() {
      return debugging;
    },
    set(value) {
      debugging = !!value;
    },
    set debug(value) {
      debugging = !!value;
    }
  };
  var request = (data, blocks) => {
    if (Debug2.disabled)
      return;
    console.log(`\u2191 Updatable request affecting ${blocks.length} element(s): `, {
      elements: blocks.map((b2) => b2.element),
      identifiers: blocks.map((b2) => b2.element.getAttribute("identifier")),
      data
    });
  };
  var cancel = (timestamp, reason) => {
    if (Debug2.disabled)
      return;
    const duration2 = /* @__PURE__ */ new Date() - timestamp;
    console.log(`\u274C Updatable request canceled after ${duration2}ms: ${reason}`);
  };
  var response = (timestamp, element, urls) => {
    if (Debug2.disabled)
      return;
    const duration2 = /* @__PURE__ */ new Date() - timestamp;
    console.log(`\u2193 Updatable response: All URLs fetched in ${duration2}ms`, {
      element,
      urls
    });
  };
  var morphStart = (timestamp, element) => {
    if (Debug2.disabled)
      return;
    const duration2 = /* @__PURE__ */ new Date() - timestamp;
    console.log(`\u21BB Updatable morph: starting after ${duration2}ms`, {
      element
    });
  };
  var morphEnd = (timestamp, element) => {
    if (Debug2.disabled)
      return;
    const duration2 = /* @__PURE__ */ new Date() - timestamp;
    console.log(`\u21BA Updatable morph: completed after ${duration2}ms`, {
      element
    });
  };
  var Log = {
    request,
    cancel,
    response,
    morphStart,
    morphEnd
  };
  var template = `
<style>
  :host {
    display: block;
  }
</style>
<slot></slot>
`;
  var UpdatesForElement = class extends SubscribingElement {
    static get tagName() {
      return "cable-ready-updates-for";
    }
    constructor() {
      super();
      const shadowRoot = this.attachShadow({
        mode: "open"
      });
      shadowRoot.innerHTML = template;
    }
    async connectedCallback() {
      if (this.preview)
        return;
      this.update = debounce(this.update.bind(this), this.debounce);
      const consumer3 = await CableConsumer.getConsumer();
      if (consumer3) {
        this.createSubscription(consumer3, "CableReady::Stream", this.update);
      } else {
        console.error("The `cable_ready_updates_for` helper cannot connect. You must initialize CableReady with an Action Cable consumer.");
      }
    }
    async update(data) {
      this.lastUpdateTimestamp = /* @__PURE__ */ new Date();
      const blocks = Array.from(document.querySelectorAll(this.query), (element) => new Block(element)).filter((block) => block.shouldUpdate(data));
      Log.request(data, blocks);
      if (blocks.length === 0) {
        Log.cancel(this.lastUpdateTimestamp, "All elements filtered out");
        return;
      }
      if (blocks[0].element !== this) {
        Log.cancel(this.lastUpdateTimestamp, "Update already requested");
        return;
      }
      ActiveElement.set(document.activeElement);
      this.html = {};
      const uniqueUrls = [...new Set(blocks.map((block) => block.url))];
      await Promise.all(uniqueUrls.map(async (url) => {
        if (!this.html.hasOwnProperty(url)) {
          const response2 = await graciouslyFetch(url, {
            "X-Cable-Ready": "update"
          });
          this.html[url] = await response2.text();
        }
      }));
      Log.response(this.lastUpdateTimestamp, this, uniqueUrls);
      this.index = {};
      blocks.forEach((block) => {
        this.index.hasOwnProperty(block.url) ? this.index[block.url]++ : this.index[block.url] = 0;
        block.process(data, this.html, this.index, this.lastUpdateTimestamp);
      });
    }
    get query() {
      return `${this.tagName}[identifier="${this.identifier}"]`;
    }
    get identifier() {
      return this.getAttribute("identifier");
    }
    get debounce() {
      return this.hasAttribute("debounce") ? parseInt(this.getAttribute("debounce")) : 20;
    }
  };
  var Block = class {
    constructor(element) {
      this.element = element;
    }
    async process(data, html, index, startTimestamp) {
      const blockIndex = index[this.url];
      const template2 = document.createElement("template");
      this.element.setAttribute("updating", "updating");
      template2.innerHTML = String(html[this.url]).trim();
      await this.resolveTurboFrames(template2.content);
      const fragments = template2.content.querySelectorAll(this.query);
      if (fragments.length <= blockIndex) {
        console.warn(`Update aborted due to insufficient number of elements. The offending url is ${this.url}.`);
        return;
      }
      const operation = {
        element: this.element,
        html: fragments[blockIndex],
        permanentAttributeName: "data-ignore-updates"
      };
      dispatch(this.element, "cable-ready:before-update", operation);
      Log.morphStart(startTimestamp, this.element);
      morphdom_esm_default(this.element, fragments[blockIndex], {
        childrenOnly: true,
        onBeforeElUpdated: shouldMorph(operation),
        onElUpdated: (_2) => {
          this.element.removeAttribute("updating");
          dispatch(this.element, "cable-ready:after-update", operation);
          assignFocus(operation.focusSelector);
        }
      });
      Log.morphEnd(startTimestamp, this.element);
    }
    async resolveTurboFrames(documentFragment) {
      const reloadingTurboFrames = [...documentFragment.querySelectorAll('turbo-frame[src]:not([loading="lazy"])')];
      return Promise.all(reloadingTurboFrames.map((frame) => new Promise(async (resolve) => {
        const frameResponse = await graciouslyFetch(frame.getAttribute("src"), {
          "Turbo-Frame": frame.id,
          "X-Cable-Ready": "update"
        });
        const frameTemplate = document.createElement("template");
        frameTemplate.innerHTML = await frameResponse.text();
        await this.resolveTurboFrames(frameTemplate.content);
        const selector = `turbo-frame#${frame.id}`;
        const frameContent = frameTemplate.content.querySelector(selector);
        const content = frameContent ? frameContent.innerHTML.trim() : "";
        documentFragment.querySelector(selector).innerHTML = content;
        resolve();
      })));
    }
    shouldUpdate(data) {
      return !this.ignoresInnerUpdates && this.hasChangesSelectedForUpdate(data);
    }
    hasChangesSelectedForUpdate(data) {
      const only = this.element.getAttribute("only");
      return !(only && data.changed && !only.split(" ").some((attribute) => data.changed.includes(attribute)));
    }
    get ignoresInnerUpdates() {
      return this.element.hasAttribute("ignore-inner-updates") && this.element.hasAttribute("performing-inner-update");
    }
    get url() {
      return this.element.hasAttribute("url") ? this.element.getAttribute("url") : location.href;
    }
    get identifier() {
      return this.element.identifier;
    }
    get query() {
      return this.element.query;
    }
  };
  var registerInnerUpdates = () => {
    document.addEventListener("stimulus-reflex:before", (event) => {
      recursiveMarkUpdatesForElements(event.detail.element);
    });
    document.addEventListener("stimulus-reflex:after", (event) => {
      setTimeout(() => {
        recursiveUnmarkUpdatesForElements(event.detail.element);
      });
    });
    document.addEventListener("turbo:submit-start", (event) => {
      recursiveMarkUpdatesForElements(event.target);
    });
    document.addEventListener("turbo:submit-end", (event) => {
      setTimeout(() => {
        recursiveUnmarkUpdatesForElements(event.target);
      });
    });
    document.addEventListener("turbo-boost:command:start", (event) => {
      recursiveMarkUpdatesForElements(event.target);
    });
    document.addEventListener("turbo-boost:command:finish", (event) => {
      setTimeout(() => {
        recursiveUnmarkUpdatesForElements(event.target);
      });
    });
    document.addEventListener("turbo-boost:command:error", (event) => {
      setTimeout(() => {
        recursiveUnmarkUpdatesForElements(event.target);
      });
    });
  };
  var recursiveMarkUpdatesForElements = (leaf) => {
    const closestUpdatesFor = leaf && leaf.parentElement && leaf.parentElement.closest("cable-ready-updates-for");
    if (closestUpdatesFor) {
      closestUpdatesFor.setAttribute("performing-inner-update", "");
      recursiveMarkUpdatesForElements(closestUpdatesFor);
    }
  };
  var recursiveUnmarkUpdatesForElements = (leaf) => {
    const closestUpdatesFor = leaf && leaf.parentElement && leaf.parentElement.closest("cable-ready-updates-for");
    if (closestUpdatesFor) {
      closestUpdatesFor.removeAttribute("performing-inner-update");
      recursiveUnmarkUpdatesForElements(closestUpdatesFor);
    }
  };
  var defineElements = () => {
    registerInnerUpdates();
    StreamFromElement.define();
    UpdatesForElement.define();
  };
  var initialize = (initializeOptions = {}) => {
    const { consumer: consumer3, onMissingElement, debug } = initializeOptions;
    Debug2.set(!!debug);
    if (consumer3) {
      CableConsumer.setConsumer(consumer3);
    } else {
      console.error("CableReady requires a reference to your Action Cable `consumer` for its helpers to function.\nEnsure that you have imported the `CableReady` package as well as `consumer` from your `channels` folder, then call `CableReady.initialize({ consumer })`.");
    }
    if (onMissingElement) {
      MissingElement.set(onMissingElement);
    }
    defineElements();
  };
  var global2 = {
    perform,
    performAsync,
    shouldMorphCallbacks,
    didMorphCallbacks,
    initialize,
    addOperation,
    addOperations,
    version: packageInfo.version,
    cable: CableConsumer,
    get DOMOperations() {
      console.warn("DEPRECATED: Please use `CableReady.operations` instead of `CableReady.DOMOperations`");
      return OperationStore.all;
    },
    get operations() {
      return OperationStore.all;
    },
    get consumer() {
      return CableConsumer.consumer;
    }
  };
  window.CableReady = global2;

  // ../../node_modules/stimulus_reflex/dist/stimulus_reflex.js
  var Toastify = class {
    defaults = {
      oldestFirst: true,
      text: "Toastify is awesome!",
      node: void 0,
      duration: 3e3,
      selector: void 0,
      callback: function() {
      },
      destination: void 0,
      newWindow: false,
      close: false,
      gravity: "toastify-top",
      positionLeft: false,
      position: "",
      backgroundColor: "",
      avatar: "",
      className: "",
      stopOnFocus: true,
      onClick: function() {
      },
      offset: {
        x: 0,
        y: 0
      },
      escapeMarkup: true,
      ariaLive: "polite",
      style: {
        background: ""
      }
    };
    constructor(options) {
      this.version = "1.12.0";
      this.options = {};
      this.toastElement = null;
      this._rootElement = document.body;
      this._init(options);
    }
    showToast() {
      this.toastElement = this._buildToast();
      if (typeof this.options.selector === "string") {
        this._rootElement = document.getElementById(this.options.selector);
      } else if (this.options.selector instanceof HTMLElement || this.options.selector instanceof ShadowRoot) {
        this._rootElement = this.options.selector;
      } else {
        this._rootElement = document.body;
      }
      if (!this._rootElement) {
        throw "Root element is not defined";
      }
      this._rootElement.insertBefore(this.toastElement, this._rootElement.firstChild);
      this._reposition();
      if (this.options.duration > 0) {
        this.toastElement.timeOutValue = window.setTimeout(() => {
          this._removeElement(this.toastElement);
        }, this.options.duration);
      }
      return this;
    }
    hideToast() {
      if (this.toastElement.timeOutValue) {
        clearTimeout(this.toastElement.timeOutValue);
      }
      this._removeElement(this.toastElement);
    }
    _init(options) {
      this.options = Object.assign(this.defaults, options);
      if (this.options.backgroundColor) {
        console.warn('DEPRECATION NOTICE: "backgroundColor" is being deprecated. Please use the "style.background" property.');
      }
      this.toastElement = null;
      this.options.gravity = options.gravity === "bottom" ? "toastify-bottom" : "toastify-top";
      this.options.stopOnFocus = options.stopOnFocus === void 0 ? true : options.stopOnFocus;
      if (options.backgroundColor) {
        this.options.style.background = options.backgroundColor;
      }
    }
    _buildToast() {
      if (!this.options) {
        throw "Toastify is not initialized";
      }
      let divElement = document.createElement("div");
      divElement.className = `toastify on ${this.options.className}`;
      divElement.className += ` toastify-${this.options.position}`;
      divElement.className += ` ${this.options.gravity}`;
      for (const property in this.options.style) {
        divElement.style[property] = this.options.style[property];
      }
      if (this.options.ariaLive) {
        divElement.setAttribute("aria-live", this.options.ariaLive);
      }
      if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
        divElement.appendChild(this.options.node);
      } else {
        if (this.options.escapeMarkup) {
          divElement.innerText = this.options.text;
        } else {
          divElement.innerHTML = this.options.text;
        }
        if (this.options.avatar !== "") {
          let avatarElement = document.createElement("img");
          avatarElement.src = this.options.avatar;
          avatarElement.className = "toastify-avatar";
          if (this.options.position == "left") {
            divElement.appendChild(avatarElement);
          } else {
            divElement.insertAdjacentElement("afterbegin", avatarElement);
          }
        }
      }
      if (this.options.close === true) {
        let closeElement = document.createElement("button");
        closeElement.type = "button";
        closeElement.setAttribute("aria-label", "Close");
        closeElement.className = "toast-close";
        closeElement.innerHTML = "&#10006;";
        closeElement.addEventListener("click", (event) => {
          event.stopPropagation();
          this._removeElement(this.toastElement);
          window.clearTimeout(this.toastElement.timeOutValue);
        });
        const width = window.innerWidth > 0 ? window.innerWidth : screen.width;
        if (this.options.position == "left" && width > 360) {
          divElement.insertAdjacentElement("afterbegin", closeElement);
        } else {
          divElement.appendChild(closeElement);
        }
      }
      if (this.options.stopOnFocus && this.options.duration > 0) {
        divElement.addEventListener("mouseover", (event) => {
          window.clearTimeout(divElement.timeOutValue);
        });
        divElement.addEventListener("mouseleave", () => {
          divElement.timeOutValue = window.setTimeout(() => {
            this._removeElement(divElement);
          }, this.options.duration);
        });
      }
      if (typeof this.options.destination !== "undefined") {
        divElement.addEventListener("click", (event) => {
          event.stopPropagation();
          if (this.options.newWindow === true) {
            window.open(this.options.destination, "_blank");
          } else {
            window.location = this.options.destination;
          }
        });
      }
      if (typeof this.options.onClick === "function" && typeof this.options.destination === "undefined") {
        divElement.addEventListener("click", (event) => {
          event.stopPropagation();
          this.options.onClick();
        });
      }
      if (typeof this.options.offset === "object") {
        const x2 = this._getAxisOffsetAValue("x", this.options);
        const y2 = this._getAxisOffsetAValue("y", this.options);
        const xOffset = this.options.position == "left" ? x2 : `-${x2}`;
        const yOffset = this.options.gravity == "toastify-top" ? y2 : `-${y2}`;
        divElement.style.transform = `translate(${xOffset},${yOffset})`;
      }
      return divElement;
    }
    _removeElement(toastElement) {
      toastElement.className = toastElement.className.replace(" on", "");
      window.setTimeout(() => {
        if (this.options.node && this.options.node.parentNode) {
          this.options.node.parentNode.removeChild(this.options.node);
        }
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
        this.options.callback.call(toastElement);
        this._reposition();
      }, 400);
    }
    _reposition() {
      let topLeftOffsetSize = {
        top: 15,
        bottom: 15
      };
      let topRightOffsetSize = {
        top: 15,
        bottom: 15
      };
      let offsetSize = {
        top: 15,
        bottom: 15
      };
      let allToasts = this._rootElement.querySelectorAll(".toastify");
      let classUsed;
      for (let i2 = 0; i2 < allToasts.length; i2++) {
        if (allToasts[i2].classList.contains("toastify-top") === true) {
          classUsed = "toastify-top";
        } else {
          classUsed = "toastify-bottom";
        }
        let height = allToasts[i2].offsetHeight;
        classUsed = classUsed.substr(9, classUsed.length - 1);
        let offset = 15;
        let width = window.innerWidth > 0 ? window.innerWidth : screen.width;
        if (width <= 360) {
          allToasts[i2].style[classUsed] = `${offsetSize[classUsed]}px`;
          offsetSize[classUsed] += height + offset;
        } else {
          if (allToasts[i2].classList.contains("toastify-left") === true) {
            allToasts[i2].style[classUsed] = `${topLeftOffsetSize[classUsed]}px`;
            topLeftOffsetSize[classUsed] += height + offset;
          } else {
            allToasts[i2].style[classUsed] = `${topRightOffsetSize[classUsed]}px`;
            topRightOffsetSize[classUsed] += height + offset;
          }
        }
      }
    }
    _getAxisOffsetAValue(axis, options) {
      if (options.offset[axis]) {
        if (isNaN(options.offset[axis])) {
          return options.offset[axis];
        } else {
          return `${options.offset[axis]}px`;
        }
      }
      return "0px";
    }
  };
  function StartToastifyInstance(options) {
    return new Toastify(options);
  }
  global2.operations.stimulusReflexVersionMismatch = (operation) => {
    const levels = {
      info: {},
      success: {
        background: "#198754",
        color: "white"
      },
      warn: {
        background: "#ffc107",
        color: "black"
      },
      error: {
        background: "#dc3545",
        color: "white"
      }
    };
    const defaults = {
      selector: setupToastify(),
      close: true,
      duration: 30 * 1e3,
      gravity: "bottom",
      position: "right",
      newWindow: true,
      style: levels[operation.level || "info"]
    };
    StartToastifyInstance({
      ...defaults,
      ...operation
    }).showToast();
  };
  function setupToastify() {
    const id = "stimulus-reflex-toast-element";
    let element = document.querySelector(`#${id}`);
    if (!element) {
      element = document.createElement("div");
      element.id = id;
      document.documentElement.appendChild(element);
      const styles = document.createElement("style");
      styles.innerHTML = `
      #${id} .toastify {
         padding: 12px 20px;
         color: #ffffff;
         display: inline-block;
         background: -webkit-linear-gradient(315deg, #73a5ff, #5477f5);
         background: linear-gradient(135deg, #73a5ff, #5477f5);
         position: fixed;
         opacity: 0;
         transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
         border-radius: 2px;
         cursor: pointer;
         text-decoration: none;
         max-width: calc(50% - 20px);
         z-index: 2147483647;
         bottom: -150px;
         right: 15px;
      }

      #${id} .toastify.on {
        opacity: 1;
      }

      #${id} .toast-close {
        background: transparent;
        border: 0;
        color: white;
        cursor: pointer;
        font-family: inherit;
        font-size: 1em;
        opacity: 0.4;
        padding: 0 5px;
      }
    `;
      document.head.appendChild(styles);
    }
    return element;
  }
  var deprecationWarnings = true;
  var Deprecate = {
    get enabled() {
      return deprecationWarnings;
    },
    get disabled() {
      return !deprecationWarnings;
    },
    get value() {
      return deprecationWarnings;
    },
    set(value) {
      deprecationWarnings = !!value;
    },
    set deprecate(value) {
      deprecationWarnings = !!value;
    }
  };
  var debugging2 = false;
  var Debug$1 = {
    get enabled() {
      return debugging2;
    },
    get disabled() {
      return !debugging2;
    },
    get value() {
      return debugging2;
    },
    set(value) {
      debugging2 = !!value;
    },
    set debug(value) {
      debugging2 = !!value;
    }
  };
  var defaultSchema2 = {
    reflexAttribute: "data-reflex",
    reflexPermanentAttribute: "data-reflex-permanent",
    reflexRootAttribute: "data-reflex-root",
    reflexSuppressLoggingAttribute: "data-reflex-suppress-logging",
    reflexDatasetAttribute: "data-reflex-dataset",
    reflexDatasetAllAttribute: "data-reflex-dataset-all",
    reflexSerializeFormAttribute: "data-reflex-serialize-form",
    reflexFormSelectorAttribute: "data-reflex-form-selector",
    reflexIncludeInnerHtmlAttribute: "data-reflex-include-inner-html",
    reflexIncludeTextContentAttribute: "data-reflex-include-text-content"
  };
  var schema = {};
  var Schema = {
    set(application2) {
      schema = {
        ...defaultSchema2,
        ...application2.schema
      };
      for (const attribute in schema) {
        const attributeName = attribute.slice(0, -9);
        Object.defineProperty(this, attributeName, {
          get: () => schema[attribute],
          configurable: true
        });
      }
    }
  };
  var { debounce: debounce2, dispatch: dispatch2, xpathToElement: xpathToElement2, xpathToElementArray: xpathToElementArray2 } = utils;
  var uuidv4 = () => {
    const crypto = window.crypto || window.msCrypto;
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c2) => (c2 ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c2 / 4).toString(16));
  };
  var serializeForm = (form, options = {}) => {
    if (!form)
      return "";
    const w2 = options.w || window;
    const { element } = options;
    const formData = new w2.FormData(form);
    const data = Array.from(formData, (e2) => e2.map(encodeURIComponent).join("="));
    const submitButton = form.querySelector("input[type=submit]");
    if (element && element.name && element.nodeName === "INPUT" && element.type === "submit") {
      data.push(`${encodeURIComponent(element.name)}=${encodeURIComponent(element.value)}`);
    } else if (submitButton && submitButton.name) {
      data.push(`${encodeURIComponent(submitButton.name)}=${encodeURIComponent(submitButton.value)}`);
    }
    return Array.from(data).join("&");
  };
  var camelize2 = (value, uppercaseFirstLetter = true) => {
    if (typeof value !== "string")
      return "";
    value = value.replace(/[\s_](.)/g, ($1) => $1.toUpperCase()).replace(/[\s_]/g, "").replace(/^(.)/, ($1) => $1.toLowerCase());
    if (uppercaseFirstLetter)
      value = value.substr(0, 1).toUpperCase() + value.substr(1);
    return value;
  };
  var XPathToElement = xpathToElement2;
  var XPathToArray = xpathToElementArray2;
  var emitEvent = (name3, detail = {}) => dispatch2(document, name3, detail);
  var extractReflexName = (reflexString) => {
    const match = reflexString.match(/(?:.*->)?(.*?)(?:Reflex)?#/);
    return match ? match[1] : "";
  };
  var elementToXPath = (element) => {
    if (element.id !== "")
      return "//*[@id='" + element.id + "']";
    if (element === document.body)
      return "/html/body";
    if (element.nodeName === "HTML")
      return "/html";
    let ix = 0;
    const siblings = element && element.parentNode ? element.parentNode.childNodes : [];
    for (var i2 = 0; i2 < siblings.length; i2++) {
      const sibling = siblings[i2];
      if (sibling === element) {
        const computedPath = elementToXPath(element.parentNode);
        const tagName = element.tagName.toLowerCase();
        const ixInc = ix + 1;
        return `${computedPath}/${tagName}[${ixInc}]`;
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
  };
  var elementInvalid = (element) => element.type === "number" && element.validity && element.validity.badInput;
  var getReflexElement = (args, element) => args[0] && args[0].nodeType === Node.ELEMENT_NODE ? args.shift() : element;
  var getReflexOptions = (args) => {
    const options = {};
    if (args[0] && typeof args[0] === "object" && Object.keys(args[0]).filter((key) => ["id", "attrs", "selectors", "reflexId", "resolveLate", "serializeForm", "suppressLogging", "includeInnerHTML", "includeTextContent"].includes(key)).length) {
      const opts = args.shift();
      Object.keys(opts).forEach((o2) => {
        if (o2 === "reflexId") {
          if (Deprecate.enabled)
            console.warn("reflexId option will be removed in v4. Use id instead.");
          options["id"] = opts["reflexId"];
        } else
          options[o2] = opts[o2];
      });
    }
    return options;
  };
  var getReflexRoots = (element) => {
    let list = [];
    while (list.length === 0 && element) {
      let reflexRoot = element.getAttribute(Schema.reflexRoot);
      if (reflexRoot) {
        if (reflexRoot.length === 0 && element.id)
          reflexRoot = `#${element.id}`;
        const selectors = reflexRoot.split(",").filter((s2) => s2.trim().length);
        if (Debug$1.enabled && selectors.length === 0) {
          console.error(`No value found for ${Schema.reflexRoot}. Add an #id to the element or provide a value for ${Schema.reflexRoot}.`, element);
        }
        list = list.concat(selectors.filter((s2) => document.querySelector(s2)));
      }
      element = element.parentElement ? element.parentElement.closest(`[${Schema.reflexRoot}]`) : null;
    }
    return list;
  };
  var reflexNameToControllerIdentifier = (reflexName) => reflexName.replace(/([a-z0–9])([A-Z])/g, "$1-$2").replace(/(::)/g, "--").replace(/-reflex$/gi, "").toLowerCase();
  var stages = ["created", "before", "delivered", "queued", "after", "finalized", "success", "error", "halted", "forbidden"];
  var lastReflex;
  var reflexes = new Proxy({}, {
    get: function(target, prop) {
      if (stages.includes(prop))
        return Object.fromEntries(Object.entries(target).filter(([_2, reflex]) => reflex.stage === prop));
      else if (prop === "last")
        return lastReflex;
      else if (prop === "all")
        return target;
      return Reflect.get(...arguments);
    },
    set: function(target, prop, value) {
      target[prop] = value;
      lastReflex = value;
      return true;
    }
  });
  var invokeLifecycleMethod = (reflex, stage) => {
    const specificLifecycleMethod = reflex.controller[["before", "after", "finalize"].includes(stage) ? `${stage}${camelize2(reflex.action)}` : `${camelize2(reflex.action, false)}${camelize2(stage)}`];
    const genericLifecycleMethod = reflex.controller[["before", "after", "finalize"].includes(stage) ? `${stage}Reflex` : `reflex${camelize2(stage)}`];
    if (typeof specificLifecycleMethod === "function") {
      specificLifecycleMethod.call(reflex.controller, reflex.element, reflex.target, reflex.error, reflex.id, reflex.payload);
    }
    if (typeof genericLifecycleMethod === "function") {
      genericLifecycleMethod.call(reflex.controller, reflex.element, reflex.target, reflex.error, reflex.id, reflex.payload);
    }
  };
  var dispatchLifecycleEvent = (reflex, stage) => {
    if (!reflex.controller.element.parentElement) {
      if (Debug$1.enabled && !reflex.warned) {
        console.warn(`StimulusReflex was not able execute callbacks or emit events for "${stage}" or later life-cycle stages for this Reflex. The StimulusReflex Controller Element is no longer present in the DOM. Could you move the StimulusReflex Controller to an element higher in your DOM?`);
        reflex.warned = true;
      }
      return;
    }
    reflex.stage = stage;
    reflex.lifecycle.push(stage);
    const event = `stimulus-reflex:${stage}`;
    const action = `${event}:${reflex.action}`;
    const detail = {
      reflex: reflex.target,
      controller: reflex.controller,
      id: reflex.id,
      element: reflex.element,
      payload: reflex.payload
    };
    const options = {
      bubbles: true,
      cancelable: false,
      detail
    };
    reflex.controller.element.dispatchEvent(new CustomEvent(event, options));
    reflex.controller.element.dispatchEvent(new CustomEvent(action, options));
    if (window.jQuery) {
      window.jQuery(reflex.controller.element).trigger(event, detail);
      window.jQuery(reflex.controller.element).trigger(action, detail);
    }
  };
  document.addEventListener("stimulus-reflex:before", (event) => invokeLifecycleMethod(reflexes[event.detail.id], "before"), true);
  document.addEventListener("stimulus-reflex:queued", (event) => invokeLifecycleMethod(reflexes[event.detail.id], "queued"), true);
  document.addEventListener("stimulus-reflex:delivered", (event) => invokeLifecycleMethod(reflexes[event.detail.id], "delivered"), true);
  document.addEventListener("stimulus-reflex:success", (event) => {
    const reflex = reflexes[event.detail.id];
    invokeLifecycleMethod(reflex, "success");
    dispatchLifecycleEvent(reflex, "after");
  }, true);
  document.addEventListener("stimulus-reflex:nothing", (event) => dispatchLifecycleEvent(reflexes[event.detail.id], "success"), true);
  document.addEventListener("stimulus-reflex:error", (event) => {
    const reflex = reflexes[event.detail.id];
    invokeLifecycleMethod(reflex, "error");
    dispatchLifecycleEvent(reflex, "after");
  }, true);
  document.addEventListener("stimulus-reflex:halted", (event) => invokeLifecycleMethod(reflexes[event.detail.id], "halted"), true);
  document.addEventListener("stimulus-reflex:forbidden", (event) => invokeLifecycleMethod(reflexes[event.detail.id], "forbidden"), true);
  document.addEventListener("stimulus-reflex:after", (event) => invokeLifecycleMethod(reflexes[event.detail.id], "after"), true);
  document.addEventListener("stimulus-reflex:finalize", (event) => invokeLifecycleMethod(reflexes[event.detail.id], "finalize"), true);
  var app = {};
  var App = {
    get app() {
      return app;
    },
    set(application2) {
      app = application2;
    }
  };
  var isolationMode = false;
  var IsolationMode = {
    get disabled() {
      return !isolationMode;
    },
    set(value) {
      isolationMode = value;
      if (Deprecate.enabled && !isolationMode) {
        document.addEventListener("DOMContentLoaded", () => console.warn("Deprecation warning: the next version of StimulusReflex will standardize isolation mode, and the isolate option will be removed.\nPlease update your applications to assume that every tab will be isolated. Use CableReady operations to broadcast updates to other tabs and users."), {
          once: true
        });
      }
    }
  };
  var Reflex = class {
    constructor(data, controller) {
      this.data = data.valueOf();
      this.controller = controller;
      this.element = data.reflexElement;
      this.id = data.id;
      this.error = null;
      this.payload = null;
      this.stage = "created";
      this.lifecycle = ["created"];
      this.warned = false;
      this.target = data.target;
      this.action = data.target.split("#")[1];
      this.selector = null;
      this.morph = null;
      this.operation = null;
      this.timestamp = /* @__PURE__ */ new Date();
      this.cloned = false;
    }
    get getPromise() {
      const promise = new Promise((resolve, reject) => {
        this.promise = {
          resolve,
          reject,
          data: this.data
        };
      });
      promise.id = this.id;
      Object.defineProperty(promise, "reflexId", {
        get() {
          if (Deprecate.enabled)
            console.warn("reflexId is deprecated and will be removed from v4. Use id instead.");
          return this.id;
        }
      });
      promise.reflex = this;
      if (Debug$1.enabled)
        promise.catch(() => {
        });
      return promise;
    }
  };
  var received = (data) => {
    if (!data.cableReady)
      return;
    if (data.version.replace(".pre", "-pre").replace(".rc", "-rc") !== global2.version) {
      const mismatch = `CableReady failed to execute your reflex action due to a version mismatch between your gem and JavaScript version. Package versions must match exactly.

cable_ready gem: ${data.version}
cable_ready npm: ${global2.version}`;
      console.error(mismatch);
      if (Debug$1.enabled) {
        global2.operations.stimulusReflexVersionMismatch({
          text: mismatch,
          level: "error"
        });
      }
      return;
    }
    let reflexOperations = [];
    for (let i2 = data.operations.length - 1; i2 >= 0; i2--) {
      if (data.operations[i2].stimulusReflex) {
        reflexOperations.push(data.operations[i2]);
        data.operations.splice(i2, 1);
      }
    }
    if (reflexOperations.some((operation) => operation.stimulusReflex.url !== location.href)) {
      if (Debug$1.enabled) {
        console.error("Reflex failed due to mismatched URL.");
        return;
      }
    }
    let reflexData;
    if (reflexOperations.length) {
      reflexData = reflexOperations[0].stimulusReflex;
      reflexData.payload = reflexOperations[0].payload;
    }
    if (reflexData) {
      const { id, payload } = reflexData;
      let reflex;
      if (!reflexes[id] && IsolationMode.disabled) {
        const controllerElement = XPathToElement(reflexData.xpathController);
        const reflexElement = XPathToElement(reflexData.xpathElement);
        controllerElement.reflexController = controllerElement.reflexController || {};
        controllerElement.reflexData = controllerElement.reflexData || {};
        controllerElement.reflexError = controllerElement.reflexError || {};
        const controller = App.app.getControllerForElementAndIdentifier(controllerElement, reflexData.reflexController);
        controllerElement.reflexController[id] = controller;
        controllerElement.reflexData[id] = reflexData;
        reflex = new Reflex(reflexData, controller);
        reflexes[id] = reflex;
        reflex.cloned = true;
        reflex.element = reflexElement;
        controller.lastReflex = reflex;
        dispatchLifecycleEvent(reflex, "before");
        reflex.getPromise;
      } else {
        reflex = reflexes[id];
      }
      if (reflex) {
        reflex.payload = payload;
        reflex.totalOperations = reflexOperations.length;
        reflex.pendingOperations = reflexOperations.length;
        reflex.completedOperations = 0;
        reflex.piggybackOperations = data.operations;
        global2.perform(reflexOperations);
      }
    } else {
      if (data.operations.length && reflexes[data.operations[0].reflexId]) {
        global2.perform(data.operations);
      }
    }
  };
  var consumer2;
  var params;
  var subscription;
  var active;
  var initialize$1 = (consumerValue, paramsValue) => {
    consumer2 = consumerValue;
    params = paramsValue;
    document.addEventListener("DOMContentLoaded", () => {
      active = false;
      connectionStatusClass();
      if (Deprecate.enabled && consumerValue)
        console.warn("Deprecation warning: the next version of StimulusReflex will obtain a reference to consumer via the Stimulus application object.\nPlease add 'application.consumer = consumer' to your index.js after your Stimulus application has been established, and remove the consumer key from your StimulusReflex initialize() options object.");
    });
    document.addEventListener("turbolinks:load", connectionStatusClass);
    document.addEventListener("turbo:load", connectionStatusClass);
  };
  var subscribe = (controller) => {
    if (subscription)
      return;
    consumer2 = consumer2 || controller.application.consumer || createConsumer();
    const { channel } = controller.StimulusReflex;
    const request3 = {
      channel,
      ...params
    };
    const identifier = JSON.stringify(request3);
    subscription = consumer2.subscriptions.findAll(identifier)[0] || consumer2.subscriptions.create(request3, {
      received,
      connected,
      rejected,
      disconnected
    });
  };
  var connected = () => {
    active = true;
    connectionStatusClass();
    emitEvent("stimulus-reflex:connected");
    Object.values(reflexes.queued).forEach((reflex) => {
      subscription.send(reflex.data);
      dispatchLifecycleEvent(reflex, "delivered");
    });
  };
  var rejected = () => {
    active = false;
    connectionStatusClass();
    emitEvent("stimulus-reflex:rejected");
    if (Debug.enabled)
      console.warn("Channel subscription was rejected.");
  };
  var disconnected = (willAttemptReconnect) => {
    active = false;
    connectionStatusClass();
    emitEvent("stimulus-reflex:disconnected", willAttemptReconnect);
  };
  var deliver = (reflex) => {
    if (active) {
      subscription.send(reflex.data);
      dispatchLifecycleEvent(reflex, "delivered");
    } else
      dispatchLifecycleEvent(reflex, "queued");
  };
  var connectionStatusClass = () => {
    const list = document.body.classList;
    if (!(list.contains("stimulus-reflex-connected") || list.contains("stimulus-reflex-disconnected"))) {
      list.add(active ? "stimulus-reflex-connected" : "stimulus-reflex-disconnected");
      return;
    }
    if (active) {
      list.replace("stimulus-reflex-disconnected", "stimulus-reflex-connected");
    } else {
      list.replace("stimulus-reflex-connected", "stimulus-reflex-disconnected");
    }
  };
  var ActionCableTransport = {
    subscribe,
    deliver,
    initialize: initialize$1
  };
  var request2 = (reflex) => {
    if (Debug$1.disabled || reflex.data.suppressLogging)
      return;
    console.log(`\u2191 stimulus \u2191 ${reflex.target}`, {
      id: reflex.id,
      args: reflex.data.args,
      controller: reflex.controller.identifier,
      element: reflex.element,
      controllerElement: reflex.controller.element
    });
  };
  var success = (reflex) => {
    if (Debug$1.disabled || reflex.data.suppressLogging)
      return;
    const output = {
      id: reflex.id,
      morph: reflex.morph,
      payload: reflex.payload
    };
    if (reflex.operation !== "dispatch_event")
      output.operation = reflex.operation;
    console.log(`\u2193 reflex \u2193 ${reflex.target} \u2192 ${reflex.selector || "\u221E"}${progress(reflex)} ${duration(reflex)}`, output);
  };
  var halted$1 = (reflex) => {
    if (Debug$1.disabled || reflex.data.suppressLogging)
      return;
    console.log(`\u2193 reflex \u2193 ${reflex.target} ${duration(reflex)} %cHALTED`, "color: #ffa500;", {
      id: reflex.id,
      payload: reflex.payload
    });
  };
  var forbidden$1 = (reflex) => {
    if (Debug$1.disabled || reflex.data.suppressLogging)
      return;
    console.log(`\u2193 reflex \u2193 ${reflex.target} ${duration(reflex)} %cFORBIDDEN`, "color: #BF40BF;", {
      id: reflex.id,
      payload: reflex.payload
    });
  };
  var error$1 = (reflex) => {
    if (Debug$1.disabled || reflex.data.suppressLogging)
      return;
    console.log(`\u2193 reflex \u2193 ${reflex.target} ${duration(reflex)} %cERROR: ${reflex.error}`, "color: #f00;", {
      id: reflex.id,
      payload: reflex.payload
    });
  };
  var duration = (reflex) => !reflex.cloned ? `in ${/* @__PURE__ */ new Date() - reflex.timestamp}ms` : "CLONED";
  var progress = (reflex) => reflex.totalOperations > 1 ? ` ${reflex.completedOperations}/${reflex.totalOperations}` : "";
  var Log2 = {
    request: request2,
    success,
    halted: halted$1,
    forbidden: forbidden$1,
    error: error$1
  };
  var multipleInstances = (element) => {
    if (["checkbox", "radio"].includes(element.type)) {
      return document.querySelectorAll(`input[type="${element.type}"][name="${element.name}"]`).length > 1;
    }
    return false;
  };
  var collectCheckedOptions = (element) => Array.from(element.querySelectorAll("option:checked")).concat(Array.from(document.querySelectorAll(`input[type="${element.type}"][name="${element.name}"]`)).filter((elem) => elem.checked)).map((o2) => o2.value);
  var attributeValue = (values = []) => {
    const value = Array.from(new Set(values.filter((v2) => v2 && String(v2).length).map((v2) => v2.trim()))).join(" ").trim();
    return value.length > 0 ? value : null;
  };
  var attributeValues = (value) => {
    if (!value)
      return [];
    if (!value.length)
      return [];
    return value.split(" ").filter((v2) => v2.trim().length);
  };
  var extractElementAttributes = (element) => {
    let attrs = Array.from(element.attributes).reduce((memo, attr) => {
      memo[attr.name] = attr.value;
      return memo;
    }, {});
    attrs.checked = !!element.checked;
    attrs.selected = !!element.selected;
    attrs.tag_name = element.tagName;
    if (element.tagName.match(/select/i) || multipleInstances(element)) {
      const collectedOptions = collectCheckedOptions(element);
      attrs.values = collectedOptions;
      attrs.value = collectedOptions.join(",");
    } else {
      attrs.value = element.value;
    }
    return attrs;
  };
  var getElementsFromTokens = (element, tokens) => {
    if (!tokens || tokens.length === 0)
      return [];
    let elements = [element];
    const xPath = elementToXPath(element);
    tokens.forEach((token) => {
      try {
        switch (token) {
          case "combined":
            if (Deprecate.enabled)
              console.warn("In the next version of StimulusReflex, the 'combined' option to data-reflex-dataset will become 'ancestors'.");
            elements = [...elements, ...XPathToArray(`${xPath}/ancestor::*`, true)];
            break;
          case "ancestors":
            elements = [...elements, ...XPathToArray(`${xPath}/ancestor::*`, true)];
            break;
          case "parent":
            elements = [...elements, ...XPathToArray(`${xPath}/parent::*`)];
            break;
          case "siblings":
            elements = [...elements, ...XPathToArray(`${xPath}/preceding-sibling::*|${xPath}/following-sibling::*`)];
            break;
          case "children":
            elements = [...elements, ...XPathToArray(`${xPath}/child::*`)];
            break;
          case "descendants":
            elements = [...elements, ...XPathToArray(`${xPath}/descendant::*`)];
            break;
          default:
            elements = [...elements, ...document.querySelectorAll(token)];
        }
      } catch (error3) {
        if (Debug$1.enabled)
          console.error(error3);
      }
    });
    return elements;
  };
  var extractElementDataset = (element) => {
    const dataset = element.attributes[Schema.reflexDataset];
    const allDataset = element.attributes[Schema.reflexDatasetAll];
    const tokens = dataset && dataset.value.split(" ") || [];
    const allTokens = allDataset && allDataset.value.split(" ") || [];
    const datasetElements = getElementsFromTokens(element, tokens);
    const datasetAllElements = getElementsFromTokens(element, allTokens);
    const datasetAttributes = datasetElements.reduce((acc, ele) => ({
      ...extractDataAttributes(ele),
      ...acc
    }), {});
    const reflexElementAttributes = extractDataAttributes(element);
    const elementDataset = {
      dataset: {
        ...reflexElementAttributes,
        ...datasetAttributes
      },
      datasetAll: {}
    };
    datasetAllElements.forEach((element2) => {
      const elementAttributes = extractDataAttributes(element2);
      Object.keys(elementAttributes).forEach((key) => {
        const value = elementAttributes[key];
        if (elementDataset.datasetAll[key] && Array.isArray(elementDataset.datasetAll[key])) {
          elementDataset.datasetAll[key].push(value);
        } else {
          elementDataset.datasetAll[key] = [value];
        }
      });
    });
    return elementDataset;
  };
  var extractDataAttributes = (element) => {
    let attrs = {};
    if (element && element.attributes) {
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name.startsWith("data-")) {
          attrs[attr.name] = attr.value;
        }
      });
    }
    return attrs;
  };
  var name2 = "stimulus_reflex";
  var version2 = "3.5.0-rc2";
  var description2 = "Build reactive applications with the Rails tooling you already know and love.";
  var keywords2 = ["ruby", "rails", "websockets", "actioncable", "turbolinks", "reactive", "cable", "ujs", "ssr", "stimulus", "reflex", "stimulus_reflex", "dom", "morphdom"];
  var homepage2 = "https://docs.stimulusreflex.com";
  var bugs2 = "https://github.com/stimulusreflex/stimulus_reflex/issues";
  var repository2 = "https://github.com/stimulusreflex/stimulus_reflex";
  var license2 = "MIT";
  var author2 = "Nathan Hopkins <natehop@gmail.com>";
  var contributors2 = ["Andrew Mason <andrewmcodes@protonmail.com>", "Julian Rubisch <julian@julianrubisch.at>", "Marco Roth <marco.roth@intergga.ch>", "Nathan Hopkins <natehop@gmail.com>"];
  var main2 = "./dist/stimulus_reflex.js";
  var module2 = "./dist/stimulus_reflex.js";
  var browser2 = "./dist/stimulus_reflex.js";
  var unpkg2 = "./dist/stimulus_reflex.umd.js";
  var umd2 = "./dist/stimulus_reflex.umd.js";
  var files2 = ["dist/*", "javascript/*"];
  var scripts2 = {
    lint: "yarn run format --check",
    format: "yarn run prettier-standard ./javascript/**/*.js rollup.config.mjs",
    build: "yarn rollup -c",
    "build:watch": "yarn rollup -wc",
    watch: "yarn build:watch",
    test: "web-test-runner javascript/test/**/*.test.js",
    "test:watch": "yarn test --watch",
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs && cp docs/_redirects docs/.vitepress/dist",
    "docs:preview": "vitepress preview docs"
  };
  var peerDependencies = {
    "@hotwired/stimulus": ">= 3.0"
  };
  var dependencies2 = {
    "@hotwired/stimulus": "^3",
    "@rails/actioncable": "^6 || ^7",
    cable_ready: "5.0.0-rc2"
  };
  var devDependencies2 = {
    "@open-wc/testing": "^3.1.7",
    "@rollup/plugin-json": "^6.0.0",
    "@rollup/plugin-node-resolve": "^15.0.1",
    "@rollup/plugin-terser": "^0.4.0",
    "@web/dev-server-esbuild": "^0.3.3",
    "@web/dev-server-rollup": "^0.3.21",
    "@web/test-runner": "^0.15.1",
    "prettier-standard": "^16.4.1",
    rollup: "^3.19.1",
    "toastify-js": "^1.12.0",
    vitepress: "^1.0.0-alpha.56"
  };
  var packageInfo2 = {
    name: name2,
    version: version2,
    description: description2,
    keywords: keywords2,
    homepage: homepage2,
    bugs: bugs2,
    repository: repository2,
    license: license2,
    author: author2,
    contributors: contributors2,
    main: main2,
    module: module2,
    browser: browser2,
    import: "./dist/stimulus_reflex.js",
    unpkg: unpkg2,
    umd: umd2,
    files: files2,
    scripts: scripts2,
    peerDependencies,
    dependencies: dependencies2,
    devDependencies: devDependencies2
  };
  var ReflexData = class {
    constructor(options, reflexElement, controllerElement, reflexController, permanentAttributeName, target, args, url, tabId2) {
      this.options = options;
      this.reflexElement = reflexElement;
      this.controllerElement = controllerElement;
      this.reflexController = reflexController;
      this.permanentAttributeName = permanentAttributeName;
      this.target = target;
      this.args = args;
      this.url = url;
      this.tabId = tabId2;
    }
    get attrs() {
      this._attrs = this._attrs || this.options["attrs"] || extractElementAttributes(this.reflexElement);
      return this._attrs;
    }
    get id() {
      this._id = this._id || this.options["id"] || uuidv4();
      return this._id;
    }
    get selectors() {
      this._selectors = this._selectors || this.options["selectors"] || getReflexRoots(this.reflexElement);
      return typeof this._selectors === "string" ? [this._selectors] : this._selectors;
    }
    get resolveLate() {
      return this.options["resolveLate"] || false;
    }
    get dataset() {
      this._dataset = this._dataset || extractElementDataset(this.reflexElement);
      return this._dataset;
    }
    get innerHTML() {
      return this.includeInnerHtml ? this.reflexElement.innerHTML : "";
    }
    get textContent() {
      return this.includeTextContent ? this.reflexElement.textContent : "";
    }
    get xpathController() {
      return elementToXPath(this.controllerElement);
    }
    get xpathElement() {
      return elementToXPath(this.reflexElement);
    }
    get formSelector() {
      const attr = this.reflexElement.attributes[Schema.reflexFormSelector] ? this.reflexElement.attributes[Schema.reflexFormSelector].value : void 0;
      return this.options["formSelector"] || attr;
    }
    get includeInnerHtml() {
      const attr = this.reflexElement.attributes[Schema.reflexIncludeInnerHtml] || false;
      return this.options["includeInnerHTML"] || attr ? attr.value !== "false" : false;
    }
    get includeTextContent() {
      const attr = this.reflexElement.attributes[Schema.reflexIncludeTextContent] || false;
      return this.options["includeTextContent"] || attr ? attr.value !== "false" : false;
    }
    get suppressLogging() {
      return this.options["suppressLogging"] || this.reflexElement.attributes[Schema.reflexSuppressLogging] || false;
    }
    valueOf() {
      return {
        attrs: this.attrs,
        dataset: this.dataset,
        selectors: this.selectors,
        id: this.id,
        resolveLate: this.resolveLate,
        suppressLogging: this.suppressLogging,
        xpathController: this.xpathController,
        xpathElement: this.xpathElement,
        inner_html: this.innerHTML,
        text_content: this.textContent,
        formSelector: this.formSelector,
        reflexController: this.reflexController,
        permanentAttributeName: this.permanentAttributeName,
        target: this.target,
        args: this.args,
        url: this.url,
        tabId: this.tabId,
        version: packageInfo2.version
      };
    }
  };
  var transport = {};
  var Transport = {
    get plugin() {
      return transport;
    },
    set(newTransport) {
      transport = newTransport;
    }
  };
  var beforeDOMUpdate = (event) => {
    const { stimulusReflex } = event.detail || {};
    if (!stimulusReflex)
      return;
    const reflex = reflexes[stimulusReflex.id];
    reflex.pendingOperations--;
    if (reflex.pendingOperations > 0)
      return;
    if (!stimulusReflex.resolveLate)
      setTimeout(() => reflex.promise.resolve({
        element: reflex.element,
        event,
        data: reflex.data,
        payload: reflex.payload,
        id: reflex.id,
        toString: () => ""
      }));
    setTimeout(() => dispatchLifecycleEvent(reflex, "success"));
  };
  var afterDOMUpdate = (event) => {
    const { stimulusReflex } = event.detail || {};
    if (!stimulusReflex)
      return;
    const reflex = reflexes[stimulusReflex.id];
    reflex.completedOperations++;
    reflex.selector = event.detail.selector;
    reflex.morph = event.detail.stimulusReflex.morph;
    reflex.operation = event.type.split(":")[1].split("-").slice(1).join("_");
    Log2.success(reflex);
    if (reflex.completedOperations < reflex.totalOperations)
      return;
    if (stimulusReflex.resolveLate)
      setTimeout(() => reflex.promise.resolve({
        element: reflex.element,
        event,
        data: reflex.data,
        payload: reflex.payload,
        id: reflex.id,
        toString: () => ""
      }));
    setTimeout(() => dispatchLifecycleEvent(reflex, "finalize"));
    if (reflex.piggybackOperations.length)
      global2.perform(reflex.piggybackOperations);
  };
  var routeReflexEvent = (event) => {
    const { stimulusReflex, name: name3 } = event.detail || {};
    const eventType = name3.split("-")[2];
    const eventTypes = {
      nothing,
      halted,
      forbidden,
      error: error2
    };
    if (!stimulusReflex || !Object.keys(eventTypes).includes(eventType))
      return;
    const reflex = reflexes[stimulusReflex.id];
    reflex.completedOperations++;
    reflex.pendingOperations--;
    reflex.selector = event.detail.selector;
    reflex.morph = event.detail.stimulusReflex.morph;
    reflex.operation = event.type.split(":")[1].split("-").slice(1).join("_");
    if (eventType === "error")
      reflex.error = event.detail.error;
    eventTypes[eventType](reflex, event);
    setTimeout(() => dispatchLifecycleEvent(reflex, eventType));
    if (reflex.piggybackOperations.length)
      global2.perform(reflex.piggybackOperations);
  };
  var nothing = (reflex, event) => {
    Log2.success(reflex);
    setTimeout(() => reflex.promise.resolve({
      data: reflex.data,
      element: reflex.element,
      event,
      payload: reflex.payload,
      id: reflex.id,
      toString: () => ""
    }));
  };
  var halted = (reflex, event) => {
    Log2.halted(reflex, event);
    setTimeout(() => reflex.promise.resolve({
      data: reflex.data,
      element: reflex.element,
      event,
      payload: reflex.payload,
      id: reflex.id,
      toString: () => ""
    }));
  };
  var forbidden = (reflex, event) => {
    Log2.forbidden(reflex, event);
    setTimeout(() => reflex.promise.resolve({
      data: reflex.data,
      element: reflex.element,
      event,
      payload: reflex.payload,
      id: reflex.id,
      toString: () => ""
    }));
  };
  var error2 = (reflex, event) => {
    Log2.error(reflex, event);
    setTimeout(() => reflex.promise.reject({
      data: reflex.data,
      element: reflex.element,
      event,
      payload: reflex.payload,
      id: reflex.id,
      error: reflex.error,
      toString: () => reflex.error
    }));
  };
  var localReflexControllers = (element) => {
    const potentialIdentifiers = attributeValues(element.getAttribute(Schema.controller));
    const potentialControllers = potentialIdentifiers.map((identifier) => App.app.getControllerForElementAndIdentifier(element, identifier));
    return potentialControllers.filter((controller) => controller && controller.StimulusReflex);
  };
  var allReflexControllers = (element) => {
    let controllers = [];
    while (element) {
      controllers = controllers.concat(localReflexControllers(element));
      element = element.parentElement;
    }
    return controllers;
  };
  var findControllerByReflexName = (reflexName, controllers) => {
    const controller = controllers.find((controller2) => {
      if (!controller2 || !controller2.identifier)
        return;
      const identifier = reflexNameToControllerIdentifier(extractReflexName(reflexName));
      return identifier === controller2.identifier;
    });
    return controller || controllers[0];
  };
  var scanForReflexes = debounce2(() => {
    const reflexElements = document.querySelectorAll(`[${Schema.reflex}]`);
    reflexElements.forEach((element) => scanForReflexesOnElement(element));
  }, 20);
  var scanForReflexesOnElement = (element, controller = null) => {
    const controllerAttribute = element.getAttribute(Schema.controller);
    const controllers = attributeValues(controllerAttribute).filter((controller2) => controller2 !== "stimulus-reflex");
    const reflexAttribute = element.getAttribute(Schema.reflex);
    const reflexAttributeNames = attributeValues(reflexAttribute);
    const actionAttribute = element.getAttribute(Schema.action);
    const actions = attributeValues(actionAttribute).filter((action) => !action.includes("#__perform"));
    reflexAttributeNames.forEach((reflexName) => {
      const potentialControllers = [controller].concat(allReflexControllers(element));
      controller = findControllerByReflexName(reflexName, potentialControllers);
      const controllerName = controller ? controller.identifier : "stimulus-reflex";
      actions.push(`${reflexName.split("->")[0]}->${controllerName}#__perform`);
      const parentControllerElement = element.closest(`[data-controller~=${controllerName}]`);
      if (!parentControllerElement) {
        controllers.push(controllerName);
      }
    });
    const controllerValue = attributeValue(controllers);
    const actionValue = attributeValue(actions);
    let emitReadyEvent = false;
    if (controllerValue && element.getAttribute(Schema.controller) != controllerValue) {
      element.setAttribute(Schema.controller, controllerValue);
      emitReadyEvent = true;
    }
    if (actionValue && element.getAttribute(Schema.action) != actionValue) {
      element.setAttribute(Schema.action, actionValue);
      emitReadyEvent = true;
    }
    if (emitReadyEvent) {
      dispatch2(element, "stimulus-reflex:ready", {
        reflex: reflexAttribute,
        controller: controllerValue,
        action: actionValue,
        element
      });
    }
  };
  var StimulusReflexController = class extends Controller {
    constructor(...args) {
      super(...args);
      register(this);
    }
  };
  var tabId = uuidv4();
  var initialize2 = (application2, { controller, consumer: consumer3, debug, params: params2, isolate, deprecate, transport: transport2 } = {}) => {
    Transport.set(transport2 || ActionCableTransport);
    Transport.plugin.initialize(consumer3, params2);
    IsolationMode.set(!!isolate);
    App.set(application2);
    Schema.set(application2);
    App.app.register("stimulus-reflex", controller || StimulusReflexController);
    Debug$1.set(!!debug);
    if (typeof deprecate !== "undefined")
      Deprecate.set(deprecate);
    const observer = new MutationObserver(scanForReflexes);
    observer.observe(document.documentElement, {
      attributeFilter: [Schema.reflex, Schema.action],
      childList: true,
      subtree: true
    });
    emitEvent("stimulus-reflex:initialized");
  };
  var register = (controller, options = {}) => {
    const channel = "StimulusReflex::Channel";
    controller.StimulusReflex = {
      ...options,
      channel
    };
    Transport.plugin.subscribe(controller);
    Object.assign(controller, {
      stimulate() {
        const url = location.href;
        const controllerElement = this.element;
        const args = Array.from(arguments);
        const target = args.shift() || "StimulusReflex::Reflex#default_reflex";
        const reflexElement = getReflexElement(args, controllerElement);
        if (elementInvalid(reflexElement)) {
          if (Debug$1.enabled)
            console.warn("Reflex aborted: invalid numeric input");
          return;
        }
        const options2 = getReflexOptions(args);
        const reflexData = new ReflexData(options2, reflexElement, controllerElement, this.identifier, Schema.reflexPermanent, target, args, url, tabId);
        const id = reflexData.id;
        controllerElement.reflexController = controllerElement.reflexController || {};
        controllerElement.reflexData = controllerElement.reflexData || {};
        controllerElement.reflexError = controllerElement.reflexError || {};
        controllerElement.reflexController[id] = this;
        controllerElement.reflexData[id] = reflexData.valueOf();
        const reflex = new Reflex(reflexData, this);
        reflexes[id] = reflex;
        this.lastReflex = reflex;
        dispatchLifecycleEvent(reflex, "before");
        setTimeout(() => {
          const { params: params2 } = controllerElement.reflexData[id] || {};
          const check = reflexElement.attributes[Schema.reflexSerializeForm];
          if (check) {
            options2["serializeForm"] = check.value !== "false";
          }
          const form = reflexElement.closest(reflexData.formSelector) || document.querySelector(reflexData.formSelector) || reflexElement.closest("form");
          if (Deprecate.enabled && options2["serializeForm"] === void 0 && form)
            console.warn(`Deprecation warning: the next version of StimulusReflex will not serialize forms by default.
Please set ${Schema.reflexSerializeForm}="true" on your Reflex Controller Element or pass { serializeForm: true } as an option to stimulate.`);
          const formData = options2["serializeForm"] === false ? "" : serializeForm(form, {
            element: reflexElement
          });
          reflex.data = {
            ...reflexData.valueOf(),
            params: params2,
            formData
          };
          controllerElement.reflexData[id] = reflex.data;
          Transport.plugin.deliver(reflex);
        });
        Log2.request(reflex);
        return reflex.getPromise;
      },
      __perform(event) {
        let element = event.target;
        let reflex;
        while (element && !reflex) {
          reflex = element.getAttribute(Schema.reflex);
          if (!reflex || !reflex.trim().length)
            element = element.parentElement;
        }
        const match = attributeValues(reflex).find((reflex2) => reflex2.split("->")[0] === event.type);
        if (match) {
          event.preventDefault();
          event.stopPropagation();
          this.stimulate(match.split("->")[1], element);
        }
      }
    });
    if (!controller.reflexes)
      Object.defineProperty(controller, "reflexes", {
        get() {
          return new Proxy(reflexes, {
            get: function(target, prop) {
              if (prop === "last")
                return this.lastReflex;
              return Object.fromEntries(Object.entries(target[prop]).filter(([_2, reflex]) => reflex.controller === this));
            }.bind(this)
          });
        }
      });
    scanForReflexesOnElement(controller.element, controller);
    emitEvent("stimulus-reflex:controller-registered", {
      detail: {
        controller
      }
    });
  };
  var useReflex = (controller, options = {}) => {
    register(controller, options);
  };
  document.addEventListener("cable-ready:after-dispatch-event", routeReflexEvent);
  document.addEventListener("cable-ready:before-inner-html", beforeDOMUpdate);
  document.addEventListener("cable-ready:before-morph", beforeDOMUpdate);
  document.addEventListener("cable-ready:after-inner-html", afterDOMUpdate);
  document.addEventListener("cable-ready:after-morph", afterDOMUpdate);
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      scanForReflexes();
    }
  });
  var StimulusReflex = Object.freeze({
    __proto__: null,
    initialize: initialize2,
    reflexes,
    register,
    scanForReflexes,
    scanForReflexesOnElement,
    useReflex
  });
  var global3 = {
    version: packageInfo2.version,
    ...StimulusReflex,
    get debug() {
      return Debug$1.value;
    },
    set debug(value) {
      Debug$1.set(!!value);
    },
    get deprecate() {
      return Deprecate.value;
    },
    set deprecate(value) {
      Deprecate.set(!!value);
    }
  };
  window.StimulusReflex = global3;

  // controllers/application_controller.js
  var application_controller_default = class extends Controller {
    connect() {
      global3.register(this);
    }
    // Application-wide lifecycle methods
    //
    // Use these methods to handle lifecycle callbacks for all controllers.
    // Using lifecycle methods is optional, so feel free to delete these if you don't need them.
    //
    // Arguments:
    //
    //   element - the element that triggered the reflex
    //             may be different than the Stimulus controller's this.element
    //
    //   reflex - the name of the reflex e.g. "Example#demo"
    //
    //   error/noop - the error message (for reflexError), otherwise null
    //
    //   id - a UUID4 or developer-provided unique identifier for each Reflex
    //
    beforeReflex(element, reflex, noop2, id) {
    }
    reflexQueued(element, reflex, noop2, id) {
    }
    reflexDelivered(element, reflex, noop2, id) {
    }
    reflexSuccess(element, reflex, noop2, id) {
    }
    reflexError(element, reflex, error3, id) {
    }
    reflexForbidden(element, reflex, noop2, id) {
    }
    reflexHalted(element, reflex, noop2, id) {
    }
    afterReflex(element, reflex, noop2, id) {
    }
    finalizeReflex(element, reflex, noop2, id) {
    }
  };

  // controllers/example_controller.js
  var example_controller_exports = {};
  __export(example_controller_exports, {
    default: () => example_controller_default
  });
  var example_controller_default = class extends application_controller_default {
    connect() {
      super.connect();
    }
    // With StimulusReflex active in your project, it will continuously scan your DOM for
    // `data-reflex` attributes on your elements, even if they are dynamically created.
    //
    //   <a href="#" data-reflex="click->Example#dance">Dance!</a>
    //
    // We call this a "declared" Reflex, because it doesn't require any JS to run.
    //
    // When your user clicks this link, a Reflex is launched and it calls the `dance` method
    // on your Example Reflex class. You don't have to do anything else!
    //
    // This Stimulus controller doesn't even need to exist for StimulusReflex to work its magic.
    // https://docs.stimulusreflex.com/guide/reflexes#declaring-a-reflex-in-html-with-data-attributes
    //
    // However...
    //
    // If we do create an `example` Stimulus controller that extends `ApplicationController`,
    // we can unlock several additional capabilities, including creating Reflexes with code.
    //
    //   <a href="#" data-controller="example" data-action="example#dance">Dance!</a>
    //
    // StimulusReflex gives our controller a new method, `stimulate`:
    //
    // dance() {
    //   this.stimulate('Example#dance')
    // }
    //
    // The `stimulate` method is very flexible, and it gives you the opportunity to pass
    // parameter options that will be passed to the `dance` method on the server.
    // https://docs.stimulusreflex.com/guide/reflexes#calling-a-reflex-in-a-stimulus-controller
    //
    // Reflex lifecycle methods
    //
    // For every method defined in your Reflex class, a matching set of optional
    // lifecycle callback methods become available in this javascript controller.
    // https://docs.stimulusreflex.com/guide/lifecycle#client-side-reflex-callbacks
    //
    //   <a href="#" data-reflex="click->Example#dance" data-controller="example">Dance!</a>
    //
    // StimulusReflex will check for the presence of several methods:
    //
    //   afterReflex(element, reflex, noop, id) {
    //     // fires after every Example Reflex action
    //   }
    //
    //   afterDance(element, reflex, noop, id) {
    //     // fires after Example Reflexes calling the dance action
    //   }
    //
    // Arguments:
    //
    //   element - the element that triggered the reflex
    //             may be different than the Stimulus controller's this.element
    //
    //   reflex - the name of the reflex e.g. "Example#dance"
    //
    //   error/noop - the error message (for reflexError), otherwise null
    //
    //   id - a UUID4 or developer-provided unique identifier for each Reflex
    //
    // Access to the client-side Reflex objects created by this controller
    //
    // Every Reflex you create is represented by an object in the global Reflexes collection.
    // You can access the Example Reflexes created by this controller via the `reflexes` proxy.
    //
    //   this.reflexes.last
    //   this.reflexes.all
    //   this.reflexes.all[id]
    //   this.reflexes.error
    //
    // The proxy allows you to access the most recent Reflex, an array of all Reflexes, a specific
    // Reflex specified by its `id` and an array of all Reflexes in a given lifecycle stage.
    //
    // If you explore the Reflex object, you'll see all relevant details,
    // including the `data` that is being delivered to the server.
    //
    // Pretty cool, right?
    //
  };

  // controllers/profile_controller.js
  var profile_controller_exports = {};
  __export(profile_controller_exports, {
    default: () => profile_controller_default
  });
  var profile_controller_default = class extends application_controller_default {
    connect() {
      super.connect();
    }
  };

  // rails:/home/alvaro/blog-2023/blog-alvaro/app/javascript/controllers/**/*_controller.js
  var modules = [{ name: "application", module: application_controller_exports, filename: "application_controller.js" }, { name: "example", module: example_controller_exports, filename: "example_controller.js" }, { name: "profile", module: profile_controller_exports, filename: "profile_controller.js" }];
  var controller_default = modules;

  // controllers/index.js
  controller_default.forEach((controller) => {
    application.register(controller.name, controller.module.default);
  });

  // config/cable_ready.js
  global2.initialize({ consumer: consumer_default });

  // config/stimulus_reflex.js
  global3.initialize(application, { controller: application_controller_default, isolate: true });
  global3.debug = true;

  // ../../node_modules/trix/dist/trix.esm.min.js
  var t = { preview: { presentation: "gallery", caption: { name: true, size: true } }, file: { caption: { size: true } } };
  var e = { default: { tagName: "div", parse: false }, quote: { tagName: "blockquote", nestable: true }, heading1: { tagName: "h1", terminal: true, breakOnReturn: true, group: false }, code: { tagName: "pre", terminal: true, text: { plaintext: true } }, bulletList: { tagName: "ul", parse: false }, bullet: { tagName: "li", listAttribute: "bulletList", group: false, nestable: true, test(t2) {
    return i(t2.parentNode) === e[this.listAttribute].tagName;
  } }, numberList: { tagName: "ol", parse: false }, number: { tagName: "li", listAttribute: "numberList", group: false, nestable: true, test(t2) {
    return i(t2.parentNode) === e[this.listAttribute].tagName;
  } }, attachmentGallery: { tagName: "div", exclusive: true, terminal: true, parse: false, group: false } };
  var i = (t2) => {
    var e2;
    return null == t2 || null === (e2 = t2.tagName) || void 0 === e2 ? void 0 : e2.toLowerCase();
  };
  var n = navigator.userAgent.match(/android\s([0-9]+.*Chrome)/i);
  var r = n && parseInt(n[1]);
  var o = { composesExistingText: /Android.*Chrome/.test(navigator.userAgent), recentAndroid: r && r > 12, samsungAndroid: r && navigator.userAgent.match(/Android.*SM-/), forcesObjectResizing: /Trident.*rv:11/.test(navigator.userAgent), supportsInputEvents: "undefined" != typeof InputEvent && ["data", "getTargetRanges", "inputType"].every((t2) => t2 in InputEvent.prototype) };
  var s = { attachFiles: "Attach Files", bold: "Bold", bullets: "Bullets", byte: "Byte", bytes: "Bytes", captionPlaceholder: "Add a caption\u2026", code: "Code", heading1: "Heading", indent: "Increase Level", italic: "Italic", link: "Link", numbers: "Numbers", outdent: "Decrease Level", quote: "Quote", redo: "Redo", remove: "Remove", strike: "Strikethrough", undo: "Undo", unlink: "Unlink", url: "URL", urlPlaceholder: "Enter a URL\u2026", GB: "GB", KB: "KB", MB: "MB", PB: "PB", TB: "TB" };
  var a = [s.bytes, s.KB, s.MB, s.GB, s.TB, s.PB];
  var l = { prefix: "IEC", precision: 2, formatter(t2) {
    switch (t2) {
      case 0:
        return "0 ".concat(s.bytes);
      case 1:
        return "1 ".concat(s.byte);
      default:
        let e2;
        "SI" === this.prefix ? e2 = 1e3 : "IEC" === this.prefix && (e2 = 1024);
        const i2 = Math.floor(Math.log(t2) / Math.log(e2)), n2 = (t2 / Math.pow(e2, i2)).toFixed(this.precision).replace(/0*$/, "").replace(/\.$/, "");
        return "".concat(n2, " ").concat(a[i2]);
    }
  } };
  var c = function(t2) {
    for (const e2 in t2) {
      const i2 = t2[e2];
      this[e2] = i2;
    }
    return this;
  };
  var h = document.documentElement;
  var u = h.matches;
  var d = function(t2) {
    let { onElement: e2, matchingSelector: i2, withCallback: n2, inPhase: r2, preventDefault: o2, times: s2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    const a2 = e2 || h, l2 = i2, c2 = "capturing" === r2, u2 = function(t3) {
      null != s2 && 0 == --s2 && u2.destroy();
      const e3 = p(t3.target, { matchingSelector: l2 });
      null != e3 && (null == n2 || n2.call(e3, t3, e3), o2 && t3.preventDefault());
    };
    return u2.destroy = () => a2.removeEventListener(t2, u2, c2), a2.addEventListener(t2, u2, c2), u2;
  };
  var g = function(t2) {
    let { onElement: e2, bubbles: i2, cancelable: n2, attributes: r2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    const o2 = null != e2 ? e2 : h;
    i2 = false !== i2, n2 = false !== n2;
    const s2 = document.createEvent("Events");
    return s2.initEvent(t2, i2, n2), null != r2 && c.call(s2, r2), o2.dispatchEvent(s2);
  };
  var m = function(t2, e2) {
    if (1 === (null == t2 ? void 0 : t2.nodeType))
      return u.call(t2, e2);
  };
  var p = function(t2) {
    let { matchingSelector: e2, untilNode: i2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    for (; t2 && t2.nodeType !== Node.ELEMENT_NODE; )
      t2 = t2.parentNode;
    if (null != t2) {
      if (null == e2)
        return t2;
      if (t2.closest && null == i2)
        return t2.closest(e2);
      for (; t2 && t2 !== i2; ) {
        if (m(t2, e2))
          return t2;
        t2 = t2.parentNode;
      }
    }
  };
  var f = (t2) => document.activeElement !== t2 && b(t2, document.activeElement);
  var b = function(t2, e2) {
    if (t2 && e2)
      for (; e2; ) {
        if (e2 === t2)
          return true;
        e2 = e2.parentNode;
      }
  };
  var v = function(t2) {
    var e2;
    if (null === (e2 = t2) || void 0 === e2 || !e2.parentNode)
      return;
    let i2 = 0;
    for (t2 = t2.previousSibling; t2; )
      i2++, t2 = t2.previousSibling;
    return i2;
  };
  var A = (t2) => {
    var e2;
    return null == t2 || null === (e2 = t2.parentNode) || void 0 === e2 ? void 0 : e2.removeChild(t2);
  };
  var x = function(t2) {
    let { onlyNodesOfType: e2, usingFilter: i2, expandEntityReferences: n2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    const r2 = (() => {
      switch (e2) {
        case "element":
          return NodeFilter.SHOW_ELEMENT;
        case "text":
          return NodeFilter.SHOW_TEXT;
        case "comment":
          return NodeFilter.SHOW_COMMENT;
        default:
          return NodeFilter.SHOW_ALL;
      }
    })();
    return document.createTreeWalker(t2, r2, null != i2 ? i2 : null, true === n2);
  };
  var y = (t2) => {
    var e2;
    return null == t2 || null === (e2 = t2.tagName) || void 0 === e2 ? void 0 : e2.toLowerCase();
  };
  var C = function(t2) {
    let e2, i2, n2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    "object" == typeof t2 ? (n2 = t2, t2 = n2.tagName) : n2 = { attributes: n2 };
    const r2 = document.createElement(t2);
    if (null != n2.editable && (null == n2.attributes && (n2.attributes = {}), n2.attributes.contenteditable = n2.editable), n2.attributes)
      for (e2 in n2.attributes)
        i2 = n2.attributes[e2], r2.setAttribute(e2, i2);
    if (n2.style)
      for (e2 in n2.style)
        i2 = n2.style[e2], r2.style[e2] = i2;
    if (n2.data)
      for (e2 in n2.data)
        i2 = n2.data[e2], r2.dataset[e2] = i2;
    return n2.className && n2.className.split(" ").forEach((t3) => {
      r2.classList.add(t3);
    }), n2.textContent && (r2.textContent = n2.textContent), n2.childNodes && [].concat(n2.childNodes).forEach((t3) => {
      r2.appendChild(t3);
    }), r2;
  };
  var R;
  var E = function() {
    if (null != R)
      return R;
    R = [];
    for (const t2 in e) {
      const i2 = e[t2];
      i2.tagName && R.push(i2.tagName);
    }
    return R;
  };
  var S = (t2) => D(null == t2 ? void 0 : t2.firstChild);
  var k = function(t2) {
    return E().includes(y(t2)) && !E().includes(y(t2.firstChild));
  };
  var L = function(t2) {
    let { strict: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : { strict: true };
    return e2 ? D(t2) : D(t2) || !D(t2.firstChild) && k(t2);
  };
  var D = (t2) => w(t2) && "block" === (null == t2 ? void 0 : t2.data);
  var w = (t2) => (null == t2 ? void 0 : t2.nodeType) === Node.COMMENT_NODE;
  var T = function(t2) {
    let { name: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    if (t2)
      return I(t2) ? "\uFEFF" === t2.data ? !e2 || t2.parentNode.dataset.trixCursorTarget === e2 : void 0 : T(t2.firstChild);
  };
  var F = (t2) => m(t2, "[data-trix-attachment]");
  var B = (t2) => I(t2) && "" === (null == t2 ? void 0 : t2.data);
  var I = (t2) => (null == t2 ? void 0 : t2.nodeType) === Node.TEXT_NODE;
  var P = { level2Enabled: true, getLevel() {
    return this.level2Enabled && o.supportsInputEvents ? 2 : 0;
  }, pickFiles(t2) {
    const e2 = C("input", { type: "file", multiple: true, hidden: true, id: this.fileInputId });
    e2.addEventListener("change", () => {
      t2(e2.files), A(e2);
    }), A(document.getElementById(this.fileInputId)), document.body.appendChild(e2), e2.click();
  } };
  var N = { removeBlankTableCells: false, tableCellSeparator: " | ", tableRowSeparator: "\n" };
  var O = { bold: { tagName: "strong", inheritable: true, parser(t2) {
    const e2 = window.getComputedStyle(t2);
    return "bold" === e2.fontWeight || e2.fontWeight >= 600;
  } }, italic: { tagName: "em", inheritable: true, parser: (t2) => "italic" === window.getComputedStyle(t2).fontStyle }, href: { groupTagName: "a", parser(t2) {
    const e2 = "a:not(".concat("[data-trix-attachment]", ")"), i2 = t2.closest(e2);
    if (i2)
      return i2.getAttribute("href");
  } }, strike: { tagName: "del", inheritable: true }, frozen: { style: { backgroundColor: "highlight" } } };
  var M = { getDefaultHTML: () => '<div class="trix-button-row">\n      <span class="trix-button-group trix-button-group--text-tools" data-trix-button-group="text-tools">\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-bold" data-trix-attribute="bold" data-trix-key="b" title="'.concat(s.bold, '" tabindex="-1">').concat(s.bold, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-italic" data-trix-attribute="italic" data-trix-key="i" title="').concat(s.italic, '" tabindex="-1">').concat(s.italic, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-strike" data-trix-attribute="strike" title="').concat(s.strike, '" tabindex="-1">').concat(s.strike, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-link" data-trix-attribute="href" data-trix-action="link" data-trix-key="k" title="').concat(s.link, '" tabindex="-1">').concat(s.link, '</button>\n      </span>\n\n      <span class="trix-button-group trix-button-group--block-tools" data-trix-button-group="block-tools">\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-heading-1" data-trix-attribute="heading1" title="').concat(s.heading1, '" tabindex="-1">').concat(s.heading1, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-quote" data-trix-attribute="quote" title="').concat(s.quote, '" tabindex="-1">').concat(s.quote, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-code" data-trix-attribute="code" title="').concat(s.code, '" tabindex="-1">').concat(s.code, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-bullet-list" data-trix-attribute="bullet" title="').concat(s.bullets, '" tabindex="-1">').concat(s.bullets, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-number-list" data-trix-attribute="number" title="').concat(s.numbers, '" tabindex="-1">').concat(s.numbers, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-decrease-nesting-level" data-trix-action="decreaseNestingLevel" title="').concat(s.outdent, '" tabindex="-1">').concat(s.outdent, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-increase-nesting-level" data-trix-action="increaseNestingLevel" title="').concat(s.indent, '" tabindex="-1">').concat(s.indent, '</button>\n      </span>\n\n      <span class="trix-button-group trix-button-group--file-tools" data-trix-button-group="file-tools">\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-attach" data-trix-action="attachFiles" title="').concat(s.attachFiles, '" tabindex="-1">').concat(s.attachFiles, '</button>\n      </span>\n\n      <span class="trix-button-group-spacer"></span>\n\n      <span class="trix-button-group trix-button-group--history-tools" data-trix-button-group="history-tools">\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-undo" data-trix-action="undo" data-trix-key="z" title="').concat(s.undo, '" tabindex="-1">').concat(s.undo, '</button>\n        <button type="button" class="trix-button trix-button--icon trix-button--icon-redo" data-trix-action="redo" data-trix-key="shift+z" title="').concat(s.redo, '" tabindex="-1">').concat(s.redo, '</button>\n      </span>\n    </div>\n\n    <div class="trix-dialogs" data-trix-dialogs>\n      <div class="trix-dialog trix-dialog--link" data-trix-dialog="href" data-trix-dialog-attribute="href">\n        <div class="trix-dialog__link-fields">\n          <input type="url" name="href" class="trix-input trix-input--dialog" placeholder="').concat(s.urlPlaceholder, '" aria-label="').concat(s.url, '" required data-trix-input>\n          <div class="trix-button-group">\n            <input type="button" class="trix-button trix-button--dialog" value="').concat(s.link, '" data-trix-method="setAttribute">\n            <input type="button" class="trix-button trix-button--dialog" value="').concat(s.unlink, '" data-trix-method="removeAttribute">\n          </div>\n        </div>\n      </div>\n    </div>') };
  var j = { interval: 5e3 };
  var W = Object.freeze({ __proto__: null, attachments: t, blockAttributes: e, browser: o, css: { attachment: "attachment", attachmentCaption: "attachment__caption", attachmentCaptionEditor: "attachment__caption-editor", attachmentMetadata: "attachment__metadata", attachmentMetadataContainer: "attachment__metadata-container", attachmentName: "attachment__name", attachmentProgress: "attachment__progress", attachmentSize: "attachment__size", attachmentToolbar: "attachment__toolbar", attachmentGallery: "attachment-gallery" }, fileSize: l, input: P, keyNames: { 8: "backspace", 9: "tab", 13: "return", 27: "escape", 37: "left", 39: "right", 46: "delete", 68: "d", 72: "h", 79: "o" }, lang: s, parser: N, textAttributes: O, toolbar: M, undo: j });
  var U = class {
    static proxyMethod(t2) {
      const { name: e2, toMethod: i2, toProperty: n2, optional: r2 } = q(t2);
      this.prototype[e2] = function() {
        let t3, o2;
        var s2, a2;
        i2 ? o2 = r2 ? null === (s2 = this[i2]) || void 0 === s2 ? void 0 : s2.call(this) : this[i2]() : n2 && (o2 = this[n2]);
        return r2 ? (t3 = null === (a2 = o2) || void 0 === a2 ? void 0 : a2[e2], t3 ? V.call(t3, o2, arguments) : void 0) : (t3 = o2[e2], V.call(t3, o2, arguments));
      };
    }
  };
  var q = function(t2) {
    const e2 = t2.match(z);
    if (!e2)
      throw new Error("can't parse @proxyMethod expression: ".concat(t2));
    const i2 = { name: e2[4] };
    return null != e2[2] ? i2.toMethod = e2[1] : i2.toProperty = e2[1], null != e2[3] && (i2.optional = true), i2;
  };
  var { apply: V } = Function.prototype;
  var z = new RegExp("^(.+?)(\\(\\))?(\\?)?\\.(.+?)$");
  var _;
  var H;
  var J;
  var K = class extends U {
    static box() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "";
      return t2 instanceof this ? t2 : this.fromUCS2String(null == t2 ? void 0 : t2.toString());
    }
    static fromUCS2String(t2) {
      return new this(t2, Y(t2));
    }
    static fromCodepoints(t2) {
      return new this(Q(t2), t2);
    }
    constructor(t2, e2) {
      super(...arguments), this.ucs2String = t2, this.codepoints = e2, this.length = this.codepoints.length, this.ucs2Length = this.ucs2String.length;
    }
    offsetToUCS2Offset(t2) {
      return Q(this.codepoints.slice(0, Math.max(0, t2))).length;
    }
    offsetFromUCS2Offset(t2) {
      return Y(this.ucs2String.slice(0, Math.max(0, t2))).length;
    }
    slice() {
      return this.constructor.fromCodepoints(this.codepoints.slice(...arguments));
    }
    charAt(t2) {
      return this.slice(t2, t2 + 1);
    }
    isEqualTo(t2) {
      return this.constructor.box(t2).ucs2String === this.ucs2String;
    }
    toJSON() {
      return this.ucs2String;
    }
    getCacheKey() {
      return this.ucs2String;
    }
    toString() {
      return this.ucs2String;
    }
  };
  var G = 1 === (null === (_ = Array.from) || void 0 === _ ? void 0 : _.call(Array, "\u{1F47C}").length);
  var $ = null != (null === (H = " ".codePointAt) || void 0 === H ? void 0 : H.call(" ", 0));
  var X = " \u{1F47C}" === (null === (J = String.fromCodePoint) || void 0 === J ? void 0 : J.call(String, 32, 128124));
  var Y;
  var Q;
  Y = G && $ ? (t2) => Array.from(t2).map((t3) => t3.codePointAt(0)) : function(t2) {
    const e2 = [];
    let i2 = 0;
    const { length: n2 } = t2;
    for (; i2 < n2; ) {
      let r2 = t2.charCodeAt(i2++);
      if (55296 <= r2 && r2 <= 56319 && i2 < n2) {
        const e3 = t2.charCodeAt(i2++);
        56320 == (64512 & e3) ? r2 = ((1023 & r2) << 10) + (1023 & e3) + 65536 : i2--;
      }
      e2.push(r2);
    }
    return e2;
  }, Q = X ? (t2) => String.fromCodePoint(...Array.from(t2 || [])) : function(t2) {
    return (() => {
      const e2 = [];
      return Array.from(t2).forEach((t3) => {
        let i2 = "";
        t3 > 65535 && (t3 -= 65536, i2 += String.fromCharCode(t3 >>> 10 & 1023 | 55296), t3 = 56320 | 1023 & t3), e2.push(i2 + String.fromCharCode(t3));
      }), e2;
    })().join("");
  };
  var Z = 0;
  var tt = class extends U {
    static fromJSONString(t2) {
      return this.fromJSON(JSON.parse(t2));
    }
    constructor() {
      super(...arguments), this.id = ++Z;
    }
    hasSameConstructorAs(t2) {
      return this.constructor === (null == t2 ? void 0 : t2.constructor);
    }
    isEqualTo(t2) {
      return this === t2;
    }
    inspect() {
      const t2 = [], e2 = this.contentsForInspection() || {};
      for (const i2 in e2) {
        const n2 = e2[i2];
        t2.push("".concat(i2, "=").concat(n2));
      }
      return "#<".concat(this.constructor.name, ":").concat(this.id).concat(t2.length ? " ".concat(t2.join(", ")) : "", ">");
    }
    contentsForInspection() {
    }
    toJSONString() {
      return JSON.stringify(this);
    }
    toUTF16String() {
      return K.box(this);
    }
    getCacheKey() {
      return this.id.toString();
    }
  };
  var et = function() {
    let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [], e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [];
    if (t2.length !== e2.length)
      return false;
    for (let i2 = 0; i2 < t2.length; i2++) {
      if (t2[i2] !== e2[i2])
        return false;
    }
    return true;
  };
  var it = function(t2) {
    const e2 = t2.slice(0);
    for (var i2 = arguments.length, n2 = new Array(i2 > 1 ? i2 - 1 : 0), r2 = 1; r2 < i2; r2++)
      n2[r2 - 1] = arguments[r2];
    return e2.splice(...n2), e2;
  };
  var nt = /[\u05BE\u05C0\u05C3\u05D0-\u05EA\u05F0-\u05F4\u061B\u061F\u0621-\u063A\u0640-\u064A\u066D\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D5\u06E5\u06E6\u200F\u202B\u202E\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE72\uFE74\uFE76-\uFEFC]/;
  var rt = function() {
    const t2 = C("input", { dir: "auto", name: "x", dirName: "x.dir" }), e2 = C("form");
    e2.appendChild(t2);
    const i2 = function() {
      try {
        return new FormData(e2).has(t2.dirName);
      } catch (t3) {
        return false;
      }
    }(), n2 = function() {
      try {
        return t2.matches(":dir(ltr),:dir(rtl)");
      } catch (t3) {
        return false;
      }
    }();
    return i2 ? function(i3) {
      return t2.value = i3, new FormData(e2).get(t2.dirName);
    } : n2 ? function(e3) {
      return t2.value = e3, t2.matches(":dir(rtl)") ? "rtl" : "ltr";
    } : function(t3) {
      const e3 = t3.trim().charAt(0);
      return nt.test(e3) ? "rtl" : "ltr";
    };
  }();
  var ot = null;
  var st = null;
  var at = null;
  var lt = null;
  var ct = () => (ot || (ot = gt().concat(ut())), ot);
  var ht = (t2) => e[t2];
  var ut = () => (st || (st = Object.keys(e)), st);
  var dt = (t2) => O[t2];
  var gt = () => (at || (at = Object.keys(O)), at);
  var mt = function(t2, e2) {
    pt(t2).textContent = e2.replace(/%t/g, t2);
  };
  var pt = function(t2) {
    const e2 = document.createElement("style");
    e2.setAttribute("type", "text/css"), e2.setAttribute("data-tag-name", t2.toLowerCase());
    const i2 = ft();
    return i2 && e2.setAttribute("nonce", i2), document.head.insertBefore(e2, document.head.firstChild), e2;
  };
  var ft = function() {
    const t2 = bt("trix-csp-nonce") || bt("csp-nonce");
    if (t2)
      return t2.getAttribute("content");
  };
  var bt = (t2) => document.head.querySelector("meta[name=".concat(t2, "]"));
  var vt = { "application/x-trix-feature-detection": "test" };
  var At = function(t2) {
    const e2 = t2.getData("text/plain"), i2 = t2.getData("text/html");
    if (!e2 || !i2)
      return null == e2 ? void 0 : e2.length;
    {
      const { body: t3 } = new DOMParser().parseFromString(i2, "text/html");
      if (t3.textContent === e2)
        return !t3.querySelector("*");
    }
  };
  var xt = /Mac|^iP/.test(navigator.platform) ? (t2) => t2.metaKey : (t2) => t2.ctrlKey;
  var yt = (t2) => setTimeout(t2, 1);
  var Ct = function() {
    let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
    const e2 = {};
    for (const i2 in t2) {
      const n2 = t2[i2];
      e2[i2] = n2;
    }
    return e2;
  };
  var Rt = function() {
    let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}, e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    if (Object.keys(t2).length !== Object.keys(e2).length)
      return false;
    for (const i2 in t2) {
      if (t2[i2] !== e2[i2])
        return false;
    }
    return true;
  };
  var Et = function(t2) {
    if (null != t2)
      return Array.isArray(t2) || (t2 = [t2, t2]), [Lt(t2[0]), Lt(null != t2[1] ? t2[1] : t2[0])];
  };
  var St = function(t2) {
    if (null == t2)
      return;
    const [e2, i2] = Et(t2);
    return Dt(e2, i2);
  };
  var kt = function(t2, e2) {
    if (null == t2 || null == e2)
      return;
    const [i2, n2] = Et(t2), [r2, o2] = Et(e2);
    return Dt(i2, r2) && Dt(n2, o2);
  };
  var Lt = function(t2) {
    return "number" == typeof t2 ? t2 : Ct(t2);
  };
  var Dt = function(t2, e2) {
    return "number" == typeof t2 ? t2 === e2 : Rt(t2, e2);
  };
  var wt = class extends U {
    constructor() {
      super(...arguments), this.update = this.update.bind(this), this.run = this.run.bind(this), this.selectionManagers = [];
    }
    start() {
      if (!this.started)
        return this.started = true, "onselectionchange" in document ? document.addEventListener("selectionchange", this.update, true) : this.run();
    }
    stop() {
      if (this.started)
        return this.started = false, document.removeEventListener("selectionchange", this.update, true);
    }
    registerSelectionManager(t2) {
      if (!this.selectionManagers.includes(t2))
        return this.selectionManagers.push(t2), this.start();
    }
    unregisterSelectionManager(t2) {
      if (this.selectionManagers = this.selectionManagers.filter((e2) => e2 !== t2), 0 === this.selectionManagers.length)
        return this.stop();
    }
    notifySelectionManagersOfSelectionChange() {
      return this.selectionManagers.map((t2) => t2.selectionDidChange());
    }
    update() {
      const t2 = It();
      if (!Tt(t2, this.domRange))
        return this.domRange = t2, this.notifySelectionManagersOfSelectionChange();
    }
    reset() {
      return this.domRange = null, this.update();
    }
    run() {
      if (this.started)
        return this.update(), requestAnimationFrame(this.run);
    }
  };
  var Tt = (t2, e2) => (null == t2 ? void 0 : t2.startContainer) === (null == e2 ? void 0 : e2.startContainer) && (null == t2 ? void 0 : t2.startOffset) === (null == e2 ? void 0 : e2.startOffset) && (null == t2 ? void 0 : t2.endContainer) === (null == e2 ? void 0 : e2.endContainer) && (null == t2 ? void 0 : t2.endOffset) === (null == e2 ? void 0 : e2.endOffset);
  var Ft = new wt();
  var Bt = function() {
    const t2 = window.getSelection();
    if (t2.rangeCount > 0)
      return t2;
  };
  var It = function() {
    var t2;
    const e2 = null === (t2 = Bt()) || void 0 === t2 ? void 0 : t2.getRangeAt(0);
    if (e2 && !Nt(e2))
      return e2;
  };
  var Pt = function(t2) {
    const e2 = window.getSelection();
    return e2.removeAllRanges(), e2.addRange(t2), Ft.update();
  };
  var Nt = (t2) => Ot(t2.startContainer) || Ot(t2.endContainer);
  var Ot = (t2) => !Object.getPrototypeOf(t2);
  var Mt = (t2) => t2.replace(new RegExp("".concat("\uFEFF"), "g"), "").replace(new RegExp("".concat("\xA0"), "g"), " ");
  var jt = new RegExp("[^\\S".concat("\xA0", "]"));
  var Wt = (t2) => t2.replace(new RegExp("".concat(jt.source), "g"), " ").replace(/\ {2,}/g, " ");
  var Ut = function(t2, e2) {
    if (t2.isEqualTo(e2))
      return ["", ""];
    const i2 = qt(t2, e2), { length: n2 } = i2.utf16String;
    let r2;
    if (n2) {
      const { offset: o2 } = i2, s2 = t2.codepoints.slice(0, o2).concat(t2.codepoints.slice(o2 + n2));
      r2 = qt(e2, K.fromCodepoints(s2));
    } else
      r2 = qt(e2, t2);
    return [i2.utf16String.toString(), r2.utf16String.toString()];
  };
  var qt = function(t2, e2) {
    let i2 = 0, n2 = t2.length, r2 = e2.length;
    for (; i2 < n2 && t2.charAt(i2).isEqualTo(e2.charAt(i2)); )
      i2++;
    for (; n2 > i2 + 1 && t2.charAt(n2 - 1).isEqualTo(e2.charAt(r2 - 1)); )
      n2--, r2--;
    return { utf16String: t2.slice(i2, n2), offset: i2 };
  };
  var Vt = class extends tt {
    static fromCommonAttributesOfObjects() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      if (!t2.length)
        return new this();
      let e2 = Jt(t2[0]), i2 = e2.getKeys();
      return t2.slice(1).forEach((t3) => {
        i2 = e2.getKeysCommonToHash(Jt(t3)), e2 = e2.slice(i2);
      }), e2;
    }
    static box(t2) {
      return Jt(t2);
    }
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      super(...arguments), this.values = Ht(t2);
    }
    add(t2, e2) {
      return this.merge(zt(t2, e2));
    }
    remove(t2) {
      return new Vt(Ht(this.values, t2));
    }
    get(t2) {
      return this.values[t2];
    }
    has(t2) {
      return t2 in this.values;
    }
    merge(t2) {
      return new Vt(_t(this.values, Kt(t2)));
    }
    slice(t2) {
      const e2 = {};
      return Array.from(t2).forEach((t3) => {
        this.has(t3) && (e2[t3] = this.values[t3]);
      }), new Vt(e2);
    }
    getKeys() {
      return Object.keys(this.values);
    }
    getKeysCommonToHash(t2) {
      return t2 = Jt(t2), this.getKeys().filter((e2) => this.values[e2] === t2.values[e2]);
    }
    isEqualTo(t2) {
      return et(this.toArray(), Jt(t2).toArray());
    }
    isEmpty() {
      return 0 === this.getKeys().length;
    }
    toArray() {
      if (!this.array) {
        const t2 = [];
        for (const e2 in this.values) {
          const i2 = this.values[e2];
          t2.push(t2.push(e2, i2));
        }
        this.array = t2.slice(0);
      }
      return this.array;
    }
    toObject() {
      return Ht(this.values);
    }
    toJSON() {
      return this.toObject();
    }
    contentsForInspection() {
      return { values: JSON.stringify(this.values) };
    }
  };
  var zt = function(t2, e2) {
    const i2 = {};
    return i2[t2] = e2, i2;
  };
  var _t = function(t2, e2) {
    const i2 = Ht(t2);
    for (const t3 in e2) {
      const n2 = e2[t3];
      i2[t3] = n2;
    }
    return i2;
  };
  var Ht = function(t2, e2) {
    const i2 = {};
    return Object.keys(t2).sort().forEach((n2) => {
      n2 !== e2 && (i2[n2] = t2[n2]);
    }), i2;
  };
  var Jt = function(t2) {
    return t2 instanceof Vt ? t2 : new Vt(t2);
  };
  var Kt = function(t2) {
    return t2 instanceof Vt ? t2.values : t2;
  };
  var Gt = class {
    static groupObjects() {
      let t2, e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [], { depth: i2, asTree: n2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      n2 && null == i2 && (i2 = 0);
      const r2 = [];
      return Array.from(e2).forEach((e3) => {
        var o2;
        if (t2) {
          var s2, a2, l2;
          if (null !== (s2 = e3.canBeGrouped) && void 0 !== s2 && s2.call(e3, i2) && null !== (a2 = (l2 = t2[t2.length - 1]).canBeGroupedWith) && void 0 !== a2 && a2.call(l2, e3, i2))
            return void t2.push(e3);
          r2.push(new this(t2, { depth: i2, asTree: n2 })), t2 = null;
        }
        null !== (o2 = e3.canBeGrouped) && void 0 !== o2 && o2.call(e3, i2) ? t2 = [e3] : r2.push(e3);
      }), t2 && r2.push(new this(t2, { depth: i2, asTree: n2 })), r2;
    }
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [], { depth: e2, asTree: i2 } = arguments.length > 1 ? arguments[1] : void 0;
      this.objects = t2, i2 && (this.depth = e2, this.objects = this.constructor.groupObjects(this.objects, { asTree: i2, depth: this.depth + 1 }));
    }
    getObjects() {
      return this.objects;
    }
    getDepth() {
      return this.depth;
    }
    getCacheKey() {
      const t2 = ["objectGroup"];
      return Array.from(this.getObjects()).forEach((e2) => {
        t2.push(e2.getCacheKey());
      }), t2.join("/");
    }
  };
  var $t = class extends U {
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      super(...arguments), this.objects = {}, Array.from(t2).forEach((t3) => {
        const e2 = JSON.stringify(t3);
        null == this.objects[e2] && (this.objects[e2] = t3);
      });
    }
    find(t2) {
      const e2 = JSON.stringify(t2);
      return this.objects[e2];
    }
  };
  var Xt = class {
    constructor(t2) {
      this.reset(t2);
    }
    add(t2) {
      const e2 = Yt(t2);
      this.elements[e2] = t2;
    }
    remove(t2) {
      const e2 = Yt(t2), i2 = this.elements[e2];
      if (i2)
        return delete this.elements[e2], i2;
    }
    reset() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      return this.elements = {}, Array.from(t2).forEach((t3) => {
        this.add(t3);
      }), t2;
    }
  };
  var Yt = (t2) => t2.dataset.trixStoreKey;
  var Qt = class extends U {
    isPerforming() {
      return true === this.performing;
    }
    hasPerformed() {
      return true === this.performed;
    }
    hasSucceeded() {
      return this.performed && this.succeeded;
    }
    hasFailed() {
      return this.performed && !this.succeeded;
    }
    getPromise() {
      return this.promise || (this.promise = new Promise((t2, e2) => (this.performing = true, this.perform((i2, n2) => {
        this.succeeded = i2, this.performing = false, this.performed = true, this.succeeded ? t2(n2) : e2(n2);
      })))), this.promise;
    }
    perform(t2) {
      return t2(false);
    }
    release() {
      var t2, e2;
      null === (t2 = this.promise) || void 0 === t2 || null === (e2 = t2.cancel) || void 0 === e2 || e2.call(t2), this.promise = null, this.performing = null, this.performed = null, this.succeeded = null;
    }
  };
  Qt.proxyMethod("getPromise().then"), Qt.proxyMethod("getPromise().catch");
  var Zt = class extends U {
    constructor(t2) {
      let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      super(...arguments), this.object = t2, this.options = e2, this.childViews = [], this.rootView = this;
    }
    getNodes() {
      return this.nodes || (this.nodes = this.createNodes()), this.nodes.map((t2) => t2.cloneNode(true));
    }
    invalidate() {
      var t2;
      return this.nodes = null, this.childViews = [], null === (t2 = this.parentView) || void 0 === t2 ? void 0 : t2.invalidate();
    }
    invalidateViewForObject(t2) {
      var e2;
      return null === (e2 = this.findViewForObject(t2)) || void 0 === e2 ? void 0 : e2.invalidate();
    }
    findOrCreateCachedChildView(t2, e2, i2) {
      let n2 = this.getCachedViewForObject(e2);
      return n2 ? this.recordChildView(n2) : (n2 = this.createChildView(...arguments), this.cacheViewForObject(n2, e2)), n2;
    }
    createChildView(t2, e2) {
      let i2 = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
      e2 instanceof Gt && (i2.viewClass = t2, t2 = te);
      const n2 = new t2(e2, i2);
      return this.recordChildView(n2);
    }
    recordChildView(t2) {
      return t2.parentView = this, t2.rootView = this.rootView, this.childViews.push(t2), t2;
    }
    getAllChildViews() {
      let t2 = [];
      return this.childViews.forEach((e2) => {
        t2.push(e2), t2 = t2.concat(e2.getAllChildViews());
      }), t2;
    }
    findElement() {
      return this.findElementForObject(this.object);
    }
    findElementForObject(t2) {
      const e2 = null == t2 ? void 0 : t2.id;
      if (e2)
        return this.rootView.element.querySelector("[data-trix-id='".concat(e2, "']"));
    }
    findViewForObject(t2) {
      for (const e2 of this.getAllChildViews())
        if (e2.object === t2)
          return e2;
    }
    getViewCache() {
      return this.rootView !== this ? this.rootView.getViewCache() : this.isViewCachingEnabled() ? (this.viewCache || (this.viewCache = {}), this.viewCache) : void 0;
    }
    isViewCachingEnabled() {
      return false !== this.shouldCacheViews;
    }
    enableViewCaching() {
      this.shouldCacheViews = true;
    }
    disableViewCaching() {
      this.shouldCacheViews = false;
    }
    getCachedViewForObject(t2) {
      var e2;
      return null === (e2 = this.getViewCache()) || void 0 === e2 ? void 0 : e2[t2.getCacheKey()];
    }
    cacheViewForObject(t2, e2) {
      const i2 = this.getViewCache();
      i2 && (i2[e2.getCacheKey()] = t2);
    }
    garbageCollectCachedViews() {
      const t2 = this.getViewCache();
      if (t2) {
        const e2 = this.getAllChildViews().concat(this).map((t3) => t3.object.getCacheKey());
        for (const i2 in t2)
          e2.includes(i2) || delete t2[i2];
      }
    }
  };
  var te = class extends Zt {
    constructor() {
      super(...arguments), this.objectGroup = this.object, this.viewClass = this.options.viewClass, delete this.options.viewClass;
    }
    getChildViews() {
      return this.childViews.length || Array.from(this.objectGroup.getObjects()).forEach((t2) => {
        this.findOrCreateCachedChildView(this.viewClass, t2, this.options);
      }), this.childViews;
    }
    createNodes() {
      const t2 = this.createContainerElement();
      return this.getChildViews().forEach((e2) => {
        Array.from(e2.getNodes()).forEach((e3) => {
          t2.appendChild(e3);
        });
      }), [t2];
    }
    createContainerElement() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : this.objectGroup.getDepth();
      return this.getChildViews()[0].createContainerElement(t2);
    }
  };
  var { css: ee } = W;
  var ie = class extends Zt {
    constructor() {
      super(...arguments), this.attachment = this.object, this.attachment.uploadProgressDelegate = this, this.attachmentPiece = this.options.piece;
    }
    createContentNodes() {
      return [];
    }
    createNodes() {
      let t2;
      const e2 = t2 = C({ tagName: "figure", className: this.getClassName(), data: this.getData(), editable: false }), i2 = this.getHref();
      return i2 && (t2 = C({ tagName: "a", editable: false, attributes: { href: i2, tabindex: -1 } }), e2.appendChild(t2)), this.attachment.hasContent() ? t2.innerHTML = this.attachment.getContent() : this.createContentNodes().forEach((e3) => {
        t2.appendChild(e3);
      }), t2.appendChild(this.createCaptionElement()), this.attachment.isPending() && (this.progressElement = C({ tagName: "progress", attributes: { class: ee.attachmentProgress, value: this.attachment.getUploadProgress(), max: 100 }, data: { trixMutable: true, trixStoreKey: ["progressElement", this.attachment.id].join("/") } }), e2.appendChild(this.progressElement)), [ne("left"), e2, ne("right")];
    }
    createCaptionElement() {
      const t2 = C({ tagName: "figcaption", className: ee.attachmentCaption }), e2 = this.attachmentPiece.getCaption();
      if (e2)
        t2.classList.add("".concat(ee.attachmentCaption, "--edited")), t2.textContent = e2;
      else {
        let e3, i2;
        const n2 = this.getCaptionConfig();
        if (n2.name && (e3 = this.attachment.getFilename()), n2.size && (i2 = this.attachment.getFormattedFilesize()), e3) {
          const i3 = C({ tagName: "span", className: ee.attachmentName, textContent: e3 });
          t2.appendChild(i3);
        }
        if (i2) {
          e3 && t2.appendChild(document.createTextNode(" "));
          const n3 = C({ tagName: "span", className: ee.attachmentSize, textContent: i2 });
          t2.appendChild(n3);
        }
      }
      return t2;
    }
    getClassName() {
      const t2 = [ee.attachment, "".concat(ee.attachment, "--").concat(this.attachment.getType())], e2 = this.attachment.getExtension();
      return e2 && t2.push("".concat(ee.attachment, "--").concat(e2)), t2.join(" ");
    }
    getData() {
      const t2 = { trixAttachment: JSON.stringify(this.attachment), trixContentType: this.attachment.getContentType(), trixId: this.attachment.id }, { attributes: e2 } = this.attachmentPiece;
      return e2.isEmpty() || (t2.trixAttributes = JSON.stringify(e2)), this.attachment.isPending() && (t2.trixSerialize = false), t2;
    }
    getHref() {
      if (!re(this.attachment.getContent(), "a"))
        return this.attachment.getHref();
    }
    getCaptionConfig() {
      var e2;
      const i2 = this.attachment.getType(), n2 = Ct(null === (e2 = t[i2]) || void 0 === e2 ? void 0 : e2.caption);
      return "file" === i2 && (n2.name = true), n2;
    }
    findProgressElement() {
      var t2;
      return null === (t2 = this.findElement()) || void 0 === t2 ? void 0 : t2.querySelector("progress");
    }
    attachmentDidChangeUploadProgress() {
      const t2 = this.attachment.getUploadProgress(), e2 = this.findProgressElement();
      e2 && (e2.value = t2);
    }
  };
  var ne = (t2) => C({ tagName: "span", textContent: "\uFEFF", data: { trixCursorTarget: t2, trixSerialize: false } });
  var re = function(t2, e2) {
    const i2 = C("div");
    return i2.innerHTML = t2 || "", i2.querySelector(e2);
  };
  var oe = class extends ie {
    constructor() {
      super(...arguments), this.attachment.previewDelegate = this;
    }
    createContentNodes() {
      return this.image = C({ tagName: "img", attributes: { src: "" }, data: { trixMutable: true } }), this.refresh(this.image), [this.image];
    }
    createCaptionElement() {
      const t2 = super.createCaptionElement(...arguments);
      return t2.textContent || t2.setAttribute("data-trix-placeholder", s.captionPlaceholder), t2;
    }
    refresh(t2) {
      var e2;
      t2 || (t2 = null === (e2 = this.findElement()) || void 0 === e2 ? void 0 : e2.querySelector("img"));
      if (t2)
        return this.updateAttributesForImage(t2);
    }
    updateAttributesForImage(t2) {
      const e2 = this.attachment.getURL(), i2 = this.attachment.getPreviewURL();
      if (t2.src = i2 || e2, i2 === e2)
        t2.removeAttribute("data-trix-serialized-attributes");
      else {
        const i3 = JSON.stringify({ src: e2 });
        t2.setAttribute("data-trix-serialized-attributes", i3);
      }
      const n2 = this.attachment.getWidth(), r2 = this.attachment.getHeight();
      null != n2 && (t2.width = n2), null != r2 && (t2.height = r2);
      const o2 = ["imageElement", this.attachment.id, t2.src, t2.width, t2.height].join("/");
      t2.dataset.trixStoreKey = o2;
    }
    attachmentDidChangeAttributes() {
      return this.refresh(this.image), this.refresh();
    }
  };
  var se = class extends Zt {
    constructor() {
      super(...arguments), this.piece = this.object, this.attributes = this.piece.getAttributes(), this.textConfig = this.options.textConfig, this.context = this.options.context, this.piece.attachment ? this.attachment = this.piece.attachment : this.string = this.piece.toString();
    }
    createNodes() {
      let t2 = this.attachment ? this.createAttachmentNodes() : this.createStringNodes();
      const e2 = this.createElement();
      if (e2) {
        const i2 = function(t3) {
          for (; null !== (e3 = t3) && void 0 !== e3 && e3.firstElementChild; ) {
            var e3;
            t3 = t3.firstElementChild;
          }
          return t3;
        }(e2);
        Array.from(t2).forEach((t3) => {
          i2.appendChild(t3);
        }), t2 = [e2];
      }
      return t2;
    }
    createAttachmentNodes() {
      const t2 = this.attachment.isPreviewable() ? oe : ie;
      return this.createChildView(t2, this.piece.attachment, { piece: this.piece }).getNodes();
    }
    createStringNodes() {
      var t2;
      if (null !== (t2 = this.textConfig) && void 0 !== t2 && t2.plaintext)
        return [document.createTextNode(this.string)];
      {
        const t3 = [], e2 = this.string.split("\n");
        for (let i2 = 0; i2 < e2.length; i2++) {
          const n2 = e2[i2];
          if (i2 > 0) {
            const e3 = C("br");
            t3.push(e3);
          }
          if (n2.length) {
            const e3 = document.createTextNode(this.preserveSpaces(n2));
            t3.push(e3);
          }
        }
        return t3;
      }
    }
    createElement() {
      let t2, e2, i2;
      const n2 = {};
      for (e2 in this.attributes) {
        i2 = this.attributes[e2];
        const o2 = dt(e2);
        if (o2) {
          if (o2.tagName) {
            var r2;
            const e3 = C(o2.tagName);
            r2 ? (r2.appendChild(e3), r2 = e3) : t2 = r2 = e3;
          }
          if (o2.styleProperty && (n2[o2.styleProperty] = i2), o2.style)
            for (e2 in o2.style)
              i2 = o2.style[e2], n2[e2] = i2;
        }
      }
      if (Object.keys(n2).length)
        for (e2 in t2 || (t2 = C("span")), n2)
          i2 = n2[e2], t2.style[e2] = i2;
      return t2;
    }
    createContainerElement() {
      for (const t2 in this.attributes) {
        const e2 = this.attributes[t2], i2 = dt(t2);
        if (i2 && i2.groupTagName) {
          const n2 = {};
          return n2[t2] = e2, C(i2.groupTagName, n2);
        }
      }
    }
    preserveSpaces(t2) {
      return this.context.isLast && (t2 = t2.replace(/\ $/, "\xA0")), t2 = t2.replace(/(\S)\ {3}(\S)/g, "$1 ".concat("\xA0", " $2")).replace(/\ {2}/g, "".concat("\xA0", " ")).replace(/\ {2}/g, " ".concat("\xA0")), (this.context.isFirst || this.context.followsWhitespace) && (t2 = t2.replace(/^\ /, "\xA0")), t2;
    }
  };
  var ae = class extends Zt {
    constructor() {
      super(...arguments), this.text = this.object, this.textConfig = this.options.textConfig;
    }
    createNodes() {
      const t2 = [], e2 = Gt.groupObjects(this.getPieces()), i2 = e2.length - 1;
      for (let r2 = 0; r2 < e2.length; r2++) {
        const o2 = e2[r2], s2 = {};
        0 === r2 && (s2.isFirst = true), r2 === i2 && (s2.isLast = true), le(n2) && (s2.followsWhitespace = true);
        const a2 = this.findOrCreateCachedChildView(se, o2, { textConfig: this.textConfig, context: s2 });
        t2.push(...Array.from(a2.getNodes() || []));
        var n2 = o2;
      }
      return t2;
    }
    getPieces() {
      return Array.from(this.text.getPieces()).filter((t2) => !t2.hasAttribute("blockBreak"));
    }
  };
  var le = (t2) => /\s$/.test(null == t2 ? void 0 : t2.toString());
  var { css: ce } = W;
  var he = class extends Zt {
    constructor() {
      super(...arguments), this.block = this.object, this.attributes = this.block.getAttributes();
    }
    createNodes() {
      const t2 = [document.createComment("block")];
      if (this.block.isEmpty())
        t2.push(C("br"));
      else {
        var i2;
        const e2 = null === (i2 = ht(this.block.getLastAttribute())) || void 0 === i2 ? void 0 : i2.text, n2 = this.findOrCreateCachedChildView(ae, this.block.text, { textConfig: e2 });
        t2.push(...Array.from(n2.getNodes() || [])), this.shouldAddExtraNewlineElement() && t2.push(C("br"));
      }
      if (this.attributes.length)
        return t2;
      {
        let i3;
        const { tagName: n2 } = e.default;
        this.block.isRTL() && (i3 = { dir: "rtl" });
        const r2 = C({ tagName: n2, attributes: i3 });
        return t2.forEach((t3) => r2.appendChild(t3)), [r2];
      }
    }
    createContainerElement(t2) {
      let e2, i2;
      const n2 = this.attributes[t2], { tagName: r2 } = ht(n2);
      if (0 === t2 && this.block.isRTL() && (e2 = { dir: "rtl" }), "attachmentGallery" === n2) {
        const t3 = this.block.getBlockBreakPosition();
        i2 = "".concat(ce.attachmentGallery, " ").concat(ce.attachmentGallery, "--").concat(t3);
      }
      return C({ tagName: r2, className: i2, attributes: e2 });
    }
    shouldAddExtraNewlineElement() {
      return /\n\n$/.test(this.block.toString());
    }
  };
  var ue = class extends Zt {
    static render(t2) {
      const e2 = C("div"), i2 = new this(t2, { element: e2 });
      return i2.render(), i2.sync(), e2;
    }
    constructor() {
      super(...arguments), this.element = this.options.element, this.elementStore = new Xt(), this.setDocument(this.object);
    }
    setDocument(t2) {
      t2.isEqualTo(this.document) || (this.document = this.object = t2);
    }
    render() {
      if (this.childViews = [], this.shadowElement = C("div"), !this.document.isEmpty()) {
        const t2 = Gt.groupObjects(this.document.getBlocks(), { asTree: true });
        Array.from(t2).forEach((t3) => {
          const e2 = this.findOrCreateCachedChildView(he, t3);
          Array.from(e2.getNodes()).map((t4) => this.shadowElement.appendChild(t4));
        });
      }
    }
    isSynced() {
      return ge(this.shadowElement, this.element);
    }
    sync() {
      const t2 = this.createDocumentFragmentForSync();
      for (; this.element.lastChild; )
        this.element.removeChild(this.element.lastChild);
      return this.element.appendChild(t2), this.didSync();
    }
    didSync() {
      return this.elementStore.reset(de(this.element)), yt(() => this.garbageCollectCachedViews());
    }
    createDocumentFragmentForSync() {
      const t2 = document.createDocumentFragment();
      return Array.from(this.shadowElement.childNodes).forEach((e2) => {
        t2.appendChild(e2.cloneNode(true));
      }), Array.from(de(t2)).forEach((t3) => {
        const e2 = this.elementStore.remove(t3);
        e2 && t3.parentNode.replaceChild(e2, t3);
      }), t2;
    }
  };
  var de = (t2) => t2.querySelectorAll("[data-trix-store-key]");
  var ge = (t2, e2) => me(t2.innerHTML) === me(e2.innerHTML);
  var me = (t2) => t2.replace(/&nbsp;/g, " ");
  function pe(t2) {
    this.wrapped = t2;
  }
  function fe(t2) {
    var e2, i2;
    function n2(e3, i3) {
      try {
        var o2 = t2[e3](i3), s2 = o2.value, a2 = s2 instanceof pe;
        Promise.resolve(a2 ? s2.wrapped : s2).then(function(t3) {
          a2 ? n2("return" === e3 ? "return" : "next", t3) : r2(o2.done ? "return" : "normal", t3);
        }, function(t3) {
          n2("throw", t3);
        });
      } catch (t3) {
        r2("throw", t3);
      }
    }
    function r2(t3, r3) {
      switch (t3) {
        case "return":
          e2.resolve({ value: r3, done: true });
          break;
        case "throw":
          e2.reject(r3);
          break;
        default:
          e2.resolve({ value: r3, done: false });
      }
      (e2 = e2.next) ? n2(e2.key, e2.arg) : i2 = null;
    }
    this._invoke = function(t3, r3) {
      return new Promise(function(o2, s2) {
        var a2 = { key: t3, arg: r3, resolve: o2, reject: s2, next: null };
        i2 ? i2 = i2.next = a2 : (e2 = i2 = a2, n2(t3, r3));
      });
    }, "function" != typeof t2.return && (this.return = void 0);
  }
  function be(t2, e2, i2) {
    return e2 in t2 ? Object.defineProperty(t2, e2, { value: i2, enumerable: true, configurable: true, writable: true }) : t2[e2] = i2, t2;
  }
  fe.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function() {
    return this;
  }, fe.prototype.next = function(t2) {
    return this._invoke("next", t2);
  }, fe.prototype.throw = function(t2) {
    return this._invoke("throw", t2);
  }, fe.prototype.return = function(t2) {
    return this._invoke("return", t2);
  };
  var ve = class extends tt {
    static registerType(t2, e2) {
      e2.type = t2, this.types[t2] = e2;
    }
    static fromJSON(t2) {
      const e2 = this.types[t2.type];
      if (e2)
        return e2.fromJSON(t2);
    }
    constructor(t2) {
      let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      super(...arguments), this.attributes = Vt.box(e2);
    }
    copyWithAttributes(t2) {
      return new this.constructor(this.getValue(), t2);
    }
    copyWithAdditionalAttributes(t2) {
      return this.copyWithAttributes(this.attributes.merge(t2));
    }
    copyWithoutAttribute(t2) {
      return this.copyWithAttributes(this.attributes.remove(t2));
    }
    copy() {
      return this.copyWithAttributes(this.attributes);
    }
    getAttribute(t2) {
      return this.attributes.get(t2);
    }
    getAttributesHash() {
      return this.attributes;
    }
    getAttributes() {
      return this.attributes.toObject();
    }
    hasAttribute(t2) {
      return this.attributes.has(t2);
    }
    hasSameStringValueAsPiece(t2) {
      return t2 && this.toString() === t2.toString();
    }
    hasSameAttributesAsPiece(t2) {
      return t2 && (this.attributes === t2.attributes || this.attributes.isEqualTo(t2.attributes));
    }
    isBlockBreak() {
      return false;
    }
    isEqualTo(t2) {
      return super.isEqualTo(...arguments) || this.hasSameConstructorAs(t2) && this.hasSameStringValueAsPiece(t2) && this.hasSameAttributesAsPiece(t2);
    }
    isEmpty() {
      return 0 === this.length;
    }
    isSerializable() {
      return true;
    }
    toJSON() {
      return { type: this.constructor.type, attributes: this.getAttributes() };
    }
    contentsForInspection() {
      return { type: this.constructor.type, attributes: this.attributes.inspect() };
    }
    canBeGrouped() {
      return this.hasAttribute("href");
    }
    canBeGroupedWith(t2) {
      return this.getAttribute("href") === t2.getAttribute("href");
    }
    getLength() {
      return this.length;
    }
    canBeConsolidatedWith(t2) {
      return false;
    }
  };
  be(ve, "types", {});
  var Ae = class extends Qt {
    constructor(t2) {
      super(...arguments), this.url = t2;
    }
    perform(t2) {
      const e2 = new Image();
      e2.onload = () => (e2.width = this.width = e2.naturalWidth, e2.height = this.height = e2.naturalHeight, t2(true, e2)), e2.onerror = () => t2(false), e2.src = this.url;
    }
  };
  var xe = class extends tt {
    static attachmentForFile(t2) {
      const e2 = new this(this.attributesForFile(t2));
      return e2.setFile(t2), e2;
    }
    static attributesForFile(t2) {
      return new Vt({ filename: t2.name, filesize: t2.size, contentType: t2.type });
    }
    static fromJSON(t2) {
      return new this(t2);
    }
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      super(t2), this.releaseFile = this.releaseFile.bind(this), this.attributes = Vt.box(t2), this.didChangeAttributes();
    }
    getAttribute(t2) {
      return this.attributes.get(t2);
    }
    hasAttribute(t2) {
      return this.attributes.has(t2);
    }
    getAttributes() {
      return this.attributes.toObject();
    }
    setAttributes() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      const e2 = this.attributes.merge(t2);
      var i2, n2, r2, o2;
      if (!this.attributes.isEqualTo(e2))
        return this.attributes = e2, this.didChangeAttributes(), null === (i2 = this.previewDelegate) || void 0 === i2 || null === (n2 = i2.attachmentDidChangeAttributes) || void 0 === n2 || n2.call(i2, this), null === (r2 = this.delegate) || void 0 === r2 || null === (o2 = r2.attachmentDidChangeAttributes) || void 0 === o2 ? void 0 : o2.call(r2, this);
    }
    didChangeAttributes() {
      if (this.isPreviewable())
        return this.preloadURL();
    }
    isPending() {
      return null != this.file && !(this.getURL() || this.getHref());
    }
    isPreviewable() {
      return this.attributes.has("previewable") ? this.attributes.get("previewable") : xe.previewablePattern.test(this.getContentType());
    }
    getType() {
      return this.hasContent() ? "content" : this.isPreviewable() ? "preview" : "file";
    }
    getURL() {
      return this.attributes.get("url");
    }
    getHref() {
      return this.attributes.get("href");
    }
    getFilename() {
      return this.attributes.get("filename") || "";
    }
    getFilesize() {
      return this.attributes.get("filesize");
    }
    getFormattedFilesize() {
      const t2 = this.attributes.get("filesize");
      return "number" == typeof t2 ? l.formatter(t2) : "";
    }
    getExtension() {
      var t2;
      return null === (t2 = this.getFilename().match(/\.(\w+)$/)) || void 0 === t2 ? void 0 : t2[1].toLowerCase();
    }
    getContentType() {
      return this.attributes.get("contentType");
    }
    hasContent() {
      return this.attributes.has("content");
    }
    getContent() {
      return this.attributes.get("content");
    }
    getWidth() {
      return this.attributes.get("width");
    }
    getHeight() {
      return this.attributes.get("height");
    }
    getFile() {
      return this.file;
    }
    setFile(t2) {
      if (this.file = t2, this.isPreviewable())
        return this.preloadFile();
    }
    releaseFile() {
      this.releasePreloadedFile(), this.file = null;
    }
    getUploadProgress() {
      return null != this.uploadProgress ? this.uploadProgress : 0;
    }
    setUploadProgress(t2) {
      var e2, i2;
      if (this.uploadProgress !== t2)
        return this.uploadProgress = t2, null === (e2 = this.uploadProgressDelegate) || void 0 === e2 || null === (i2 = e2.attachmentDidChangeUploadProgress) || void 0 === i2 ? void 0 : i2.call(e2, this);
    }
    toJSON() {
      return this.getAttributes();
    }
    getCacheKey() {
      return [super.getCacheKey(...arguments), this.attributes.getCacheKey(), this.getPreviewURL()].join("/");
    }
    getPreviewURL() {
      return this.previewURL || this.preloadingURL;
    }
    setPreviewURL(t2) {
      var e2, i2, n2, r2;
      if (t2 !== this.getPreviewURL())
        return this.previewURL = t2, null === (e2 = this.previewDelegate) || void 0 === e2 || null === (i2 = e2.attachmentDidChangeAttributes) || void 0 === i2 || i2.call(e2, this), null === (n2 = this.delegate) || void 0 === n2 || null === (r2 = n2.attachmentDidChangePreviewURL) || void 0 === r2 ? void 0 : r2.call(n2, this);
    }
    preloadURL() {
      return this.preload(this.getURL(), this.releaseFile);
    }
    preloadFile() {
      if (this.file)
        return this.fileObjectURL = URL.createObjectURL(this.file), this.preload(this.fileObjectURL);
    }
    releasePreloadedFile() {
      this.fileObjectURL && (URL.revokeObjectURL(this.fileObjectURL), this.fileObjectURL = null);
    }
    preload(t2, e2) {
      if (t2 && t2 !== this.getPreviewURL()) {
        this.preloadingURL = t2;
        return new Ae(t2).then((i2) => {
          let { width: n2, height: r2 } = i2;
          return this.getWidth() && this.getHeight() || this.setAttributes({ width: n2, height: r2 }), this.preloadingURL = null, this.setPreviewURL(t2), null == e2 ? void 0 : e2();
        }).catch(() => (this.preloadingURL = null, null == e2 ? void 0 : e2()));
      }
    }
  };
  be(xe, "previewablePattern", /^image(\/(gif|png|jpe?g)|$)/);
  var ye = class extends ve {
    static fromJSON(t2) {
      return new this(xe.fromJSON(t2.attachment), t2.attributes);
    }
    constructor(t2) {
      super(...arguments), this.attachment = t2, this.length = 1, this.ensureAttachmentExclusivelyHasAttribute("href"), this.attachment.hasContent() || this.removeProhibitedAttributes();
    }
    ensureAttachmentExclusivelyHasAttribute(t2) {
      this.hasAttribute(t2) && (this.attachment.hasAttribute(t2) || this.attachment.setAttributes(this.attributes.slice([t2])), this.attributes = this.attributes.remove(t2));
    }
    removeProhibitedAttributes() {
      const t2 = this.attributes.slice(ye.permittedAttributes);
      t2.isEqualTo(this.attributes) || (this.attributes = t2);
    }
    getValue() {
      return this.attachment;
    }
    isSerializable() {
      return !this.attachment.isPending();
    }
    getCaption() {
      return this.attributes.get("caption") || "";
    }
    isEqualTo(t2) {
      var e2;
      return super.isEqualTo(t2) && this.attachment.id === (null == t2 || null === (e2 = t2.attachment) || void 0 === e2 ? void 0 : e2.id);
    }
    toString() {
      return "\uFFFC";
    }
    toJSON() {
      const t2 = super.toJSON(...arguments);
      return t2.attachment = this.attachment, t2;
    }
    getCacheKey() {
      return [super.getCacheKey(...arguments), this.attachment.getCacheKey()].join("/");
    }
    toConsole() {
      return JSON.stringify(this.toString());
    }
  };
  be(ye, "permittedAttributes", ["caption", "presentation"]), ve.registerType("attachment", ye);
  var Ce = class extends ve {
    static fromJSON(t2) {
      return new this(t2.string, t2.attributes);
    }
    constructor(t2) {
      super(...arguments), this.string = ((t3) => t3.replace(/\r\n/g, "\n"))(t2), this.length = this.string.length;
    }
    getValue() {
      return this.string;
    }
    toString() {
      return this.string.toString();
    }
    isBlockBreak() {
      return "\n" === this.toString() && true === this.getAttribute("blockBreak");
    }
    toJSON() {
      const t2 = super.toJSON(...arguments);
      return t2.string = this.string, t2;
    }
    canBeConsolidatedWith(t2) {
      return t2 && this.hasSameConstructorAs(t2) && this.hasSameAttributesAsPiece(t2);
    }
    consolidateWith(t2) {
      return new this.constructor(this.toString() + t2.toString(), this.attributes);
    }
    splitAtOffset(t2) {
      let e2, i2;
      return 0 === t2 ? (e2 = null, i2 = this) : t2 === this.length ? (e2 = this, i2 = null) : (e2 = new this.constructor(this.string.slice(0, t2), this.attributes), i2 = new this.constructor(this.string.slice(t2), this.attributes)), [e2, i2];
    }
    toConsole() {
      let { string: t2 } = this;
      return t2.length > 15 && (t2 = t2.slice(0, 14) + "\u2026"), JSON.stringify(t2.toString());
    }
  };
  ve.registerType("string", Ce);
  var Re = class extends tt {
    static box(t2) {
      return t2 instanceof this ? t2 : new this(t2);
    }
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      super(...arguments), this.objects = t2.slice(0), this.length = this.objects.length;
    }
    indexOf(t2) {
      return this.objects.indexOf(t2);
    }
    splice() {
      for (var t2 = arguments.length, e2 = new Array(t2), i2 = 0; i2 < t2; i2++)
        e2[i2] = arguments[i2];
      return new this.constructor(it(this.objects, ...e2));
    }
    eachObject(t2) {
      return this.objects.map((e2, i2) => t2(e2, i2));
    }
    insertObjectAtIndex(t2, e2) {
      return this.splice(e2, 0, t2);
    }
    insertSplittableListAtIndex(t2, e2) {
      return this.splice(e2, 0, ...t2.objects);
    }
    insertSplittableListAtPosition(t2, e2) {
      const [i2, n2] = this.splitObjectAtPosition(e2);
      return new this.constructor(i2).insertSplittableListAtIndex(t2, n2);
    }
    editObjectAtIndex(t2, e2) {
      return this.replaceObjectAtIndex(e2(this.objects[t2]), t2);
    }
    replaceObjectAtIndex(t2, e2) {
      return this.splice(e2, 1, t2);
    }
    removeObjectAtIndex(t2) {
      return this.splice(t2, 1);
    }
    getObjectAtIndex(t2) {
      return this.objects[t2];
    }
    getSplittableListInRange(t2) {
      const [e2, i2, n2] = this.splitObjectsAtRange(t2);
      return new this.constructor(e2.slice(i2, n2 + 1));
    }
    selectSplittableList(t2) {
      const e2 = this.objects.filter((e3) => t2(e3));
      return new this.constructor(e2);
    }
    removeObjectsInRange(t2) {
      const [e2, i2, n2] = this.splitObjectsAtRange(t2);
      return new this.constructor(e2).splice(i2, n2 - i2 + 1);
    }
    transformObjectsInRange(t2, e2) {
      const [i2, n2, r2] = this.splitObjectsAtRange(t2), o2 = i2.map((t3, i3) => n2 <= i3 && i3 <= r2 ? e2(t3) : t3);
      return new this.constructor(o2);
    }
    splitObjectsAtRange(t2) {
      let e2, [i2, n2, r2] = this.splitObjectAtPosition(Se(t2));
      return [i2, e2] = new this.constructor(i2).splitObjectAtPosition(ke(t2) + r2), [i2, n2, e2 - 1];
    }
    getObjectAtPosition(t2) {
      const { index: e2 } = this.findIndexAndOffsetAtPosition(t2);
      return this.objects[e2];
    }
    splitObjectAtPosition(t2) {
      let e2, i2;
      const { index: n2, offset: r2 } = this.findIndexAndOffsetAtPosition(t2), o2 = this.objects.slice(0);
      if (null != n2)
        if (0 === r2)
          e2 = n2, i2 = 0;
        else {
          const t3 = this.getObjectAtIndex(n2), [s2, a2] = t3.splitAtOffset(r2);
          o2.splice(n2, 1, s2, a2), e2 = n2 + 1, i2 = s2.getLength() - r2;
        }
      else
        e2 = o2.length, i2 = 0;
      return [o2, e2, i2];
    }
    consolidate() {
      const t2 = [];
      let e2 = this.objects[0];
      return this.objects.slice(1).forEach((i2) => {
        var n2, r2;
        null !== (n2 = (r2 = e2).canBeConsolidatedWith) && void 0 !== n2 && n2.call(r2, i2) ? e2 = e2.consolidateWith(i2) : (t2.push(e2), e2 = i2);
      }), e2 && t2.push(e2), new this.constructor(t2);
    }
    consolidateFromIndexToIndex(t2, e2) {
      const i2 = this.objects.slice(0).slice(t2, e2 + 1), n2 = new this.constructor(i2).consolidate().toArray();
      return this.splice(t2, i2.length, ...n2);
    }
    findIndexAndOffsetAtPosition(t2) {
      let e2, i2 = 0;
      for (e2 = 0; e2 < this.objects.length; e2++) {
        const n2 = i2 + this.objects[e2].getLength();
        if (i2 <= t2 && t2 < n2)
          return { index: e2, offset: t2 - i2 };
        i2 = n2;
      }
      return { index: null, offset: null };
    }
    findPositionAtIndexAndOffset(t2, e2) {
      let i2 = 0;
      for (let n2 = 0; n2 < this.objects.length; n2++) {
        const r2 = this.objects[n2];
        if (n2 < t2)
          i2 += r2.getLength();
        else if (n2 === t2) {
          i2 += e2;
          break;
        }
      }
      return i2;
    }
    getEndPosition() {
      return null == this.endPosition && (this.endPosition = 0, this.objects.forEach((t2) => this.endPosition += t2.getLength())), this.endPosition;
    }
    toString() {
      return this.objects.join("");
    }
    toArray() {
      return this.objects.slice(0);
    }
    toJSON() {
      return this.toArray();
    }
    isEqualTo(t2) {
      return super.isEqualTo(...arguments) || Ee(this.objects, null == t2 ? void 0 : t2.objects);
    }
    contentsForInspection() {
      return { objects: "[".concat(this.objects.map((t2) => t2.inspect()).join(", "), "]") };
    }
  };
  var Ee = function(t2) {
    let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [];
    if (t2.length !== e2.length)
      return false;
    let i2 = true;
    for (let n2 = 0; n2 < t2.length; n2++) {
      const r2 = t2[n2];
      i2 && !r2.isEqualTo(e2[n2]) && (i2 = false);
    }
    return i2;
  };
  var Se = (t2) => t2[0];
  var ke = (t2) => t2[1];
  var Le = class extends tt {
    static textForAttachmentWithAttributes(t2, e2) {
      return new this([new ye(t2, e2)]);
    }
    static textForStringWithAttributes(t2, e2) {
      return new this([new Ce(t2, e2)]);
    }
    static fromJSON(t2) {
      return new this(Array.from(t2).map((t3) => ve.fromJSON(t3)));
    }
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      super(...arguments);
      const e2 = t2.filter((t3) => !t3.isEmpty());
      this.pieceList = new Re(e2);
    }
    copy() {
      return this.copyWithPieceList(this.pieceList);
    }
    copyWithPieceList(t2) {
      return new this.constructor(t2.consolidate().toArray());
    }
    copyUsingObjectMap(t2) {
      const e2 = this.getPieces().map((e3) => t2.find(e3) || e3);
      return new this.constructor(e2);
    }
    appendText(t2) {
      return this.insertTextAtPosition(t2, this.getLength());
    }
    insertTextAtPosition(t2, e2) {
      return this.copyWithPieceList(this.pieceList.insertSplittableListAtPosition(t2.pieceList, e2));
    }
    removeTextAtRange(t2) {
      return this.copyWithPieceList(this.pieceList.removeObjectsInRange(t2));
    }
    replaceTextAtRange(t2, e2) {
      return this.removeTextAtRange(e2).insertTextAtPosition(t2, e2[0]);
    }
    moveTextFromRangeToPosition(t2, e2) {
      if (t2[0] <= e2 && e2 <= t2[1])
        return;
      const i2 = this.getTextAtRange(t2), n2 = i2.getLength();
      return t2[0] < e2 && (e2 -= n2), this.removeTextAtRange(t2).insertTextAtPosition(i2, e2);
    }
    addAttributeAtRange(t2, e2, i2) {
      const n2 = {};
      return n2[t2] = e2, this.addAttributesAtRange(n2, i2);
    }
    addAttributesAtRange(t2, e2) {
      return this.copyWithPieceList(this.pieceList.transformObjectsInRange(e2, (e3) => e3.copyWithAdditionalAttributes(t2)));
    }
    removeAttributeAtRange(t2, e2) {
      return this.copyWithPieceList(this.pieceList.transformObjectsInRange(e2, (e3) => e3.copyWithoutAttribute(t2)));
    }
    setAttributesAtRange(t2, e2) {
      return this.copyWithPieceList(this.pieceList.transformObjectsInRange(e2, (e3) => e3.copyWithAttributes(t2)));
    }
    getAttributesAtPosition(t2) {
      var e2;
      return (null === (e2 = this.pieceList.getObjectAtPosition(t2)) || void 0 === e2 ? void 0 : e2.getAttributes()) || {};
    }
    getCommonAttributes() {
      const t2 = Array.from(this.pieceList.toArray()).map((t3) => t3.getAttributes());
      return Vt.fromCommonAttributesOfObjects(t2).toObject();
    }
    getCommonAttributesAtRange(t2) {
      return this.getTextAtRange(t2).getCommonAttributes() || {};
    }
    getExpandedRangeForAttributeAtOffset(t2, e2) {
      let i2, n2 = i2 = e2;
      const r2 = this.getLength();
      for (; n2 > 0 && this.getCommonAttributesAtRange([n2 - 1, i2])[t2]; )
        n2--;
      for (; i2 < r2 && this.getCommonAttributesAtRange([e2, i2 + 1])[t2]; )
        i2++;
      return [n2, i2];
    }
    getTextAtRange(t2) {
      return this.copyWithPieceList(this.pieceList.getSplittableListInRange(t2));
    }
    getStringAtRange(t2) {
      return this.pieceList.getSplittableListInRange(t2).toString();
    }
    getStringAtPosition(t2) {
      return this.getStringAtRange([t2, t2 + 1]);
    }
    startsWithString(t2) {
      return this.getStringAtRange([0, t2.length]) === t2;
    }
    endsWithString(t2) {
      const e2 = this.getLength();
      return this.getStringAtRange([e2 - t2.length, e2]) === t2;
    }
    getAttachmentPieces() {
      return this.pieceList.toArray().filter((t2) => !!t2.attachment);
    }
    getAttachments() {
      return this.getAttachmentPieces().map((t2) => t2.attachment);
    }
    getAttachmentAndPositionById(t2) {
      let e2 = 0;
      for (const n2 of this.pieceList.toArray()) {
        var i2;
        if ((null === (i2 = n2.attachment) || void 0 === i2 ? void 0 : i2.id) === t2)
          return { attachment: n2.attachment, position: e2 };
        e2 += n2.length;
      }
      return { attachment: null, position: null };
    }
    getAttachmentById(t2) {
      const { attachment: e2 } = this.getAttachmentAndPositionById(t2);
      return e2;
    }
    getRangeOfAttachment(t2) {
      const e2 = this.getAttachmentAndPositionById(t2.id), i2 = e2.position;
      if (t2 = e2.attachment)
        return [i2, i2 + 1];
    }
    updateAttributesForAttachment(t2, e2) {
      const i2 = this.getRangeOfAttachment(e2);
      return i2 ? this.addAttributesAtRange(t2, i2) : this;
    }
    getLength() {
      return this.pieceList.getEndPosition();
    }
    isEmpty() {
      return 0 === this.getLength();
    }
    isEqualTo(t2) {
      var e2;
      return super.isEqualTo(t2) || (null == t2 || null === (e2 = t2.pieceList) || void 0 === e2 ? void 0 : e2.isEqualTo(this.pieceList));
    }
    isBlockBreak() {
      return 1 === this.getLength() && this.pieceList.getObjectAtIndex(0).isBlockBreak();
    }
    eachPiece(t2) {
      return this.pieceList.eachObject(t2);
    }
    getPieces() {
      return this.pieceList.toArray();
    }
    getPieceAtPosition(t2) {
      return this.pieceList.getObjectAtPosition(t2);
    }
    contentsForInspection() {
      return { pieceList: this.pieceList.inspect() };
    }
    toSerializableText() {
      const t2 = this.pieceList.selectSplittableList((t3) => t3.isSerializable());
      return this.copyWithPieceList(t2);
    }
    toString() {
      return this.pieceList.toString();
    }
    toJSON() {
      return this.pieceList.toJSON();
    }
    toConsole() {
      return JSON.stringify(this.pieceList.toArray().map((t2) => JSON.parse(t2.toConsole())));
    }
    getDirection() {
      return rt(this.toString());
    }
    isRTL() {
      return "rtl" === this.getDirection();
    }
  };
  var De = class extends tt {
    static fromJSON(t2) {
      return new this(Le.fromJSON(t2.text), t2.attributes);
    }
    constructor(t2, e2) {
      super(...arguments), this.text = we(t2 || new Le()), this.attributes = e2 || [];
    }
    isEmpty() {
      return this.text.isBlockBreak();
    }
    isEqualTo(t2) {
      return !!super.isEqualTo(t2) || this.text.isEqualTo(null == t2 ? void 0 : t2.text) && et(this.attributes, null == t2 ? void 0 : t2.attributes);
    }
    copyWithText(t2) {
      return new De(t2, this.attributes);
    }
    copyWithoutText() {
      return this.copyWithText(null);
    }
    copyWithAttributes(t2) {
      return new De(this.text, t2);
    }
    copyWithoutAttributes() {
      return this.copyWithAttributes(null);
    }
    copyUsingObjectMap(t2) {
      const e2 = t2.find(this.text);
      return e2 ? this.copyWithText(e2) : this.copyWithText(this.text.copyUsingObjectMap(t2));
    }
    addAttribute(t2) {
      const e2 = this.attributes.concat(Ne(t2));
      return this.copyWithAttributes(e2);
    }
    removeAttribute(t2) {
      const { listAttribute: e2 } = ht(t2), i2 = Me(Me(this.attributes, t2), e2);
      return this.copyWithAttributes(i2);
    }
    removeLastAttribute() {
      return this.removeAttribute(this.getLastAttribute());
    }
    getLastAttribute() {
      return Oe(this.attributes);
    }
    getAttributes() {
      return this.attributes.slice(0);
    }
    getAttributeLevel() {
      return this.attributes.length;
    }
    getAttributeAtLevel(t2) {
      return this.attributes[t2 - 1];
    }
    hasAttribute(t2) {
      return this.attributes.includes(t2);
    }
    hasAttributes() {
      return this.getAttributeLevel() > 0;
    }
    getLastNestableAttribute() {
      return Oe(this.getNestableAttributes());
    }
    getNestableAttributes() {
      return this.attributes.filter((t2) => ht(t2).nestable);
    }
    getNestingLevel() {
      return this.getNestableAttributes().length;
    }
    decreaseNestingLevel() {
      const t2 = this.getLastNestableAttribute();
      return t2 ? this.removeAttribute(t2) : this;
    }
    increaseNestingLevel() {
      const t2 = this.getLastNestableAttribute();
      if (t2) {
        const e2 = this.attributes.lastIndexOf(t2), i2 = it(this.attributes, e2 + 1, 0, ...Ne(t2));
        return this.copyWithAttributes(i2);
      }
      return this;
    }
    getListItemAttributes() {
      return this.attributes.filter((t2) => ht(t2).listAttribute);
    }
    isListItem() {
      var t2;
      return null === (t2 = ht(this.getLastAttribute())) || void 0 === t2 ? void 0 : t2.listAttribute;
    }
    isTerminalBlock() {
      var t2;
      return null === (t2 = ht(this.getLastAttribute())) || void 0 === t2 ? void 0 : t2.terminal;
    }
    breaksOnReturn() {
      var t2;
      return null === (t2 = ht(this.getLastAttribute())) || void 0 === t2 ? void 0 : t2.breakOnReturn;
    }
    findLineBreakInDirectionFromPosition(t2, e2) {
      const i2 = this.toString();
      let n2;
      switch (t2) {
        case "forward":
          n2 = i2.indexOf("\n", e2);
          break;
        case "backward":
          n2 = i2.slice(0, e2).lastIndexOf("\n");
      }
      if (-1 !== n2)
        return n2;
    }
    contentsForInspection() {
      return { text: this.text.inspect(), attributes: this.attributes };
    }
    toString() {
      return this.text.toString();
    }
    toJSON() {
      return { text: this.text, attributes: this.attributes };
    }
    getDirection() {
      return this.text.getDirection();
    }
    isRTL() {
      return this.text.isRTL();
    }
    getLength() {
      return this.text.getLength();
    }
    canBeConsolidatedWith(t2) {
      return !this.hasAttributes() && !t2.hasAttributes() && this.getDirection() === t2.getDirection();
    }
    consolidateWith(t2) {
      const e2 = Le.textForStringWithAttributes("\n"), i2 = this.getTextWithoutBlockBreak().appendText(e2);
      return this.copyWithText(i2.appendText(t2.text));
    }
    splitAtOffset(t2) {
      let e2, i2;
      return 0 === t2 ? (e2 = null, i2 = this) : t2 === this.getLength() ? (e2 = this, i2 = null) : (e2 = this.copyWithText(this.text.getTextAtRange([0, t2])), i2 = this.copyWithText(this.text.getTextAtRange([t2, this.getLength()]))), [e2, i2];
    }
    getBlockBreakPosition() {
      return this.text.getLength() - 1;
    }
    getTextWithoutBlockBreak() {
      return Ie(this.text) ? this.text.getTextAtRange([0, this.getBlockBreakPosition()]) : this.text.copy();
    }
    canBeGrouped(t2) {
      return this.attributes[t2];
    }
    canBeGroupedWith(t2, i2) {
      const n2 = t2.getAttributes(), r2 = n2[i2], o2 = this.attributes[i2];
      return o2 === r2 && !(false === ht(o2).group && !(() => {
        if (!lt) {
          lt = [];
          for (const t3 in e) {
            const { listAttribute: i3 } = e[t3];
            null != i3 && lt.push(i3);
          }
        }
        return lt;
      })().includes(n2[i2 + 1])) && (this.getDirection() === t2.getDirection() || t2.isEmpty());
    }
  };
  var we = function(t2) {
    return t2 = Te(t2), t2 = Be(t2);
  };
  var Te = function(t2) {
    let e2 = false;
    const i2 = t2.getPieces();
    let n2 = i2.slice(0, i2.length - 1);
    const r2 = i2[i2.length - 1];
    return r2 ? (n2 = n2.map((t3) => t3.isBlockBreak() ? (e2 = true, Pe(t3)) : t3), e2 ? new Le([...n2, r2]) : t2) : t2;
  };
  var Fe = Le.textForStringWithAttributes("\n", { blockBreak: true });
  var Be = function(t2) {
    return Ie(t2) ? t2 : t2.appendText(Fe);
  };
  var Ie = function(t2) {
    const e2 = t2.getLength();
    if (0 === e2)
      return false;
    return t2.getTextAtRange([e2 - 1, e2]).isBlockBreak();
  };
  var Pe = (t2) => t2.copyWithoutAttribute("blockBreak");
  var Ne = function(t2) {
    const { listAttribute: e2 } = ht(t2);
    return e2 ? [e2, t2] : [t2];
  };
  var Oe = (t2) => t2.slice(-1)[0];
  var Me = function(t2, e2) {
    const i2 = t2.lastIndexOf(e2);
    return -1 === i2 ? t2 : it(t2, i2, 1);
  };
  var je = class extends tt {
    static fromJSON(t2) {
      return new this(Array.from(t2).map((t3) => De.fromJSON(t3)));
    }
    static fromString(t2, e2) {
      const i2 = Le.textForStringWithAttributes(t2, e2);
      return new this([new De(i2)]);
    }
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      super(...arguments), 0 === t2.length && (t2 = [new De()]), this.blockList = Re.box(t2);
    }
    isEmpty() {
      const t2 = this.getBlockAtIndex(0);
      return 1 === this.blockList.length && t2.isEmpty() && !t2.hasAttributes();
    }
    copy() {
      const t2 = (arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}).consolidateBlocks ? this.blockList.consolidate().toArray() : this.blockList.toArray();
      return new this.constructor(t2);
    }
    copyUsingObjectsFromDocument(t2) {
      const e2 = new $t(t2.getObjects());
      return this.copyUsingObjectMap(e2);
    }
    copyUsingObjectMap(t2) {
      const e2 = this.getBlocks().map((e3) => t2.find(e3) || e3.copyUsingObjectMap(t2));
      return new this.constructor(e2);
    }
    copyWithBaseBlockAttributes() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      const e2 = this.getBlocks().map((e3) => {
        const i2 = t2.concat(e3.getAttributes());
        return e3.copyWithAttributes(i2);
      });
      return new this.constructor(e2);
    }
    replaceBlock(t2, e2) {
      const i2 = this.blockList.indexOf(t2);
      return -1 === i2 ? this : new this.constructor(this.blockList.replaceObjectAtIndex(e2, i2));
    }
    insertDocumentAtRange(t2, e2) {
      const { blockList: i2 } = t2;
      e2 = Et(e2);
      let [n2] = e2;
      const { index: r2, offset: o2 } = this.locationFromPosition(n2);
      let s2 = this;
      const a2 = this.getBlockAtPosition(n2);
      return St(e2) && a2.isEmpty() && !a2.hasAttributes() ? s2 = new this.constructor(s2.blockList.removeObjectAtIndex(r2)) : a2.getBlockBreakPosition() === o2 && n2++, s2 = s2.removeTextAtRange(e2), new this.constructor(s2.blockList.insertSplittableListAtPosition(i2, n2));
    }
    mergeDocumentAtRange(t2, e2) {
      let i2, n2;
      e2 = Et(e2);
      const [r2] = e2, o2 = this.locationFromPosition(r2), s2 = this.getBlockAtIndex(o2.index).getAttributes(), a2 = t2.getBaseBlockAttributes(), l2 = s2.slice(-a2.length);
      if (et(a2, l2)) {
        const e3 = s2.slice(0, -a2.length);
        i2 = t2.copyWithBaseBlockAttributes(e3);
      } else
        i2 = t2.copy({ consolidateBlocks: true }).copyWithBaseBlockAttributes(s2);
      const c2 = i2.getBlockCount(), h2 = i2.getBlockAtIndex(0);
      if (et(s2, h2.getAttributes())) {
        const t3 = h2.getTextWithoutBlockBreak();
        if (n2 = this.insertTextAtRange(t3, e2), c2 > 1) {
          i2 = new this.constructor(i2.getBlocks().slice(1));
          const e3 = r2 + t3.getLength();
          n2 = n2.insertDocumentAtRange(i2, e3);
        }
      } else
        n2 = this.insertDocumentAtRange(i2, e2);
      return n2;
    }
    insertTextAtRange(t2, e2) {
      e2 = Et(e2);
      const [i2] = e2, { index: n2, offset: r2 } = this.locationFromPosition(i2), o2 = this.removeTextAtRange(e2);
      return new this.constructor(o2.blockList.editObjectAtIndex(n2, (e3) => e3.copyWithText(e3.text.insertTextAtPosition(t2, r2))));
    }
    removeTextAtRange(t2) {
      let e2;
      t2 = Et(t2);
      const [i2, n2] = t2;
      if (St(t2))
        return this;
      const [r2, o2] = Array.from(this.locationRangeFromRange(t2)), s2 = r2.index, a2 = r2.offset, l2 = this.getBlockAtIndex(s2), c2 = o2.index, h2 = o2.offset, u2 = this.getBlockAtIndex(c2);
      if (n2 - i2 == 1 && l2.getBlockBreakPosition() === a2 && u2.getBlockBreakPosition() !== h2 && "\n" === u2.text.getStringAtPosition(h2))
        e2 = this.blockList.editObjectAtIndex(c2, (t3) => t3.copyWithText(t3.text.removeTextAtRange([h2, h2 + 1])));
      else {
        let t3;
        const i3 = l2.text.getTextAtRange([0, a2]), n3 = u2.text.getTextAtRange([h2, u2.getLength()]), r3 = i3.appendText(n3);
        t3 = s2 !== c2 && 0 === a2 && l2.getAttributeLevel() >= u2.getAttributeLevel() ? u2.copyWithText(r3) : l2.copyWithText(r3);
        const o3 = c2 + 1 - s2;
        e2 = this.blockList.splice(s2, o3, t3);
      }
      return new this.constructor(e2);
    }
    moveTextFromRangeToPosition(t2, e2) {
      let i2;
      t2 = Et(t2);
      const [n2, r2] = t2;
      if (n2 <= e2 && e2 <= r2)
        return this;
      let o2 = this.getDocumentAtRange(t2), s2 = this.removeTextAtRange(t2);
      const a2 = n2 < e2;
      a2 && (e2 -= o2.getLength());
      const [l2, ...c2] = o2.getBlocks();
      return 0 === c2.length ? (i2 = l2.getTextWithoutBlockBreak(), a2 && (e2 += 1)) : i2 = l2.text, s2 = s2.insertTextAtRange(i2, e2), 0 === c2.length ? s2 : (o2 = new this.constructor(c2), e2 += i2.getLength(), s2.insertDocumentAtRange(o2, e2));
    }
    addAttributeAtRange(t2, e2, i2) {
      let { blockList: n2 } = this;
      return this.eachBlockAtRange(i2, (i3, r2, o2) => n2 = n2.editObjectAtIndex(o2, function() {
        return ht(t2) ? i3.addAttribute(t2, e2) : r2[0] === r2[1] ? i3 : i3.copyWithText(i3.text.addAttributeAtRange(t2, e2, r2));
      })), new this.constructor(n2);
    }
    addAttribute(t2, e2) {
      let { blockList: i2 } = this;
      return this.eachBlock((n2, r2) => i2 = i2.editObjectAtIndex(r2, () => n2.addAttribute(t2, e2))), new this.constructor(i2);
    }
    removeAttributeAtRange(t2, e2) {
      let { blockList: i2 } = this;
      return this.eachBlockAtRange(e2, function(e3, n2, r2) {
        ht(t2) ? i2 = i2.editObjectAtIndex(r2, () => e3.removeAttribute(t2)) : n2[0] !== n2[1] && (i2 = i2.editObjectAtIndex(r2, () => e3.copyWithText(e3.text.removeAttributeAtRange(t2, n2))));
      }), new this.constructor(i2);
    }
    updateAttributesForAttachment(t2, e2) {
      const i2 = this.getRangeOfAttachment(e2), [n2] = Array.from(i2), { index: r2 } = this.locationFromPosition(n2), o2 = this.getTextAtIndex(r2);
      return new this.constructor(this.blockList.editObjectAtIndex(r2, (i3) => i3.copyWithText(o2.updateAttributesForAttachment(t2, e2))));
    }
    removeAttributeForAttachment(t2, e2) {
      const i2 = this.getRangeOfAttachment(e2);
      return this.removeAttributeAtRange(t2, i2);
    }
    insertBlockBreakAtRange(t2) {
      let e2;
      t2 = Et(t2);
      const [i2] = t2, { offset: n2 } = this.locationFromPosition(i2), r2 = this.removeTextAtRange(t2);
      return 0 === n2 && (e2 = [new De()]), new this.constructor(r2.blockList.insertSplittableListAtPosition(new Re(e2), i2));
    }
    applyBlockAttributeAtRange(t2, e2, i2) {
      const n2 = this.expandRangeToLineBreaksAndSplitBlocks(i2);
      let r2 = n2.document;
      i2 = n2.range;
      const o2 = ht(t2);
      if (o2.listAttribute) {
        r2 = r2.removeLastListAttributeAtRange(i2, { exceptAttributeName: t2 });
        const e3 = r2.convertLineBreaksToBlockBreaksInRange(i2);
        r2 = e3.document, i2 = e3.range;
      } else
        r2 = o2.exclusive ? r2.removeBlockAttributesAtRange(i2) : o2.terminal ? r2.removeLastTerminalAttributeAtRange(i2) : r2.consolidateBlocksAtRange(i2);
      return r2.addAttributeAtRange(t2, e2, i2);
    }
    removeLastListAttributeAtRange(t2) {
      let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, { blockList: i2 } = this;
      return this.eachBlockAtRange(t2, function(t3, n2, r2) {
        const o2 = t3.getLastAttribute();
        o2 && ht(o2).listAttribute && o2 !== e2.exceptAttributeName && (i2 = i2.editObjectAtIndex(r2, () => t3.removeAttribute(o2)));
      }), new this.constructor(i2);
    }
    removeLastTerminalAttributeAtRange(t2) {
      let { blockList: e2 } = this;
      return this.eachBlockAtRange(t2, function(t3, i2, n2) {
        const r2 = t3.getLastAttribute();
        r2 && ht(r2).terminal && (e2 = e2.editObjectAtIndex(n2, () => t3.removeAttribute(r2)));
      }), new this.constructor(e2);
    }
    removeBlockAttributesAtRange(t2) {
      let { blockList: e2 } = this;
      return this.eachBlockAtRange(t2, function(t3, i2, n2) {
        t3.hasAttributes() && (e2 = e2.editObjectAtIndex(n2, () => t3.copyWithoutAttributes()));
      }), new this.constructor(e2);
    }
    expandRangeToLineBreaksAndSplitBlocks(t2) {
      let e2;
      t2 = Et(t2);
      let [i2, n2] = t2;
      const r2 = this.locationFromPosition(i2), o2 = this.locationFromPosition(n2);
      let s2 = this;
      const a2 = s2.getBlockAtIndex(r2.index);
      if (r2.offset = a2.findLineBreakInDirectionFromPosition("backward", r2.offset), null != r2.offset && (e2 = s2.positionFromLocation(r2), s2 = s2.insertBlockBreakAtRange([e2, e2 + 1]), o2.index += 1, o2.offset -= s2.getBlockAtIndex(r2.index).getLength(), r2.index += 1), r2.offset = 0, 0 === o2.offset && o2.index > r2.index)
        o2.index -= 1, o2.offset = s2.getBlockAtIndex(o2.index).getBlockBreakPosition();
      else {
        const t3 = s2.getBlockAtIndex(o2.index);
        "\n" === t3.text.getStringAtRange([o2.offset - 1, o2.offset]) ? o2.offset -= 1 : o2.offset = t3.findLineBreakInDirectionFromPosition("forward", o2.offset), o2.offset !== t3.getBlockBreakPosition() && (e2 = s2.positionFromLocation(o2), s2 = s2.insertBlockBreakAtRange([e2, e2 + 1]));
      }
      return i2 = s2.positionFromLocation(r2), n2 = s2.positionFromLocation(o2), { document: s2, range: t2 = Et([i2, n2]) };
    }
    convertLineBreaksToBlockBreaksInRange(t2) {
      t2 = Et(t2);
      let [e2] = t2;
      const i2 = this.getStringAtRange(t2).slice(0, -1);
      let n2 = this;
      return i2.replace(/.*?\n/g, function(t3) {
        e2 += t3.length, n2 = n2.insertBlockBreakAtRange([e2 - 1, e2]);
      }), { document: n2, range: t2 };
    }
    consolidateBlocksAtRange(t2) {
      t2 = Et(t2);
      const [e2, i2] = t2, n2 = this.locationFromPosition(e2).index, r2 = this.locationFromPosition(i2).index;
      return new this.constructor(this.blockList.consolidateFromIndexToIndex(n2, r2));
    }
    getDocumentAtRange(t2) {
      t2 = Et(t2);
      const e2 = this.blockList.getSplittableListInRange(t2).toArray();
      return new this.constructor(e2);
    }
    getStringAtRange(t2) {
      let e2;
      const i2 = t2 = Et(t2);
      return i2[i2.length - 1] !== this.getLength() && (e2 = -1), this.getDocumentAtRange(t2).toString().slice(0, e2);
    }
    getBlockAtIndex(t2) {
      return this.blockList.getObjectAtIndex(t2);
    }
    getBlockAtPosition(t2) {
      const { index: e2 } = this.locationFromPosition(t2);
      return this.getBlockAtIndex(e2);
    }
    getTextAtIndex(t2) {
      var e2;
      return null === (e2 = this.getBlockAtIndex(t2)) || void 0 === e2 ? void 0 : e2.text;
    }
    getTextAtPosition(t2) {
      const { index: e2 } = this.locationFromPosition(t2);
      return this.getTextAtIndex(e2);
    }
    getPieceAtPosition(t2) {
      const { index: e2, offset: i2 } = this.locationFromPosition(t2);
      return this.getTextAtIndex(e2).getPieceAtPosition(i2);
    }
    getCharacterAtPosition(t2) {
      const { index: e2, offset: i2 } = this.locationFromPosition(t2);
      return this.getTextAtIndex(e2).getStringAtRange([i2, i2 + 1]);
    }
    getLength() {
      return this.blockList.getEndPosition();
    }
    getBlocks() {
      return this.blockList.toArray();
    }
    getBlockCount() {
      return this.blockList.length;
    }
    getEditCount() {
      return this.editCount;
    }
    eachBlock(t2) {
      return this.blockList.eachObject(t2);
    }
    eachBlockAtRange(t2, e2) {
      let i2, n2;
      t2 = Et(t2);
      const [r2, o2] = t2, s2 = this.locationFromPosition(r2), a2 = this.locationFromPosition(o2);
      if (s2.index === a2.index)
        return i2 = this.getBlockAtIndex(s2.index), n2 = [s2.offset, a2.offset], e2(i2, n2, s2.index);
      for (let t3 = s2.index; t3 <= a2.index; t3++)
        if (i2 = this.getBlockAtIndex(t3), i2) {
          switch (t3) {
            case s2.index:
              n2 = [s2.offset, i2.text.getLength()];
              break;
            case a2.index:
              n2 = [0, a2.offset];
              break;
            default:
              n2 = [0, i2.text.getLength()];
          }
          e2(i2, n2, t3);
        }
    }
    getCommonAttributesAtRange(t2) {
      t2 = Et(t2);
      const [e2] = t2;
      if (St(t2))
        return this.getCommonAttributesAtPosition(e2);
      {
        const e3 = [], i2 = [];
        return this.eachBlockAtRange(t2, function(t3, n2) {
          if (n2[0] !== n2[1])
            return e3.push(t3.text.getCommonAttributesAtRange(n2)), i2.push(We(t3));
        }), Vt.fromCommonAttributesOfObjects(e3).merge(Vt.fromCommonAttributesOfObjects(i2)).toObject();
      }
    }
    getCommonAttributesAtPosition(t2) {
      let e2, i2;
      const { index: n2, offset: r2 } = this.locationFromPosition(t2), o2 = this.getBlockAtIndex(n2);
      if (!o2)
        return {};
      const s2 = We(o2), a2 = o2.text.getAttributesAtPosition(r2), l2 = o2.text.getAttributesAtPosition(r2 - 1), c2 = Object.keys(O).filter((t3) => O[t3].inheritable);
      for (e2 in l2)
        i2 = l2[e2], (i2 === a2[e2] || c2.includes(e2)) && (s2[e2] = i2);
      return s2;
    }
    getRangeOfCommonAttributeAtPosition(t2, e2) {
      const { index: i2, offset: n2 } = this.locationFromPosition(e2), r2 = this.getTextAtIndex(i2), [o2, s2] = Array.from(r2.getExpandedRangeForAttributeAtOffset(t2, n2)), a2 = this.positionFromLocation({ index: i2, offset: o2 }), l2 = this.positionFromLocation({ index: i2, offset: s2 });
      return Et([a2, l2]);
    }
    getBaseBlockAttributes() {
      let t2 = this.getBlockAtIndex(0).getAttributes();
      for (let e2 = 1; e2 < this.getBlockCount(); e2++) {
        const i2 = this.getBlockAtIndex(e2).getAttributes(), n2 = Math.min(t2.length, i2.length);
        t2 = (() => {
          const e3 = [];
          for (let r2 = 0; r2 < n2 && i2[r2] === t2[r2]; r2++)
            e3.push(i2[r2]);
          return e3;
        })();
      }
      return t2;
    }
    getAttachmentById(t2) {
      for (const e2 of this.getAttachments())
        if (e2.id === t2)
          return e2;
    }
    getAttachmentPieces() {
      let t2 = [];
      return this.blockList.eachObject((e2) => {
        let { text: i2 } = e2;
        return t2 = t2.concat(i2.getAttachmentPieces());
      }), t2;
    }
    getAttachments() {
      return this.getAttachmentPieces().map((t2) => t2.attachment);
    }
    getRangeOfAttachment(t2) {
      let e2 = 0;
      const i2 = this.blockList.toArray();
      for (let n2 = 0; n2 < i2.length; n2++) {
        const { text: r2 } = i2[n2], o2 = r2.getRangeOfAttachment(t2);
        if (o2)
          return Et([e2 + o2[0], e2 + o2[1]]);
        e2 += r2.getLength();
      }
    }
    getLocationRangeOfAttachment(t2) {
      const e2 = this.getRangeOfAttachment(t2);
      return this.locationRangeFromRange(e2);
    }
    getAttachmentPieceForAttachment(t2) {
      for (const e2 of this.getAttachmentPieces())
        if (e2.attachment === t2)
          return e2;
    }
    findRangesForBlockAttribute(t2) {
      let e2 = 0;
      const i2 = [];
      return this.getBlocks().forEach((n2) => {
        const r2 = n2.getLength();
        n2.hasAttribute(t2) && i2.push([e2, e2 + r2]), e2 += r2;
      }), i2;
    }
    findRangesForTextAttribute(t2) {
      let { withValue: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, i2 = 0, n2 = [];
      const r2 = [];
      return this.getPieces().forEach((o2) => {
        const s2 = o2.getLength();
        (function(i3) {
          return e2 ? i3.getAttribute(t2) === e2 : i3.hasAttribute(t2);
        })(o2) && (n2[1] === i2 ? n2[1] = i2 + s2 : r2.push(n2 = [i2, i2 + s2])), i2 += s2;
      }), r2;
    }
    locationFromPosition(t2) {
      const e2 = this.blockList.findIndexAndOffsetAtPosition(Math.max(0, t2));
      if (null != e2.index)
        return e2;
      {
        const t3 = this.getBlocks();
        return { index: t3.length - 1, offset: t3[t3.length - 1].getLength() };
      }
    }
    positionFromLocation(t2) {
      return this.blockList.findPositionAtIndexAndOffset(t2.index, t2.offset);
    }
    locationRangeFromPosition(t2) {
      return Et(this.locationFromPosition(t2));
    }
    locationRangeFromRange(t2) {
      if (!(t2 = Et(t2)))
        return;
      const [e2, i2] = Array.from(t2), n2 = this.locationFromPosition(e2), r2 = this.locationFromPosition(i2);
      return Et([n2, r2]);
    }
    rangeFromLocationRange(t2) {
      let e2;
      t2 = Et(t2);
      const i2 = this.positionFromLocation(t2[0]);
      return St(t2) || (e2 = this.positionFromLocation(t2[1])), Et([i2, e2]);
    }
    isEqualTo(t2) {
      return this.blockList.isEqualTo(null == t2 ? void 0 : t2.blockList);
    }
    getTexts() {
      return this.getBlocks().map((t2) => t2.text);
    }
    getPieces() {
      const t2 = [];
      return Array.from(this.getTexts()).forEach((e2) => {
        t2.push(...Array.from(e2.getPieces() || []));
      }), t2;
    }
    getObjects() {
      return this.getBlocks().concat(this.getTexts()).concat(this.getPieces());
    }
    toSerializableDocument() {
      const t2 = [];
      return this.blockList.eachObject((e2) => t2.push(e2.copyWithText(e2.text.toSerializableText()))), new this.constructor(t2);
    }
    toString() {
      return this.blockList.toString();
    }
    toJSON() {
      return this.blockList.toJSON();
    }
    toConsole() {
      return JSON.stringify(this.blockList.toArray()).map((t2) => JSON.parse(t2.text.toConsole()));
    }
  };
  var We = function(t2) {
    const e2 = {}, i2 = t2.getLastAttribute();
    return i2 && (e2[i2] = true), e2;
  };
  var Ue = "style href src width height class".split(" ");
  var qe = "javascript:".split(" ");
  var Ve = "script iframe".split(" ");
  var ze = class extends U {
    static sanitize(t2, e2) {
      const i2 = new this(t2, e2);
      return i2.sanitize(), i2;
    }
    constructor(t2) {
      let { allowedAttributes: e2, forbiddenProtocols: i2, forbiddenElements: n2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      super(...arguments), this.allowedAttributes = e2 || Ue, this.forbiddenProtocols = i2 || qe, this.forbiddenElements = n2 || Ve, this.body = _e(t2);
    }
    sanitize() {
      return this.sanitizeElements(), this.normalizeListElementNesting();
    }
    getHTML() {
      return this.body.innerHTML;
    }
    getBody() {
      return this.body;
    }
    sanitizeElements() {
      const t2 = x(this.body), e2 = [];
      for (; t2.nextNode(); ) {
        const i2 = t2.currentNode;
        switch (i2.nodeType) {
          case Node.ELEMENT_NODE:
            this.elementIsRemovable(i2) ? e2.push(i2) : this.sanitizeElement(i2);
            break;
          case Node.COMMENT_NODE:
            e2.push(i2);
        }
      }
      return e2.forEach((t3) => A(t3)), this.body;
    }
    sanitizeElement(t2) {
      return t2.hasAttribute("href") && this.forbiddenProtocols.includes(t2.protocol) && t2.removeAttribute("href"), Array.from(t2.attributes).forEach((e2) => {
        let { name: i2 } = e2;
        this.allowedAttributes.includes(i2) || 0 === i2.indexOf("data-trix") || t2.removeAttribute(i2);
      }), t2;
    }
    normalizeListElementNesting() {
      return Array.from(this.body.querySelectorAll("ul,ol")).forEach((t2) => {
        const e2 = t2.previousElementSibling;
        e2 && "li" === y(e2) && e2.appendChild(t2);
      }), this.body;
    }
    elementIsRemovable(t2) {
      if ((null == t2 ? void 0 : t2.nodeType) === Node.ELEMENT_NODE)
        return this.elementIsForbidden(t2) || this.elementIsntSerializable(t2);
    }
    elementIsForbidden(t2) {
      return this.forbiddenElements.includes(y(t2));
    }
    elementIsntSerializable(t2) {
      return "false" === t2.getAttribute("data-trix-serialize") && !F(t2);
    }
  };
  var _e = function() {
    let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "";
    t2 = t2.replace(/<\/html[^>]*>[^]*$/i, "</html>");
    const e2 = document.implementation.createHTMLDocument("");
    return e2.documentElement.innerHTML = t2, Array.from(e2.head.querySelectorAll("style")).forEach((t3) => {
      e2.body.appendChild(t3);
    }), e2.body;
  };
  var He = function(t2) {
    let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    const i2 = "string";
    return { string: t2 = Mt(t2), attributes: e2, type: i2 };
  };
  var Je = (t2, e2) => {
    try {
      return JSON.parse(t2.getAttribute("data-trix-".concat(e2)));
    } catch (t3) {
      return {};
    }
  };
  var Ke = class extends U {
    static parse(t2, e2) {
      const i2 = new this(t2, e2);
      return i2.parse(), i2;
    }
    constructor(t2) {
      let { referenceElement: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      super(...arguments), this.html = t2, this.referenceElement = e2, this.blocks = [], this.blockElements = [], this.processedElements = [];
    }
    getDocument() {
      return je.fromJSON(this.blocks);
    }
    parse() {
      try {
        this.createHiddenContainer();
        const t2 = ze.sanitize(this.html).getHTML();
        this.containerElement.innerHTML = t2;
        const e2 = x(this.containerElement, { usingFilter: Ye });
        for (; e2.nextNode(); )
          this.processNode(e2.currentNode);
        return this.translateBlockElementMarginsToNewlines();
      } finally {
        this.removeHiddenContainer();
      }
    }
    createHiddenContainer() {
      return this.referenceElement ? (this.containerElement = this.referenceElement.cloneNode(false), this.containerElement.removeAttribute("id"), this.containerElement.setAttribute("data-trix-internal", ""), this.containerElement.style.display = "none", this.referenceElement.parentNode.insertBefore(this.containerElement, this.referenceElement.nextSibling)) : (this.containerElement = C({ tagName: "div", style: { display: "none" } }), document.body.appendChild(this.containerElement));
    }
    removeHiddenContainer() {
      return A(this.containerElement);
    }
    processNode(t2) {
      switch (t2.nodeType) {
        case Node.TEXT_NODE:
          if (!this.isInsignificantTextNode(t2))
            return this.appendBlockForTextNode(t2), this.processTextNode(t2);
          break;
        case Node.ELEMENT_NODE:
          return this.appendBlockForElement(t2), this.processElement(t2);
      }
    }
    appendBlockForTextNode(t2) {
      const e2 = t2.parentNode;
      if (e2 === this.currentBlockElement && this.isBlockElement(t2.previousSibling))
        return this.appendStringWithAttributes("\n");
      if (e2 === this.containerElement || this.isBlockElement(e2)) {
        var i2;
        const t3 = this.getBlockAttributes(e2);
        et(t3, null === (i2 = this.currentBlock) || void 0 === i2 ? void 0 : i2.attributes) || (this.currentBlock = this.appendBlockForAttributesWithElement(t3, e2), this.currentBlockElement = e2);
      }
    }
    appendBlockForElement(t2) {
      const e2 = this.isBlockElement(t2), i2 = b(this.currentBlockElement, t2);
      if (e2 && !this.isBlockElement(t2.firstChild)) {
        if (!this.isInsignificantTextNode(t2.firstChild) || !this.isBlockElement(t2.firstElementChild)) {
          const e3 = this.getBlockAttributes(t2);
          if (t2.firstChild) {
            if (i2 && et(e3, this.currentBlock.attributes))
              return this.appendStringWithAttributes("\n");
            this.currentBlock = this.appendBlockForAttributesWithElement(e3, t2), this.currentBlockElement = t2;
          }
        }
      } else if (this.currentBlockElement && !i2 && !e2) {
        const e3 = this.findParentBlockElement(t2);
        if (e3)
          return this.appendBlockForElement(e3);
        this.currentBlock = this.appendEmptyBlock(), this.currentBlockElement = null;
      }
    }
    findParentBlockElement(t2) {
      let { parentElement: e2 } = t2;
      for (; e2 && e2 !== this.containerElement; ) {
        if (this.isBlockElement(e2) && this.blockElements.includes(e2))
          return e2;
        e2 = e2.parentElement;
      }
      return null;
    }
    processTextNode(t2) {
      let e2 = t2.data;
      var i2;
      Ge(t2.parentNode) || (e2 = Wt(e2), ti(null === (i2 = t2.previousSibling) || void 0 === i2 ? void 0 : i2.textContent) && (e2 = Qe(e2)));
      return this.appendStringWithAttributes(e2, this.getTextAttributes(t2.parentNode));
    }
    processElement(t2) {
      let e2;
      if (F(t2)) {
        if (e2 = Je(t2, "attachment"), Object.keys(e2).length) {
          const i2 = this.getTextAttributes(t2);
          this.appendAttachmentWithAttributes(e2, i2), t2.innerHTML = "";
        }
        return this.processedElements.push(t2);
      }
      switch (y(t2)) {
        case "br":
          return this.isExtraBR(t2) || this.isBlockElement(t2.nextSibling) || this.appendStringWithAttributes("\n", this.getTextAttributes(t2)), this.processedElements.push(t2);
        case "img":
          e2 = { url: t2.getAttribute("src"), contentType: "image" };
          const i2 = ((t3) => {
            const e3 = t3.getAttribute("width"), i3 = t3.getAttribute("height"), n2 = {};
            return e3 && (n2.width = parseInt(e3, 10)), i3 && (n2.height = parseInt(i3, 10)), n2;
          })(t2);
          for (const t3 in i2) {
            const n2 = i2[t3];
            e2[t3] = n2;
          }
          return this.appendAttachmentWithAttributes(e2, this.getTextAttributes(t2)), this.processedElements.push(t2);
        case "tr":
          if (this.needsTableSeparator(t2))
            return this.appendStringWithAttributes(N.tableRowSeparator);
          break;
        case "td":
          if (this.needsTableSeparator(t2))
            return this.appendStringWithAttributes(N.tableCellSeparator);
      }
    }
    appendBlockForAttributesWithElement(t2, e2) {
      this.blockElements.push(e2);
      const i2 = function() {
        return { text: [], attributes: arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {} };
      }(t2);
      return this.blocks.push(i2), i2;
    }
    appendEmptyBlock() {
      return this.appendBlockForAttributesWithElement([], null);
    }
    appendStringWithAttributes(t2, e2) {
      return this.appendPiece(He(t2, e2));
    }
    appendAttachmentWithAttributes(t2, e2) {
      return this.appendPiece(function(t3) {
        return { attachment: t3, attributes: arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, type: "attachment" };
      }(t2, e2));
    }
    appendPiece(t2) {
      return 0 === this.blocks.length && this.appendEmptyBlock(), this.blocks[this.blocks.length - 1].text.push(t2);
    }
    appendStringToTextAtIndex(t2, e2) {
      const { text: i2 } = this.blocks[e2], n2 = i2[i2.length - 1];
      if ("string" !== (null == n2 ? void 0 : n2.type))
        return i2.push(He(t2));
      n2.string += t2;
    }
    prependStringToTextAtIndex(t2, e2) {
      const { text: i2 } = this.blocks[e2], n2 = i2[0];
      if ("string" !== (null == n2 ? void 0 : n2.type))
        return i2.unshift(He(t2));
      n2.string = t2 + n2.string;
    }
    getTextAttributes(t2) {
      let e2;
      const i2 = {};
      for (const n2 in O) {
        const r2 = O[n2];
        if (r2.tagName && p(t2, { matchingSelector: r2.tagName, untilNode: this.containerElement }))
          i2[n2] = true;
        else if (r2.parser) {
          if (e2 = r2.parser(t2), e2) {
            let o2 = false;
            for (const i3 of this.findBlockElementAncestors(t2))
              if (r2.parser(i3) === e2) {
                o2 = true;
                break;
              }
            o2 || (i2[n2] = e2);
          }
        } else
          r2.styleProperty && (e2 = t2.style[r2.styleProperty], e2 && (i2[n2] = e2));
      }
      if (F(t2)) {
        const n2 = Je(t2, "attributes");
        for (const t3 in n2)
          e2 = n2[t3], i2[t3] = e2;
      }
      return i2;
    }
    getBlockAttributes(t2) {
      const i2 = [];
      for (; t2 && t2 !== this.containerElement; ) {
        for (const r2 in e) {
          const o2 = e[r2];
          var n2;
          if (false !== o2.parse) {
            if (y(t2) === o2.tagName)
              (null !== (n2 = o2.test) && void 0 !== n2 && n2.call(o2, t2) || !o2.test) && (i2.push(r2), o2.listAttribute && i2.push(o2.listAttribute));
          }
        }
        t2 = t2.parentNode;
      }
      return i2.reverse();
    }
    findBlockElementAncestors(t2) {
      const e2 = [];
      for (; t2 && t2 !== this.containerElement; ) {
        const i2 = y(t2);
        E().includes(i2) && e2.push(t2), t2 = t2.parentNode;
      }
      return e2;
    }
    isBlockElement(t2) {
      if ((null == t2 ? void 0 : t2.nodeType) === Node.ELEMENT_NODE && !F(t2) && !p(t2, { matchingSelector: "td", untilNode: this.containerElement }))
        return E().includes(y(t2)) || "block" === window.getComputedStyle(t2).display;
    }
    isInsignificantTextNode(t2) {
      if ((null == t2 ? void 0 : t2.nodeType) !== Node.TEXT_NODE)
        return;
      if (!Ze(t2.data))
        return;
      const { parentNode: e2, previousSibling: i2, nextSibling: n2 } = t2;
      return $e(e2.previousSibling) && !this.isBlockElement(e2.previousSibling) || Ge(e2) ? void 0 : !i2 || this.isBlockElement(i2) || !n2 || this.isBlockElement(n2);
    }
    isExtraBR(t2) {
      return "br" === y(t2) && this.isBlockElement(t2.parentNode) && t2.parentNode.lastChild === t2;
    }
    needsTableSeparator(t2) {
      if (N.removeBlankTableCells) {
        var e2;
        const i2 = null === (e2 = t2.previousSibling) || void 0 === e2 ? void 0 : e2.textContent;
        return i2 && /\S/.test(i2);
      }
      return t2.previousSibling;
    }
    translateBlockElementMarginsToNewlines() {
      const t2 = this.getMarginOfDefaultBlockElement();
      for (let e2 = 0; e2 < this.blocks.length; e2++) {
        const i2 = this.getMarginOfBlockElementAtIndex(e2);
        i2 && (i2.top > 2 * t2.top && this.prependStringToTextAtIndex("\n", e2), i2.bottom > 2 * t2.bottom && this.appendStringToTextAtIndex("\n", e2));
      }
    }
    getMarginOfBlockElementAtIndex(t2) {
      const e2 = this.blockElements[t2];
      if (e2 && e2.textContent && !E().includes(y(e2)) && !this.processedElements.includes(e2))
        return Xe(e2);
    }
    getMarginOfDefaultBlockElement() {
      const t2 = C(e.default.tagName);
      return this.containerElement.appendChild(t2), Xe(t2);
    }
  };
  var Ge = function(t2) {
    const { whiteSpace: e2 } = window.getComputedStyle(t2);
    return ["pre", "pre-wrap", "pre-line"].includes(e2);
  };
  var $e = (t2) => t2 && !ti(t2.textContent);
  var Xe = function(t2) {
    const e2 = window.getComputedStyle(t2);
    if ("block" === e2.display)
      return { top: parseInt(e2.marginTop), bottom: parseInt(e2.marginBottom) };
  };
  var Ye = function(t2) {
    return "style" === y(t2) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
  };
  var Qe = (t2) => t2.replace(new RegExp("^".concat(jt.source, "+")), "");
  var Ze = (t2) => new RegExp("^".concat(jt.source, "*$")).test(t2);
  var ti = (t2) => /\s$/.test(t2);
  var ei = ["contenteditable", "data-trix-id", "data-trix-store-key", "data-trix-mutable", "data-trix-placeholder", "tabindex"];
  var ii = "[".concat("data-trix-serialized-attributes", "]");
  var ni = new RegExp("<!--block-->", "g");
  var ri = { "application/json": function(t2) {
    let e2;
    if (t2 instanceof je)
      e2 = t2;
    else {
      if (!(t2 instanceof HTMLElement))
        throw new Error("unserializable object");
      e2 = Ke.parse(t2.innerHTML).getDocument();
    }
    return e2.toSerializableDocument().toJSONString();
  }, "text/html": function(t2) {
    let e2;
    if (t2 instanceof je)
      e2 = ue.render(t2);
    else {
      if (!(t2 instanceof HTMLElement))
        throw new Error("unserializable object");
      e2 = t2.cloneNode(true);
    }
    return Array.from(e2.querySelectorAll("[data-trix-serialize=false]")).forEach((t3) => {
      A(t3);
    }), ei.forEach((t3) => {
      Array.from(e2.querySelectorAll("[".concat(t3, "]"))).forEach((e3) => {
        e3.removeAttribute(t3);
      });
    }), Array.from(e2.querySelectorAll(ii)).forEach((t3) => {
      try {
        const e3 = JSON.parse(t3.getAttribute("data-trix-serialized-attributes"));
        t3.removeAttribute("data-trix-serialized-attributes");
        for (const i2 in e3) {
          const n2 = e3[i2];
          t3.setAttribute(i2, n2);
        }
      } catch (t4) {
      }
    }), e2.innerHTML.replace(ni, "");
  } };
  var oi = Object.freeze({ __proto__: null });
  var si = class extends U {
    constructor(t2, e2) {
      super(...arguments), this.attachmentManager = t2, this.attachment = e2, this.id = this.attachment.id, this.file = this.attachment.file;
    }
    remove() {
      return this.attachmentManager.requestRemovalOfAttachment(this.attachment);
    }
  };
  si.proxyMethod("attachment.getAttribute"), si.proxyMethod("attachment.hasAttribute"), si.proxyMethod("attachment.setAttribute"), si.proxyMethod("attachment.getAttributes"), si.proxyMethod("attachment.setAttributes"), si.proxyMethod("attachment.isPending"), si.proxyMethod("attachment.isPreviewable"), si.proxyMethod("attachment.getURL"), si.proxyMethod("attachment.getHref"), si.proxyMethod("attachment.getFilename"), si.proxyMethod("attachment.getFilesize"), si.proxyMethod("attachment.getFormattedFilesize"), si.proxyMethod("attachment.getExtension"), si.proxyMethod("attachment.getContentType"), si.proxyMethod("attachment.getFile"), si.proxyMethod("attachment.setFile"), si.proxyMethod("attachment.releaseFile"), si.proxyMethod("attachment.getUploadProgress"), si.proxyMethod("attachment.setUploadProgress");
  var ai = class extends U {
    constructor() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
      super(...arguments), this.managedAttachments = {}, Array.from(t2).forEach((t3) => {
        this.manageAttachment(t3);
      });
    }
    getAttachments() {
      const t2 = [];
      for (const e2 in this.managedAttachments) {
        const i2 = this.managedAttachments[e2];
        t2.push(i2);
      }
      return t2;
    }
    manageAttachment(t2) {
      return this.managedAttachments[t2.id] || (this.managedAttachments[t2.id] = new si(this, t2)), this.managedAttachments[t2.id];
    }
    attachmentIsManaged(t2) {
      return t2.id in this.managedAttachments;
    }
    requestRemovalOfAttachment(t2) {
      var e2, i2;
      if (this.attachmentIsManaged(t2))
        return null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.attachmentManagerDidRequestRemovalOfAttachment) || void 0 === i2 ? void 0 : i2.call(e2, t2);
    }
    unmanageAttachment(t2) {
      const e2 = this.managedAttachments[t2.id];
      return delete this.managedAttachments[t2.id], e2;
    }
  };
  var li = class {
    constructor(t2) {
      this.composition = t2, this.document = this.composition.document;
      const e2 = this.composition.getSelectedRange();
      this.startPosition = e2[0], this.endPosition = e2[1], this.startLocation = this.document.locationFromPosition(this.startPosition), this.endLocation = this.document.locationFromPosition(this.endPosition), this.block = this.document.getBlockAtIndex(this.endLocation.index), this.breaksOnReturn = this.block.breaksOnReturn(), this.previousCharacter = this.block.text.getStringAtPosition(this.endLocation.offset - 1), this.nextCharacter = this.block.text.getStringAtPosition(this.endLocation.offset);
    }
    shouldInsertBlockBreak() {
      return this.block.hasAttributes() && this.block.isListItem() && !this.block.isEmpty() ? 0 !== this.startLocation.offset : this.breaksOnReturn && "\n" !== this.nextCharacter;
    }
    shouldBreakFormattedBlock() {
      return this.block.hasAttributes() && !this.block.isListItem() && (this.breaksOnReturn && "\n" === this.nextCharacter || "\n" === this.previousCharacter);
    }
    shouldDecreaseListLevel() {
      return this.block.hasAttributes() && this.block.isListItem() && this.block.isEmpty();
    }
    shouldPrependListItem() {
      return this.block.isListItem() && 0 === this.startLocation.offset && !this.block.isEmpty();
    }
    shouldRemoveLastBlockAttribute() {
      return this.block.hasAttributes() && !this.block.isListItem() && this.block.isEmpty();
    }
  };
  var ci = class extends U {
    constructor() {
      super(...arguments), this.document = new je(), this.attachments = [], this.currentAttributes = {}, this.revision = 0;
    }
    setDocument(t2) {
      var e2, i2;
      if (!t2.isEqualTo(this.document))
        return this.document = t2, this.refreshAttachments(), this.revision++, null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionDidChangeDocument) || void 0 === i2 ? void 0 : i2.call(e2, t2);
    }
    getSnapshot() {
      return { document: this.document, selectedRange: this.getSelectedRange() };
    }
    loadSnapshot(t2) {
      var e2, i2, n2, r2;
      let { document: o2, selectedRange: s2 } = t2;
      return null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionWillLoadSnapshot) || void 0 === i2 || i2.call(e2), this.setDocument(null != o2 ? o2 : new je()), this.setSelection(null != s2 ? s2 : [0, 0]), null === (n2 = this.delegate) || void 0 === n2 || null === (r2 = n2.compositionDidLoadSnapshot) || void 0 === r2 ? void 0 : r2.call(n2);
    }
    insertText(t2) {
      let { updatePosition: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : { updatePosition: true };
      const i2 = this.getSelectedRange();
      this.setDocument(this.document.insertTextAtRange(t2, i2));
      const n2 = i2[0], r2 = n2 + t2.getLength();
      return e2 && this.setSelection(r2), this.notifyDelegateOfInsertionAtRange([n2, r2]);
    }
    insertBlock() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : new De();
      const e2 = new je([t2]);
      return this.insertDocument(e2);
    }
    insertDocument() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : new je();
      const e2 = this.getSelectedRange();
      this.setDocument(this.document.insertDocumentAtRange(t2, e2));
      const i2 = e2[0], n2 = i2 + t2.getLength();
      return this.setSelection(n2), this.notifyDelegateOfInsertionAtRange([i2, n2]);
    }
    insertString(t2, e2) {
      const i2 = this.getCurrentTextAttributes(), n2 = Le.textForStringWithAttributes(t2, i2);
      return this.insertText(n2, e2);
    }
    insertBlockBreak() {
      const t2 = this.getSelectedRange();
      this.setDocument(this.document.insertBlockBreakAtRange(t2));
      const e2 = t2[0], i2 = e2 + 1;
      return this.setSelection(i2), this.notifyDelegateOfInsertionAtRange([e2, i2]);
    }
    insertLineBreak() {
      const t2 = new li(this);
      if (t2.shouldDecreaseListLevel())
        return this.decreaseListLevel(), this.setSelection(t2.startPosition);
      if (t2.shouldPrependListItem()) {
        const e2 = new je([t2.block.copyWithoutText()]);
        return this.insertDocument(e2);
      }
      return t2.shouldInsertBlockBreak() ? this.insertBlockBreak() : t2.shouldRemoveLastBlockAttribute() ? this.removeLastBlockAttribute() : t2.shouldBreakFormattedBlock() ? this.breakFormattedBlock(t2) : this.insertString("\n");
    }
    insertHTML(t2) {
      const e2 = Ke.parse(t2).getDocument(), i2 = this.getSelectedRange();
      this.setDocument(this.document.mergeDocumentAtRange(e2, i2));
      const n2 = i2[0], r2 = n2 + e2.getLength() - 1;
      return this.setSelection(r2), this.notifyDelegateOfInsertionAtRange([n2, r2]);
    }
    replaceHTML(t2) {
      const e2 = Ke.parse(t2).getDocument().copyUsingObjectsFromDocument(this.document), i2 = this.getLocationRange({ strict: false }), n2 = this.document.rangeFromLocationRange(i2);
      return this.setDocument(e2), this.setSelection(n2);
    }
    insertFile(t2) {
      return this.insertFiles([t2]);
    }
    insertFiles(t2) {
      const e2 = [];
      return Array.from(t2).forEach((t3) => {
        var i2;
        if (null !== (i2 = this.delegate) && void 0 !== i2 && i2.compositionShouldAcceptFile(t3)) {
          const i3 = xe.attachmentForFile(t3);
          e2.push(i3);
        }
      }), this.insertAttachments(e2);
    }
    insertAttachment(t2) {
      return this.insertAttachments([t2]);
    }
    insertAttachments(e2) {
      let i2 = new Le();
      return Array.from(e2).forEach((e3) => {
        var n2;
        const r2 = e3.getType(), o2 = null === (n2 = t[r2]) || void 0 === n2 ? void 0 : n2.presentation, s2 = this.getCurrentTextAttributes();
        o2 && (s2.presentation = o2);
        const a2 = Le.textForAttachmentWithAttributes(e3, s2);
        i2 = i2.appendText(a2);
      }), this.insertText(i2);
    }
    shouldManageDeletingInDirection(t2) {
      const e2 = this.getLocationRange();
      if (St(e2)) {
        if ("backward" === t2 && 0 === e2[0].offset)
          return true;
        if (this.shouldManageMovingCursorInDirection(t2))
          return true;
      } else if (e2[0].index !== e2[1].index)
        return true;
      return false;
    }
    deleteInDirection(t2) {
      let e2, i2, n2, { length: r2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      const o2 = this.getLocationRange();
      let s2 = this.getSelectedRange();
      const a2 = St(s2);
      if (a2 ? i2 = "backward" === t2 && 0 === o2[0].offset : n2 = o2[0].index !== o2[1].index, i2 && this.canDecreaseBlockAttributeLevel()) {
        const t3 = this.getBlock();
        if (t3.isListItem() ? this.decreaseListLevel() : this.decreaseBlockAttributeLevel(), this.setSelection(s2[0]), t3.isEmpty())
          return false;
      }
      return a2 && (s2 = this.getExpandedRangeInDirection(t2, { length: r2 }), "backward" === t2 && (e2 = this.getAttachmentAtRange(s2))), e2 ? (this.editAttachment(e2), false) : (this.setDocument(this.document.removeTextAtRange(s2)), this.setSelection(s2[0]), !i2 && !n2 && void 0);
    }
    moveTextFromRange(t2) {
      const [e2] = Array.from(this.getSelectedRange());
      return this.setDocument(this.document.moveTextFromRangeToPosition(t2, e2)), this.setSelection(e2);
    }
    removeAttachment(t2) {
      const e2 = this.document.getRangeOfAttachment(t2);
      if (e2)
        return this.stopEditingAttachment(), this.setDocument(this.document.removeTextAtRange(e2)), this.setSelection(e2[0]);
    }
    removeLastBlockAttribute() {
      const [t2, e2] = Array.from(this.getSelectedRange()), i2 = this.document.getBlockAtPosition(e2);
      return this.removeCurrentAttribute(i2.getLastAttribute()), this.setSelection(t2);
    }
    insertPlaceholder() {
      return this.placeholderPosition = this.getPosition(), this.insertString(" ");
    }
    selectPlaceholder() {
      if (null != this.placeholderPosition)
        return this.setSelectedRange([this.placeholderPosition, this.placeholderPosition + " ".length]), this.getSelectedRange();
    }
    forgetPlaceholder() {
      this.placeholderPosition = null;
    }
    hasCurrentAttribute(t2) {
      const e2 = this.currentAttributes[t2];
      return null != e2 && false !== e2;
    }
    toggleCurrentAttribute(t2) {
      const e2 = !this.currentAttributes[t2];
      return e2 ? this.setCurrentAttribute(t2, e2) : this.removeCurrentAttribute(t2);
    }
    canSetCurrentAttribute(t2) {
      return ht(t2) ? this.canSetCurrentBlockAttribute(t2) : this.canSetCurrentTextAttribute(t2);
    }
    canSetCurrentTextAttribute(t2) {
      const e2 = this.getSelectedDocument();
      if (e2) {
        for (const t3 of Array.from(e2.getAttachments()))
          if (!t3.hasContent())
            return false;
        return true;
      }
    }
    canSetCurrentBlockAttribute(t2) {
      const e2 = this.getBlock();
      if (e2)
        return !e2.isTerminalBlock();
    }
    setCurrentAttribute(t2, e2) {
      return ht(t2) ? this.setBlockAttribute(t2, e2) : (this.setTextAttribute(t2, e2), this.currentAttributes[t2] = e2, this.notifyDelegateOfCurrentAttributesChange());
    }
    setTextAttribute(t2, e2) {
      const i2 = this.getSelectedRange();
      if (!i2)
        return;
      const [n2, r2] = Array.from(i2);
      if (n2 !== r2)
        return this.setDocument(this.document.addAttributeAtRange(t2, e2, i2));
      if ("href" === t2) {
        const t3 = Le.textForStringWithAttributes(e2, { href: e2 });
        return this.insertText(t3);
      }
    }
    setBlockAttribute(t2, e2) {
      const i2 = this.getSelectedRange();
      if (this.canSetCurrentAttribute(t2))
        return this.setDocument(this.document.applyBlockAttributeAtRange(t2, e2, i2)), this.setSelection(i2);
    }
    removeCurrentAttribute(t2) {
      return ht(t2) ? (this.removeBlockAttribute(t2), this.updateCurrentAttributes()) : (this.removeTextAttribute(t2), delete this.currentAttributes[t2], this.notifyDelegateOfCurrentAttributesChange());
    }
    removeTextAttribute(t2) {
      const e2 = this.getSelectedRange();
      if (e2)
        return this.setDocument(this.document.removeAttributeAtRange(t2, e2));
    }
    removeBlockAttribute(t2) {
      const e2 = this.getSelectedRange();
      if (e2)
        return this.setDocument(this.document.removeAttributeAtRange(t2, e2));
    }
    canDecreaseNestingLevel() {
      var t2;
      return (null === (t2 = this.getBlock()) || void 0 === t2 ? void 0 : t2.getNestingLevel()) > 0;
    }
    canIncreaseNestingLevel() {
      var t2;
      const e2 = this.getBlock();
      if (e2) {
        if (null === (t2 = ht(e2.getLastNestableAttribute())) || void 0 === t2 || !t2.listAttribute)
          return e2.getNestingLevel() > 0;
        {
          const t3 = this.getPreviousBlock();
          if (t3)
            return function() {
              let t4 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [];
              return et((arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : []).slice(0, t4.length), t4);
            }(t3.getListItemAttributes(), e2.getListItemAttributes());
        }
      }
    }
    decreaseNestingLevel() {
      const t2 = this.getBlock();
      if (t2)
        return this.setDocument(this.document.replaceBlock(t2, t2.decreaseNestingLevel()));
    }
    increaseNestingLevel() {
      const t2 = this.getBlock();
      if (t2)
        return this.setDocument(this.document.replaceBlock(t2, t2.increaseNestingLevel()));
    }
    canDecreaseBlockAttributeLevel() {
      var t2;
      return (null === (t2 = this.getBlock()) || void 0 === t2 ? void 0 : t2.getAttributeLevel()) > 0;
    }
    decreaseBlockAttributeLevel() {
      var t2;
      const e2 = null === (t2 = this.getBlock()) || void 0 === t2 ? void 0 : t2.getLastAttribute();
      if (e2)
        return this.removeCurrentAttribute(e2);
    }
    decreaseListLevel() {
      let [t2] = Array.from(this.getSelectedRange());
      const { index: e2 } = this.document.locationFromPosition(t2);
      let i2 = e2;
      const n2 = this.getBlock().getAttributeLevel();
      let r2 = this.document.getBlockAtIndex(i2 + 1);
      for (; r2 && r2.isListItem() && !(r2.getAttributeLevel() <= n2); )
        i2++, r2 = this.document.getBlockAtIndex(i2 + 1);
      t2 = this.document.positionFromLocation({ index: e2, offset: 0 });
      const o2 = this.document.positionFromLocation({ index: i2, offset: 0 });
      return this.setDocument(this.document.removeLastListAttributeAtRange([t2, o2]));
    }
    updateCurrentAttributes() {
      const t2 = this.getSelectedRange({ ignoreLock: true });
      if (t2) {
        const e2 = this.document.getCommonAttributesAtRange(t2);
        if (Array.from(ct()).forEach((t3) => {
          e2[t3] || this.canSetCurrentAttribute(t3) || (e2[t3] = false);
        }), !Rt(e2, this.currentAttributes))
          return this.currentAttributes = e2, this.notifyDelegateOfCurrentAttributesChange();
      }
    }
    getCurrentAttributes() {
      return c.call({}, this.currentAttributes);
    }
    getCurrentTextAttributes() {
      const t2 = {};
      for (const e2 in this.currentAttributes) {
        const i2 = this.currentAttributes[e2];
        false !== i2 && dt(e2) && (t2[e2] = i2);
      }
      return t2;
    }
    freezeSelection() {
      return this.setCurrentAttribute("frozen", true);
    }
    thawSelection() {
      return this.removeCurrentAttribute("frozen");
    }
    hasFrozenSelection() {
      return this.hasCurrentAttribute("frozen");
    }
    setSelection(t2) {
      var e2;
      const i2 = this.document.locationRangeFromRange(t2);
      return null === (e2 = this.delegate) || void 0 === e2 ? void 0 : e2.compositionDidRequestChangingSelectionToLocationRange(i2);
    }
    getSelectedRange() {
      const t2 = this.getLocationRange();
      if (t2)
        return this.document.rangeFromLocationRange(t2);
    }
    setSelectedRange(t2) {
      const e2 = this.document.locationRangeFromRange(t2);
      return this.getSelectionManager().setLocationRange(e2);
    }
    getPosition() {
      const t2 = this.getLocationRange();
      if (t2)
        return this.document.positionFromLocation(t2[0]);
    }
    getLocationRange(t2) {
      return this.targetLocationRange ? this.targetLocationRange : this.getSelectionManager().getLocationRange(t2) || Et({ index: 0, offset: 0 });
    }
    withTargetLocationRange(t2, e2) {
      let i2;
      this.targetLocationRange = t2;
      try {
        i2 = e2();
      } finally {
        this.targetLocationRange = null;
      }
      return i2;
    }
    withTargetRange(t2, e2) {
      const i2 = this.document.locationRangeFromRange(t2);
      return this.withTargetLocationRange(i2, e2);
    }
    withTargetDOMRange(t2, e2) {
      const i2 = this.createLocationRangeFromDOMRange(t2, { strict: false });
      return this.withTargetLocationRange(i2, e2);
    }
    getExpandedRangeInDirection(t2) {
      let { length: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {}, [i2, n2] = Array.from(this.getSelectedRange());
      return "backward" === t2 ? e2 ? i2 -= e2 : i2 = this.translateUTF16PositionFromOffset(i2, -1) : e2 ? n2 += e2 : n2 = this.translateUTF16PositionFromOffset(n2, 1), Et([i2, n2]);
    }
    shouldManageMovingCursorInDirection(t2) {
      if (this.editingAttachment)
        return true;
      const e2 = this.getExpandedRangeInDirection(t2);
      return null != this.getAttachmentAtRange(e2);
    }
    moveCursorInDirection(t2) {
      let e2, i2;
      if (this.editingAttachment)
        i2 = this.document.getRangeOfAttachment(this.editingAttachment);
      else {
        const n2 = this.getSelectedRange();
        i2 = this.getExpandedRangeInDirection(t2), e2 = !kt(n2, i2);
      }
      if ("backward" === t2 ? this.setSelectedRange(i2[0]) : this.setSelectedRange(i2[1]), e2) {
        const t3 = this.getAttachmentAtRange(i2);
        if (t3)
          return this.editAttachment(t3);
      }
    }
    expandSelectionInDirection(t2) {
      let { length: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      const i2 = this.getExpandedRangeInDirection(t2, { length: e2 });
      return this.setSelectedRange(i2);
    }
    expandSelectionForEditing() {
      if (this.hasCurrentAttribute("href"))
        return this.expandSelectionAroundCommonAttribute("href");
    }
    expandSelectionAroundCommonAttribute(t2) {
      const e2 = this.getPosition(), i2 = this.document.getRangeOfCommonAttributeAtPosition(t2, e2);
      return this.setSelectedRange(i2);
    }
    selectionContainsAttachments() {
      var t2;
      return (null === (t2 = this.getSelectedAttachments()) || void 0 === t2 ? void 0 : t2.length) > 0;
    }
    selectionIsInCursorTarget() {
      return this.editingAttachment || this.positionIsCursorTarget(this.getPosition());
    }
    positionIsCursorTarget(t2) {
      const e2 = this.document.locationFromPosition(t2);
      if (e2)
        return this.locationIsCursorTarget(e2);
    }
    positionIsBlockBreak(t2) {
      var e2;
      return null === (e2 = this.document.getPieceAtPosition(t2)) || void 0 === e2 ? void 0 : e2.isBlockBreak();
    }
    getSelectedDocument() {
      const t2 = this.getSelectedRange();
      if (t2)
        return this.document.getDocumentAtRange(t2);
    }
    getSelectedAttachments() {
      var t2;
      return null === (t2 = this.getSelectedDocument()) || void 0 === t2 ? void 0 : t2.getAttachments();
    }
    getAttachments() {
      return this.attachments.slice(0);
    }
    refreshAttachments() {
      const t2 = this.document.getAttachments(), { added: e2, removed: i2 } = function() {
        let t3 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [], e3 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : [];
        const i3 = [], n2 = [], r2 = /* @__PURE__ */ new Set();
        t3.forEach((t4) => {
          r2.add(t4);
        });
        const o2 = /* @__PURE__ */ new Set();
        return e3.forEach((t4) => {
          o2.add(t4), r2.has(t4) || i3.push(t4);
        }), t3.forEach((t4) => {
          o2.has(t4) || n2.push(t4);
        }), { added: i3, removed: n2 };
      }(this.attachments, t2);
      return this.attachments = t2, Array.from(i2).forEach((t3) => {
        var e3, i3;
        t3.delegate = null, null === (e3 = this.delegate) || void 0 === e3 || null === (i3 = e3.compositionDidRemoveAttachment) || void 0 === i3 || i3.call(e3, t3);
      }), (() => {
        const t3 = [];
        return Array.from(e2).forEach((e3) => {
          var i3, n2;
          e3.delegate = this, t3.push(null === (i3 = this.delegate) || void 0 === i3 || null === (n2 = i3.compositionDidAddAttachment) || void 0 === n2 ? void 0 : n2.call(i3, e3));
        }), t3;
      })();
    }
    attachmentDidChangeAttributes(t2) {
      var e2, i2;
      return this.revision++, null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionDidEditAttachment) || void 0 === i2 ? void 0 : i2.call(e2, t2);
    }
    attachmentDidChangePreviewURL(t2) {
      var e2, i2;
      return this.revision++, null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionDidChangeAttachmentPreviewURL) || void 0 === i2 ? void 0 : i2.call(e2, t2);
    }
    editAttachment(t2, e2) {
      var i2, n2;
      if (t2 !== this.editingAttachment)
        return this.stopEditingAttachment(), this.editingAttachment = t2, null === (i2 = this.delegate) || void 0 === i2 || null === (n2 = i2.compositionDidStartEditingAttachment) || void 0 === n2 ? void 0 : n2.call(i2, this.editingAttachment, e2);
    }
    stopEditingAttachment() {
      var t2, e2;
      this.editingAttachment && (null === (t2 = this.delegate) || void 0 === t2 || null === (e2 = t2.compositionDidStopEditingAttachment) || void 0 === e2 || e2.call(t2, this.editingAttachment), this.editingAttachment = null);
    }
    updateAttributesForAttachment(t2, e2) {
      return this.setDocument(this.document.updateAttributesForAttachment(t2, e2));
    }
    removeAttributeForAttachment(t2, e2) {
      return this.setDocument(this.document.removeAttributeForAttachment(t2, e2));
    }
    breakFormattedBlock(t2) {
      let { document: e2 } = t2;
      const { block: i2 } = t2;
      let n2 = t2.startPosition, r2 = [n2 - 1, n2];
      i2.getBlockBreakPosition() === t2.startLocation.offset ? (i2.breaksOnReturn() && "\n" === t2.nextCharacter ? n2 += 1 : e2 = e2.removeTextAtRange(r2), r2 = [n2, n2]) : "\n" === t2.nextCharacter ? "\n" === t2.previousCharacter ? r2 = [n2 - 1, n2 + 1] : (r2 = [n2, n2 + 1], n2 += 1) : t2.startLocation.offset - 1 != 0 && (n2 += 1);
      const o2 = new je([i2.removeLastAttribute().copyWithoutText()]);
      return this.setDocument(e2.insertDocumentAtRange(o2, r2)), this.setSelection(n2);
    }
    getPreviousBlock() {
      const t2 = this.getLocationRange();
      if (t2) {
        const { index: e2 } = t2[0];
        if (e2 > 0)
          return this.document.getBlockAtIndex(e2 - 1);
      }
    }
    getBlock() {
      const t2 = this.getLocationRange();
      if (t2)
        return this.document.getBlockAtIndex(t2[0].index);
    }
    getAttachmentAtRange(t2) {
      const e2 = this.document.getDocumentAtRange(t2);
      if (e2.toString() === "".concat("\uFFFC", "\n"))
        return e2.getAttachments()[0];
    }
    notifyDelegateOfCurrentAttributesChange() {
      var t2, e2;
      return null === (t2 = this.delegate) || void 0 === t2 || null === (e2 = t2.compositionDidChangeCurrentAttributes) || void 0 === e2 ? void 0 : e2.call(t2, this.currentAttributes);
    }
    notifyDelegateOfInsertionAtRange(t2) {
      var e2, i2;
      return null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionDidPerformInsertionAtRange) || void 0 === i2 ? void 0 : i2.call(e2, t2);
    }
    translateUTF16PositionFromOffset(t2, e2) {
      const i2 = this.document.toUTF16String(), n2 = i2.offsetFromUCS2Offset(t2);
      return i2.offsetToUCS2Offset(n2 + e2);
    }
  };
  ci.proxyMethod("getSelectionManager().getPointRange"), ci.proxyMethod("getSelectionManager().setLocationRangeFromPointRange"), ci.proxyMethod("getSelectionManager().createLocationRangeFromDOMRange"), ci.proxyMethod("getSelectionManager().locationIsCursorTarget"), ci.proxyMethod("getSelectionManager().selectionIsExpanded"), ci.proxyMethod("delegate?.getSelectionManager");
  var hi = class extends U {
    constructor(t2) {
      super(...arguments), this.composition = t2, this.undoEntries = [], this.redoEntries = [];
    }
    recordUndoEntry(t2) {
      let { context: e2, consolidatable: i2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      const n2 = this.undoEntries.slice(-1)[0];
      if (!i2 || !ui(n2, t2, e2)) {
        const i3 = this.createEntry({ description: t2, context: e2 });
        this.undoEntries.push(i3), this.redoEntries = [];
      }
    }
    undo() {
      const t2 = this.undoEntries.pop();
      if (t2) {
        const e2 = this.createEntry(t2);
        return this.redoEntries.push(e2), this.composition.loadSnapshot(t2.snapshot);
      }
    }
    redo() {
      const t2 = this.redoEntries.pop();
      if (t2) {
        const e2 = this.createEntry(t2);
        return this.undoEntries.push(e2), this.composition.loadSnapshot(t2.snapshot);
      }
    }
    canUndo() {
      return this.undoEntries.length > 0;
    }
    canRedo() {
      return this.redoEntries.length > 0;
    }
    createEntry() {
      let { description: t2, context: e2 } = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      return { description: null == t2 ? void 0 : t2.toString(), context: JSON.stringify(e2), snapshot: this.composition.getSnapshot() };
    }
  };
  var ui = (t2, e2, i2) => (null == t2 ? void 0 : t2.description) === (null == e2 ? void 0 : e2.toString()) && (null == t2 ? void 0 : t2.context) === JSON.stringify(i2);
  var di = class {
    constructor(t2) {
      this.document = t2.document, this.selectedRange = t2.selectedRange;
    }
    perform() {
      return this.removeBlockAttribute(), this.applyBlockAttribute();
    }
    getSnapshot() {
      return { document: this.document, selectedRange: this.selectedRange };
    }
    removeBlockAttribute() {
      return this.findRangesOfBlocks().map((t2) => this.document = this.document.removeAttributeAtRange("attachmentGallery", t2));
    }
    applyBlockAttribute() {
      let t2 = 0;
      this.findRangesOfPieces().forEach((e2) => {
        e2[1] - e2[0] > 1 && (e2[0] += t2, e2[1] += t2, "\n" !== this.document.getCharacterAtPosition(e2[1]) && (this.document = this.document.insertBlockBreakAtRange(e2[1]), e2[1] < this.selectedRange[1] && this.moveSelectedRangeForward(), e2[1]++, t2++), 0 !== e2[0] && "\n" !== this.document.getCharacterAtPosition(e2[0] - 1) && (this.document = this.document.insertBlockBreakAtRange(e2[0]), e2[0] < this.selectedRange[0] && this.moveSelectedRangeForward(), e2[0]++, t2++), this.document = this.document.applyBlockAttributeAtRange("attachmentGallery", true, e2));
      });
    }
    findRangesOfBlocks() {
      return this.document.findRangesForBlockAttribute("attachmentGallery");
    }
    findRangesOfPieces() {
      return this.document.findRangesForTextAttribute("presentation", { withValue: "gallery" });
    }
    moveSelectedRangeForward() {
      this.selectedRange[0] += 1, this.selectedRange[1] += 1;
    }
  };
  var gi = function(t2) {
    const e2 = new di(t2);
    return e2.perform(), e2.getSnapshot();
  };
  var mi = [gi];
  var pi = class {
    constructor(t2, e2, i2) {
      this.insertFiles = this.insertFiles.bind(this), this.composition = t2, this.selectionManager = e2, this.element = i2, this.undoManager = new hi(this.composition), this.filters = mi.slice(0);
    }
    loadDocument(t2) {
      return this.loadSnapshot({ document: t2, selectedRange: [0, 0] });
    }
    loadHTML() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "";
      const e2 = Ke.parse(t2, { referenceElement: this.element }).getDocument();
      return this.loadDocument(e2);
    }
    loadJSON(t2) {
      let { document: e2, selectedRange: i2 } = t2;
      return e2 = je.fromJSON(e2), this.loadSnapshot({ document: e2, selectedRange: i2 });
    }
    loadSnapshot(t2) {
      return this.undoManager = new hi(this.composition), this.composition.loadSnapshot(t2);
    }
    getDocument() {
      return this.composition.document;
    }
    getSelectedDocument() {
      return this.composition.getSelectedDocument();
    }
    getSnapshot() {
      return this.composition.getSnapshot();
    }
    toJSON() {
      return this.getSnapshot();
    }
    deleteInDirection(t2) {
      return this.composition.deleteInDirection(t2);
    }
    insertAttachment(t2) {
      return this.composition.insertAttachment(t2);
    }
    insertAttachments(t2) {
      return this.composition.insertAttachments(t2);
    }
    insertDocument(t2) {
      return this.composition.insertDocument(t2);
    }
    insertFile(t2) {
      return this.composition.insertFile(t2);
    }
    insertFiles(t2) {
      return this.composition.insertFiles(t2);
    }
    insertHTML(t2) {
      return this.composition.insertHTML(t2);
    }
    insertString(t2) {
      return this.composition.insertString(t2);
    }
    insertText(t2) {
      return this.composition.insertText(t2);
    }
    insertLineBreak() {
      return this.composition.insertLineBreak();
    }
    getSelectedRange() {
      return this.composition.getSelectedRange();
    }
    getPosition() {
      return this.composition.getPosition();
    }
    getClientRectAtPosition(t2) {
      const e2 = this.getDocument().locationRangeFromRange([t2, t2 + 1]);
      return this.selectionManager.getClientRectAtLocationRange(e2);
    }
    expandSelectionInDirection(t2) {
      return this.composition.expandSelectionInDirection(t2);
    }
    moveCursorInDirection(t2) {
      return this.composition.moveCursorInDirection(t2);
    }
    setSelectedRange(t2) {
      return this.composition.setSelectedRange(t2);
    }
    activateAttribute(t2) {
      let e2 = !(arguments.length > 1 && void 0 !== arguments[1]) || arguments[1];
      return this.composition.setCurrentAttribute(t2, e2);
    }
    attributeIsActive(t2) {
      return this.composition.hasCurrentAttribute(t2);
    }
    canActivateAttribute(t2) {
      return this.composition.canSetCurrentAttribute(t2);
    }
    deactivateAttribute(t2) {
      return this.composition.removeCurrentAttribute(t2);
    }
    canDecreaseNestingLevel() {
      return this.composition.canDecreaseNestingLevel();
    }
    canIncreaseNestingLevel() {
      return this.composition.canIncreaseNestingLevel();
    }
    decreaseNestingLevel() {
      if (this.canDecreaseNestingLevel())
        return this.composition.decreaseNestingLevel();
    }
    increaseNestingLevel() {
      if (this.canIncreaseNestingLevel())
        return this.composition.increaseNestingLevel();
    }
    canRedo() {
      return this.undoManager.canRedo();
    }
    canUndo() {
      return this.undoManager.canUndo();
    }
    recordUndoEntry(t2) {
      let { context: e2, consolidatable: i2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
      return this.undoManager.recordUndoEntry(t2, { context: e2, consolidatable: i2 });
    }
    redo() {
      if (this.canRedo())
        return this.undoManager.redo();
    }
    undo() {
      if (this.canUndo())
        return this.undoManager.undo();
    }
  };
  var fi = class {
    constructor(t2) {
      this.element = t2;
    }
    findLocationFromContainerAndOffset(t2, e2) {
      let { strict: i2 } = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : { strict: true }, n2 = 0, r2 = false;
      const o2 = { index: 0, offset: 0 }, s2 = this.findAttachmentElementParentForNode(t2);
      s2 && (t2 = s2.parentNode, e2 = v(s2));
      const a2 = x(this.element, { usingFilter: xi });
      for (; a2.nextNode(); ) {
        const s3 = a2.currentNode;
        if (s3 === t2 && I(t2)) {
          T(s3) || (o2.offset += e2);
          break;
        }
        if (s3.parentNode === t2) {
          if (n2++ === e2)
            break;
        } else if (!b(t2, s3) && n2 > 0)
          break;
        L(s3, { strict: i2 }) ? (r2 && o2.index++, o2.offset = 0, r2 = true) : o2.offset += bi(s3);
      }
      return o2;
    }
    findContainerAndOffsetFromLocation(t2) {
      let e2, i2;
      if (0 === t2.index && 0 === t2.offset) {
        for (e2 = this.element, i2 = 0; e2.firstChild; )
          if (e2 = e2.firstChild, S(e2)) {
            i2 = 1;
            break;
          }
        return [e2, i2];
      }
      let [n2, r2] = this.findNodeAndOffsetFromLocation(t2);
      if (n2) {
        if (I(n2))
          0 === bi(n2) ? (e2 = n2.parentNode.parentNode, i2 = v(n2.parentNode), T(n2, { name: "right" }) && i2++) : (e2 = n2, i2 = t2.offset - r2);
        else {
          if (e2 = n2.parentNode, !L(n2.previousSibling) && !S(e2))
            for (; n2 === e2.lastChild && (n2 = e2, e2 = e2.parentNode, !S(e2)); )
              ;
          i2 = v(n2), 0 !== t2.offset && i2++;
        }
        return [e2, i2];
      }
    }
    findNodeAndOffsetFromLocation(t2) {
      let e2, i2, n2 = 0;
      for (const r2 of this.getSignificantNodesForIndex(t2.index)) {
        const o2 = bi(r2);
        if (t2.offset <= n2 + o2)
          if (I(r2)) {
            if (e2 = r2, i2 = n2, t2.offset === i2 && T(e2))
              break;
          } else
            e2 || (e2 = r2, i2 = n2);
        if (n2 += o2, n2 > t2.offset)
          break;
      }
      return [e2, i2];
    }
    findAttachmentElementParentForNode(t2) {
      for (; t2 && t2 !== this.element; ) {
        if (F(t2))
          return t2;
        t2 = t2.parentNode;
      }
    }
    getSignificantNodesForIndex(t2) {
      const e2 = [], i2 = x(this.element, { usingFilter: vi });
      let n2 = false;
      for (; i2.nextNode(); ) {
        const o2 = i2.currentNode;
        var r2;
        if (D(o2)) {
          if (null != r2 ? r2++ : r2 = 0, r2 === t2)
            n2 = true;
          else if (n2)
            break;
        } else
          n2 && e2.push(o2);
      }
      return e2;
    }
  };
  var bi = function(t2) {
    if (t2.nodeType === Node.TEXT_NODE) {
      if (T(t2))
        return 0;
      return t2.textContent.length;
    }
    return "br" === y(t2) || F(t2) ? 1 : 0;
  };
  var vi = function(t2) {
    return Ai(t2) === NodeFilter.FILTER_ACCEPT ? xi(t2) : NodeFilter.FILTER_REJECT;
  };
  var Ai = function(t2) {
    return B(t2) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
  };
  var xi = function(t2) {
    return F(t2.parentNode) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
  };
  var yi = class {
    createDOMRangeFromPoint(t2) {
      let e2, { x: i2, y: n2 } = t2;
      if (document.caretPositionFromPoint) {
        const { offsetNode: t3, offset: r2 } = document.caretPositionFromPoint(i2, n2);
        return e2 = document.createRange(), e2.setStart(t3, r2), e2;
      }
      if (document.caretRangeFromPoint)
        return document.caretRangeFromPoint(i2, n2);
      if (document.body.createTextRange) {
        const t3 = It();
        try {
          const t4 = document.body.createTextRange();
          t4.moveToPoint(i2, n2), t4.select();
        } catch (t4) {
        }
        return e2 = It(), Pt(t3), e2;
      }
    }
    getClientRectsForDOMRange(t2) {
      const e2 = Array.from(t2.getClientRects());
      return [e2[0], e2[e2.length - 1]];
    }
  };
  var Ci = class extends U {
    constructor(t2) {
      super(...arguments), this.didMouseDown = this.didMouseDown.bind(this), this.selectionDidChange = this.selectionDidChange.bind(this), this.element = t2, this.locationMapper = new fi(this.element), this.pointMapper = new yi(), this.lockCount = 0, d("mousedown", { onElement: this.element, withCallback: this.didMouseDown });
    }
    getLocationRange() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      return false === t2.strict ? this.createLocationRangeFromDOMRange(It()) : t2.ignoreLock ? this.currentLocationRange : this.lockedLocationRange ? this.lockedLocationRange : this.currentLocationRange;
    }
    setLocationRange(t2) {
      if (this.lockedLocationRange)
        return;
      t2 = Et(t2);
      const e2 = this.createDOMRangeFromLocationRange(t2);
      e2 && (Pt(e2), this.updateCurrentLocationRange(t2));
    }
    setLocationRangeFromPointRange(t2) {
      t2 = Et(t2);
      const e2 = this.getLocationAtPoint(t2[0]), i2 = this.getLocationAtPoint(t2[1]);
      this.setLocationRange([e2, i2]);
    }
    getClientRectAtLocationRange(t2) {
      const e2 = this.createDOMRangeFromLocationRange(t2);
      if (e2)
        return this.getClientRectsForDOMRange(e2)[1];
    }
    locationIsCursorTarget(t2) {
      const e2 = Array.from(this.findNodeAndOffsetFromLocation(t2))[0];
      return T(e2);
    }
    lock() {
      0 == this.lockCount++ && (this.updateCurrentLocationRange(), this.lockedLocationRange = this.getLocationRange());
    }
    unlock() {
      if (0 == --this.lockCount) {
        const { lockedLocationRange: t2 } = this;
        if (this.lockedLocationRange = null, null != t2)
          return this.setLocationRange(t2);
      }
    }
    clearSelection() {
      var t2;
      return null === (t2 = Bt()) || void 0 === t2 ? void 0 : t2.removeAllRanges();
    }
    selectionIsCollapsed() {
      var t2;
      return true === (null === (t2 = It()) || void 0 === t2 ? void 0 : t2.collapsed);
    }
    selectionIsExpanded() {
      return !this.selectionIsCollapsed();
    }
    createLocationRangeFromDOMRange(t2, e2) {
      if (null == t2 || !this.domRangeWithinElement(t2))
        return;
      const i2 = this.findLocationFromContainerAndOffset(t2.startContainer, t2.startOffset, e2);
      if (!i2)
        return;
      const n2 = t2.collapsed ? void 0 : this.findLocationFromContainerAndOffset(t2.endContainer, t2.endOffset, e2);
      return Et([i2, n2]);
    }
    didMouseDown() {
      return this.pauseTemporarily();
    }
    pauseTemporarily() {
      let t2;
      this.paused = true;
      const e2 = () => {
        if (this.paused = false, clearTimeout(i2), Array.from(t2).forEach((t3) => {
          t3.destroy();
        }), b(document, this.element))
          return this.selectionDidChange();
      }, i2 = setTimeout(e2, 200);
      t2 = ["mousemove", "keydown"].map((t3) => d(t3, { onElement: document, withCallback: e2 }));
    }
    selectionDidChange() {
      if (!this.paused && !f(this.element))
        return this.updateCurrentLocationRange();
    }
    updateCurrentLocationRange(t2) {
      var e2, i2;
      if ((null != t2 ? t2 : t2 = this.createLocationRangeFromDOMRange(It())) && !kt(t2, this.currentLocationRange))
        return this.currentLocationRange = t2, null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.locationRangeDidChange) || void 0 === i2 ? void 0 : i2.call(e2, this.currentLocationRange.slice(0));
    }
    createDOMRangeFromLocationRange(t2) {
      const e2 = this.findContainerAndOffsetFromLocation(t2[0]), i2 = St(t2) ? e2 : this.findContainerAndOffsetFromLocation(t2[1]) || e2;
      if (null != e2 && null != i2) {
        const t3 = document.createRange();
        return t3.setStart(...Array.from(e2 || [])), t3.setEnd(...Array.from(i2 || [])), t3;
      }
    }
    getLocationAtPoint(t2) {
      const e2 = this.createDOMRangeFromPoint(t2);
      var i2;
      if (e2)
        return null === (i2 = this.createLocationRangeFromDOMRange(e2)) || void 0 === i2 ? void 0 : i2[0];
    }
    domRangeWithinElement(t2) {
      return t2.collapsed ? b(this.element, t2.startContainer) : b(this.element, t2.startContainer) && b(this.element, t2.endContainer);
    }
  };
  Ci.proxyMethod("locationMapper.findLocationFromContainerAndOffset"), Ci.proxyMethod("locationMapper.findContainerAndOffsetFromLocation"), Ci.proxyMethod("locationMapper.findNodeAndOffsetFromLocation"), Ci.proxyMethod("pointMapper.createDOMRangeFromPoint"), Ci.proxyMethod("pointMapper.getClientRectsForDOMRange");
  var Ri = Object.freeze({ __proto__: null, Attachment: xe, AttachmentManager: ai, AttachmentPiece: ye, Block: De, Composition: ci, Document: je, Editor: pi, HTMLParser: Ke, HTMLSanitizer: ze, LineBreakInsertion: li, LocationMapper: fi, ManagedAttachment: si, Piece: ve, PointMapper: yi, SelectionManager: Ci, SplittableList: Re, StringPiece: Ce, Text: Le, UndoManager: hi });
  var Ei = Object.freeze({ __proto__: null });
  var { lang: Si, css: ki, keyNames: Li } = W;
  var Di = function(t2) {
    return function() {
      const e2 = t2.apply(this, arguments);
      e2.do(), this.undos || (this.undos = []), this.undos.push(e2.undo);
    };
  };
  var wi = class extends U {
    constructor(t2, e2, i2) {
      let n2 = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {};
      super(...arguments), be(this, "makeElementMutable", Di(() => ({ do: () => {
        this.element.dataset.trixMutable = true;
      }, undo: () => delete this.element.dataset.trixMutable }))), be(this, "addToolbar", Di(() => {
        const t3 = C({ tagName: "div", className: ki.attachmentToolbar, data: { trixMutable: true }, childNodes: C({ tagName: "div", className: "trix-button-row", childNodes: C({ tagName: "span", className: "trix-button-group trix-button-group--actions", childNodes: C({ tagName: "button", className: "trix-button trix-button--remove", textContent: Si.remove, attributes: { title: Si.remove }, data: { trixAction: "remove" } }) }) }) });
        return this.attachment.isPreviewable() && t3.appendChild(C({ tagName: "div", className: ki.attachmentMetadataContainer, childNodes: C({ tagName: "span", className: ki.attachmentMetadata, childNodes: [C({ tagName: "span", className: ki.attachmentName, textContent: this.attachment.getFilename(), attributes: { title: this.attachment.getFilename() } }), C({ tagName: "span", className: ki.attachmentSize, textContent: this.attachment.getFormattedFilesize() })] }) })), d("click", { onElement: t3, withCallback: this.didClickToolbar }), d("click", { onElement: t3, matchingSelector: "[data-trix-action]", withCallback: this.didClickActionButton }), g("trix-attachment-before-toolbar", { onElement: this.element, attributes: { toolbar: t3, attachment: this.attachment } }), { do: () => this.element.appendChild(t3), undo: () => A(t3) };
      })), be(this, "installCaptionEditor", Di(() => {
        const t3 = C({ tagName: "textarea", className: ki.attachmentCaptionEditor, attributes: { placeholder: Si.captionPlaceholder }, data: { trixMutable: true } });
        t3.value = this.attachmentPiece.getCaption();
        const e3 = t3.cloneNode();
        e3.classList.add("trix-autoresize-clone"), e3.tabIndex = -1;
        const i3 = function() {
          e3.value = t3.value, t3.style.height = e3.scrollHeight + "px";
        };
        d("input", { onElement: t3, withCallback: i3 }), d("input", { onElement: t3, withCallback: this.didInputCaption }), d("keydown", { onElement: t3, withCallback: this.didKeyDownCaption }), d("change", { onElement: t3, withCallback: this.didChangeCaption }), d("blur", { onElement: t3, withCallback: this.didBlurCaption });
        const n3 = this.element.querySelector("figcaption"), r2 = n3.cloneNode();
        return { do: () => {
          if (n3.style.display = "none", r2.appendChild(t3), r2.appendChild(e3), r2.classList.add("".concat(ki.attachmentCaption, "--editing")), n3.parentElement.insertBefore(r2, n3), i3(), this.options.editCaption)
            return yt(() => t3.focus());
        }, undo() {
          A(r2), n3.style.display = null;
        } };
      })), this.didClickToolbar = this.didClickToolbar.bind(this), this.didClickActionButton = this.didClickActionButton.bind(this), this.didKeyDownCaption = this.didKeyDownCaption.bind(this), this.didInputCaption = this.didInputCaption.bind(this), this.didChangeCaption = this.didChangeCaption.bind(this), this.didBlurCaption = this.didBlurCaption.bind(this), this.attachmentPiece = t2, this.element = e2, this.container = i2, this.options = n2, this.attachment = this.attachmentPiece.attachment, "a" === y(this.element) && (this.element = this.element.firstChild), this.install();
    }
    install() {
      this.makeElementMutable(), this.addToolbar(), this.attachment.isPreviewable() && this.installCaptionEditor();
    }
    uninstall() {
      var t2;
      let e2 = this.undos.pop();
      for (this.savePendingCaption(); e2; )
        e2(), e2 = this.undos.pop();
      null === (t2 = this.delegate) || void 0 === t2 || t2.didUninstallAttachmentEditor(this);
    }
    savePendingCaption() {
      if (this.pendingCaption) {
        const r2 = this.pendingCaption;
        var t2, e2, i2, n2;
        if (this.pendingCaption = null, r2)
          null === (t2 = this.delegate) || void 0 === t2 || null === (e2 = t2.attachmentEditorDidRequestUpdatingAttributesForAttachment) || void 0 === e2 || e2.call(t2, { caption: r2 }, this.attachment);
        else
          null === (i2 = this.delegate) || void 0 === i2 || null === (n2 = i2.attachmentEditorDidRequestRemovingAttributeForAttachment) || void 0 === n2 || n2.call(i2, "caption", this.attachment);
      }
    }
    didClickToolbar(t2) {
      return t2.preventDefault(), t2.stopPropagation();
    }
    didClickActionButton(t2) {
      var e2;
      if ("remove" === t2.target.getAttribute("data-trix-action"))
        return null === (e2 = this.delegate) || void 0 === e2 ? void 0 : e2.attachmentEditorDidRequestRemovalOfAttachment(this.attachment);
    }
    didKeyDownCaption(t2) {
      var e2, i2;
      if ("return" === Li[t2.keyCode])
        return t2.preventDefault(), this.savePendingCaption(), null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.attachmentEditorDidRequestDeselectingAttachment) || void 0 === i2 ? void 0 : i2.call(e2, this.attachment);
    }
    didInputCaption(t2) {
      this.pendingCaption = t2.target.value.replace(/\s/g, " ").trim();
    }
    didChangeCaption(t2) {
      return this.savePendingCaption();
    }
    didBlurCaption(t2) {
      return this.savePendingCaption();
    }
  };
  var Ti = class extends U {
    constructor(t2, e2) {
      super(...arguments), this.didFocus = this.didFocus.bind(this), this.didBlur = this.didBlur.bind(this), this.didClickAttachment = this.didClickAttachment.bind(this), this.element = t2, this.composition = e2, this.documentView = new ue(this.composition.document, { element: this.element }), d("focus", { onElement: this.element, withCallback: this.didFocus }), d("blur", { onElement: this.element, withCallback: this.didBlur }), d("click", { onElement: this.element, matchingSelector: "a[contenteditable=false]", preventDefault: true }), d("mousedown", { onElement: this.element, matchingSelector: "[data-trix-attachment]", withCallback: this.didClickAttachment }), d("click", { onElement: this.element, matchingSelector: "a".concat("[data-trix-attachment]"), preventDefault: true });
    }
    didFocus(t2) {
      var e2;
      const i2 = () => {
        var t3, e3;
        if (!this.focused)
          return this.focused = true, null === (t3 = this.delegate) || void 0 === t3 || null === (e3 = t3.compositionControllerDidFocus) || void 0 === e3 ? void 0 : e3.call(t3);
      };
      return (null === (e2 = this.blurPromise) || void 0 === e2 ? void 0 : e2.then(i2)) || i2();
    }
    didBlur(t2) {
      this.blurPromise = new Promise((t3) => yt(() => {
        var e2, i2;
        f(this.element) || (this.focused = null, null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionControllerDidBlur) || void 0 === i2 || i2.call(e2));
        return this.blurPromise = null, t3();
      }));
    }
    didClickAttachment(t2, e2) {
      var i2, n2;
      const r2 = this.findAttachmentForElement(e2), o2 = !!p(t2.target, { matchingSelector: "figcaption" });
      return null === (i2 = this.delegate) || void 0 === i2 || null === (n2 = i2.compositionControllerDidSelectAttachment) || void 0 === n2 ? void 0 : n2.call(i2, r2, { editCaption: o2 });
    }
    getSerializableElement() {
      return this.isEditingAttachment() ? this.documentView.shadowElement : this.element;
    }
    render() {
      var t2, e2, i2, n2, r2, o2;
      (this.revision !== this.composition.revision && (this.documentView.setDocument(this.composition.document), this.documentView.render(), this.revision = this.composition.revision), this.canSyncDocumentView() && !this.documentView.isSynced()) && (null === (i2 = this.delegate) || void 0 === i2 || null === (n2 = i2.compositionControllerWillSyncDocumentView) || void 0 === n2 || n2.call(i2), this.documentView.sync(), null === (r2 = this.delegate) || void 0 === r2 || null === (o2 = r2.compositionControllerDidSyncDocumentView) || void 0 === o2 || o2.call(r2));
      return null === (t2 = this.delegate) || void 0 === t2 || null === (e2 = t2.compositionControllerDidRender) || void 0 === e2 ? void 0 : e2.call(t2);
    }
    rerenderViewForObject(t2) {
      return this.invalidateViewForObject(t2), this.render();
    }
    invalidateViewForObject(t2) {
      return this.documentView.invalidateViewForObject(t2);
    }
    isViewCachingEnabled() {
      return this.documentView.isViewCachingEnabled();
    }
    enableViewCaching() {
      return this.documentView.enableViewCaching();
    }
    disableViewCaching() {
      return this.documentView.disableViewCaching();
    }
    refreshViewCache() {
      return this.documentView.garbageCollectCachedViews();
    }
    isEditingAttachment() {
      return !!this.attachmentEditor;
    }
    installAttachmentEditorForAttachment(t2, e2) {
      var i2;
      if ((null === (i2 = this.attachmentEditor) || void 0 === i2 ? void 0 : i2.attachment) === t2)
        return;
      const n2 = this.documentView.findElementForObject(t2);
      if (!n2)
        return;
      this.uninstallAttachmentEditor();
      const r2 = this.composition.document.getAttachmentPieceForAttachment(t2);
      this.attachmentEditor = new wi(r2, n2, this.element, e2), this.attachmentEditor.delegate = this;
    }
    uninstallAttachmentEditor() {
      var t2;
      return null === (t2 = this.attachmentEditor) || void 0 === t2 ? void 0 : t2.uninstall();
    }
    didUninstallAttachmentEditor() {
      return this.attachmentEditor = null, this.render();
    }
    attachmentEditorDidRequestUpdatingAttributesForAttachment(t2, e2) {
      var i2, n2;
      return null === (i2 = this.delegate) || void 0 === i2 || null === (n2 = i2.compositionControllerWillUpdateAttachment) || void 0 === n2 || n2.call(i2, e2), this.composition.updateAttributesForAttachment(t2, e2);
    }
    attachmentEditorDidRequestRemovingAttributeForAttachment(t2, e2) {
      var i2, n2;
      return null === (i2 = this.delegate) || void 0 === i2 || null === (n2 = i2.compositionControllerWillUpdateAttachment) || void 0 === n2 || n2.call(i2, e2), this.composition.removeAttributeForAttachment(t2, e2);
    }
    attachmentEditorDidRequestRemovalOfAttachment(t2) {
      var e2, i2;
      return null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionControllerDidRequestRemovalOfAttachment) || void 0 === i2 ? void 0 : i2.call(e2, t2);
    }
    attachmentEditorDidRequestDeselectingAttachment(t2) {
      var e2, i2;
      return null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.compositionControllerDidRequestDeselectingAttachment) || void 0 === i2 ? void 0 : i2.call(e2, t2);
    }
    canSyncDocumentView() {
      return !this.isEditingAttachment();
    }
    findAttachmentForElement(t2) {
      return this.composition.document.getAttachmentById(parseInt(t2.dataset.trixId, 10));
    }
  };
  var Fi = class extends U {
  };
  var Bi = "[".concat("data-trix-mutable", "]");
  var Ii = { attributes: true, childList: true, characterData: true, characterDataOldValue: true, subtree: true };
  var Pi = class extends U {
    constructor(t2) {
      super(t2), this.didMutate = this.didMutate.bind(this), this.element = t2, this.observer = new window.MutationObserver(this.didMutate), this.start();
    }
    start() {
      return this.reset(), this.observer.observe(this.element, Ii);
    }
    stop() {
      return this.observer.disconnect();
    }
    didMutate(t2) {
      var e2, i2;
      if (this.mutations.push(...Array.from(this.findSignificantMutations(t2) || [])), this.mutations.length)
        return null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.elementDidMutate) || void 0 === i2 || i2.call(e2, this.getMutationSummary()), this.reset();
    }
    reset() {
      this.mutations = [];
    }
    findSignificantMutations(t2) {
      return t2.filter((t3) => this.mutationIsSignificant(t3));
    }
    mutationIsSignificant(t2) {
      if (this.nodeIsMutable(t2.target))
        return false;
      for (const e2 of Array.from(this.nodesModifiedByMutation(t2)))
        if (this.nodeIsSignificant(e2))
          return true;
      return false;
    }
    nodeIsSignificant(t2) {
      return t2 !== this.element && !this.nodeIsMutable(t2) && !B(t2);
    }
    nodeIsMutable(t2) {
      return p(t2, { matchingSelector: Bi });
    }
    nodesModifiedByMutation(t2) {
      const e2 = [];
      switch (t2.type) {
        case "attributes":
          "data-trix-mutable" !== t2.attributeName && e2.push(t2.target);
          break;
        case "characterData":
          e2.push(t2.target.parentNode), e2.push(t2.target);
          break;
        case "childList":
          e2.push(...Array.from(t2.addedNodes || [])), e2.push(...Array.from(t2.removedNodes || []));
      }
      return e2;
    }
    getMutationSummary() {
      return this.getTextMutationSummary();
    }
    getTextMutationSummary() {
      const { additions: t2, deletions: e2 } = this.getTextChangesFromCharacterData(), i2 = this.getTextChangesFromChildList();
      Array.from(i2.additions).forEach((e3) => {
        Array.from(t2).includes(e3) || t2.push(e3);
      }), e2.push(...Array.from(i2.deletions || []));
      const n2 = {}, r2 = t2.join("");
      r2 && (n2.textAdded = r2);
      const o2 = e2.join("");
      return o2 && (n2.textDeleted = o2), n2;
    }
    getMutationsByType(t2) {
      return Array.from(this.mutations).filter((e2) => e2.type === t2);
    }
    getTextChangesFromChildList() {
      let t2, e2;
      const i2 = [], n2 = [];
      Array.from(this.getMutationsByType("childList")).forEach((t3) => {
        i2.push(...Array.from(t3.addedNodes || [])), n2.push(...Array.from(t3.removedNodes || []));
      });
      0 === i2.length && 1 === n2.length && D(n2[0]) ? (t2 = [], e2 = ["\n"]) : (t2 = Ni(i2), e2 = Ni(n2));
      return { additions: t2.filter((t3, i3) => t3 !== e2[i3]).map(Mt), deletions: e2.filter((e3, i3) => e3 !== t2[i3]).map(Mt) };
    }
    getTextChangesFromCharacterData() {
      let t2, e2;
      const i2 = this.getMutationsByType("characterData");
      if (i2.length) {
        const n2 = i2[0], r2 = i2[i2.length - 1], o2 = function(t3, e3) {
          let i3, n3;
          return t3 = K.box(t3), (e3 = K.box(e3)).length < t3.length ? [n3, i3] = Ut(t3, e3) : [i3, n3] = Ut(e3, t3), { added: i3, removed: n3 };
        }(Mt(n2.oldValue), Mt(r2.target.data));
        t2 = o2.added, e2 = o2.removed;
      }
      return { additions: t2 ? [t2] : [], deletions: e2 ? [e2] : [] };
    }
  };
  var Ni = function() {
    let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
    const e2 = [];
    for (const i2 of Array.from(t2))
      switch (i2.nodeType) {
        case Node.TEXT_NODE:
          e2.push(i2.data);
          break;
        case Node.ELEMENT_NODE:
          "br" === y(i2) ? e2.push("\n") : e2.push(...Array.from(Ni(i2.childNodes) || []));
      }
    return e2;
  };
  var Oi = class extends Qt {
    constructor(t2) {
      super(...arguments), this.file = t2;
    }
    perform(t2) {
      const e2 = new FileReader();
      return e2.onerror = () => t2(false), e2.onload = () => {
        e2.onerror = null;
        try {
          e2.abort();
        } catch (t3) {
        }
        return t2(true, this.file);
      }, e2.readAsArrayBuffer(this.file);
    }
  };
  var Mi = class {
    constructor(t2) {
      this.element = t2;
    }
    shouldIgnore(t2) {
      return !!o.samsungAndroid && (this.previousEvent = this.event, this.event = t2, this.checkSamsungKeyboardBuggyModeStart(), this.checkSamsungKeyboardBuggyModeEnd(), this.buggyMode);
    }
    checkSamsungKeyboardBuggyModeStart() {
      this.insertingLongTextAfterUnidentifiedChar() && ji(this.element.innerText, this.event.data) && (this.buggyMode = true, this.event.preventDefault());
    }
    checkSamsungKeyboardBuggyModeEnd() {
      this.buggyMode && "insertText" !== this.event.inputType && (this.buggyMode = false);
    }
    insertingLongTextAfterUnidentifiedChar() {
      var t2;
      return this.isBeforeInputInsertText() && this.previousEventWasUnidentifiedKeydown() && (null === (t2 = this.event.data) || void 0 === t2 ? void 0 : t2.length) > 50;
    }
    isBeforeInputInsertText() {
      return "beforeinput" === this.event.type && "insertText" === this.event.inputType;
    }
    previousEventWasUnidentifiedKeydown() {
      var t2, e2;
      return "keydown" === (null === (t2 = this.previousEvent) || void 0 === t2 ? void 0 : t2.type) && "Unidentified" === (null === (e2 = this.previousEvent) || void 0 === e2 ? void 0 : e2.key);
    }
  };
  var ji = (t2, e2) => Ui(t2) === Ui(e2);
  var Wi = new RegExp("(".concat("\uFFFC", "|").concat("\uFEFF", "|").concat("\xA0", "|\\s)+"), "g");
  var Ui = (t2) => t2.replace(Wi, " ").trim();
  var qi = class extends U {
    constructor(t2) {
      super(...arguments), this.element = t2, this.mutationObserver = new Pi(this.element), this.mutationObserver.delegate = this, this.flakyKeyboardDetector = new Mi(this.element);
      for (const t3 in this.constructor.events)
        d(t3, { onElement: this.element, withCallback: this.handlerFor(t3) });
    }
    elementDidMutate(t2) {
    }
    editorWillSyncDocumentView() {
      return this.mutationObserver.stop();
    }
    editorDidSyncDocumentView() {
      return this.mutationObserver.start();
    }
    requestRender() {
      var t2, e2;
      return null === (t2 = this.delegate) || void 0 === t2 || null === (e2 = t2.inputControllerDidRequestRender) || void 0 === e2 ? void 0 : e2.call(t2);
    }
    requestReparse() {
      var t2, e2;
      return null === (t2 = this.delegate) || void 0 === t2 || null === (e2 = t2.inputControllerDidRequestReparse) || void 0 === e2 || e2.call(t2), this.requestRender();
    }
    attachFiles(t2) {
      const e2 = Array.from(t2).map((t3) => new Oi(t3));
      return Promise.all(e2).then((t3) => {
        this.handleInput(function() {
          var e3, i2;
          return null === (e3 = this.delegate) || void 0 === e3 || e3.inputControllerWillAttachFiles(), null === (i2 = this.responder) || void 0 === i2 || i2.insertFiles(t3), this.requestRender();
        });
      });
    }
    handlerFor(t2) {
      return (e2) => {
        e2.defaultPrevented || this.handleInput(() => {
          if (!f(this.element)) {
            if (this.flakyKeyboardDetector.shouldIgnore(e2))
              return;
            this.eventName = t2, this.constructor.events[t2].call(this, e2);
          }
        });
      };
    }
    handleInput(t2) {
      try {
        var e2;
        null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillHandleInput(), t2.call(this);
      } finally {
        var i2;
        null === (i2 = this.delegate) || void 0 === i2 || i2.inputControllerDidHandleInput();
      }
    }
    createLinkHTML(t2, e2) {
      const i2 = document.createElement("a");
      return i2.href = t2, i2.textContent = e2 || t2, i2.outerHTML;
    }
  };
  var Vi;
  be(qi, "events", {});
  var { browser: zi, keyNames: _i } = W;
  var Hi = 0;
  var Ji = class extends qi {
    constructor() {
      super(...arguments), this.resetInputSummary();
    }
    setInputSummary() {
      let t2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
      this.inputSummary.eventName = this.eventName;
      for (const e2 in t2) {
        const i2 = t2[e2];
        this.inputSummary[e2] = i2;
      }
      return this.inputSummary;
    }
    resetInputSummary() {
      this.inputSummary = {};
    }
    reset() {
      return this.resetInputSummary(), Ft.reset();
    }
    elementDidMutate(t2) {
      var e2, i2;
      return this.isComposing() ? null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.inputControllerDidAllowUnhandledInput) || void 0 === i2 ? void 0 : i2.call(e2) : this.handleInput(function() {
        return this.mutationIsSignificant(t2) && (this.mutationIsExpected(t2) ? this.requestRender() : this.requestReparse()), this.reset();
      });
    }
    mutationIsExpected(t2) {
      let { textAdded: e2, textDeleted: i2 } = t2;
      if (this.inputSummary.preferDocument)
        return true;
      const n2 = null != e2 ? e2 === this.inputSummary.textAdded : !this.inputSummary.textAdded, r2 = null != i2 ? this.inputSummary.didDelete : !this.inputSummary.didDelete, o2 = ["\n", " \n"].includes(e2) && !n2, s2 = "\n" === i2 && !r2;
      if (o2 && !s2 || s2 && !o2) {
        const t3 = this.getSelectedRange();
        if (t3) {
          var a2;
          const i3 = o2 ? e2.replace(/\n$/, "").length || -1 : (null == e2 ? void 0 : e2.length) || 1;
          if (null !== (a2 = this.responder) && void 0 !== a2 && a2.positionIsBlockBreak(t3[1] + i3))
            return true;
        }
      }
      return n2 && r2;
    }
    mutationIsSignificant(t2) {
      var e2;
      const i2 = Object.keys(t2).length > 0, n2 = "" === (null === (e2 = this.compositionInput) || void 0 === e2 ? void 0 : e2.getEndData());
      return i2 || !n2;
    }
    getCompositionInput() {
      if (this.isComposing())
        return this.compositionInput;
      this.compositionInput = new Yi(this);
    }
    isComposing() {
      return this.compositionInput && !this.compositionInput.isEnded();
    }
    deleteInDirection(t2, e2) {
      var i2;
      return false !== (null === (i2 = this.responder) || void 0 === i2 ? void 0 : i2.deleteInDirection(t2)) ? this.setInputSummary({ didDelete: true }) : e2 ? (e2.preventDefault(), this.requestRender()) : void 0;
    }
    serializeSelectionToDataTransfer(t2) {
      var e2;
      if (!function(t3) {
        if (null == t3 || !t3.setData)
          return false;
        for (const e3 in vt) {
          const i3 = vt[e3];
          try {
            if (t3.setData(e3, i3), !t3.getData(e3) === i3)
              return false;
          } catch (t4) {
            return false;
          }
        }
        return true;
      }(t2))
        return;
      const i2 = null === (e2 = this.responder) || void 0 === e2 ? void 0 : e2.getSelectedDocument().toSerializableDocument();
      return t2.setData("application/x-trix-document", JSON.stringify(i2)), t2.setData("text/html", ue.render(i2).innerHTML), t2.setData("text/plain", i2.toString().replace(/\n$/, "")), true;
    }
    canAcceptDataTransfer(t2) {
      const e2 = {};
      return Array.from((null == t2 ? void 0 : t2.types) || []).forEach((t3) => {
        e2[t3] = true;
      }), e2.Files || e2["application/x-trix-document"] || e2["text/html"] || e2["text/plain"];
    }
    getPastedHTMLUsingHiddenElement(t2) {
      const e2 = this.getSelectedRange(), i2 = { position: "absolute", left: "".concat(window.pageXOffset, "px"), top: "".concat(window.pageYOffset, "px"), opacity: 0 }, n2 = C({ style: i2, tagName: "div", editable: true });
      return document.body.appendChild(n2), n2.focus(), requestAnimationFrame(() => {
        const i3 = n2.innerHTML;
        return A(n2), this.setSelectedRange(e2), t2(i3);
      });
    }
  };
  be(Ji, "events", { keydown(t2) {
    this.isComposing() || this.resetInputSummary(), this.inputSummary.didInput = true;
    const e2 = _i[t2.keyCode];
    if (e2) {
      var i2;
      let n3 = this.keys;
      ["ctrl", "alt", "shift", "meta"].forEach((e3) => {
        var i3;
        t2["".concat(e3, "Key")] && ("ctrl" === e3 && (e3 = "control"), n3 = null === (i3 = n3) || void 0 === i3 ? void 0 : i3[e3]);
      }), null != (null === (i2 = n3) || void 0 === i2 ? void 0 : i2[e2]) && (this.setInputSummary({ keyName: e2 }), Ft.reset(), n3[e2].call(this, t2));
    }
    if (xt(t2)) {
      const e3 = String.fromCharCode(t2.keyCode).toLowerCase();
      if (e3) {
        var n2;
        const i3 = ["alt", "shift"].map((e4) => {
          if (t2["".concat(e4, "Key")])
            return e4;
        }).filter((t3) => t3);
        i3.push(e3), null !== (n2 = this.delegate) && void 0 !== n2 && n2.inputControllerDidReceiveKeyboardCommand(i3) && t2.preventDefault();
      }
    }
  }, keypress(t2) {
    if (null != this.inputSummary.eventName)
      return;
    if (t2.metaKey)
      return;
    if (t2.ctrlKey && !t2.altKey)
      return;
    const e2 = $i(t2);
    var i2, n2;
    return e2 ? (null === (i2 = this.delegate) || void 0 === i2 || i2.inputControllerWillPerformTyping(), null === (n2 = this.responder) || void 0 === n2 || n2.insertString(e2), this.setInputSummary({ textAdded: e2, didDelete: this.selectionIsExpanded() })) : void 0;
  }, textInput(t2) {
    const { data: e2 } = t2, { textAdded: i2 } = this.inputSummary;
    if (i2 && i2 !== e2 && i2.toUpperCase() === e2) {
      var n2;
      const t3 = this.getSelectedRange();
      return this.setSelectedRange([t3[0], t3[1] + i2.length]), null === (n2 = this.responder) || void 0 === n2 || n2.insertString(e2), this.setInputSummary({ textAdded: e2 }), this.setSelectedRange(t3);
    }
  }, dragenter(t2) {
    t2.preventDefault();
  }, dragstart(t2) {
    var e2, i2;
    return this.serializeSelectionToDataTransfer(t2.dataTransfer), this.draggedRange = this.getSelectedRange(), null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.inputControllerDidStartDrag) || void 0 === i2 ? void 0 : i2.call(e2);
  }, dragover(t2) {
    if (this.draggedRange || this.canAcceptDataTransfer(t2.dataTransfer)) {
      t2.preventDefault();
      const n2 = { x: t2.clientX, y: t2.clientY };
      var e2, i2;
      if (!Rt(n2, this.draggingPoint))
        return this.draggingPoint = n2, null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.inputControllerDidReceiveDragOverPoint) || void 0 === i2 ? void 0 : i2.call(e2, this.draggingPoint);
    }
  }, dragend(t2) {
    var e2, i2;
    null === (e2 = this.delegate) || void 0 === e2 || null === (i2 = e2.inputControllerDidCancelDrag) || void 0 === i2 || i2.call(e2), this.draggedRange = null, this.draggingPoint = null;
  }, drop(t2) {
    var e2, i2;
    t2.preventDefault();
    const n2 = null === (e2 = t2.dataTransfer) || void 0 === e2 ? void 0 : e2.files, r2 = t2.dataTransfer.getData("application/x-trix-document"), o2 = { x: t2.clientX, y: t2.clientY };
    if (null === (i2 = this.responder) || void 0 === i2 || i2.setLocationRangeFromPointRange(o2), null != n2 && n2.length)
      this.attachFiles(n2);
    else if (this.draggedRange) {
      var s2, a2;
      null === (s2 = this.delegate) || void 0 === s2 || s2.inputControllerWillMoveText(), null === (a2 = this.responder) || void 0 === a2 || a2.moveTextFromRange(this.draggedRange), this.draggedRange = null, this.requestRender();
    } else if (r2) {
      var l2;
      const t3 = je.fromJSONString(r2);
      null === (l2 = this.responder) || void 0 === l2 || l2.insertDocument(t3), this.requestRender();
    }
    this.draggedRange = null, this.draggingPoint = null;
  }, cut(t2) {
    var e2, i2;
    if (null !== (e2 = this.responder) && void 0 !== e2 && e2.selectionIsExpanded() && (this.serializeSelectionToDataTransfer(t2.clipboardData) && t2.preventDefault(), null === (i2 = this.delegate) || void 0 === i2 || i2.inputControllerWillCutText(), this.deleteInDirection("backward"), t2.defaultPrevented))
      return this.requestRender();
  }, copy(t2) {
    var e2;
    null !== (e2 = this.responder) && void 0 !== e2 && e2.selectionIsExpanded() && this.serializeSelectionToDataTransfer(t2.clipboardData) && t2.preventDefault();
  }, paste(t2) {
    const e2 = t2.clipboardData || t2.testClipboardData, i2 = { clipboard: e2 };
    if (!e2 || Xi(t2))
      return void this.getPastedHTMLUsingHiddenElement((t3) => {
        var e3, n3, r3;
        return i2.type = "text/html", i2.html = t3, null === (e3 = this.delegate) || void 0 === e3 || e3.inputControllerWillPaste(i2), null === (n3 = this.responder) || void 0 === n3 || n3.insertHTML(i2.html), this.requestRender(), null === (r3 = this.delegate) || void 0 === r3 ? void 0 : r3.inputControllerDidPaste(i2);
      });
    const n2 = e2.getData("URL"), r2 = e2.getData("text/html"), o2 = e2.getData("public.url-name");
    if (n2) {
      var s2, a2, l2;
      let t3;
      i2.type = "text/html", t3 = o2 ? Wt(o2).trim() : n2, i2.html = this.createLinkHTML(n2, t3), null === (s2 = this.delegate) || void 0 === s2 || s2.inputControllerWillPaste(i2), this.setInputSummary({ textAdded: t3, didDelete: this.selectionIsExpanded() }), null === (a2 = this.responder) || void 0 === a2 || a2.insertHTML(i2.html), this.requestRender(), null === (l2 = this.delegate) || void 0 === l2 || l2.inputControllerDidPaste(i2);
    } else if (At(e2)) {
      var c2, h2, u2;
      i2.type = "text/plain", i2.string = e2.getData("text/plain"), null === (c2 = this.delegate) || void 0 === c2 || c2.inputControllerWillPaste(i2), this.setInputSummary({ textAdded: i2.string, didDelete: this.selectionIsExpanded() }), null === (h2 = this.responder) || void 0 === h2 || h2.insertString(i2.string), this.requestRender(), null === (u2 = this.delegate) || void 0 === u2 || u2.inputControllerDidPaste(i2);
    } else if (r2) {
      var d2, g2, m2;
      i2.type = "text/html", i2.html = r2, null === (d2 = this.delegate) || void 0 === d2 || d2.inputControllerWillPaste(i2), null === (g2 = this.responder) || void 0 === g2 || g2.insertHTML(i2.html), this.requestRender(), null === (m2 = this.delegate) || void 0 === m2 || m2.inputControllerDidPaste(i2);
    } else if (Array.from(e2.types).includes("Files")) {
      var p2, f2, b2;
      const t3 = null === (p2 = e2.items) || void 0 === p2 || null === (f2 = p2[0]) || void 0 === f2 || null === (b2 = f2.getAsFile) || void 0 === b2 ? void 0 : b2.call(f2);
      if (t3) {
        var v2, A2, x2;
        const e3 = Ki(t3);
        !t3.name && e3 && (t3.name = "pasted-file-".concat(++Hi, ".").concat(e3)), i2.type = "File", i2.file = t3, null === (v2 = this.delegate) || void 0 === v2 || v2.inputControllerWillAttachFiles(), null === (A2 = this.responder) || void 0 === A2 || A2.insertFile(i2.file), this.requestRender(), null === (x2 = this.delegate) || void 0 === x2 || x2.inputControllerDidPaste(i2);
      }
    }
    t2.preventDefault();
  }, compositionstart(t2) {
    return this.getCompositionInput().start(t2.data);
  }, compositionupdate(t2) {
    return this.getCompositionInput().update(t2.data);
  }, compositionend(t2) {
    return this.getCompositionInput().end(t2.data);
  }, beforeinput(t2) {
    this.inputSummary.didInput = true;
  }, input(t2) {
    return this.inputSummary.didInput = true, t2.stopPropagation();
  } }), be(Ji, "keys", { backspace(t2) {
    var e2;
    return null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), this.deleteInDirection("backward", t2);
  }, delete(t2) {
    var e2;
    return null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), this.deleteInDirection("forward", t2);
  }, return(t2) {
    var e2, i2;
    return this.setInputSummary({ preferDocument: true }), null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), null === (i2 = this.responder) || void 0 === i2 ? void 0 : i2.insertLineBreak();
  }, tab(t2) {
    var e2, i2;
    null !== (e2 = this.responder) && void 0 !== e2 && e2.canIncreaseNestingLevel() && (null === (i2 = this.responder) || void 0 === i2 || i2.increaseNestingLevel(), this.requestRender(), t2.preventDefault());
  }, left(t2) {
    var e2;
    if (this.selectionIsInCursorTarget())
      return t2.preventDefault(), null === (e2 = this.responder) || void 0 === e2 ? void 0 : e2.moveCursorInDirection("backward");
  }, right(t2) {
    var e2;
    if (this.selectionIsInCursorTarget())
      return t2.preventDefault(), null === (e2 = this.responder) || void 0 === e2 ? void 0 : e2.moveCursorInDirection("forward");
  }, control: { d(t2) {
    var e2;
    return null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), this.deleteInDirection("forward", t2);
  }, h(t2) {
    var e2;
    return null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), this.deleteInDirection("backward", t2);
  }, o(t2) {
    var e2, i2;
    return t2.preventDefault(), null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), null === (i2 = this.responder) || void 0 === i2 || i2.insertString("\n", { updatePosition: false }), this.requestRender();
  } }, shift: { return(t2) {
    var e2, i2;
    null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), null === (i2 = this.responder) || void 0 === i2 || i2.insertString("\n"), this.requestRender(), t2.preventDefault();
  }, tab(t2) {
    var e2, i2;
    null !== (e2 = this.responder) && void 0 !== e2 && e2.canDecreaseNestingLevel() && (null === (i2 = this.responder) || void 0 === i2 || i2.decreaseNestingLevel(), this.requestRender(), t2.preventDefault());
  }, left(t2) {
    if (this.selectionIsInCursorTarget())
      return t2.preventDefault(), this.expandSelectionInDirection("backward");
  }, right(t2) {
    if (this.selectionIsInCursorTarget())
      return t2.preventDefault(), this.expandSelectionInDirection("forward");
  } }, alt: { backspace(t2) {
    var e2;
    return this.setInputSummary({ preferDocument: false }), null === (e2 = this.delegate) || void 0 === e2 ? void 0 : e2.inputControllerWillPerformTyping();
  } }, meta: { backspace(t2) {
    var e2;
    return this.setInputSummary({ preferDocument: false }), null === (e2 = this.delegate) || void 0 === e2 ? void 0 : e2.inputControllerWillPerformTyping();
  } } }), Ji.proxyMethod("responder?.getSelectedRange"), Ji.proxyMethod("responder?.setSelectedRange"), Ji.proxyMethod("responder?.expandSelectionInDirection"), Ji.proxyMethod("responder?.selectionIsInCursorTarget"), Ji.proxyMethod("responder?.selectionIsExpanded");
  var Ki = (t2) => {
    var e2, i2;
    return null === (e2 = t2.type) || void 0 === e2 || null === (i2 = e2.match(/\/(\w+)$/)) || void 0 === i2 ? void 0 : i2[1];
  };
  var Gi = !(null === (Vi = " ".codePointAt) || void 0 === Vi || !Vi.call(" ", 0));
  var $i = function(t2) {
    if (t2.key && Gi && t2.key.codePointAt(0) === t2.keyCode)
      return t2.key;
    {
      let e2;
      if (null === t2.which ? e2 = t2.keyCode : 0 !== t2.which && 0 !== t2.charCode && (e2 = t2.charCode), null != e2 && "escape" !== _i[e2])
        return K.fromCodepoints([e2]).toString();
    }
  };
  var Xi = function(t2) {
    const e2 = t2.clipboardData;
    if (e2) {
      if (e2.types.includes("text/html")) {
        for (const t3 of e2.types) {
          const i2 = /^CorePasteboardFlavorType/.test(t3), n2 = /^dyn\./.test(t3) && e2.getData(t3);
          if (i2 || n2)
            return true;
        }
        return false;
      }
      {
        const t3 = e2.types.includes("com.apple.webarchive"), i2 = e2.types.includes("com.apple.flat-rtfd");
        return t3 || i2;
      }
    }
  };
  var Yi = class extends U {
    constructor(t2) {
      super(...arguments), this.inputController = t2, this.responder = this.inputController.responder, this.delegate = this.inputController.delegate, this.inputSummary = this.inputController.inputSummary, this.data = {};
    }
    start(t2) {
      if (this.data.start = t2, this.isSignificant()) {
        var e2, i2;
        if ("keypress" === this.inputSummary.eventName && this.inputSummary.textAdded)
          null === (i2 = this.responder) || void 0 === i2 || i2.deleteInDirection("left");
        this.selectionIsExpanded() || (this.insertPlaceholder(), this.requestRender()), this.range = null === (e2 = this.responder) || void 0 === e2 ? void 0 : e2.getSelectedRange();
      }
    }
    update(t2) {
      if (this.data.update = t2, this.isSignificant()) {
        const t3 = this.selectPlaceholder();
        t3 && (this.forgetPlaceholder(), this.range = t3);
      }
    }
    end(t2) {
      return this.data.end = t2, this.isSignificant() ? (this.forgetPlaceholder(), this.canApplyToDocument() ? (this.setInputSummary({ preferDocument: true, didInput: false }), null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), null === (i2 = this.responder) || void 0 === i2 || i2.setSelectedRange(this.range), null === (n2 = this.responder) || void 0 === n2 || n2.insertString(this.data.end), null === (r2 = this.responder) || void 0 === r2 ? void 0 : r2.setSelectedRange(this.range[0] + this.data.end.length)) : null != this.data.start || null != this.data.update ? (this.requestReparse(), this.inputController.reset()) : void 0) : this.inputController.reset();
      var e2, i2, n2, r2;
    }
    getEndData() {
      return this.data.end;
    }
    isEnded() {
      return null != this.getEndData();
    }
    isSignificant() {
      return !zi.composesExistingText || this.inputSummary.didInput;
    }
    canApplyToDocument() {
      var t2, e2;
      return 0 === (null === (t2 = this.data.start) || void 0 === t2 ? void 0 : t2.length) && (null === (e2 = this.data.end) || void 0 === e2 ? void 0 : e2.length) > 0 && this.range;
    }
  };
  Yi.proxyMethod("inputController.setInputSummary"), Yi.proxyMethod("inputController.requestRender"), Yi.proxyMethod("inputController.requestReparse"), Yi.proxyMethod("responder?.selectionIsExpanded"), Yi.proxyMethod("responder?.insertPlaceholder"), Yi.proxyMethod("responder?.selectPlaceholder"), Yi.proxyMethod("responder?.forgetPlaceholder");
  var Qi = class extends qi {
    constructor() {
      super(...arguments), this.render = this.render.bind(this);
    }
    elementDidMutate() {
      return this.scheduledRender ? this.composing ? null === (t2 = this.delegate) || void 0 === t2 || null === (e2 = t2.inputControllerDidAllowUnhandledInput) || void 0 === e2 ? void 0 : e2.call(t2) : void 0 : this.reparse();
      var t2, e2;
    }
    scheduleRender() {
      return this.scheduledRender ? this.scheduledRender : this.scheduledRender = requestAnimationFrame(this.render);
    }
    render() {
      var t2, e2;
      (cancelAnimationFrame(this.scheduledRender), this.scheduledRender = null, this.composing) || (null === (e2 = this.delegate) || void 0 === e2 || e2.render());
      null === (t2 = this.afterRender) || void 0 === t2 || t2.call(this), this.afterRender = null;
    }
    reparse() {
      var t2;
      return null === (t2 = this.delegate) || void 0 === t2 ? void 0 : t2.reparse();
    }
    insertString() {
      var t2;
      let e2 = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "", i2 = arguments.length > 1 ? arguments[1] : void 0;
      return null === (t2 = this.delegate) || void 0 === t2 || t2.inputControllerWillPerformTyping(), this.withTargetDOMRange(function() {
        var t3;
        return null === (t3 = this.responder) || void 0 === t3 ? void 0 : t3.insertString(e2, i2);
      });
    }
    toggleAttributeIfSupported(t2) {
      var e2;
      if (ct().includes(t2))
        return null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformFormatting(t2), this.withTargetDOMRange(function() {
          var e3;
          return null === (e3 = this.responder) || void 0 === e3 ? void 0 : e3.toggleCurrentAttribute(t2);
        });
    }
    activateAttributeIfSupported(t2, e2) {
      var i2;
      if (ct().includes(t2))
        return null === (i2 = this.delegate) || void 0 === i2 || i2.inputControllerWillPerformFormatting(t2), this.withTargetDOMRange(function() {
          var i3;
          return null === (i3 = this.responder) || void 0 === i3 ? void 0 : i3.setCurrentAttribute(t2, e2);
        });
    }
    deleteInDirection(t2) {
      let { recordUndoEntry: e2 } = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : { recordUndoEntry: true };
      var i2;
      e2 && (null === (i2 = this.delegate) || void 0 === i2 || i2.inputControllerWillPerformTyping());
      const n2 = () => {
        var e3;
        return null === (e3 = this.responder) || void 0 === e3 ? void 0 : e3.deleteInDirection(t2);
      }, r2 = this.getTargetDOMRange({ minLength: 2 });
      return r2 ? this.withTargetDOMRange(r2, n2) : n2();
    }
    withTargetDOMRange(t2, e2) {
      var i2;
      return "function" == typeof t2 && (e2 = t2, t2 = this.getTargetDOMRange()), t2 ? null === (i2 = this.responder) || void 0 === i2 ? void 0 : i2.withTargetDOMRange(t2, e2.bind(this)) : (Ft.reset(), e2.call(this));
    }
    getTargetDOMRange() {
      var t2, e2;
      let { minLength: i2 } = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : { minLength: 0 };
      const n2 = null === (t2 = (e2 = this.event).getTargetRanges) || void 0 === t2 ? void 0 : t2.call(e2);
      if (n2 && n2.length) {
        const t3 = Zi(n2[0]);
        if (0 === i2 || t3.toString().length >= i2)
          return t3;
      }
    }
    withEvent(t2, e2) {
      let i2;
      this.event = t2;
      try {
        i2 = e2.call(this);
      } finally {
        this.event = null;
      }
      return i2;
    }
  };
  be(Qi, "events", { keydown(t2) {
    if (xt(t2)) {
      var e2;
      const i2 = rn(t2);
      null !== (e2 = this.delegate) && void 0 !== e2 && e2.inputControllerDidReceiveKeyboardCommand(i2) && t2.preventDefault();
    } else {
      let e3 = t2.key;
      t2.altKey && (e3 += "+Alt"), t2.shiftKey && (e3 += "+Shift");
      const i2 = this.constructor.keys[e3];
      if (i2)
        return this.withEvent(t2, i2);
    }
  }, paste(t2) {
    var e2;
    let i2;
    const n2 = null === (e2 = t2.clipboardData) || void 0 === e2 ? void 0 : e2.getData("URL");
    return en(t2) ? (t2.preventDefault(), this.attachFiles(t2.clipboardData.files)) : nn(t2) ? (t2.preventDefault(), i2 = { type: "text/plain", string: t2.clipboardData.getData("text/plain") }, null === (r2 = this.delegate) || void 0 === r2 || r2.inputControllerWillPaste(i2), null === (o2 = this.responder) || void 0 === o2 || o2.insertString(i2.string), this.render(), null === (s2 = this.delegate) || void 0 === s2 ? void 0 : s2.inputControllerDidPaste(i2)) : n2 ? (t2.preventDefault(), i2 = { type: "text/html", html: this.createLinkHTML(n2) }, null === (a2 = this.delegate) || void 0 === a2 || a2.inputControllerWillPaste(i2), null === (l2 = this.responder) || void 0 === l2 || l2.insertHTML(i2.html), this.render(), null === (c2 = this.delegate) || void 0 === c2 ? void 0 : c2.inputControllerDidPaste(i2)) : void 0;
    var r2, o2, s2, a2, l2, c2;
  }, beforeinput(t2) {
    const e2 = this.constructor.inputTypes[t2.inputType];
    e2 && (this.withEvent(t2, e2), this.scheduleRender());
  }, input(t2) {
    Ft.reset();
  }, dragstart(t2) {
    var e2, i2;
    null !== (e2 = this.responder) && void 0 !== e2 && e2.selectionContainsAttachments() && (t2.dataTransfer.setData("application/x-trix-dragging", true), this.dragging = { range: null === (i2 = this.responder) || void 0 === i2 ? void 0 : i2.getSelectedRange(), point: on(t2) });
  }, dragenter(t2) {
    tn(t2) && t2.preventDefault();
  }, dragover(t2) {
    if (this.dragging) {
      t2.preventDefault();
      const i2 = on(t2);
      var e2;
      if (!Rt(i2, this.dragging.point))
        return this.dragging.point = i2, null === (e2 = this.responder) || void 0 === e2 ? void 0 : e2.setLocationRangeFromPointRange(i2);
    } else
      tn(t2) && t2.preventDefault();
  }, drop(t2) {
    var e2, i2;
    if (this.dragging)
      return t2.preventDefault(), null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillMoveText(), null === (i2 = this.responder) || void 0 === i2 || i2.moveTextFromRange(this.dragging.range), this.dragging = null, this.scheduleRender();
    if (tn(t2)) {
      var n2;
      t2.preventDefault();
      const e3 = on(t2);
      return null === (n2 = this.responder) || void 0 === n2 || n2.setLocationRangeFromPointRange(e3), this.attachFiles(t2.dataTransfer.files);
    }
  }, dragend() {
    var t2;
    this.dragging && (null === (t2 = this.responder) || void 0 === t2 || t2.setSelectedRange(this.dragging.range), this.dragging = null);
  }, compositionend(t2) {
    this.composing && (this.composing = false, o.recentAndroid || this.scheduleRender());
  } }), be(Qi, "keys", { ArrowLeft() {
    var t2, e2;
    if (null !== (t2 = this.responder) && void 0 !== t2 && t2.shouldManageMovingCursorInDirection("backward"))
      return this.event.preventDefault(), null === (e2 = this.responder) || void 0 === e2 ? void 0 : e2.moveCursorInDirection("backward");
  }, ArrowRight() {
    var t2, e2;
    if (null !== (t2 = this.responder) && void 0 !== t2 && t2.shouldManageMovingCursorInDirection("forward"))
      return this.event.preventDefault(), null === (e2 = this.responder) || void 0 === e2 ? void 0 : e2.moveCursorInDirection("forward");
  }, Backspace() {
    var t2, e2, i2;
    if (null !== (t2 = this.responder) && void 0 !== t2 && t2.shouldManageDeletingInDirection("backward"))
      return this.event.preventDefault(), null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillPerformTyping(), null === (i2 = this.responder) || void 0 === i2 || i2.deleteInDirection("backward"), this.render();
  }, Tab() {
    var t2, e2;
    if (null !== (t2 = this.responder) && void 0 !== t2 && t2.canIncreaseNestingLevel())
      return this.event.preventDefault(), null === (e2 = this.responder) || void 0 === e2 || e2.increaseNestingLevel(), this.render();
  }, "Tab+Shift"() {
    var t2, e2;
    if (null !== (t2 = this.responder) && void 0 !== t2 && t2.canDecreaseNestingLevel())
      return this.event.preventDefault(), null === (e2 = this.responder) || void 0 === e2 || e2.decreaseNestingLevel(), this.render();
  } }), be(Qi, "inputTypes", { deleteByComposition() {
    return this.deleteInDirection("backward", { recordUndoEntry: false });
  }, deleteByCut() {
    return this.deleteInDirection("backward");
  }, deleteByDrag() {
    return this.event.preventDefault(), this.withTargetDOMRange(function() {
      var t2;
      this.deleteByDragRange = null === (t2 = this.responder) || void 0 === t2 ? void 0 : t2.getSelectedRange();
    });
  }, deleteCompositionText() {
    return this.deleteInDirection("backward", { recordUndoEntry: false });
  }, deleteContent() {
    return this.deleteInDirection("backward");
  }, deleteContentBackward() {
    return this.deleteInDirection("backward");
  }, deleteContentForward() {
    return this.deleteInDirection("forward");
  }, deleteEntireSoftLine() {
    return this.deleteInDirection("forward");
  }, deleteHardLineBackward() {
    return this.deleteInDirection("backward");
  }, deleteHardLineForward() {
    return this.deleteInDirection("forward");
  }, deleteSoftLineBackward() {
    return this.deleteInDirection("backward");
  }, deleteSoftLineForward() {
    return this.deleteInDirection("forward");
  }, deleteWordBackward() {
    return this.deleteInDirection("backward");
  }, deleteWordForward() {
    return this.deleteInDirection("forward");
  }, formatBackColor() {
    return this.activateAttributeIfSupported("backgroundColor", this.event.data);
  }, formatBold() {
    return this.toggleAttributeIfSupported("bold");
  }, formatFontColor() {
    return this.activateAttributeIfSupported("color", this.event.data);
  }, formatFontName() {
    return this.activateAttributeIfSupported("font", this.event.data);
  }, formatIndent() {
    var t2;
    if (null !== (t2 = this.responder) && void 0 !== t2 && t2.canIncreaseNestingLevel())
      return this.withTargetDOMRange(function() {
        var t3;
        return null === (t3 = this.responder) || void 0 === t3 ? void 0 : t3.increaseNestingLevel();
      });
  }, formatItalic() {
    return this.toggleAttributeIfSupported("italic");
  }, formatJustifyCenter() {
    return this.toggleAttributeIfSupported("justifyCenter");
  }, formatJustifyFull() {
    return this.toggleAttributeIfSupported("justifyFull");
  }, formatJustifyLeft() {
    return this.toggleAttributeIfSupported("justifyLeft");
  }, formatJustifyRight() {
    return this.toggleAttributeIfSupported("justifyRight");
  }, formatOutdent() {
    var t2;
    if (null !== (t2 = this.responder) && void 0 !== t2 && t2.canDecreaseNestingLevel())
      return this.withTargetDOMRange(function() {
        var t3;
        return null === (t3 = this.responder) || void 0 === t3 ? void 0 : t3.decreaseNestingLevel();
      });
  }, formatRemove() {
    this.withTargetDOMRange(function() {
      for (const i2 in null === (t2 = this.responder) || void 0 === t2 ? void 0 : t2.getCurrentAttributes()) {
        var t2, e2;
        null === (e2 = this.responder) || void 0 === e2 || e2.removeCurrentAttribute(i2);
      }
    });
  }, formatSetBlockTextDirection() {
    return this.activateAttributeIfSupported("blockDir", this.event.data);
  }, formatSetInlineTextDirection() {
    return this.activateAttributeIfSupported("textDir", this.event.data);
  }, formatStrikeThrough() {
    return this.toggleAttributeIfSupported("strike");
  }, formatSubscript() {
    return this.toggleAttributeIfSupported("sub");
  }, formatSuperscript() {
    return this.toggleAttributeIfSupported("sup");
  }, formatUnderline() {
    return this.toggleAttributeIfSupported("underline");
  }, historyRedo() {
    var t2;
    return null === (t2 = this.delegate) || void 0 === t2 ? void 0 : t2.inputControllerWillPerformRedo();
  }, historyUndo() {
    var t2;
    return null === (t2 = this.delegate) || void 0 === t2 ? void 0 : t2.inputControllerWillPerformUndo();
  }, insertCompositionText() {
    return this.composing = true, this.insertString(this.event.data);
  }, insertFromComposition() {
    return this.composing = false, this.insertString(this.event.data);
  }, insertFromDrop() {
    const t2 = this.deleteByDragRange;
    var e2;
    if (t2)
      return this.deleteByDragRange = null, null === (e2 = this.delegate) || void 0 === e2 || e2.inputControllerWillMoveText(), this.withTargetDOMRange(function() {
        var e3;
        return null === (e3 = this.responder) || void 0 === e3 ? void 0 : e3.moveTextFromRange(t2);
      });
  }, insertFromPaste() {
    var t2;
    const { dataTransfer: e2 } = this.event, i2 = { dataTransfer: e2 }, n2 = e2.getData("URL"), r2 = e2.getData("text/html");
    if (n2) {
      var o2;
      let t3;
      this.event.preventDefault(), i2.type = "text/html";
      const r3 = e2.getData("public.url-name");
      t3 = r3 ? Wt(r3).trim() : n2, i2.html = this.createLinkHTML(n2, t3), null === (o2 = this.delegate) || void 0 === o2 || o2.inputControllerWillPaste(i2), this.withTargetDOMRange(function() {
        var t4;
        return null === (t4 = this.responder) || void 0 === t4 ? void 0 : t4.insertHTML(i2.html);
      }), this.afterRender = () => {
        var t4;
        return null === (t4 = this.delegate) || void 0 === t4 ? void 0 : t4.inputControllerDidPaste(i2);
      };
    } else if (At(e2)) {
      var s2;
      i2.type = "text/plain", i2.string = e2.getData("text/plain"), null === (s2 = this.delegate) || void 0 === s2 || s2.inputControllerWillPaste(i2), this.withTargetDOMRange(function() {
        var t3;
        return null === (t3 = this.responder) || void 0 === t3 ? void 0 : t3.insertString(i2.string);
      }), this.afterRender = () => {
        var t3;
        return null === (t3 = this.delegate) || void 0 === t3 ? void 0 : t3.inputControllerDidPaste(i2);
      };
    } else if (r2) {
      var a2;
      this.event.preventDefault(), i2.type = "text/html", i2.html = r2, null === (a2 = this.delegate) || void 0 === a2 || a2.inputControllerWillPaste(i2), this.withTargetDOMRange(function() {
        var t3;
        return null === (t3 = this.responder) || void 0 === t3 ? void 0 : t3.insertHTML(i2.html);
      }), this.afterRender = () => {
        var t3;
        return null === (t3 = this.delegate) || void 0 === t3 ? void 0 : t3.inputControllerDidPaste(i2);
      };
    } else if (null !== (t2 = e2.files) && void 0 !== t2 && t2.length) {
      var l2;
      i2.type = "File", i2.file = e2.files[0], null === (l2 = this.delegate) || void 0 === l2 || l2.inputControllerWillPaste(i2), this.withTargetDOMRange(function() {
        var t3;
        return null === (t3 = this.responder) || void 0 === t3 ? void 0 : t3.insertFile(i2.file);
      }), this.afterRender = () => {
        var t3;
        return null === (t3 = this.delegate) || void 0 === t3 ? void 0 : t3.inputControllerDidPaste(i2);
      };
    }
  }, insertFromYank() {
    return this.insertString(this.event.data);
  }, insertLineBreak() {
    return this.insertString("\n");
  }, insertLink() {
    return this.activateAttributeIfSupported("href", this.event.data);
  }, insertOrderedList() {
    return this.toggleAttributeIfSupported("number");
  }, insertParagraph() {
    var t2;
    return null === (t2 = this.delegate) || void 0 === t2 || t2.inputControllerWillPerformTyping(), this.withTargetDOMRange(function() {
      var t3;
      return null === (t3 = this.responder) || void 0 === t3 ? void 0 : t3.insertLineBreak();
    });
  }, insertReplacementText() {
    return this.insertString(this.event.dataTransfer.getData("text/plain"), { updatePosition: false });
  }, insertText() {
    var t2;
    return this.insertString(this.event.data || (null === (t2 = this.event.dataTransfer) || void 0 === t2 ? void 0 : t2.getData("text/plain")));
  }, insertTranspose() {
    return this.insertString(this.event.data);
  }, insertUnorderedList() {
    return this.toggleAttributeIfSupported("bullet");
  } });
  var Zi = function(t2) {
    const e2 = document.createRange();
    return e2.setStart(t2.startContainer, t2.startOffset), e2.setEnd(t2.endContainer, t2.endOffset), e2;
  };
  var tn = (t2) => {
    var e2;
    return Array.from((null === (e2 = t2.dataTransfer) || void 0 === e2 ? void 0 : e2.types) || []).includes("Files");
  };
  var en = function(t2) {
    const e2 = t2.clipboardData;
    if (e2)
      return e2.types.includes("Files") && 1 === e2.types.length && e2.files.length >= 1;
  };
  var nn = function(t2) {
    const e2 = t2.clipboardData;
    if (e2)
      return e2.types.includes("text/plain") && 1 === e2.types.length;
  };
  var rn = function(t2) {
    const e2 = [];
    return t2.altKey && e2.push("alt"), t2.shiftKey && e2.push("shift"), e2.push(t2.key), e2;
  };
  var on = (t2) => ({ x: t2.clientX, y: t2.clientY });
  var sn = "".concat("[data-trix-attribute]", ", ").concat("[data-trix-action]");
  var an = "".concat("[data-trix-dialog]", "[data-trix-active]");
  var ln = "".concat("[data-trix-dialog]", " [data-trix-method]");
  var cn = "".concat("[data-trix-dialog]", " [data-trix-input]");
  var hn = (t2, e2) => (e2 || (e2 = dn(t2)), t2.querySelector("[data-trix-input][name='".concat(e2, "']")));
  var un = (t2) => t2.getAttribute("data-trix-action");
  var dn = (t2) => t2.getAttribute("data-trix-attribute") || t2.getAttribute("data-trix-dialog-attribute");
  var gn = class extends U {
    constructor(t2) {
      super(t2), this.didClickActionButton = this.didClickActionButton.bind(this), this.didClickAttributeButton = this.didClickAttributeButton.bind(this), this.didClickDialogButton = this.didClickDialogButton.bind(this), this.didKeyDownDialogInput = this.didKeyDownDialogInput.bind(this), this.element = t2, this.attributes = {}, this.actions = {}, this.resetDialogInputs(), d("mousedown", { onElement: this.element, matchingSelector: "[data-trix-action]", withCallback: this.didClickActionButton }), d("mousedown", { onElement: this.element, matchingSelector: "[data-trix-attribute]", withCallback: this.didClickAttributeButton }), d("click", { onElement: this.element, matchingSelector: sn, preventDefault: true }), d("click", { onElement: this.element, matchingSelector: ln, withCallback: this.didClickDialogButton }), d("keydown", { onElement: this.element, matchingSelector: cn, withCallback: this.didKeyDownDialogInput });
    }
    didClickActionButton(t2, e2) {
      var i2;
      null === (i2 = this.delegate) || void 0 === i2 || i2.toolbarDidClickButton(), t2.preventDefault();
      const n2 = un(e2);
      return this.getDialog(n2) ? this.toggleDialog(n2) : null === (r2 = this.delegate) || void 0 === r2 ? void 0 : r2.toolbarDidInvokeAction(n2);
      var r2;
    }
    didClickAttributeButton(t2, e2) {
      var i2;
      null === (i2 = this.delegate) || void 0 === i2 || i2.toolbarDidClickButton(), t2.preventDefault();
      const n2 = dn(e2);
      var r2;
      this.getDialog(n2) ? this.toggleDialog(n2) : null === (r2 = this.delegate) || void 0 === r2 || r2.toolbarDidToggleAttribute(n2);
      return this.refreshAttributeButtons();
    }
    didClickDialogButton(t2, e2) {
      const i2 = p(e2, { matchingSelector: "[data-trix-dialog]" });
      return this[e2.getAttribute("data-trix-method")].call(this, i2);
    }
    didKeyDownDialogInput(t2, e2) {
      if (13 === t2.keyCode) {
        t2.preventDefault();
        const i2 = e2.getAttribute("name"), n2 = this.getDialog(i2);
        this.setAttribute(n2);
      }
      if (27 === t2.keyCode)
        return t2.preventDefault(), this.hideDialog();
    }
    updateActions(t2) {
      return this.actions = t2, this.refreshActionButtons();
    }
    refreshActionButtons() {
      return this.eachActionButton((t2, e2) => {
        t2.disabled = false === this.actions[e2];
      });
    }
    eachActionButton(t2) {
      return Array.from(this.element.querySelectorAll("[data-trix-action]")).map((e2) => t2(e2, un(e2)));
    }
    updateAttributes(t2) {
      return this.attributes = t2, this.refreshAttributeButtons();
    }
    refreshAttributeButtons() {
      return this.eachAttributeButton((t2, e2) => (t2.disabled = false === this.attributes[e2], this.attributes[e2] || this.dialogIsVisible(e2) ? (t2.setAttribute("data-trix-active", ""), t2.classList.add("trix-active")) : (t2.removeAttribute("data-trix-active"), t2.classList.remove("trix-active"))));
    }
    eachAttributeButton(t2) {
      return Array.from(this.element.querySelectorAll("[data-trix-attribute]")).map((e2) => t2(e2, dn(e2)));
    }
    applyKeyboardCommand(t2) {
      const e2 = JSON.stringify(t2.sort());
      for (const t3 of Array.from(this.element.querySelectorAll("[data-trix-key]"))) {
        const i2 = t3.getAttribute("data-trix-key").split("+");
        if (JSON.stringify(i2.sort()) === e2)
          return g("mousedown", { onElement: t3 }), true;
      }
      return false;
    }
    dialogIsVisible(t2) {
      const e2 = this.getDialog(t2);
      if (e2)
        return e2.hasAttribute("data-trix-active");
    }
    toggleDialog(t2) {
      return this.dialogIsVisible(t2) ? this.hideDialog() : this.showDialog(t2);
    }
    showDialog(t2) {
      var e2, i2;
      this.hideDialog(), null === (e2 = this.delegate) || void 0 === e2 || e2.toolbarWillShowDialog();
      const n2 = this.getDialog(t2);
      n2.setAttribute("data-trix-active", ""), n2.classList.add("trix-active"), Array.from(n2.querySelectorAll("input[disabled]")).forEach((t3) => {
        t3.removeAttribute("disabled");
      });
      const r2 = dn(n2);
      if (r2) {
        const e3 = hn(n2, t2);
        e3 && (e3.value = this.attributes[r2] || "", e3.select());
      }
      return null === (i2 = this.delegate) || void 0 === i2 ? void 0 : i2.toolbarDidShowDialog(t2);
    }
    setAttribute(t2) {
      const e2 = dn(t2), i2 = hn(t2, e2);
      return i2.willValidate && !i2.checkValidity() ? (i2.setAttribute("data-trix-validate", ""), i2.classList.add("trix-validate"), i2.focus()) : (null === (n2 = this.delegate) || void 0 === n2 || n2.toolbarDidUpdateAttribute(e2, i2.value), this.hideDialog());
      var n2;
    }
    removeAttribute(t2) {
      var e2;
      const i2 = dn(t2);
      return null === (e2 = this.delegate) || void 0 === e2 || e2.toolbarDidRemoveAttribute(i2), this.hideDialog();
    }
    hideDialog() {
      const t2 = this.element.querySelector(an);
      var e2;
      if (t2)
        return t2.removeAttribute("data-trix-active"), t2.classList.remove("trix-active"), this.resetDialogInputs(), null === (e2 = this.delegate) || void 0 === e2 ? void 0 : e2.toolbarDidHideDialog(((t3) => t3.getAttribute("data-trix-dialog"))(t2));
    }
    resetDialogInputs() {
      Array.from(this.element.querySelectorAll(cn)).forEach((t2) => {
        t2.setAttribute("disabled", "disabled"), t2.removeAttribute("data-trix-validate"), t2.classList.remove("trix-validate");
      });
    }
    getDialog(t2) {
      return this.element.querySelector("[data-trix-dialog=".concat(t2, "]"));
    }
  };
  var mn = class extends Fi {
    constructor(t2) {
      let { editorElement: e2, document: i2, html: n2 } = t2;
      super(...arguments), this.editorElement = e2, this.selectionManager = new Ci(this.editorElement), this.selectionManager.delegate = this, this.composition = new ci(), this.composition.delegate = this, this.attachmentManager = new ai(this.composition.getAttachments()), this.attachmentManager.delegate = this, this.inputController = 2 === P.getLevel() ? new Qi(this.editorElement) : new Ji(this.editorElement), this.inputController.delegate = this, this.inputController.responder = this.composition, this.compositionController = new Ti(this.editorElement, this.composition), this.compositionController.delegate = this, this.toolbarController = new gn(this.editorElement.toolbarElement), this.toolbarController.delegate = this, this.editor = new pi(this.composition, this.selectionManager, this.editorElement), i2 ? this.editor.loadDocument(i2) : this.editor.loadHTML(n2);
    }
    registerSelectionManager() {
      return Ft.registerSelectionManager(this.selectionManager);
    }
    unregisterSelectionManager() {
      return Ft.unregisterSelectionManager(this.selectionManager);
    }
    render() {
      return this.compositionController.render();
    }
    reparse() {
      return this.composition.replaceHTML(this.editorElement.innerHTML);
    }
    compositionDidChangeDocument(t2) {
      if (this.notifyEditorElement("document-change"), !this.handlingInput)
        return this.render();
    }
    compositionDidChangeCurrentAttributes(t2) {
      return this.currentAttributes = t2, this.toolbarController.updateAttributes(this.currentAttributes), this.updateCurrentActions(), this.notifyEditorElement("attributes-change", { attributes: this.currentAttributes });
    }
    compositionDidPerformInsertionAtRange(t2) {
      this.pasting && (this.pastedRange = t2);
    }
    compositionShouldAcceptFile(t2) {
      return this.notifyEditorElement("file-accept", { file: t2 });
    }
    compositionDidAddAttachment(t2) {
      const e2 = this.attachmentManager.manageAttachment(t2);
      return this.notifyEditorElement("attachment-add", { attachment: e2 });
    }
    compositionDidEditAttachment(t2) {
      this.compositionController.rerenderViewForObject(t2);
      const e2 = this.attachmentManager.manageAttachment(t2);
      return this.notifyEditorElement("attachment-edit", { attachment: e2 }), this.notifyEditorElement("change");
    }
    compositionDidChangeAttachmentPreviewURL(t2) {
      return this.compositionController.invalidateViewForObject(t2), this.notifyEditorElement("change");
    }
    compositionDidRemoveAttachment(t2) {
      const e2 = this.attachmentManager.unmanageAttachment(t2);
      return this.notifyEditorElement("attachment-remove", { attachment: e2 });
    }
    compositionDidStartEditingAttachment(t2, e2) {
      return this.attachmentLocationRange = this.composition.document.getLocationRangeOfAttachment(t2), this.compositionController.installAttachmentEditorForAttachment(t2, e2), this.selectionManager.setLocationRange(this.attachmentLocationRange);
    }
    compositionDidStopEditingAttachment(t2) {
      this.compositionController.uninstallAttachmentEditor(), this.attachmentLocationRange = null;
    }
    compositionDidRequestChangingSelectionToLocationRange(t2) {
      if (!this.loadingSnapshot || this.isFocused())
        return this.requestedLocationRange = t2, this.compositionRevisionWhenLocationRangeRequested = this.composition.revision, this.handlingInput ? void 0 : this.render();
    }
    compositionWillLoadSnapshot() {
      this.loadingSnapshot = true;
    }
    compositionDidLoadSnapshot() {
      this.compositionController.refreshViewCache(), this.render(), this.loadingSnapshot = false;
    }
    getSelectionManager() {
      return this.selectionManager;
    }
    attachmentManagerDidRequestRemovalOfAttachment(t2) {
      return this.removeAttachment(t2);
    }
    compositionControllerWillSyncDocumentView() {
      return this.inputController.editorWillSyncDocumentView(), this.selectionManager.lock(), this.selectionManager.clearSelection();
    }
    compositionControllerDidSyncDocumentView() {
      return this.inputController.editorDidSyncDocumentView(), this.selectionManager.unlock(), this.updateCurrentActions(), this.notifyEditorElement("sync");
    }
    compositionControllerDidRender() {
      this.requestedLocationRange && (this.compositionRevisionWhenLocationRangeRequested === this.composition.revision && this.selectionManager.setLocationRange(this.requestedLocationRange), this.requestedLocationRange = null, this.compositionRevisionWhenLocationRangeRequested = null), this.renderedCompositionRevision !== this.composition.revision && (this.runEditorFilters(), this.composition.updateCurrentAttributes(), this.notifyEditorElement("render")), this.renderedCompositionRevision = this.composition.revision;
    }
    compositionControllerDidFocus() {
      return this.isFocusedInvisibly() && this.setLocationRange({ index: 0, offset: 0 }), this.toolbarController.hideDialog(), this.notifyEditorElement("focus");
    }
    compositionControllerDidBlur() {
      return this.notifyEditorElement("blur");
    }
    compositionControllerDidSelectAttachment(t2, e2) {
      return this.toolbarController.hideDialog(), this.composition.editAttachment(t2, e2);
    }
    compositionControllerDidRequestDeselectingAttachment(t2) {
      const e2 = this.attachmentLocationRange || this.composition.document.getLocationRangeOfAttachment(t2);
      return this.selectionManager.setLocationRange(e2[1]);
    }
    compositionControllerWillUpdateAttachment(t2) {
      return this.editor.recordUndoEntry("Edit Attachment", { context: t2.id, consolidatable: true });
    }
    compositionControllerDidRequestRemovalOfAttachment(t2) {
      return this.removeAttachment(t2);
    }
    inputControllerWillHandleInput() {
      this.handlingInput = true, this.requestedRender = false;
    }
    inputControllerDidRequestRender() {
      this.requestedRender = true;
    }
    inputControllerDidHandleInput() {
      if (this.handlingInput = false, this.requestedRender)
        return this.requestedRender = false, this.render();
    }
    inputControllerDidAllowUnhandledInput() {
      return this.notifyEditorElement("change");
    }
    inputControllerDidRequestReparse() {
      return this.reparse();
    }
    inputControllerWillPerformTyping() {
      return this.recordTypingUndoEntry();
    }
    inputControllerWillPerformFormatting(t2) {
      return this.recordFormattingUndoEntry(t2);
    }
    inputControllerWillCutText() {
      return this.editor.recordUndoEntry("Cut");
    }
    inputControllerWillPaste(t2) {
      return this.editor.recordUndoEntry("Paste"), this.pasting = true, this.notifyEditorElement("before-paste", { paste: t2 });
    }
    inputControllerDidPaste(t2) {
      return t2.range = this.pastedRange, this.pastedRange = null, this.pasting = null, this.notifyEditorElement("paste", { paste: t2 });
    }
    inputControllerWillMoveText() {
      return this.editor.recordUndoEntry("Move");
    }
    inputControllerWillAttachFiles() {
      return this.editor.recordUndoEntry("Drop Files");
    }
    inputControllerWillPerformUndo() {
      return this.editor.undo();
    }
    inputControllerWillPerformRedo() {
      return this.editor.redo();
    }
    inputControllerDidReceiveKeyboardCommand(t2) {
      return this.toolbarController.applyKeyboardCommand(t2);
    }
    inputControllerDidStartDrag() {
      this.locationRangeBeforeDrag = this.selectionManager.getLocationRange();
    }
    inputControllerDidReceiveDragOverPoint(t2) {
      return this.selectionManager.setLocationRangeFromPointRange(t2);
    }
    inputControllerDidCancelDrag() {
      this.selectionManager.setLocationRange(this.locationRangeBeforeDrag), this.locationRangeBeforeDrag = null;
    }
    locationRangeDidChange(t2) {
      return this.composition.updateCurrentAttributes(), this.updateCurrentActions(), this.attachmentLocationRange && !kt(this.attachmentLocationRange, t2) && this.composition.stopEditingAttachment(), this.notifyEditorElement("selection-change");
    }
    toolbarDidClickButton() {
      if (!this.getLocationRange())
        return this.setLocationRange({ index: 0, offset: 0 });
    }
    toolbarDidInvokeAction(t2) {
      return this.invokeAction(t2);
    }
    toolbarDidToggleAttribute(t2) {
      if (this.recordFormattingUndoEntry(t2), this.composition.toggleCurrentAttribute(t2), this.render(), !this.selectionFrozen)
        return this.editorElement.focus();
    }
    toolbarDidUpdateAttribute(t2, e2) {
      if (this.recordFormattingUndoEntry(t2), this.composition.setCurrentAttribute(t2, e2), this.render(), !this.selectionFrozen)
        return this.editorElement.focus();
    }
    toolbarDidRemoveAttribute(t2) {
      if (this.recordFormattingUndoEntry(t2), this.composition.removeCurrentAttribute(t2), this.render(), !this.selectionFrozen)
        return this.editorElement.focus();
    }
    toolbarWillShowDialog(t2) {
      return this.composition.expandSelectionForEditing(), this.freezeSelection();
    }
    toolbarDidShowDialog(t2) {
      return this.notifyEditorElement("toolbar-dialog-show", { dialogName: t2 });
    }
    toolbarDidHideDialog(t2) {
      return this.thawSelection(), this.editorElement.focus(), this.notifyEditorElement("toolbar-dialog-hide", { dialogName: t2 });
    }
    freezeSelection() {
      if (!this.selectionFrozen)
        return this.selectionManager.lock(), this.composition.freezeSelection(), this.selectionFrozen = true, this.render();
    }
    thawSelection() {
      if (this.selectionFrozen)
        return this.composition.thawSelection(), this.selectionManager.unlock(), this.selectionFrozen = false, this.render();
    }
    canInvokeAction(t2) {
      return !!this.actionIsExternal(t2) || !(null === (e2 = this.actions[t2]) || void 0 === e2 || null === (i2 = e2.test) || void 0 === i2 || !i2.call(this));
      var e2, i2;
    }
    invokeAction(t2) {
      return this.actionIsExternal(t2) ? this.notifyEditorElement("action-invoke", { actionName: t2 }) : null === (e2 = this.actions[t2]) || void 0 === e2 || null === (i2 = e2.perform) || void 0 === i2 ? void 0 : i2.call(this);
      var e2, i2;
    }
    actionIsExternal(t2) {
      return /^x-./.test(t2);
    }
    getCurrentActions() {
      const t2 = {};
      for (const e2 in this.actions)
        t2[e2] = this.canInvokeAction(e2);
      return t2;
    }
    updateCurrentActions() {
      const t2 = this.getCurrentActions();
      if (!Rt(t2, this.currentActions))
        return this.currentActions = t2, this.toolbarController.updateActions(this.currentActions), this.notifyEditorElement("actions-change", { actions: this.currentActions });
    }
    runEditorFilters() {
      let t2 = this.composition.getSnapshot();
      if (Array.from(this.editor.filters).forEach((e3) => {
        const { document: i3, selectedRange: n2 } = t2;
        t2 = e3.call(this.editor, t2) || {}, t2.document || (t2.document = i3), t2.selectedRange || (t2.selectedRange = n2);
      }), e2 = t2, i2 = this.composition.getSnapshot(), !kt(e2.selectedRange, i2.selectedRange) || !e2.document.isEqualTo(i2.document))
        return this.composition.loadSnapshot(t2);
      var e2, i2;
    }
    updateInputElement() {
      const t2 = function(t3, e2) {
        const i2 = ri[e2];
        if (i2)
          return i2(t3);
        throw new Error("unknown content type: ".concat(e2));
      }(this.compositionController.getSerializableElement(), "text/html");
      return this.editorElement.setInputElementValue(t2);
    }
    notifyEditorElement(t2, e2) {
      switch (t2) {
        case "document-change":
          this.documentChangedSinceLastRender = true;
          break;
        case "render":
          this.documentChangedSinceLastRender && (this.documentChangedSinceLastRender = false, this.notifyEditorElement("change"));
          break;
        case "change":
        case "attachment-add":
        case "attachment-edit":
        case "attachment-remove":
          this.updateInputElement();
      }
      return this.editorElement.notify(t2, e2);
    }
    removeAttachment(t2) {
      return this.editor.recordUndoEntry("Delete Attachment"), this.composition.removeAttachment(t2), this.render();
    }
    recordFormattingUndoEntry(t2) {
      const e2 = ht(t2), i2 = this.selectionManager.getLocationRange();
      if (e2 || !St(i2))
        return this.editor.recordUndoEntry("Formatting", { context: this.getUndoContext(), consolidatable: true });
    }
    recordTypingUndoEntry() {
      return this.editor.recordUndoEntry("Typing", { context: this.getUndoContext(this.currentAttributes), consolidatable: true });
    }
    getUndoContext() {
      for (var t2 = arguments.length, e2 = new Array(t2), i2 = 0; i2 < t2; i2++)
        e2[i2] = arguments[i2];
      return [this.getLocationContext(), this.getTimeContext(), ...Array.from(e2)];
    }
    getLocationContext() {
      const t2 = this.selectionManager.getLocationRange();
      return St(t2) ? t2[0].index : t2;
    }
    getTimeContext() {
      return j.interval > 0 ? Math.floor((/* @__PURE__ */ new Date()).getTime() / j.interval) : 0;
    }
    isFocused() {
      var t2;
      return this.editorElement === (null === (t2 = this.editorElement.ownerDocument) || void 0 === t2 ? void 0 : t2.activeElement);
    }
    isFocusedInvisibly() {
      return this.isFocused() && !this.getLocationRange();
    }
    get actions() {
      return this.constructor.actions;
    }
  };
  be(mn, "actions", { undo: { test() {
    return this.editor.canUndo();
  }, perform() {
    return this.editor.undo();
  } }, redo: { test() {
    return this.editor.canRedo();
  }, perform() {
    return this.editor.redo();
  } }, link: { test() {
    return this.editor.canActivateAttribute("href");
  } }, increaseNestingLevel: { test() {
    return this.editor.canIncreaseNestingLevel();
  }, perform() {
    return this.editor.increaseNestingLevel() && this.render();
  } }, decreaseNestingLevel: { test() {
    return this.editor.canDecreaseNestingLevel();
  }, perform() {
    return this.editor.decreaseNestingLevel() && this.render();
  } }, attachFiles: { test: () => true, perform() {
    return P.pickFiles(this.editor.insertFiles);
  } } }), mn.proxyMethod("getSelectionManager().setLocationRange"), mn.proxyMethod("getSelectionManager().getLocationRange");
  var pn = Object.freeze({ __proto__: null, AttachmentEditorController: wi, CompositionController: Ti, Controller: Fi, EditorController: mn, InputController: qi, Level0InputController: Ji, Level2InputController: Qi, ToolbarController: gn });
  var fn = Object.freeze({ __proto__: null, MutationObserver: Pi, SelectionChangeObserver: wt });
  var bn = Object.freeze({ __proto__: null, FileVerificationOperation: Oi, ImagePreloadOperation: Ae });
  mt("trix-toolbar", "%t {\n  display: block;\n}\n\n%t {\n  white-space: nowrap;\n}\n\n%t [data-trix-dialog] {\n  display: none;\n}\n\n%t [data-trix-dialog][data-trix-active] {\n  display: block;\n}\n\n%t [data-trix-dialog] [data-trix-validate]:invalid {\n  background-color: #ffdddd;\n}");
  var vn = class extends HTMLElement {
    connectedCallback() {
      "" === this.innerHTML && (this.innerHTML = M.getDefaultHTML());
    }
  };
  var An = 0;
  var xn = function(t2) {
    if (!t2.hasAttribute("contenteditable"))
      return t2.setAttribute("contenteditable", ""), function(t3) {
        let e2 = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
        return e2.times = 1, d(t3, e2);
      }("focus", { onElement: t2, withCallback: () => yn(t2) });
  };
  var yn = function(t2) {
    return Cn(t2), Rn(t2);
  };
  var Cn = function(t2) {
    var e2, i2;
    if (null !== (e2 = (i2 = document).queryCommandSupported) && void 0 !== e2 && e2.call(i2, "enableObjectResizing"))
      return document.execCommand("enableObjectResizing", false, false), d("mscontrolselect", { onElement: t2, preventDefault: true });
  };
  var Rn = function(t2) {
    var i2, n2;
    if (null !== (i2 = (n2 = document).queryCommandSupported) && void 0 !== i2 && i2.call(n2, "DefaultParagraphSeparator")) {
      const { tagName: t3 } = e.default;
      if (["div", "p"].includes(t3))
        return document.execCommand("DefaultParagraphSeparator", false, t3);
    }
  };
  var En = o.forcesObjectResizing ? { display: "inline", width: "auto" } : { display: "inline-block", width: "1px" };
  mt("trix-editor", "%t {\n    display: block;\n}\n\n%t:empty:not(:focus)::before {\n    content: attr(placeholder);\n    color: graytext;\n    cursor: text;\n    pointer-events: none;\n    white-space: pre-line;\n}\n\n%t a[contenteditable=false] {\n    cursor: text;\n}\n\n%t img {\n    max-width: 100%;\n    height: auto;\n}\n\n%t ".concat("[data-trix-attachment]", " figcaption textarea {\n    resize: none;\n}\n\n%t ").concat("[data-trix-attachment]", " figcaption textarea.trix-autoresize-clone {\n    position: absolute;\n    left: -9999px;\n    max-height: 0px;\n}\n\n%t ").concat("[data-trix-attachment]", " figcaption[data-trix-placeholder]:empty::before {\n    content: attr(data-trix-placeholder);\n    color: graytext;\n}\n\n%t [data-trix-cursor-target] {\n    display: ").concat(En.display, " !important;\n    width: ").concat(En.width, " !important;\n    padding: 0 !important;\n    margin: 0 !important;\n    border: none !important;\n}\n\n%t [data-trix-cursor-target=left] {\n    vertical-align: top !important;\n    margin-left: -1px !important;\n}\n\n%t [data-trix-cursor-target=right] {\n    vertical-align: bottom !important;\n    margin-right: -1px !important;\n}"));
  var Sn = class extends HTMLElement {
    get trixId() {
      return this.hasAttribute("trix-id") ? this.getAttribute("trix-id") : (this.setAttribute("trix-id", ++An), this.trixId);
    }
    get labels() {
      const t2 = [];
      this.id && this.ownerDocument && t2.push(...Array.from(this.ownerDocument.querySelectorAll("label[for='".concat(this.id, "']")) || []));
      const e2 = p(this, { matchingSelector: "label" });
      return e2 && [this, null].includes(e2.control) && t2.push(e2), t2;
    }
    get toolbarElement() {
      var t2;
      if (this.hasAttribute("toolbar"))
        return null === (t2 = this.ownerDocument) || void 0 === t2 ? void 0 : t2.getElementById(this.getAttribute("toolbar"));
      if (this.parentNode) {
        const t3 = "trix-toolbar-".concat(this.trixId);
        this.setAttribute("toolbar", t3);
        const e2 = C("trix-toolbar", { id: t3 });
        return this.parentNode.insertBefore(e2, this), e2;
      }
    }
    get form() {
      var t2;
      return null === (t2 = this.inputElement) || void 0 === t2 ? void 0 : t2.form;
    }
    get inputElement() {
      var t2;
      if (this.hasAttribute("input"))
        return null === (t2 = this.ownerDocument) || void 0 === t2 ? void 0 : t2.getElementById(this.getAttribute("input"));
      if (this.parentNode) {
        const t3 = "trix-input-".concat(this.trixId);
        this.setAttribute("input", t3);
        const e2 = C("input", { type: "hidden", id: t3 });
        return this.parentNode.insertBefore(e2, this.nextElementSibling), e2;
      }
    }
    get editor() {
      var t2;
      return null === (t2 = this.editorController) || void 0 === t2 ? void 0 : t2.editor;
    }
    get name() {
      var t2;
      return null === (t2 = this.inputElement) || void 0 === t2 ? void 0 : t2.name;
    }
    get value() {
      var t2;
      return null === (t2 = this.inputElement) || void 0 === t2 ? void 0 : t2.value;
    }
    set value(t2) {
      var e2;
      this.defaultValue = t2, null === (e2 = this.editor) || void 0 === e2 || e2.loadHTML(this.defaultValue);
    }
    notify(t2, e2) {
      if (this.editorController)
        return g("trix-".concat(t2), { onElement: this, attributes: e2 });
    }
    setInputElementValue(t2) {
      this.inputElement && (this.inputElement.value = t2);
    }
    connectedCallback() {
      this.hasAttribute("data-trix-internal") || (xn(this), function(t2) {
        if (!t2.hasAttribute("role"))
          t2.setAttribute("role", "textbox");
      }(this), function(t2) {
        if (t2.hasAttribute("aria-label") || t2.hasAttribute("aria-labelledby"))
          return;
        const e2 = function() {
          const e3 = Array.from(t2.labels).map((e4) => {
            if (!e4.contains(t2))
              return e4.textContent;
          }).filter((t3) => t3), i2 = e3.join(" ");
          return i2 ? t2.setAttribute("aria-label", i2) : t2.removeAttribute("aria-label");
        };
        e2(), d("focus", { onElement: t2, withCallback: e2 });
      }(this), this.editorController || (g("trix-before-initialize", { onElement: this }), this.editorController = new mn({ editorElement: this, html: this.defaultValue = this.value }), requestAnimationFrame(() => g("trix-initialize", { onElement: this }))), this.editorController.registerSelectionManager(), this.registerResetListener(), this.registerClickListener(), function(t2) {
        if (!document.querySelector(":focus") && t2.hasAttribute("autofocus") && document.querySelector("[autofocus]") === t2)
          t2.focus();
      }(this));
    }
    disconnectedCallback() {
      var t2;
      return null === (t2 = this.editorController) || void 0 === t2 || t2.unregisterSelectionManager(), this.unregisterResetListener(), this.unregisterClickListener();
    }
    registerResetListener() {
      return this.resetListener = this.resetBubbled.bind(this), window.addEventListener("reset", this.resetListener, false);
    }
    unregisterResetListener() {
      return window.removeEventListener("reset", this.resetListener, false);
    }
    registerClickListener() {
      return this.clickListener = this.clickBubbled.bind(this), window.addEventListener("click", this.clickListener, false);
    }
    unregisterClickListener() {
      return window.removeEventListener("click", this.clickListener, false);
    }
    resetBubbled(t2) {
      if (!t2.defaultPrevented && t2.target === this.form)
        return this.reset();
    }
    clickBubbled(t2) {
      if (t2.defaultPrevented)
        return;
      if (this.contains(t2.target))
        return;
      const e2 = p(t2.target, { matchingSelector: "label" });
      return e2 && Array.from(this.labels).includes(e2) ? this.focus() : void 0;
    }
    reset() {
      this.value = this.defaultValue;
    }
  };
  var kn = { VERSION: "2.0.4", config: W, core: oi, models: Ri, views: Ei, controllers: pn, observers: fn, operations: bn, elements: Object.freeze({ __proto__: null, TrixEditorElement: Sn, TrixToolbarElement: vn }), filters: Object.freeze({ __proto__: null, Filter: di, attachmentGalleryFilter: gi }) };
  Object.assign(kn, Ri), window.Trix = kn, setTimeout(function() {
    customElements.get("trix-toolbar") || customElements.define("trix-toolbar", vn), customElements.get("trix-editor") || customElements.define("trix-editor", Sn);
  }, 0);

  // ../../node_modules/@rails/actiontext/app/assets/javascripts/actiontext.js
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var activestorage = { exports: {} };
  (function(module3, exports) {
    (function(global4, factory) {
      factory(exports);
    })(commonjsGlobal, function(exports2) {
      var sparkMd5 = {
        exports: {}
      };
      (function(module4, exports3) {
        (function(factory) {
          {
            module4.exports = factory();
          }
        })(function(undefined$1) {
          var hex_chr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
          function md5cycle(x2, k2) {
            var a2 = x2[0], b2 = x2[1], c2 = x2[2], d2 = x2[3];
            a2 += (b2 & c2 | ~b2 & d2) + k2[0] - 680876936 | 0;
            a2 = (a2 << 7 | a2 >>> 25) + b2 | 0;
            d2 += (a2 & b2 | ~a2 & c2) + k2[1] - 389564586 | 0;
            d2 = (d2 << 12 | d2 >>> 20) + a2 | 0;
            c2 += (d2 & a2 | ~d2 & b2) + k2[2] + 606105819 | 0;
            c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
            b2 += (c2 & d2 | ~c2 & a2) + k2[3] - 1044525330 | 0;
            b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
            a2 += (b2 & c2 | ~b2 & d2) + k2[4] - 176418897 | 0;
            a2 = (a2 << 7 | a2 >>> 25) + b2 | 0;
            d2 += (a2 & b2 | ~a2 & c2) + k2[5] + 1200080426 | 0;
            d2 = (d2 << 12 | d2 >>> 20) + a2 | 0;
            c2 += (d2 & a2 | ~d2 & b2) + k2[6] - 1473231341 | 0;
            c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
            b2 += (c2 & d2 | ~c2 & a2) + k2[7] - 45705983 | 0;
            b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
            a2 += (b2 & c2 | ~b2 & d2) + k2[8] + 1770035416 | 0;
            a2 = (a2 << 7 | a2 >>> 25) + b2 | 0;
            d2 += (a2 & b2 | ~a2 & c2) + k2[9] - 1958414417 | 0;
            d2 = (d2 << 12 | d2 >>> 20) + a2 | 0;
            c2 += (d2 & a2 | ~d2 & b2) + k2[10] - 42063 | 0;
            c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
            b2 += (c2 & d2 | ~c2 & a2) + k2[11] - 1990404162 | 0;
            b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
            a2 += (b2 & c2 | ~b2 & d2) + k2[12] + 1804603682 | 0;
            a2 = (a2 << 7 | a2 >>> 25) + b2 | 0;
            d2 += (a2 & b2 | ~a2 & c2) + k2[13] - 40341101 | 0;
            d2 = (d2 << 12 | d2 >>> 20) + a2 | 0;
            c2 += (d2 & a2 | ~d2 & b2) + k2[14] - 1502002290 | 0;
            c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
            b2 += (c2 & d2 | ~c2 & a2) + k2[15] + 1236535329 | 0;
            b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
            a2 += (b2 & d2 | c2 & ~d2) + k2[1] - 165796510 | 0;
            a2 = (a2 << 5 | a2 >>> 27) + b2 | 0;
            d2 += (a2 & c2 | b2 & ~c2) + k2[6] - 1069501632 | 0;
            d2 = (d2 << 9 | d2 >>> 23) + a2 | 0;
            c2 += (d2 & b2 | a2 & ~b2) + k2[11] + 643717713 | 0;
            c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
            b2 += (c2 & a2 | d2 & ~a2) + k2[0] - 373897302 | 0;
            b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
            a2 += (b2 & d2 | c2 & ~d2) + k2[5] - 701558691 | 0;
            a2 = (a2 << 5 | a2 >>> 27) + b2 | 0;
            d2 += (a2 & c2 | b2 & ~c2) + k2[10] + 38016083 | 0;
            d2 = (d2 << 9 | d2 >>> 23) + a2 | 0;
            c2 += (d2 & b2 | a2 & ~b2) + k2[15] - 660478335 | 0;
            c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
            b2 += (c2 & a2 | d2 & ~a2) + k2[4] - 405537848 | 0;
            b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
            a2 += (b2 & d2 | c2 & ~d2) + k2[9] + 568446438 | 0;
            a2 = (a2 << 5 | a2 >>> 27) + b2 | 0;
            d2 += (a2 & c2 | b2 & ~c2) + k2[14] - 1019803690 | 0;
            d2 = (d2 << 9 | d2 >>> 23) + a2 | 0;
            c2 += (d2 & b2 | a2 & ~b2) + k2[3] - 187363961 | 0;
            c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
            b2 += (c2 & a2 | d2 & ~a2) + k2[8] + 1163531501 | 0;
            b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
            a2 += (b2 & d2 | c2 & ~d2) + k2[13] - 1444681467 | 0;
            a2 = (a2 << 5 | a2 >>> 27) + b2 | 0;
            d2 += (a2 & c2 | b2 & ~c2) + k2[2] - 51403784 | 0;
            d2 = (d2 << 9 | d2 >>> 23) + a2 | 0;
            c2 += (d2 & b2 | a2 & ~b2) + k2[7] + 1735328473 | 0;
            c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
            b2 += (c2 & a2 | d2 & ~a2) + k2[12] - 1926607734 | 0;
            b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
            a2 += (b2 ^ c2 ^ d2) + k2[5] - 378558 | 0;
            a2 = (a2 << 4 | a2 >>> 28) + b2 | 0;
            d2 += (a2 ^ b2 ^ c2) + k2[8] - 2022574463 | 0;
            d2 = (d2 << 11 | d2 >>> 21) + a2 | 0;
            c2 += (d2 ^ a2 ^ b2) + k2[11] + 1839030562 | 0;
            c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
            b2 += (c2 ^ d2 ^ a2) + k2[14] - 35309556 | 0;
            b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
            a2 += (b2 ^ c2 ^ d2) + k2[1] - 1530992060 | 0;
            a2 = (a2 << 4 | a2 >>> 28) + b2 | 0;
            d2 += (a2 ^ b2 ^ c2) + k2[4] + 1272893353 | 0;
            d2 = (d2 << 11 | d2 >>> 21) + a2 | 0;
            c2 += (d2 ^ a2 ^ b2) + k2[7] - 155497632 | 0;
            c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
            b2 += (c2 ^ d2 ^ a2) + k2[10] - 1094730640 | 0;
            b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
            a2 += (b2 ^ c2 ^ d2) + k2[13] + 681279174 | 0;
            a2 = (a2 << 4 | a2 >>> 28) + b2 | 0;
            d2 += (a2 ^ b2 ^ c2) + k2[0] - 358537222 | 0;
            d2 = (d2 << 11 | d2 >>> 21) + a2 | 0;
            c2 += (d2 ^ a2 ^ b2) + k2[3] - 722521979 | 0;
            c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
            b2 += (c2 ^ d2 ^ a2) + k2[6] + 76029189 | 0;
            b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
            a2 += (b2 ^ c2 ^ d2) + k2[9] - 640364487 | 0;
            a2 = (a2 << 4 | a2 >>> 28) + b2 | 0;
            d2 += (a2 ^ b2 ^ c2) + k2[12] - 421815835 | 0;
            d2 = (d2 << 11 | d2 >>> 21) + a2 | 0;
            c2 += (d2 ^ a2 ^ b2) + k2[15] + 530742520 | 0;
            c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
            b2 += (c2 ^ d2 ^ a2) + k2[2] - 995338651 | 0;
            b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
            a2 += (c2 ^ (b2 | ~d2)) + k2[0] - 198630844 | 0;
            a2 = (a2 << 6 | a2 >>> 26) + b2 | 0;
            d2 += (b2 ^ (a2 | ~c2)) + k2[7] + 1126891415 | 0;
            d2 = (d2 << 10 | d2 >>> 22) + a2 | 0;
            c2 += (a2 ^ (d2 | ~b2)) + k2[14] - 1416354905 | 0;
            c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
            b2 += (d2 ^ (c2 | ~a2)) + k2[5] - 57434055 | 0;
            b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
            a2 += (c2 ^ (b2 | ~d2)) + k2[12] + 1700485571 | 0;
            a2 = (a2 << 6 | a2 >>> 26) + b2 | 0;
            d2 += (b2 ^ (a2 | ~c2)) + k2[3] - 1894986606 | 0;
            d2 = (d2 << 10 | d2 >>> 22) + a2 | 0;
            c2 += (a2 ^ (d2 | ~b2)) + k2[10] - 1051523 | 0;
            c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
            b2 += (d2 ^ (c2 | ~a2)) + k2[1] - 2054922799 | 0;
            b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
            a2 += (c2 ^ (b2 | ~d2)) + k2[8] + 1873313359 | 0;
            a2 = (a2 << 6 | a2 >>> 26) + b2 | 0;
            d2 += (b2 ^ (a2 | ~c2)) + k2[15] - 30611744 | 0;
            d2 = (d2 << 10 | d2 >>> 22) + a2 | 0;
            c2 += (a2 ^ (d2 | ~b2)) + k2[6] - 1560198380 | 0;
            c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
            b2 += (d2 ^ (c2 | ~a2)) + k2[13] + 1309151649 | 0;
            b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
            a2 += (c2 ^ (b2 | ~d2)) + k2[4] - 145523070 | 0;
            a2 = (a2 << 6 | a2 >>> 26) + b2 | 0;
            d2 += (b2 ^ (a2 | ~c2)) + k2[11] - 1120210379 | 0;
            d2 = (d2 << 10 | d2 >>> 22) + a2 | 0;
            c2 += (a2 ^ (d2 | ~b2)) + k2[2] + 718787259 | 0;
            c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
            b2 += (d2 ^ (c2 | ~a2)) + k2[9] - 343485551 | 0;
            b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
            x2[0] = a2 + x2[0] | 0;
            x2[1] = b2 + x2[1] | 0;
            x2[2] = c2 + x2[2] | 0;
            x2[3] = d2 + x2[3] | 0;
          }
          function md5blk(s2) {
            var md5blks = [], i2;
            for (i2 = 0; i2 < 64; i2 += 4) {
              md5blks[i2 >> 2] = s2.charCodeAt(i2) + (s2.charCodeAt(i2 + 1) << 8) + (s2.charCodeAt(i2 + 2) << 16) + (s2.charCodeAt(i2 + 3) << 24);
            }
            return md5blks;
          }
          function md5blk_array(a2) {
            var md5blks = [], i2;
            for (i2 = 0; i2 < 64; i2 += 4) {
              md5blks[i2 >> 2] = a2[i2] + (a2[i2 + 1] << 8) + (a2[i2 + 2] << 16) + (a2[i2 + 3] << 24);
            }
            return md5blks;
          }
          function md51(s2) {
            var n2 = s2.length, state = [1732584193, -271733879, -1732584194, 271733878], i2, length, tail, tmp, lo, hi2;
            for (i2 = 64; i2 <= n2; i2 += 64) {
              md5cycle(state, md5blk(s2.substring(i2 - 64, i2)));
            }
            s2 = s2.substring(i2 - 64);
            length = s2.length;
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i2 = 0; i2 < length; i2 += 1) {
              tail[i2 >> 2] |= s2.charCodeAt(i2) << (i2 % 4 << 3);
            }
            tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
            if (i2 > 55) {
              md5cycle(state, tail);
              for (i2 = 0; i2 < 16; i2 += 1) {
                tail[i2] = 0;
              }
            }
            tmp = n2 * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi2 = parseInt(tmp[1], 16) || 0;
            tail[14] = lo;
            tail[15] = hi2;
            md5cycle(state, tail);
            return state;
          }
          function md51_array(a2) {
            var n2 = a2.length, state = [1732584193, -271733879, -1732584194, 271733878], i2, length, tail, tmp, lo, hi2;
            for (i2 = 64; i2 <= n2; i2 += 64) {
              md5cycle(state, md5blk_array(a2.subarray(i2 - 64, i2)));
            }
            a2 = i2 - 64 < n2 ? a2.subarray(i2 - 64) : new Uint8Array(0);
            length = a2.length;
            tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (i2 = 0; i2 < length; i2 += 1) {
              tail[i2 >> 2] |= a2[i2] << (i2 % 4 << 3);
            }
            tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
            if (i2 > 55) {
              md5cycle(state, tail);
              for (i2 = 0; i2 < 16; i2 += 1) {
                tail[i2] = 0;
              }
            }
            tmp = n2 * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi2 = parseInt(tmp[1], 16) || 0;
            tail[14] = lo;
            tail[15] = hi2;
            md5cycle(state, tail);
            return state;
          }
          function rhex(n2) {
            var s2 = "", j2;
            for (j2 = 0; j2 < 4; j2 += 1) {
              s2 += hex_chr[n2 >> j2 * 8 + 4 & 15] + hex_chr[n2 >> j2 * 8 & 15];
            }
            return s2;
          }
          function hex(x2) {
            var i2;
            for (i2 = 0; i2 < x2.length; i2 += 1) {
              x2[i2] = rhex(x2[i2]);
            }
            return x2.join("");
          }
          if (hex(md51("hello")) !== "5d41402abc4b2a76b9719d911017c592")
            ;
          if (typeof ArrayBuffer !== "undefined" && !ArrayBuffer.prototype.slice) {
            (function() {
              function clamp(val, length) {
                val = val | 0 || 0;
                if (val < 0) {
                  return Math.max(val + length, 0);
                }
                return Math.min(val, length);
              }
              ArrayBuffer.prototype.slice = function(from, to) {
                var length = this.byteLength, begin = clamp(from, length), end = length, num, target, targetArray, sourceArray;
                if (to !== undefined$1) {
                  end = clamp(to, length);
                }
                if (begin > end) {
                  return new ArrayBuffer(0);
                }
                num = end - begin;
                target = new ArrayBuffer(num);
                targetArray = new Uint8Array(target);
                sourceArray = new Uint8Array(this, begin, num);
                targetArray.set(sourceArray);
                return target;
              };
            })();
          }
          function toUtf8(str) {
            if (/[\u0080-\uFFFF]/.test(str)) {
              str = unescape(encodeURIComponent(str));
            }
            return str;
          }
          function utf8Str2ArrayBuffer(str, returnUInt8Array) {
            var length = str.length, buff = new ArrayBuffer(length), arr = new Uint8Array(buff), i2;
            for (i2 = 0; i2 < length; i2 += 1) {
              arr[i2] = str.charCodeAt(i2);
            }
            return returnUInt8Array ? arr : buff;
          }
          function arrayBuffer2Utf8Str(buff) {
            return String.fromCharCode.apply(null, new Uint8Array(buff));
          }
          function concatenateArrayBuffers(first, second, returnUInt8Array) {
            var result = new Uint8Array(first.byteLength + second.byteLength);
            result.set(new Uint8Array(first));
            result.set(new Uint8Array(second), first.byteLength);
            return returnUInt8Array ? result : result.buffer;
          }
          function hexToBinaryString(hex2) {
            var bytes = [], length = hex2.length, x2;
            for (x2 = 0; x2 < length - 1; x2 += 2) {
              bytes.push(parseInt(hex2.substr(x2, 2), 16));
            }
            return String.fromCharCode.apply(String, bytes);
          }
          function SparkMD52() {
            this.reset();
          }
          SparkMD52.prototype.append = function(str) {
            this.appendBinary(toUtf8(str));
            return this;
          };
          SparkMD52.prototype.appendBinary = function(contents) {
            this._buff += contents;
            this._length += contents.length;
            var length = this._buff.length, i2;
            for (i2 = 64; i2 <= length; i2 += 64) {
              md5cycle(this._hash, md5blk(this._buff.substring(i2 - 64, i2)));
            }
            this._buff = this._buff.substring(i2 - 64);
            return this;
          };
          SparkMD52.prototype.end = function(raw) {
            var buff = this._buff, length = buff.length, i2, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ret;
            for (i2 = 0; i2 < length; i2 += 1) {
              tail[i2 >> 2] |= buff.charCodeAt(i2) << (i2 % 4 << 3);
            }
            this._finish(tail, length);
            ret = hex(this._hash);
            if (raw) {
              ret = hexToBinaryString(ret);
            }
            this.reset();
            return ret;
          };
          SparkMD52.prototype.reset = function() {
            this._buff = "";
            this._length = 0;
            this._hash = [1732584193, -271733879, -1732584194, 271733878];
            return this;
          };
          SparkMD52.prototype.getState = function() {
            return {
              buff: this._buff,
              length: this._length,
              hash: this._hash.slice()
            };
          };
          SparkMD52.prototype.setState = function(state) {
            this._buff = state.buff;
            this._length = state.length;
            this._hash = state.hash;
            return this;
          };
          SparkMD52.prototype.destroy = function() {
            delete this._hash;
            delete this._buff;
            delete this._length;
          };
          SparkMD52.prototype._finish = function(tail, length) {
            var i2 = length, tmp, lo, hi2;
            tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
            if (i2 > 55) {
              md5cycle(this._hash, tail);
              for (i2 = 0; i2 < 16; i2 += 1) {
                tail[i2] = 0;
              }
            }
            tmp = this._length * 8;
            tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
            lo = parseInt(tmp[2], 16);
            hi2 = parseInt(tmp[1], 16) || 0;
            tail[14] = lo;
            tail[15] = hi2;
            md5cycle(this._hash, tail);
          };
          SparkMD52.hash = function(str, raw) {
            return SparkMD52.hashBinary(toUtf8(str), raw);
          };
          SparkMD52.hashBinary = function(content, raw) {
            var hash = md51(content), ret = hex(hash);
            return raw ? hexToBinaryString(ret) : ret;
          };
          SparkMD52.ArrayBuffer = function() {
            this.reset();
          };
          SparkMD52.ArrayBuffer.prototype.append = function(arr) {
            var buff = concatenateArrayBuffers(this._buff.buffer, arr, true), length = buff.length, i2;
            this._length += arr.byteLength;
            for (i2 = 64; i2 <= length; i2 += 64) {
              md5cycle(this._hash, md5blk_array(buff.subarray(i2 - 64, i2)));
            }
            this._buff = i2 - 64 < length ? new Uint8Array(buff.buffer.slice(i2 - 64)) : new Uint8Array(0);
            return this;
          };
          SparkMD52.ArrayBuffer.prototype.end = function(raw) {
            var buff = this._buff, length = buff.length, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], i2, ret;
            for (i2 = 0; i2 < length; i2 += 1) {
              tail[i2 >> 2] |= buff[i2] << (i2 % 4 << 3);
            }
            this._finish(tail, length);
            ret = hex(this._hash);
            if (raw) {
              ret = hexToBinaryString(ret);
            }
            this.reset();
            return ret;
          };
          SparkMD52.ArrayBuffer.prototype.reset = function() {
            this._buff = new Uint8Array(0);
            this._length = 0;
            this._hash = [1732584193, -271733879, -1732584194, 271733878];
            return this;
          };
          SparkMD52.ArrayBuffer.prototype.getState = function() {
            var state = SparkMD52.prototype.getState.call(this);
            state.buff = arrayBuffer2Utf8Str(state.buff);
            return state;
          };
          SparkMD52.ArrayBuffer.prototype.setState = function(state) {
            state.buff = utf8Str2ArrayBuffer(state.buff, true);
            return SparkMD52.prototype.setState.call(this, state);
          };
          SparkMD52.ArrayBuffer.prototype.destroy = SparkMD52.prototype.destroy;
          SparkMD52.ArrayBuffer.prototype._finish = SparkMD52.prototype._finish;
          SparkMD52.ArrayBuffer.hash = function(arr, raw) {
            var hash = md51_array(new Uint8Array(arr)), ret = hex(hash);
            return raw ? hexToBinaryString(ret) : ret;
          };
          return SparkMD52;
        });
      })(sparkMd5);
      var SparkMD5 = sparkMd5.exports;
      const fileSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
      class FileChecksum {
        static create(file, callback) {
          const instance = new FileChecksum(file);
          instance.create(callback);
        }
        constructor(file) {
          this.file = file;
          this.chunkSize = 2097152;
          this.chunkCount = Math.ceil(this.file.size / this.chunkSize);
          this.chunkIndex = 0;
        }
        create(callback) {
          this.callback = callback;
          this.md5Buffer = new SparkMD5.ArrayBuffer();
          this.fileReader = new FileReader();
          this.fileReader.addEventListener("load", (event) => this.fileReaderDidLoad(event));
          this.fileReader.addEventListener("error", (event) => this.fileReaderDidError(event));
          this.readNextChunk();
        }
        fileReaderDidLoad(event) {
          this.md5Buffer.append(event.target.result);
          if (!this.readNextChunk()) {
            const binaryDigest = this.md5Buffer.end(true);
            const base64digest = btoa(binaryDigest);
            this.callback(null, base64digest);
          }
        }
        fileReaderDidError(event) {
          this.callback(`Error reading ${this.file.name}`);
        }
        readNextChunk() {
          if (this.chunkIndex < this.chunkCount || this.chunkIndex == 0 && this.chunkCount == 0) {
            const start2 = this.chunkIndex * this.chunkSize;
            const end = Math.min(start2 + this.chunkSize, this.file.size);
            const bytes = fileSlice.call(this.file, start2, end);
            this.fileReader.readAsArrayBuffer(bytes);
            this.chunkIndex++;
            return true;
          } else {
            return false;
          }
        }
      }
      function getMetaValue(name3) {
        const element = findElement(document.head, `meta[name="${name3}"]`);
        if (element) {
          return element.getAttribute("content");
        }
      }
      function findElements(root, selector) {
        if (typeof root == "string") {
          selector = root;
          root = document;
        }
        const elements = root.querySelectorAll(selector);
        return toArray(elements);
      }
      function findElement(root, selector) {
        if (typeof root == "string") {
          selector = root;
          root = document;
        }
        return root.querySelector(selector);
      }
      function dispatchEvent(element, type, eventInit = {}) {
        const { disabled } = element;
        const { bubbles, cancelable, detail } = eventInit;
        const event = document.createEvent("Event");
        event.initEvent(type, bubbles || true, cancelable || true);
        event.detail = detail || {};
        try {
          element.disabled = false;
          element.dispatchEvent(event);
        } finally {
          element.disabled = disabled;
        }
        return event;
      }
      function toArray(value) {
        if (Array.isArray(value)) {
          return value;
        } else if (Array.from) {
          return Array.from(value);
        } else {
          return [].slice.call(value);
        }
      }
      class BlobRecord {
        constructor(file, checksum, url) {
          this.file = file;
          this.attributes = {
            filename: file.name,
            content_type: file.type || "application/octet-stream",
            byte_size: file.size,
            checksum
          };
          this.xhr = new XMLHttpRequest();
          this.xhr.open("POST", url, true);
          this.xhr.responseType = "json";
          this.xhr.setRequestHeader("Content-Type", "application/json");
          this.xhr.setRequestHeader("Accept", "application/json");
          this.xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          const csrfToken = getMetaValue("csrf-token");
          if (csrfToken != void 0) {
            this.xhr.setRequestHeader("X-CSRF-Token", csrfToken);
          }
          this.xhr.addEventListener("load", (event) => this.requestDidLoad(event));
          this.xhr.addEventListener("error", (event) => this.requestDidError(event));
        }
        get status() {
          return this.xhr.status;
        }
        get response() {
          const { responseType, response: response2 } = this.xhr;
          if (responseType == "json") {
            return response2;
          } else {
            return JSON.parse(response2);
          }
        }
        create(callback) {
          this.callback = callback;
          this.xhr.send(JSON.stringify({
            blob: this.attributes
          }));
        }
        requestDidLoad(event) {
          if (this.status >= 200 && this.status < 300) {
            const { response: response2 } = this;
            const { direct_upload } = response2;
            delete response2.direct_upload;
            this.attributes = response2;
            this.directUploadData = direct_upload;
            this.callback(null, this.toJSON());
          } else {
            this.requestDidError(event);
          }
        }
        requestDidError(event) {
          this.callback(`Error creating Blob for "${this.file.name}". Status: ${this.status}`);
        }
        toJSON() {
          const result = {};
          for (const key in this.attributes) {
            result[key] = this.attributes[key];
          }
          return result;
        }
      }
      class BlobUpload {
        constructor(blob) {
          this.blob = blob;
          this.file = blob.file;
          const { url, headers } = blob.directUploadData;
          this.xhr = new XMLHttpRequest();
          this.xhr.open("PUT", url, true);
          this.xhr.responseType = "text";
          for (const key in headers) {
            this.xhr.setRequestHeader(key, headers[key]);
          }
          this.xhr.addEventListener("load", (event) => this.requestDidLoad(event));
          this.xhr.addEventListener("error", (event) => this.requestDidError(event));
        }
        create(callback) {
          this.callback = callback;
          this.xhr.send(this.file.slice());
        }
        requestDidLoad(event) {
          const { status, response: response2 } = this.xhr;
          if (status >= 200 && status < 300) {
            this.callback(null, response2);
          } else {
            this.requestDidError(event);
          }
        }
        requestDidError(event) {
          this.callback(`Error storing "${this.file.name}". Status: ${this.xhr.status}`);
        }
      }
      let id = 0;
      class DirectUpload {
        constructor(file, url, delegate) {
          this.id = ++id;
          this.file = file;
          this.url = url;
          this.delegate = delegate;
        }
        create(callback) {
          FileChecksum.create(this.file, (error3, checksum) => {
            if (error3) {
              callback(error3);
              return;
            }
            const blob = new BlobRecord(this.file, checksum, this.url);
            notify(this.delegate, "directUploadWillCreateBlobWithXHR", blob.xhr);
            blob.create((error4) => {
              if (error4) {
                callback(error4);
              } else {
                const upload = new BlobUpload(blob);
                notify(this.delegate, "directUploadWillStoreFileWithXHR", upload.xhr);
                upload.create((error5) => {
                  if (error5) {
                    callback(error5);
                  } else {
                    callback(null, blob.toJSON());
                  }
                });
              }
            });
          });
        }
      }
      function notify(object, methodName, ...messages) {
        if (object && typeof object[methodName] == "function") {
          return object[methodName](...messages);
        }
      }
      class DirectUploadController {
        constructor(input, file) {
          this.input = input;
          this.file = file;
          this.directUpload = new DirectUpload(this.file, this.url, this);
          this.dispatch("initialize");
        }
        start(callback) {
          const hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = this.input.name;
          this.input.insertAdjacentElement("beforebegin", hiddenInput);
          this.dispatch("start");
          this.directUpload.create((error3, attributes) => {
            if (error3) {
              hiddenInput.parentNode.removeChild(hiddenInput);
              this.dispatchError(error3);
            } else {
              hiddenInput.value = attributes.signed_id;
            }
            this.dispatch("end");
            callback(error3);
          });
        }
        uploadRequestDidProgress(event) {
          const progress2 = event.loaded / event.total * 100;
          if (progress2) {
            this.dispatch("progress", {
              progress: progress2
            });
          }
        }
        get url() {
          return this.input.getAttribute("data-direct-upload-url");
        }
        dispatch(name3, detail = {}) {
          detail.file = this.file;
          detail.id = this.directUpload.id;
          return dispatchEvent(this.input, `direct-upload:${name3}`, {
            detail
          });
        }
        dispatchError(error3) {
          const event = this.dispatch("error", {
            error: error3
          });
          if (!event.defaultPrevented) {
            alert(error3);
          }
        }
        directUploadWillCreateBlobWithXHR(xhr) {
          this.dispatch("before-blob-request", {
            xhr
          });
        }
        directUploadWillStoreFileWithXHR(xhr) {
          this.dispatch("before-storage-request", {
            xhr
          });
          xhr.upload.addEventListener("progress", (event) => this.uploadRequestDidProgress(event));
        }
      }
      const inputSelector = "input[type=file][data-direct-upload-url]:not([disabled])";
      class DirectUploadsController {
        constructor(form) {
          this.form = form;
          this.inputs = findElements(form, inputSelector).filter((input) => input.files.length);
        }
        start(callback) {
          const controllers = this.createDirectUploadControllers();
          const startNextController = () => {
            const controller = controllers.shift();
            if (controller) {
              controller.start((error3) => {
                if (error3) {
                  callback(error3);
                  this.dispatch("end");
                } else {
                  startNextController();
                }
              });
            } else {
              callback();
              this.dispatch("end");
            }
          };
          this.dispatch("start");
          startNextController();
        }
        createDirectUploadControllers() {
          const controllers = [];
          this.inputs.forEach((input) => {
            toArray(input.files).forEach((file) => {
              const controller = new DirectUploadController(input, file);
              controllers.push(controller);
            });
          });
          return controllers;
        }
        dispatch(name3, detail = {}) {
          return dispatchEvent(this.form, `direct-uploads:${name3}`, {
            detail
          });
        }
      }
      const processingAttribute = "data-direct-uploads-processing";
      const submitButtonsByForm = /* @__PURE__ */ new WeakMap();
      let started = false;
      function start() {
        if (!started) {
          started = true;
          document.addEventListener("click", didClick, true);
          document.addEventListener("submit", didSubmitForm, true);
          document.addEventListener("ajax:before", didSubmitRemoteElement);
        }
      }
      function didClick(event) {
        const { target } = event;
        if ((target.tagName == "INPUT" || target.tagName == "BUTTON") && target.type == "submit" && target.form) {
          submitButtonsByForm.set(target.form, target);
        }
      }
      function didSubmitForm(event) {
        handleFormSubmissionEvent(event);
      }
      function didSubmitRemoteElement(event) {
        if (event.target.tagName == "FORM") {
          handleFormSubmissionEvent(event);
        }
      }
      function handleFormSubmissionEvent(event) {
        const form = event.target;
        if (form.hasAttribute(processingAttribute)) {
          event.preventDefault();
          return;
        }
        const controller = new DirectUploadsController(form);
        const { inputs } = controller;
        if (inputs.length) {
          event.preventDefault();
          form.setAttribute(processingAttribute, "");
          inputs.forEach(disable);
          controller.start((error3) => {
            form.removeAttribute(processingAttribute);
            if (error3) {
              inputs.forEach(enable);
            } else {
              submitForm(form);
            }
          });
        }
      }
      function submitForm(form) {
        let button = submitButtonsByForm.get(form) || findElement(form, "input[type=submit], button[type=submit]");
        if (button) {
          const { disabled } = button;
          button.disabled = false;
          button.focus();
          button.click();
          button.disabled = disabled;
        } else {
          button = document.createElement("input");
          button.type = "submit";
          button.style.display = "none";
          form.appendChild(button);
          button.click();
          form.removeChild(button);
        }
        submitButtonsByForm.delete(form);
      }
      function disable(input) {
        input.disabled = true;
      }
      function enable(input) {
        input.disabled = false;
      }
      function autostart() {
        if (window.ActiveStorage) {
          start();
        }
      }
      setTimeout(autostart, 1);
      exports2.DirectUpload = DirectUpload;
      exports2.start = start;
      Object.defineProperty(exports2, "__esModule", {
        value: true
      });
    });
  })(activestorage, activestorage.exports);
  var AttachmentUpload = class {
    constructor(attachment, element) {
      this.attachment = attachment;
      this.element = element;
      this.directUpload = new activestorage.exports.DirectUpload(attachment.file, this.directUploadUrl, this);
    }
    start() {
      this.directUpload.create(this.directUploadDidComplete.bind(this));
    }
    directUploadWillStoreFileWithXHR(xhr) {
      xhr.upload.addEventListener("progress", (event) => {
        const progress2 = event.loaded / event.total * 100;
        this.attachment.setUploadProgress(progress2);
      });
    }
    directUploadDidComplete(error3, attributes) {
      if (error3) {
        throw new Error(`Direct upload failed: ${error3}`);
      }
      this.attachment.setAttributes({
        sgid: attributes.attachable_sgid,
        url: this.createBlobUrl(attributes.signed_id, attributes.filename)
      });
    }
    createBlobUrl(signedId, filename) {
      return this.blobUrlTemplate.replace(":signed_id", signedId).replace(":filename", encodeURIComponent(filename));
    }
    get directUploadUrl() {
      return this.element.dataset.directUploadUrl;
    }
    get blobUrlTemplate() {
      return this.element.dataset.blobUrlTemplate;
    }
  };
  addEventListener("trix-attachment-add", (event) => {
    const { attachment, target } = event;
    if (attachment.file) {
      const upload = new AttachmentUpload(attachment, target);
      upload.start();
    }
  });
})();
/*! Bundled license information:

stimulus_reflex/dist/stimulus_reflex.js:
  (*!
   * Toastify js 1.12.0
   * https://github.com/apvarun/toastify-js
   * @license MIT licensed
   *
   * Copyright (C) 2018 Varun A P
   *)
*/
//# sourceMappingURL=application.js.map
