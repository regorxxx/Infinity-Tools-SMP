

# Infinity-Tools-SMP
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/Playlist-Tools-SMP/overview/main)
[![CodacyBadge][codacy_badge]](https://www.codacy.com/gh/regorxxx/Playlist-Tools-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/Playlist-Tools-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/Playlist-Tools-SMP)  
A collection of [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel)/[JSplitter](https://foobar2000.ru/forum/viewtopic.php?t=6378) Tools for [foobar2000](https://www.foobar2000.org): removing duplicates, wrapped, statistics report, advanced playlist manipulation, dynamic queries,  "spotify-like" playlist creation, ... Infinite possibilities. Previous users of my scripts will notice this is a merge of all the previous toolbar scripts, for simplicity, into a new package format.

**WARNING: THESE ARE ADVANCED TOOLS, IF YOU ARE EXPECTING A FOOLPROOF TOOL, LOOK ELSEWHERE. WHILE BUG REPORTS AND CONSTRUCTIVE FEEDBACK ARE WELCOME, DON'T COMPLAIN ABOUT THINGS BEING TOO COMPLEX. THEY ARE MEANT THIS WAY.**

![pt_topplayed](https://user-images.githubusercontent.com/83307074/176501054-f5ed2b61-2916-42ea-8c8f-fc8be0517f6f.gif)

## Features

![pt_searchbygraph](https://user-images.githubusercontent.com/83307074/176501077-4b046c50-1db8-4149-bb93-dfa2949a5d88.gif)

It's impossible to offer a complete list of the things that can be done with these tools, in a few words: anything related to playlist creation, sorting, library maintenance, automation, etc. but a readme for every utility can be found using the corresponding menu (on configuration). 

The collection of scripts provided here are not only an alternative to [Random Pools](https://www.foobar2000.org/components/view/foo_random_pools) or [MusicIp](https://www.spicefly.com/section.php?section=musicip) but an improvement and generalization in many aspects of those tools. To use this plugin at its best and to benefit the most from your library, you will want to make sure that your songs have the most possible information on genre, style, key, moods, etc.

* **Macros:** allows to record and save the menus entries used, as a macro, to be called later. Automatic custom playlist creation and edits without limits. Works with all tools. (only limitation are popups, which still require user input)
* **Dynamic Queries:** queries which adapt to the currently selected track. i.e. placeholders tags are substituted with the actual values of the currently selected track, then the query is evaluated as usual. Queries created this way are pretty situational, save a lot of writing time and are meant to be used by multiple playlist creation tools. Expands [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu) contextual menus functionality, and **works with multiple selection too**.
* **Pools[^pools]:** playlist creation similar to Random Pools component. Multiple playlists \ library sources (pools) can be set to fill a destination playlist. Configurable selection length per source, query filtering, picking method (random, from start, from end) and final sorting of destination playlist. They may even use dynamic queries changing the way the pools behave according to selection (for ex. a pool which outputs tracks with same key than selected track + another one which outputs same genre tracks), the main limitation of Random Pools component.
* **[Harmonic mixing](https://en.wikipedia.org/wiki/Harmonic_mixing)**: Dj-like selection ordering by key or with special patterns. Compatible with Camelot, Open and Standard keys.
* **Fully configurable submenu entries:** shift + left click on menu button allows to switch tools functionality. Individual tools or entire submenus may be disabled/enabled. When all entries from a tool are disabled, the entire script files associated are omitted at loading.
* **User configurable presets:** many tools allow you to add your own presets (for ex. Standard Queries) as menu entries for later use. They may be used along macros to greatly expand their functionality, exported and imported as "addons".
* **Keyboard shortcuts:** keyboard shortcuts may be assigned to most of the tools (without requiring panel to be in focus). Shown on the related menu entries tabbed to the right. They are assigned the same than native keyboard shortcuts.
* **Include other scripts (experimental):** easily include ('merge') multiple SMP scripts into the same panel, thus not wasting multiple panels. Useful for those scripts that don't require any UI, user interaction,... like scripts which set the main menu SPM entries (File\\Spider Monkey Panel).
* **Reduce components loaded:** one of the main limitations of windows (and thus foobar) is there is a limit of plugins (dlls) that can be associated to a given [process](https://hydrogenaud.io/index.php/topic,110142.0.html). Thus, in some installations, specially those using VSTs, when the limit is reached strange things start happening, random crashes, bugs, etc. Something I have experienced myself when running a few VSTs. It's not so hard to reach that limit since many components use multiple dlls! When you count the ones by foobar itself, VSTs, etc. as soon as you configure a bit your installation you come into problems. Therefore Playlist Tools is a solution that can help in that sense, replacing multiple components whose functionality is already included (or improved): Random Pools, Playlist Revive, Best version picker, Database Search, ...
* **Online controller integration (ajquery-xxx):** online controller fully compatible with most of the offered tools, which can be called as any other main menu entry. Also available with CMD scripting.
* **Wine - Unix - non IE SOs compatible:** all the UI, tools, popups, configuration and external helpers have been carefully designed to work in all systems without requiring IE installation, HTML popups or editing the panel properties. Scripts are expected to work 100% the same in any SO.
* **Configurable UI and accessibility design:** most of the UI is configurable (size, colors, position, draggable buttons). All the UI is managed within menus, so it may be used with a narrator (for blindness).

![pt_customizable](https://user-images.githubusercontent.com/83307074/176502289-d99f7222-3a51-4803-ad42-d2804b5f186a.gif)

![pt_ssametages](https://user-images.githubusercontent.com/83307074/176501130-905a07e5-dc28-4bfa-8570-e6723c245901.gif)

TODO

The menus are highly customizable. They are created on demand according to the selected tracks or current playlist, and many entries can be added, removed or edited to suit your needs. Also if some scripts are missing, the menu is rebuilt skipping those entries (letting you to install selectively what you need).

![pt_availablemenus](https://user-images.githubusercontent.com/83307074/176501175-2eb1af4d-92a2-4f54-96e4-36c60c4c0cb8.gif)

![pt_dynamicqueries](https://user-images.githubusercontent.com/83307074/176501151-c1c50a35-81c7-40bc-bc48-95efd9636245.gif)

### Integrates (just for info purposes)
 1. [Playlist-Tools-SMP](https://github.com/regorxxx/Playlist-Tools-SMP): the origin of these seet of tools.
 2. [Search-by-Distance-SMP](https://github.com/regorxxx/Search-by-Distance-SMP): creates intelligent "spotify-like" playlist using high-level data from tracks and computing their similarity using genres/styles.
 3. [ListenBrainz-SMP](https://github.com/regorxxx/ListenBrainz-SMP): Integrates Listenbrainz's feedback and recommendations.
 4. [Autobackup-SMP](https://github.com/regorxxx/Autobackup-SMP): Automatic saving and backup of configuration and other data in foobar2000.
 5. [Device-Priority-SMP](https://github.com/regorxxx/Device-Priority-SMP): Automatic output device selection.
 6. [Fingerprint-Tools-SMP](https://github.com/regorxxx/Fingerprint-Tools-SMP): ChromaPrint and FooId fingerprinting tools.
 7. [Wrapped-SMP](https://github.com/regorxxx/Wrapped-SMP): Outputs a report similar to Spotify's wrapped and personalized playlists.
 8. [Music-Graph](https://github.com/regorxxx/Music-Graph): An open source graph representation of most genres and styles found on popular, classical and folk music.
 9. [Camelot-Wheel-Notation](https://github.com/regorxxx/Camelot-Wheel-Notation): Javascript implementation of the Camelot Wheel, ready to use "harmonic mixing" rules and translations for standard key notation
 10. [Menu-Framework-SMP](https://github.com/regorxxx/Menu-Framework-SMP): Helper which allows to easily create customizable and dynamic menus.

![pt_Toprated](https://user-images.githubusercontent.com/83307074/176501329-aa16d757-9b91-4e92-a4ff-23334589185e.gif)

## Requirements (only one host component required)
 1. [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel): JavaScript host component required to install this. Only x32. **(host component)**
 2. [JSplitter](https://foobar2000.ru/forum/viewtopic.php?t=6378): JavaScript host component required to install this. Both x32 and x64. **(host component)**
 3. [Playback Statistics](https://www.foobar2000.org/components/view/foo_playcount): Optional component required to retrieve playback statistics.
 4. [Enhanced Playback Statistics](https://www.foobar2000.org/components/view/foo_enhanced_playcount): Optional component required to retrieve playback statistics.
 5. FontAwesome: found at ’.\ resources\fontawesome-webfont.ttf’. See installation notes.

## Installation
See [Wiki](../../wiki/Installation) or the [_INSTALLATION (txt)](../main/_INSTALLATION.txt).
Not properly following the installation instructions will result in scripts not working as intended. Please don't report errors before checking this.

## Support
 1. [Issues tracker](../../issues).
 2. [Hydrogenaudio forum](https://hydrogenaud.io/index.php/topic,120978.0.html).
 3. [Wiki](../../wiki).
 4. 
## Nightly releases
Automatic package [built from GitHub](https://nightly.link/regorxxx/Infinity-Tools-SMP/workflows/build/main/file.zip) (using the latest commit). Unzip 'file.zip' downloaded and load the '*-package.zip' inside as package within your JS host component.

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/Playlist-Tools-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/e04be28637dd40d99fae7bd92f740677
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/Playlist-Tools-SMP/badge/main
