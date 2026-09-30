'use strict';
//30/09/26

/* exported matchTags */

include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
/* global strNumCollator:readable, capitalizeAll:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global getHandleListTagsV3:readable, getCustomPlaylistName:readable */

/*
	Filter by Query
	Filters handle list or playlist using query
*/

/**
 * Lookups for tracks within source which match tag values at handleList, outputs a handleList or sends results to a playlist.
 *
 * @function
 * @name matchTags
 * @kind function
 * @param {{ selTfArr: string[] sourceTfArr: string[] sort?: { tfo?: string direction: number } handleList?: FbMetadbHandleList source?: FbMetadbHandleList playlistNameArgs?: {entryName?: string, tagVal?: string, input: string} playlistName?: string bSendToPls?: boolean }} { selTfArr, sourceTfArr, handle, handleList, source }? [{ selTfArr = [], sourceTfArr = selTfArr, sort = { tfo: null, direction: 1 }, handle = fb.GetFocusItem(true), handleList = fb.GetSelections(), handleList = fb.GetLibraryItems(), playlistNameArgs= null, playlistName = 'Search...', bSendToPls = true }={}]
 * @returns {FbMetadbHandleList | null}
 */
function matchTags({
	selTfArr = [],
	sourceTfArr = selTfArr,
	sort = { tfo: null, direction: 1 },
	handleList = fb.GetSelections(),
	source = fb.GetLibraryItems(),
	playlistNameArgs = null,
	playlistName = 'Search...',
	bSendToPls = true
} = {}) {
	if (!sourceTfArr || !selTfArr.length) { sourceTfArr = selTfArr; }
	const { outputHandleList, tagVal } = matchTagsProcess({ selTfArr, sourceTfArr, handleList, source });
	if (outputHandleList) {
		if (sort && sort.tfo !== null && sort.tfo.length) { outputHandleList.OrderByFormat(fb.TitleFormat(sort.tfo), sort.direction || 1); }
		if (bSendToPls) {
			console.log('Match tags: ' + selTfArr + (sourceTfArr === selTfArr ? '' : ' -> ' + sourceTfArr));
			if (playlistNameArgs) {
				playlistName = getCustomPlaylistName({
					entryName: 'By ' + selTfArr.map((s) => capitalizeAll(s)).join(' - '),
					tagVal: tagVal.slice(0, 20).join(', '),
					...playlistNameArgs
				});
			}
			sendToPlaylist(outputHandleList, playlistName);
		}
	}
	return outputHandleList;
}

/**
 * Lookups for tracks within source which match tag values at handleList
 *
 * @function
 * @name matchTagsProcess
 * @kind function
 * @param {{ selTfArr: string[] sourceTfArr: string[] handleList?: FbMetadbHandleList source?: FbMetadbHandleList }} { selTfArr, sourceTfArr, handle, handleList, source }? [{ selTfArr = [], sourceTfArr = selTfArr, handle = fb.GetFocusItem(true), handleList = fb.GetSelections(), handleList = fb.GetLibraryItems() }={}]
 * @returns {{ outputHandleList: FbMetadbHandleList | null, tagVal: [] | null}}
 */
function matchTagsProcess({ selTfArr = [], sourceTfArr = selTfArr, handleList = fb.GetSelections(), source = fb.GetLibraryItems() } = {}) {
	if (!selTfArr || !selTfArr.length) { return { outputHandleList: null, tagVal: null }; }
	if (!sourceTfArr || !selTfArr.length) { sourceTfArr = selTfArr; }
	const selTags = getHandleListTagsV3(handleList, selTfArr, { bMerged: true }).map((t) => [...new Set(t)].sort(strNumCollator.compare));
	const sourceTags = getHandleListTagsV3(source, sourceTfArr, { bMerged: true }).map((t) => [...new Set(t)].sort(strNumCollator.compare));
	const idx = [];
	// Use nested hash-maps with deduplicated keys to speed up lookups on huge selection/libraries
	let selDic = new Map();
	selTags.forEach((t, i) => {
		const key = t.join('-');
		let subMap = selDic.get(key[0]);
		if (!subMap) { subMap = new Map(); selDic.set(key[0], subMap); }
		let val = subMap.get(key);
		if (!val) { val = []; subMap.set(key, val); }
		val.push(i);
	});
	const sourceDic = new Map();
	sourceTags.forEach((t, i) => {
		const key = t.join('-');
		let subMap = sourceDic.get(key[0]);
		if (!subMap) { subMap = new Map(); sourceDic.set(key[0], subMap); }
		let val = subMap.get(key);
		if (!val) { val = []; subMap.set(key, val); }
		val.push(i);
	});
	sourceDic.forEach((subMap, subMapKey) => {
		subMap.forEach((idxArr, key) => {
			const dic = selDic.get(subMapKey);
			if (dic) {
				const idxarr = dic.get(key);
				if (idxarr) { idx.push(...idxArr); }
			}
		});
	});
	return { outputHandleList: new FbMetadbHandleList(idx.map((i) => source[i])), tagVal: selTags };
}