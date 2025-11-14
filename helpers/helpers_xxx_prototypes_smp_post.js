'use strict';
//14/11/25

if (typeof addEventListener !== 'undefined' && typeof removeEventListenerSelf !== 'undefined') {
	const playbackHistory = [];
	const addToPlaybackHistory = (handle) => {
		const pl = plman.GetPlayingItemLocation();
		const item = {
			handle,
			idx: pl.PlaylistItemIndex,
			plsIdx: pl.PlaylistIndex,
			plsName: pl.PlaylistIndex !== -1 ? plman.GetPlaylistName(pl.PlaylistIndex) : null,
			plsUUID: pl.PlaylistIndex !== -1 ? plman.GetGUID(pl.PlaylistIndex) : null
		};
		if (playbackHistory.unshift(item) > 10) { playbackHistory.pop(); }
	};

	addEventListener('on_playback_new_track', addToPlaybackHistory);

	fb.GetPrevPlaying = (idx = fb.IsPlaying ? 1 : 0) => {
		if (typeof idx !== 'number' || idx < 0) { idx = 0; }
		return playbackHistory[idx] || null;
	};

	if (fb.IsPlaying) { addToPlaybackHistory(fb.GetNowPlaying()); }
}