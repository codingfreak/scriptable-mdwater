class MdWaterWidget {

	/**
	 * Start point of the widget. Be aware that a widget is meant to run only
	 * one time and will be reloaded by the OS permanently.
	 */
	async run() {
		let widget = await this.createWidget();
		widget.setPadding(0, 0, 0, 0);
		widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
		if (!config.runsInWidget) {
			await widget.presentSmall()
		}
		Script.setWidget(widget)
		Script.complete()
	}

	/**
	 * Adds the static welcome stack at the top.
	 * @param {*} parent The parent in which the stack should be created.
	 */
	async addWelcomeStack(parent) {
		let newStack = parent.addStack();
		newStack.setPadding(5, 5, 5, 5);
		newStack.layoutHorizontally();
		newStack.topAlignContent();
		// add logo to the panel
		const codingfreaksLogo = await this.getImage('codingfreaks.jpg');
		let logoImage = newStack.addImage(codingfreaksLogo);
		logoImage.imageSize = new Size(16, 16);
		// add spacer
		newStack.addSpacer(10);
		// add welcome message to the panel
		let text = newStack.addText('ELBE - PEGEL MAGDEBURG');
		text.font = Font.heavySystemFont(12);
	}

	/**
	 * Generates the UI element for holding values.
	 * @param {*} parent The parent in which the stack should be created.
	 * @param {*} values The values which where read from the API.
	 */
	async addCurrentValueStack(parent, values) {
		let newStack = parent.addStack();
		newStack.setPadding(5, 5, 5, 5);
		newStack.layoutVertically();
		newStack.topAlignContent();
		let currentValue = values[values.length - 1];
		let valueText = '';
		let timeText = '';
		if (currentValue.error) {
			valueText = ':-(';
			timeText = 'Fehler beim Laden';
		} else {
			valueText = currentValue.value;
			timeText = currentValue.timestamp;
		}
		let text = newStack.addText(valueText.toString());
		text.font = Font.mediumSystemFont(24);
		let subText = newStack.addText(new Date(timeText).toLocaleString());
		subText.font = Font.lightSystemFont(6);
	}

	/**
	 * Generates the UI element for holding values.
	 * @param {*} parent The parent in which the stack should be created.
	 * @param {*} values The values which where read from the API.
	 */
	addTimelineChartStack(parent, values) {
		let timeline = values.sort(v => v.timestamp).map(v => v.value);
		let chart = new LineChart(400, 120, timeline).configure((ctx, path) => {
			ctx.opaque = false;
			ctx.setFillColor(new Color("888888", .25));
			ctx.addPath(path);
			ctx.fillPath(path);
		}).getImage();
		let chartStack = parent.addStack();
		chartStack.setPadding(0, 0, 0, 0);
		let img = chartStack.addImage(chart);
		img.applyFittingContentMode();
	}

	/**
	 * Logic to create the complete widget.
	 */
	async createWidget() {
		let widget = new ListWidget();
		widget.setPadding(2, 2, 2, 2);
		let overallStack = widget.addStack();
		overallStack.setPadding(0, 0, 0, 0);
		overallStack.layoutVertically();
		overallStack.topAlignContent();
		// create and format welcome panel
		this.addWelcomeStack(overallStack);
		// load values
		let values = await this.getValues();
		// create a panel for the current value
		this.addCurrentValueStack(overallStack, values);
		// add chart		
		this.addTimelineChartStack(overallStack, values);
		return widget;
	}

	/**
	 * Retrieves an image from the image CDN and stores it locally to
	 * cache the load.
	 * @param {*} fileName The name of the image file without the path.
	 */
	async getImage(fileName) {
		// check if image exists as local already
		const fm = FileManager.local();
		const dir = fm.documentsDirectory();
		const path = fm.joinPath(dir, fileName);
		if (fm.fileExists(path)) {
			// yes the image was found on the phone -> use it
			return fm.readImage(path);
		}
		// we have to load the image from the cloud
		const imageUrl = `https://devdeer.blob.core.windows.net/shared/codingfreaks/images/${fileName}`;
		const req = new Request(imageUrl);
		const image = await req.loadImage();
		fm.writeImage(path, image);
		return image;
	}

	/**
	 * Retrieves the values from the API.
	 */
	async getValues() {
		try {
			const stationId = 'MAGDEBURG-STROMBR%C3%9CCKE';
			const url = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${stationId}/w/measurements.json`;
			const req = new Request(url);
			const json = await req.loadJSON();
			console.log(`Retrieved ${json.length} results.`);
			return json;

		} catch (e) {
			console.error(e);
			return {
				'error': 'Error loading data.'
			};
		}
	}

}

/**
 * Logic to render a line chart.
 * (taken from https://gist.github.com/kevinkub/46caebfebc7e26be63403a7f0587f664).
 */
class LineChart {

	constructor(width, height, values) {
		this.ctx = new DrawContext()
		this.ctx.size = new Size(width, height)
		this.values = values;
	}

	_calculatePath() {
		let maxValue = Math.max(...this.values);
		let minValue = Math.min(...this.values);
		let difference = maxValue - minValue;
		let count = this.values.length;
		let step = this.ctx.size.width / (count - 1);
		let points = this.values.map((current, index, all) => {
			let x = step * index
			let y = this.ctx.size.height - (current - minValue) / difference * this.ctx.size.height;
			return new Point(x, y)
		});
		return this._getSmoothPath(points);
	}

	_getSmoothPath(points) {
		let path = new Path()
		path.move(new Point(0, this.ctx.size.height));
		path.addLine(points[0]);
		for (var i = 0; i < points.length - 1; i++) {
			let xAvg = (points[i].x + points[i + 1].x) / 2;
			let yAvg = (points[i].y + points[i + 1].y) / 2;
			let avg = new Point(xAvg, yAvg);
			let cp1 = new Point((xAvg + points[i].x) / 2, points[i].y);
			let next = new Point(points[i + 1].x, points[i + 1].y);
			let cp2 = new Point((xAvg + points[i + 1].x) / 2, points[i + 1].y);
			path.addQuadCurve(avg, cp1);
			path.addQuadCurve(next, cp2);
		}
		path.addLine(new Point(this.ctx.size.width, this.ctx.size.height))
		path.closeSubpath()
		return path;
	}

	configure(fn) {
		let path = this._calculatePath()
		if (fn) {
			fn(this.ctx, path);
		} else {
			this.ctx.addPath(path);
			this.ctx.fillPath(path);
		}
		return this.ctx;
	}

}

// startup logic
const widget = new MdWaterWidget();
await widget.run();