
'use strict';
//06/08/25

/* exported wrapped */

include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable, globQuery:readable, globTags:readable, soFeat:readable, isSkipCount:readable */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global forEachNested:readable, _bt:readable, _q:readable, round:readable, _asciify:readable, _p:readable, _t:readable, toType:readable, range:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global sanitize:readable, _isFolder:readable,, _isFile:readable, _createFolder:readable, getFiles:readable, _runCmd:readable, _copyFile:readable, _save:readable, _run:readable, _recycleFile:readable, _deleteFolder:readable, _deleteFile:readable, _jsonParseFileCheck:readable, utf8:readable */
include('..\\..\\helpers\\helpers_xxx_playlists.js');
/* global sendToPlaylist:readable */
include('..\\..\\helpers\\helpers_xxx_statistics.js');
/* global calcHistogram:readable */
include('..\\..\\helpers\\helpers_xxx_tags.js');
/* global queryCombinations:readable, queryJoin:readable, sanitizeQueryVal:readable, sanitizeTagIds:readable, sanitizeTagValIds:readable, sanitizeTagTfo:readable */
include('..\\..\\helpers\\helpers_xxx_web.js');
/* global send:readable */
include('..\\..\\helpers\\camelot_wheel_xxx.js');
/* global camelotWheel:readable */
include('..\\timeline\\timeline_helpers.js');
/* global getDataAsync:readable */
include('..\\search\\top_tracks_from_date.js');
/* global getPlayCountV2:readable, timeOnPeriod:readable */
include('spotify.js');
/* global spotify:readable */
include('..\\search_by_distance\\search_by_distance_genres.js');
/* global getNearestGenreStyles:readable, music_graph_descriptors:readable, musicGraph:readable */
include('..\\search_by_distance\\search_by_distance_culture.js');
/* global getCountryISO:readable, getZoneArtistFilter:readable */
include('..\\music_graph\\music_graph_descriptors_xxx_node.js');
// music_graph_descriptors.nodeList:readable
include('..\\sort\\scatter_by_tags.js');
/* global shuffleByTags:readable */
include('..\\playlist_manager\\playlist_manager_youtube.js');
/* global youTube:readable */
include('..\\filter_and_query\\remove_duplicates.js');
/* global removeDuplicates:readable */
include('..\\playlist_manager\\playlist_manager_listenbrainz.js');
/* global ListenBrainz:readable */


const wrapped = {
	basePath: folders.temp + 'wrapped\\',
	tags: {
		artist: 'ALBUM ARTIST',
		genre: [globTags.genre, globTags.style].map(_t).join(', '),
		bpm: globTags.bpm,
		key: globTags.key,
		mood: globTags.mood
	},
	settings: {
		topSlice: 5, // Top X artists/albums/genres/countries
		genreGroupSlice: 4, // Top X genre groups
		genreSuggestSlice: 16, // Genre recommendations
		cityArtistSlice: 3, // Top X artists from city (display of artist imgs hardcoded to max 3  on current latex report)
		bOffline: false,
		bFilterGenres: true,
		bSuggestions: true,
		bDebug: false,
		bDebugQuery: false,
		highBpmHalveFactor: 30, // [0, 100]
		bServicesListens: false,
		tokens: { listenBrainz: '', listenBrainzUser: '' },
		imageStubPath: '.\\yttm\\art_img\\$lower($cut(%1,1))\\%1\\',
		filePaths: {
			worldMapArtists: '.\\profile\\' + folders.dataName + 'worldMap.json'
		}
	},
	isWorking: [],
	backgroundImgs: [],
	monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	stats: {
		genres: {
			total: 0,
			/** @type {{genres:string[], listens:number, score:number}} */
			mean: { genres: [], listens: 0 },
			/** @type {{genre:string, listens:number, score:number}[]} */
			byScore: [],
			/** @type {{name:string}[]} */
			similar: [],
			/** @type {{name:string}[]} */
			similarV2: [],
			groups: {
				/** @type {{name:string, score: number}[]} */
				list: [],
				get main() {
					return { ...this.list.sort((a, b) => b.score - a.score)[0] }; // NOSONAR
				},
				get scores() {
					return [...this.list.sort((a, b) => b.score - a.score) // NOSONAR
						.map((char) => { return { name: char.name, score: char.score }; })
					];
				}
			}
		},
		tracks: { total: 0 },
		artists: {
			total: 0,
			/** @type {{artist:string, tracks:number, topTrack: { title:string, listens:number, artist:string, handle:FbMetadbHandle[]?, albumImg:string? }}[]} */
			top: [],
			/** @type {{artist:string, month:number, listens:number, monthName:string}[]} */
			byMonth: []
		},
		albums: {
			total: 0,
			/** @type {{artist:string, album:string, topTrack: { title:string, listens:number, artist:string,album:string, handle:FbMetadbHandle[]?, albumImg:string? }}[]} */
			top: []
		},
		countries: {
			total: 0,
			/** @type {{name:string, listens:number, iso:string}[]} */
			byISO: [],
			/** @type {{name:string, listens:number, iso:string, artist:string}[]} */
			byArtist: [],
		},
		cities: { total: 0 },
		listens: { total: 0 },
		skips: { total: 0 },
		bpms: {
			mean: { val: 0, listens: 0 },
			max: { val: 0, listens: 0 },
			min: { val: 0, listens: 0 },
			high: { val: 130, listens: 0 },
			low: { val: 90, listens: 0 },
			stdDev: 0,
			histogram: []
		},
		keys: {
			mean: { tone: { val: 0, listens: 0 }, key: { val: 0, listens: 0 } },
			minor: { listens: 0 },
			major: { listens: 0 },
			stdDev: 0,
			histogram: []
		},
		moods: {
			total: 0,
			sad: { listens: 0 },
			calm: { listens: 0 },
			happy: { listens: 0 },
			energetic: { listens: 0 },
		},
		time: {
			minutes: 0,
			days: 0,
			mean: { listensPerDay: 0, minutesPerDay: 0 },
			range: { days: 0, hours: 0, minutes: 0, seconds: 0 },
			most: {
				date: new Date(),
				minutes: 0,
				track: { title: '', artist: '', handle: null, albumImg: null }
			},
			first: {
				date: new Date(),
				minutes: 0,
				track: { title: '', artist: '', handle: null, albumImg: null }
			},
			last: {
				date: new Date(),
				minutes: 0,
				track: { title: '', artist: '', handle: null, albumImg: null }
			},
			/** @type {{month:number, monthName:string, listens:number, time:number, minutes:number }[]} */
			byMonth: []
		},
		character: {
			list: [
				{ name: 'Roboticist', score: 0, description: 'You like to hit play, kick back, and let the clever algorithms work their magic, track after track. Oh look, that rhymes.' },
				{ name: 'Hypnotist', score: 0, description: 'Your concentration is absolute, friend. You like to play albums all the way through, from the opening track to the final note.' },
				{ name: 'Collector', score: 0, description: 'Your taste is sublime. You listen mostly to your own playlists, and we totally get why. They\'re perfect, after all.' },
				{ name: 'Cyclops', score: 0, description: 'When it comes to your listening, you\'re loyal and devoted. You like to focus on one genre. Sometimes while wearing a monocle.' },
				{ name: 'Shapeshifter', score: 0, description: 'One moment you\'re head over heels for an artist. The next, you\'ve moved on. Some say it\'s erratic. We call it eclectic.' },
				{ name: 'Time traveler', score: 0, description: 'Have we met before? You travel back in time and listen to songs on repeat, again and again. The best tracks never get old.' },
				{ name: 'Vampire', score: 0, description: 'When it comes to your listening, you like to embrace a little... darkness. You listen to emotional, atmospheric music more than most.' },
				{ name: 'Hunter', score: 0, description: 'You\'re always searching for new favorites. You skip tracks more than other listeners. Maybe it\'s the thrill of the chase?' },
				{ name: 'Luminary', score: 0, description: 'There\'s a spark in you, and your listening shows it. You play light, upbeat music more than others. Bet you\'re fun at parties.' },
				{ name: 'Joker', score: 0, description: 'One day you play light and upbeat music, the next you like to embrace the darkness. Your taste suits any occasion.' },
				{ name: 'Alchemist', score: 0, description: 'Listening is your laboratory. You create your own playlists more than other listeners do. Nice work, doc.' },
				{ name: 'Mastermind', score: 0, description: 'Knowledge is power, listener. Which makes you powerful indeed, as you like to study a wide range of different genres. Clever you.' },
				{ name: 'Fanatic', score: 0, description: 'Once you pick a favorite, you never let go. Your top artist makes up more than a third of your listening. Impressive.' }
			],
			get main() {
				return { ...this.list.sort((a, b) => b.score - a.score)[0] }; // NOSONAR
			},
			get scores() {
				return [...this.list.sort((a, b) => b.score - a.score) // NOSONAR
					.map((char) => { return { name: char.name, score: char.score }; })
				];
			}
		},
	},
	playlists: {
		top: new FbMetadbHandleList(),
		discover: new FbMetadbHandleList(),
		topArtists: new FbMetadbHandleList(),
		topGenres: new FbMetadbHandleList(),
		topCountries: new FbMetadbHandleList(),
		suggestions: {
			/** @type {Promise.<(FbMetadbHandle|string)[]>} */
			genres: Promise.resolve([]),
			/** @type {Promise.<(FbMetadbHandle|string)[]>} */
			artists: Promise.resolve([]),
			library: new FbMetadbHandleList(),
			web: new FbMetadbHandleList()
		}
	},
	resetStats: function () {
		forEachNested(this.stats, (_, key, obj) => {
			if (key === 'list') {
				obj[key].forEach((char) => char.score = 0);
			} else if (!Object.getOwnPropertyDescriptor(obj, key)['get']) {
				if (key === 'date') {
					obj[key] = new Date();
				} else if (['byMonth', 'similar', 'byScore', 'byISO', 'byArtist', 'histogram', 'top'].includes(key)) {
					obj[key].length = 0;
				} else if (['artist', 'title'].includes(key)) {
					obj[key] = '';
				} else if (['albumImg', 'artistImg', 'handle'].includes(key)) {
					obj[key] = null;
				} else {
					obj[key] = 0;
				}
			}
		});
		this.stats.bpms.high.val = 130;
		this.stats.bpms.low.val = 90;
	},
	resetPlaylists: function () {
		forEachNested(this.playlists, (_, key, obj) => {
			if (['genres', 'artists'].includes(key)) {
				obj[key] = [];
			} else {
				obj[key] = new FbMetadbHandleList();
			}
		});
	},
	isServicesListens: function () {
		return this.settings.bServicesListens && (this.settings.tokens.listenBrainzUser.length || this.settings.tokens.listenBrainz.length);
	},
	getDataQueryParam: function (timePeriod, timeKey) {
		return timePeriod
			? timeKey
				? 'DURING LAST ' + timePeriod + ' ' + timeKey
				: 'SINCE ' + timePeriod
			: null;
	},
	getDataQuery: function (queryParam, extraQuery = '') {
		return queryJoin([
			queryParam && !this.isServicesListens()
				? '(%LAST_PLAYED_ENHANCED% PRESENT AND %LAST_PLAYED_ENHANCED% ' + queryParam + ') OR (%2003_LAST_PLAYED% PRESENT AND %2003_LAST_PLAYED% ' + queryParam + ') OR (%2003_LAST_PLAYED% MISSING AND %LAST_PLAYED% ' + queryParam + ')'
				: '',
			extraQuery || ''
		].filter(Boolean), 'AND');
	},
	/**
	 * Retrieves Artist stats in a promise that resolves to an array of artist data.
	 *
	 * @name getArtistsData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{artist:string, listens:number}[]>}
	*/
	getArtistsData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount', optionArg: { timePeriod, timeKey, fromDate },
			x: this.tags.artist,
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x: string, y: number}[]]*/ data) => {
				data = data[0];
				if (this.isServicesListens()) {
					data = data.filter((artist) => artist.y !== 0);
				}
				// Process
				data.forEach((artist) => {
					artist.artistImg = this.basePath + 'img\\untitled.jpg';
					artist.artist = artist.x;
					artist.listens = artist.y;
					delete artist.x;
					delete artist.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// stats
				this.computeArtistsStats(data);
				// Playlists
				if (this.settings.bSuggestions) {
					this.computeTopArtistsPlaylist(data);
					this.computeSuggestedArtistsPlaylist(data, queryParam);
				}
				return data;
			});
	},
	/**
	 * Retrieves Genres stats in a promise that resolves to an array of genre data.
	 *
	 * @name getGenresData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{genre:string, listens:number}[]>}
	*/
	getGenresData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount', optionArg: { timePeriod, timeKey, fromDate },
			x: this.tags.genre,
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x: string, y: number}[]] */ data) => {
				data = data[0]; // There is only a single series
				if (this.isServicesListens()) {
					data = data.filter((genre) => genre.y !== 0);
				}
				if (this.settings.bFilterGenres) {
					const descr = music_graph_descriptors;
					data = data.filter((g) => !descr.map_distance_exclusions.has(g.x) && descr.isOnGraph([g.x]));
				}
				// Process
				data.forEach((genre) => {
					genre.genre = genre.x;
					genre.listens = genre.y;
					delete genre.x;
					delete genre.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// stats
				this.computeGenresStats(data);
				// Playlists
				if (this.settings.bSuggestions) {
					this.computeTopGenresPlaylist(data);
					this.computeSuggestedGenresPlaylist(this.stats.genres.similar, queryParam);
				}
				return data;
			});
	},
	/**
	 * Retrieves Tracks stats in a promise that resolves to an array of tracks data.
	 *
	 * @name getTracksData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{title:string, artist:string, artists:string[], listens:number, skipCount:number, handle:FbMetadbHandle[], artist:string}[]>}
	*/
	getTracksData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount', optionArg: { timePeriod, timeKey, fromDate, bSkipCount: isSkipCount },
			x: 'TITLE',
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true, bIncludeHandles: true,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then(async (/** @type [{x:string, y:number, skipCount:number, handle:FbMetadbHandle[]}[]] */ data) => {
				data = data[0];
				if (this.isServicesListens()) {
					data = data.filter((track) => track.y !== 0);
				}
				// Process
				data.forEach((track) => {
					track.artists = [...new Set(
						fb.TitleFormat(_bt(this.tags.artist))
							.EvalWithMetadbs(new FbMetadbHandleList(track.handle))
							.map((artist) => artist.split(/, ?/))
							.flat(Infinity)
					)];
					track.artist = track.artists.join(', ');
					track.album = fb.TitleFormat(_bt('ALBUM')).EvalWithMetadb(track.handle[0]);
					track.title = track.x;
					track.listens = track.y;
					track.rating = round(
						Math.max(
							...fb.TitleFormat(_bt(globTags.rating))
								.EvalWithMetadbs(new FbMetadbHandleList(track.handle)),
							0
						),
						1
					);
					track.loved = fb.TitleFormat(globTags.isLoved)
						.EvalWithMetadbs(new FbMetadbHandleList(track.handle))
						.some((val) => val === '1');
					track.hated = fb.TitleFormat(globTags.isHated)
						.EvalWithMetadbs(new FbMetadbHandleList(track.handle))
						.some((val) => val === '1');
					delete track.x;
					delete track.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// Stats
				this.computeTracksStats(data);
				await this.computeListensStats(data, timePeriod, timeKey, fromDate);
				this.computeSkipsStats(data);
				// Playlist
				if (this.settings.bSuggestions) {
					this.computeTopTracksPlaylist(data);
					this.computeDiscoverPlaylist(data, queryParam);
				}
				return data;
			});
	},
	/**
	 * Retrieves BPMs stats in a promise that resolves to an array of BPM data.
	 *
	 * @name getBpmsData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{bpm:number, listens:number}[]>}
	*/
	getBpmsData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount', optionArg: { timePeriod, timeKey, fromDate },
			x: this.tags.bpm,
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x: number, y: number}[]] */ data) => {
				data = data[0].filter((bpm) => bpm.x);
				if (this.isServicesListens()) {
					data = data.filter((bpm) => bpm.y !== 0);
				}
				// Process
				data.forEach((bpm) => {
					bpm.bpm = Number(bpm.x);
					bpm.listens = bpm.y;
					delete bpm.x;
					delete bpm.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// Stats
				this.computeBpmsStats(data);
				return data;
			});
	},
	/**
	 * Retrieves Keys stats in a promise that resolves to an array of key data.
	 *
	 * @name getKeyData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{key:{hour:number, letter:string}, openKey:string, stdKey: string, listens:number}[]>}
	*/
	getKeyData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount', optionArg: { timePeriod, timeKey, fromDate },
			x: this.tags.key,
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x: string, y: number}[]] */ data) => {
				data = data[0].filter((key) => key.x);
				if (this.isServicesListens()) {
					data = data.filter((key) => key.y !== 0);
				}
				// Process
				data.forEach((key) => {
					key.key = camelotWheel.getKeyNotationObjectOpen(key.x);
					key.openKey = camelotWheel.getKeyNotationOpen(key.key);
					key.stdKey = camelotWheel.getKeyNotationFlat(key.key);
					key.listens = key.y;
					delete key.x;
					delete key.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// Stats
				this.computeKeyStats(data);
				return data;
			});
	},
	/**
	 * Retrieves Moods stats in a promise that resolves to an array of key data.
	 *
	 * @name getMoodsData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{mood:string, listens:number}[]>}
	*/
	getMoodsData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount', optionArg: { timePeriod, timeKey, fromDate },
			x: this.tags.mood,
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x:string, y:number}[]] */ data) => {
				data = data[0].filter((key) => key.x);
				if (this.isServicesListens()) {
					data = data.filter((mood) => mood.y !== 0);
				}
				// Process
				data.forEach((mood) => {
					mood.mood = mood.x;
					mood.listens = mood.y;
					delete mood.x;
					delete mood.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// Stats
				this.computeMoodsStats(data);
				return data;
			});
	},
	/**
	 * Retrieves Albums stats in a promise that resolves to an array of albums data.
	 *
	 * @name getAlbumsData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{title:string, artist:string, artists:string[], listens:number}[]>}
	*/
	getAlbumsData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount', optionArg: { timePeriod, timeKey, fromDate },
			x: 'ALBUM',
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true, bIncludeHandles: true,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x:string, y:number}[]] */ data) => {
				data = data[0];
				if (this.isServicesListens()) {
					data = data.filter((album) => album.y !== 0);
				}
				// Process
				data.forEach((album) => {
					album.artists = [...new Set(
						fb.TitleFormat(_bt(this.tags.artist))
							.EvalWithMetadbs(new FbMetadbHandleList(album.handle))
							.map((artist) => artist.split(/, ?/))
							.flat(Infinity)
					)];
					album.artist = album.artists[0];
					album.title = album.x;
					album.listens = album.y;
					album.rating = round(
						fb.TitleFormat(_bt(globTags.rating))
							.EvalWithMetadbs(new FbMetadbHandleList(album.handle))
							.average(),
						1
					);
					album.lovedAvg = round(
						fb.TitleFormat(globTags.isLoved)
							.EvalWithMetadbs(new FbMetadbHandleList(album.handle))
							.average(),
						2
					);
					album.lovedAny = album.lovedAvg > 0;
					album.loved = album.lovedAvg >= 0.2;
					delete album.x;
					delete album.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// Stats
				this.computeAlbumsStats(data);
				return data;
			});
	},
	/**
	 * Retrieves Countries stats in a promise that resolves to an array of regions data.
	 *
	 * @name getCountriesData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{name:string, listens:number}[]>}
	*/
	getCountriesData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount worldmap', optionArg: { timePeriod, timeKey, fromDate },
			x: this.tags.artist,
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true, bIncludeHandles: false,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x:string, y:number}[]] */ data) => {
				data = data[0];
				if (this.isServicesListens()) {
					data = data.filter((country) => country.y !== 0);
				}
				// Process
				data.forEach((country) => {
					country.name = country.x;
					country.listens = country.y;
					delete country.x;
					delete country.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// Stats
				this.computeCountriesStats(data);
				// Playlists
				if (this.settings.bSuggestions) {
					this.computeTopCountriesPlaylist(data);
				}
				return data;
			});
	},
	/**
	 * Retrieves Cities stats in a promise that resolves to an array of cities data.
	 *
	 * @name getCitiesData
	 * @kind method
	 * @memberof wrapped
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Filter the library
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {promise.<{city:string, listens:number, artists:{artist:string, listens:number}[]}[]>}
	*/
	getCitiesData: function (timePeriod, query, timeKey, fromDate) {
		const queryParam = this.getDataQueryParam(timePeriod, timeKey);
		return getDataAsync({
			option: 'playcount worldmap city', optionArg: { timePeriod, timeKey, fromDate },
			x: this.tags.artist,
			query: this.getDataQuery(queryParam, query),
			sourceType: 'library',
			bRemoveDuplicates: true, bIncludeHandles: false,
			listenBrainz: {
				user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
				bOffline: true
			},
			filePaths: this.settings.filePaths
		})
			.then((/** @type [{x:string, y:number}[]] */ data) => {
				data = data[0];
				if (this.isServicesListens()) {
					data = data.filter((city) => city.y !== 0);
				}
				// Process
				data.forEach((city) => {
					city.name = city.x;
					city.listens = city.y;
					delete city.x;
					delete city.y;
				});
				data.sort((a, b) => b.listens - a.listens);
				// Stats
				this.computeCitiesStats(data);
				return data;
			});
	},
	/**
	 * Retrieves the genre group(s) for a given genre .
	 *
	 * @property
	 * @name getGenreGroups
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {string} genre
	 * @returns {string[]}
	*/
	getGenreGroups: function (genre) {
		const descr = music_graph_descriptors;
		const genreInfo = descr.nodeList.get(descr.getSubstitution(genre));
		return genreInfo ? genreInfo.cluster : [];
	},
	/**
	 * Calculate statistics for  artists, using data from {@link wrapped.getArtistsData}.
	 *
	 * @property
	 * @name computeArtistsStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{genre:string, listens:number}[]} artistsData
	 * @returns {{artists}}
	*/
	computeArtistsStats: function (artistsData) {
		this.stats.artists.total = artistsData.length;
		if (this.settings.bDebug) { console.log('computeArtistsStats:\n\t ', this.stats.artists); }
		return this.stats;
	},
	/**
	 * Calculate statistics for genres, using data from {@link wrapped.getGenresData}.
	 *
	 * @property
	 * @name computeGenresStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{genre:string, listens:number}[]} genresData
	 * @returns {{genres}}
	*/
	computeGenresStats: function (genresData) {
		this.stats.genres.total = genresData.length;
		const top = genresData.slice(0, this.settings.topSlice);
		const topGenres = top.map((genre) => genre.genre);
		const totalListensTop = top.reduce((acc, genre) => acc + genre.listens, 0);
		const graph = musicGraph();
		this.stats.genres.similar = new Set(
			getNearestGenreStyles(topGenres, music_graph_descriptors.cluster * 2, graph)
		).difference(
			new Set(music_graph_descriptors.replaceWithAlternativeTerms(topGenres, true, true))
		);
		// Filter similar genres with things already present on library
		genresData.filter((genre) =>
			(genre.listens / totalListensTop) > 0.05 || (genre.listens / top[0].listens) > 0.1
		).forEach((genre) => {
			music_graph_descriptors.replaceWithAlternativeTerms([genre.genre], true, true)
				.forEach((sub) => this.stats.genres.similar.delete(sub));
		});
		this.stats.genres.similar = [...this.stats.genres.similar];
		this.stats.genres.similarV2 = music_graph_descriptors.filterDuplicatedSubstitutions(this.stats.genres.similar)
			.shuffle();
		top.forEach((genre) => {
			this.stats.genres.byScore.push({
				...genre,
				score: round(genre.listens / totalListensTop * 100, 0)
			});
		});
		const genreGroups = new Map();
		let listensTotal = 0;
		genresData.forEach((genre) => {
			const groups = this.getGenreGroups(genre.genre);
			groups.forEach((group) => {
				const node = genreGroups.get(group) || { name: group, score: 0 };
				node.score += genre.listens;
				listensTotal += genre.listens;
				genreGroups.set(group, node);
			});
		});
		genreGroups.forEach((node) => {
			node.score = round(node.score / listensTotal * 100);
			this.stats.genres.groups.list.push(node);
		});
		if (this.settings.bDebug) { console.log('computeGenresStats:\n\t ', this.stats.genres); }
		return this.stats;
	},
	/**
	 * Calculate statistics for tracks, using data from {@link wrapped.getTracksData}.
	 *
	 * @property
	 * @name computeTracksStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{title:string, listens:number, handle:FbMetadbHandle[]}[]} tracksData
	 * @param {number} year
	 * @returns {{tracks}}
	*/
	computeTracksStats: function (tracksData) {
		this.stats.tracks.total = tracksData.length;
		if (this.settings.bDebug) { console.log('computeTracksStats:\n\t ', this.stats.tracks); }
		return this.stats;
	},
	/**
	 * Calculate statistics for tracks, using data from {@link wrapped.getAlbumsData}.
	 *
	 * @property
	 * @name computeAlbumsStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{title:string, listens:number}[]} albumsData
	 * @param {number} year
	 * @returns {{tracks}}
	*/
	computeAlbumsStats: function (albumsData) {
		this.stats.albums.total = albumsData.length;
		if (this.settings.bDebug) { console.log('computeAlbumsStats:\n\t ', this.stats.albums); }
		return this.stats;
	},
	/**
	 * Calculate statistics for countries, using data from {@link wrapped.getCountriesData}.
	 *
	 * @property
	 * @name computeCountriesStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{name:string, listens:number}[]} countriesData
	 * @param {number} year
	 * @returns {{countries}}
	*/
	computeCountriesStats: function (countriesData) {
		this.stats.countries.total = countriesData.length;
		countriesData.slice(0, this.settings.topSlice).forEach((country) => {
			this.stats.countries.byISO.push({ ...country, iso: getCountryISO(country.name) });
		});
		if (this.settings.bDebug) { console.log('computeCountriesStats:\n\t ', this.stats.countries); }
		return this.stats;
	},
	/**
	 * Calculate statistics for countries, using data from {@link wrapped.getCountriesData}.
	 *
	 * @property
	 * @name computeCitiesStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{name:string, listens:number}[]} citiesData
	 * @returns {{cities}}
	*/
	computeCitiesStats: function (citiesData) {
		this.stats.cities.total = citiesData.length;
		if (this.settings.bDebug) { console.log('computeCitiesStats:\n\t ', this.stats.cities); }
		return this.stats;
	},
	/**
	 * Calculate statistics for listens, using data from {@link wrapped.getTracksData}.
	 *
	 * @property
	 * @name computeListensStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{title:string, listens:number, skipCount:number, handle:FbMetadbHandle[], artist:string}[]} tracksData
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {{listens, time}}
	*/
	computeListensStats: async function (tracksData, timePeriod, timeKey, fromDate) {
		// Time
		Object.entries(timeOnPeriod(timePeriod, timeKey)).forEach(([key, val]) => this.stats.time.range[key] = val);
		this.stats.time.minutes = round(tracksData.reduce((prev, track) => prev + track.handle[0].Length * track.listens, 0) / 60, 0);
		this.stats.time.days = round(this.stats.time.minutes / 60 / 24, 1);
		this.stats.time.mean.minutesPerDay = this.stats.time.minutes / this.stats.time.range.days;
		this.stats.time.mean.minutesPerDay = this.stats.time.mean.minutesPerDay > 1
			? Math.round(this.stats.time.mean.minutesPerDay)
			: round(this.stats.time.mean.minutesPerDay, 1);
		if (timePeriod) {
			const tracks = tracksData.map((track) => track.handle.map((handle) => {
				return { handle, title: track.title, artist: track.artist };
			})).flat(Infinity);
			const listens = (await getPlayCountV2(
				new FbMetadbHandleList(tracks.map((track) => track.handle)),
				timePeriod, timeKey, fromDate, true,
				{
					user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
					bOffline: true
				}
			)).map((track) => track.listens);
			const days = new Map();
			const months = new Map(
				range(0, 11, 1).map((m) => [m, { month: m + 1, monthName: this.monthNames[m], listens: 0, time: 0, minutes: 0 }])
			);
			listens.forEach((listenArr, i) => {
				const listenCount = listenArr.length;
				this.stats.listens.total += listenCount;
				listenArr.forEach((listen) => {
					{ // Days
						const dateStr = listen.toDateString();
						const old = days.get(dateStr) || {
							date: listen,
							time: 0,
							track: { listens: 0, handle: null, title: '', artist: '' }
						};
						old.time += tracks[i].handle.Length;
						if (listenCount > old.track.listens) {
							old.track.listens = listenCount;
							old.track.handle = tracks[i].handle;
							old.track.title = tracks[i].title;
							old.track.artist = tracks[i].artist;
						}
						days.set(dateStr, old);
					}
					{ // Months
						const dateStr = listen.getMonth();
						const old = months.get(dateStr);
						old.time += tracks[i].handle.Length;
						old.listens++;
					}
				});
			});
			/** @type {{date:Date, time:number, track:{handle:FbMetadbHandle, title:string, artist:string}}} */
			const max = [...days.values()].reduce((acc, curr) => curr.time > acc.time ? curr : acc, { time: 0 });
			this.stats.time.most.date = max.date;
			this.stats.time.most.minutes = round(max.time / 60, 0);
			this.stats.time.most.track = max.track;
			this.stats.time.byMonth = [...months.values()];
			this.stats.time.byMonth.forEach((m) => m.minutes = round(m.time / 60, 0));
		} else {
			const tracks = tracksData.map((track) => {
				this.stats.listens.total += track.listens;
				return track.handle.map((handle) => {
					return { handle, title: track.title, artist: track.artist };
				});
			}).flat(Infinity);
			const handleList = new FbMetadbHandleList(tracks.map((track) => track.handle));
			// Tracks never played break the sorting with N/A
			const tfFirst = fb.TitleFormat(globTags.sortFirstPlayed);
			handleList.OrderByFormat(tfFirst, 1);
			const first = handleList[0];
			const tfLast = fb.TitleFormat(globTags.sortLastPlayed);
			handleList.OrderByFormat(tfLast, -1);
			const last = handleList[0];
			this.stats.time.first.date = new Date(tfFirst.EvalWithMetadb(first));
			this.stats.time.first.handle = first;
			this.stats.time.last.date = new Date(tfLast.EvalWithMetadb(last));
			this.stats.time.last.handle = last;
			['first', 'last'].some((k) => {
				if (this.stats.time[k].date.toString() === 'Invalid Date') {
					console.log('computeListensStats: ' + k + ' track played reports an invalid date.');
					console.log(this.stats.time[k].handle);
					return true;
				}
			});
		}
		this.stats.time.mean.listensPerDay = Math.round(this.stats.listens.total / this.stats.time.range.days);
		this.stats.time.mean.listensPerDay = this.stats.time.mean.listensPerDay > 1
			? Math.round(this.stats.time.mean.listensPerDay)
			: round(this.stats.time.mean.listensPerDay, 1);
		if (this.settings.bDebug) {
			console.log('computeListensStats:\n\t ', this.stats.listens);
			console.log('computeListensStats:\n\t ', this.stats.time);
		}
		return this.stats;
	},
	/**
	 * Calculate statistics for skips, using data from {@link wrapped.getTracksData}.
	 *
	 * @property
	 * @name computeSkipsStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{title:string, skipCount:number, handle:FbMetadbHandle[]}[]} tracksData
	 * @returns {{skips}}
	*/
	computeSkipsStats: function (tracksData) {
		this.stats.skips.total = tracksData.reduce((prev, track) => prev + track.skipCount, 0);
		if (this.settings.bDebug) { console.log('computeSkipsStats:\n\t ', this.stats.skips); }
		return this.stats;
	},
	/**
	 * Calculate statistics for skips, using data from {@link wrapped.getBpmsData}.
	 *
	 * @property
	 * @name computeBpmStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{bpm:number, listens:number}[]} bpmData
	 * @returns {{bpm}}
	*/
	computeBpmsStats: function (bpmData) {
		this.stats.bpms.min.val = Infinity;
		let sum = 0, sumQuad = 0, listens = 0, bpm = 0;
		const histogram = [];
		bpmData.forEach((p) => {
			bpm = p.bpm;
			// A portion of high BPM tracks are in fact tracks with half BPM
			if (this.settings.highBpmHalveFactor > 0 && bpm > this.stats.bpms.high.val) {
				if (Math.random() <= Math.min(this.settings.highBpmHalveFactor, 100) / 100) {
					bpm = Math.round(bpm / 2);
				}
			}
			['max', 'min'].forEach((key) => {
				if (this.stats.bpms[key].val === bpm) {
					this.stats.bpms[key].listens += p.listens;
				} else {
					this.stats.bpms[key].val = Math[key](this.stats.bpms[key].val, bpm);
					if (this.stats.bpms[key].val === bpm) { this.stats.bpms[key].listens = p.listens; }
				}
			});
			sum += bpm * p.listens;
			sumQuad += bpm ** 2 * p.listens;
			listens += p.listens;
			this.stats.bpms.high.listens += (bpm > this.stats.bpms.high.val ? p.listens : 0);
			this.stats.bpms.low.listens += (bpm < this.stats.bpms.low.val ? p.listens : 0);
			let i = p.listens;
			while (i--) { histogram.push(bpm); }
		});
		let binSize = 1;
		if (listens >= 1) {
			this.stats.bpms.mean.val = Math.round(sum / listens);
			this.stats.bpms.stdDev = Math.round(Math.sqrt((sumQuad - sum ** 2 / listens) / (listens - 1)));
			binSize = Math.round(this.stats.bpms.stdDev / 5) || 1;
			this.stats.bpms.mean.listens = bpmData.reduce((prev, p) => {
				return prev + (Math.abs(p.bpm - this.stats.bpms.mean.val) <= binSize ? p.listens : 0);
			}, 0);
		} else {
			this.stats.bpms.mean.val = sum;
			this.stats.bpms.mean.listens = listens;
		}
		const max = this.stats.bpms.max.val;
		const min = this.stats.bpms.min.val;
		this.stats.bpms.histogram = calcHistogram(histogram, binSize, max, min)
			.map((y, i) => { return { x: min + binSize * i, y }; });
		if (this.settings.bDebug) { console.log('computeBpmStats:\n\t ', this.stats.bpms); }
		return this.stats;
	},
	/**
	 * Calculate statistics for skips, using data from {@link wrapped.getKeyData}.
	 *
	 * @property
	 * @name computeKeyStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{key:{hour:number, letter:string}, openKey:string, stdKey:string, listens:number}[]} keyData
	 * @returns {{key}}
	*/
	computeKeyStats: function (keyData) {
		let sum = 0, sumQuad = 0, listens = 0;
		const histogram = [];
		keyData.forEach((p) => {
			const num = p.key.hour;
			const letter = p.key.letter;
			sum += num * p.listens;
			sumQuad += num ** 2 * p.listens;
			listens += p.listens;
			this.stats.keys.major.listens += (letter === 'd' ? p.listens : 0);
			this.stats.keys.minor.listens += (letter === 'm' ? p.listens : 0);
			let i = p.listens;
			while (i--) { histogram.push(p.key.hour); }
		});
		if (listens >= 1) {
			this.stats.keys.mean.tone.val = Math.round(sum / listens);
			this.stats.keys.mean.key.val = {
				hour: this.stats.keys.mean.tone.val,
				letter: this.stats.keys.major.listens > this.stats.keys.minor.listens ? 'd' : 'm'
			};
			this.stats.keys.stdDev = Math.round(Math.sqrt((sumQuad - sum ** 2 / listens) / (listens - 1)));
			const binSize = Math.round(this.stats.keys.stdDev / 10);
			this.stats.keys.mean.tone.listens = keyData.reduce((prev, p) => {
				return prev + (Math.abs(p.key.hour - this.stats.keys.mean.tone.val) <= binSize ? p.listens : 0);
			}, 0);
			this.stats.keys.mean.key.listens = keyData.reduce((prev, p) => {
				return prev + (Math.abs(p.key.hour - this.stats.keys.mean.tone.val) <= binSize && p.key.letter === this.stats.keys.mean.key.val.letter ? p.listens : 0);
			}, 0);
		} else {
			this.stats.keys.mean.tone.val = sum;
			this.stats.keys.mean.tone.listens = this.stats.keys.mean.key.listens = listens;
			this.stats.keys.mean.key.val = {
				hour: sum,
				letter: this.stats.keys.major.listens > this.stats.keys.minor.listens ? 'd' : 'm'
			};
		}
		this.stats.keys.histogram = calcHistogram(histogram, 1, 12, 1)
			.map((y, i) => { return { x: 1 + i, y }; });
		if (this.settings.bDebug) { console.log('computeKeyStats:\n\t ', this.stats.keys); }
		return this.stats;
	},
	/**
	 * Calculate statistics for moods, using data from {@link wrapped.getMoodsData}.
	 *
	 * @property
	 * @name computeMoodsStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{mood:string, listens:number}[]} moodData
	 * @returns {{key}}
	*/
	computeMoodsStats: function (moodData) {
		const calmMoods = new Set(['Acoustic', 'Relaxed', 'Chill', 'Smooth', 'Calm', 'Sweet', 'Slow', 'Cold', 'Healing', 'Laidback', 'Meditation', 'Peaceful', 'Relaxed', 'Reflective', 'Slow', 'Smooth', 'Soft']);
		const sadMoods = new Set(['Sad', 'Mellow', 'Melancholy', 'Soulful', 'Spiritual', 'Dark', 'Depressive', 'Emotional', 'Lonely', 'Nostalgic', 'Morose', 'Suicidal', 'Yearning']);
		const happyMoods = new Set(['Happy', 'Cool', 'Funky', 'Groovy', 'Fun', 'Feel Good', 'Hot', 'Humorous', 'Positive', 'Sweet', 'Trippy', 'Flirty', 'Playful']);
		const energeticMoods = new Set(['Aggressive', 'Party', 'Uplifting', 'Angry', 'Crazy', 'Energetic', 'Fast', 'Heavy', 'High', 'Upbeat', 'Wild', 'Bouncy', 'Upbeat']);
		// Every track may have multiple moods of same type, so total is not = total listens
		moodData.forEach((p) => {
			this.stats.moods.total += p.listens;
			if (calmMoods.has(p.mood)) { this.stats.moods.calm.listens += p.listens; }
			if (sadMoods.has(p.mood)) { this.stats.moods.sad.listens += p.listens; }
			if (happyMoods.has(p.mood)) { this.stats.moods.happy.listens += p.listens; }
			if (energeticMoods.has(p.mood)) { this.stats.moods.energetic.listens += p.listens; }
		});
		if (this.settings.bDebug) { console.log('computeMoodStats:\n\t ', this.stats.moods); }
		return this.stats;
	},
	/**
	 * Calculate statistics for user listening habits.
	 *
	 * @property
	 * @name computeCharacterStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ genres: {genre:string, listens:number}[]; tracks: {title:string, listens:number, handle:FbMetadbHandle[]}[]; artists: {artist:string, listens:number}[]; bpms: {bpm:number, listens:number}[]; keys: {key:{hour:number, letter:string}, openKey:string, stdKey: string, listens:number}[]; moods: {mood:string, listens:number}[]; cities: {city:string, listens:number, artists:{artist:string, listens:number}[]}[]; countries: {name:string, listens:number}[]; albums: {album:string, listens:number}[] }} wrappedData
	 * @returns {{character}}
	*/
	computeCharacterStats: function (wrappedData) {
		const findChar = (name) => this.stats.character.list.find((char) => char.name.toLowerCase() === name) || {};
		if (this.stats.artists.total > 0) {
			// Fanatic: top artist listens > total listens / 3
			if (this.stats.listens.total > 0) {
				const topArtistWeight = wrappedData.artists[0].listens / wrappedData.artists.slice(0, this.settings.topSlice).reduce((acc, artist) => acc + artist.listens, 0);
				const topArtistListenWeight = wrappedData.artists[0].listens / this.stats.listens.total;
				if (topArtistListenWeight > 1 / 5 || topArtistWeight > 1 / 5) {
					findChar('fanatic').score = (Math.min(topArtistListenWeight / (2 / 3) * 100, 100) + Math.min(topArtistWeight / (2 / 3), 100)) / 2;
				}
			}
			// Shapeshifter: listen too many different artists
			if (this.stats.artists.total > 350) {
				const meanListens = this.stats.listens.total / this.stats.artists.total;
				findChar('shapeshifter').score = wrappedData.artists
					.reduce((acc, artist) => (acc + (artist.listens >= meanListens ? 1 : 0)), 0) / this.stats.artists.total * 100;
			}
		}
		if (this.stats.genres.total > 0) {
			// Cyclops: focus on one genre
			if (this.stats.listens.total > 0) {
				const topGenreWeight = wrappedData.genres[0].listens / this.stats.listens.total;
				if (topGenreWeight > 1 / 3) {
					findChar('cyclops').score = Math.min(topGenreWeight / (2 / 3) * 100, 100);
				}
			}
			// Mastermind: listen too many different genres
			const graphNodes = 848; // Hardcoded value from music_graph #nodes
			if (this.stats.genres.total > graphNodes / 10) {
				const coeff = this.stats.genres.total * (1 + Math.log(graphNodes / this.stats.genres.total));
				const meanListens = wrappedData.genres.reduce((acc, genre) => acc + genre.listens, 0) / this.stats.genres.total;
				findChar('mastermind').score = Math.max(
					wrappedData.genres
						.reduce((acc, genre) => acc + genre.listens / meanListens - 0.35, 0) / coeff * 100,
					0
				);
			}
		}
		if (this.stats.listens.total > 0) {
			// Luminary: many listens for light/upbeat tracks -> major key (30%) + mood (30%) + high BPM (40%)
			let char = findChar('luminary');
			const hBpmWeight = (
				Math.max(this.stats.bpms.high.listens, 0) / this.stats.listens.total +
				Math.min(Math.max(
					((this.stats.bpms.mean.val + this.stats.bpms.stdDev) - this.stats.bpms.min.val)
					, 0
				) / this.stats.bpms.high.val, 1) * this.stats.bpms.mean.listens / this.stats.listens.total
			) / 2;
			if (this.stats.bpms.high.listens > this.stats.bpms.low.listens && this.stats.bpms.mean.val > 110 && hBpmWeight > 0.10) {
				char.score += Math.min(hBpmWeight / 1.5 * 100, 40);
			}
			const majKeyWeight = (this.stats.keys.major.listens - this.stats.keys.minor.listens / 2) / this.stats.listens.total;
			if (majKeyWeight > 0.10) {
				char.score += Math.min(majKeyWeight / 1.5 * 100, 30);
			}
			const upbeatWeight = (this.stats.moods.energetic.listens + this.stats.moods.happy.listens) / 2 / this.stats.moods.total;
			if (upbeatWeight > 0.10) {
				char.score += Math.min(upbeatWeight / 1.5 * 100, 30);
			}
			// Vampire: many listens for atmospheric/emotional tracks -> minor key (30%) + mood (30%) + low bpm (40%)
			char = findChar('vampire');
			const lBpmWeight = this.stats.bpms.low.listens / this.stats.listens.total;
			if (this.stats.bpms.low.listens > this.stats.bpms.high.listens && this.stats.bpms.mean.val < 110 && lBpmWeight > 0.10) {
				char.score += Math.min(lBpmWeight / 1.5 * 100, 40);
			}
			const minKeyWeight = (this.stats.keys.minor.listens - this.stats.keys.major.listens / 2) / this.stats.listens.total;
			if (minKeyWeight > 0.10) {
				char.score += Math.min(minKeyWeight / 1.5 * 100, 30);
			}
			const emotionWeight = (this.stats.moods.calm.listens + this.stats.moods.sad.listens) / 2 / this.stats.moods.total;
			if (emotionWeight > 0.10) {
				char.score += Math.min(emotionWeight / 1.5 * 100, 30);
			}
			// Joker: similar listens for light/upbeat and atmospheric/emotional tracks -> equal key (30%) + mood (30%) + bpm (40%)
			if (findChar('vampire').score >= 25 && findChar('luminary') >= 25) {
				char = findChar('joker');
				const eBpmWeight = (1 - Math.abs(lBpmWeight - hBpmWeight)) * Math.min(lBpmWeight / 0.35, 1) * Math.min(hBpmWeight / 0.35, 1);
				if (lBpmWeight >= 0.05 && hBpmWeight >= 0.05 && eBpmWeight > 0.3) {
					char.score += Math.min(eBpmWeight / 1.5 * 100, 40);
				}
				const eKeyWeight = (1 - Math.abs(majKeyWeight - minKeyWeight)) * Math.min(majKeyWeight / 0.35, 1) * Math.min(minKeyWeight / 0.35, 1);
				if (majKeyWeight >= 0.05 && minKeyWeight >= 0.05 && eKeyWeight > 0.3) {
					char.score += Math.min(eKeyWeight / 1.5 * 100, 30);
				}
				const moodWeight = (1 - Math.abs(emotionWeight - upbeatWeight) * Math.min(emotionWeight / 0.35, 1)) * Math.min(upbeatWeight / 0.35, 1);;
				if (emotionWeight >= 0.05 && upbeatWeight >= 0.05 && moodWeight > 0.3) {
					char.score += Math.min(moodWeight / 1.5 * 100, 30);
				}
			}
			// Time traveler: listen to favorite tracks many times
			const top5Listens = wrappedData.tracks.slice(0, this.settings.topSlice).reduce((prev, track) => prev + track.listens, 0);
			const top20Listens = top5Listens + wrappedData.tracks.slice(this.settings.topSlice, this.settings.topSlice * 4).reduce((prev, track) => prev + track.listens, 0);
			const favWeight = (top5Listens / this.stats.listens.total + top5Listens / top20Listens) / 2;
			if (favWeight > 1 / 10) {
				findChar('time traveler').score = Math.min(favWeight * 100, 100);
			}
			// Hunter: many skips
			const skipWeight = this.stats.skips.total / this.stats.listens.total;
			if (this.stats.skips.total > 50 && skipWeight > 0.25) {
				findChar('hunter').score = Math.min(skipWeight / (1 / 2) * 100, 100);
			}
		}
		if (this.stats.tracks.total) {
			// Hypnotist: listen to entire albums without skip (low proportion of albums per track)
			const albumWeight = this.stats.albums.total / this.stats.tracks.total;
			if (albumWeight < 1 / 5) {
				findChar('hypnotist').score = Math.min((1 / 5 - albumWeight) / (1 / 5) * 100, 100);
			}
			// Roboticist: smart shuffle (every artist should have a similar proportion)
			const diffArtistsWeight = this.stats.artists.total / this.stats.tracks.total;
			if (this.stats.artists.total > 500 && diffArtistsWeight > 0.1) {
				const meanListens = this.stats.listens.total / this.stats.artists.total;
				findChar('roboticist').score = wrappedData.artists
					.reduce((acc, artist) => acc + (artist.listens > meanListens ? 1 : 0), 0) / this.stats.artists.total * 50 +
					Math.min(diffArtistsWeight / (1 / 5) * 25, 50);
			}
		}
		if (plman.PlaylistCount > 10) {
			// Alchemist: have many playlists
			const plsWeight = plman.PlaylistCount / 100;
			if (plsWeight >= 0.25) {
				findChar('Alchemist').score = Math.min(plsWeight * 100, 100);
			}
			// Collector: listen to own playlists, checking for the top tracks listened present on them
			if (plsWeight >= 0.10) {
				const plsItems = range(0, plman.PlaylistCount - 1).map((i) => {
					const handleList = plman.GetPlaylistItems(i);
					handleList.Sort();
					return handleList;
				});
				let plsListenWeight = 0;
				let totalListens = 0;
				wrappedData.tracks.slice(this.settings.topSlice, 100)
					.forEach(({ listens, handle }) => {
						for (let i = 0; i < plman.PlaylistCount; i++) {
							const score = listens / plsItems[i].Count;
							if (handle.some((h) => plsItems[i].BSearch(h))) { plsListenWeight += score; };
							totalListens += score / plman.PlaylistCount;
						}
					});
				plsListenWeight = plsListenWeight / totalListens;
				findChar('Alchemist').score = Math.min(plsListenWeight * 100, 100);
			}
		}
		this.stats.character.list.forEach((character) => character.score = round(character.score, 2));
		if (this.settings.bDebug) { console.log('computeCharacterStats:\n\t ', this.stats.character.scores); }
		return this.stats;
	},
	/**
	 * Calculate statistics which require multiple data types
	 *
	 * @property
	 * @name computeGlobalStats
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ genres: {genre:string, listens:number}[]; tracks: {title:string, listens:number, handle:FbMetadbHandle[], artist:string}[]; artists: {artist:string, listens:number}[]; }} wrappedData
	 * @param {number} year
	 * @returns {{character}}
	*/
	computeGlobalStats: async function (wrappedData, timePeriod, timeKey, fromDate) {
		// Top artists
		if (wrappedData.artists.length && wrappedData.tracks.length) {
			// Top 5 artists
			wrappedData.artists.slice(0, this.settings.topSlice).forEach((data) => {
				const topArtist = {
					artist: '',
					tracks: 0,
					topTrack: { title: '', listens: 0, artist: '', handle: null, albumImg: null }
				};
				topArtist.artist = data.artist;
				topArtist.tracks = wrappedData.tracks.reduce((acc, track) => acc + (track.artist === topArtist.artist ? 1 : 0), 0);
				const topTrack = wrappedData.tracks.find((track) => track.artist === topArtist.artist);
				if (topTrack) { data.topTrack = topArtist.topTrack = topTrack; }
				this.stats.artists.top.push(topArtist);
			});
			// Top artists
			if (this.settings.bDebug) { console.log('computeGlobalStats:\n\t ', this.stats.artists.top[0]); }
			// By Month
			if (timePeriod) {
				for (const data of this.stats.artists.top) {
					const listens = (await getPlayCountV2(
						new FbMetadbHandleList(
							wrappedData.tracks.filter((track) => track.artist === data.artist)
								.map((track) => track.handle[0])
						), timePeriod, timeKey, fromDate, void (0),
						{
							user: this.isServicesListens() ? this.settings.tokens.listenBrainzUser : '',
							bOffline: true
						}
					)).map((track) => track.listens);
					const months = new Map();
					listens.forEach((listenArr) => {
						listenArr.forEach((listen) => {
							const dateStr = listen.getMonth();
							months.set(dateStr, (months.get(dateStr) || 0));
						});
					});
					const max = [...months.entries()].sort((a, b) => b[1] - a[1])[0];
					this.stats.artists.byMonth.push({
						artist: data.artist,
						month: max[0],
						listens: max[1],
						monthName: this.monthNames[max[0]]
					});
				}
				if (this.settings.bDebug) { console.log('computeGlobalStats:\n\t ', this.stats.artists.byMonth); }
			}
		}
		// Top artist by Country
		if (wrappedData.countries.length && wrappedData.artists.length) {
			const worldMapData = _jsonParseFileCheck(this.settings.filePaths.worldMapArtists, 'Tags json', window.Name, utf8);
			if (worldMapData) {
				this.stats.countries.byISO.forEach((country) => {
					const filter = getZoneArtistFilter(country.iso, 'country', worldMapData);
					const topArtist = wrappedData.artists.find((artist) => filter.artists.includes(artist.artist));
					if (topArtist) {
						topArtist.tracks = wrappedData.tracks.reduce((acc, track) => acc + (track.artist === topArtist.artist ? 1 : 0), 0);
						const topTrack = wrappedData.tracks.find((track) => track.artist === topArtist.artist);
						if (topTrack) { topArtist.topTrack = topTrack; }
						// Overwrites country's listens with artist's listens
						this.stats.countries.byArtist.push({ ...country, ...topArtist });
					}
				});
			}
			if (this.settings.bDebug) { console.log('computeGlobalStats:\n\t ', this.stats.countries.byArtist); }
		}
		// Top albums
		if (wrappedData.artists.length && wrappedData.tracks.length && wrappedData.albums.length) {
			// Top 5 artists
			wrappedData.albums.slice(0, this.settings.topSlice).forEach((data) => {
				const topAlbum = {
					artist: '',
					album: '',
					topTrack: { title: '', listens: 0, artist: '', album: '', handle: null, albumImg: null }
				};
				topAlbum.artist = data.artist;
				topAlbum.album = data.title;
				const topTrack = wrappedData.tracks.find((track) => track.album === topAlbum.album && track.artists[0] === topAlbum.artist);
				if (topTrack) { data.topTrack = topAlbum.topTrack = topTrack; }
				this.stats.albums.top.push(topAlbum);

			});
			if (this.settings.bDebug) { console.log('computeGlobalStats:\n\t ', this.stats.artists.top[0]); }
		}
		return this.stats;
	},
	/**
	 * Playlist of favorite tracks, using data from {@link wrapped.getTracksData}.
	 *
	 * @property
	 * @name computeTopTracksPlaylist
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{title:string, listens:number, handle:FbMetadbHandle[]}[]} tracksData
	 * @param {number} size
	 * @returns {FbMetadbHandleList}
	*/
	computeTopTracksPlaylist: function (tracksData, size = 100) {
		console.log('Wrapped: creating top songs playlist...');
		let handleList = new FbMetadbHandleList(tracksData.slice(0, size).map((track) => track.handle[0]));
		({ handleList } = shuffleByTags({ selItems: handleList, bSendToActivePls: false, bAdvancedShuffle: true, sortBias: 'rating', bMultiple: true }) || { handleList: new FbMetadbHandleList() });
		this.playlists.top = handleList;
		return this.playlists.top;
	},
	/**
	 * Playlist of discovered tracks, using data from {@link wrapped.getTracksData}.
	 *
	 * @property
	 * @name computeDiscoverPlaylist
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{title:string, listens:number, handle:FbMetadbHandle[]}[]} tracksData
	 * @param {number} year
	 * @param {number} size
	 * @returns {FbMetadbHandleList}
	*/
	computeDiscoverPlaylist: function (tracksData, timePeriod, size = 100) {
		if (timePeriod) {
			console.log('Wrapped: creating discovered songs playlist...');
			let handleList = new FbMetadbHandleList(tracksData.map((track) => track.handle[0]));
			const query = '%ADDED% ' + timePeriod.replace('SINCE', 'DURING');
			if (this.settings.bDebugQuery) { console.log('computeDiscoverPlaylist:\n\t ' + query); }
			handleList = fb.GetQueryItemsCheck(handleList, query);
			if (handleList) {
				handleList = new FbMetadbHandleList(handleList.Convert().slice(0, size).shuffle());
				({ handleList } = shuffleByTags({ selItems: handleList, bSendToActivePls: false, bAdvancedShuffle: true, sortBias: 'rating', bMultiple: true }) || { handleList: new FbMetadbHandleList() });
				this.playlists.discover = handleList;
			}
		}
		return this.playlists.discover;
	},
	/**
	 * Playlist of top artists, using data from {@link wrapped.getArtistsData}.
	 *
	 * @property
	 * @name computeTopArtistsPlaylist
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{artist:string, listens:number}[]} artistsData
	 * @param {number} size
	 * @returns {FbMetadbHandleList}
	*/
	computeTopArtistsPlaylist: function (artistsData, size = 100) {
		const artists = artistsData.slice(0, 100).map((artist) => artist.artist).filter(Boolean);
		if (artists.length) {
			console.log('Wrapped: creating top artists playlist...');
			const query = queryJoin([
				globTags.rating + ' MISSING OR ' + globTags.rating + ' GREATER 2',
				queryCombinations(artists, _t(this.tags.artist), 'OR')
			], 'AND');
			if (this.settings.bDebugQuery) { console.log('computeTopArtistsPlaylist:\n\t ' + query); }
			/** @type {FbMetadbHandleList} */
			let handleList = fb.GetQueryItemsCheck(fb.GetLibraryItems(), query);
			if (handleList) {
				handleList = new FbMetadbHandleList(handleList.Convert().shuffle().slice(0, size));
				({ handleList } = shuffleByTags({ selItems: handleList, bSendToActivePls: false, bAdvancedShuffle: true, sortBias: 'rating', bMultiple: true }) || { handleList: new FbMetadbHandleList() });
				this.playlists.topArtists = handleList;
			}
		}
		return this.playlists.topArtists;
	},
	/**
	 * Playlist of top genres, using data from {@link wrapped.getGenresData}.
	 *
	 * @property
	 * @name computeTopGenresPlaylist
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{genre:string, listens:number}[]} genresData
	 * @param {number} size
	 * @returns {FbMetadbHandleList}
	*/
	computeTopGenresPlaylist: function (genresData, size = 100) {
		const genres = genresData.slice(0, this.settings.topSlice).map((genre) => genre.genre).filter(Boolean);
		if (genres.length) {
			console.log('Wrapped: creating top genres playlist...');
			const query = queryJoin([
				globTags.rating + ' MISSING OR ' + globTags.rating + ' GREATER 2',
				queryJoin(queryCombinations(genres, [globTags.genre, globTags.style], 'OR'), 'OR')
			], 'AND');
			if (this.settings.bDebugQuery) { console.log('computeTopGenresPlaylist:\n\t ' + query); }
			/** @type {FbMetadbHandleList} */
			let handleList = fb.GetQueryItemsCheck(fb.GetLibraryItems(), query);
			if (handleList) {
				handleList = new FbMetadbHandleList(handleList.Convert().shuffle().slice(0, size));
				({ handleList } = shuffleByTags({ selItems: handleList, bSendToActivePls: false, bAdvancedShuffle: true, sortBias: 'rating', bMultiple: true }) || { handleList: new FbMetadbHandleList() });
				this.playlists.topGenres = handleList;
			}
		}
		return this.playlists.topGenres;
	},
	/**
	 * Playlist of top genres, using data from {@link wrapped.getCountriesData}.
	 *
	 * @property
	 * @name computeTopCountriesPlaylist
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{name:string, listens:number}[]} countriesData
	 * @param {number} size
	 * @returns {FbMetadbHandleList}
	*/
	computeTopCountriesPlaylist: function (countriesData, size = 100) {
		const ISO = this.stats.countries.byISO.map((country) => country.iso).filter(Boolean);
		if (ISO.length) {
			console.log('Wrapped: creating top countries playlist...');
			const worldMapData = _jsonParseFileCheck(this.settings.filePaths.worldMapArtists, 'Tags json', window.Name, utf8);
			if (worldMapData) {
				const filters = ISO.map((iso) => getZoneArtistFilter(iso, 'country', worldMapData)).filter(Boolean)
					.map((filter) => queryJoin([globTags.rating + ' MISSING OR ' + globTags.rating + ' GREATER 2', filter.query], 'AND'));
				const count = filters.length;
				if (count) {
					/** @type {FbMetadbHandleList} */
					let handleList = new FbMetadbHandleList();
					filters.forEach((query) => {
						let handleListCountry = fb.GetQueryItemsCheck(fb.GetLibraryItems(), query);
						if (this.settings.bDebugQuery) { console.log('computeTopCountriesPlaylist:\n\t ' + _p(handleListCountry.Count) + ' <- ' + query); }
						if (handleListCountry) {
							handleListCountry = new FbMetadbHandleList(handleListCountry.Convert().shuffle().slice(0, size / count));
							handleList.AddRange(handleListCountry);
						}
					});
					if (handleList.Count) {
						({ handleList } = shuffleByTags({ selItems: handleList, bSendToActivePls: false, bAdvancedShuffle: true, sortBias: 'rating', bMultiple: true }) || { handleList: new FbMetadbHandleList() });
						this.playlists.topCountries = handleList;
					}
				}
			}
		}
		return this.playlists.topCountries;
	},
	/**
	 * Playlist of similar genres to top genres, using data from {@link wrapped.stats.genres.similar}.
	 *
	 * @property
	 * @name computeSuggestedGenresPlaylist
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {string[]} genres
	 * @param {string} queryParam - SINCE <YEAR>|DURING LAST X <TIME-UNIT>
	 * @param {number} size
	 * @returns {(FbMetadbHandle|String)[]}
	*/
	computeSuggestedGenresPlaylist: function (genres, queryParam, size = 100) {
		console.log('Wrapped: creating similar genres playlist...');
		const mbids = [];
		const mbidsAlt = [];
		const tags = { TITLE: [], ARTIST: [] };
		const lb = ListenBrainz;
		if (this.settings.bOffline) {
			this.playlists.suggestions.genres = Promise.resolve((() => {
				const query = queryJoin([
					queryJoin(queryCombinations(genres, this.tags.genre.split(', '), 'OR'), 'OR'),
					this.getDataQuery(queryParam)
				], 'AND NOT');
				/** @type FbMetadbHandleList */
				let handleList = fb.GetQueryItemsCheck(fb.GetLibraryItems(), query);
				if (this.settings.bDebugQuery) { console.log('computeSuggestedGenresPlaylist:\n\t ' + _p(handleList.Count) + ' <- ' + query); }
				if (handleList && handleList.Count) {
					handleList = removeDuplicates({ handleList, checkKeys: globTags.remDupl, sortBias: globQuery.remDuplBias, bPreserveSort: false });
					({ handleList } = shuffleByTags({ selItems: handleList, bSendToActivePls: false, bAdvancedShuffle: true, sortBias: 'rating', bMultiple: true }) || { handleList: new FbMetadbHandleList() });
					return handleList.Convert().slice(0, size);
				}
				return [];
			})());
		} else {
			const workName = 'Computing suggested Genres playlists';
			this.isWorking.push({ name: workName });
			this.playlists.suggestions.genres = lb.getRecordingsByTag(genres, this.settings.tokens.listenBrainz, size, 'or')
				.then((recommendations) => {
					recommendations.forEach((recording) => {
						mbids.push(recording.recording_mbid || '');
						mbidsAlt.push(['']);
						tags.TITLE.push('');
						tags.ARTIST.push('');
					});
					const count = mbids.length;
					// Retrieve title info
					return lb.lookupRecordingInfoByMBIDs(mbids.filter(Boolean), ['artist_credit_name', 'recording_mbid', 'recording_name', '[artist_credit_mbids]'], this.settings.tokens.listenBrainz)
						.then((info) => {
							if (['artist_credit_name', 'recording_mbid', 'recording_name', '[artist_credit_mbids]'].every((tag) => Object.hasOwn(info, tag))) {
								for (let i = 0; i < count; i++) {
									if (mbids[i] === info.recording_mbid[i]) {
										if (info.recording_name[i]) { tags.TITLE[i] = info.recording_name[i]; }
										if (info.artist_credit_name[i]) { tags.ARTIST[i] = info.artist_credit_name[i]; }
										if (info['[artist_credit_mbids]'][i]) { mbidsAlt[i] = info['[artist_credit_mbids]'][i]; }
									}
								}
							}
						});
				}).then(() => {
					let libItems;
					if (globQuery.filter.length) {
						try { libItems = fb.GetQueryItems(fb.GetLibraryItems(), globQuery.filter); } // Sanity check
						catch (e) { libItems = fb.GetLibraryItems(); } // eslint-disable-line no-unused-vars
					} else { libItems = fb.GetLibraryItems(); }
					const notFound = [];
					let items = [];
					const queryArr = mbids.map((mbid, i) => {
						const tagArr = ['TITLE', 'ARTIST']
							.map((key) => { return { key, val: sanitizeQueryVal(_asciify(tags[key][i]).replace(/"/g, '')).toLowerCase() }; });
						const bMeta = tagArr.every((tag) => { return tag.val.length > 0; });
						const query = queryJoin(
							[
								bMeta ? tagArr.map((tag) => { return tag.key + ' IS ' + tag.val; }).join(' AND ') + ' AND ' + globQuery.noLiveNone : '',
								'MUSICBRAINZ_TRACKID IS ' + mbid
							].filter(Boolean)
							, 'OR');
						return query;
					}).filter(Boolean);
					items = queryArr.map((query, i) => {
						let itemHandleList;
						try { itemHandleList = fb.GetQueryItems(libItems, query); } // Sanity check
						catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
						// Filter
						if (itemHandleList.Count) {
							itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
							itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: true });
							return itemHandleList[0];
						}
						notFound.push({ creator: tags.ARTIST[i], title: tags.TITLE[i], tags: { MUSICBRAINZ_TRACKID: mbids[i], MUSICBRAINZ_ALBUMARTISTID: mbidsAlt[i][0], MUSICBRAINZ_ARTISTID: mbidsAlt[i] } });
						return null;
					});
					return { notFound, items };
				}).then(({ notFound, items }) => {
					if (notFound.length) {
						const search = notFound.filter((t) => t.title.length && t.creator.length);
						// Send request in parallel every x ms and process when all are done
						return Promise.parallel(search, youTube.searchForYoutubeTrack, 5).then((results) => {
							let j = 0;
							const itemsLen = items.length;
							results.forEach((result) => {
								for (void (0); j <= itemsLen; j++) {
									if (result.status !== 'fulfilled') { // Only code errors are output
										console.log('YouTube:', result.status, result.reason.message);
										break;
									}
									const link = result.value;
									if (!link || !link.length) { break; }
									if (!items[j]) {
										items[j] = link.url;
										break;
									}
								}
							});
							return items;
						});
					} else {
						return items;
					}
				}).then((items) => {
					items.shuffle();
					this.isWorking.splice(this.isWorking.findIndex((obj) => obj.name === workName), 1);
					return items.slice(0, size);
				}).catch(() => {
					this.isWorking.splice(this.isWorking.findIndex((obj) => obj.name === workName), 1);
					return [];
				});
		}
		return this.playlists.suggestions.genres;
	},
	/**
		 * Playlist of similar artists to top Artists, using data from {@link wrapped.getArtistsData}.
		 *
		 * @property
		 * @name computeSuggestedArtistsPlaylist
		 * @kind method
		 * @memberof wrapped
		 * @type {function}
		 * @param {{artist:string, listens:number}[]} artistsData
		 * @param {string} queryParam - SINCE <YEAR>|DURING LAST X <TIME-UNIT>
		 * @param {number} size
		 * @returns {(FbMetadbHandle|String)[]}
		*/
	computeSuggestedArtistsPlaylist: function (artistsData, queryParam, size = 100) {
		console.log('Wrapped: creating similar artists playlist...');
		const artists = artistsData.slice(0, this.settings.topSlice).map((artist) => artist.artist);
		const lb = ListenBrainz;
		if (this.settings.bOffline) {
			this.playlists.suggestions.artists = Promise.resolve((() => {
				const query = queryJoin([
					queryCombinations(artists, _t(this.tags.artist), 'OR'),
					this.getDataQuery(queryParam)
				], 'AND NOT');
				/** @type FbMetadbHandleList */
				let handleList = fb.GetQueryItemsCheck(fb.GetLibraryItems(), query);
				if (this.settings.bDebugQuery) { console.log('computeSuggestedArtistsPlaylist:\n\t ' + _p(handleList.Count) + ' <- ' + query); }
				if (handleList && handleList.Count) {
					handleList = removeDuplicates({ handleList, checkKeys: globTags.remDupl, sortBias: globQuery.remDuplBias, bPreserveSort: false });
					({ handleList } = shuffleByTags({ selItems: handleList, bSendToActivePls: false, bAdvancedShuffle: true, sortBias: 'rating', bMultiple: true }) || { handleList: new FbMetadbHandleList() });
					return handleList.Convert().slice(0, size);
				}
				return [];
			})());
		} else {
			const workName = 'Computing suggested Artists playlists';
			this.isWorking.push({ name: workName });
			const mbids = [];
			const suggestedArtists = [];
			const mbidsAlt = [];
			/** @type {{ TITLE: any[], ARTIST: any [] }[]} */
			const tags = [];
			this.playlists.suggestions.artists = lb.lookupArtistMBIDsByName(artists, true)
				.then((results) => {
					const mbids = results.filter(Boolean).map((d) => d.mbid);
					// [{artist_mbid, comment, gender, name, reference_mbid, score, type}, ...]
					return Promise.parallel(mbids, (mbid) => lb.retrieveSimilarArtists(mbid, this.settings.tokens.listenBrainz), 15);
				})
				.then((results) => {
					results.forEach((result) => {
						if (result.status === 'fulfilled') {
							const recommendations = result.value;
							recommendations.sort((a, b) => b.score - a.score);
							recommendations.slice(0, 5).forEach((artist) => {
								mbids.push(artist.artist_mbid || '');
								suggestedArtists.push(artist.name);
							});
						}
					});
				})
				.then(() => {
					// Retrieve some recordings from given artists
					return lb.getPopularRecordingsByArtist(mbids.filter(Boolean), this.settings.tokens.listenBrainz, 100)
						.then((artistRecommendations) => { // [{artist_mbids, count, recording_mbid}, ...]
							const cache = new Map();
							const selection = [];
							artistRecommendations.forEach((recording) => {
								if (recording.artist_mbids) {
									const id = recording.artist_mbids[0];
									let count = cache.get(id) || 0;
									if (count < 10) {
										selection.push(recording);
										cache.set(id, ++count);
									}
								}
							});
							mbids.forEach((artist_mbid, i) => {
								const selLen = selection.length;
								mbidsAlt.push([]);
								tags.push({ TITLE: [], ARTIST: [] });
								for (let j = selLen - 1; j > 0; j--) {
									if (selection[j].artist_mbids.includes(artist_mbid)) {
										const recording = selection.splice(j, 1)[0];
										mbidsAlt[i].push(recording.recording_mbid);
										tags[i].ARTIST.push(recording.artists.map((a) => a.artist_credit_name));
										tags[i].TITLE.push(recording.recording_name);
									}
								}
							});
						});
				})
				.then(() => {
					let libItems;
					if (globQuery.filter.length) {
						try { libItems = fb.GetQueryItems(fb.GetLibraryItems(), globQuery.filter); } // Sanity check
						catch (e) { libItems = fb.GetLibraryItems(); } // eslint-disable-line no-unused-vars
					} else { libItems = fb.GetLibraryItems(); }
					const notFound = [];
					let items = [];
					const queryArr = mbids.map((mbid, i) => {
						const mbidAlt = mbidsAlt[i];
						if (mbidAlt.length) { // Get specific recordings
							return mbidAlt.map((mbid, j) => {
								const tagArr = ['ARTIST', 'TITLE']
									.map((key) => { return { key, val: sanitizeQueryVal(sanitizeTagValIds(tags[i][key][j])) }; });
								const bMeta = tagArr.every((tag) => { return tag.val.length > 0; });
								if (!tagArr[0].val.length > 0) { return; }
								return queryJoin(
									[
										(bMeta
											? tagArr.map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ')
											: tagArr.slice(0, 1).map((tag) => { return _q(sanitizeTagIds(_t(tag.key))) + ' IS ' + tag.val; }).join(' AND ')
										) + ' AND ' + globQuery.noLiveNone,
										'MUSICBRAINZ_TRACKID IS ' + mbid
									].filter(Boolean)
									, 'OR'
								);
							});
						} else { // Or any track by such artist
							return [queryJoin(
								[
									queryJoin(
										[
											'ARTIST IS ' + suggestedArtists[i] + ' AND ' + globQuery.noLiveNone,
											'MUSICBRAINZ_ARTISTID IS ' + mbid + ' OR MUSICBRAINZ_ALBUMARTISTID IS ' + mbid
										].filter(Boolean)
										, 'OR'
									),
									'NOT (' + globTags.rating + ' IS 1 OR ' + globTags.rating + ' IS 2)'
								]
								, 'AND')];
						}
					}).filter(Boolean);
					const tfo = fb.TitleFormat('[%TITLE%]');
					items = queryArr.map((queries, i) => {
						return queries.map((query, j) => {
							let itemHandleList;
							try { itemHandleList = fb.GetQueryItems(libItems, query); } // Sanity check
							catch (e) { fb.ShowPopupMessage('Query not valid. Check query:\n' + query, 'ListenBrainz'); return; } // eslint-disable-line no-unused-vars
							const title = tags[i].TITLE[j];
							// Filter
							if (itemHandleList.Count) {
								itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: ['MUSICBRAINZ_TRACKID'], sortBias: globQuery.remDuplBias, bPreserveSort: false });
								itemHandleList = removeDuplicates({ handleList: itemHandleList, checkKeys: [globTags.title, 'ARTIST'], bAdvTitle: true });
								if (!title) { tags[i].TITLE[j] = tfo.EvalWithMetadb(itemHandleList[0]) || '  \u2715  '; }
								return itemHandleList[0];
							}
							if (title) {
								notFound.push({ creator: tags[i].ARTIST[j].joinLast(', ', ' & '), title: title, tags: { MUSICBRAINZ_TRACKID: mbidsAlt[i][j], MUSICBRAINZ_ALBUMARTISTID: mbids[i], MUSICBRAINZ_ARTISTID: mbids[i], ARTIST: tags[i].ARTIST[j] } });
							}
							return null;
						});
					}).flat(Infinity);
					return { notFound, items };
				}).then(({ notFound, items }) => {
					if (notFound.length) {
						const search = notFound.filter((t) => t.title.length && t.creator.length);
						// Send request in parallel every x ms and process when all are done
						return Promise.parallel(search, youTube.searchForYoutubeTrack, 5).then((results) => {
							let j = 0;
							const itemsLen = items.length;
							results.forEach((result) => {
								for (void (0); j <= itemsLen; j++) {
									if (result.status !== 'fulfilled') { // Only code errors are output
										console.log('YouTube:', result.status, result.reason.message);
										break;
									}
									const link = result.value;
									if (!link || !link.length) { break; }
									if (!items[j]) {
										items[j] = link.url;
										break;
									}
								}
							});
							return items;
						});
					} else {
						return items;
					}
				})
				.then((items) => {
					items.shuffle();
					this.isWorking.splice(this.isWorking.findIndex((obj) => obj.name === workName), 1);
					return items.slice(0, size);
				})
				.catch(() => {
					this.isWorking.splice(this.isWorking.findIndex((obj) => obj.name === workName), 1);
					return [];
				});
		}
		return this.playlists.suggestions.artists;
	},
	/**
	 * It takes a `artist` parameter and returns a promise that resolves to an image.
	 *
	 * @name getArtistImg
	 * @kind method
	 * @memberof wrapped
	 * @param {string} artist
	 * @returns {string}
	*/
	getArtistImg: function (artist) {
		const stubPath = fb.TitleFormat(
			(this.settings.imageStubPath.startsWith('.\\')
				? fb.ProfilePath + this.settings.imageStubPath.replace(/\.\\/, '')
				: this.settings.imageStubPath
			).replace(/%1/gi, sanitizeTagTfo(artist.replace(/,.*$/, '')))
		).Eval(true);
		const files = getFiles(stubPath, new Set(['.jpg', '.png']));
		if (files && files.length) { return Promise.resolve(files.shuffle()[0]); }
		return this.settings.bOffline
			? Promise.resolve(null)
			: spotify.searchArtistInfo(artist)
				.then((sData) => {
					let img = null;
					try { img = sData.best_match.items[0].images[0].url; } catch (e) { /* empty */ } // eslint-disable-line no-unused-vars
					return img;
				});
	},
	/**
	 * Takes the 'artistsData' from {@link wrapped.getArtistsData} or 'tracksData' from {@link wrapped.getTracksData} and mutates it to include an img property with the URL.
	 *
	 * @name getArtistsImgs
	 * @kind method
	 * @memberof wrapped
	 * @param {{artist: string, listens: number}[]} dataArr
	 * @returns {promise.<{artist:string, listens:number, artistImg:string|null}[]>}
	*/
	getArtistsImgs: function (dataArr) {
		if (dataArr.length > 30) { throw new Error('getArtistsImgs: data is too large'); }
		return Promise.parallel(
			dataArr,
			(data) => this.getArtistImg(data.artist).then((img) => data.artistImg = img)
		).then(() => dataArr);
	},
	/**
	 * It takes a `track` parameter and returns a promise that resolves to an image.
	 *
	 * @name getTrackImg
	 * @kind method
	 * @memberof this
	 * @param {string} track
	 * @returns {string}
	*/
	getTrackImg: function (handle) {
		return utils.GetAlbumArtAsyncV2(void (0), handle);

	},
	/**
	 * Takes the 'tracksData' from {@link wrapped.getTracksData} and mutates it to include an img property with the URL.
	 *
	 * @name getTracksImgs
	 * @kind method
	 * @memberof wrapped
	 * @param {{title: string, listens: number, handle: FbMetadbHandle|FbMetadbHandle[]}[]} tracksData
	 * @param {string} root - Path to save the images at '.\\img\\albums\\'
	 * @param {boolean} bRelative - Wether to use relative or absolute paths
	 * @param {boolean} bFormat - Use nconvert.exe to batch process DPI values
	 * @returns {promise.<{title:string, listens:number, handle: FbMetadbHandle|FbMetadbHandle[], albumImg:string|null}[]>}
	*/
	saveTracksImgs: function (tracksData, root = this.basePath, bRelative = true, bFormat = true) {
		if (tracksData.length > 30) { throw new Error('saveTracksImgs: tracksData is too large'); }
		const path = root + 'img\\albums\\';
		if (!_isFolder(path)) { _createFolder(path); }
		return Promise.parallel(
			tracksData,
			(track) => this.getTrackImg(toType(track.handle) === 'FbMetadbHandle' ? track.handle : track.handle[0])
				.then((artPromise) => {
					if (artPromise.image) {
						const imgPath = path + _asciify(sanitize(track.title)).replace(/ /g, '').slice(0, 10).toLowerCase() + '.jpg';
						artPromise.image.SaveAs(imgPath, 'image/jpeg');
						track.albumImg = bRelative ? imgPath.replace(root, '') : imgPath;
					} else { track.albumImg = (bRelative ? '' : root) + 'img\\fallback\\nocover.png'; }
					return Promise.wait(500).then(() => track);
				})
		)
			.then(() => {
				if (bFormat) {
					const nconvert = folders.xxx + 'helpers-external\\nconvert\\nconvert' + (soFeat.x64 ? '' : '_32') + '.exe';
					const command = ' -out jpeg -dpi 300 -resize 600 600 -overwrite -keepfiledate -ignore_errors "' + path + '*.jpg"';
					console.log('Wrapped: processing track images (' + tracksData.length + ') with nconvert\n\tnconvert.exe' + command);
					_runCmd('CMD /C ' + nconvert + command, false);
				}
				return Promise.wait(500).then(() => tracksData); // Give some time to nconvert to end
			});
	},
	/**
	 * Takes the 'artistsData' or 'tracksData' from {@link wrapped.getArtistsImgs}, downloads the images and and mutates it to change the img path. If there image already exists or there is a match at the image stub folder, that will be used instead.
	 *
	 * @name downloadArtistsImgs
	 * @kind method
	 * @memberof wrapped
	 * @param {{artist: string, listens: number, artistImg:string|null}[]} dataArr
	 * @param {string} root - Path to save the images at '.\\img\\artists\\'
	 * @param {boolean} bRelative - Wether to use relative or absolute paths
	 * @returns {promise.<{artist:string, listens:number, artistImg:string|null}[]>}
	*/
	downloadArtistsImgs: function (dataArr, root = this.basePath, bRelative = true) {
		const path = root + 'img\\artists\\';
		if (!_isFolder(path)) { _createFolder(path); }
		return Promise.parallel(
			dataArr,
			(data) => {
				let bFallback = false;
				let imgPath = path + _asciify(sanitize(data.artist)).replace(/ /g, '').slice(0, 10).toLowerCase() + '.jpg';
				if (_isFile(imgPath)) {
					data.artistImg = bRelative ? imgPath.replace(root, '') : imgPath;
				} else if (data.artistImg && _isFile(data.artistImg)) {
					imgPath = imgPath.replace(/\.jpg$/i, '.' + data.artistImg.split('.').pop().toLowerCase());
					if (_copyFile(data.artistImg, imgPath)) {
						data.artistImg = bRelative ? imgPath.replace(root, '') : imgPath;
					} else { bFallback = true; }
				} else if (data.artistImg && !this.settings.bOffline) {
					_runCmd('CMD /C ' + folders.xxx + '\\helpers-external\\curl\\curl.exe --connect-timeout 5 --max-time 5 --retry 3 --retry-max-time 5 -L -o ' + _q(imgPath) + ' ' + data.artistImg, false);
					data.artistImg = bRelative ? imgPath.replace(root, '') : imgPath;
				} else { bFallback = true; }
				if (bFallback) { data.artistImg = (bRelative ? '' : root) + 'img\\fallback\\nocover.png'; }
				return Promise.resolve(data.artistImg);
			}
		).then(() => dataArr);
	},
	/**
	 * Provides a path to a random background image found at root
	 *
	 * @name getRandomBackgroundImg
	 * @kind method
	 * @memberof wrapped
	 * @param {string} root - Path to save the images at '.\\img\\bg\\'
	 * @param {boolean} bRelative - Wether to use relative or absolute paths
	 * @returns {string}
	*/
	getRandomBackgroundImg: function (root = this.basePath, bRelative = true) {
		if (!this.backgroundImgs.length) {
			this.backgroundImgs = getFiles(root + 'img\\bg\\', new Set(['.jpg', '.jpeg', '.png']))
				.map((path) => path.replace(root, ''));
		}
		return (bRelative ? '' : root) + this.backgroundImgs.shuffle().splice(0)[0];
	},
	/**
	 * Provides a path to the character associated to the user
	 *
	 * @name getCharacterImg
	 * @kind method
	 * @memberof wrapped
	 * @param {string} root - Path to load the images at '.\\char\\'
	 * @param {boolean} bRelative - Flag to use relative or absolute paths
	 * @returns {string}
	 */
	getCharacterImg: function (root = this.basePath, bRelative = true) {
		return (bRelative ? '' : root) + 'img\\char\\' + this.stats.character.main.name.toLowerCase().replace(/ /g, '') + '.jpg';
	},
	/**
	 * Provides a path to the character's background associated to the user, which must end with '_blur' prefix. Fallbacks to original image if not found
	 *
	 * @name getCharacterImgBlur
	 * @kind method
	 * @memberof wrapped
	 * @param {string} root - Path to load the images at '.\\char\\'
	 * @param {boolean} bRelative - Wether to use relative or absolute paths
	 * @returns {string}
	 */
	getCharacterImgBlur: function (root = this.basePath, bRelative = true) {
		const file = 'img\\char\\' + this.stats.character.main.name.toLowerCase().replace(/ /g, '') + '_blur.jpg';
		return (bRelative ? '' : root) +
			(_isFile(folders.xxx + 'images\\wrapped\\' + file) ? file : file.replace('_blur.jpg', '.jpg'));
	},
	/**
	 * Provides a path to the genre group image associated to an specific group
	 *
	 * @name getGenreGroupImg
	 * @kind method
	 * @memberof wrapped
	 * @param {string} group - Genre group from {@link wrapped.getGenreGroups} array
	 * @param {string} root - Path to load the images at '.\\genres\\'
	 * @param {boolean} bRelative - Wether to use relative or absolute paths
	 * @returns {string}
	 */
	getGenreGroupImg: function (group, root = this.basePath, bRelative = true) {
		group = group.toLowerCase();
		let fileName = '';
		switch (group) {
			case 'industrial_cluster':
			case 'metal_cluster':
			case 'rock_cluster':
			case 'pop_cluster':
			case 'country_cluster':
			case 'r&b_cluster':
			case 'blue_note_cluster':
			case 'jamaican_cluster':
			case 'rap_cluster':
			case 'downtempo_cluster':
			case 'folk_cluster':
				fileName = group.replace(/([_&])|(cluster)/g, '');
				break;
			case 'breakbeat dance_cluster':
				fileName = 'breakbeat';
				break;
			case 'four-to-the-floor dance_cluster':
				fileName = 'fourfloor';
				break;
			case 'classical music_cluster':
				fileName = 'classical';
				break;
			default:
				throw new Error('Wrapped.getGenreImg: group not recognized ' + group);
		}
		return (bRelative ? '' : root) + 'img\\genres\\' + fileName.replace(/ /g, '') + '.png';
	},
	/**
	 * Provides a path to the genre group image associated to the user.
	 *
	 * @name getMainGenreGroupImg
	 * @kind method
	 * @memberof wrapped
	 * @param {string} root - Path to load the images at '.\\genres\\'
	 * @param {boolean} bRelative - Wether to use relative or absolute paths
	 * @returns {string}
	 */
	getMainGenreGroupImg: function (root = this.basePath, bRelative = true) {
		return this.getGenreGroupImg(this.stats.genres.groups.main.name.toLowerCase(), root, bRelative);
	},
	/**
	 * Provides a path to the genre group image associated to an specific genre, calculating the group first.
	 *
	 * @name getGenreImg
	 * @kind method
	 * @memberof wrapped
	 * @param {string} genre - Genre string
	 * @param {string} root - Path to load the images at '.\\genres\\'
	 * @param {boolean} bRelative - Wether to use relative or absolute paths
	 * @returns {string|null}
	 */
	getGenreImg: function (genre, root = this.basePath, bRelative = true) {
		const group = this.getGenreGroups(genre)[0];
		return group ? this.getGenreGroupImg(group.toLowerCase(), root, bRelative) : null;
	},
	/**
	 * Retrieves a city image from wikimedia.org
	 *
	 * @property
	 * @name getCityImg
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{name:string, listens:number}} cityData
	 * @returns {Promise.<string>}
	*/
	getCityImg: function (cityData) {
		cityData.img = null;
		if (this.settings.bOffline) { return Promise.resolve(null); }
		const url = 'https://commons.wikimedia.org/w/index.php?search=' + cityData.name + '&title=Special:MediaSearch&go=Go&type=image&filemime=jpeg&assessment=featured-image';
		return send({
			method: 'GET',
			bypassCache: true,
			requestHeader: [
				['user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36']
			],
			URL: url
		})
			.then((response) => {
				const match = (response.match(/href="([\w/:().%]*\.jpg)"/mi) || [null, null])[1];
				if (match) {
					return send({
						method: 'GET',
						bypassCache: true,
						requestHeader: [
							['user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36']
						],
						URL: match
					});
				}
				throw new Error('No image match');
			})
			.then((response) => {
				const match = (response.match(/<a href="([\w/:().%-]+?\.jpg)" class="mw-thumbnail-link">1,024/mi) || [null, null])[1];
				if (match) {
					cityData.img = match;
					return match;
				}
				throw new Error('No image source');
			})
			.catch(() => null);
	},
	/**
	 * Downloads the city image
	 *
	 * @property
	 * @name downloadCityImg
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{name:string, listens:number, img:string}} cityData
	 * @returns {Promise.<string>}
	*/
	downloadCityImgs: function (citiesData, root = this.basePath, bRelative = true) {
		const path = root + 'img\\cities\\';
		if (!_isFolder(path)) { _createFolder(path); }
		return Promise.parallel(
			citiesData,
			(data) => {
				if (data.img && !this.settings.bOffline) {
					const imgPath = path + _asciify(sanitize(data.name)).replace(/ /g, '').slice(0, 10).toLowerCase() + '.jpg';
					_runCmd('CMD /C ' + folders.xxx + '\\helpers-external\\curl\\curl.exe --connect-timeout 10 --max-time 10 --retry 3 --retry-max-time 10 -L -o ' + _q(imgPath) + ' ' + data.img, false);
					data.img = bRelative ? imgPath.replace(root, '') : imgPath;
				} else {
					data.img = (bRelative ? '' : root) + 'img\\fallback\\city.jpg';
				}
				return Promise.resolve(data.img);
			}
		).then(() => citiesData);
	},
	/**
	 * Retrieves all library statistics from {@link wrapped.getTracksData}, {@link wrapped.getArtistsData}, and {@link wrapped.getGenresData} for a given year
	 *
	 * @property
	 * @name getData
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {number} timePeriod - Single year or number of time units
	 * @param {string} query? - Recommended to use '%RATING% MISSING OR %RATING% GREATER 2'
	 * @param {string} timeKey? - Time units: Days|Weeks
	 * @param {Date} fromDate? - Reference date for usage with time periods based on time units
	 * @returns {Promise.<{ genres: {genre:string, listens:number}[]; tracks: {title:string, listens:number, handle:FbMetadbHandle[]}[]; artists: {artist:string, listens:number}[]; bpms: {bpm:number, listens:number}[]; keys: {key:{hour:number, letter:string}, openKey:string, stdKey: string, listens:number}[]; moods: {mood:string, listens:number}[]; cities: {city:string, listens:number, artists:{artist:string, listens:number}[]}[]; countries: {name:string, listens:number}[]; albums: {album:string, listens:number}[] }>}
	*/
	getData: async function (timePeriod, query, timeKey = null, fromDate = null) {
		console.log('Wrapped: retrieving listening stats...');
		this.resetStats();
		this.resetPlaylists();
		if (this.isServicesListens() && !this.settings.bOffline) {
			if (this.settings.tokens.listenBrainz.length) {
				if (!this.settings.tokens.listenBrainzUser) {
					this.settings.tokens.listenBrainzUser = await ListenBrainz.retrieveUser(this.settings.tokens.listenBrainz, false);
				}
				await ListenBrainz.retrieveListens(
					this.settings.tokens.listenBrainzUser,
					{ max_ts: Math.round(Date.now() / 1000) },
					this.settings.tokens.listenBrainz,
					true, true
				);
			}
		}
		return Promise.all([
			this.getGenresData(timePeriod, query, timeKey, fromDate),
			this.getTracksData(timePeriod, query, timeKey, fromDate),
			this.getArtistsData(timePeriod, query, timeKey, fromDate),
			this.getAlbumsData(timePeriod, query, timeKey, fromDate),
			this.getCountriesData(timePeriod, query, timeKey, fromDate),
			this.getCitiesData(timePeriod, query, timeKey, fromDate),
			this.getBpmsData(timePeriod, query, timeKey, fromDate),
			this.getKeyData(timePeriod, query, timeKey, fromDate),
			this.getMoodsData(timePeriod, query, timeKey, fromDate),
		])
			.then(async (data) => {
				data = { genres: data[0], tracks: data[1], artists: data[2], albums: data[3], countries: data[4], cities: data[5], bpms: data[6], keys: data[7], moods: data[8] };
				this.computeCharacterStats(data);
				await this.computeGlobalStats(data, timePeriod, timeKey, fromDate);
				Object.keys(data).forEach((key) => {
					if (this.stats[key].total > 5) { data[key].length = 5; }
					if (this.settings.bDebug) {
						if (['tracks', 'albums'].includes(key)) {
							console.log('getData[' + key + ']:\n\t ', data[key].map((d) => { return { ...d, handle: null }; }));
						} else {
							console.log('getData[' + key + ']:\n\t ', data[key]);
						}
					}
				});
				return data;
			});
	},
	/**
	 * Retrieves and downloads all images from a given data object.
	 *
	 * @property
	 * @name getDataImages
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ genres: {genre:string, listens:number}[]; tracks: {title:string, artist:string, listens:number, handle:FbMetadbHandle[]}[]; artists: {artist:string, listens:number}[]; albums: {title:string, artist:string, listens:number, handle:FbMetadbHandle[]}[]; cities: {city:string, listens:number, artists:{artist:string, listens:number}[]}}} wrappedData
	 * @returns {Promise.<{ genres: {genre:string, listens:number}[]; tracks: {title:string, listens:number, handle:FbMetadbHandle[]}[]; artists: {artist:string, listens:number}[]; bpms: {bpm:number, listens:number}[]; keys: {key:{hour:number, letter:string}, openKey:string, stdKey: string, listens:number}[]; moods: {mood:string, listens:number}[]; cities: {city:string, listens:number, artists:{artist:string, listens:number}[]}[]; countries: {name:string, listens:number}[]; albums: {album:string, listens:number}[] }>}
	*/
	getDataImages: function (wrappedData) {
		console.log('Wrapped: retrieving images...');
		// All arrays have been cut in length at this.getData
		return this.getArtistsImgs(wrappedData.artists)
			.then(() => this.getArtistsImgs(wrappedData.tracks))
			.then(() => this.getArtistsImgs(this.stats.countries.byArtist))
			.then(() => !!wrappedData.cities[0] && this.getArtistsImgs(wrappedData.cities[0].artists.slice(0, this.settings.cityArtistSlice)))
			.then(() => !!wrappedData.albums[0] && this.getArtistsImgs([wrappedData.albums[0]]))
			.then(() => this.downloadArtistsImgs(wrappedData.artists))
			.then(() => this.downloadArtistsImgs(wrappedData.tracks))
			.then(() => this.downloadArtistsImgs(this.stats.countries.byArtist))
			.then(() => !!wrappedData.cities[0] && this.downloadArtistsImgs(wrappedData.cities[0].artists.slice(0, this.settings.cityArtistSlice)))
			.then(() => !!wrappedData.albums[0] && this.downloadArtistsImgs([wrappedData.albums[0]]))
			.then(() => this.saveTracksImgs([
				...wrappedData.tracks,
				...wrappedData.albums,
				!!this.stats.artists.top[0] && this.stats.artists.top[0].topTrack,
				this.stats.time.most.track,
				!!this.stats.albums.top[0] && this.stats.albums.top[0].topTrack
			].filter(Boolean)))
			.then(() => !!wrappedData.cities[0] && this.getCityImg(wrappedData.cities[0]))
			.then(() => this.downloadCityImgs(wrappedData.cities))
			.then(() => wrappedData);
	},
	createPlaylists: function (timePeriod) {
		if (this.playlists.top.Count) {
			sendToPlaylist(this.playlists.top, 'Top Songs' + (timePeriod ? ' ' + timePeriod : ''));
		}
		if (this.playlists.discover.Count) {
			sendToPlaylist(this.playlists.discover, 'Discovered Songs' + (timePeriod ? ' ' + timePeriod : ''));
		}
		if (this.playlists.topArtists.Count) {
			sendToPlaylist(this.playlists.topArtists, 'Top Artists' + (timePeriod ? ' ' + timePeriod : ''));
		}
		if (this.playlists.topGenres.Count) {
			sendToPlaylist(this.playlists.topGenres, 'Top Genres' + (timePeriod ? ' ' + timePeriod : ''));
		}
		if (this.playlists.topCountries.Count) {
			sendToPlaylist(this.playlists.topCountries, 'Top Countries' + (timePeriod ? ' ' + timePeriod : ''));
		}
		this.playlists.suggestions.genres.then((pls) => {
			if (pls && (Array.isArray(pls) && pls.length || pls.Count)) {
				sendToPlaylist(pls, 'Suggested Genres' + (timePeriod ? ' ' + timePeriod : ''));
			}
		});
		this.playlists.suggestions.artists.then((pls) => {
			if (pls && (Array.isArray(pls) && pls.length || pls.Count)) {
				sendToPlaylist(pls, 'Suggested Artists' + (timePeriod ? ' ' + timePeriod : ''));
			}
		});
	},
	/**
	 * Used to generate a PDF report for a specific year. The "latexCmd" parameter is a. The "root" parameter is an .
	 *
	 * @property
	 * @name createPdfReport
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ timePeriod?: number; timeKey?: string; fromDate?: Date; query?: string; latexCmd?: string; extraCmd:string[]; root?: string }} { timePeriod, timeKey, fromDate, query, latexCmd, extraCmd, root }
	 * @returns {any}
	*/
	createPdfReport: function ({ timePeriod, timeKey = null, fromDate = null, query = '', latexCmd, extraCmd = [], root = this.basePath }) {
		if (this.settings.bOffline) { console.log('Wrapped: offline mode'); }
		this.cleanRoot(root);
		this.copyDependencies(root);
		return this.getData(timePeriod, query, timeKey, fromDate)
			.then((wrappedData) => this.getDataImages(wrappedData))
			.then((wrappedData) => {
				this.cleanExif();
				this.compressImgs();
				return this.formatLatexReport(wrappedData, timePeriod, root);
			})
			.then((report) => this.compileLatexReport(report, timePeriod, latexCmd, extraCmd, root));
	},
	/**
	 * Gives format in LaTeX to data retrieved {@link wrapped.getData} for a given year
	 *
	 * @property
	 * @name formatLatexReport
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ genres: {genre:string, listens:number}[]; tracks: {title:string, listens:number, artist:string, handle:FbMetadbHandle[]?, albumImg:string?}[]; artists: {artist:string, listens:number}[]; bpms: {bpm:number, listens:number}[]; keys: {key:{hour:number, letter:string}, openKey:string, stdKey: string, listens:number}[]; moods: {mood:string, listens:number}[]; cities: {city:string, listens:number, artists:{artist:string, listens:number}[]}[]; countries: {name:string, listens:number}[]; albums: {album:string, listens:number}[] }} wrappedData - Data from {@link wrapped.getData}
	 * @param {number} year - Used for formatting purposes
	 * @param {?string} root - Optional parameter that specifies the root directory for the report
	 * @returns {string}
	*/
	formatLatexReport: function (wrappedData, year, root = this.basePath) {
		console.log('Wrapped: creating LaTeX report...');
		const latex = /[&#%$_^{}]/gi;
		const illegalChars = /[\\&#%$_^{}!]/gi;
		const sanitizeCut = new RegExp('\\s?\\\\\u2026$', 'gi'); // NOSONAR [\...]
		for (const type in wrappedData) {
			wrappedData[type].forEach((item) => {
				['artist', 'title', 'genre', 'name', 'city', 'album', 'mood'].forEach((key) => {
					if (Object.hasOwn(item, key)) {
						item[key] = item[key].replaceAll('\\', '/').replace(latex, '\\$&');
					}
				});
			});
		}
		// Helpers
		const [firstYear, lastYear] = !year
			? [this.stats.time.first.date, this.stats.time.last.date].map((d) => d.getFullYear().toString())
			: [null, null];
		const period = !year ? firstYear + ' - ' + lastYear : null;
		const topDay = this.stats.time.most.date
			? this.stats.time.most.date.toLocaleDateString('en-us', { month: 'long', day: 'numeric' })
			: '- no date -';
		const getUniqueLabel = (() => {
			const labels = new Set();
			return function (label) {
				label = label.replace(illegalChars, '');
				while (labels.has(label)) { label += '_'; }
				labels.add(label);
				return label;
			};
		})();
		const cutReplace = (s, n) => s.cut(n).replace(latex, '\\$&');
		const cut = (s, n) => s.cut(n).replace(sanitizeCut, '');
		const getImage = (path) => (path || '').replaceAll('\\', '/');
		const getBgImg = (path) => this.getRandomBackgroundImg(path).replaceAll('\\', '/');
		const getCharImg = (path) => this.getCharacterImg(path).replaceAll('\\', '/');
		const getCharImgBlur = (path) => this.getCharacterImgBlur(path).replaceAll('\\', '/');
		const getMainGenreImg = (path) => this.getMainGenreGroupImg(path).replaceAll('\\', '/');
		const enumerate = (data, key) => {
			const subKey = ['artists', 'countries'].includes(key) ? 'artist' : 'title';
			const imgKey = (['tracks', 'albums'].includes(key) ? 'album' : subKey) + 'Img';
			(key === 'countries' ? data : data[key]).forEach((p, i) => {
				report += '\\begin{minipage}{0.05\\textwidth}\n';
				report += '\t{\\Large \\textbf{' + (i + 1) + '}}\n';
				report += '\\end{minipage}\n';
				report += '\\begin{minipage}{0.238\\textwidth}\n';
				report += '\t\\begin{figure}[H]\n';
				report += '\t\t\\centering\n';
				report += '\t\t\\includegraphics[width=100px,height=100px]{' + getImage(p[imgKey]) + '}\n';
				report += '\t\t\\label{fig:' + getUniqueLabel(p[subKey]) + '}\n';
				report += '\t\\end{figure}\n';
				report += '\\end{minipage}  \\hfill\n';
				report += '\\begin{minipage}{0.70\\textwidth}\n';
				if (subKey === 'title') {
					report += '\t{\\Large\\textbf{\\textit{' + cut(p[subKey], 40) + '}}\\\\' +
						'By \\textbf{\\textit{' + cut(p.artist, 40) + '}}\\\\' +
						'With \\textbf{\\textit{' + p.listens + ' listens}.}';
					if (['tracks', 'albums'].includes(key) && p.rating) {
						report += '\\\\ \\Stars{' + p.rating + '}';
					}
					if (['tracks', 'albums'].includes(key) && p.loved) {
						report += ' - \\Heart';
					}
					report += '}\n';
				} else {
					if (key === 'countries') {
						report += '\t{\\Large\\textbf{' + cut(p.name, 40) + '}:\\\\' +
							'\\textbf{\\textit{' + cut(p[subKey], 40) + '}}\\\\' +
							'With \\textbf{\\textit{' + p.listens + ' listens}}.' +
							(Object.hasOwn(p, 'topTrack')
								? '\\\\Top track: \\textbf{\\textit{' + cut(p.topTrack.title, 40) + '}}'
								: ''
							) + '}\n';
					} else {
						report += '\t{\\Large\\textbf{\\textit{' + cut(p[subKey], 40) + '}}\\\\' +
							'With \\textbf{\\textit{' + p.listens + ' listens}}.' +
							(Object.hasOwn(p, 'topTrack')
								? '\\\\Top track: \\textbf{\\textit{' + cut(p.topTrack.title, 40) + '}}'
								: ''
							) + '}\n';
					}

				}
				report += '\\end{minipage}\n';
			});
		};
		// Report
		let report =
			'\\documentclass[12pt]{article}\n' +
			'\\usepackage{ifluatex}\n' +
			'\\ifluatex\n' +
			'\t\\directlua{\n' +
			'\t\tpdf.setminorversion(5)\n' +
			'\t\tpdf.setcompresslevel(9)\n' +
			'\t\tpdf.setobjcompresslevel(9)\n' +
			'\t\tpdf.setdecimaldigits(1)\n' +
			'\t\tpdf.setimageresolution(50)\n' +
			'\t}\n' +
			'\\else\n' +
			'\t\\pdfcompresslevel=9\n' +
			'\t\\pdfminorversion=5\n' +
			'\t\\pdfobjcompresslevel=3\n' +
			'\t\\pdfdecimaldigits=1\n' +
			'\\fi\n' +
			'\\usepackage[a4paper,left=1in,right=1in,top=0.75in,bottom=0in]{geometry} % margins\n' +
			'\\usepackage{graphicx} % figures\n' +
			'\\usepackage{float} % [H]\n' +
			'\\usepackage[dvipsnames]{xcolor} % Page color\n' +
			'\\usepackage{tikz} % Background Image\n' +
			'\\usetikzlibrary{shadows} % Shadows for nodes\n' +
			'\\usetikzlibrary{shapes.geometric} % Stars\n' +
			'\\newcommand{\\Stars}[2][fill=Goldenrod,draw=Gray]{\\begin{tikzpicture}[baseline=-0.35em,#1]\n' +
			'\t\\foreach \\X in {1,...,5}\n' +
			'\t{\\pgfmathsetmacro{\\xfill}{min(1,max(1+#2-\\X,0))}\n' +
			'\t\t\\path (\\X*1.1em,0)\n' +
			'\tnode[star,draw,star point height=0.25em,minimum size=1em,inner sep=0pt,\n' +
			'\tpath picture={\\fill (path picture bounding box.south west)\n' +
			'\t\t\trectangle  ([xshift=\\xfill*1em]path picture bounding box.north west);}]{};\n' +
			'\t}\n' +
			'\\end{tikzpicture}}\n' +
			'\\newcommand{\\Heart}{\\begin{tikzpicture}[scale=0.35]\n' +
			'\t\\fill [red, thick, domain=-200:200, samples=50]\n' +
			'\tplot ({ .67*sin(\\x) * sin(\\x) * sin(\\x) + .5 },\n' +
			'\t{ .65 * cos(\\x) - .2 * cos(2*\\x) - .1 * cos(3*\\x) - .05 * cos(4*\\x) - .4 } );\n' +
			'\\end{tikzpicture}}\n' +
			'\\usepackage{multicol} % Columns\n' +
			'\\usepackage[colorlinks=true,linkcolor=blue,urlcolor=black,bookmarksopen=true]{hyperref}% TOC\n' +
			'\\usepackage[open]{bookmark} % TOC\n' +
			'\\usepackage{pgfplots} % Graphs\n' +
			'\\pgfplotsset{compat=1.18} % Graphs\n' +
			'\\usepackage{pgf-pie} % Graphs\n' +
			'\\usepackage{pdfrender} % Outline fonts\n' +
			'\\usepackage{anyfontsize} % Font size fixes\n' +
			'\\renewcommand{\\familydefault}{\\sfdefault}\n\n' +
			'\\newsavebox{\\picbox}\n' +
			'\\newcommand{\\cutpic}[5]{\n' +
			'\t\\savebox{\\picbox}{\\includegraphics[width=#3,height=#3]{#4}}\n' +
			'\t\\tikz\\node [draw, rounded corners=#1, line width=#2,\n' +
			'\tcolor=#5, minimum width=\\wd\\picbox,\n' +
			'\tminimum height=\\ht\\picbox, path picture={\n' +
			'\t\t\\node at (path picture bounding box.center) {\n' +
			'\t\t\t\\usebox{\\picbox}};\n' +
			'\t}] {};}\n' +
			'\n\n' +
			'\\begin{document}\n';
		// Front
		report += '\\phantomsection\n';
		report += '\\addcontentsline{toc}{part}{Wrapped ' + (year || period) + '}\n';
		report += '\\clearpage \\vspace*{\\fill}\n';
		report += '\\begin{tikzpicture}[remember picture,overlay]\n';
		report += '\t\\node [fill, rectangle, top color=RedViolet, middle color=Goldenrod, bottom color=Emerald, anchor=north, minimum width=\\paperwidth, minimum height=\\paperheight] (box) at (current page.north){};\n';
		report += '\\end{tikzpicture}\n';
		report += '\\tikz[remember picture,overlay] \\node[opacity=0.4,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
		report += '\\begin{center}\n';
		report += '{\\fontsize{100}{80}\\selectfont\n' +
			'\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=Turquoise, FillColor=White}{W}' +
			'\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=CarnationPink, FillColor=White}{r}' +
			'\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=Yellow, FillColor=White}{a}' +
			'\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=Cerulean, FillColor=White}{p}' +
			'\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=SpringGreen, FillColor=White}{p}' +
			'\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=YellowOrange, FillColor=White}{e}' +
			'\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=OrangeRed, FillColor=White}{d}\\\\' +
			(year
				? year.toString().split('')
					.map((c, i) => '\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=' + (i % 2 === 0 ? 'Turquoise' : 'RubineRed') + ', FillColor=White}{' + c + '}')
					.join('')
				: period.toString().split(' - ')
					.map((c, i) => '\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=' + (i % 2 === 0 ? 'Turquoise' : 'RubineRed') + ', FillColor=White}{' + c + '}')
					.join('\\textpdfrender{TextRenderingMode=FillStroke, LineWidth=5pt, LineCapStyle=Round, StrokeColor=Yellow, FillColor=White}{-}')
			) + '}\n';
		report += '\\end{center}\n';
		report += '\\vfill %\n\n';
		report += '\n';
		// Me in year
		report += '\\pagebreak\n';
		report += '\\phantomsection\n';
		report += '\\addcontentsline{toc}{part}{User statistics}\n';
		report += '\\pagecolor{Periwinkle}\n';
		report += '\\clearpage \\vspace*{\\fill}\n';
		report += '\\tikz[remember picture,overlay] \\node[opacity=0.4,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getCharImgBlur(root) + '}};\n';
		report += '\\tikz[remember picture,overlay] \\node[opacity=1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\textwidth,height=24.4cm]{' + getCharImg(root) + '}};\n';
		report += '\\begin{center}\n';
		report += '\\tikz[baseline=0.6ex,overlay] \\fill [opacity=0.4,white] (-4,-1.6) rectangle (\\paperwidth,6ex);\n';
		report += '\\textbf{\\textit{\\LARGE ' + this.stats.character.main.description.replace(latex, '\\$&') + '}}\n';
		report += '\\end{center}\n\n';
		report += '\n';
		// Burger genres
		if (this.stats.genres.total) {
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{part}{Genre statistics}\n';
			report += '\\pagecolor{lime!70}\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\\begin{center}';
			report += '\t{\\Huge Your most listened genres}\\\\\n';
			report += '\t{\\Large \u00D1am.}\n';
			report += '\\end{center}';
			report += '\\vspace{30mm}';
			{
				report += '\t\\setbox1=\\hbox{\\includegraphics[width=\\textwidth]{img/burger/burger}}\n';
				report += '\t\\begin{tikzpicture}\n';
				report += '\t\t\\filldraw [draw=lime!70, ultra thick,draw opacity=0,fill opacity=0] (0,0) rectangle ++(14cm,0);\n';
				let y = 9.5;
				const burgerColors = ['yellow!60', 'red!70', 'teal', 'orange!60', 'blue!60', 'purple!60'];
				this.stats.genres.byScore.forEach((genre, i) => {
					const iH = i === 0 ? 2.5 : round(6 * (genre.score + this.stats.genres.byScore[0].score / 4) / 100, 2);
					y -= iH;
					report += '\t\t\\filldraw [fill=' + burgerColors[i] + ', draw=' + burgerColors[i] + '] (-1,' + y + ') rectangle ++(14cm,' + iH + ');\n';
					report += '\t\t\\node[rectangle] (a) at (6,' + round(y + iH / 2, 1) + ') {\\Large \\textbf{' + genre.genre.replace(latex, '\\$&') + '}};\n';
				});
				report += '\t\\end{tikzpicture}\\llap{\\includegraphics[width=\\textwidth]{img/burger/burger}}\n';
				report += '\\end{figure}\n';
			}
			report += '\\vfill %\n\n';
			// Total genres
			report += '\\pagebreak\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\begin{center}\n';
			report += '{\\Huge ' + (year || period) + ' has been great...}\\\\\n';
			report += '\\vspace{15mm}\n';
			report += '{\\LARGE You have listened to \\textbf{\\textit{' + this.stats.genres.total + '}} genres.}\n';
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
			// Genre groups
			report += '\\pagebreak\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{section}{Top music categories}\n';
			report += '\\begin{center}\n';
			report += '\\textit{\\Huge Your listening habits are specially identified with the following musical groups...}\\\\\n';
			report += '\\end{center}\n';
			report += '\\vspace{15mm}\n';
			report += '\\begin{center}\n';
			report += '\\begin{tikzpicture}[node distance={22mm},minimum size=2cm,main/.style = {draw,circle,fill opacity=0.75,general shadow={fill=blue!60,shadow xshift=3pt,shadow yshift=-3pt,fill opacity=0.4}}]\n';
			const colors = ['Aquamarine!85', 'Aquamarine!70', 'BlueGreen!60', 'BlueGreen!50'];
			this.stats.genres.groups.scores.slice(0, this.settings.genreGroupSlice).forEach((group, i) => {
				const name = group.name.replace(/dance_cluster|music_cluster|cluster/gi, '')
					.replace(/[ _]/gi, ' ').replace(latex, '\\$&');
				report += '\t\\node[main,scale=' + Math.max((this.settings.genreGroupSlice - i), 1) + ',align=center,fill=' + colors[i] + '] (' + (i + 1) + ') ' +
					(i > 0 ? '[below right of=' + i + ']' : '') +
					'{' + name + '\\\\{\\scriptsize' + _p(group.score + '\\%') + '}};\n';
			});
			report += '\\end{tikzpicture}\n';
			report += '\\end{center}\n';
			report += '\\vspace{20mm}\n';
			report += '\\vfill %\n\n';
			// Genres
			report += '\\pagebreak\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\section[Your top 5 Genres]{Your top 5 Genres:}\n';
			report += '\\begin{enumerate}\n';
			wrappedData.genres.forEach((genre) => {
				report += '\t\\item {\\Large\\textbf{\\textit{' + genre.genre + '}} with \\textit{' + genre.listens + ' listens}.}\n';
			});
			report += '\\end{enumerate}\n';
		}
		if (this.stats.genres.groups.main.name) {
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\includegraphics[height=275px]{' + getMainGenreImg() + '}\n';
			report += '\t\\label{fig:screenshot001}\n';
			report += '\\end{figure}\n';
		}
		if (this.stats.genres.similarV2.length) {
			report += '\\subsection[Similar genres]{Other genres similar to your favorites you may like:}\n';
			report += '\\begin{multicols}{2}\n';
			report += '\t\\begin{itemize}\n';
			this.stats.genres.similarV2.slice(0, this.settings.genreSuggestSlice).forEach((genre) => {
				report += '\t\\item {\\Large\\textbf{\\textit{' + genre.replace(latex, '\\$&') + '}}.}\n';
			});
			report += '\t\\end{itemize}\n';
			report += '\\end{multicols}\n';
			report += '\n';
		}
		// Tracks
		if (this.stats.tracks.total > 0) {
			// Total tracks
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{part}{Tracks statistics}\n';
			report += '\\pagecolor{purple}\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\begin{center}\n';
			report += '{\\Huge You have listened to \\textbf{\\textit{' + this.stats.tracks.total + '}} tracks in ' + (year || period) + '.}\\\\\n';
			report += '\\vspace{15mm}\n';
			report += '{\\Huge With a total of \\textbf{\\textit{' + this.stats.listens.total + '}} listens\\\\\\vspace{5mm}and approximately \\textbf{\\textit{' + this.stats.time.mean.listensPerDay + '}} listens per day.}\\\\\n';
			report += '\\vspace{15mm}\n';
			report += '{\\LARGE But there is one special track for you...}\\\\\n';
			report += '\\end{center}\n';
			report += '\\vspace{30mm}\n';
			report += '\\vfill %\n\n';
			// Top track
			report += '\\pagebreak\n';
			report += '\\pagecolor{purple}\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.4,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getImage(wrappedData.tracks[0].artistImg) + '}};\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{section}{Top Track}\n';
			report += '\\begin{center}\n';
			report += '{\\Huge The track you have listened the most has been \\textbf{\\textit{' + wrappedData.tracks[0].title + '}} by \\textbf{\\textit{' + cut(wrappedData.tracks[0].artist, 20) + '}}.}\n\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\includegraphics[width=400px]{' + getImage(wrappedData.tracks[0].albumImg) + '}\n';
			report += '\t\\label{fig:' + getUniqueLabel(wrappedData.tracks[0].title) + '}\n';
			report += '\\end{figure}\n';
			report += '{\\LARGE You have played it \\textbf{\\textit{' + wrappedData.tracks[0].listens + '}} times ' + (year ? 'this year' : 'since ' + firstYear) + '.}\n\n';
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
			// Top 5 Tracks
			report += '\\pagebreak\n';
			report += '\\pagecolor{purple}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\section[Your top 5 Tracks]{Your top 5 Tracks:}\n';
			enumerate(wrappedData, 'tracks');
			report += '\n';
		}
		// Total listening time
		report += '\\pagebreak\n';
		report += '\\phantomsection\n';
		report += '\\addcontentsline{toc}{part}{Listening statistics}\n';
		report += '\\pagecolor{red}\n';
		report += '\\clearpage \\vspace*{\\fill}\n';
		report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
		report += '\\begin{center}\n';
		report += '{\\Huge In total, you have listened to \\textbf{\\textit{' + this.stats.time.minutes + '}} minutes of music.}\\\\\n';
		report += '\\vspace{15mm}\n';
		report += '{\\LARGE That\'s \\textbf{\\textit{' + this.stats.time.days + '}} days non-stop.}\\\\\n';
		report += '\\vspace{20mm}\n';
		report += '{\\Huge Approximately \\textbf{\\textit{' + this.stats.time.mean.minutesPerDay + '}} minutes per day.}\\\\\n';
		report += '\\end{center}\n';
		report += '\\vfill %\n\n';
		if (this.stats.time.byMonth.length) {
			const topMonth = this.stats.time.byMonth
				.reduce((top, curr) => top.minutes > curr.minutes ? top : curr, this.stats.time.byMonth[0]);
			report += '\\pagebreak\n';
			report += '\\phantomsection\n\\addcontentsline{toc}{section}{Listens by Month}\n';
			report += '\\pagecolor{red}\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\begin{center}\n';
			report += '{\\Huge You listened \\textbf{\\textit{' + topMonth.minutes + '}} minutes of your favorite music in \\textbf{\\textit{' + topMonth.monthName + '}}, across \\textbf{\\textit{' + topMonth.listens + '}} listens.}\\\\\n';
			report += '\\vspace{40mm}\n';
			report += '\\hspace*{-1cm}\n';
			report += '\t\\begin{tikzpicture}\n';
			report += '\t\t\\tikzstyle{every node}=[font=\\LARGE]\n';
			report += '\t\t\\begin{axis} [smooth,width=1.06\\textwidth,enlarge y limits=upper,ymin=0,xlabel={Minutes by Month},xticklabels={,' + this.monthNames.map((m) => m.slice(0, 3)).join(',') + '},ytick pos=left,xtick pos=bottom,axis x line*=bottom,axis y line*=left,scaled y ticks=base 10:-3,ytick scale label code/.code={},yticklabel={\\pgfmathprintnumber{\\tick} k},enlarge x limits={abs=0.01}]\n';
			report += '\t\t\t\\addplot[fill opacity=0.9,BurntOrange,fill=BurntOrange!40!Yellow]\n\t\t\tcoordinates {\n';
			this.stats.time.byMonth.forEach((point) => {
				report += '\t\t\t\t(' + (point.month - 1) + ',' + point.minutes + ')\n';
			});
			report += '\t\t\t}\\closedcycle;\n';
			report += '\t\t\t\\addplot[scatter,mark options={scale=2.5}]\n\t\t\tcoordinates {\n';
			report += '\t\t\t(' + (topMonth.month - 1 + (topMonth.month < 12 && this.stats.time.byMonth[topMonth.month].minutes !== 0 ? 0.2 : 0)) + ',' + (Math.round(topMonth.minutes * 1.002)) + ')\n';
			report += '\t\t\t};\n';
			report += '\t\t\\end{axis}\n';
			report += '\t\\end{tikzpicture}\n';
			report += '\t\\vspace{50mm}\n';
			report += '\\end{center}\n\n';
		}
		// Day with more listening time
		if (this.stats.time.most.minutes) {
			report += '\\pagebreak\n';
			report += '\\phantomsection\n\\addcontentsline{toc}{section}{Top Day}\n';
			report += '\\pagecolor{red}\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\begin{center}\n';
			report += '{\\Huge \\textbf{\\textit{' +
				topDay +
				'}} was a special day for you, listening during \\textbf{\\textit{' +
				this.stats.time.most.minutes +
				'}} minutes to your favorite music.}\\\\\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\includegraphics[width=400px]{' + getImage(this.stats.time.most.track.albumImg) + '}\n';
			report += '\t\\label{fig:' + getUniqueLabel(this.stats.time.most.track.title) + '}\n';
			report += '\\end{figure}\n';
			report += '{\\LARGE Your most listened track was \\textbf{\\textit{' +
				this.stats.time.most.track.title.replace(latex, '\\$&') +
				'}} by \\textbf{\\textit{' +
				this.stats.time.most.track.artist.replace(latex, '\\$&') + '}}.}\\\\\n';
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
		}
		// Artists
		if (this.stats.artists.total > 0) {
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{part}{Artists statistics}\n';
			// Artist by Month
			if (this.stats.artists.byMonth.length) {
				wrappedData.artists.forEach((artist, i) => {
					const month = this.stats.artists.byMonth[i].month;
					const monthName = this.stats.artists.byMonth[i].monthName;
					if (i !== 0) { report += '\\pagebreak\n'; }
					else { report += '\\phantomsection\n\\addcontentsline{toc}{section}{Artists by Month}\n'; }
					report += '\\pagecolor{teal}\n';
					report += '\\clearpage \\vspace*{\\fill}\n';
					report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
					report += '\\begin{center}\n';
					report += '{\\Huge \\textbf{N\u00BA' + (i + 1) + '}}\\\\\n';
					report += '\\vspace{2mm}\n';
					report += '{\\Huge \\textbf{' + cut(artist.artist, 40) + '}}\n';
					report += '\\begin{figure}[H]\n';
					report += '\t\\centering\n';
					report += '\t\\setbox1=\\hbox{\\includegraphics[width=400px]{' +
						getImage('img\\month\\' + month + '.png') + '}}\n	';
					report += '\t\\includegraphics[width=400px]{' +
						getImage('img\\month\\' + month + '.png') +
						'}\\llap{\\makebox[\\wd1][c]{\\raisebox{150px}{\\cutpic{50px}{2pt}{100px}{' +
						getImage(wrappedData.artists[i].artistImg) +
						'}{Purple!90}}}}\n';
					report += '\t\\label{fig:' + getUniqueLabel(cut(wrappedData.artists[0].artist, 20)) + '}\n';
					report += '\\end{figure}\n';
					report += '{\\LARGE Month with more listens:\\\\\n';
					report += '\\textbf{' + monthName + '}}\n';
					report += '\\end{center}\n';
					report += '\\vfill %\n\n';
				});
			}
			report += '\\pagebreak\n';
			report += '\\pagecolor{teal!70}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\section[Your top 5 Artists]{Your top 5 Artists:}\n';
			enumerate(wrappedData, 'artists');
			// Total artists
			report += '\\pagebreak\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\begin{center}\n';
			report += '{\\Huge You didn\'t waste your time in ' + (year || period) + '...}\\\\\n';
			report += '\\vspace{15mm}\n';
			report += '{\\LARGE You have listened to \\textbf{\\textit{' + this.stats.artists.total + '}} artists.}\n';
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
			// Top artist
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{section}{Top Artist}\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.4,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getImage(wrappedData.artists[0].artistImg) + '}};\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\includegraphics[width=400px,height=800px,keepaspectratio]{' + getImage(wrappedData.artists[0].artistImg) + '}\n';
			report += '\t\\label{fig:' + getUniqueLabel(cut(wrappedData.artists[0].artist, 20)) + '}\n';
			report += '\\end{figure}\n';
			report += '\\vspace{5mm}\n';
			report += '\\begin{center}\n';
			report += '{\\Huge Your favorite artist has been \\textbf{\\textit{' + cut(wrappedData.artists[0].artist, 20) + '}} with \\textbf{\\textit{' + wrappedData.artists[0].listens + '}} listens and \\textbf{\\textit{' + this.stats.artists.top[0].tracks + '}} different tracks played ' + (year ? 'this year' : 'these years') + '.}\n\n';
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
			// Top artist's track
			report += '\\pagebreak\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.4,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getImage(wrappedData.artists[0].artistImg) + '}};\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\includegraphics[width=320px,height=320px]{' + getImage(this.stats.artists.top[0].topTrack.albumImg) + '}\n';
			report += '\t\\label{fig:' + getUniqueLabel(cutReplace(this.stats.artists.top[0].topTrack.title, 20)) + '}\n';
			report += '\\end{figure}\n';
			report += '\\vspace{10mm}\n';
			report += '\\begin{center}\n';
			report += '{\\LARGE Their most loved track for you has been \\textbf{\\textit{' + this.stats.artists.top[0].topTrack.title + '}} and you have played it \\textbf{\\textit{' + this.stats.artists.top[0].topTrack.listens + '}} times ' + (year ? 'this year' : 'these years') + '}';
			if (this.stats.artists.top[0].topTrack === wrappedData.tracks[0]) {
				report += '\\\\\n';
				report += '\\vspace{5mm}\n';
				report += '\\textbf{\\textit{\\LARGE It\'s also your overall most listened track ' + (year ? 'this year' : 'these years') + '!}}\n';
			} else {
				report += '\n';
			}
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
		}
		// Albums
		if (this.stats.albums.total > 0) {
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{part}{Albums statistics}\n';
			report += '\\pagebreak\n';
			report += '\\pagecolor{NavyBlue!70}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\section[Your top 5 Albums]{Your top 5 Albums:}\n';
			enumerate(wrappedData, 'albums');
			// Top album's track
			report += '\\pagebreak\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.4,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getImage(wrappedData.albums[0].artistImg) + '}};\n';
			report += '\\begin{center}\n';
			report += '{\\LARGE You have listened to \\textbf{\\textit{' + this.stats.albums.total + '}} different albums.}\n';
			report += '\\end{center}\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\includegraphics[width=320px,height=320px]{' + getImage(this.stats.albums.top[0].topTrack.albumImg) + '}\n';
			report += '\t\\label{fig:' + getUniqueLabel(cutReplace(this.stats.albums.top[0].album, 20)) + '}\n';
			report += '\\end{figure}\n';
			report += '\\vspace{10mm}\n';
			report += '\\begin{center}\n';
			report += '{\\LARGE And the most loved track from your top album has been \\textbf{\\textit{' + this.stats.albums.top[0].topTrack.title + '}}. You have played it \\textbf{\\textit{' + this.stats.albums.top[0].topTrack.listens + '}} times ' + (year ? 'this year' : 'these years') + '}';
			if (this.stats.artists.top[0].topTrack === wrappedData.tracks[0]) {
				report += '\\\\\n';
				report += '\\vspace{5mm}\n';
				report += '\\textbf{\\textit{\\LARGE It\'s also your overall most listened track ' + (year ? 'this year' : 'these years') + '!}}\n';
			} else {
				report += '\n';
			}
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
		}
		// Regions
		if (this.stats.countries.total > 0) {
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{part}{Region statistics}\n';
			report += '\\pagecolor{RawSienna!85}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\section[Your listens around the world]{Your listens around the world:}\n';
			report += '\\begin{enumerate}\n';
			wrappedData.countries.forEach((country) => {
				report += '\t\\item {\\Large\\textbf{\\textit{' + cut(country.name, 20) + '}} with \\textit{' + country.listens + ' listens}.}\n';
			});
			report += '\\end{enumerate}\n';
			report += '\\vspace{15mm}\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\setbox1=\\hbox{\\includegraphics[width=15cm]{img/map/worldmap_shapes}}\n';
			report += '\t\\includegraphics[width=15cm]{img/map/worldmap_shapes}';
			this.stats.countries.byISO.forEach((country) => {
				report += '\\llap{\\includegraphics[width=15cm]{img/map/' + country.iso + '}}';
			});
			report += '\n';
			report += '\\end{figure}\n';
			// Top Artist by Region
			report += '\\pagebreak\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\section[Top Artist from Country]{Top Artist from Country:}\n';
			enumerate(this.stats.countries.byArtist, 'countries');
		}
		// Sound City
		if (this.stats.cities.total > 0) {
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{section}{Sound Town}\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=1,inner sep=0pt] at (current page.center){\\includegraphics[width=500px]{img/soundcity/travel}};\n';
			report += '\\tikz[remember picture,overlay] \\node at (current page.45){\\raisebox{-40mm}{\\fontencoding{T1}\\fontfamily{qzc}\\fontshape{it}\\selectfont{\\Large ' + (year
				? topDay + ' ' + year + '\\hspace{' + (78 + Math.max(topDay.length - 10, 0) * 2)
				: period + '\\hspace{78'
			) + 'mm}}}};\n';
			report += '\\vspace{139mm}\n';
			report += '\\begin{center}\n';
			report += '{\\fontencoding{T1}\\fontfamily{qzc}\\fontshape{it}\\selectfont\n';
			report += '\t{\\Large ' + (year ? 'This year' : 'These years') + ', your listening took you places...\\\\\n';
			report += '\tAnd one place listened just like you.}\n';
			report += '}\n';
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
			report += '\\pagebreak\n';
			report += '\\clearpage \\vspace*{\\fill}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			report += '\\begin{center}\n';
			report += '{\\Huge \\textbf{' + wrappedData.cities[0].name + ', ' + wrappedData.cities[0].country + '}}\\\\\n';
			report += '\\vspace{7mm}\n';
			report += '\\begin{figure}[H]\n';
			report += '\t\\centering\n';
			report += '\t\\cutpic{10px}{4pt}{400px}{' + getImage(wrappedData.cities[0].img) + '}{RawSienna!95}\n';
			const artistsCity = wrappedData.cities[0].artists.length;
			if (artistsCity > 0) {
				const layout = artistsCity >= 3 ? ['l', 'c', 'r'] : artistsCity === 2 ? ['l', 'r'] : ['c'];
				layout.forEach((align, i) => {
					report += '\t\\llap{\\makebox[425px][' + align + ']{\\raisebox{-50px}{\\cutpic{10px}{3pt}{100px}{' + getImage(wrappedData.cities[0].artists[i].artistImg) + '}{RawSienna!85}}}}\n';
				});
			}
			report += '\\end{figure}\n';
			report += '\\vspace{7mm}\n';
			if (artistsCity > 0) {
				const topArtistCity = wrappedData.cities[0].artists.slice(0, this.settings.cityArtistSlice)
					.map((data) => '\\textbf{\\textit{' + data.artist.replace(latex, '\\$&') + '}}')
					.joinLast(', ', ' or ');
				report += '{\\LARGE Some of your favorite artists, like ' + topArtistCity + ', were born here.}\n';
			}
			report += '\\end{center}\n';
			report += '\\vfill %\n\n';
		}
		// Moods, BPM and Keys
		const bMoods = ['calm', 'energetic', 'happy', 'sad'].some((key) => this.stats.moods[key].listens > 0);
		const bBpms = wrappedData.bpms.length && this.stats.bpms.histogram.length > 1;
		const bKeys = wrappedData.keys.length && this.stats.keys.histogram.length > 1;
		if (bMoods || bBpms || bKeys) {
			report += '\\pagebreak\n';
			report += '\\phantomsection\n';
			report += '\\addcontentsline{toc}{part}{Mood, BPM and Key statistics}\n';
			report += '\\pagecolor{Orchid}\n';
			report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
			if (bMoods) {
				const x = round(- 8.25 * Math.max(1 - this.stats.moods.sad.listens / this.stats.moods.happy.listens, -1), 2);
				const y = round(- 8.25 - 8.25 * Math.max(1 - this.stats.moods.energetic.listens / this.stats.moods.calm.listens, -1), 2);
				report += '\\section[Mood statistics]{Mood statistics:}\n';
				report += '\\vspace{20mm}\n';
				report += '\\begin{center}\n';
				report += '\t\\begin{tikzpicture}[node distance={45mm},minimum size=1.5cm,main/.style = {draw,circle,general shadow={fill=Black!60,shadow xshift=3pt,shadow yshift=-3pt,fill opacity=0.55}}]\n';
				report += '\t\t\\node[main,scale=2,align=center,fill=Goldenrod,fill opacity=0.75] (1) {Energ.};\n';
				report += '\t\t\\node[main,scale=2,align=center,fill=WildStrawberry!75,fill opacity=0.75] (2) [below left of=1]{Happy};\n';
				report += '\t\t\\node[main,scale=2,align=center,fill=teal!75,fill opacity=0.75] (3) [below right of=1]{Sad};\n';
				report += '\t\t\\node[main,scale=2,align=center,fill=YellowGreen,fill opacity=0.75] (4) [below right of=2]{Calm};\n';
				report += '\t\t\\node[main,scale=0.5,fill=White!75,align=center,fill opacity=0.85] (5) [below of=1,xshift=' + x + 'cm,yshift=' + y + 'cm]{};\n';
				report += '\t\t\\draw[-] (1.south) -- (4.north);\n';
				report += '\t\t\\draw[-] (2.east) -- (3.west);\n';
				report += '\t\\end{tikzpicture}\n';
				report += '\t\\vspace{20mm}\\\\\n';
				report += '\t{\\Huge Music you love is usually associated to ' +
					'{\\color{' + (x > 0 ? 'teal!75!black!100' : 'WildStrawberry!100!white!80') + '}' +
					'\\textbf{\\textit{' + (x > 0 ? 'Sad' : 'Happy') + '}}}' +
					' and {\\color{' + (y > -8.25 ? 'Goldenrod!70' : 'YellowGreen!100!white!50') + '}' +
					'\\textbf{\\textit{' + (y > -8.25 ? 'Energetic' : 'Calm') + '}}} moods.}\n';
				report += '\\end{center}\n\n';
			}
			if (bBpms) {
				if (bMoods) {
					report += '\\pagebreak\n';
					report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
				}
				report += '\\section[BPM statistics]{BPM statistics:}\n';
				report += '\\vspace{20mm}\n';
				report += '\\begin{center}\n';
				report += '\\hfuzz=20pt\n';
				report += '\t\\begin{tikzpicture}\n';
				report += '\t\t\\tikzstyle{every node}=[font=\\Large]\n';
				report += '\t\t\\begin{axis} [ybar,width=\\textwidth,xmin=' + this.stats.bpms.histogram[0].x + ',xmax=' + this.stats.bpms.histogram.slice(-1)[0].x + ',ymin=0,ylabel={Listens},xlabel={BPM},ytick pos=left,xtick pos=bottom,axis x line*=bottom,axis y line*=left,bar shift=0pt]\n';
				report += '\t\t\t\\addplot[fill opacity=0.8,BlueViolet,fill=SeaGreen!80!black!40] coordinates {\n';
				this.stats.bpms.histogram.forEach((point) => {
					if (point.x < this.stats.bpms.low.val) {
						report += '\t\t\t\t(' + point.x + ',' + point.y + ')\n';
					}
				});
				report += '\t\t\t};\n';
				report += '\t\t\t\\addplot[fill opacity=0.8,BurntOrange!40!black,fill=VioletRed!80] coordinates {\n';
				this.stats.bpms.histogram.forEach((point) => {
					if (point.x >= this.stats.bpms.low.val && point.x <= this.stats.bpms.high.val) {
						report += '\t\t\t\t(' + point.x + ',' + point.y + ')\n';
					}
				});
				report += '\t\t\t};\n';
				report += '\t\t\t\\addplot[fill opacity=0.8,yellow!40!black,fill=Goldenrod!65] coordinates {\n';
				this.stats.bpms.histogram.forEach((point) => {
					if (point.x > this.stats.bpms.high.val) {
						report += '\t\t\t\t(' + point.x + ',' + point.y + ')\n';
					}
				});
				report += '\t\t\t};\n';
				report += '\t\t\\end{axis}\n';
				report += '\t\\end{tikzpicture}\n';
				report += '\t\\vspace{10mm}\\\\\n';
				report += '\t{\\Huge You usually listen to music with a BPM around {\\color{' +
					(
						this.stats.bpms.mean.val < this.stats.bpms.low.val
							? 'SeaGreen!80!black!40'
							: this.stats.bpms.mean.val > this.stats.bpms.high.val
								? 'Goldenrod!65'
								: 'VioletRed!80'
					) +
					'}\\textbf{\\textit{' + this.stats.bpms.mean.val + '} beats/min}}, with up to \\textbf{\\textit{' + this.stats.bpms.mean.listens + '}} listened tracks ' + (year ? 'this year' : 'these years') + '.}\n';
				report += '\t\\vspace{10mm}\\\\\n';
				report += '\t{\\LARGE ' + (this.stats.bpms.high.listens > this.stats.bpms.low.listens
					? '{\\color{Goldenrod!65}\\textbf{Light and Ubpeat}} tracks are your thing, with {\\color{Goldenrod!65}\\textbf{\\textit{' + this.stats.bpms.high.listens + '} High BPM}} listens on your record.'
					: '{\\color{SeaGreen!80!black!40}\\textbf{Calm and Slow}} tracks are your thing, with {\\color{SeaGreen!80!black!40}\\textbf{\\textit{' + this.stats.bpms.low.listens + '} Low BPM}} listens on your record.'
				) + '}\n';
				report += '\\end{center}\n\n';
			}
			if (bKeys) {
				if (bMoods || bBpms) {
					report += '\\pagebreak\n';
					report += '\\tikz[remember picture,overlay] \\node[opacity=0.1,inner sep=0pt] at (current page.center){\\includegraphics[width=\\paperwidth,height=\\paperheight]{' + getBgImg(root) + '}};\n';
				}
				report += '\\section[Key statistics]{Key statistics:}\n';
				report += '\\vspace{20mm}\n';
				report += '\\begin{center}\n';
				report += '\t\\begin{tikzpicture}\n';
				report += '\t\t\\tikzstyle{every node}=[font=\\Huge]\n';
				let toAddReport = '';
				const toAddColors = [];
				{
					const colors = ['Rhodamine', 'Purple', 'Violet', 'RoyalBlue', 'SkyBlue', 'SeaGreen', 'Green!75', 'GreenYellow', 'Yellow', 'Orange', 'Red', 'RedViolet!75'];
					const noKeyListens = Math.round((this.stats.listens.total - wrappedData.keys.reduce((prev, curr) => prev + curr.listens, 0)) / this.stats.listens.total * 100);
					const labels = this.stats.keys.histogram.length;
					const percentages = this.stats.keys.histogram.map((point) => Math.round(point.y / this.stats.listens.total * 100));
					let rest = 0;
					percentages.forEach((perc) => { if (perc < 8) { rest += perc; } });
					// Add rounding errors
					const offset = 100 - percentages.reduce((prev, curr) => prev + curr, 0) - noKeyListens;
					if (offset !== 0) {
						if (rest) { rest += offset; }
						else {
							percentages.some((perc, i) => {
								if (perc > 10) {
									percentages[i] += offset;
									return true;
								}
							});
						}
					}
					this.stats.keys.histogram.forEach((point, j) => {
						const perc = percentages[j];
						if (perc >= 8) {
							toAddReport += '\t\t\t' + perc + '/' + point.x + 'd|m' + (noKeyListens || rest > 0 || (labels - 1 !== j) ? ',' : '') + '\n';
							toAddColors.push(colors[j]);
						}
					});
					if (rest) {
						toAddReport += '\t\t\t' + rest + '/Rest' + (noKeyListens ? ',' : '') + '\n';
						toAddColors.push('Gray');
					}
					if (noKeyListens) {
						toAddReport += '\t\t\t' + noKeyListens + '/No Key\n';
						toAddColors.push('White');
					}
				}
				report += '\t\t\\pie[rotate=90,change direction,radius=6,explode=0.3,text=pin,font=\\Huge,scale font,color={' + toAddColors.join(', ') + '},/tikz/nodes={text opacity=0.75,overlay},fill opacity=0.75]{\n';
				report += toAddReport;
				report += '\t\t};\n';
				report += '\t\\end{tikzpicture}\n';
				report += '\t\\vspace{20mm}\\\\\n';
				report += '\t{\\Huge ' + (this.stats.keys.major.listens > this.stats.keys.minor.listens
					? 'Most music you like is usually played in Major scales. You played \\textbf{\\textit{' + this.stats.keys.major.listens + '}} tracks like this.'
					: 'Most music you like is usually played in Minor scales. You played  \\textbf{\\textit{' + this.stats.keys.minor.listens + '}} tracks like this.'

				) + '}\n';
				report += '\\end{center}\n\n';
			}
		}
		// End
		report += '\n';
		report += '\\end{document}';
		return report;
	},
	/**
	 * Compiles a report from {@link wrapped.formatLatexReport} into PDF.
	 *
	 * @property
	 * @name compileLatexReport
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {string} report - LaTeX formatted text from {@link wrapped.formatLatexReport}
	 * @param {number|string} timePeriod - Used for formatting purposes
	 * @param {string?} latexCmd - Command used to convert LaTeX files to PDF format
	 * @param {string[]?} extraCmd - Commands applied to output pdf
	 * @param {string?} root - Optional parameter that specifies the root directory for the report
	 * @returns {boolean}
	 */
	compileLatexReport: function compileLatexReport(report, timePeriod, latexCmd, extraCmd, root = this.basePath) {
		console.log('Wrapped: compiling LaTeX report...');
		const period = !timePeriod
			? this.stats.time.first.date.getFullYear().toString() + '_' + this.stats.time.last.date.getFullYear().toString()
			: null;
		// Save report
		const fileName = 'Wrapped_' + (timePeriod || period);
		const input = root + fileName + '.tex';
		const output = root + fileName + '.pdf';
		const parseCmd = (cmd) => cmd.replace(/%1/gi, _q(input))
			.replace(/%2/gi, _q(output))
			.replace(/%3/gi, _q(root.replace(/\\$/, '')))
			.replace(/%4/gi, (timePeriod || period));
		console.log('Wrapped: saving .tex file to\n\t ' + input);
		_recycleFile(input, true);
		_save(input, report, false);
		// Parse cmd
		if (!latexCmd || !latexCmd.length) {
			latexCmd = 'lualatex --enable-installer --interaction=nonstopmode --jobname=Wrapped_%4 --output-directory=%3 %1';
		}
		latexCmd = parseCmd(latexCmd);
		console.log('Wrapped: processing latex\n\t ' + latexCmd);
		if (latexCmd.includes('lualatex')) {
			console.log('Wrapped: double compilation required');
			_runCmd(latexCmd, true);
		}
		_runCmd(latexCmd, true);
		if (_isFile(output)) { this.compressPDF(output); }
		if (_isFile(output)) {
			if (extraCmd && extraCmd.length) { extraCmd.filter(Boolean).forEach((cmd) => _runCmd(parseCmd(cmd), true)); }
			_recycleFile(root + fileName + '.aux', true);
			_recycleFile(root + fileName + '.log', true);
			console.log('Wrapped: opening .pdf file at\n\t ' + output);
			_run(output);
			return true;
		}
		return false;
	},
	/**
	 * Used to generate a HTML IE-compatible report for a specific year.
	 *
	 * @property
	 * @name createHtmlIeReport
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ timePeriod?: number; timeKey?: string; fromDate?: Date; query?: string; latexCmd?: string; extraCmd:string[]; root?: string }} { timePeriod, timeKey, fromDate, query, latexCmd, extraCmd, root }
	 * @returns {any}
	*/
	createHtmlIeReport: function ({ timePeriod, timeKey = null, fromDate = null, query = '', extraCmd = [], root = this.basePath }) {
		if (this.settings.bOffline) { console.log('Wrapped: offline mode'); }
		this.cleanRoot(root);
		this.copyDependencies(root);
		return this.getData(timePeriod, query, timeKey, fromDate)
			.then((wrappedData) => this.getDataImages(wrappedData))
			.then((wrappedData) => {
				this.cleanExif();
				this.compressImgs();
				return this.formatHtmlIeReport(wrappedData, timePeriod, root);
			})
			.then((report) => this.compileHtmlIeReport(report, timePeriod, extraCmd, root));
	},
	/**
	 * Gives format in HTML IE-compatible to data retrieved {@link wrapped.getData} for a given year
	 *
	 * @property
	 * @name formatHtmlIeReport
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ genres: {genre:string, listens:number}[]; tracks: {title:string, listens:number, artist:string, handle:FbMetadbHandle[]?, albumImg:string?}[]; artists: {artist:string, listens:number}[]; bpms: {bpm:number, listens:number}[]; keys: {key:{hour:number, letter:string}, openKey:string, stdKey: string, listens:number}[]; moods: {mood:string, listens:number}[]; cities: {city:string, listens:number, artists:{artist:string, listens:number}[]}[]; countries: {name:string, listens:number}[]; albums: {album:string, listens:number}[] }} wrappedData - Data from {@link wrapped.getData}
	 * @param {number} year - Used for formatting purposes
	 * @param {?string} root - Optional parameter that specifies the root directory for the report
	 * @returns {string}
	*/
	formatHtmlIeReport: function (wrappedData, year, root = this.basePath) {
		console.log('Wrapped: creating HTML IE-compatible report...');
		// Report
		console.log(this.stats);
		console.log(wrappedData);
		console.log(wrappedData);
		return { data: wrappedData, stats: this.stats };
	},
	/**
		 * Compiles a report from {@link wrapped.formatHtmlIeReport} into HTML IE-compatible.
		 *
		 * @property
		 * @name compileHtmlIeReport
		 * @kind method
		 * @memberof wrapped
		 * @type {function}
		 * @param {string} report - LaTeX formatted text from {@link wrapped.formatLatexReport}
		 * @param {number|string} timePeriod - Used for formatting purposes
		 * @param {string[]?} extraCmd - Commands applied to output pdf
		 * @param {string?} root - Optional parameter that specifies the root directory for the report
		 * @returns {boolean}
		 */
	compileHtmlIeReport: function compileLatexReport(report, timePeriod, extraCmd, root = this.basePath) {
		console.log('Wrapped: compiling HTML IE-compatible report...');
		const period = !timePeriod
			? this.stats.time.first.date.getFullYear().toString() + '_' + this.stats.time.last.date.getFullYear().toString()
			: null;
		// Save report
		const fileName = 'Wrapped_' + (timePeriod || period);
		const data = root + fileName + '.js';
		const output = root + fileName + '.html';
		const parseCmd = (cmd) => cmd.replace(/%1/gi, _q(output))
			.replace(/%2/gi, _q(output))
			.replace(/%3/gi, _q(root.replace(/\\$/, '')))
			.replace(/%4/gi, (timePeriod || period));
		_save(data, JSON.stringify(report, null, '\t').replace(/\n/g, '\r\n'), false);
		// Parse cmd
		if (_isFile(output)) {
			if (extraCmd && extraCmd.length) { extraCmd.filter(Boolean).forEach((cmd) => _runCmd(parseCmd(cmd), true)); }
			console.log('Wrapped: opening .html file at\n\t ' + output);
			utils.ShowHtmlDialog(0, 'file://' + output);
			return true;
		}
		return false;
	},
	/**
	 * Used to generate a JSON report for a specific year.
	 *
	 * @property
	 * @name createJsonReport
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ timePeriod?: number; timeKey?: string; fromDate?: Date; query?: string; latexCmd?: string; extraCmd:string[]; root?: string }} { timePeriod, timeKey, fromDate, query, latexCmd, extraCmd, root }
	 * @returns {any}
	*/
	createJsonReport: function ({ timePeriod, timeKey = null, fromDate = null, query = '', extraCmd = [], root = this.basePath }) {
		if (this.settings.bOffline) { console.log('Wrapped: offline mode'); }
		this.cleanRoot(root);
		this.copyDependencies(root);
		return this.getData(timePeriod, query, timeKey, fromDate)
			.then((wrappedData) => this.getDataImages(wrappedData))
			.then((wrappedData) => {
				this.cleanExif();
				this.compressImgs();
				return this.formatJsonReport(wrappedData, timePeriod, root);
			})
			.then((report) => this.compileJsonReport(report, timePeriod, extraCmd, root));
	},
	/**
	 * Gives format in JSON to data retrieved {@link wrapped.getData} for a given year
	 *
	 * @property
	 * @name formatJsonReport
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {{ genres: {genre:string, listens:number}[]; tracks: {title:string, listens:number, artist:string, handle:FbMetadbHandle[]?, albumImg:string?}[]; artists: {artist:string, listens:number}[]; bpms: {bpm:number, listens:number}[]; keys: {key:{hour:number, letter:string}, openKey:string, stdKey: string, listens:number}[]; moods: {mood:string, listens:number}[]; cities: {city:string, listens:number, artists:{artist:string, listens:number}[]}[]; countries: {name:string, listens:number}[]; albums: {album:string, listens:number}[] }} wrappedData - Data from {@link wrapped.getData}
	 * @returns {object}
	*/
	formatJsonReport: function (wrappedData) {
		console.log('Wrapped: creating HTML IE-compatible report...');
		return { data: wrappedData, stats: this.stats };
	},
	/**
		 * Compiles a report from {@link wrapped.formatHtmlIeReport} into JSON.
		 *
		 * @property
		 * @name compileJsonReport
		 * @kind method
		 * @memberof wrapped
		 * @type {function}
		 * @param {string} report - LaTeX formatted text from {@link wrapped.formatLatexReport}
		 * @param {number|string} timePeriod - Used for formatting purposes
		 * @param {string[]?} extraCmd - Commands applied to output pdf
		 * @param {string?} root - Optional parameter that specifies the root directory for the report
		 * @returns {boolean}
		 */
	compileJsonReport: function compileLatexReport(report, timePeriod, extraCmd, root = this.basePath) {
		console.log('Wrapped: compiling JSON report...');
		const period = !timePeriod
			? this.stats.time.first.date.getFullYear().toString() + '_' + this.stats.time.last.date.getFullYear().toString()
			: null;
		// Save report
		const fileName = 'Wrapped_' + (timePeriod || period);
		const output = root + fileName + '.json';
		const parseCmd = (cmd) => cmd.replace(/%1/gi, _q(output))
			.replace(/%2/gi, _q(output))
			.replace(/%3/gi, _q(root.replace(/\\$/, '')))
			.replace(/%4/gi, (timePeriod || period));
		_save(output, JSON.stringify(report, null, '\t').replace(/\n/g, '\r\n'), false);
		// Parse cmd
		if (_isFile(output)) {
			if (extraCmd && extraCmd.length) { extraCmd.filter(Boolean).forEach((cmd) => _runCmd(parseCmd(cmd), true)); }
			console.log('Wrapped: opening .json file at\n\t ' + output);
			_run(output);
			return true;
		}
		return false;
	},
	/**
	 * Copies all dependencies required to create the report to temp folder
	 *
	 * @property
	 * @name copyDependencies
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {?string} root - Optional parameter that specifies the root directory for the report
	 */
	copyDependencies: function (root = this.basePath) {
		// Copy dependencies
		if (!_isFolder(root)) { _createFolder(root); }
		['bg', 'char', 'genres', 'month', 'burger', 'soundcity', 'map', 'fallback'].forEach((folder) => {
			const path = root + 'img\\' + folder + '\\';
			if (!_isFolder(path)) {
				_createFolder(path);
				const files = getFiles(
					folders.xxx + (folder === 'map'
						? 'helpers-external\\countries-mercator\\'
						: 'images\\wrapped\\' + folder + '\\'
					), new Set(['.jpg', '.jpeg', '.png'])
				);
				files.forEach((file) => _copyFile(file, path + file.split('\\').slice(-1)[0], true));
			}
		});
	},
	/**
	 * Cleans temp folder (but not dependencies)
	 *
	 * @property
	 * @name cleanRoot
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {?string} root - Optional parameter that specifies the root directory for the report
	 */
	cleanRoot: function (root = this.basePath) {
		const folders = this.settings.bOffline
			? ['img\\albums']
			: ['img\\albums', 'img\\artists'];
		folders.forEach((folder) => _deleteFolder(root + folder));
	},
	/**
	 * Cleans exif data from all images on temp folder, requires exiftool to be present at 'helpers-external\exiftool', otherwise it is skipped.
	 *
	 * See {@link https://exiftool.org}
	 *
	 * @property
	 * @name cleanExif
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {?string} root - Optional parameter that specifies the root directory for the report
	 */
	cleanExif: function (root = this.basePath) {
		const exifTool = folders.xxx + 'helpers-external\\exiftool\\exiftool.exe';
		if (_isFile(exifTool)) {
			const command = ' -overwrite_original -r -ext jpg -ext gif -ext png -EXIF= ' + _q(root + 'img');
			console.log('Wrapped: processing images with exiftool\n\texiftool.exe ' + command);
			_runCmd('CMD /C ' + _q(exifTool) + command, false);
		}
	},
	/**
	 * Compress all images on temp folder, requires pingo to be present at 'helpers-external\pingo', otherwise it is skipped.
	 *
	 * See {@link https://css-ig.net}
	 *
	 * @property
	 * @name compressImgs
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {?string} root - Optional parameter that specifies the root directory for the report
	 */
	compressImgs: function (root = this.basePath) {
		const pingo = folders.xxx + 'helpers-external\\pingo\\pingo.exe';
		if (_isFile(pingo)) {
			console.log('Wrapped: processing images with pingo\n\tpingo.exe -quiet ' + _q(root + 'img\\'));
			_runCmd('CMD /C ' + _q(pingo) + ' -quiet ' + _q(root + 'img\\albums'), false);
			_runCmd('CMD /C ' + _q(pingo) + ' -quiet ' + _q(root + 'img\\artists'), false);
			_runCmd('CMD /C ' + _q(pingo) + ' -quiet ' + _q(root + 'img\\bg'), false);
			_runCmd('CMD /C ' + _q(pingo) + ' -quiet ' + _q(root + 'img\\char'), false);
		}
	},
	/**
	 * Compress pdf output, requires ghostscript to be present at 'helpers-external\ghostscript', otherwise it is skipped.
	 *
	 * See {@link https://ghostscript.com/releases/gsdnld.html}
	 *
	 * @property
	 * @name compressPDF
	 * @kind method
	 * @memberof wrapped
	 * @type {function}
	 * @param {?string} root - Optional parameter that specifies the root directory for the report
	 */
	compressPDF: function (input) {
		const ghostscript = [
			folders.xxx + 'helpers-external\\ghostscript\\gswin64c.exe',
			folders.xxx + 'helpers-external\\ghostscript\\gswin32c.exe'
		];
		ghostscript.some((gs) => {
			if (_isFile(gs)) {
				const command = ' -dCompatibilityLevel=1.5 -dAutoRotatePages=/None -dQUIET -sDEVICE=pdfwrite -o ' + _q(input + '_') + ' ' + _q(input);
				console.log('Wrapped: processing pdf with ghostscript\n\t ' + gs.split('\\').pop() + command);
				_runCmd('CMD /C ' + _q(gs) + command, true);
				if (_isFile(input + '_')) {
					_copyFile(input + '_', input);
					_deleteFile(input + '_', true);
				}
				return _isFile(input);
			}
		});
	}
};