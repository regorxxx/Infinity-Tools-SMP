'use strict';
//17/04/26

/* exported aggregateTagger */

include('..\\..\\helpers\\helpers_xxx.js');
/* global popup:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global WshShell:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, strNumCollator:readable */


/**
 * Aggregates tag values from a handle list from source tag and writes the results to destination tag. Different modes can be set like averaging, summing, etc. NaN values for source tag and count TF expressions are replaced with zeros, missing values -only for source tag- with the default value set at options.
 *
 * @function
 * @name aggregateTagger
 * @kind function
 * @param {FbMetadbHandleList} handleList
 * @param {string} source - [='[%RATING]'] Tag source for computation.
 * @param {string} destination - [='ALBUMRATING'] Tag destination for writing.
 * @param {string} group - [='%ALBUM ARTIST%|%ALBUM%|%DATE%|%COMMENT%'] TF expression to group tracks for computation.
 * @param {string|number} count - [=1] TF expression to count every element. May be used to compute averages by total length instead of number of tracks.
 * @param {object} options - Aggregation settings.
 * @param {number} options.round - [=2] Round destination tag value to n digits.
 * @param {boolean} options.bAsk - [=true] Ask before tagging files. Can be used to just display the report.
 * @param {'average|sum|count|mode|median'} options.method - [='average'] Aggregation mode for destination tag.
 * @param {number|null} options.defaultVal - [=0] Value used when source tag is missing. Setting it to null will just skip counting that value for all purposes.
 * @param {number|null} options.modeVal - [=1] Number of values retrieved for 'mode' setting . By default it outputs the most frequent value only.
 * @returns {{results: {group: string, avg: number|null, sum: number|null, count: number, mode: [string, number][], median: number|null, val: number|[string,number]}[], handleList: FbMetadbHandleList, tags: {[destination]: Number}[]}}
 */
function aggregateTagger(handleList, source = '[%RATING%]', destination = 'ALBUMRATING', group = '%ALBUM ARTIST%|%ALBUM%|%DATE%|%COMMENT%', count = 1, { round = 2, bAsk = true, method = 'average', defaultVal = 0, modeVal = 1 } = {}) {
	method = method.toLowerCase();
	const sep = '|‎|';
	const groupTF = fb.TitleFormat(group);
	const sourceTF = fb.TitleFormat(
		method === 'mode'
			? /\[?%?rating\]?%?/i.test(source) ? '%RATING%' : '[' + source.split('|').map((tag) => '$meta_sep(' + tag.replace(/[[\]%]/g, '') + ',' + sep + ')').join(sep + '][') + ']'
			: source
	);
	const countTF = fb.TitleFormat(count);
	const bCountNumber = typeof count === 'number';
	const destinationArr = [];
	const results = [];
	const clone = handleList.Clone();
	clone.OrderByFormat(groupTF, 0);
	const total = clone.Count - 1;
	let currGroup, prevGroup, sum = 0, countTotal = 0, groupCount, avg, mode, median, val;
	const dic = new Map();
	const calculateStats = () => {
		avg = sum / (countTotal || 1);
		const dicEntries = [...dic.entries()].sort((a, b) => strNumCollator.compare(a[0], b[0]));
		median = void (0);
		const half = Math.floor(countTotal / 2) + 1;
		let acc = 0;
		for (let [key, value] of dicEntries) {
			acc += value;
			if (acc <= half) {
				median = Number(key);
				if (acc === half) { break; }
			} else if (acc > half) {
				if (typeof median === 'undefined') { median = Number(key); }
				else { median = (median + Number(key)) / 2; }
				break;
			}
		};
		mode = dicEntries.sort((a, b) => b[1] - a[1]).slice(0, modeVal);
		switch (method) {
			case 'average': val = round(avg, round).toFixed(round); break;
			case 'sum': val = round(sum, round).toFixed(round); break;
			case 'count': val = countTotal; break;
			case 'median': val = median; break;
			case 'mode': val = mode.map((tag) => tag[0]); break;
		}
		if (Number.isNaN(Number(median)) && avg === 0 && sum === 0) {
			median = avg = sum = null;
		}
	};
	const calculateGroup = (handle) => {
		val = sourceTF.EvalWithMetadb(handle) || defaultVal;
		if (val !== null) {
			groupCount = bCountNumber ? count : (Number(countTF.EvalWithMetadb(handle)) || 0);
			val.toString().split(sep).filter((s) => s !== '').forEach((subVal) => {
				dic.set(subVal, (dic.get(subVal) || 0) + groupCount);
			});
			sum += Number(val) || 0;
			countTotal += groupCount;
		}
	};
	const addResults = (i) => {
		let j = destinationArr.length;
		while (j < i || j === total) {
			destinationArr.push({ [destination]: val });
			j++;
		}
		dic.clear();
		results.push({ group: prevGroup, avg, sum, count: countTotal, mode, median, val });
	};
	clone.Convert().forEach((handle, i) => {
		currGroup = groupTF.EvalWithMetadb(handle);
		if (i === 0) { prevGroup = currGroup; }
		if (currGroup === prevGroup) {
			calculateGroup(handle);
		}
		if (currGroup !== prevGroup || i === total) {
			calculateStats();
			addResults(i);
			if (currGroup !== prevGroup) {
				prevGroup = currGroup;
				sum = countTotal = 0;
				val = sourceTF.EvalWithMetadb(handle) || defaultVal;
				calculateGroup(handle);
				if (i === total) { calculateStats(); addResults(i); }
			}
		}
	});
	const title = 'Aggregate tagging ' + _p(method) + ': ' + source + ' -> ' + destination;
	if (method === 'mode') {
		fb.ShowPopupMessage(results.map((result) => result.group + ' ' + _p(result.count) + ' -> ' + result.mode.map((tag) => tag[0] + ' ' + _p(tag[1])).join(', ')).join('\n'), title);
	} else {
		fb.ShowPopupMessage(results.map((result) => result.group + ' ' + _p(result.count) + ' -> ' + result.val).join('\n'), title);
	}
	const answer = bAsk && destination && destination.length
		? WshShell.Popup('Check report. Save tag to files?', 0, title, popup.question + popup.yes_no)
		: popup.yes;
	if (answer === popup.yes) { clone.UpdateFileInfoFromJSON(JSON.stringify(destinationArr)); }
	return { results, handleList: clone, tags: destinationArr };
}