"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const stackTraceParser = __importStar(require("stacktrace-parser"));
const highlight_1 = require("../highlight/highlight");
const dedent_1 = require("../utils/dedent");
function renderN(n, max) {
    const wantedLetters = String(max).length;
    const hasLetters = String(n).length;
    if (hasLetters >= wantedLetters) {
        return String(n);
    }
    return String(' '.repeat(wantedLetters - hasLetters) + n);
}
exports.printStack = ({ callsite, originalMethod, onUs }) => {
    const lastErrorHeight = 20;
    let callsiteStr = ':';
    let prevLines = '\n';
    let afterLines = '';
    let indentValue = 0;
    let functionName = `photon.${originalMethod}()`;
    // @ts-ignore
    if (callsite && typeof window === 'undefined') {
        const stack = stackTraceParser.parse(callsite);
        // TODO: more resilient logic to check that it's not relative to cwd
        const trace = stack.find(t => t.file &&
            !t.file.includes('@generated') &&
            !t.methodName.includes('new ') &&
            t.methodName.split('.').length < 4);
        if (process.env.NODE_ENV !== 'production' && trace && trace.file && trace.lineNumber && trace.column) {
            const fileName = trace.file;
            const lineNumber = trace.lineNumber;
            callsiteStr = callsite ? ` in ${chalk_1.default.underline(`${trace.file}:${trace.lineNumber}:${trace.column}`)}` : '';
            const height = process.stdout.rows || 20;
            const start = Math.max(0, lineNumber - 5);
            const neededHeight = lastErrorHeight + lineNumber - start;
            if (height > neededHeight) {
                const fs = require('fs');
                if (fs.existsSync(fileName)) {
                    const file = fs.readFileSync(fileName, 'utf-8');
                    const slicedFile = file
                        .split('\n')
                        .slice(start, lineNumber)
                        .join('\n');
                    const lines = dedent_1.dedent(slicedFile).split('\n');
                    const theLine = lines[lines.length - 1];
                    const photonRegex = /(=|return)*\s+(await)?\s*(.*\()/;
                    const match = theLine.match(photonRegex);
                    if (match) {
                        functionName = `${match[3]})`;
                    }
                    const slicePoint = theLine.indexOf('{');
                    const highlightedLines = highlight_1.highlightTS(lines
                        .map((l, i, all) => !onUs && i === all.length - 1 ? l.slice(0, slicePoint > -1 ? slicePoint : l.length - 1) : l)
                        .join('\n')).split('\n');
                    prevLines =
                        '\n' +
                            highlightedLines
                                .map((l, i) => chalk_1.default.grey(renderN(i + start + 1, lineNumber + start + 1) + ' ') + chalk_1.default.reset() + l)
                                .map((l, i, arr) => (i === arr.length - 1 ? `${chalk_1.default.red.bold('→')} ${l}` : chalk_1.default.dim('  ' + l)))
                                .join('\n');
                    afterLines = ')';
                    indentValue = String(lineNumber + start + 1).length + getIndent(theLine) + 1;
                }
            }
        }
    }
    function getIndent(line) {
        let spaceCount = 0;
        for (let i = 0; i < line.length; i++) {
            if (line.charAt(i) !== ' ') {
                return spaceCount;
            }
            spaceCount++;
        }
        return spaceCount;
    }
    const introText = onUs
        ? chalk_1.default.red(`Oops, an unknown error occured! This is ${chalk_1.default.bold('on us')}, you did nothing wrong.
It occured in the ${chalk_1.default.bold(`\`${functionName}\``)} invocation${callsiteStr}`)
        : chalk_1.default.red(`Invalid ${chalk_1.default.bold(`\`${functionName}\``)} invocation${callsiteStr}`);
    const stackStr = `\n${introText}
${prevLines}${chalk_1.default.reset()}`;
    return { indent: indentValue, stack: stackStr, afterLines, lastErrorHeight };
};
//# sourceMappingURL=printStack.js.map