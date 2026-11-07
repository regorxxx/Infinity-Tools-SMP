'use strict';
//29/10/26

if (typeof include !== 'undefined') {
	include('..\\map\\region_xxx.js');
	/* global RegionMap:readable */
}

/*
	Cultural descriptors
*/
const music_graph_descriptors_countries = new RegionMap({
	nodeName: 'country',
	culturalRegion: {
		'Antarctica': {
			'Antarctica': [
				'ATA'
			]
		},
		'Africa': {
			'West Africa': [
				'SLE', 'NGA', 'LBR', 'GMB', 'GHA', 'GNB', 'GIN', 'SEN', 'CIV', 'BEN', 'TGO', 'CPV', 'MLI', 'MRT', 'BFA', 'NER'
			],
			'Maghreb': [ // North Africa
				'DZA', 'TUN', 'ESH', 'MAR', 'LBY', 'EGY'
			],
			'Central Africa': [
				'COD', 'COG', 'GAB', 'GNQ', 'CMR', 'RWA', 'CAF', 'TCD', 'BDI'
			],
			'East Africa': [
				'ETH', 'KEN', 'SDN', 'SOM', 'DJI', 'ERI', 'UGA', 'SSD'
			],
			'South Africa': [
				'ZAF', 'TZA', 'MOZ', 'NAM', 'ZMB', 'ZWE', 'COM', 'SWZ', 'SYC', 'STP', 'SHN', 'REU', 'AGO', 'MDG', 'BWA', 'ATF', 'LSO', 'MWI', 'MUS', 'MYT', 'BVT'
			]
		},
		'Asia': {
			'Central Asia': [
				'NPL', 'BTN', 'UZB', 'KGZ', 'TKM', 'TJK'
			],
			'East Asia': [
				'TWN', 'CHN', 'JPN', 'PRK', 'MAC', 'HKG', 'KOR'
			],
			'West Asia': [
				'IRN', 'PAK', 'AFG'
			],
			'South Asia': [
				'BGD', 'THA', 'IND', 'MMR', 'VNM', 'LKA', 'SGP', 'TLS', 'PHL', 'MYS', 'LAO', 'KHM', 'MDV', 'BRN', 'IOT', 'IDN'
			],
			'North Asia': [
				'MNG', 'RUS', 'KAZ'
			]
		},
		'Europe': {
			'Eastern Europe': [
				'ALB', 'UKR', 'SRB', 'MKD', 'HRV', 'MDA', 'MNE', 'ROU', 'BIH', 'BGR', 'XKX', 'BLR', 'RUS'
			],
			'Southern Europe': [
				'AND', 'ESP', 'ITA', 'GIB', 'GRC', 'PRT', 'MLT', 'SMR', 'VAT'
			],
			'Central Europe': [
				'AUT', 'CHE', 'SVN', 'SVK', 'DEU', 'CZE', 'LIE', 'POL', 'HUN'
			],
			'Western Europe': [
				'BEL', 'GBR', 'MCO', 'IRL', 'FRA', 'LUX', 'NLD', 'GGY', 'IMN', 'JEY'
			],
			'Northern Europe': [
				'SWE', 'NOR', 'LTU', 'EST', 'DNK', 'FIN', 'SJM', 'LVA', 'GRL', 'FRO', 'ISL', 'ALA'
			]
		},
		'Mashriq': { // West Asia
			'Arabian Peninsula': [
				'BHR', 'SAU', 'OMN', 'QAT', 'YEM', 'ARE'
			],
			'Anatolia': [
				'AZE', 'ARM', 'TUR', 'GEO'
			],
			'Levant': [
				'SYR', 'ISR', 'PSE', 'LBN', 'JOR', 'CYP'
			],
			'Mesopotamia': [
				'IRQ', 'KWT'
			]
		},
		'America': {
			'Caribbean': [
				'CUB', 'DMA', 'DOM', 'JAM', 'PRI', 'MSR', 'VIR', 'VGB', 'TCA', 'TTO', 'VCT', 'LCA', 'KNA', 'HTI', 'CYM', 'MTQ', 'ANT', 'GLP', 'GRD', 'AIA', 'SXM', 'MAF', 'BLM', 'CUW', 'BES'
			],
			'North America': [
				'ATG', 'ABW', 'BHS', 'BRB', 'USA', 'CAN', 'SPM', 'BMU'
			],
			'Central America': [
				'CRI', 'SLV', 'GTM', 'HND', 'MEX', 'NIC', 'PAN', 'BLZ'
			],
			'South America': [
				'ARG', 'CHL', 'COL', 'ECU', 'URY', 'PRY', 'PER', 'VEN', 'SUR', 'SGS', 'BOL', 'GUF', 'BRA', 'FLK', 'GUY'
			]
		},
		'Oceania': {
			'Australasia': [
				'AUS', 'CCK', 'CXR', 'NFK', 'HMD'
			],
			'Melanesia': [
				'VUT', 'NCL', 'SLB', 'PNG', 'FJI'
			],
			'Micronesia': [
				'PLW', 'GUM', 'FSM', 'NRU', 'MHL', 'MNP'
			],
			'Polynesia': [
				'TUV', 'WLF', 'UMI', 'TKL', 'TON', 'WSM', 'PCN', 'PYF', 'COK', 'NZL', 'ASM', 'NIU', 'KIR'
			]
		}
	}
});
// Alternate method names
music_graph_descriptors_countries.regionHasCountry = music_graph_descriptors_countries.regionHasNode;
music_graph_descriptors_countries.getCountryRegion = music_graph_descriptors_countries.getNodeRegion;