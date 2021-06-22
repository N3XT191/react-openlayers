import React, { Component } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileWMS from "ol/source/TileWMS";
import VectorSource from "ol/source/Vector";

import { ScaleLine, defaults as defaultControls } from "ol/control";
import Projection from "ol/proj/Projection";
import GPX from "ol/format/GPX";
import Feature from "ol/Feature";

import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import Point from "ol/geom/Point";

import Overlay from "ol/Overlay";
import Geolocation from "ol/Geolocation";

import "ol/ol.css";

import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Cluster } from "ol/source";

var pointStyles = {
	water: (size) => {
		return new Style({
			image: new CircleStyle({
				fill: new Fill({
					color: `rgba(51, 153, 204,${size > 1 ? 1.0 : 0.6})`,
				}),
				radius: 10,
				stroke: new Stroke({
					color: "rgb(31, 93, 144)",
					width: 2,
				}),
			}),
			text:
				size > 1
					? new Text({
							text: size.toString(),
							fill: new Fill({
								color: "#fff",
							}),
					  })
					: undefined,
		});
	},
	fireplace: (size) => {
		return new Style({
			image: new CircleStyle({
				fill: new Fill({
					color: `rgba(243, 240, 40,${size > 1 ? 1.0 : 0.6})`,
				}),
				radius: 10,
				stroke: new Stroke({
					color: "#FF6512",
					width: 2,
				}),
			}),
			text:
				size > 1
					? new Text({
							text: size.toString(),
							fill: new Fill({
								color: "#000",
							}),
					  })
					: undefined,
		});
	},
};

const waterSource = new VectorSource({
	url: "water.gpx",
	format: new GPX(),
});
const fireplaceSource = new VectorSource({
	url: "fireplace.gpx",
	format: new GPX(),
});

var waterClusterSource = new Cluster({
	distance: 50,
	source: waterSource,
});
var fireplaceClusterSource = new Cluster({
	distance: 50,
	source: fireplaceSource,
});

var waterStyleCache = {};
var waterClusters = new VectorLayer({
	source: waterClusterSource,
	style: function (feature) {
		var size = feature.get("features").length;
		var style = waterStyleCache[size];
		if (!style) {
			style = pointStyles.water(size);
			waterStyleCache[size] = style;
		}
		return style;
	},
});

var fireplaceStyleCache = {};
var fireplaceClusters = new VectorLayer({
	source: fireplaceClusterSource,
	style: function (feature) {
		var size = feature.get("features").length;
		var style = fireplaceStyleCache[size];
		if (!style) {
			style = pointStyles.fireplace(size);
			fireplaceStyleCache[size] = style;
		}
		return style;
	},
});

let layers = [
	new TileLayer({
		preload: Infinity,

		source: new TileWMS({
			crossOrigin: "anonymous",
			params: {
				LAYERS: "ch.swisstopo.pixelkarte-farbe",
				FORMAT: "image/jpeg",
			},
			url: "https://wms.geo.admin.ch/",

			attribution: "swisstopo",
			serverLayerName: "ch.swisstopo.pixelkarte-grau",
			attributionUrl:
				"https://www.swisstopo.admin.ch/internet/swisstopo/fr/home.html",
			timestamps: ["current"],
			label: "ch.swisstopo.pixelkarte-farbe_farbe",
			type: "wmts",
		}),
	}),
	new TileLayer({
		preload: Infinity,

		source: new TileWMS({
			crossOrigin: "anonymous",
			params: {
				LAYERS: "ch.swisstopo.swisstlm3d-wanderwege",
				FORMAT: "image/png",
			},
			url: "https://wms.geo.admin.ch/",

			attribution: "swisstopo",
			serverLayerName: "ch.swisstopo.pixelkarte-grau",
			attributionUrl:
				"https://www.swisstopo.admin.ch/internet/swisstopo/fr/home.html",
			timestamps: ["current"],
			label: "ch.swisstopo.swisstlm3d-wanderwege",
			type: "wmts",
		}),
	}),
	new TileLayer({
		preload: Infinity,
		maxResolution: 50,

		source: new TileWMS({
			crossOrigin: "anonymous",
			params: {
				LAYERS: "ch.astra.wanderland-sperrungen_umleitungen",
				FORMAT: "image/png",
			},
			url: "https://wms.geo.admin.ch/",

			attribution: "swisstopo",
			serverLayerName: "ch.astra.wanderland-sperrungen_umleitungen",
			attributionUrl:
				"https://www.swisstopo.admin.ch/internet/swisstopo/fr/home.html",
			timestamps: ["current"],
			label: "ch.astra.wanderland-sperrungen_umleitungen",
			type: "wmts",
		}),
	}),
	waterClusters,
	fireplaceClusters,
];
var projection = new Projection({
	code: "EPSG:3857",
});
var RESOLUTIONS = [
	4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000,
	750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.1,
];
var extent = [2420000, 130000, 2900000, 1350000];
var element = document.getElementById("popup");
var popup = new Overlay({
	element: element,
	positioning: "bottom-center",
	stopEvent: false,
	id: "popup",
});

class PublicMap extends Component {
	constructor(props) {
		super(props);

		this.state = { popoverText: "" };

		this.olmap = new Map({
			extent: extent,
			target: null,
			layers: layers,
			view: new View({
				center: [960000, 5972000],
				resolutions: RESOLUTIONS,
				zoom: 18,
				maxZoom: 26,
			}),
			controls: defaultControls().extend([new ScaleLine()]),
		});
		this.olmap.addOverlay(popup);
		this.geolocation = new Geolocation({
			// enableHighAccuracy must be set to true to have the heading value.
			trackingOptions: {
				enableHighAccuracy: true,
			},
			projection: projection,
		});
		this.positionFeature = new Feature();
		this.positionFeature.setStyle(
			new Style({
				image: new CircleStyle({
					radius: 6,
					fill: new Fill({
						color: "#3399CC",
					}),
					stroke: new Stroke({
						color: "#fff",
						width: 2,
					}),
				}),
			})
		);

		this.geolocation.on("change:position", function () {
			var coordinates = this.getPosition();
			//this.setGeometry(coordinates ? new Point(coordinates) : null);
		});

		new VectorLayer({
			map: this.olmap,
			source: new VectorSource({
				features: [this.positionFeature],
			}),
		});
		this.geolocation.setTracking(true);
	}

	componentDidMount() {
		this.olmap.setTarget("map");

		// Listen to map changes
		this.olmap.on("moveend", () => {
			let center = this.olmap.getView().getCenter();
			let zoom = this.olmap.getView().getZoom();
			console.log(zoom);
		});

		this.olmap.on("click", function (evt) {
			var features = this.forEachFeatureAtPixel(
				evt.pixel,
				function (feature, layer) {
					return feature;
				}
			);
			if (features && features.get("features").length === 1) {
				var feature = features.get("features")[0];
				var coord = feature.getGeometry().getCoordinates();
				var props = feature.getProperties();

				this.getOverlayById("popup").setElement(
					document.getElementById("popup")
				);
				this.getOverlayById("popup").setOffset([0, -22]);
				this.getOverlayById("popup").setPosition(coord);
				this.getOverlayById("popup").getElement().innerHTML = props.desc;
			} else {
				popup.setPosition();
			}
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		let center = this.olmap.getView().getCenter();
		let zoom = this.olmap.getView().getZoom();
		if (center === nextState.center && zoom === nextState.zoom) return false;
		return true;
	}

	render() {
		return (
			<div>
				<div id="popup" className="popup"></div>
				<div id="map" style={{ width: "100hw", height: "100vh" }}></div>
			</div>
		);
	}
}

export default PublicMap;
