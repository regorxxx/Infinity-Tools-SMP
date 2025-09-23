'use strict';
//31/07/25

/* exported spotify */

include('..\\..\\helpers\\helpers_xxx.js');
/* global folders:readable */
include('..\\..\\helpers\\helpers_xxx_file.js');
/* global _isFile:readable, _jsonParseFile:readable, _runCmd:readable */
include('..\\..\\helpers\\helpers_xxx_web.js');
/* global send:readable */

const spotify = {
	tokenFile: folders.temp + 'spotify.json',
	curl: folders.xxx + 'helpers-external\\curl\\curl.exe',
	/**
	 * Retrieve a random short-lived access token from the Spotify API. Use {}.accessToken for the Bearer.
	 *
	 * @property
	 * @name getToken
	 * @kind method
	 * @memberof spotify
	 * @type {function}
	 * @returns {Object | null}
	*/
	getToken: function getToken() {
		_runCmd('CMD /C "' + this.curl + ' "https://open.spotify.com/get_access_token?reason=transport&productType=web_player">' + this.tokenFile + '"', true);
		return _isFile(this.tokenFile) ? _jsonParseFile(this.tokenFile) : null;
	},
	/**
	 * Wrapper for Spotify API calls
	 * @property
	 * @name get
	 * @kind method
	 * @memberof spotify
	 * @type {function}
	 * @param {string} URL
	 * @returns {string | null}
	*/
	get: function get(URL) {
		const token = this.getToken();
		return !token
			? Promise.reject(new Error('No token retrieved.'))
			: send({
				method: 'GET',
				bypassCache: true,
				requestHeader: [
					['Authorization', 'Bearer ' + token.accessToken],
					['user-agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36']
				],
				URL
			}).then(
				(resolve) => resolve,
				(reject) => { console.log('spotify.get: ' + reject.status + ' ' + reject.responseText + '\n\t ' + URL); return null; }
			).catch((error) => { fb.ShowPopupMessage(JSON.stringify(error)); return null; });
	},
	/**
	 * Returns information about an item from the Spotify API.
	 * @see {@link https://developer.spotify.com/documentation/web-api/reference/search}
	 *
	 * @property
	 * @name searchArtistInfo
	 * @kind method
	 * @memberof spotify
	 * @type {function}
	 * @param {string} item - Item string
	 * @param {string} type - artist | track | playlist | album
	 * @param {object} metadata - Additional search filters
	 * @returns {Object | null}
	*/
	search: function search(item, type, metadata = {}) {
		let meta;
		if (metadata) {
			const metaArr = [];
			let keys;
			switch (type) {
				case 'artist':
					keys = ['artist', 'year', 'genre']; break;
				case 'track':
					keys = ['album', 'artist', 'track', 'year', 'isrc', 'genre']; break;
				case 'album':
					keys = ['artist', 'track', 'year', 'upc', 'tag:hipster', 'tag:new']; break;
			}
			keys.forEach((key) => {
				if (Object.hasOwn(metadata, key)) { meta.push(key + ':' + (key.startsWith('tag') ? key : encodeURIComponent(metadata[key]))); }
			});
			if (metaArr.length) { meta = '%20' + metaArr.join('%20'); }
		}
		return this.get('https://api.spotify.com/v1/search?type=' + type + '&q=' + encodeURIComponent(item) + meta + '&decorate_restrictions=false&best_match=true&include_external=audio')
			.then(
				(resolve) => resolve ? JSON.parse(resolve) : null,
				(reject) => reject
			).catch((error) => { fb.ShowPopupMessage(JSON.stringify(error)); return null; });
	},
	/**
	 * Returns information about an artist from the Spotify API.
	 *
	 * @property
	 * @name searchArtistInfo
	 * @kind method
	 * @memberof spotify
	 * @type {function}
	 * @param {string} artist - Artist string
	 * @param {object} metadata - Additional search filters
	 * @returns {Object | null}
	*/
	searchArtistInfo: function searchArtistInfo(artist, metadata) {
		return this.search(artist, 'artist', metadata);
	},
	/**
	 * Returns information about a track from the Spotify API.
	 *
	 * @property
	 * @name searchTrackInfo
	 * @kind method
	 * @memberof spotify
	 * @type {function}
	 * @param {string} track - Track string
	 * @param {object} metadata - Additional search filters
	 * @returns {Object | null}
	*/
	searchTrackInfo: function searchTrackInfo(track, metadata) {
		return this.search(track, 'track', metadata);
	},
	/**
	 * Returns Spotify ID about a track from the Spotify API.
	 *
	 * @property
	 * @name searchTrackId
	 * @kind method
	 * @memberof spotify
	 * @type {function}
	 * @param {string} track - Track string
	 * @param {object} metadata - Additional search filters
	 * @returns {Object | null}
	*/
	searchTrackId: function searchTrackId(track, metadata) {
		return this.search(track, 'track', metadata)
			.then((data) => data ? data.best_match.items[0].track.id : null);
	},
	/**
	 * Returns audio features for a track by its id
	 *
	 * @property
	 * @name searchTrackInfo
	 * @kind method
	 * @memberof spotify
	 * @type {function}
	 * @param {string} id
	 * @returns {Object | null}
	*/
	getAudioFeatures: function getAudioFeatures(id) {
		return this.get('https://api.spotify.com/v1/audio-features/' + id)
			.then(
				(resolve) => resolve ? JSON.parse(resolve) : null,
				(reject) => reject
			).catch((error) => { fb.ShowPopupMessage(JSON.stringify(error)); return null; });
	}
};