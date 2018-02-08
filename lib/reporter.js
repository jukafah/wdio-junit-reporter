import events from 'events'
import junit from 'junit-report-builder'
import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'

/**
 * Initialize a new `Junit` test reporter.
 *
 * @param {Runner} runner
 * @api public
 */
class JunitReporter extends events.EventEmitter {
    constructor(baseReporter, config, options = {}) {
        super()

        this.baseReporter = baseReporter
        this.config = config
        this.options = options
        this.on('end', this.onEnd)
    }

    onEnd() {
        const { epilogue } = this.baseReporter
        for (const cid of Object.keys(this.baseReporter.stats.runners)) {
            const capabilities = this.baseReporter.stats.runners[cid];
            const testReport = this.prepareReport(capabilities);
            const dir = path.resolve(this.options.outputDir)
            testReport.writeTo(path.join(dir, `${capabilities.sanitizedCapabilities}.${cid}.xml`));
        }
        epilogue.call(this.baseReporter)
    }

    parseFeature(report, capabilities, specId) {
        const spec = capabilities.specs[specId];
        const feature = spec.suites[Object.keys(spec.suites)[0]];
        report.testSuite()
            .name(feature.title)
            .timestamp(feature.start)
            .time(feature.duration / 1000)
            .property('specId', specId)
            .property('suiteName', feature.title)
            .property('capabilities', capabilities.sanitizedCapabilities)
            .property('file', spec.files[0].replace(process.cwd(), '.'));
    }

    prepareReport(capabilities) {
        const report = junit.newBuilder();
        for (const specId of Object.keys(capabilities.specs)) {
            this.parseFeature(report, capabilities, specId);
            this.parseScenarios(report, capabilities, specId);
        }
        return report;
    }

    parseScenarios(report, capabilities, specId) {

        const spec = capabilities.specs[specId];
        const suites = spec.suites;
        const feature = suites[Object.keys(suites)[0]];
        let screenshots = [];

        spec.output.find(function (event) {
            if (event.type === 'screenshot') {
                screenshots.push(event.payload.filename);
            }
        })

        for (const [index, testKey] of Object.keys(suites).entries()) {

            if (index === 0) {
                continue;
            }

            const test = suites[testKey];

            const testCase = report.testCase()
                .className(`${capabilities.sanitizedCapabilities}.${feature.title}`)
                .name(test.title)
                .time(test.duration / 1000);

            const testData = this.parseSteps(test);

            testCase.standardOutput(`\n${testData.steps.toString().replace(/,/g, '\n')}`);

            if (testData.state === 'fail') {
                const screenshot = screenshots.find(function (item) { return item.toLowerCase().indexOf(test.title.toLowerCase()) > 0 });
                testCase.failure();
                testCase.standardError(`\n[[ATTACHMENT|${screenshot}]]\n\n${testData.error.stack}`);
            }
        }
    };

    parseSteps(test) {

        const testData = {
            steps: [],
            state: '',
            error: {
                message: '',
                stack: ''
            }
        };

        for (const steps of Object.keys(test.tests)) {
            const step = test.tests[steps];

            testData.steps.push(step.title);
            testData.state = (step.state === 'pending') ? 'fail' : step.state;

            if (step.error) {
                testData.error.message = step.error.message;
                testData.error.stack = step.error.stack;
            }
        }

        return testData;
    };

    write(capabilities, cid, xml) {
        /* istanbul ignore if  */
        if (!this.options || typeof this.options.outputDir !== 'string') {
            return console.log(`Cannot write xunit report: empty or invalid 'outputDir'.`)
        }

        /* istanbul ignore if  */
        if (this.options.outputFileFormat && typeof this.options.outputFileFormat !== 'function') {
            return console.log(`Cannot write xunit report: 'outputFileFormat' should be a function`)
        }

        try {
            const dir = path.resolve(this.options.outputDir)
            const filename = this.options.outputFileFormat ? this.options.outputFileFormat({
                capabilities: capabilities.sanitizedCapabilities,
                cid: cid,
                config: this.config
            }) : `WDIO.xunit.${capabilities.sanitizedCapabilities}.${cid}.xml`
            const filepath = path.join(dir, filename)
            mkdirp.sync(dir)
            fs.writeFileSync(filepath, xml)
            console.log(`Wrote xunit report to [${this.options.outputDir}].`)
        } catch (e) {
            /* istanbul ignore next */
            console.log(`Failed to write xunit report to [${this.options.outputDir}]. Error: ${e}`)
        }
    }

    format(val) {
        return JSON.stringify(this.baseReporter.limit(val))
    }
}

export default JunitReporter
