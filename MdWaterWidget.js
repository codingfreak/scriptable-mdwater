
class MdWaterWidget {
	
	/**
	 * Start point of the widget. Be aware that a widget is meant to run only
	 * one time and will be reloaded by the OS permanently.
	 */
	async run() {
		let widget = await this.createWidget();
		if (!config.runsInWidget) {
		  await widget.presentSmall()
		}
		Script.setWidget(widget)
		Script.complete()
	}

	/**
	 * Adds the static welcome stack at the top.
	 * @param {*} widget The already created widget where to create the values panel.
	 */
	async addWelcomeStack(widget) {
		let newStack = widget.addStack();				
		newStack.setPadding(2,2,2,2);
		newStack.layoutHorizontally();
		newStack.topAlignContent();		
		// add logo to the panel
		const codingfreaksLogo = await this.getImage('codingfreaks.jpg');
		let logoImage = newStack.addImage(codingfreaksLogo);
		logoImage.imageSize = new Size(16, 16);
		// add spacer
		newStack.addSpacer(10);
		// add welcome message to the panel
		let text =  newStack.addText('ELBE-PEGEL MD');
		text.font = Font.heavySystemFont(16);
	}

	/**
	 * Generates the UI element for holding values.
	 * @param {*} widget The already created widget where to create the values panel.
	 * @param {*} values The values which where read from the API.
	 */
	async addCurrentValueStack(widget, values) {
		let newStack = widget.addStack();
		newStack.setPadding(2,2,2,2);
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
	 * Logic to create the complete widget.
	 */
	async createWidget() {
		let widget = new ListWidget();
		widget.setPadding(2,2,2,2);
		// create and format welcome panel
		this.addWelcomeStack(widget);
		// load values
		let values = await this.getValues();
		// create a panel for the current value
		this.addCurrentValueStack(widget, values);
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
			return { 'error': 'Error loading data.' };
		}
	}

}

// startup logic
const widget = new MdWaterWidget();
await widget.run();

