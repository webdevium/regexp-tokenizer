const types = require('./types');
const sets = require('./sets');


const CTRL = '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^ ?';
const SLASHES = {'0': 0, 't': 9, 'n': 10, 'v': 11, 'f': 12, 'r': 13};

/**
 * Finds character representations in str and convert all to
 * their respective characters.
 *
 * @param {string} str
 * @return {string}
 */
exports.strToChars = (str) => {
    /* jshint maxlen: false */
    const charsRegex = /(\[\\b])|(\\)?\\(?:u([A-F0-9]{4})|x([A-F0-9]{2})|(0?[0-7]{2})|c([@A-Z[\\\]^?])|([0tnvfr]))/g;
    return str.replace(charsRegex, (s, b, lbs, a16, b16, c8, dctrl, eslsh) => {
        if (lbs) {
            return s;
        }

        let code = b ? 8 :
            a16 ? parseInt(a16, 16) :
                b16 ? parseInt(b16, 16) :
                    c8 ? parseInt(c8, 8) :
                        dctrl ? CTRL.indexOf(dctrl) :
                            SLASHES[eslsh];

        let c = String.fromCharCode(code);

        // Escape special regex characters.
        if (/[[\]{}^$.|?*+()]/.test(c)) {
            c = '\\' + c;
        }

        return c;
    });
};


/**
 * turns class into tokens
 * reads str until it encounters a ] not preceeded by a \
 *
 * @param {string} str
 * @param {string} regexpStr
 * @return {Array.<Array.<Object>, number>}
 */
exports.tokenizeClass = (str, regexpStr) => {
    /* jshint maxlen: false */
    let tokens = [];
    const regexp = /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(?:\\)?([^\]]))|(])|(?:\\)?([^])/g;
    let rs, c;


    while ((rs = regexp.exec(str)) != null) {
        if (rs[1]) {
            tokens.push(sets.words());

        } else if (rs[2]) {
            tokens.push(sets.integers());

        } else if (rs[3]) {
            tokens.push(sets.whitespace());

        } else if (rs[4]) {
            tokens.push(sets.notWords());

        } else if (rs[5]) {
            tokens.push(sets.notIntegers());

        } else if (rs[6]) {
            tokens.push(sets.notWhitespace());

        } else if (rs[7]) {
            tokens.push({
                type: types.RANGE,
                from: (rs[8] || rs[9]).charCodeAt(0),
                to: rs[10].charCodeAt(0),
            });

        } else if ((c = rs[12])) {
            tokens.push({
                type: types.CHAR,
                value: c.charCodeAt(0),
            });

        } else {
            return [tokens, regexp.lastIndex];
        }
    }

    exports.error(regexpStr, 'Unterminated character class');
};


/**
 * Shortcut to throw errors.
 *
 * @param {string} regexp
 * @param {string} msg
 */
exports.error = (regexp, msg) => {
    throw new SyntaxError('Invalid regular expression: /' + regexp + '/: ' + msg);
};
