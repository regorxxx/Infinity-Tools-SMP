'use strict';
//28/09/26

/* exported _downloader */

include('..\\..\\helpers\\helpers_xxx.js');
/* global globSettings:readable */
// helpers\\helpers_xxx_prototypes.js;
/* global isFunction:readable, isFbMetadbHandle:readable, clone:readable, smartCut:readable */
// helpers\\helpers_xxx_file.js;
/* global _isFile:readable, _foldPath:readable, getFiles:readable, _jsonParse:readable, _isFolder:readable, _createFolder:readable, imgAllowedExt:readable */
include('..\\..\\helpers\\helpers_xxx_web.js');
/* global downloadFileV3:readable, send:readable, HTMLFile:readable */

/**
 * Web downloader with built-in sources.
 *
 * @constructor
 * @name _downloader
 * @param {object} o - argument
 * @param {Boolean} [o.bAutomatic] - Flag for automatic downloads.
 * @param {Callbacks} [o.callbacks] - Panel callbacks related settings.
 */
function _downloader({ } = {}) { // eslint-disable-line no-empty-pattern
	const htmlDoc = new HTMLFile();
	/**
	 * @typedef {{name: string, type: 'img'|'text'|'url'|'other', method: string, num: number, maxNum: number, enabled: boolean}} SOURCE
	 */
	/**
	 * Available web sources
	 *
	 * @constant
	 * @name sources
	 * @kind variable
	 * @memberof _downloader.constructor
	 * @type {SOURCE[]}
	 */
	const sources = [
		{ name: 'Wikimedia', type: 'url', method: 'searchWikimArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Wikimedia', type: 'img', method: 'downloadWikimImgArtist', from: 'getWikimImgArtist', num: 1, maxNum: 1, enabled: true, downloader: 'utils' },
		{ name: 'Last.fm', type: 'img', method: 'downloadLastfmImgsArtist', num: Infinity, maxNum: Infinity, enabled: true, downloader: 'utils' },
		{ name: 'Deezer', type: 'url', method: 'searchDeezerArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Deezer', type: 'img', method: 'downloadDeezerImgArtist', from: 'getDeezerImgArtist', num: 1, maxNum: 1, enabled: true, downloader: 'utils' },
		{ name: 'Deezer', type: 'other', method: 'downloadDeezerDataArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Qobuz', type: 'url', method: 'searchQobuzArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Qobuz', type: 'img', method: 'downloadQobuzImgArtist', from: 'getQobuzImgArtist', num: 1, maxNum: 1, enabled: true, downloader: 'utils' },
		{ name: 'Qobuz', type: 'other', method: 'downloadQobuzDataArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Album of the Year', type: 'url', method: 'searchAotyArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Album of the Year', type: 'img', method: 'downloadAotyImgArtist', from: 'getAotyImgArtist', num: 1, maxNum: 1, enabled: true, downloader: 'utils' },
		{ name: 'Album of the Year', type: 'other', method: 'downloadAotyDataArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'TheAudioDB', type: 'url', method: 'searchTadbArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'TheAudioDB', type: 'img', method: 'downloadTadbImgArtist', from: 'getTadbImgArtist', num: Infinity, maxNum: Infinity, enabled: true, downloader: 'utils' },
		{ name: 'TheAudioDB', type: 'other', method: 'downloadTadbDataArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'SONGLYRICS', type: 'url', method: 'searchSonglyrArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'SONGLYRICS', type: 'img', method: 'downloadSonglyrImgArtist', from: 'getSonglyrImgArtist', num: 1, maxNum: 1, enabled: true, downloader: 'utils' },
		{ name: 'SONGLYRICS', type: 'other', method: 'downloadSonglyrDataArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Encyclopaedia Metallum', type: 'url', method: 'searchEncyMetArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Encyclopaedia Metallum', type: 'img', method: 'downloadEncyMetImgArtist', from: 'getEncyMetImgArtist', num: 1, maxNum: 1, enabled: true, downloader: 'utils' },
		{ name: 'Encyclopaedia Metallum', type: 'other', method: 'downloadEncyMetDataArtist', num: 1, maxNum: 1, enabled: true },
		{ name: 'Local', type: 'img', method: null, num: Infinity, maxNum: Infinity, enabled: true }
	];
	/**
	 * @typedef {{url: string, file: string, ext: string, path?: string, downloadPath?: string, downloaded?: boolean, exists?: boolean, forcedDownload: boolean, md5?: string}} URL - URL object
	 */
	/**
	 * @typedef {{ id: string, nameId: string|null, name: string, url:string, artUrl: string, data: any }} ARTISTURL - Artist page URL object
	 */
	/** @type {ARTISTURL} Default artist page URL object */
	const ARTISTURL = { id: '', nameId: null, name: '', url: '', artUrl: '', biography: '', data: null };
	/**
	 * @typedef {{ id: string, nameId: string|null, name: string, type: string[], year: number|null, date: Date|null, digitalDate: Date|null, physicalDate: Date|null, tracks: string[]|null, url:string, artUrl: string, rating: number|null, data: any }} ALBUMDATA - Album data object
	 */
	/** @type {ALBUMDATA} Default album data object */
	const ALBUMDATA = { id: '', nameId: null, name: '', type: [], year: null, date: null, digitalDate: null, physicalDate: null, tracks: null, url: '', artUrl: '', rating: null, data: null };
	/**
	 * @typedef {{id: string, nameId: string|null, name: string, popularity: number|null, url:string, artUrl: string, biography: string, similarArtists: ARTISTURL[]|null, albums: ALBUMDATA[]|null, data: any}} ARTISTDATA - Artist data object
	 */
	/** @type {ARTISTDATA} Default artist data object */
	const ARTISTDATA = { ...ARTISTURL, biography: '', similarArtists: null, albums: null, data: null };
	/**
	 * Retrieves default settings
	 * @property
	 * @name defaults
	 * @kind method
	 * @memberof _downloader
	 * @type {function}
	 * @param {Boolean?} bCallbacks - [=false]
	 * @returns {object}
	 */
	this.defaults = _downloader.defaults;
	/**
	 * Retrieves available web sources
	 *
	 * @method
	 * @name getSources
	 * @kind method
	 * @memberof _downloader
	 * @param {string[]} type
	 * @returns {SOURCE[]}
	 */
	this.getSources = (type) => {
		return clone(
			type
				? sources.filter((s) => type.includes(s.type) && s.name !== 'Local')
				: sources
		);
	};
	/**
	 * Retrieve specific source by name and type
	 *
	 * @method
	 * @name getSource
	 * @kind method
	 * @memberof _downloader
	 * @param {SOURCE['name']} name
	 * @param {SOURCE['type']} type
	 * @returns {SOURCE}
	 */
	this.getSource = (name, type) => {
		return sources.find((s) => s.name.toLowerCase() === name.toLowerCase() && s.type === type);
	};
	/**
	 * Creates an failed URL object
	 *
	 * @method
	 * @name failedUrl
	 * @kind method
	 * @memberof _downloader
	 * @param {Object?} o
	 * @param {string?} o.url
	 * @param {key?} o.key
	 * @param {string?} o.path
	 * @param {string?} o.md5
	 * @returns {URL}
	 */
	this.failedUrl = ({ url = null, path = null, key = null, md5 = null } = {}) => {
		return { url, key, file: null, ext: null, path: path ? _foldPath(path) : null, downloadPath: null, exists: false, forcedDownload: false, md5 };
	};
	/**
	 * Downloads imgs from all available sources for given artist
	 *
	 * @method
	 * @name downloadAllImgsArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<{source: SOURCE, url: URL }[]>}
	 */
	this.downloadAllImgsArtist = (handleOrKey, path) => {
		const sources = this.getSources(['img']).filter((s) => s.enabled);
		return Promise.serial(sources, (s) => this[s.method](handleOrKey, path), 25)
			.then((results) => results.map((r, i) => { return { source: sources[i], url: r }; }));
	};
	/**
	 * Downloads imgs from specified sources for given artist
	 *
	 * @method
	 * @name downloadImgsArtistFrom
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @param {string[]} sourceNames
	 * @returns {Promise.<{source: SOURCE, url: URL }[]>}
	 */
	this.downloadImgsArtistFrom = (handleOrKey, path, sourceNames) => {
		const sources = this.getSources(['img']).filter((s) => sourceNames.includes(s.name));
		return Promise.serial(sources, (s) => this[s.method](handleOrKey, path), 25)
			.then((results) => results.map((r, i) => { return { source: sources[i], url: r }; }));
	};
	/**
	 * Retrieves Wikimedia Commons basic data + urls for given artist
	 *
	 * @method
	 * @name searchWikimArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<ARTISTURL>}
	 */
	this.searchWikimArtist = (key) => {
		const source = this.getSource('Wikimedia', 'url');
		const md5 = this.getUrlMd5(key, 'dummy', source);
		const url = 'https://commons.wikimedia.org/w/index.php?search=' + encodeURIComponent(key) + '&title=Special:MediaSearch&go=Go&type=image';
		return source.enabled && !this.urlDone(md5)
			? send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['user-agent', globSettings.userAgent],
					['referer', 'commons.wikimedia.org']
				],
				URL: url
			})
				.then((response) => {
					const match = (response.match(/(?:data-src=|thumburl":)"(https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+?\.(jpg|png|webp))/mi) || [null, null, null]);
					if (match[1] && match[2]) {
						const artUrl = match[1].replace('thumb/', '').replace('thumb.', 'upload.');
						return {
							...ARTISTURL,
							name: key,
							artUrl
						};
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + url);
					return this.failedUrl({ md5, key });
				})
				.finally(() => htmlDoc.close())
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Gets a single img url for given artist from Wikimedia Commons
	 *
	 * @method
	 * @name getWikimImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<URL>}
	 */
	this.getWikimImgArtist = (key) => {
		return this.searchWikimArtist(key)
			.then((result) => {
				// Create new one based on artist info
				const file = utils.MD5(key + result.id + 'Wikimedia' + result.artUrl.split('/').at(-1));
				const ext = '.' + result.artUrl.split('.').at(-1);
				return { url: result.artUrl, file: file + ext, ext };
			});
	};
	/**
	 * Downloads a single img for given artist from Wikimedia Commons
	 *
	 * @method
	 * @name downloadWikimImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<string|null>}
	 */
	this.downloadWikimImgArtist = (handleOrKey, path) => {
		const key = this.getArtistKey(handleOrKey);
		return this.downloadWikimImg(key, path);
	};
	/**
	 * Downloads a single img for given term from Wikimedia Commons
	 *
	 * @method
	 * @name downloadWikiImg
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadWikimImg = (key, path) => {
		const source = this.getSource('wikimedia', 'img');
		return this.downloadImgFrom(key, source, path);
	};
	/**
	 * Retrieves Deezer basic data + urls for given artist
	 *
	 * @method
	 * @name searchDeezerArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<ARTISTURL>}
	 */
	this.searchDeezerArtist = (key) => {
		const source = this.getSource('deezer', 'url');
		const md5 = this.getUrlMd5(key, 'dummy', source);
		const url = 'https://www.deezer.com/search/' + encodeURIComponent(key);
		return source.enabled && !this.urlDone(md5)
			? send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['user-agent', globSettings.userAgent],
					['referer', 'https://deezer.com']
				],
				URL: url
			})
				.then((response) => {
					const div = htmlDoc.parse(response);
					const list = div.getElementsByTagName('script');
					if (!list || !list.length) { console.log(source.name + ' artist search: ' + key + ': none found'); return null; }
					const scriptKey = 'window.__DZR_APP_STATE__ = ';
					for (let node of list) {
						if (node.innerText.startsWith(scriptKey)) {
							const results = _jsonParse(node.innerText.replace(scriptKey, ''));
							if (!results) { throw new Error('Error parsing DZR_APP_STATE'); }
							const top = results.TOP_RESULT[0];
							return {
								...ARTISTURL,
								id: top.ART_ID,
								name: top.ART_NAME,
								url: 'https://www.deezer.com/en/artist/' + top.ART_ID,
								artUrl: 'https://cdn-images.dzcdn.net/images/artist/' + top.ART_PICTURE + '/1800x1800-000000-100-0-0.jpg',
								data: { popularity: top.NB_FAN }
							};
						}
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + url);
					return this.failedUrl({ md5, key });
				})
				.finally(() => htmlDoc.close())
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Gets a single img url for given artist from Deezer
	 *
	 * @method
	 * @name getDeezerImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<URL>}
	 */
	this.getDeezerImgArtist = (key) => {
		return this.searchDeezerArtist(key)
			.then((result) => {
				// Extract server md5 from url or create new one based on artist info
				const file = (new RegExp(/artist\/([a-f0-9]{32})\//i).exec(result.artUrl) || [])[1] || utils.MD5(key + result.id + 'deezer');
				return { url: result.artUrl, file: file + '.jpg', ext: '.jpg' };
			});
	};
	/**
	 * Downloads a single img for given artist from Deezer
	 *
	 * @method
	 * @name downloadDeezerImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadDeezerImgArtist = (handleOrKey, path) => {
		const source = this.getSource('deezer', 'img');
		const key = this.getArtistKey(handleOrKey);
		return this.downloadImgFrom(key, source, path);
	};
	/**
	 * Downloads data for given artist from Deezer
	 *
	 * @method
	 * @name downloadDeezerImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<ARTISTDATA>}
	 */
	this.downloadDeezerDataArtist = (handleOrKey) => {
		const source = this.getSource('deezer', 'other');
		const key = this.getArtistKey(handleOrKey);
		const md5 = this.getUrlMd5(key, 'dummy', source);
		return key && source.enabled && !this.urlDone(md5)
			? this.searchDeezerArtist(key).then((o) => {
				if (o) {
					return send({
						method: 'GET',
						bypassCache: true,
						requestHeader: [
							['user-agent', globSettings.userAgent],
							['referer', 'https://deezer.com']
						],
						URL: o.url
					})
						.then((response) => {
							const div = htmlDoc.parse(response);
							const list = div.getElementsByTagName('script');
							if (!list || !list.length) { console.log(source.name + ' artist search: ' + key + ': none found'); return null; }
							const similarArtists = [];
							const albums = [];
							const singles = [];
							let biography = '';
							const popularity = o.data.popularity;
							const scriptKey = 'window.__DZR_APP_STATE__ = ';
							for (let node of list) {
								if (node.innerText.startsWith(scriptKey)) {
									const results = _jsonParse(node.innerText.replace(scriptKey, ''));
									if (!results) { throw new Error('Error parsing DZR_APP_STATE'); }
									// Similar artists
									let temp = results.RELATED_ARTISTS.data;
									!!temp && temp.forEach((s) => similarArtists.push({
										...ARTISTURL,
										id: s.ART_ID,
										name: s.ART_NAME,
										url: 'https://www.deezer.com/en/artist/' + s.ART_ID,
										artUrl: 'https://cdn-images.dzcdn.net/images/artist/' + s.ART_PICTURE + '/1800x1800-000000-100-0-0.jpg',
										data: { popularity: s.NB_FAN }
									}));
									// Albums and singles
									temp = results.ALBUMS.data;
									!!temp && temp.forEach((s) => {
										(s.type === '1' ? albums : singles)
											.push({
												...ALBUMDATA,
												id: s.ALB_ID,
												name: s.ALB_TITLE,
												url: 'https://www.deezer.com/en/album/' + s.ALB_ID,
												artUrl: 'https://cdn-images.dzcdn.net/images/artist/' + s.ALB_PICTURE + '/1800x1800-000000-100-0-0.jpg',
												type: [
													s.type === '1' ? 'album' : 'single', s.SUBTYPES.isStudio ? 'studio' : '', s.SUBTYPES.isLive ? 'live' : '', s.SUBTYPES.isCompilation ? 'compilation' : ''
												].filter(Boolean),
												date: s.ORIGINAL_RELEASE_DATE ? new Date(s.ORIGINAL_RELEASE_DATE) : null,
												digitalDate: s.DIGITAL_RELEASE_DATE ? new Date(s.DIGITAL_RELEASE_DATE) : null,
												physicalDate: s.PHYSICAL_RELEASE_DATE ? new Date(s.PHYSICAL_RELEASE_DATE) : null,
												tracks: s.SONGS.data.map((t) => t.SNG_TITLE)
											});
									});
									// Biography
									temp = results.BIO.BIO.replace(/<\/?p>/gi, '').replace(/<br>/gi, '\n');
									biography = temp;
									break;
								}
							}
							return { ...ARTISTDATA, ...o, popularity, biography, similarArtists, albums, singles };
						})
						.catch((reject) => {
							console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + o.url);
							return null;
						})
						.finally(() => htmlDoc.close());
				} else { return this.failedUrl({ md5, key }); }
			})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Retrieves Qobuz basic data + urls for given artist
	 *
	 * @method
	 * @name searchQobuzArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<ARTISTURL>}
	 */
	this.searchQobuzArtist = (key) => {
		const source = this.getSource('qobuz', 'url');
		const md5 = this.getUrlMd5(key, 'dummy', source);
		const url = 'https://www.qobuz.com/us-en/search/artists/' + encodeURIComponent(key);
		return source.enabled && !this.urlDone(md5)
			? send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['user-agent', globSettings.userAgent],
					['referer', 'https://qobuz.com']
				],
				URL: url
			})
				.then((response) => {
					const div = htmlDoc.parse(response);
					const list = div.getElementsByTagName('div');
					if (!list || !list.length) { console.log(source.name + ' artist search: ' + key + ': none found'); return null; }
					for (let node of list) {
						if (node.getAttribute('class') === 'FollowingCard') {
							if (this.compareKeys(node.getAttribute('title'), key)) {
								const children = node.childNodes;
								let url, artId;
								for (let child of children) {
									const className = child.getAttribute('class');
									if (className === 'CoverModel') {
										artId = child.getElementsByTagName('img')[0].getAttribute('src').split('/').at(-1);
									} else if (className === 'CoverModelOverlay') {
										url = child.getAttribute('href');
									}
								}
								if (url) {
									return {
										...ARTISTURL,
										id: url.split('/').at(-1),
										nameId: url.split('/').at(-2),
										name: key,
										url: 'https://www.qobuz.com/' + url,
										artUrl: 'https://static.qobuz.com/images/artists/covers/large/' + artId
									};
								}
							}
						}
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + url);
					return this.failedUrl({ md5, key });
				})
				.finally(() => htmlDoc.close())
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Gets a single img url for given artist from Qobuz
	 *
	 * @method
	 * @name getQobuzImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<URL>}
	 */
	this.getQobuzImgArtist = (key) => {
		return this.searchQobuzArtist(key)
			.then((result) => {
				// Extract server md5 from url or create new one based on artist info
				const file = (new RegExp(/images\/([a-f0-9]{8})\/([a-f0-9]{4})\/[a-f0-9]{4}\/[a-f0-9]{4}\/[a-f0-9]{4}\/[a-f0-9]{12}\//i).exec(result.artUrl) || []).slice(1).join('') || utils.MD5(key + result.id + 'qobuz');
				return { url: result.artUrl, file: file + '.jpg', ext: '.jpg' };
			});
	};
	/**
	 * Downloads a single img for given artist from Qobuz
	 *
	 * @method
	 * @name downloadQobuzImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadQobuzImgArtist = (handleOrKey, path) => {
		const source = this.getSource('qobuz', 'img');
		const key = this.getArtistKey(handleOrKey);
		return this.downloadImgFrom(key, source, path);
	};
	/**
	 * Downloads data for given artist from Qobuz
	 *
	 * @method
	 * @name downloadQobuzImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @returns {Promise.<ARTISTDATA>}
	 */
	this.downloadQobuzDataArtist = (handleOrKey) => {
		const source = this.getSource('qobuz', 'other');
		const key = this.getArtistKey(handleOrKey);
		const md5 = this.getUrlMd5(key, 'dummy', source);
		return key && source.enabled && !this.urlDone(md5)
			? this.searchQobuzArtist(key).then((o) => {
				if (o) {
					return send({
						method: 'GET',
						bypassCache: true,
						requestHeader: [
							['user-agent', globSettings.userAgent],
							['referer', 'https://qobuz.com']
						],
						URL: o.url
					})
						.then((response) => {
							const div = htmlDoc.parse(response);
							const list = div.getElementsByTagName('section');
							if (!list || !list.length) { console.log(source.name + ' artist search: ' + key + ': none found'); return null; }
							const similarArtists = [];
							const albums = [];
							const singles = [];
							let biography = '';
							for (let node of list) {
								const className = node.getAttribute('class');
								if (className === 'catalog-heading') {
									// Biography
									let children = node.getElementsByTagName('p');
									for (let child of children) {
										if (child.getAttribute('class') === '') {
											biography = child.innerText;
											break;
										}
									}
									// Similar artists
									children = node.getElementsByTagName('a');
									for (let child of children) {
										if (child.getAttribute('class') === 'catalog-heading__item item') {
											const url = child.getAttribute('href') || '';
											const artLink = child.getElementsByTagName('div')[0];
											const artId = (artLink ? artLink.getAttribute('style') || '' : '')
												.split('/')
												.at(-1)
												.replace('\');"', '');
											const nameNode = child.getElementsByTagName('span')[0];
											const name = nameNode ? nameNode.innerText || '' : '';
											if (url) {
												similarArtists.push({
													id: url ? url.split('/').at(-1) : '',
													nameId: url ? url.split('/').at(-2) : null,
													name,
													url: url ? 'https://www.qobuz.com/' + url : '',
													artUrl: artId ? 'https://static.qobuz.com/images/artists/covers/large/' + artId : ''
												});
											}
										}
									}
								} else if (className === 'product') {
									// Albums and singles
									let children = node.getElementsByTagName('li');
									for (let child of children) {
										let subChildren = child.getElementsByTagName('div');
										let artUrl = null;
										for (let subChild of subChildren) {
											if (subChild.getAttribute('class') === 'product__cover webp-bg lazy') {
												artUrl = subChild.getAttribute('data-src').replace('_230', '_600'); // NOSONAR
												break;
											}
										}
										subChildren = child.getElementsByTagName('p');
										let year = null;
										for (let subChild of subChildren) {
											if (subChild.getAttribute('class') === 'product__infos') {
												year = (/on (\w{3} \d{1,2}, \d{4})/mi.exec(subChild.innerText) || [null, null])[1];
												if (year) { year = Number(year) || null; }
												break;
											}
										}
										const childUrl = child.getElementsByTagName('a')[0];
										const url = childUrl ? childUrl.getAttribute('href') || '' : '';
										if (url) {
											const name = (childUrl ? childUrl.getAttribute('title') || '' : '')
												.replace('More details on ', '')
												.replace(' by ' + o.name + '.', '');
											albums.push({
												...ALBUMDATA,
												id: url ? url.split('/').at(-1) : '',
												nameId: url ? url.split('/').at(-2) : null,
												name,
												url: url ? 'https://www.qobuz.com/' + url : '',
												artUrl,
												year
											});
										}
									}
								}
							}
							return { ...ARTISTDATA, ...o, biography, similarArtists, albums, singles };
						})
						.catch((reject) => {
							console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + o.url);
							return null;
						})
						.finally(() => htmlDoc.close());
				} else { return this.failedUrl({ md5, key }); }
			})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Retrieves Album of the Year basic data + urls for given artist
	 *
	 * @method
	 * @name searchAotyArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<ARTISTURL>}
	 */
	this.searchAotyArtist = (key) => {
		const source = this.getSource('album of the year', 'url');
		const md5 = this.getUrlMd5(key, 'dummy', source);
		const url = 'https://www.albumoftheyear.org/search/artists/?q=' + encodeURIComponent(key);
		return source.enabled && !this.urlDone(md5)
			? send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['user-agent', globSettings.userAgent],
					['referer', 'https://www.albumoftheyear.org/']
				],
				URL: url
			})
				.then((response) => {
					const div = htmlDoc.parse(response);
					const list = div.getElementsByTagName('div');
					if (!list || !list.length) { console.log(source.name + ' artist search: ' + key + ': none found'); return null; }
					for (let node of list) {
						if (node.getAttribute('class') === 'artistBlock six') {
							const children = node.getElementsByTagName('div');
							let url, artUrl, id, nameId, name, href;
							for (let child of children) {
								const className = child.getAttribute('class');
								if (className === 'image') {
									const link = child.getElementsByTagName('a')[0];
									href = link ? link.getAttribute('href') : '';
									const artLink = link.getElementsByTagName('img')[0];
									artUrl = artLink ? artLink.getAttribute('src').replace('sq/', '') : '';
								} else if (className === 'name') {
									const link = child.getElementsByTagName('a')[0];
									if (link && href && this.compareKeys(link.innerText, key)) {
										url = 'https://www.albumoftheyear.org' + href;
										nameId = href.split('/').at(-2);
										id = nameId ? nameId.split('-').at(0) : '';
										name = link.innerText || '';
										return {
											...ARTISTURL,
											id,
											nameId,
											name,
											url,
											artUrl
										};
									}
								}
							}
						}
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + url);
					return this.failedUrl({ md5, key });
				})
				.finally(() => htmlDoc.close())
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Gets a single img url for given artist from Album of the Year
	 *
	 * @method
	 * @name getAotyImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<URL>}
	 */
	this.getAotyImgArtist = (key) => {
		return this.searchAotyArtist(key)
			.then((result) => {
				// Create server md5 based on artist info
				const file = utils.MD5(key + result.id + 'album of the year' + result.artUrl.split('/').at(-1));
				return { url: result.artUrl, file: file + '.jpg', ext: '.jpg' };
			});
	};
	/**
	 * Downloads a single img for given artist from Album of the Year
	 *
	 * @method
	 * @name downloadAotyImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadAotyImgArtist = (handleOrKey, path) => {
		const source = this.getSource('album of the year', 'img');
		const key = this.getArtistKey(handleOrKey);
		return this.downloadImgFrom(key, source, path);
	};
	/**
	 * Downloads data for given artist from Album of the Year
	 *
	 * @method
	 * @name downloadAotyDataArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey
	 * @returns {Promise.<ARTISTDATA>}
	 */
	this.downloadAotyDataArtist = (handleOrKey) => {
		const source = this.getSource('album of the year', 'other');
		const key = this.getArtistKey(handleOrKey);
		const md5 = this.getUrlMd5(key, 'dummy', source);
		return key && source.enabled && !this.urlDone(md5)
			? this.searchAotyArtist(key).then((o) => {
				if (o) {
					return send({
						method: 'GET',
						bypassCache: true,
						requestHeader: [
							['user-agent', globSettings.userAgent],
							['referer', 'https://www.albumoftheyear.org/']
						],
						URL: o.url
					})
						.then((response) => {
							const div = htmlDoc.parse(response);
							const similarArtists = [];
							const albums = [];
							const singles = [];
							let biography = '';
							// Albums
							let list = div.getElementsByTagName('div');
							const popularity = Number(
								list.find((node) => node.getAttribute('class') === 'followCount')
									.innerText.replace(/ followers$|,/gi, '')
							) || null;
							list = list
								.find((node) => node.getAttribute('id') === 'albumOutput')
								.childNodes;
							if (!list || !list.length) { console.log(source.name + ' search: ' + key + ': none found'); return null; }
							let albumType;
							const dateRe = /^\d{4}/;
							for (const node of list) {
								const className = node.getAttribute('class');
								if (className === 'subHeadline') {
									albumType = (node.innerText || '')
										.split(' ')[0]
										.replace(/view$/i, '')
										.replace(/s$/i, '')
										.toLowerCase();
									if (!['album', 'single', 'ep', 'compilation', 'soundtrack', 'live'].includes(albumType)) {
										albumType = '';
										continue;
									}
								} else if (className === 'albumBlock small' && albumType) {
									// Albums and singles
									const children = node.childNodes;
									let url, artUrl, id, nameId, name, href, year, rating;
									for (const child of children) {
										if (child.tagName === 'div') {
											const className = child.getAttribute('class');
											if (className.startsWith('image')) {
												const link = child.getElementsByTagName('a')[0];
												href = link ? link.getAttribute('href') : '';
												const artLink = link.getElementsByTagName('img')[0];
												artUrl = artLink ? artLink.getAttribute('src').replace('200x0/', '') : '';
											} else if (className === 'type') {
												year = child.innerText ? Number((dateRe.exec(child.innerText || '') || [])[0]) || null : null;
											} else if (className === 'ratingRowContainer') {
												rating = child.getElementsByTagName('div')
													.filter((node) => node.getAttribute('class') === 'rating')
													.map((node) => Number(node.innerText || ''))
													.average() || null;
											}
										} else if (child.tagName === 'a') {
											url = href ? 'https://www.albumoftheyear.org' + href : '';
											nameId = href ? href.split('/').at(-1).replace('.php', '') : null;
											id = nameId ? nameId.split('-').at(0) : '';
											name = child.getElementsByTagName('div')[0].innerText || '';
										}
									}
									if (url) {
										(['single', 'ep'].includes(albumType) ? singles : albums).push({
											...ALBUMDATA,
											id,
											nameId,
											name,
											url,
											artUrl,
											type: [albumType],
											year,
											rating
										});
									}
								}
							}
							return { ...ARTISTDATA, ...o, popularity, biography, similarArtists, albums, singles };
						})
						.catch((reject) => {
							console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100).cut(100)) + '\n\t' + o.url);
							return null;
						})
						.finally(() => htmlDoc.close());
				} else { return this.failedUrl({ md5, key }); }
			})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * @typedef {{idArtist: string, strArtist: string|null, strArtistStripped: string|null, strArtistAlternate: string|null, strLabel: string|null, idLabel: string|null, intFormedYear:string|null, intBornYear: string|null, intDiedYear: string|null , intPopularity: string|null , intFollowers: string|null, strDisbanded: string|null, strStyle: string|null, strGenre: string|null, strMood: string|null, strWebsite: string|null, strFacebook: string|null, strTwitter: string|null, strBiography: string|null, strBiographyDE: string|null, strBiographyFR: string|null, strBiographyCN: string|null, strBiographyIT: string|null, strBiographyJP: string|null, strBiographyRU: string|null, strBiographyES: string|null, strBiographyPT: string|null, strBiographySE: string|null, strBiographyNL: string|null, strBiographyHU: string|null, strBiographyNO: string|null, strBiographyIL: string|null, strBiographyPL: string|null, strGender: string|null, intMembers: string|null, strCountry: string|null, strCountryCode: string|null, strArtistThumb: string|null, strArtistLogo: string|null, strArtistCutout: string|null, strArtistClearart: string|null, strArtistWideThumb: string|null, strArtistFanart: string|null, strArtistFanart2: string|null, strArtistFanart3: string|null, strArtistFanart4: string|null, strArtistBanner: string|null, strMusicBrainzID: string|null, strISNIcode: string|null, strLastFMChart: string|null, intCharted: string|null,strLocked: string|null, intChecked: string|null}} THEAUDIODBARTISTDATA - Artist page data object
	*/
	/**
	 * Retrieves TheAudioDb basic data + urls for given artist
	 *
	 * @method
	 * @name searchTadbArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<ARTISTURL>}
	 */
	this.searchTadbArtist = (key) => {
		const source = this.getSource('theaudiodb', 'url');
		const md5 = this.getUrlMd5(key, 'dummy', source);
		const url = 'https://www.theaudiodb.com/api/v1/json/123/search.php?s=' + encodeURIComponent(key);
		return source.enabled && !this.urlDone(md5)
			? send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['user-agent', globSettings.userAgent],
					['referer', 'https://www.theaudiodb.com']
				],
				URL: url
			})
				.then((response) => {
					/** @type{THEAUDIODBARTISTDATA[]} */
					const data = _jsonParse(response);
					if (data && Object.hasOwn(data, 'artists') && data.artists.length) {
						for (const row of data.artists) {
							if (this.compareKeys(key, row.strArtist)) {
								return {
									...ARTISTURL,
									id: row.idArtist,
									name: key,
									url: 'https://www.theaudiodb.com/artist/' + row.idArtist,
									artUrl: row.strArtistThumb,
									data
								};
							}
						}
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + url);
					return this.failedUrl({ md5, key });
				})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Gets a single img url for given artist from TheAudioDb
	 *
	 * @method
	 * @name getTadbImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<URL>}
	 */
	this.getTadbImgArtist = (key) => {
		return this.searchTadbArtist(key)
			.then((result) => {
				// Create server md5 based on artist info
				const file = utils.MD5(key + result.id + 'TheAudioDb' + result.artUrl.split('/').at(-1));
				const ext = '.' + result.artUrl.split('.').at(-1);
				return { url: result.artUrl, file: file + ext, ext };
			});
	};
	/**
	 * Downloads a single img for given artist from TheAudioDb
	 *
	 * @method
	 * @name downloadTadbImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadTadbImgArtist = (handleOrKey, path) => {
		const source = this.getSource('theaudiodb', 'img');
		const key = this.getArtistKey(handleOrKey);
		return this.downloadImgFrom(key, source, path);
	};
	/**
	 * Downloads data for given artist from TheAudioDb
	 *
	 * @method
	 * @name downloadAotyDataArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey
	 * @returns {Promise.<ARTISTDATA>}
	 */
	this.downloadTadbDataArtist = (handleOrKey) => {
		const source = this.getSource('theaudiodb', 'other');
		const key = this.getArtistKey(handleOrKey);
		const md5 = this.getUrlMd5(key, 'dummy', source);
		return key && source.enabled && !this.urlDone(md5)
			? this.searchTadbArtist(key).then((o) => {
				if (o) {
					/** @type{THEAUDIODBARTISTDATA} */
					const data = o.data;
					if (data) {
						return { ...ARTISTDATA, ...o, popularity: Number(data.intPopularity), biography: data.strBiography, data };
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				} else { return this.failedUrl({ md5, key }); }
			})
				.catch(() => {
					return this.failedUrl({ md5, key });
				})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Retrieves SONGLYRICS basic data + urls for given artist
	 *
	 * @method
	 * @name searchSonglyrArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<ARTISTURL>}
	 */
	this.searchSonglyrArtist = (key) => {
		const source = this.getSource('songlyrics', 'url');
		const md5 = this.getUrlMd5(key, 'dummy', source);
		const url = 'https://www.songlyrics.com/search?q=' + encodeURIComponent(key);
		return source.enabled && !this.urlDone(md5)
			? send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['user-agent', globSettings.userAgent],
					['referer', 'https://www.songlyrics.com']
				],
				URL: url
			})
				.then((response) => {
					const div = htmlDoc.parse(response);
					const list = div.getElementsByTagName('div')
						.find((node) => node.getAttribute('class') === 'smart-artist-list')
						.childNodes;
					if (!list || !list.length) { console.log(source.name + ' artist search: ' + key + ': none found'); return null; }
					for (const node of list) {
						const className = node.getAttribute('class');
						if (className === 'smart-artist-card') {
							const children = node.childNodes;
							let url, artUrl, id, nameId, name, href;
							for (let child of children) {
								const className = child.getAttribute('class');
								if (className === 'smart-artist-info') {
									name = child.getElementsByTagName('div')[0].innerText;
									if (!name || !this.compareKeys(name, key)) { name = null; break; }
								} else if (child.tagName === 'img') {
									artUrl = child.getAttribute('src').replace('_thumb.', '.');
								}
							}
							if (name && this.compareKeys(name, key)) {
								href = node.getAttribute('href');
								if (href) {
									url = 'https://www.songlyrics.com' + href;
									artUrl = artUrl ? 'https://www.songlyrics.com' + artUrl : '';
									nameId = href.split('/').at(-2);
									id = nameId.replace('-lyrics', '');
									return {
										...ARTISTURL,
										id,
										nameId,
										name,
										url,
										artUrl
									};
								}
							}
						}
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + url);
					return this.failedUrl({ md5, key });
				})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Gets a single img url for given artist from SONGLYRICS
	 *
	 * @method
	 * @name getTadbImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<URL>}
	 */
	this.getSonglyrImgArtist = (key) => {
		return this.searchSonglyrArtist(key)
			.then((result) => {
				// Create server md5 based on artist info
				const file = utils.MD5(key + result.id + 'SONGLYRICS' + result.artUrl.split('/').at(-1));
				const ext = '.' + result.artUrl.split('.').at(-1);
				return { url: result.artUrl, file: file + ext, ext };
			});
	};
	/**
	 * Downloads a single img for given artist from SONGLYRICS
	 *
	 * @method
	 * @name downloadSonglyrImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadSonglyrImgArtist = (handleOrKey, path) => {
		const source = this.getSource('songlyrics', 'img');
		const key = this.getArtistKey(handleOrKey);
		return this.downloadImgFrom(key, source, path);
	};
	/**
	 * Downloads data for given artist from SONGLYRICS
	 *
	 * @method
	 * @name downloadSonglyrDataArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey
	 * @returns {Promise.<ARTISTDATA>}
	 */
	this.downloadSonglyrDataArtist = (handleOrKey) => {
		const source = this.getSource('songlyrics', 'other');
		const key = this.getArtistKey(handleOrKey);
		const md5 = this.getUrlMd5(key, 'dummy', source);
		return key && source.enabled && !this.urlDone(md5)
			? this.searchSonglyrArtist(key).then((o) => {
				if (o) {
					return send({
						method: 'GET',
						bypassCache: true,
						requestHeader: [
							['user-agent', globSettings.userAgent],
							['referer', 'https://www.albumoftheyear.org/']
						],
						URL: o.url
					})
						.then((response) => {
							const div = htmlDoc.parse(response);
							const similarArtists = [];
							const albums = [];
							const singles = [];
							let biography = '';
							let list = div.getElementsByTagName('div');
							if (!list || !list.length) { console.log(source.name + ' search: ' + key + ': none found'); return null; }
							// Biography
							biography = (list.find((node) => node.getAttribute('class').includes('artist-bio'))
								.innerText || '')
								.replace('\n\tAbout ' + o.name + '\n\t' + o.name, '')
								.trim();
							// Albums
							let albumType;
							for (const node of list) {
								if (node.getAttribute('class').includes('section-band-alt')) {
									const children = node.childNodes;
									let url, artUrl, id, name, href, year;
									for (const child of children) {
										const className = child.getAttribute('class');
										if (className === 'overline') {
											albumType = (child.innerText || '')
												.replace(/s$/i, '')
												.toLowerCase()
												.replace(o.name, '');
											if (!['album', 'single', 'ep', 'compilation', 'soundtrack', 'live'].includes(albumType)) {
												albumType = '';
												continue;
											}
										} else if (className === 'album-grid') {
											const albumChildren = child.getElementsByClassName('album-card');
											for (const albumChild of albumChildren) {
												const link = albumChild.getElementsByTagName('a')[0];
												href = link ? link.getAttribute('href') : '';
												if (link && href) {
													const artLink = link.getElementsByTagName('img')[0];
													artUrl = artLink ? artLink.getAttribute('src').replace('_thumb.', '.') : '';
													name = (link.getElementsByClassName('album-card-title')[0] || {}).innerText || '';
													year = Number((link.getElementsByClassName('album-card-year')[0] || {}).innerText || '') || null;
													url = 'www.songlyrics.com' + href;
													id = href.split('/').at(-2);
													(['single', 'ep'].includes(albumType) ? singles : albums).push({
														...ALBUMDATA,
														id,
														name,
														url,
														artUrl,
														type: [albumType],
														year
													});
												}
											}
										}
									}
								}
							}
							return { ...ARTISTDATA, ...o, biography, similarArtists, albums, singles };
						})
						.catch((reject) => {
							console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100).cut(100)) + '\n\t' + o.url);
							return null;
						})
						.finally(() => htmlDoc.close());
				} else { return this.failedUrl({ md5, key }); }
			})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Retrieves Encyclopaedia Metallum basic data + urls for given artist
	 *
	 * @method
	 * @name searchEncyMetArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<ARTISTURL>}
	 */
	this.searchEncyMetArtist = (key) => {
		const source = this.getSource('encyclopaedia metallum', 'url');
		const md5 = this.getUrlMd5(key, 'dummy', source);
		const url = 'https://www.metal-archives.com/search/ajax-band-search/?field=name&query=' + encodeURIComponent(key);
		return source.enabled && !this.urlDone(md5)
			? send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['user-agent', globSettings.userAgent],
					['referer', 'https://www.metal-archives.com']
				],
				URL: url
			})
				.then((response) => {
					const data = _jsonParse(response);
					if (!data || !data.aaData.length) { console.log(source.name + ' artist search: ' + key + ': none found'); return null; }
					if (data.error) { console.log(source.name + ' artist search: ' + key + ': \n\t' + data.error); return null; }
					const [, url, name] = data.aaData[0][0].match(/<a href="(.+?)">(.+?)<\/a>/i);
					if (url && name && this.compareKeys(name, key)) {
						const id = url.split('/').at(-1);
						const nameId = url.split('/').slice(-2).join('/');
						const artUrl = 'https://www.metal-archives.com/images/' + id.split('').slice(0, 4).join('/') + '/' + id + '_photo.jpg'; // This is a guess, extension may be other...
						return {
							...ARTISTURL,
							id,
							nameId,
							name,
							url,
							artUrl
						};
					}
					console.log(source.name + ' artist search: ' + key + ': parse error');
					return this.failedUrl({ md5, key });
				})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + url);
					return this.failedUrl({ md5, key });
				})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Gets a single img url for given artist from Encyclopaedia Metallum
	 *
	 * @method
	 * @name getTadbImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<URL>}
	 */
	this.getEncyMetImgArtist = (key) => {
		return this.searchEncyMetArtist(key)
			.then((result) => {
				// Create server md5 based on artist info
				const file = utils.MD5(key + result.id + 'Encyclopaedia Metallum' + result.artUrl.split('/').at(-1));
				const ext = '.' + result.artUrl.split('.').at(-1);
				return { url: result.artUrl, file: file + ext, ext };
			});
	};
	/**
	 * Downloads a single img for given artist from Encyclopaedia Metallum
	 *
	 * @method
	 * @name downloadEncyMetImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadEncyMetImgArtist = (handleOrKey, path) => {
		const source = this.getSource('encyclopaedia metallum', 'img');
		const key = this.getArtistKey(handleOrKey);
		return this.downloadImgFrom(key, source, path);
	};
	/**
	 * Downloads data for given artist from Encyclopaedia Metallum
	 *
	 * @method
	 * @name downloadEncyMetDataArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey
	 * @returns {Promise.<ARTISTDATA>}
	 */
	this.downloadEncyMetDataArtist = (handleOrKey) => {
		const source = this.getSource('encyclopaedia metallum', 'other');
		const key = this.getArtistKey(handleOrKey);
		const md5 = this.getUrlMd5(key, 'dummy', source);
		return key && source.enabled && !this.urlDone(md5)
			? this.searchEncyMetArtist(key).then((o) => {
				if (o) {
					return send({
						method: 'GET',
						bypassCache: true,
						requestHeader: [
							['user-agent', globSettings.userAgent],
							['referer', 'https://www.metal-archives.com/']
						],
						URL: o.url
					})
						.then((response) => {
							const similarArtists = [];
							const albums = [];
							const singles = [];
							const data = o.data ? o.data : {};
							let biography = '';
							const div = htmlDoc.parse(response);
							let list = div.getElementsByTagName('div');
							if (!list || !list.length) { console.log(source.name + ' search: ' + key + ': none found'); return null; }
							const genreParse = (str) => str.split(';').map((g) => {
								return g.includes('Metal')
									? g.split('/').map((sg) => sg + (sg.includes('Metal') ? '' : ' Metal'))
									: g;
							}).flat(Infinity);
							// Stats
							const stats = div.getElementById('band_stats');
							if (stats) {
								const children = stats.childNodes;
								for (const child of children) {
									const subChildren = child.childNodes;
									let key, val;
									for (const subChild of subChildren) {
										if (subChild.tagName === 'dt') { key = subChild.innerText.replace(':', '').trim(); val = ''; }
										else if (subChild.tagName === 'dd') { val = subChild.innerText; }
										if (key && val) {
											data[key] = val;
											switch (key.toLowerCase()) {
												case 'years active':
													data[key] = data[key].split(',\t').map((t) => t.trim().replace(/\s+/gi, ' '));
													break;
												case 'location':
												case 'themes':
													data[key] = data[key].split(', ');
													break;
												case 'genre':
													data[key] = genreParse(data[key]);
													break;
											}
										}
									}
								}
							}
							return Promise.allSettled([
								// Albums
								send({
									method: 'GET',
									bypassCache: true,
									requestHeader: [
										['user-agent', globSettings.userAgent],
										['referer', 'https://www.metal-archives.com/']
									],
									URL: 'https://www.metal-archives.com/band/discography/id/' + o.id + '/tab/all'
								})
									.then((response) => {
										const div = htmlDoc.parse(response);
										const table = div.getElementsByTagName('table')[0];
										if (!table) { return; }
										let rows = div.getElementsByTagName('thead');
										const headers = rows[0].getElementsByTagName('th').map((h) => h.innerText);
										rows = div.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
										for (const row of rows) {
											let url, name, nameId, id, albumType, year, rating;
											const columns = row.getElementsByTagName('td');
											headers.forEach((header, i) => {
												switch (header.toLowerCase()) {
													case 'name':
														url = columns[i].childNodes[0].getAttribute('href') || '';
														name = columns[i].innerText || '';
														id = url.split('/').at(-1) || '';
														nameId = url.split('/').slice(-2).join('/') || null;
														break;
													case 'type':
														albumType =
															albumType = (columns[i].innerText || '')
																.toLowerCase()
																.replace('full-length', 'album')
																.replace('split', 'single')
																.replace('live album', 'single');
														break;
													case 'year':
														year = Number(columns[i].innerText) || null;
														break;
													case 'reviews':
														rating = Number((columns[i].innerText.match(/\((\d{1,2})%\)/) || [])[1]) || null;
														break;
													default:
												}
											});
											if (!['album', 'single', 'ep', 'compilation', 'soundtrack', 'live'].includes(albumType)) {
												albumType = '';
												return;
											}
											if (url) {
												const artUrl = 'https://www.metal-archives.com/images/' + id.split('').slice(0, 4).join('/') + '/' + id + '.jpg'; // This is a guess, extension may be other...
												(['single', 'ep'].includes(albumType) ? singles : albums).push({
													...ALBUMDATA,
													id,
													nameId,
													name,
													url,
													artUrl,
													type: [albumType],
													year,
													rating
												});
											}
										}
									}),
								// Biography
								send({
									method: 'GET',
									bypassCache: true,
									requestHeader: [
										['user-agent', globSettings.userAgent],
										['referer', 'https://www.metal-archives.com/']
									],
									URL: 'https://www.metal-archives.com/band/read-more/id/' + o.id
								})
									.then((response) => {
										const div = htmlDoc.parse(response);
										biography = smartCut(div.innerText || '', 2000);
									}),
								// Similar artists
								send({
									method: 'GET',
									bypassCache: true,
									requestHeader: [
										['user-agent', globSettings.userAgent],
										['referer', 'https://www.metal-archives.com/']
									],
									URL: 'https://www.metal-archives.com/band/ajax-recommendations/id/' + o.id
								})
									.then((response) => {
										const div = htmlDoc.parse(response);
										const table = div.getElementById('artist_list');
										if (!table) { return; }
										let rows = div.getElementsByTagName('thead');
										const headers = rows[0].getElementsByTagName('th').map((h) => h.innerText);
										rows = div.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
										for (const row of rows) {
											let url, name, nameId, id, data = null;
											const columns = row.getElementsByTagName('td');
											headers.forEach((header, i) => {
												switch (header.toLowerCase()) {
													case 'name':
														url = columns[i].childNodes[0].getAttribute('href') || '';
														name = columns[i].innerText || '';
														id = url.split('/').at(-1) || '';
														nameId = url.split('/').slice(-2).join('/') || null;
														break;
													case 'country':
														if (!data) { data = {}; }
														data.country = columns[i].innerText || null;
														break;
													case 'genre':
														if (!data) { data = {}; }
														data.genre = columns[i].innerText || null;
														if (data.genre) { data.genre = genreParse(data.genre); }
														break;
													case 'score':
														if (!data) { data = {}; }
														data.score = Number(columns[i].innerText) || null;
														break;
													default:
												}
											});
											if (url) {
												similarArtists.push({
													...ARTISTURL,
													id,
													url,
													name,
													nameId,
													data
												});
											}
										}
									})
							]).then(() => {
								return { ...ARTISTDATA, ...o, biography, similarArtists, albums, singles, data };
							})
								.catch(() => {
									return { ...ARTISTDATA, ...o, biography, similarArtists, albums, singles, data };
								})
								.finally(() => htmlDoc.close());
						})
						.catch((reject) => {
							console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100).cut(100)) + '\n\t' + o.url);
							return null;
						})
						.finally(() => htmlDoc.close());
				} else { return this.failedUrl({ md5, key }); }
			})
			: Promise.resolve(this.failedUrl({ md5, key }));
	};
	/**
	 * Retrieves urls to all available Last.fm images
	 *
	 * @method
	 * @name getLastfmImgList
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @returns {Promise.<string[]>}
	 */
	this.getLastfmImgArtistList = (key) => {
		const URL = 'https://www.last.fm/music/' + encodeURIComponent(key) + '/+images';
		return send({
			method: 'GET',
			bypassCache: true,
			requestHeader: [
				['user-agent', globSettings.userAgent],
				['referer', 'https://www.last.fm']
			],
			URL
		})
			.then((response) => {
				let links = [];
				const div = htmlDoc.parse(response);
				const list = div.getElementsByTagName('img');
				if (!list || !list.length) { throw new Error('No img elements'); }
				for (let node of list) {
					const attr = node.getAttribute('src');
					if (attr.includes('avatar170s/')) {
						const url = attr.replace('avatar170s/', '');
						let file = url.split('/').at(-1);
						const bHasExt = file.includes('.');
						const ext = bHasExt ? file.split('.').at(-1) : '.jpg';
						if (!bHasExt) { file += ext; }
						links.push({ url, file, ext });
					}
				}
				return links;
			})
			.finally(() => htmlDoc.close());
	};
	/**
	 * Downloads a single img for given artist from Last.fm
	 *
	 * @method
	 * @name downloadLastfmImgArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL>}
	 */
	this.downloadLastfmImgArtist = (handleOrKey, path) => {
		return this.downloadLastfmImgsArtist(handleOrKey, path, 1)[0];
	};
	/**
	 * Downloads a n images for given artist from Last.fm
	 *
	 * @method
	 * @name downloadLastfmImgsArtist
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @param {number?} limit
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadLastfmImgsArtist = (handleOrKey, path, limit) => {
		if (path.length && !path.endsWith('\\')) { path += '\\'; }
		const source = this.getSource('last.fm', 'img');
		if (typeof limit === 'undefined') { limit = source.num; }
		const key = this.getArtistKey(handleOrKey);
		const md5 = this.getUrlMd5(key, path, source);
		const free = this.checkLocalSource('img', path);
		return key && path && free > 0 && limit > 0 && source.enabled && !this.urlDone(md5)
			? this.getLastfmImgArtistList(key).then((o) => { // NOSONAR
				if (o && o.length) {
					this.setUrlsMeta(o, { path, md5, downloader: source.downloader });
					o.length = Math.min(free, limit, o.length);
					return this.downloadUrls(o);
				} else { return [this.failedUrl({ md5, key, path })]; }
			})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + key);
					return [this.failedUrl({ md5, key, path })];
				})
			: Promise.resolve([this.failedUrl({ md5, key, path })]);
	};
	/**
	 * Checks local source limits for a given path
	 *
	 * @method
	 * @name checkLocalSource
	 * @kind method
	 * @memberof _downloader
	 * @param {SOURCE['type']} type
	 * @param {string} path
	 * @returns {number} Available file download slots
	 */
	this.checkLocalSource = (type, path) => {
		if (path.length && !path.endsWith('\\')) { path += '\\'; }
		const local = this.getSource('local', type);
		const files = getFiles(path, new Set(imgAllowedExt));
		return Math.max(local.num - files.length, 0);
	};
	/**
	 * Gets artist key from given handle
	 *
	 * @method
	 * @name getArtistKey
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey
	 * @returns {string} Artist key
	 */
	this.getArtistKey = (handleOrKey) => {
		let key;
		if (isFbMetadbHandle(handleOrKey)) {
			const tf = fb.TitleFormat('$meta(ARTIST,0)');
			key = handleOrKey ? tf.EvalWithMetadb(handleOrKey) : tf.Eval();
		} else if (typeof handleOrKey === 'string') {
			key = handleOrKey;
		}
		return key;
	};
	/**
	 * Compare 2 given keys
	 *
	 * @method
	 * @name compareKeys
	 * @kind method
	 * @memberof _downloader
	 * @param {string} keyA
	 * @param {string} keyB
	 * @returns {boolean}
	 */
	this.compareKeys = (keyA, keyB) => {
		return keyA.toLowerCase() === keyB.toLowerCase();
	};
	/**
	 * Sets download path for given url(s). URL objects are modified.
	 *
	 * @method
	 * @name setUrlsPaths
	 * @kind method
	 * @memberof _downloader
	 * @param {URL|URL[]} url
	 * @param {string|string[]} path
	 * @returns {URL[]}
	 */
	this.setUrlsPaths = (url, path) => {
		return this.setUrlsMeta(url, Array.isArray(path) ? path.map((v) => { return { path: v }; }) : { path });
	};
	/**
	 * Sets timestamp md5 for given url(s). URL objects are modified.
	 *
	 * @method
	 * @name setUrlsMd5
	 * @kind method
	 * @memberof _downloader
	 * @param {URL|URL[]} url
	 * @param {string|string[]} path
	 * @returns {URL[]}
	 */
	this.setUrlsMd5 = (url, md5) => {
		return this.setUrlsMeta(url, Array.isArray(md5) ? md5.map((v) => { return { md5: v }; }) : { md5 });
	};
	/**
	 * Sets associated metadata for  given url(s). URL objects are modified.
	 *
	 * @method
	 * @name setUrlsMeta
	 * @kind method
	 * @memberof _downloader
	 * @param {URL|URL[]} url
	 * @param {object|object[]} val
	 * @returns {URL|URL[]}
	 */
	this.setUrlsMeta = (url, val) => {
		if (Array.isArray(url)) {
			if (Array.isArray(val)) {
				url.forEach((o, i) => {
					for (let key in val) { o[key] = key === 'path' ? _foldPath(val[i][key]) : val[i][key]; }
				});
			} else {
				url.forEach((o) => {
					for (let key in val) { o[key] = key === 'path' ? _foldPath(val[key]) : val[key]; }
				});
			}
		} else {
			for (let key in val) { url[key] = key === 'path' ? _foldPath(val[key]) : val[key]; }
		}
		return url;
	};
	/**
	 * Calculates MD5 associated to a key-path pair and source (used to build any url)
	 *
	 * @method
	 * @name getUrlMd5
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @param {string} path
	 * @param {SOURCE} source
	 * @returns {string}
	 */
	this.getUrlMd5 = (key, path, source) => {
		return key && path ? utils.MD5(key + path + source.name + source.type) : null;
	};
	/**
	 * Downloads a single img for given artist from source
	 *
	 * @method
	 * @name downloadImgFrom
	 * @kind method
	 * @memberof _downloader
	 * @param {FbMetadbHandle|string} handleOrKey - handle or artist name
	 * @param {string} path
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadImgFrom = (key, source, path) => {
		if (path.length && !path.endsWith('\\')) { path += '\\'; }
		const md5 = this.getUrlMd5(key, path, source);
		const free = this.checkLocalSource('img', path);
		return key && path && free > 0 && source.enabled && !this.urlDone(md5)
			? this[source.from](key).then((/** @type {URL} */ o) => { // NOSONAR
				if (o) {
					this.setUrlsMeta(o, { path, md5, downloader: source.downloader });
					return this.downloadUrls(o);
				} else { return [this.failedUrl({ md5, key, path })]; }
			})
				.catch((reject) => {
					console.log(source.method + '(): ' + (reject.message || reject.status + ' - ' + reject.responseText.cut(100)) + '\n\t' + key);
					return [this.failedUrl({ md5, key, path })];
				})
			: Promise.resolve([this.failedUrl({ md5, key, path })]);
	};
	/**
	 * Downloads a list of url(s) to given path(s). URL objects are modified.
	 *
	 * @method
	 * @name downloadUrls
	 * @kind method
	 * @memberof _downloader
	 * @param {URL|URL[]} url
	 * @returns {Promise.<URL[]>}
	 */
	this.downloadUrls = (url) => {
		if (!Array.isArray(url)) { url = [url]; }
		return Promise.serial(url, (o) => {
			o.downloadPath = o.path + o.file;
			if (!this.urlDone(utils.MD5(o.url + o.downloadPath)) && (!_isFile(o.downloadPath) || o.forcedDownload)) {
				if (!_isFolder(o.path)) { _createFolder(o.path); }
				if (!o.downloader) { o.downloader = 'utils'; }
				if (o.downloader === 'utils' && utils.DownloadFileAsync) {
					utils.DownloadFileAsync(o.url, o.downloadPath);
					return new Promise((resolve) => {
						addEventListener('on_download_file_done', (path, success, errorText) => {
							if (path === o.downloadPath) {
								if (success) {
									resolve(path);
								} else {
									console.log('utils.DownloadFileAsync:\n\t' + errorText);
									resolve(downloadFileV3(o.url, o.downloadPath));
								}
							}
						});
					});
				} else {
					return downloadFileV3(o.url, o.downloadPath);
				}
			} else { return Promise.resolve(null); }
		}, 25).then((paths) => {
			paths.forEach((p, i) => {
				const o = url[i];
				o.downloaded = !!p;
				o.exists = _isFile(o.downloadPath);
			});
			return url;
		}).catch(() => url);
	};
	/**
	 * Checks if an url was already requested by server and sets a timestamp if provided or not requested before. Requests are kept for 5 minutes.
	 *
	 * @method
	 * @name urlDone
	 * @kind method
	 * @memberof _downloader
	 * @param {string} md5
	 * @param {number} ts - If not provided uses Date.now()
	 * @returns {boolean}
	 */
	this.urlDone = (md5, ts) => {
		const now = Date.now();
		const keys = Object.keys(this.urlRequested);
		keys.forEach((k) => {
			if (now - this.urlRequested[k] > 300000) { delete this.urlRequested[k]; }
		});
		const done = !!this.urlRequested[md5];
		if (!done || ts) {
			if (!ts) { ts = now; }
			this.urlRequested[md5] = ts;
			if (!done) { window.NotifyOthers('Downloader: web request', { md5, ts }); }
		}
		return done;
	};
	/**
	 * Change panel config and call .change callback if provided to save to properties
	 *
	 * @method
	 * @name changeConfig
	 * @kind method
	 * @memberof _downloader
	 * @type {{ config?: { }, callback?: (config, arguments, callbackArgs) => void, callbackArgs? }}
	 * @returns {void}
	 */
	this.changeConfig = ({ config, callback = this.callbacks.change /* (config, arguments, callbackArgs) => void(0) */, callbackArgs = null } = {}) => {
		if (!config) { return; }
		Object.entries(config).forEach((pair) => {
			const key = pair[0];
			const value = pair[1];
			if (typeof value !== 'undefined') {
				if (Object.hasOwn(this, key)) {
					if (value && Array.isArray(value)) {
						this[key] = [...value];
					} else if (value && typeof value === 'object') {
						this[key] = { ...this[key], ...value };
					} else {
						this[key] = value;
					}
				} else if (key === 'sources') {
					for (let ns of config.sources) {
						const source = sources.find((s) => s.name === ns.name && s.type === ns.type);
						if (source) {
							if (Object.hasOwn(ns, 'num')) { source.num = ns.num; }
							if (Object.hasOwn(ns, 'enabled')) { source.enabled = ns.enabled; }
						}
					}
				} else { console.log('_downloader: invalid config key ' + key); }
			}
		});
		this.checkConfig();
		if (callback && isFunction(callback)) { callback.call(this, this.exportConfig(true), arguments[0], callbackArgs); }
	};
	/**
	 * Checks and normalizes panel settings
	 *
	 * @method
	 * @name checkConfig
	 * @kind method
	 * @memberof _downloader
	 * @returns {void}
	 */
	this.checkConfig = () => {
		for (let source of sources) {
			source.num = Math.min(source.num, source.maxNum);
		}
	};
	/**
	 * Gets panel settings ready to be saved as properties
	 * @property
	 * @name exportConfig
	 * @kind method
	 * @memberof _downloader
	 * @returns {{ bAutomatic: boolean, sources: {name: string, type:string, num:number}[] }}
	 */
	this.exportConfig = () => {
		return {
			bAutomatic: this.bAutomatic,
			sources: sources.map((s) => { return { name: s.name, type: s.type, num: s.num, enabled: s.enabled }; })
		};
	};
	/**
	 * Meant to be used as reviver within JSON.parse()
	 * @property
	 * @name exportConfig
	 * @kind method
	 * @memberof _downloader
	 * @param {string} key
	 * @param {any} val
	 * @returns {val}
	 */
	this.parseConfig = _downloader.parseConfig;
	/**
	 * Panel init.
	 * @property
	 * @name init
	 * @kind method
	 * @memberof _downloader
	 * @returns {void}
	 */
	this.init = () => {
		Object.entries(this.defaults(true, true)).forEach((pair) => {
			const key = pair[0];
			const value = pair[1];
			this[key] = value;
		});
		this.changeConfig({ config: arguments[0], bRepaint: false });
	};
	/** @type {Boolean} - Flag for automatic downloads */
	this.bAutomatic = false;
	/**
	 * @typedef {object} callbacks - Callbacks for third party integration
	 * @property {(config, arguments, callbackArgs) => void} change - Called on config changes
	 */
	/** @type {callbacks} - Callbacks for third party integration */
	this.callbacks = {};

	this.init();

	this.urlRequested = {};
}

_downloader.defaults = (bCallbacks = false) => {
	return {
		bAutomatic: false,
		...(bCallbacks
			? {
				callbacks: {
					change: null, /* (config, arguments, callbackArgs) => void(0) */
				}
			}
			: {}
		)
	};
};

/**
 * Meant to be used as reviver within JSON.parse()
 * @property
 * @name parseConfig
 * @kind method
 * @memberof _downloader
 * @param {string} key
 * @param {any} val
 * @returns {val}
 */
_downloader.parseConfig = (key, val) => {
	return ['num', 'maxNum'].includes(key) && val === null
		? Infinity
		: val;
};