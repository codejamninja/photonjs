"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Merge two arrays, their elements uniqueness decided by the callback.
 * In case of a duplicate, elements of `arr2` are taken.
 * If there is a duplicate within an array, the last element is being taken.
 * @param arr1 Base array
 * @param arr2 Array to overwrite the first one if there is a match
 * @param cb The function to calculate uniqueness
 */
function mergeBy(arr1, arr2, cb) {
    const groupedArr1 = groupBy(arr1, cb);
    const groupedArr2 = groupBy(arr2, cb);
    const result = Object.values(groupedArr2).map(value => value[value.length - 1]);
    const arr2Keys = Object.keys(groupedArr2);
    Object.entries(groupedArr1).forEach(([key, value]) => {
        if (!arr2Keys.includes(key)) {
            result.push(value[value.length - 1]);
        }
    });
    return result;
}
exports.mergeBy = mergeBy;
const groupBy = (arr, cb) => {
    return arr.reduce((acc, curr) => {
        const key = cb(curr);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(curr);
        return acc;
    }, {});
};
//# sourceMappingURL=mergeBy.js.map