'use strict';
//01/01/26

/* exported getData, getDataAsync */

/* global globQuery:readable, globTags:readable, doOnce:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _t:readable, _bt:readable, range:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryReplaceWithCurrent:readable, checkQuery:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global folders:readable, _jsonParseFileCheck:readable, utf8:readable, _foldPath:readable, _isFile:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global getSource:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
include('..\\search\\top_tracks_from_date.js');
/* global getPlayCount:readable, getPlayCountV2:readable, getSkipCount:readable */
include('..\\search_by_distance\\search_by_distance_culture.js');
/* global getCountryISO:readable, music_graph_descriptors_countries:readable */

/*
	Data to feed the charts:
	This may be arbitrary data in a single series, with each point having x,y,z properties.
	[
		[
			[{x1, y11, z11}, ...],
			[{x2, y21, z21}, ...],
			...
		]
	]
	Data is then automatically manipulated into different series:
	[
		[
			{x1, y11, z11}, {x2, y21, z21}, ...
		],
		[
			{x1, y12, z12}, {x2, y22, z22}, ...
		],
		[
			...
		]
	]

	In this example a timeline is shown..
*/

/**
 * Retrieve statistics data as x-y-z points.
 *
 * @function
 * @name getData
 * @kind function
 * @param {object} [o] - arguments
 * @param {string} o.option - [='tf'] timeline|tf|playcount|playcount proportional
 * @param {?*} o.optionArg - Optional arg for 'playcount' options', see getPlayCount()
 * @param {string} o.x - [='genre'] X axis TF
 * @param {string|number} o.y - [=1] Y axis TF. Not used on 'playcount options
 * @param {string} o.z - [='artist'] Z axis TF. Only used on 'timeline' option (3D)
 * @param {string} o.query - [='ALL'] Query to filter the source
 * @param {string} o.sourceType - [='library'] playlist|playingPlaylist|activePlaylist|handleList|library
 * @param {?*} o.sourceArg - Optional arg for source, see getSource()
 * @param {boolean} o.bProportional - [=false] Calculate Y count proportional to population
 * @param {boolean} o.bRemoveDuplicates - [=true] Remove duplicates from source
 * @param {boolean} o.bIncludeHandles - [=true] Include associated handle per point
 * @param {{x: null, y: null, z: null}} o.groupBy - [={x: null, y: null, z:null}] Data aggregation per axis. Currently available only for Y-axis and 'tf' or 'timeline' options.
 * @param {{filter:boolean, sort: function|null}} o.zGroups - [={ filter: false, sort: null } Settings to handle Z-data using 'timeline' option. If filter is true, then only non null z-values are output
 * @param {{worldMapArtists:string}} o.filePaths - Paths to external database files
 * @returns {<Array.<Array,Array>>} Array of series with points [[{x, y, [z]},...], ...]
 */
function getData({
	option = 'tf', optionArg = null,
	x = 'genre', y = 1, z = 'artist',
	query = 'ALL', sourceType = 'library', sourceArg = null,
	queryHandle = null,
	bProportional = false,
	bRemoveDuplicates = true, removeDuplicatesOptions = { checkKeys: globTags.remDupl, sortBias: globQuery.remDuplBias },
	bIncludeHandles = false,
	groupBy = { x: null, y: null, z: null },
	zGroups = { filter: false, sort: null /* (a, b) => b.count - a.count */ },
	filePaths = { worldMapArtists: _foldPath(folders.data + 'worldMap.json') }
} = {}) {
	if (sourceType === 'handleList' && !sourceArg) { return null; }
	const noSplitTags = new Set(['ALBUM', 'TITLE']); noSplitTags.forEach((tag) => noSplitTags.add(_t(tag)));
	const dedupByIdTags = new Set(['TITLE']); dedupByIdTags.forEach((tag) => dedupByIdTags.add(_t(tag)));
	const source = getDataHelpers.filterSource(query, getSource(sourceType, sourceArg), queryHandle);
	const handleList = bRemoveDuplicates ? getDataHelpers.deduplicateSource(source, removeDuplicatesOptions) : source;
	let splitter;
	try { splitter = new RegExp('(?<!\\d), ?(?!\\d)'); } // NOSONAR
	catch (e) { // eslint-disable-line no-unused-vars
		splitter = /, /;
		doOnce(
			'SMP RegExp Log',
			() => console.log(window.Parent + ' ' + utils.Version + ': RegExp lookahead and lookbehind not supported')
		);
	}
	if ((typeof z === 'undefined' || z === null || !z.length) && option === 'timeline') { option = 'tf'; }
	if (bProportional) { groupBy = { x: null, y: null, z: null }; }
	let data;
	switch (option) {
		case 'timeline': // 3D {x, y, z}, x and z can be exchanged
		case 'timeline playcount': {
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => [val])
				: fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => val.split(splitter)); // X
			const seriesTags = noSplitTags.has(z.toUpperCase())
				? fb.TitleFormat(_bt(z)).EvalWithMetadbs(handleList).map((val) => [val])
				: fb.TitleFormat(_bt(z)).EvalWithMetadbs(handleList).map((val) => val.split(splitter)); // Z
			const bSingleY = !isNaN(y);
			const seriesCounters = option === 'timeline playcount'
				? optionArg && optionArg.timePeriod
					? getPlayCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate).map((v) => v.playCount)
					: fb.TitleFormat(globTags.playCount).EvalWithMetadbs(handleList).map(Number)
				: bSingleY
					? Number(y)
					: fb.TitleFormat(_bt(queryReplaceWithCurrent(y))).EvalWithMetadbs(handleList)
						.map((val) => val ? Number(val) : 0); // Y
			const groupTags = groupBy.y
				? noSplitTags.has(groupBy.y.toUpperCase().replace(/\|.*/, ''))
					? fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbs(handleList).map((val) => [val])
					: fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbs(handleList).map((val) => val.split(splitter))
				: null;
			data = groupBy.y && bSingleY
				? getDataHelpers.timelineGroups(xTags, seriesCounters, zGroups, seriesTags, groupTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY)
				: getDataHelpers.timeline(xTags, seriesCounters, zGroups, seriesTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY);
			break;
		}
		case 'tf': {
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => [val])
				: fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => val.split(splitter));
			const bSingleY = !isNaN(y);
			const seriesCounters = bSingleY
				? Number(y)
				: fb.TitleFormat(_bt(queryReplaceWithCurrent(y))).EvalWithMetadbs(handleList)
					.map((val) => val ? Number(val) : 0); // Y
			const groupTags = groupBy.y
				? noSplitTags.has(groupBy.y.toUpperCase().replace(/\|.*/, ''))
					? fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbs(handleList).map((val) => [val])
					: fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbs(handleList).map((val) => val.split(splitter))
				: null;
			data = groupBy.y && bSingleY
				? getDataHelpers.tf(xTags, seriesCounters, handleList, optionArg, bIncludeHandles, bProportional, bSingleY)
				: getDataHelpers.tfGroups(xTags, seriesCounters, groupTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY);
			break;
		}
		case 'playcount': {
			const bUseId = dedupByIdTags.has(x);
			const bIncludeSkip = optionArg && optionArg.bSkipCount;
			const xTag = _bt(x) +
				(bUseId ? '|‎|$if3(%MUSICBRAINZ_TRACKID%,%MUSICBRAINZ_ALBUMARTISTID%,%ARTIST%)' : '');
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? fb.TitleFormat(xTag).EvalWithMetadbs(handleList).map((val) => [val])
				: fb.TitleFormat(xTag).EvalWithMetadbs(handleList).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? getPlayCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate).map((v) => v.playCount)
				: fb.TitleFormat(globTags.playCount).EvalWithMetadbs(handleList);
			const skipCount = bIncludeSkip
				? optionArg.timePeriod
					? getSkipCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate).map((v) => v.skipCount)
					: fb.TitleFormat(globTags.skipCount).EvalWithMetadbs(handleList)
				: null;
			data = getDataHelpers.playcount(xTags, playCount, skipCount, handleList, optionArg, bUseId, bIncludeHandles);
			break;
		}
		case 'playcount proportional': {
			const bUseId = dedupByIdTags.has(x);
			const xTag = _bt(x) +
				(bUseId ? '|‎|$if3(%MUSICBRAINZ_TRACKID%,%MUSICBRAINZ_ALBUMARTISTID%,%ARTIST%)' : '');
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? fb.TitleFormat(xTag).EvalWithMetadbs(handleList).map((val) => [val])
				: fb.TitleFormat(xTag).EvalWithMetadbs(handleList).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? getPlayCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate).map((v) => v.playCount)
				: fb.TitleFormat(globTags.playCount).EvalWithMetadbs(handleList);
			data = getDataHelpers.playcountPeriod(xTags, playCount, handleList, bUseId, bIncludeHandles);
			break;
		}
		case 'playcount worldmap':
		case 'playcount worldmap region': {
			const worldMapData = _isFile(filePaths.worldMapArtists)
				? (_jsonParseFileCheck(filePaths.worldMapArtists, 'Library json', window.FullPanelName, utf8) || [])
					.map((point) => { return { id: point.artist || '', country: (point.val || ['']).slice(-1)[0] }; })
					.filter((point) => point.id && point.country)
				: [];
			// Json data is then concat to this, since it doesn't matter if some artists are duplicated, only first entry will be used
			const worldMapTags = fb.TitleFormat('[$if2($meta(ALBUM ARTIST,0),$meta(ARTIST,0))]|‎|$meta(' + globTags.locale + ',$sub($meta_num(' + globTags.locale + '),1))').EvalWithMetadbs(handleList)
				.map((val) => {
					const valArr = val.split('|‎|');
					const country = (valArr[1] || '').split('|')[0]; // Countries are split with | and tag by ', '
					return valArr[0] && country
						? { id: valArr[0], country }
						: null;
				})
				.filter(Boolean);
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => [val])
				: fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? getPlayCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate).map((V) => V.playCount)
				: fb.TitleFormat(globTags.playCount).EvalWithMetadbs(handleList);
			const method = option === 'playcount worldmap region' ? 'playcountWorldMapRegion' : 'playcountWorldMap';
			data = getDataHelpers[method](xTags, playCount, handleList, worldMapTags.concat(worldMapData), bIncludeHandles);
			break;
		}
		case 'playcount worldmap city': {
			const worldMapData = _isFile(filePaths.worldMapArtists)
				? (_jsonParseFileCheck(filePaths.worldMapArtists, 'Library json', window.FullPanelName, utf8) || [])
					.map((point) => { return { id: point.artist || '', city: point.val[0] || '', country: (point.val || ['']).slice(-1)[0] }; })
					.filter((point) => point.id && point.city && point.country && point.city !== point.country)
				: [];
			// Json data is then concat to this, since it doesn't matter if some artists are duplicated, only first entry will be used. Furthermore, if tag is incomplete then will be filtered and JSON data used instead
			const worldMapTags = fb.TitleFormat('[$if2($meta(ALBUM ARTIST,0),$meta(ARTIST,0))]|‎|' + _bt(globTags.locale)).EvalWithMetadbs(handleList)
				.map((val) => {
					const valArr = val.split('|‎|');
					const localeArr = (valArr[1] || '').split(splitter); // Countries are split with | but tag by ', '
					const city = localeArr[0].split('|')[0];
					const country = (localeArr.slice(-1)[0] || '').split('|')[0];
					return valArr[0] && city && country && city !== country
						? { id: valArr[0], city, country }
						: null;
				})
				.filter(Boolean);
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => [val])
				: fb.TitleFormat(_bt(x)).EvalWithMetadbs(handleList).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? getPlayCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate).map((v) => v.playCount)
				: fb.TitleFormat(globTags.playCount).EvalWithMetadbs(handleList);
			data = getDataHelpers.playcountWorldMapCity(xTags, playCount, handleList, worldMapTags.concat(worldMapData), bIncludeHandles);
			break;
		}
		case 'playcount period': {
			const bIncludeSkip = optionArg && optionArg.bSkipCount;
			const listens = (optionArg && optionArg.timePeriod
				? getPlayCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate, true)
				: getPlayCount(handleList, Infinity, 'Weeks', void (0), true)
			).map((v) => v.listens);
			const skipCount = bIncludeSkip
				? (optionArg.timePeriod
					? getSkipCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate)
					: getSkipCount(handleList, Infinity, 'Weeks', void (0))
				).map((v) => v.skips)
				: null;
			data = getDataHelpers.playcountPeriod(x, listens, handleList, skipCount, optionArg, bIncludeHandles);
			break;
		}
		default: {
			throw new Error('Non recognized option:' + option);
		}
	}
	return data;
}

/**
 * Retrieve statistics data as x-y-z points. There are additional settings for compatibility with ListenBrainz API listens retrieval (compared to the {@link getData}).
 *
 * @function
 * @name getDataAsync
 * @kind function
 * @param {object} [o] - arguments
 * @param {string} o.option - [='tf'] timeline|tf|playcount|playcount proportional
 * @param {?*} o.optionArg - Optional arg for 'playcount' options', see getPlayCount()
 * @param {string} o.x - [='genre'] X axis TF
 * @param {string|number} o.y - [=1] Y axis TF. Not used on 'playcount options
 * @param {string} o.z - [='artist'] Z axis TF. Only used on 'timeline' option (3D)
 * @param {string} o.query - [='ALL'] Query to filter the source
 * @param {string} o.sourceType - [='library'] playlist|playingPlaylist|activePlaylist|handleList|library
 * @param {?*} o.sourceArg - Optional arg for source, see getSource()
 * @param {boolean} o.bProportional - [=false] Calculate Y count proportional to population
 * @param {boolean} o.bRemoveDuplicates - [=true] Remove duplicates from source
 * @param {boolean} o.bIncludeHandles - [=true] Include associated handle per point
 * @param {{x: null, y: null, z: null}} o.groupBy - [={x: null, y: null, z:null}] Data aggregation per axis. Currently available only for Y-axis and 'tf' or 'timeline' options.
 * @param {{filter:boolean, sort: function|null}} o.zGroups - [={ filter: false, sort: null } Settings to handle Z-data using 'timeline' option. If filter is true, then only non null z-values are output.
 * @param {{token:string, bOffline:boolean}} o.listenBrainz - [={token: '', bOffline: true}] ListenBrainz settings to retrieve playcounts. If no token provided, it's skipped
 * @param {{worldMapArtists:string}} o.filePaths - Paths to external database files
 * @returns {promise.<Array.<Array,Array>>} Array of series with points [[{x, y, [z]},...], ...]
 */
async function getDataAsync({
	option = 'tf', optionArg = null,
	x = 'genre', y = 1, z = 'artist',
	query = 'ALL', sourceType = 'library', sourceArg = null,
	queryHandle = null,
	bProportional = false,
	bRemoveDuplicates = true, removeDuplicatesOptions = { checkKeys: globTags.remDupl, sortBias: globQuery.remDuplBias },
	bIncludeHandles = false,
	groupBy = { x: null, y: null, z: null },
	zGroups = { filter: false, sort: null /* (a, b) => b.count - a.count */ },
	listenBrainz = { token: '', user: '', bOffline: true },
	filePaths = { worldMapArtists: _foldPath(folders.data + 'worldMap.json') }
} = {}) {
	if (sourceType === 'handleList' && !sourceArg) { return null; }
	const noSplitTags = new Set(['ALBUM', 'TITLE']); noSplitTags.forEach((tag) => noSplitTags.add(_t(tag)));
	const dedupByIdTags = new Set(['TITLE']); dedupByIdTags.forEach((tag) => dedupByIdTags.add(_t(tag)));
	const source = getDataHelpers.filterSource(query, getSource(sourceType, sourceArg), queryHandle);
	const handleList = bRemoveDuplicates ? getDataHelpers.deduplicateSource(source, removeDuplicatesOptions) : source;
	let splitter;
	try { splitter = new RegExp('(?<!\\d), ?(?!\\d)'); } // NOSONAR
	catch (e) { // eslint-disable-line no-unused-vars
		splitter = /, /;
		doOnce(
			'SMP RegExp Log',
			() => console.log(window.Parent + ' ' + utils.Version + ': RegExp lookahead and lookbehind not supported')
		);
	}
	if ((typeof z === 'undefined' || z === null || !z.length) && option === 'timeline') { option = 'tf'; }
	if (bProportional) { groupBy = { x: null, y: null, z: null }; }
	let data;
	switch (option) {
		case 'timeline': // 3D {x, y, z}, x and z can be exchanged
		case 'timeline playcount': {
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => [val])
				: (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter)); // X
			const seriesTags = noSplitTags.has(z.toUpperCase().replace(/\|.*/, ''))
				? (await fb.TitleFormat(_bt(z)).EvalWithMetadbsAsync(handleList)).map((val) => [val])
				: (await fb.TitleFormat(_bt(z)).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter)); //Z
			const bSingleY = !isNaN(y);
			const seriesCounters = option === 'timeline playcount'
				? optionArg && optionArg.timePeriod
					? (await getPlayCountV2(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate, true, listenBrainz)).map((v) => v.playCount)
					: (await fb.TitleFormat(globTags.playCount).EvalWithMetadbsAsync(handleList)).map(Number)
				: bSingleY
					? Number(y)
					: (await fb.TitleFormat(_bt(queryReplaceWithCurrent(y))).EvalWithMetadbsAsync(handleList))
						.map((val) => val ? Number(val) : 0); // Y
			const groupTags = groupBy.y
				? noSplitTags.has(groupBy.y.toUpperCase().replace(/\|.*/, ''))
					? (await fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbsAsync(handleList)).map((val) => [val])
					: (await fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter))
				: null;
			data = groupBy.y
				? getDataHelpers.timelineGroups(xTags, seriesCounters, zGroups, seriesTags, groupTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY)
				: getDataHelpers.timeline(xTags, seriesCounters, zGroups, seriesTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY);
			break;
		}
		case 'tf': {
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => [val])
				: (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter));
			const bSingleY = !isNaN(y);
			const seriesCounters = bSingleY
				? Number(y)
				: (await fb.TitleFormat(_bt(queryReplaceWithCurrent(y))).EvalWithMetadbsAsync(handleList))
					.map((val) => val ? Number(val) : 0); // Y
			const groupTags = groupBy.y
				? noSplitTags.has(groupBy.y.toUpperCase().replace(/\|.*/, ''))
					? (await fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbsAsync(handleList)).map((val) => [val])
					: (await fb.TitleFormat(_bt(groupBy.y)).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter))
				: null;
			data = groupBy.y
				? getDataHelpers.tfGroups(xTags, seriesCounters, groupTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY)
				: getDataHelpers.tf(xTags, seriesCounters, handleList, optionArg, bIncludeHandles, bProportional, bSingleY);
			break;
		}
		case 'playcount': {
			const bUseId = dedupByIdTags.has(x);
			const bIncludeSkip = optionArg && optionArg.bSkipCount;
			const xTag = _bt(x) +
				(bUseId ? '|‎|$if3(%MUSICBRAINZ_TRACKID%,%MUSICBRAINZ_ALBUMARTISTID%,%ARTIST%)' : '');
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? (await fb.TitleFormat(xTag).EvalWithMetadbsAsync(handleList)).map((val) => [val])
				: (await fb.TitleFormat(xTag).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? (await getPlayCountV2(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate, true, listenBrainz)).map((v) => v.playCount)
				: await fb.TitleFormat(globTags.playCount).EvalWithMetadbsAsync(handleList);
			const skipCount = bIncludeSkip
				? optionArg.timePeriod
					? getSkipCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate).map((v) => v.skipCount)
					: await fb.TitleFormat(globTags.skipCount).EvalWithMetadbsAsync(handleList)
				: null;
			data = getDataHelpers.playcount(xTags, playCount, skipCount, handleList, optionArg, bUseId, bIncludeHandles);
			break;
		}
		case 'playcount proportional': {
			const bUseId = dedupByIdTags.has(x);
			const xTag = _bt(x) +
				(bUseId ? '|‎|$if3(%MUSICBRAINZ_TRACKID%,%MUSICBRAINZ_ALBUMARTISTID%,%ARTIST%)' : '');
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? (await fb.TitleFormat(xTag).EvalWithMetadbsAsync(handleList)).map((val) => [val])
				: (await fb.TitleFormat(xTag).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? (await getPlayCountV2(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate, true, listenBrainz)).map((v) => v.playCount)
				: await fb.TitleFormat(globTags.playCount).EvalWithMetadbsAsync(handleList);
			data = getDataHelpers.playcountPeriod(xTags, playCount, handleList, bUseId, bIncludeHandles);
			break;
		}
		case 'playcount worldmap':
		case 'playcount worldmap region': {
			const worldMapData = _isFile(filePaths.worldMapArtists)
				? (_jsonParseFileCheck(filePaths.worldMapArtists, 'Library json', window.FullPanelName, utf8) || [])
					.map((point) => { return { id: point.artist, country: (point.val || ['']).slice(-1)[0] }; })
					.filter((point) => point.id && point.country)
				: [];
			// Json data is then concat to this, since it doesn't matter if some artists are duplicated, only first entry will be used
			const worldMapTags = (await fb.TitleFormat('[$if2($meta(ALBUM ARTIST,0),$meta(ARTIST,0))]|‎|$meta(' + globTags.locale + ',$sub($meta_num(' + globTags.locale + '),1))').EvalWithMetadbsAsync(handleList))
				.map((val) => {
					const valArr = val.split('|‎|');
					const country = (valArr[1] || '').split('|')[0]; // Countries are split with | and tag by ', '
					return valArr[0] && country
						? { id: valArr[0], country }
						: null;
				})
				.filter(Boolean);
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => [val])
				: (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? (await getPlayCountV2(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate, true, listenBrainz)).map((v) => v.playCount)
				: await fb.TitleFormat(globTags.playCount).EvalWithMetadbsAsync(handleList);
			const method = option === 'playcount worldmap region' ? 'playcountWorldMapRegion' : 'playcountWorldMap';
			data = getDataHelpers[method](xTags, playCount, handleList, worldMapTags.concat(worldMapData), bIncludeHandles);
			break;
		}
		case 'playcount worldmap city': {
			const worldMapData = _isFile(filePaths.worldMapArtists)
				? (_jsonParseFileCheck(filePaths.worldMapArtists, 'Library json', window.FullPanelName, utf8) || [])
					.map((point) => { return { id: point.artist, city: point.val[0] || '', country: (point.val || ['']).slice(-1)[0] }; })
					.filter((point) => point.id && point.city && point.country && point.city !== point.country)
				: [];
			// Json data is then concat to this, since it doesn't matter if some artists are duplicated, only first entry will be used. Furthermore, if tag is incomplete then will be filtered and JSON data used instead
			const worldMapTags = (await fb.TitleFormat('[$if2($meta(ALBUM ARTIST,0),$meta(ARTIST,0))]|‎|' + _bt(globTags.locale)).EvalWithMetadbsAsync(handleList))
				.map((val) => {
					const valArr = val.split('|‎|');
					const localeArr = (valArr[1] || '').split(splitter); // Countries are split with | but tag by ', '
					const city = localeArr[0].split('|')[0];
					const country = (localeArr.slice(-1)[0] || '').split('|')[0];
					return valArr[0] && city && country && city !== country
						? { id: valArr[0], city, country }
						: null;
				})
				.filter(Boolean);
			const xTags = noSplitTags.has(x.toUpperCase().replace(/\|.*/, ''))
				? (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => [val])
				: (await fb.TitleFormat(_bt(x)).EvalWithMetadbsAsync(handleList)).map((val) => val.split(splitter));
			const playCount = optionArg && optionArg.timePeriod
				? (await getPlayCountV2(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate, true, listenBrainz)).map((v) => v.playCount)
				: await fb.TitleFormat(globTags.playCount).EvalWithMetadbsAsync(handleList);
			data = getDataHelpers.playcountWorldMapCity(xTags, playCount, handleList, worldMapTags.concat(worldMapData), bIncludeHandles);
			break;
		}
		case 'playcount period': {
			const bIncludeSkip = optionArg && optionArg.bSkipCount;
			const listens = (optionArg && optionArg.timePeriod
				? await getPlayCountV2(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate, true, listenBrainz)
				: await getPlayCountV2(handleList, Infinity, 'Weeks', void (0), true, listenBrainz)
			).map((v) => v.listens);
			const skipCount = bIncludeSkip
				? (optionArg.timePeriod
					? getSkipCount(handleList, optionArg.timePeriod, optionArg.timeKey, optionArg.fromDate)
					: getSkipCount(handleList, Infinity, 'Weeks', void (0))
				).map((v) => v.skips)
				: null;
			data = getDataHelpers.playcountPeriod(x, listens, handleList, skipCount, optionArg, bIncludeHandles);
			break;
		}
		default: {
			throw new Error('Non recognized option:' + option);
		}
	}
	return data;
}

const getDataHelpers = {
	idChars: ['\u200b', '\u200c', '\u200d', '\u200e', '\u200f', '\u2060'],
	idCharsRegExp: new RegExp(['\u200b', '\u200c', '\u200d', '\u200e', '\u200f', '\u2060'].join('|'), 'gi'),
	timeline: function (xTags, seriesCounters, zGroups, seriesTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY) {
		const dic = new Map();
		const handlesMap = new Map();
		if (!zGroups.filter) {
			const xLabels = new Set(xTags.flat(Infinity));
			const zLabels = new Set(seriesTags.flat(Infinity));
			xLabels.forEach((x) => {
				const val = {};
				dic.set(x, val);
				zLabels.forEach((series) => val[series] = { count: 0, total: 0 });
			});
		}

		xTags.forEach((arr, i) => {
			arr.forEach((x) => {
				let val = dic.get(x);
				if (!val) { val = {}; dic.set(x, val); }
				seriesTags[i].forEach((series) => {
					const count = bSingleY ? seriesCounters : seriesCounters[i];
					if (Object.hasOwn(val, series)) {
						if (count) { val[series].count += count; }
						val[series].total++;
					} else {
						val[series] = { count, total: 1 };
					}
				});
				if (bIncludeHandles) {
					const handles = handlesMap.get(x);
					if (!handles) { handlesMap.set(x, [handleList[i]]); }
					else { handles.push(handleList[i]); }
				}
			});
		});
		dic.forEach((value, key, map) => {
			map.set(
				key,
				Object.entries(value).map((pair) => { return { key: pair[0], ...pair[1] }; })
			);
		});
		if (zGroups.sort) { dic.forEach((value) => value.sort(zGroups.sort)); }
		return [
			Array.from(
				dic,
				(/** @type {[string, {key: string, count: number, total: number}[]]} */ points) => points[1].map((point) => {
					return {
						x: points[0],
						y: bProportional ? point.count / point.total : point.count,
						z: point.key,
						...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
					};
				})
			)
		];
	},
	timelineGroups: function (xTags, seriesCounters, zGroups, seriesTags, groupTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY) {
		const dic = new Map();
		const handlesMap = new Map();
		if (!zGroups.filter) {
			const xLabels = new Set(xTags.flat(Infinity));
			const zLabels = new Set(seriesTags.flat(Infinity));
			xLabels.forEach((x) => {
				const val = {};
				dic.set(x, val);
				zLabels.forEach((series) => val[series] = { count: 0, total: 0 });
			});
		}
		const dicGroup = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((x) => {
				let val = dic.get(x);
				if (!val) { val = {}; dic.set(x, val); }
				seriesTags[i].forEach((series) => {
					let groupFound = dicGroup.get(series + '-' + x);
					if (!groupFound) { groupFound = new Set(); dicGroup.set(series + '-' + x, groupFound); }
					let count;
					if (groupTags[i].some((group) => groupFound.has(group))) {
						count = 0;
					} else {
						count = bSingleY ? seriesCounters : seriesCounters[i];
						groupTags[i].forEach((group) => groupFound.add(group));
					}
					if (Object.hasOwn(val, series)) {
						if (count) { val[series].count += count; }
						val[series].total++;
					} else {
						val[series] = { count, total: 1 };
					}
				});
				if (bIncludeHandles) {
					const handles = handlesMap.get(x);
					if (!handles) { handlesMap.set(x, [handleList[i]]); }
					else { handles.push(handleList[i]); }
				}
			});
		});
		dic.forEach((value, key, map) => {
			map.set(
				key,
				Object.entries(value).map((pair) => { return { key: pair[0], ...pair[1] }; })
			);
		});
		if (zGroups.sort) { dic.forEach((value) => value.sort(zGroups.sort)); }
		return [
			Array.from(
				dic,
				(/** @type {[string, {key: string, count: number, total: number}[]]} */ points) => points[1].map((point) => {
					return {
						x: points[0],
						y: bProportional ? point.count / point.total : point.count,
						z: point.key,
						...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
					};
				})
			)
		];
	},
	tf: function (xTags, seriesCounters, handleList, optionArg, bIncludeHandles, bProportional, bSingleY) {
		const dic = new Map();
		const handlesMap = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((tag) => {
				const count = bSingleY ? seriesCounters : seriesCounters[i];
				const val = dic.get(tag);
				if (!val) { dic.set(tag, { count, total: 1 }); }
				else {
					val.count += count;
					val.total++;
				}
				if (bIncludeHandles) {
					const handles = handlesMap.get(tag);
					if (!handles) { handlesMap.set(tag, [handleList[i]]); }
					else { handles.push(handleList[i]); }
				}
			});
		});
		return [Array.from(dic, (point) => {
			return {
				x: point[0],
				y: bProportional ? point[1].count / point[1].total : point[1].count,
				...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
			};
		})];
	},
	tfGroups: function (xTags, seriesCounters, groupTags, handleList, optionArg, bIncludeHandles, bProportional, bSingleY) {
		const dic = new Map();
		const handlesMap = new Map();
		const dicGroup = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((tag) => {
				let groupFound = dicGroup.get(tag);
				if (!groupFound) { groupFound = new Set(); dicGroup.set(tag, groupFound); }
				let count;
				if (groupTags[i].some((group) => groupFound.has(group))) {
					count = 0;
				} else {
					count = bSingleY ? seriesCounters : seriesCounters[i];
					groupTags[i].forEach((group) => groupFound.add(group));
				}
				const val = dic.get(tag);
				if (!val) { dic.set(tag, { count, total: 1 }); }
				else {
					val.count += count;
					val.total++;
				}
				if (bIncludeHandles) {
					const handles = handlesMap.get(tag);
					if (!handles) { handlesMap.set(tag, [handleList[i]]); }
					else { handles.push(handleList[i]); }
				}
			});
		});

		return [Array.from(dic, (point) => {
			return {
				x: point[0],
				y: bProportional ? point[1].count / point[1].total : point[1].count,
				...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
			};
		})];
	},
	playcount: function (xTags, playCount, skipCount, handleList, optionArg, bUseId, bIncludeHandles) {
		const bIncludeSkip = optionArg && optionArg.bSkipCount;
		const tagCount = new Map();
		const idMap = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((tag) => {
				if (bUseId) {
					let id = '';
					[tag, id] = tag.split('|‎|');
					if (id) {
						if (!idMap.has(id)) { idMap.set(id, this.idChars.shuffle().join('')); }
						id = idMap.get(id);
						tag += id;
					}
				}
				const entry = tagCount.get(tag);
				if (!entry) {
					tagCount.set(tag, {
						playCount: Number(playCount[i]),
						handles: bIncludeHandles ? [handleList[i]] : null,
						skipCount: bIncludeSkip ? Number(skipCount[i]) : null,
					});
				} else {
					entry.playCount += Number(playCount[i]);
					if (bIncludeHandles) { entry.handles.push(handleList[i]); }
					if (bIncludeSkip) { entry.skipCount += Number(skipCount[i]); }
				}
			});
		});
		return [Array.from(tagCount, (point) => {
			return {
				x: point[0].replace(this.idCharsRegExp, ''),
				y: point[1].playCount,
				...(bIncludeHandles ? { handle: point[1].handles } : {}),
				...(bIncludeSkip ? { skipCount: point[1].skipCount } : {}),
			};
		})];
	},
	playcountProportional: function (xTags, playCount, handleList, bUseId, bIncludeHandles) {
		const tagCount = new Map();
		const keyCount = new Map();
		const handlesMap = new Map();
		const idMap = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((tag) => {
				if (bUseId) {
					let id = '';
					[tag, id] = tag.split('|‎|');
					if (id) {
						if (!idMap.has(id)) { idMap.set(id, this.idChars.shuffle().join('')); }
						id = idMap.get(id);
					} else { id = ''; }
					tag += id;
				}
				if (!tagCount.has(tag)) { tagCount.set(tag, Number(playCount[i])); }
				else { tagCount.set(tag, tagCount.get(tag) + Number(playCount[i])); }
				if (!keyCount.has(tag)) { keyCount.set(tag, 1); }
				else { keyCount.set(tag, keyCount.get(tag) + 1); }
				if (bIncludeHandles) {
					const handles = handlesMap.get(tag);
					if (!handles) { handlesMap.set(tag, [handleList[i]]); }
					else { handles.push(handleList[i]); }
				}
			});
		});
		keyCount.forEach((value, key) => {
			if (tagCount.has(key)) { tagCount.set(key, Math.round(tagCount.get(key) / keyCount.get(key))); }
		});
		return [Array.from(tagCount, (point) => {
			return {
				x: point[0].replace(this.idCharsRegExp, ''),
				y: point[1],
				...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
			};
		})];
	},
	playcountWorldMap: function (xTags, playCount, handleList, worldMapData, bIncludeHandles) {
		const tagCount = new Map();
		const handlesMap = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((tag) => {
				const idData = worldMapData.find((data) => data.id === tag);
				if (idData) {
					const isoCode = getCountryISO(idData.country);
					if (isoCode) {
						const id = idData
							? idData.country
							: null;
						if (!id) { return; }
						if (!tagCount.has(id)) { tagCount.set(id, Number(playCount[i])); }
						else { tagCount.set(id, tagCount.get(id) + Number(playCount[i])); }
						if (bIncludeHandles) {
							const handles = handlesMap.get(tag);
							if (!handles) { handlesMap.set(tag, [handleList[i]]); }
							else { handles.push(handleList[i]); }
						}
					}
				}
			});
		});
		return [Array.from(tagCount, (point) => {
			return {
				x: point[0],
				y: point[1],
				...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
			};
		})];
	},
	playcountWorldMapRegion: function (xTags, playCount, handleList, worldMapData, bIncludeHandles) {
		const tagCount = new Map();
		const handlesMap = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((tag) => {
				const idData = worldMapData.find((data) => data.id === tag);
				if (idData) {
					const isoCode = getCountryISO(idData.country);
					if (isoCode) {
						const id = music_graph_descriptors_countries.getFirstNodeRegion(isoCode);
						if (!id) { return; }
						if (!tagCount.has(id)) { tagCount.set(id, Number(playCount[i])); }
						else { tagCount.set(id, tagCount.get(id) + Number(playCount[i])); }
						if (bIncludeHandles) {
							const handles = handlesMap.get(tag);
							if (!handles) { handlesMap.set(tag, [handleList[i]]); }
							else { handles.push(handleList[i]); }
						}
					}
				}
			});
		});
		return [Array.from(tagCount, (point) => {
			return {
				x: point[0],
				y: point[1],
				...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
			};
		})];
	},
	playcountWorldMapCity: function (xTags, playCount, handleList, worldMapData, bIncludeHandles) {
		const tagCount = new Map();
		const cityMap = new Map();
		const handlesMap = new Map();
		xTags.forEach((arr, i) => {
			arr.forEach((tag) => {
				const idData = worldMapData.find((data) => data.id === tag);
				if (idData && idData.city && idData.city !== idData.country) {
					const id = idData.city;
					if (idData.country) {
						const pointTags = cityMap.get(id);
						if (!pointTags) {
							cityMap.set(id, { country: idData.country, artists: new Map([[idData.id, Number(playCount[i])]]) });
						} else {
							pointTags.artists.set(idData.id, (pointTags.artists.get(idData.id) || 0) + Number(playCount[i]));
						}
					}
					if (!id) { return; }
					if (!tagCount.has(id)) { tagCount.set(id, Number(playCount[i])); }
					else { tagCount.set(id, tagCount.get(id) + Number(playCount[i])); }
					if (bIncludeHandles) {
						const handles = handlesMap.get(tag);
						if (!handles) { handlesMap.set(tag, [handleList[i]]); }
						else { handles.push(handleList[i]); }
					}
				}
			});
		});
		return [Array.from(tagCount, (point) => {
			const tags = cityMap.get(point[0]);
			return {
				x: point[0],
				y: point[1],
				country: tags.country,
				artists: [...tags.artists]
					.sort((a, b) => b[1] - a[1])
					.map((a) => { return { artist: a[0], listens: a[1] }; }),
				...(bIncludeHandles ? { handle: handlesMap.get(point[0]) } : {})
			};
		})];
	},
	playcountPeriod: function (x, listens, handleList, skipCount, optionArg, bIncludeHandles) {
		const bIncludeSkip = optionArg && optionArg.bSkipCount;
		const tagCount = new Map();
		this.timeRange(x, optionArg.fromDate, optionArg.toDate).forEach((key) => tagCount.set(key.toString(), {
			playCount: 0,
			handles: bIncludeHandles ? [] : null,
			skipCount: bIncludeSkip ? 0 : null,
			time: 0
		}));
		const minDate = optionArg && optionArg.toDate
			? optionArg.toDate.getTime()
			: null;
		listens.forEach((listenArr, i) => {
			listenArr.forEach((listen) => {
				let date;
				switch (x.toUpperCase()) {
					case '#DAY#': date = listen.getUTCDate().toString().padStart(2, '0'); break;
					case '#WEEK#': date = ['1st', '2nd', '3rd', '4th', '5th'][Math.floor(listen.getUTCDate() / 7)]; break;
					// case '#WEEK#': date = 1 + Math.floor(listen.getUTCDate() / 7); break;
					case '#MONTH#': date = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][listen.getUTCMonth()]; break;
					// case '#MONTH#': date = (listen.getUTCMonth() + 1); break;
					case '#YEAR#': date = listen.getUTCFullYear(); break;
				}
				if (minDate && listen.getTime() < minDate) { return; }
				const old = tagCount.get(date.toString()) || {
					playCount: 0,
					handles: bIncludeHandles ? [] : null,
					skipCount: bIncludeSkip ? 0 : null,
					time: 0
				};
				old.playCount += 1;
				if (bIncludeHandles) { old.handles.push(handleList[i]); }
				if (bIncludeSkip) { old.skipCount += Number(skipCount[i]); }
				old.time += handleList[i].Length;
				tagCount.set(date.toString(), old);
			});
		});
		return [Array.from(tagCount, (point) => {
			return {
				x: point[0].replace(this.idCharsRegExp, ''),
				y: point[1].playCount,
				...(bIncludeHandles ? { handle: point[1].handles } : {}),
				...(bIncludeSkip ? { skipCount: point[1].skipCount } : {}),
				time: point[1].time
			};
		})];
	},
	filterSource: function (query, source, handle = null) {
		query = queryReplaceWithCurrent(query, handle, { bToLowerCase: true });
		if (!checkQuery(query)) { return new FbMetadbHandleList(); }
		return (query.length && query !== 'ALL' ? fb.GetQueryItems(source, query) : source);
	},
	deduplicateSource: function (source, options = { checkKeys: globTags.remDupl, sortBias: globQuery.remDuplBias }) {
		return removeDuplicates({ handleList: source, checkKeys: globTags.remDupl, sortBias: globQuery.remDuplBias, bPreserveSort: true, bAdvTitle: true, ...options });
	},
	timeRange: function (tag, fromDate, toDate) {
		switch (tag.toUpperCase()) {
			case '#DAY#':
				return range(
					1,
					new Date(
						fromDate.getUTCFullYear(),
						fromDate.getUTCMonth() + 1,
						0
					).getDate()
				).map((v) => v.toString().padStart(2, '0'));
			case '#WEEK#':
				return ['1st', '2nd', '3rd', '4th', '5th'];
			case '#MONTH#':
				return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
			case '#YEAR#':
				return range((toDate || new Date()).getUTCFullYear(), fromDate ? fromDate.getUTCFullYear() : 0);
			default:
		}
	}
};