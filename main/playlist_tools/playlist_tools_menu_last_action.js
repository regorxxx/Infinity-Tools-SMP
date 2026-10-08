'use strict';
//08/10/26

/* global menusEnabled:readable, menu:readable, disabledCount:writable, menuAltAllowed:readable, menuDisabled:readable, lastActionEntry:readable */

/* global MF_GRAYED:readable */

// Last action
{
	const name = 'Last action';
	if (!Object.hasOwn(menusEnabled, name) || menusEnabled[name]) {
		menu.newSeparator();
		menu.newCondEntry({
			entryText: name, condFunc: () => {
				const { entryText, fullName, flags } = lastActionEntry();
				menu.newEntry({
					entryText, func: () => {
						menu.btn_up(void (0), void (0), void (0), fullName); // Don't clear menu on last call
					}, flags: entryText === null ? MF_GRAYED : flags, bDefault: entryText !== null && flags !== MF_GRAYED
				});
			}
		});
		// This part changes compared to the other files due to being a cond entry...
	} else {
		menuDisabled.push({
			entryText: name, condFunc: true, subMenuFrom: menu.getMainMenuName(), index: menu.getEntries().filter((entry) => {
				return (entry.bIsMenu
					? menuAltAllowed.has(entry.subMenuFrom) // menu
					: (Object.hasOwn(entry, 'condFunc')
						? entry.condFunc !== null && menuAltAllowed.has(entry.entryText) // Conditional entry
						: !menu.isSeparator(entry) && entry.func !== null && menuAltAllowed.has(entry.menuName) // Standard entry
					)
				);
			}).length + disabledCount++
		});
	} // NOSONAR
}