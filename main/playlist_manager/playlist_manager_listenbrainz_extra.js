'use strict';
//06/08/25

/* global youTube:readable */
include('..\\..\\helpers\\helpers_xxx.js');
/* global globQuery:readable, globTags:readable, memoize:readable, folders:readable */
include('playlist_manager_listenbrainz.js');
/* global ListenBrainz:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _open:readable, utf8:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global _p:readable, _q:readable, _t:readable, module:readable, _b:readable, WshShell:readable, popup:readable, round:readable, _bt:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryJoin:readable, sanitizeTagValIds:readable, sanitizeTagIds:readable, sanitizeQueryVal:readable, queryCombinations:readable, sanitizeTagTfo:readable, getHandleListTagsV2:readable, fallbackTagsQuery:readable */
include('..\\..\\helpers\\helpers_xxx_tags_extra.js');
/* global writeSimilarArtistsTags:readable, updateTrackSimilarTags:readable, updateSimilarDataFile:readable */
include('..\\..\\helpers\\helpers_xxx_web.js');
/* global send:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
include('..\\..\\helpers-external\\easy-table-1.2.0\\table.js'); const Table = module.exports;

/**
 * @param {import('playlist_manager_listenbrainz.js').ListenBrainz} ListenBrainz
 */

/**
 * Retrieves recommended tracks for user and creates a playlist with matches or YouTube Links
 * @name getRecommendedTracks
 * @kind method
 * @memberof ListenBrainz
 * @param {string} user - User name
 * @param {{artist_type:string count:number offset:number}} params - artist_type: 'top'
 * @param {string} name - Title for the report
 * @param {string} token - ListenBrainz user token (does not need to match the user)
 * @param {Boolean} bYoutube - Retrieve YouTube links
 * @param {Boolean} bRandomize - Shuffle items at output
 * @param {?Object} parent - Button parent to switch animations
 * @returns {void}
 */
ListenBrainz.getRecommendedTracks = function getRecommendedTracks(user, params, name, token, bYoutube = true, bRandomize = false, parent = null) {
	const mbids = [];
	const artistMBIDs = [];
	const tags = { TITLE: [], ARTIST: [] };
	let count = 0;
	parent && parent.switchAnimation('ListenBrainz data retrieval', true);
	return this.getRecommendedRecordings(user, params, token)
		.then((recommendations) => {
			recommendations.forEach((recording) => {
				mbids.push(recording.recording_mbid || '');
				tags.TITLE.push('');
				tags.ARTIST.push('');
			});
			count = mbids.length;
			const infoNames = ['recording_mbid', 'recording_name', 'artist_credit_name', 'artist_credit_mbids'];
			return this.lookupRecordingInfoByMBIDs(mbids, infoNames, token);
		})
		.then((info) => {
			parent && parent.switchAnimation('ListenBrainz data retrieval', false);
			if (['recording_mbid', 'recording_name', 'artist_credit_name'].every((tag) => Object.hasOwn(info, tag))) {
				for (let i = 0; i < count; i++) {
					if (mbids[i] === info.recording_mbid[i]) {
						if (info.recording_name[i]) { tags.TITLE[i] = info.recording_name[i]; }
						if (info.artist_credit_name[i]) { tags.ARTIST[i] = info.artist_credit_name[i]; }
						if (info.artist_credit_mbids[i] && info.artist_credit_mbids[i].length) { artistMBIDs[i] = info.artist_credit_mbids[i]; }
					}
				}
			}
			const table = new Table;
			mbids.forEach((mbid, i) => {
				table.cell('Title', tags.TITLE[i]);
				table.cell('Artist', tags.ARTIST[i]);
				table.cell('MBID', mbid);
				table.newRow();
			});
			const report = name + ': ' + count + '\n\n' + table.toString();
			fb.ShowPopupMessage(report, 'ListenBrainz ' + name + ' ' + _p(user));
			const queryArr = mbids.map((mbid, i) => {
				const tagArr = ['TITLE', 'ARTIST']
					.map((key) => { return { key, val: sanitizeQueryVal(sanitizeTagValIds(tags[key][i])) }; });
				const bMeta = tagArr.every((tag) => { return tag.val.length > 0; });
				if (!bMeta) { return; }
				const query = queryJoin(
					[
						bMeta ? tagArr.map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ') : '',
						bMeta ? tagArr.slice(0, 2).map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ') + ' AND ' + globQuery.noLiveNone : '',
						'MUSICBRAINZ_TRACKID IS ' + mbid
					].filter(Boolean)
					, 'OR'
				);
				return query;
			}).filter(Boolean);
			const libItems = fb.GetLibraryItems();
			const notFound = [];
			const items = queryArr.map((query, i) => {
				let itemHandleList = fb.GetQueryItemsCheck(libItems, query);
				if (!itemHandleList) {
					fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz');
					return;
				}
				// Filter
				if (itemHandleList.Count) {
					itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
					itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: true });
					return itemHandleList[0];
				}
				notFound.push({
					creator: tags.ARTIST[i],
					title: tags.TITLE[i],
					tags: {
						MUSICBRAINZ_TRACKID: mbids[i],
						MUSICBRAINZ_ALBUMARTISTID: (artistMBIDs[i] || [])[0],
						MUSICBRAINZ_ARTISTID: artistMBIDs[i] || []
					}
				});
				return null;
			});
			return { notFound, items };
		})
		.then(({ notFound, items }) => {
			if (notFound.length && bYoutube) {
				parent && parent.switchAnimation('YouTube Scrapping', true);
				// Send request in parallel every x ms and process when all are done
				return Promise.parallel(notFound, youTube.searchForYoutubeTrack, 5).then((results) => {
					let j = 0;
					const itemsLen = items.length;
					results.forEach((result) => {
						for (void (0); j <= itemsLen; j++) {
							if (result.status !== 'fulfilled') { break; }
							const link = result.value;
							if (!link || !link.length) { break; }
							if (!items[j]) {
								items[j] = link.url;
								break;
							}
						}
					});
					return items;
				})
					.finally(() => {
						parent && parent.switchAnimation('YouTube Scrapping', false);
					});
			} else {
				return items;
			}
		})
		.then((items) => {
			if (bRandomize) { items.shuffle(); }
			const idx = plman.FindOrCreatePlaylist('ListenBrainz: ' + name + ' ' + _p(user), true);
			plman.ClearPlaylist(idx);
			plman.AddPlaylistItemsOrLocations(idx, items.filter(Boolean), true);
			plman.ActivePlaylist = idx;
		})
		.finally(() => {
			if (parent && parent.isAnimationActive('ListenBrainz data retrieval')) { parent.switchAnimation('ListenBrainz data retrieval', false); }
		});
};
/**
 * Parses the jsonl file from {@link https://github.com/kawaiiDango/pano-scrobbler Pano Scrobbler} and outputs a ListenBrainz compatible listens payload
 * @name parsePanoScrobblerJson
 * @kind method
 * @memberof ListenBrainz
 * @param {string} file - File path
 * @param {{player:string; client:string; version:string;}} info
 * @param {('scrobble'|'love')} event
 * @returns {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]}
 */
ListenBrainz.parsePanoScrobblerJson = function parsePanoScrobblerJson(file, info, event = 'scrobble') {
	if (_isFile(file)) {
		const listens = [];
		const text = _open(file, utf8);
		for (let line of text.split(/\r\n|\n\r|\n|\r/)) {
			/** @type {{timeHuman:string, timeMs:number, artist:string, track:string, album:string, albumArtist:string, durationMs:number, event:string}} */
			const scrobble = line ? JSON.parse(line) : null;
			if (scrobble) {
				switch (event.toLocaleLowerCase()) {
					case 'scrobble': {
						if (scrobble.event !== 'scrobble') { continue; }
						listens.push({
							listened_at: Math.round(scrobble.timeMs / 1000),
							track_metadata: {
								additional_info: {
									...(Object.hasOwn(scrobble, 'mediaPlayerName') ? { media_player: scrobble.mediaPlayerName } : {}),
									...(Object.hasOwn(scrobble, 'mediaPlayerVersion') ? { media_player_version: scrobble.mediaPlayerVersion } : {}),
									...(info && Object.hasOwn(info, 'client') ? { submission_client: info.client } : {}),
									...(info && Object.hasOwn(info, 'version') ? { submission_client_version: info.version } : {}),
									duration_ms: scrobble.durationMs
								},
								...(Object.hasOwn(scrobble, 'artist') ? { artist_name: scrobble.artist } : {}),
								...(Object.hasOwn(scrobble, 'track') ? { track_name: scrobble.track } : {}),
								...(Object.hasOwn(scrobble, 'album') ? { release_name: scrobble.album } : {})
							}
						});
						break;
					}
					case 'love': {
						if (scrobble.event !== 'love') { continue; }
						listens.push({
							track_metadata: {
								additional_info: {},
								...(Object.hasOwn(scrobble, 'artist') ? { artist_name: scrobble.artist } : {}),
								...(Object.hasOwn(scrobble, 'track') ? { track_name: scrobble.track } : {}),
								...(Object.hasOwn(scrobble, 'album') ? { release_name: scrobble.album } : {})
							}
						});
						break;
					}
				}
			}
		}
		return listens;
	}
	return null;
};
/**
 * Parses ListenBrainz listens payload and adds MBIDs to listens if missing (modifies original array). MBIDs are retrieved from library, using user's tracks.
 * @name findPayloadMBIDs
 * @kind method
 * @memberof ListenBrainz
 * @param {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]} payload - Listenbrainz submit listen payload array
 * @returns {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; release_mbid: string; artist_mbids: string[]; recording_mbid:string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]}
 */
ListenBrainz.findPayloadMBIDs = function findPayloadMBIDs(payload) {
	let libItems;
	const multiTagRe = / \/ /gi;
	const findTrack = memoize((title, artist, album, releaseId, artistId, trackId) => {
		const query = queryJoin(
			[
				title || typeof title === 'string' && title.length > 0
					? '"$stricmp(' + sanitizeTagIds('%TITLE%') + ',' + sanitizeTagTfo(sanitizeTagValIds(title)) + ')" IS 1'
					: '',
				artist || typeof artist === 'string' && artist.length > 0
					? queryJoin([
						fallbackTagsQuery(globTags.artist, sanitizeQueryVal(artist), 'IS'),
						multiTagRe.test(artist)
							? queryJoin(
								artist.split(multiTagRe)
									.map((a) => fallbackTagsQuery(globTags.artist, sanitizeQueryVal(a), 'IS')),
								'OR')
							: ''
					], 'OR')
					: '',
				album || typeof album === 'string' && album.length > 0
					? '%ALBUM% IS ' + sanitizeQueryVal(album)
					: '',
				releaseId
					? '%MUSICBRAINZ_RELEASETRACKID% IS ' + releaseId
					: '',
				...(artistId && artistId.length
					? queryCombinations(artistId, 'MUSICBRAINZ_ARTISTID', 'AND')
					: []
				),
				trackId
					? '%MUSICBRAINZ_TRACKID% IS ' + trackId
					: '',
				'%MUSICBRAINZ_RELEASETRACKID% PRESENT OR %MUSICBRAINZ_ARTISTID% PRESENT OR %MUSICBRAINZ_TRACKID% PRESENT'
			].filter(Boolean),
			'AND'
		);
		if (!query) { return null; }
		if (!libItems) { libItems = fb.GetLibraryItems(); }
		const handleList = fb.GetQueryItemsCheck(libItems, query, true);
		if (handleList && handleList.Count) {
			const biasTF = fb.TitleFormat(globQuery.remDuplBias);
			handleList.OrderByFormat(biasTF, -1);
			return handleList[0];
		}
		return null;
	});
	for (let listen of payload) {
		const meta = listen.track_metadata;
		const metaIds = meta.additional_info;
		const bRelease = Object.hasOwn(metaIds, 'release_mbid');
		const bArtist = Object.hasOwn(metaIds, 'artist_mbids');
		const bRecording = Object.hasOwn(metaIds, 'recording_mbid');
		const handle = findTrack(meta.track_name, meta.artist_name, meta.release_name, metaIds.release_mbid, metaIds.artist_mbids || [], metaIds.recording_mbid);
		if (handle) {
			const sep = '|‎|';
			if (!bRelease || !bArtist || !bRecording) {
				const tags = fb.TitleFormat(
					_bt('MUSICBRAINZ_RELEASETRACKID') +
					sep +
					_bt('MUSICBRAINZ_ARTISTID') +
					sep +
					_bt('MUSICBRAINZ_TRACKID')
				).EvalWithMetadb(handle).split(sep);
				if (!bRelease && tags[0] && tags[0] !== '.') { metaIds.release_mbid = tags[0]; }
				if (!bArtist && tags[1] && tags[1] !== '.') { metaIds.artist_mbids = tags[1].split(', '); }
				if (!bRecording && tags[2] && tags[2] !== '.') { metaIds.recording_mbid = tags[2]; }
			}
			const tags = fb.TitleFormat(_bt(globTags.genre) + ', ' + _bt(globTags.style)).EvalWithMetadb(handle);
			if (tags.length) { metaIds.tags = tags.split(', ').filter(Boolean); }
		}
	}
	return payload;
};
/**
 * Parses a ListenBrainz listens payload and adds MBIDs/tags to listens if missing (modifies original array). MBIDs are retrieved from library, using user's tracks.
 * @async
 * @name processPayload
 * @kind method
 * @memberof ListenBrainz
 * @param {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; release_mbid: string; artist_mbids: string[]; recording_mbid:string; duration_ms: number; media_player?: string; }; artist_name: string; track_name: string; release_name: string; }; }[]} payload - Listenbrainz submit listen payload
 * @param {string} token - ListenBrainz user token
 * @param {('listen'|'scrobble'|'love')} event
 * @returns {Promise.<{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; release_mbid: string; artist_mbids: string[]; recording_mbid:string; duration_ms: number; media_player?: string; tags?: string[] }; artist_name: string; track_name: string; release_name: string; }; }[]>}
 */
ListenBrainz.processPayload = async function processPayload(payload, token, event = 'listen') {
	let processed;
	switch (event.toLocaleLowerCase()) {
		case 'scrobble':
		case 'listen': processed = payload; break;
		case 'love': {
			for (let listen of payload) {
				processed = [];
				const metaIds = listen.track_metadata.additional_info;
				if (Object.hasOwn(metaIds, 'recording_mbid')) {
					processed.push({ recording_mbid: metaIds.recording_mbid, score: 1 });
				} else {
					const result = await this.lookupMBIDs([[[listen.track_metadata.artist_name]], [[listen.track_metadata.track_name]]], token);
					if (result[0]) { processed.push({ recording_mbid: result[0], score: 1 }); }
				}
			}
			break;
		}
	}
	return Promise.resolve(processed);
};
/**
 * Submits a listens payload in chunks according to the max listens per request API limit. Note duplicates are handled automatically by the server.
 * @async
 * @name ListenBrainz.submitListens
 * @kind method
 * @memberof ListenBrainz
 * @param {{ listened_at: number; track_metadata: { additional_info: { submission_client: string; submission_client_version: string; release_mbid: string; artist_mbids: string[]; recording_mbid:string; duration_ms: number; media_player?: string; tags?: string[] }; artist_name: string; track_name: string; release_name: string; }; }[]} payload - Playlist object from Playlist manager
 * @param {string} token
 * @returns {Promise.<boolean[]>}
 */
ListenBrainz.submitListens = async function submitListens(payload, token) {
	const chunks = payload.chunk(this.MAX_LISTENS_PER_REQUEST);
	const rate = 50;
	return Promise.serial(chunks, (chunk, i) => {
		const data = {
			listen_type: 'import',
			payload: chunk
		};
		return send({
			method: 'POST',
			URL: 'https://api.listenbrainz.org/1/submit-listens',
			requestHeader: [['Content-Type', 'application/json'], ['Authorization', 'Token ' + token]],
			body: JSON.stringify(data)
		}).then(
			(resolve) => {
				console.log('submitListens: (chunk ' + i + ') ' + resolve);
				if (resolve) {
					const response = JSON.parse(resolve);
					if (response.status === 'ok') { return true; }
					console.log('submitListens: (chunk ' + i + ') ' + response.status + ' ' + response.responseText);
				}
				return false;
			},
			(reject) => {
				console.log('submitListens: (chunk ' + i + ') ' + reject.status + ' ' + reject.responseText);
				return false;
			}
		);
	}, rate)
		.then((results) => {
			return results.every(Boolean);
		}, () => {
			return false;
		});
};
/**
 * Outputs similar artists to the one from input FbMetadbHandle
 * @async
 * @name calculateSimilarArtistsFromPls
 * @kind method
 * @memberof ListenBrainz
 * @param {Object} [o] - arguments
 * @param {FbMetadbHandleList} o.items - [=plman.GetPlaylistSelectedItems(plman.ActivePlaylist)] Input FbMetadbHandle
 * @param {string} o.file - [=folders.data + 'listenbrainz_artists.json'] Output file for database
 * @param {string} o.iNum - [=10] Num of artists to save on database
 * @param {string} o.tagName - [='SIMILAR ARTISTS LISTENBRAINZ'] Tag name for saving on tracks
 * @param {boolean} o.bLookupMBIDs - [=true] Lookup MBIDs online if missing on tags
 * @param {string} o.token
 * @returns {Promise.<{ artist: string; mbid: string; similar: { artist: string; mbid: string; score: number; }[]; }[]>}
 */
ListenBrainz.calculateSimilarArtistsFromPls = async function calculateSimilarArtistsFromPls({ items = plman.GetPlaylistSelectedItems(plman.ActivePlaylist), file = folders.data + 'listenbrainz_artists.json', iNum = 10, tagName = globTags.lbSimilarArtist, bLookupMBIDs = true, token } = {}) {
	const handleList = removeDuplicates({ handleList: items, sortOutput: globTags.artist, checkKeys: [globTags.artist] });
	if (WshShell.Popup('Process [different] artists from currently selected items and retrieve their most similar artists?\nResults are output to console and saved to JSON:\n' + file, 0, 'ListenBrainz', popup.question + popup.yes_no) === popup.no) { return; }
	let profiler = new FbProfiler('Retrieve similar artists');
	const newData = [];
	const selMbids = await this.getArtistMBIDs(handleList, token, bLookupMBIDs, true);
	const selArtists = getHandleListTagsV2(handleList, ['ALBUM ARTIST'], { bMerged: true }).flat();
	const artistDic = await this.joinArtistMBIDs(selArtists, selMbids, token, true);
	let maxCount = 0;
	artistDic.forEach((ref) => {
		ref.mbid = ref.mbids[0];
		delete ref.mbids;
		ref.val = [];
	});
	if (selMbids.length) {
		/** @type {{artist_mbid:string, comment:string, gender:string, name:string, reference_mbid:string, score:number, type:strings}[] */
		const output = await this.retrieveSimilarArtists(selMbids, token);
		if (output.length) {
			output.forEach((artistData) => {
				const ref = artistDic.find((ref) => ref.mbid === artistData.reference_mbid);
				if (ref) {
					ref.val.push({ artist: artistData.name, mbid: artistData.artist_mbid, score: artistData.score });
					maxCount = Math.max(maxCount, artistData.score);
				}
			});
		}
		artistDic.filter((ref) => ref.val.length).forEach((ref) => newData.push(ref));
	}
	if (!newData.length) { console.log('Nothing found.'); return []; }
	newData.forEach((obj) => {
		obj.val.forEach((val) => {
			val.count = val.score;
			val.score = round(val.score / maxCount * 100, 1);
		});
	});
	this.updateSimilarDataFile(file, newData, iNum);
	profiler.Print();
	const report = newData.map((obj) => // List of artists with tabbed similar artists + score
		obj.artist + ':\n\t' + (obj.val.map((sim) =>
			_b(sim.score + '%') + '\t' + _p(sim.count + ' listens') + '\t' + sim.artist
		).join('\n\t') || '-NONE-')
	).join('\n\n');
	fb.ShowPopupMessage(report, 'ListenBrainz');
	if (WshShell.Popup('Write similar artist tags to all tracks by selected artists?\n(It will also rewrite previously added similar artist tags)\nOnly first ' + iNum + ' artists with highest score will be used.', 0, 'Similar artists', popup.question + popup.yes_no) === popup.yes) {
		this.updateTrackSimilarTags({ data: newData, iNum, tagName });
	}
	return newData;
};
/**
 * Writes similar artists tags to all tracks on library matching the JSON database. Only tracks which need updating are touched.
 * @name writeSimilarArtistsTags
 * @kind method
 * @memberof ListenBrainz
 * @param {Object} [o] - arguments
 * @param {string} o.file - [=folders.data + 'listenbrainz_artists.json'] Input file for database
 * @param {string} o.iNum - [=10] Num of artists to write on tags
 * @param {string} o.tagName - [='SIMILAR ARTISTS LISTENBRAINZ'] Tag name for saving on tracks
 * @returns {boolean}
 */
ListenBrainz.writeSimilarArtistsTags = function ({ file = folders.data + 'listenbrainz_artists.json', iNum = 10, tagName = globTags.lbSimilarArtist } = {}) {
	return writeSimilarArtistsTags({ file, iNum, tagName, windowName: 'ListenBrainz' });
};
/**
 * Updates similar artists tags in all tracks on library matching the input data. Only tracks which need updating are touched.
 * @name updateTrackSimilarTags
 * @kind method
 * @memberof ListenBrainz
 * @param {Object} [o] - arguments
 * @param {{ artist: string; mbid: string; similar: { artist: string; mbid: string; score: number; }[]; }[]} o.data - Similar artists data array
 * @param {string} o.iNum - [=10] Num of artists to write on tags
 * @param {string} o.tagName - [='SIMILAR ARTISTS LISTENBRAINZ'] Tag name for saving on tracks
 * @returns {boolean}
 */
ListenBrainz.updateTrackSimilarTags = function ({ data, iNum = 10, tagName = globTags.lbSimilarArtist } = {}) {
	return updateTrackSimilarTags({ data, iNum, tagName, windowName: 'ListenBrainz', bPopup: false });
};
/**
 * Updates the similar artists JSON database
 * @name updateSimilarDataFile
 * @kind method
 * @memberof ListenBrainz
 * @param {string} file - [=folders.data + 'listenbrainz_artists.json'] Output file for database
 * @param {{ artist: string; mbid: string; similar: { artist: string; mbid: string; score: number; }[]; }[]} newData - Similar artists data array
 * @param {string} iNum - [=Infinity] Num of similar artists to save
 * @returns {boolean}
 */
ListenBrainz.updateSimilarDataFile = updateSimilarDataFile.bind(ListenBrainz);

