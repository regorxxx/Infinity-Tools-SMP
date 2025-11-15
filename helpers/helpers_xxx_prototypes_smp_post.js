'use strict';
//15/11/25

if (typeof addEventListener !== 'undefined' && typeof removeEventListenerSelf !== 'undefined') {
	const playbackHistory = [];
	const addToPlaybackHistory = (handle) => {
		const pl = plman.GetPlayingItemLocation();
		const item = {
			handle,
			idx: pl.PlaylistItemIndex,
			plsIdx: pl.PlaylistIndex,
			plsName: pl.PlaylistIndex !== -1 ? plman.GetPlaylistName(pl.PlaylistIndex) : null,
			plsGUID: pl.PlaylistIndex !== -1 ? plman.GetGUID(pl.PlaylistIndex) : null
		};
		if (playbackHistory.unshift(item) > 10) { playbackHistory.pop(); }
	};

	addEventListener('on_playback_new_track', addToPlaybackHistory);

	fb.GetPrevPlaying = (idx = fb.IsPlaying ? 1 : 0) => {
		if (typeof idx !== 'number' || idx < 0) { idx = 0; }
		const prev = playbackHistory[idx];
		if (prev) { // Refresh all data preferring old matches
			if (prev.plsGUID) {
				if (plman.GetGUID(prev.plsIdx) !== prev.plsGUID) { prev.plsIdx = plman.FindByGUID(prev.plsGUID); }
				if (prev.plsIdx !== -1) { prev.plsName = plman.GetPlaylistName(prev.plsIdx); };
			} else if (plman.GetPlaylistName(prev.plsIdx) !== prev.plsName) {
				prev.plsIdx = plman.FindPlaylist(prev.plsName);
			}
			if (prev.plsIdx !== -1) {
				const plsItems = plman.GetPlaylistItems(prev.plsIdx).Convert();
				if (plsItems[idx] !== prev.handle) {
					let i = 0;
					for (let handle of plsItems) {
						if (handle.Compare(prev.handle)) { prev.idx = i; break; }
						i++;
					}
				}
			}
		}
		return prev || null;
	};

	if (fb.IsPlaying) { addToPlaybackHistory(fb.GetNowPlaying()); }
}