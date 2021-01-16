
class MdWaterWidget {
	
	
	async run() {
		let widget = await this.createWidget();
		if (!config.runsInWidget) {
		  await widget.presentSmall()
		}
		Script.setWidget(widget)
		Script.complete()
	}

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

	async addCurrentValueStack(widget, values) {
		let newStack = widget.addStack();
		newStack.setPadding(2,2,2,2);
		newStack.layoutVertically();
		newStack.topAlignContent();	
		let currentValue = values[values.length - 1];
		let text =  newStack.addText('');
		text.font = Font.mediumSystemFont(14);		
		let subText =  newStack.addText('');
		subText.font = Font.lightSystemFont(10);	
		if (currentValue.error) {
			text.text = ':-(';
			subText.text = 'Fehler beim Laden';
		} else {
			text.text = currentValue.value;
			subText.text = currentValue.timestamp;
		}			
	}

	async createWidget() {
		widget = new ListWidget();
		widget.setPadding(2,2,2,2);
		// create and format welcome panel
		this.addWelcomeStack(widget);
		// load values
		values = await this.getValues();
		// create a panel for the current value
		this.addCurrentValueStack(widget, values);
		return widget;
	}

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

	async getValues() {
		try {
			const stationId = 'MAGDEBURG-STROMBR%C3%9CCKE';
			const url = `https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${stationId}/w/measurements.json`;
			const req = new Request(url);
			const json = req.loadJson();
			return json;

		} catch (e) {
			return { 'error': 'Error loading data.' };
		}
	}

}

const widget = new MdWaterWidget();
await widget.run();

