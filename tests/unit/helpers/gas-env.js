'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC_DIR = path.resolve(__dirname, '../../../src');

const SOURCE_FILES = [
  'version.js',
  'util.js',
  'util.lch.js',
  'selection.js',
  'core.js',
  'core.colors.js',
  'main.js',
];

const ENUMS = {
  PageElementType: Object.freeze({
    UNSUPPORTED: 'UNSUPPORTED',
    SHAPE: 'SHAPE',
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    TABLE: 'TABLE',
    GROUP: 'GROUP',
    LINE: 'LINE',
    WORD_ART: 'WORD_ART',
    SHEETS_CHART: 'SHEETS_CHART',
  }),
  PageType: Object.freeze({
    UNSUPPORTED: 'UNSUPPORTED',
    SLIDE: 'SLIDE',
    LAYOUT: 'LAYOUT',
    MASTER: 'MASTER',
    NOTES: 'NOTES',
  }),
  SelectionType: Object.freeze({
    UNSUPPORTED: 'UNSUPPORTED',
    NONE: 'NONE',
    TEXT: 'TEXT',
    TABLE_CELL: 'TABLE_CELL',
    PAGE: 'PAGE',
    PAGE_ELEMENT: 'PAGE_ELEMENT',
    CURRENT_PAGE: 'CURRENT_PAGE',
  }),
  FillType: Object.freeze({
    UNSUPPORTED: 'UNSUPPORTED',
    NONE: 'NONE',
    SOLID: 'SOLID',
  }),
  ColorType: Object.freeze({
    UNSUPPORTED: 'UNSUPPORTED',
    RGB: 'RGB',
    THEME: 'THEME',
  }),
  ThemeColorType: Object.freeze({
    UNSUPPORTED: 'UNSUPPORTED',
    DARK1: 'DARK1',
    LIGHT1: 'LIGHT1',
    DARK2: 'DARK2',
    LIGHT2: 'LIGHT2',
    ACCENT1: 'ACCENT1',
    ACCENT2: 'ACCENT2',
    ACCENT3: 'ACCENT3',
    ACCENT4: 'ACCENT4',
    ACCENT5: 'ACCENT5',
    ACCENT6: 'ACCENT6',
    HYPERLINK: 'HYPERLINK',
    FOLLOWED_HYPERLINK: 'FOLLOWED_HYPERLINK',
    TEXT1: 'TEXT1',
    BACKGROUND1: 'BACKGROUND1',
    TEXT2: 'TEXT2',
    BACKGROUND2: 'BACKGROUND2',
  }),
  ShapeType: Object.freeze({
    RECTANGLE: 'RECTANGLE',
    TEXT_BOX: 'TEXT_BOX',
    ELLIPSE: 'ELLIPSE',
  }),
};

const DEFAULT_THEME_COLORS = {
  DARK1: [0, 0, 0],
  LIGHT1: [255, 255, 255],
  DARK2: [89, 89, 89],
  LIGHT2: [238, 238, 238],
  ACCENT1: [255, 171, 64],
  ACCENT2: [33, 150, 243],
  ACCENT3: [76, 175, 80],
  ACCENT4: [244, 67, 54],
  ACCENT5: [156, 39, 176],
  ACCENT6: [0, 188, 212],
  TEXT1: [0, 0, 0],
  BACKGROUND1: [255, 255, 255],
  TEXT2: [89, 89, 89],
  BACKGROUND2: [238, 238, 238],
};

function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function createRgbColor(r, g, b) {
  return {
    getRed: () => r,
    getGreen: () => g,
    getBlue: () => b,
    asHexString: () => rgbToHex(r, g, b),
  };
}

function createThemeColor(themeColorType) {
  return {
    getThemeColorType: () => themeColorType,
  };
}

function createColor(spec) {
  if (spec && typeof spec.getColorType === 'function') {
    return spec;
  }
  if (Array.isArray(spec)) {
    const rgb = createRgbColor(spec[0], spec[1], spec[2]);
    return {
      getColorType: () => ENUMS.ColorType.RGB,
      asRgbColor: () => rgb,
      asThemeColor: () => { throw new Error('Color is RGB, not THEME'); },
    };
  }
  if (typeof spec === 'string' && spec.startsWith('#')) {
    return createColor(hexToRgb(spec));
  }
  if (typeof spec === 'string' && Object.values(ENUMS.ThemeColorType).includes(spec)) {
    const theme = createThemeColor(spec);
    return {
      getColorType: () => ENUMS.ColorType.THEME,
      asRgbColor: () => { throw new Error('Color is THEME, not RGB'); },
      asThemeColor: () => theme,
    };
  }
  if (spec && spec.type === ENUMS.ColorType.UNSUPPORTED) {
    return {
      getColorType: () => ENUMS.ColorType.UNSUPPORTED,
      asRgbColor: () => { throw new Error('Color is UNSUPPORTED'); },
      asThemeColor: () => { throw new Error('Color is UNSUPPORTED'); },
    };
  }
  throw new Error(`Unsupported color spec: ${JSON.stringify(spec)}`);
}

function parseColorArgs(args) {
  if (args.length >= 3 && typeof args[0] === 'number') {
    return {
      color: createColor([args[0], args[1], args[2]]),
      alpha: typeof args[3] === 'number' ? args[3] : 1,
    };
  }
  if (args.length >= 1) {
    if (args[0] === null || args[0] === undefined) {
      throw new Error('Invalid argument: color cannot be null or undefined');
    }
    return {
      color: createColor(args[0]),
      alpha: typeof args[1] === 'number' ? args[1] : 1,
    };
  }
  throw new Error('Invalid color arguments');
}

function createFill(initial = {}) {
  let fillType = initial.type || (initial.color ? ENUMS.FillType.SOLID : ENUMS.FillType.NONE);
  let solidColor = initial.color ? createColor(initial.color) : null;
  let solidAlpha = typeof initial.alpha === 'number' ? initial.alpha : 1;

  return {
    getType: () => fillType,
    getSolidFill: () => {
      if (fillType !== ENUMS.FillType.SOLID) return null;
      return {
        getColor: () => solidColor,
        getAlpha: () => solidAlpha,
      };
    },
    setSolidFill: (...args) => {
      const parsed = parseColorArgs(args);
      fillType = ENUMS.FillType.SOLID;
      solidColor = parsed.color;
      solidAlpha = parsed.alpha;
    },
    setTransparent: () => {
      fillType = ENUMS.FillType.NONE;
      solidColor = null;
      solidAlpha = 1;
    },
  };
}

function createTextStyle(initialColor = [0, 0, 0]) {
  let fgColor = initialColor === null ? null : createColor(initialColor);
  return {
    getForegroundColor: () => fgColor,
    setForegroundColor: (...args) => {
      const parsed = parseColorArgs(args);
      fgColor = parsed.color;
    },
  };
}

function createTextRange(initialText = '', initialRuns = null) {
  let runs = initialRuns
    ? initialRuns.map((r) => ({
        text: r.text,
        style: createTextStyle(r.color !== undefined ? r.color : [0, 0, 0]),
      }))
    : [{ text: initialText, style: createTextStyle([0, 0, 0]) }];

  const getFullText = () => runs.map((r) => r.text).join('');

  const rangeStyle = {
    getForegroundColor: () => runs[0].style.getForegroundColor(),
    setForegroundColor: (...args) => {
      runs.forEach((r) => r.style.setForegroundColor(...args));
    },
  };

  return {
    getLength: () => getFullText().length + 1, // Slides always appends a trailing newline
    asString: () => `${getFullText()}\n`,
    setText: (str) => {
      runs = [{ text: str, style: runs[0] ? runs[0].style : createTextStyle([0, 0, 0]) }];
    },
    getTextStyle: () => rangeStyle,
    getRuns: () =>
      runs.map((r) => ({
        getLength: () => r.text.length,
        asString: () => r.text,
        getTextStyle: () => r.style,
      })),
  };
}

function createGasEnv(options = {}) {
  let nextId = 1;
  const rpcCounts = {};
  const count = (key) => {
    rpcCounts[key] = (rpcCounts[key] || 0) + 1;
  };

  const pageWidth = options.pageWidth || 720;
  const pageHeight = options.pageHeight || 405;

  const createColorScheme = (overrides = {}) => {
    const map = { ...DEFAULT_THEME_COLORS, ...overrides };
    return {
      getConcreteColor: (themeColorType) => {
        count('getConcreteColor');
        const entry = map[themeColorType];
        if (!entry) return null;
        return createColor(entry);
      },
    };
  };

  const createPage = ({
    pageType = ENUMS.PageType.SLIDE,
    elements = [],
    themeColors = {},
  } = {}) => {
    const colorScheme = createColorScheme(themeColors);
    const page = {
      getPageType: () => pageType,
      getPageElements: () => {
        count('getPageElements');
        return elements.slice();
      },
      getColorScheme: () => colorScheme,
      asSlide: () => {
        if (pageType !== ENUMS.PageType.SLIDE) {
          throw new Error(`Page is ${pageType}, not SLIDE`);
        }
        return page;
      },
      asLayout: () => {
        if (pageType !== ENUMS.PageType.LAYOUT) {
          throw new Error(`Page is ${pageType}, not LAYOUT`);
        }
        return page;
      },
      asMaster: () => {
        if (pageType !== ENUMS.PageType.MASTER) {
          throw new Error(`Page is ${pageType}, not MASTER`);
        }
        return page;
      },
      _addElement: (el) => {
        elements.push(el);
        el._setParentPage(page);
      },
    };
    elements.forEach((el) => el._setParentPage(page));
    return page;
  };

  const defaultSlide = createPage({ pageType: ENUMS.PageType.SLIDE });

  const createBaseElement = ({
    id = `el_${nextId++}`,
    type = ENUMS.PageElementType.SHAPE,
    left = 0,
    top = 0,
    width = 72,
    height = 72,
    rotation = 0,
    parentGroup = null,
    parentPage = defaultSlide,
    allowRotation = true,
    allowResize = true,
  } = {}) => {
    let _left = left;
    let _top = top;
    let _width = width;
    let _height = height;
    let _rotation = rotation;
    let _parentGroup = parentGroup;
    let _parentPage = parentPage;

    const el = {
      getObjectId: () => id,
      getPageElementType: () => {
        count('getPageElementType');
        return type;
      },
      getLeft: () => {
        count('getLeft');
        return _left;
      },
      setLeft: (v) => {
        count('setLeft');
        _left = v;
        return el;
      },
      getTop: () => {
        count('getTop');
        return _top;
      },
      setTop: (v) => {
        count('setTop');
        _top = v;
        return el;
      },
      getWidth: () => {
        count('getWidth');
        return _width;
      },
      setWidth: (v) => {
        count('setWidth');
        if (!allowResize) {
          throw new Error(`Updating the size of ${type} is not supported`);
        }
        _width = v;
        return el;
      },
      getHeight: () => {
        count('getHeight');
        return _height;
      },
      setHeight: (v) => {
        count('setHeight');
        if (!allowResize) {
          throw new Error(`Updating the size of ${type} is not supported`);
        }
        _height = v;
        return el;
      },
      getRotation: () => {
        count('getRotation');
        return _rotation;
      },
      setRotation: (v) => {
        count('setRotation');
        if (!allowRotation) {
          throw new Error(`Element of type ${type} cannot be rotated`);
        }
        _rotation = v;
        return el;
      },
      getParentGroup: () => _parentGroup,
      getParentPage: () => _parentPage,
      _setParentGroup: (g) => { _parentGroup = g; },
      _setParentPage: (p) => { _parentPage = p; },
      asShape: () => { throw new Error(`Element ${id} is ${type}, not SHAPE`); },
      asGroup: () => { throw new Error(`Element ${id} is ${type}, not GROUP`); },
    };

    return el;
  };

  const createShape = (opts = {}) => {
    const el = createBaseElement({ ...opts, type: ENUMS.PageElementType.SHAPE });
    const fill = createFill({
      type: opts.fillType,
      color: opts.fillColor,
      alpha: opts.fillAlpha,
    });
    const textRange = createTextRange(opts.text || '', opts.runs || null);

    el.getFill = () => {
      count('getFill');
      return fill;
    };
    el.getText = () => {
      count('getText');
      return textRange;
    };
    el.asShape = () => el;

    if (opts.addToPage !== false && el.getParentPage()) {
      el.getParentPage()._addElement(el);
    }
    return el;
  };

  const createGroup = (children = [], opts = {}) => {
    const el = createBaseElement({ ...opts, type: ENUMS.PageElementType.GROUP });
    children.forEach((child) => {
      child._setParentGroup(el);
      if (el.getParentPage()) child._setParentPage(el.getParentPage());
    });
    el.getChildren = () => children.slice();
    el.asGroup = () => el;

    if (opts.addToPage !== false && el.getParentPage()) {
      el.getParentPage()._addElement(el);
    }
    return el;
  };

  const createTable = (opts = {}) => {
    const el = createBaseElement({
      ...opts,
      type: ENUMS.PageElementType.TABLE,
      allowRotation: false,
      allowResize: false,
    });
    if (opts.addToPage !== false && el.getParentPage()) {
      el.getParentPage()._addElement(el);
    }
    return el;
  };

  const createLine = (opts = {}) => {
    const el = createBaseElement({
      ...opts,
      type: ENUMS.PageElementType.LINE,
    });
    if (opts.addToPage !== false && el.getParentPage()) {
      el.getParentPage()._addElement(el);
    }
    return el;
  };

  const ui = {
    ButtonSet: Object.freeze({
      OK: 'OK',
      OK_CANCEL: 'OK_CANCEL',
      YES_NO: 'YES_NO',
      YES_NO_CANCEL: 'YES_NO_CANCEL',
    }),
    alerts: [],
    addonMenus: [],
    alert: (title, prompt, buttons) => {
      ui.alerts.push({ title, prompt, buttons });
      return 'OK';
    },
    _makeMenu: (caption) => {
      const menu = {
        caption,
        items: [],
        addItem(label, fnName) {
          this.items.push({ type: 'item', label, fnName });
          return this;
        },
        addSeparator() {
          this.items.push({ type: 'separator' });
          return this;
        },
        addSubMenu(subMenu) {
          this.items.push({ type: 'submenu', menu: subMenu });
          return this;
        },
        addToUi() {
          ui.addonMenus.push(this);
        },
      };
      return menu;
    },
    createAddonMenu: () => ui._makeMenu('AddonMenu'),
    createMenu: (caption) => ui._makeMenu(caption),
  };

  let currentSelection = {
    type: ENUMS.SelectionType.CURRENT_PAGE,
    elements: [],
    currentPage: defaultSlide,
  };

  const presentation = {
    getPageWidth: () => {
      count('getPageWidth');
      return pageWidth;
    },
    getPageHeight: () => {
      count('getPageHeight');
      return pageHeight;
    },
    getSelection: () => ({
      getSelectionType: () => currentSelection.type,
      getPageElementRange: () => ({
        getPageElements: () => currentSelection.elements.slice(),
      }),
      getCurrentPage: () => currentSelection.currentPage,
    }),
  };

  const SlidesApp = {
    ...ENUMS,
    getUi: () => {
      count('getUi');
      return ui;
    },
    getActivePresentation: () => {
      count('getActivePresentation');
      return presentation;
    },
  };

  const logs = [];
  const context = vm.createContext({
    SlidesApp,
    Logger: { log: (msg) => logs.push(String(msg)) },
    console,
    Math,
    Array,
    Object,
    Number,
    String,
    Boolean,
    Set,
    Map,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  });

  for (const filename of SOURCE_FILES) {
    const filePath = path.join(SRC_DIR, filename);
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context, { filename: filePath });
  }

  return {
    ctx: context,
    SlidesApp,
    ui,
    logs,
    defaultSlide,
    rpcCounts,
    resetRpcCounts: () => {
      Object.keys(rpcCounts).forEach((k) => delete rpcCounts[k]);
    },
    createPage,
    createShape,
    createGroup,
    createTable,
    createLine,
    createColor,
    createRgbColor,
    setSelection: ({
      type = ENUMS.SelectionType.PAGE_ELEMENT,
      elements = [],
      currentPage = defaultSlide,
    } = {}) => {
      currentSelection = { type, elements, currentPage };
    },
  };
}

module.exports = {
  ENUMS,
  DEFAULT_THEME_COLORS,
  createGasEnv,
  createColor,
  createRgbColor,
};
