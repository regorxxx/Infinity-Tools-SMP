

# Infinity-Tools-SMP
[![version][version_badge]][changelog]
[![CodeFactor][codefactor_badge]](https://www.codefactor.io/repository/github/regorxxx/Infinity-Tools-SMP/overview/main)
[![CodacyBadge][codacy_badge]](https://www.codacy.com/gh/regorxxx/Infinity-Tools-SMP/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=regorxxx/Playlist-Tools-SMP&amp;utm_campaign=Badge_Grade)
![GitHub](https://img.shields.io/github/license/regorxxx/Infinity-Tools-SMP)  
A collection of [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel)/[JSplitter](https://foobar2000.ru/forum/viewtopic.php?t=6378) Tools for [foobar2000](https://www.foobar2000.org): removing duplicates, wrapped, statistics report, advanced playlist manipulation, dynamic queries, genre analysis, "spotify-like" playlist creation, ... Infinite possibilities. Previous users of my scripts will notice this is a merge of all the previous toolbar scripts, for simplicity, into a new package format.

To use this plugin at its best and to benefit the most from your library, you will want to make sure that your songs have the most possible information: genre, style, key, moods, etc. and a cohesive tagging applied to all files.

**WARNING: THESE ARE ADVANCED TOOLS, IF YOU ARE EXPECTING A FOOLPROOF TOOL, LOOK ELSEWHERE. WHILE BUG REPORTS AND CONSTRUCTIVE FEEDBACK ARE WELCOME, DON'T COMPLAIN ABOUT THINGS BEING TOO COMPLEX. THEY ARE MEANT THIS WAY.**

<img width="1370" height="174" alt="{63A745E1-3384-4B77-8E53-1F8997EF0C80}" src="https://github.com/user-attachments/assets/a9874ef9-cb25-4f11-b02e-9b9a9831fb2b" />

## Features

![infinity1](https://github.com/user-attachments/assets/3b7785e7-5b22-4a55-b2b9-ffa127344e66)

It's impossible to offer a complete list of the things that can be done with these tools, in a few words: anything related to playlist creation, sorting, library maintenance, automation, etc. but a readme for every tool and button can be found using the corresponding menu (on configuration menu, R. Click on the toolbar). Non-exhaustive higlight of features:

* **Macros:** record and save menus entries used, as a macro, to be called later.

* **AutoBackup:** peridic configuration backups. [foo_jesus](https://www.foobar2000.org/components/view/foo_jesus) replacement, compatible with foobar2000 v2+ and x64.

* **ListenBrainz & last.fm:** integration with these services, for listening and feedback syncing, and/or recommendations.

* **Wrapped:** create a report of your listening habits, like Spotify does, with configurable time ranges. Ready to be shared.

* **Music Map:** advanced [offline music similarity recommendation service](https://github.com/regorxxx/Music-Graph) based on genre similarity and not "popularity".
  
* **Dynamic Queries:** queries which adapt to the currently selected track. i.e. placeholders tags are substituted with the actual values of the currently selected track, then the query is evaluated as usual (like $nowplaying{} from [Library-Tree](https://hydrogenaudio.org/index.php/topic,111060.0.html)).
  
* **Quick-Search & Quick-Match:** expanded version of [foo_quicksearch](https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Components/Quicksearch_UI_Element_%28foo_quicksearch%29#Context_menu) which also **works with multiple selections**.
  
* **Pools:** playlist creation similar to [Random Pools component](https://hydrogenaudio.org/index.php/topic,77460.0.html). Multiple playlists \ library sources (pools) can be set to fill a destination playlist. Configurable selection length per source, query filtering, picking method (random, from start, from end), etc. Dynamic queries are also supported, changing the way the pools behave according to selection (for ex. a pool which outputs tracks with same key than selected track + another one which outputs same genre tracks), the main limitation of Random Pools component.
  
* **[Harmonic mixing](https://en.wikipedia.org/wiki/Harmonic_mixing)**: Dj-like selection ordering by key or with special patterns. Compatible with Camelot, Open and Standard keys.
  
* **Fully configurable submenu entries:** Most tools allow to edit the default presets, add your own ones or delete them.
  
* **Keyboard shortcuts:** keyboard shortcuts may be assigned to most of the tools (without requiring panel to be in focus). Shown on the related menu entries tabbed to the right. They are assigned the same than native keyboard shortcuts.
  
* **Online controller integration (ajquery-xxx):** online controller fully compatible with most of the offered tools, which can be called as any other main menu entry. Also available with CMD scripting.
  
* **Wine - Unix - non IE SOs compatible:** all the UI, tools, popups, configuration and external helpers have been carefully designed to work in all systems without requiring IE installation, HTML popups or editing the panel properties. Scripts are expected to work 100% the same in any SO.
  
* **Configurable UI and accessibility design:** most of the UI is configurable (size, colors, position, draggable buttons). All the UI is managed within menus, so it may be used with a narrator (for visual impairment accessibility).

![infinity2](https://github.com/user-attachments/assets/ab35f49f-b06a-4994-a383-a02adcf6cc70)

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

![infinity3](https://github.com/user-attachments/assets/ca6cf815-e0eb-4e74-a627-f05b55ecc42d)

## Requirements (only one host component required)
 1. [Spider Monkey Panel or JSplitter](../../wiki/SMP-vs-JSplitter-notes): JavaScript host component required to install this. Available in x86 and x64.
 2. [Playback Statistics](https://www.foobar2000.org/components/view/foo_playcount): Optional component required to retrieve playback statistics.
 3. [Enhanced Playback Statistics](https://www.foobar2000.org/components/view/foo_enhanced_playcount): Optional component required to retrieve playback statistics.
 4. [Required fonts](https://github.com/regorxxx/foobar2000-assets/tree/main/Fonts): FontAwesome, Segoe UI, Arial Unicode MS
 5. [Optional binaries](https://github.com/regorxxx/foobar2000-assets/tree/main/binaries): ffmpeg, essentia. It depends on the tool (check their readme).

## Installation
See [Wiki](../../wiki/Installation) or the [_INSTALLATION (txt)](../main/_INSTALLATION.txt).
Not properly following the installation instructions will result in scripts not working as intended. Please don't report errors before checking this.

## Support
 1. [Issues tracker](../../issues).
 2. [Hydrogenaudio forum](https://hydrogenaudio.org/index.php/topic,128978.0.html).
 3. [Wiki](../../wiki).

## Nightly releases
Automatic package [built from GitHub](https://nightly.link/regorxxx/Infinity-Tools-SMP/workflows/build/main/file.zip) (using the latest commit). Unzip 'file.zip' downloaded and load the '\*-SMP-\*-\*-\*-package.zip' inside as package within your JS host component.

[changelog]: CHANGELOG.md
[version_badge]: https://img.shields.io/github/release/regorxxx/Playlist-Tools-SMP.svg
[codacy_badge]: https://api.codacy.com/project/badge/Grade/e04be28637dd40d99fae7bd92f740677
[codefactor_badge]: https://www.codefactor.io/repository/github/regorxxx/Playlist-Tools-SMP/badge/main
