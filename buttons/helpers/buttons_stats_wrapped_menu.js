'use strict';
//29/11/25

/* exported wrappedMenu */

include('..\\..\\helpers\\helpers_xxx.js');
/* global MF_GRAYED:readable, isEnhPlayCount:readable, isPlayCount:readable, isPlayCount2003:readable, MF_STRING:readable, MK_SHIFT:readable */
include('..\\..\\helpers\\buttons_xxx.js');
/* global showButtonReadme:readable  */
include('..\\..\\helpers\\menu_xxx.js');
/* global _menu:readable  */
include('..\\..\\helpers\\helpers_xxx_prototypes.js');
/* global range:readable */
include('..\\..\\helpers\\helpers_xxx_properties.js');
/* global overwriteProperties:readable */
include('..\\..\\helpers\\helpers_xxx_input.js');
/* global Input:readable */
include('..\\..\\main\\spotify\\wrapped.js');
/* global wrapped:readable */
include('..\\..\\main\\playlist_manager\\playlist_manager_listenbrainz.js');
/* global ListenBrainz:readable */

function wrappedMenu({ bSimulate = false } = {}) {
	if (bSimulate) { return wrappedMenu.bind({ buttonsProperties: this.buttonsProperties, prefix: this.prefix })(false); }
	// ListenBrainz token
	if (!wrapped.settings.tokens.listenBrainz && this.buttonsProperties.lBrainzToken[1]) {
		wrapped.settings.tokens.listenBrainz = ListenBrainz.decryptToken({ lBrainzToken: this.buttonsProperties.lBrainzToken[1], bEncrypted: this.buttonsProperties.lBrainzEncrypt[1] });
		ListenBrainz.retrieveUser(wrapped.settings.tokens.listenBrainz, false)
			.then((user) => {
				if (user) {
					wrapped.settings.tokens.listenBrainzUser = this.buttonsProperties.lBrainzUser[1] = user;
					overwriteProperties(this.buttonsProperties);
				}
			});
	}
	if (!wrapped.settings.tokens.listenBrainzUser) {
		if (this.buttonsProperties.lBrainzUser[1]) {
			wrapped.settings.tokens.listenBrainzUser = this.buttonsProperties.lBrainzUser[1];
		}
		if (wrapped.settings.tokens.listenBrainz) {
			ListenBrainz.retrieveUser(wrapped.settings.tokens.listenBrainz, false)
				.then((user) => {
					if (user) {
						wrapped.settings.tokens.listenBrainzUser = this.buttonsProperties.lBrainzUser[1] = user;
						overwriteProperties(this.buttonsProperties);
					}
				});
		}
	}
	// Globals
	const hasListens = isPlayCount && (isEnhPlayCount || isPlayCount2003);
	const runWrapped = (timePeriod, query = '', latexCmd = null, extraCmd = [], mode = 'all', method = 'createPdfReport') => {
		this.switchAnimation('Wrapped stats retrieval', true);
		if (mode === 'report') { wrapped.settings.bSuggestions = false; }
		(
			mode === 'all' || mode === 'report'
				? wrapped[method]({ timePeriod, query, latexCmd, extraCmd })
				: wrapped.getData(timePeriod, query)
		)
			.then((bDone) => {
				this.switchAnimation('Wrapped stats retrieval', false);
				if (bDone && mode === 'all' || mode === 'recommendations') {
					this.switchAnimation('Wrapped playlists recommendations', true);
					wrapped.createPlaylists(timePeriod);
				}
			})
			.finally(() => {
				this.switchAnimation('Wrapped stats retrieval', false);
				this.switchAnimation('Wrapped playlists recommendations', false);
				if (wrapped.isWorking.length) {
					let last = wrapped.isWorking[0].name;
					this.switchAnimation(last, true);
					const id = setInterval(() => {
						if (!wrapped.isWorking.length) {
							this.switchAnimation(last, false);
							clearInterval(id);
						} else if (last !== wrapped.isWorking[0].name) {
							this.switchAnimation(last, false);
							last = wrapped.isWorking[0].name;
							this.switchAnimation(last, false);
						}
					}, 500);
				}
				if (mode === 'report') { wrapped.settings.bSuggestions = true; }
			});
	};
	// Menu
	const menu = new _menu();
	{	// Report
		const currentYear = new Date().getFullYear();
		const years = range(currentYear - 4, currentYear, 1).reverse();
		const reportTypes = [
			{ menu: 'PDF (LaTeX)', method: 'createPdfReport' },
			// { menu: 'HTML (IE)', method: 'createHtmlIeReport' },
			{ menu: 'JSON', method: 'createJsonReport' }
		];
		[
			{ menu: 'Report and recommendations', mode: 'all', descr: 'Outputs report and playlists:' },
			{ menu: 'Report', mode: 'report', descr: 'Outputs report:' },
			{ menu: 'Recommendations', mode: 'recommendations', descr: 'Outputs only playlists:' },
		].forEach((opt) => {
			reportTypes.forEach((reportType, i) => {
				const menuName = menu.findOrNewMenu(opt.menu);
				if (i === 0) {
					menu.newEntry({ menuName, entryText: opt.descr, flags: MF_GRAYED });
					menu.newSeparator(menuName);
				}
				const subMenuName = opt.mode !== 'recommendations'
					? menu.findOrNewMenu(reportType.menu, menuName)
					: menuName;
				if (opt.mode === 'recommendations') {
					if (i !== 0) { return; }
				} else {
					menu.newEntry({ menuName: subMenuName, entryText: 'Choose a period:', flags: MF_GRAYED });
					menu.newSeparator(subMenuName);
				}
				years.forEach((year) => {
					menu.newEntry({
						menuName: subMenuName,
						entryText: 'From ' + year + (hasListens ? '' : '\t[missing plugin]'), func: () => {
							runWrapped(
								year,
								this.buttonsProperties.queryFilter[1] || '',
								this.buttonsProperties.latexCmd[1] || null,
								this.buttonsProperties.extraCmd[1] ? JSON.parse(this.buttonsProperties.extraCmd[1]) : [],
								opt.mode,
								reportType.method
							);
						}
					});
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName,
					entryText: 'From year...' + (hasListens ? '' : '\t[missing plugin]'), func: () => {
						const input = Input.number('int', new Date().getFullYear(), 'Enter year:\n(requires listening story)', 'Wrapped', 2020, [(n) => n > 0]);
						if (input === null) { return; }
						runWrapped(
							input,
							this.buttonsProperties.queryFilter[1] || '',
							this.buttonsProperties.latexCmd[1] || null,
							this.buttonsProperties.extraCmd[1] ? JSON.parse(this.buttonsProperties.extraCmd[1]) : [],
							opt.mode,
							reportType.method
						);
					}, flags: hasListens ? MF_STRING : MF_GRAYED
				});
				menu.newSeparator(subMenuName);
				menu.newEntry({
					menuName: subMenuName,
					entryText: 'Entire listening history' + (hasListens ? '' : '\t[missing plugin]'), func: () => {
						runWrapped(
							null,
							this.buttonsProperties.queryFilter[1] || '',
							this.buttonsProperties.latexCmd[1] || null,
							this.buttonsProperties.extraCmd[1] ? JSON.parse(this.buttonsProperties.extraCmd[1]) : [],
							opt.mode,
							reportType.method
						);
					}, flags: hasListens ? MF_STRING : MF_GRAYED
				});
			});
		});
	}
	menu.newSeparator();
	menu.newEntry({ entryText: 'Settings...', func: () => this.onClick(MK_SHIFT) });
	menu.newSeparator();
	menu.newEntry({ entryText: 'Open readme...', func: () => showButtonReadme('buttons_stats_wrapped.js') });
	return menu;
}