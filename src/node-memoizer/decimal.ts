
const BLOCK_LEN = 9;
const BLOCK_MAX = 1000000000;

export function addSmall(decimal: string, increment: number): string {
    const inlen = decimal.length;

    let carry = increment;
    let result = '';
    for (let i = 0; i < inlen; i += BLOCK_LEN) {
        const intBlock = _blockToInt(decimal, i) + carry;
        const newStrBlock = _intToBlock((intBlock % BLOCK_MAX) | 0);
        result = newStrBlock + result;
        carry = Math.floor(intBlock / BLOCK_MAX) | 0;
    }
    if (carry !== 0) {
        return _intFormat(carry) + result;
    }
    result = _trimLeadingZeroes(result);
    return result === "" ? "0" : result;
}


function _trimLeadingZeroes(x: string) {
    const maxi = x.length - 1;
    if (maxi <= 0) {
        return x;
    }
    for (let i = 0; i < maxi; i++) {
        if (x.charAt(i) !== '0') {
            return i > 0 ? x.substring(i) : x;
        }
    }
    return x.substring(maxi);
}

function _intToBlock(x: number): string {
    return _intFormat(x).padStart(BLOCK_LEN, '0');
}


function _blockToInt(decimal: string, position: number) {
    const len = decimal.length|0;
    position = position|0;
    if (position >= len) {
        return 0;
    }
    const endPosition = _min(len, (position + BLOCK_LEN)|0)|0;
    return _intParse(decimal.substring((len - endPosition)|0, (len - position)|0))|0;
}

function _intParse(x: string): number {
    return parseInt(x, 10)|0;
}
function _intFormat(x: number): string {
    return String(x|0);
}

function _min(a: number, b: number) {
    a = a|0;
    b = b|0;
    return (a < b ? a : b)|0;
}
