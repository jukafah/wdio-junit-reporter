'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _junitReportBuilder = require('junit-report-builder');

var _junitReportBuilder2 = _interopRequireDefault(_junitReportBuilder);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Initialize a new `Junit` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
var JunitReporter = function (_events$EventEmitter) {
    _inherits(JunitReporter, _events$EventEmitter);

    function JunitReporter(baseReporter, config) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        _classCallCheck(this, JunitReporter);

        var _this = _possibleConstructorReturn(this, (JunitReporter.__proto__ || Object.getPrototypeOf(JunitReporter)).call(this));

        _this.baseReporter = baseReporter;
        _this.config = config;
        _this.options = options;
        _this.on('end', _this.onEnd);
        return _this;
    }

    _createClass(JunitReporter, [{
        key: 'onEnd',
        value: function onEnd() {
            var epilogue = this.baseReporter.epilogue;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = Object.keys(this.baseReporter.stats.runners)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var cid = _step.value;

                    var capabilities = this.baseReporter.stats.runners[cid];
                    var testReport = this.prepareReport(capabilities);
                    var dir = _path2.default.resolve(this.options.outputDir);
                    testReport.writeTo(_path2.default.join(dir, capabilities.sanitizedCapabilities + '.' + cid + '.xml'));
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            epilogue.call(this.baseReporter);
        }
    }, {
        key: 'parseFeature',
        value: function parseFeature(report, capabilities, specId) {
            var spec = capabilities.specs[specId];
            var feature = spec.suites[Object.keys(spec.suites)[0]];
            report.testSuite().name(feature.title).timestamp(feature.start).time(feature.duration / 1000).property('specId', specId).property('suiteName', feature.title).property('capabilities', capabilities.sanitizedCapabilities).property('file', spec.files[0].replace(process.cwd(), '.'));
        }
    }, {
        key: 'prepareReport',
        value: function prepareReport(capabilities) {
            var report = _junitReportBuilder2.default.newBuilder();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = Object.keys(capabilities.specs)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var specId = _step2.value;

                    this.parseFeature(report, capabilities, specId);
                    this.parseScenarios(report, capabilities, specId);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return report;
        }
    }, {
        key: 'parseScenarios',
        value: function parseScenarios(report, capabilities, specId) {
            var _this2 = this;

            var spec = capabilities.specs[specId];
            var suites = spec.suites;
            var feature = suites[Object.keys(suites)[0]];
            var screenshots = [];

            spec.output.find(function (event) {
                if (event.type === 'screenshot') {
                    screenshots.push(event.payload.filename);
                }
            });

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                var _loop = function _loop() {
                    var _step3$value = _slicedToArray(_step3.value, 2),
                        index = _step3$value[0],
                        testKey = _step3$value[1];

                    if (index === 0) {
                        return 'continue';
                    }

                    var test = suites[testKey];

                    var testCase = report.testCase().className(capabilities.sanitizedCapabilities + '.' + feature.title).name(test.title).time(test.duration / 1000);

                    var testData = _this2.parseSteps(test);

                    testCase.standardOutput('\n' + testData.steps.toString().replace(/,/g, '\n'));

                    if (testData.state === 'fail') {
                        var screenshot = screenshots.find(function (item) {
                            return item.toLowerCase().indexOf(test.title.toLowerCase()) > 0;
                        });
                        testCase.failure();
                        testCase.standardError('\n[[ATTACHMENT|' + screenshot + ']]\n\n' + testData.error.stack);
                    }
                };

                for (var _iterator3 = Object.keys(suites).entries()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _ret = _loop();

                    if (_ret === 'continue') continue;
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }
        }
    }, {
        key: 'parseSteps',
        value: function parseSteps(test) {

            var testData = {
                steps: [],
                state: '',
                error: {
                    message: '',
                    stack: ''
                }
            };

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = Object.keys(test.tests)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var steps = _step4.value;

                    var step = test.tests[steps];

                    testData.steps.push(step.title);
                    testData.state = step.state === 'pending' ? 'fail' : step.state;

                    if (step.error) {
                        testData.error.message = step.error.message;
                        testData.error.stack = step.error.stack;
                    }
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            return testData;
        }
    }, {
        key: 'write',
        value: function write(capabilities, cid, xml) {
            /* istanbul ignore if  */
            if (!this.options || typeof this.options.outputDir !== 'string') {
                return console.log('Cannot write xunit report: empty or invalid \'outputDir\'.');
            }

            /* istanbul ignore if  */
            if (this.options.outputFileFormat && typeof this.options.outputFileFormat !== 'function') {
                return console.log('Cannot write xunit report: \'outputFileFormat\' should be a function');
            }

            try {
                var dir = _path2.default.resolve(this.options.outputDir);
                var filename = this.options.outputFileFormat ? this.options.outputFileFormat({
                    capabilities: capabilities.sanitizedCapabilities,
                    cid: cid,
                    config: this.config
                }) : 'WDIO.xunit.' + capabilities.sanitizedCapabilities + '.' + cid + '.xml';
                var filepath = _path2.default.join(dir, filename);
                _mkdirp2.default.sync(dir);
                _fs2.default.writeFileSync(filepath, xml);
                console.log('Wrote xunit report to [' + this.options.outputDir + '].');
            } catch (e) {
                /* istanbul ignore next */
                console.log('Failed to write xunit report to [' + this.options.outputDir + ']. Error: ' + e);
            }
        }
    }, {
        key: 'format',
        value: function format(val) {
            return JSON.stringify(this.baseReporter.limit(val));
        }
    }]);

    return JunitReporter;
}(_events2.default.EventEmitter);

exports.default = JunitReporter;
module.exports = exports['default'];