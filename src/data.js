// https://api.unpaywall.org/v2/10.1038/nature12373?email=YOUR_EMAIL
// https://www.sci-hub.ren/10.1038/s41598-020-60607-0
// https://api.crossref.org/works/${doi}.xml
// https://api.unpaywall.org/v2/10.1038/s41598-020-60607-0?email=YOUR_EMAIL
// https://api.unpaywall.org/v2/search/?query=cell%20thermometry&is_oa=true&email=YOUR_EMAIL
// https://api.unpaywall.org/v2/search/?query=clinical%20information%20system&is_oa=true&email=YOUR_EMAIL
// https://api.crossref.org/works?query=
// http://shortdoi.org/10.1002/(SICI)1097-0258(19980815/30)17:15/16%3C1661::AID-SIM968%3E3.0.CO%3B2-2?format=json 

const XML = {
	parse: p => new DOMParser().parseFromString(p.replace(/xmlns=".*?"/g, ''), 'text/xml'),
	stringify: p => new XMLSerializer().serializeToString(p).replace(/xmlns=".*?"/g, ''),
}
document.addEventListener('paste', e => Data.loadPublication(e.clipboardData.getData('text')));

export default class Data {
	static async loadPublication(dois) {
		console.log('loadPublications', dois)
		dois = dois.split('\n');
		// return;
		for(let doi of dois){
			if (localStorage.getItem(doi)) continue;
			let data = await this.loadDOI(doi);
			console.log('data', data)
			data = await this.transform(data);
			console.log('data', data)
			localStorage.setItem(doi, data);
		}
		location.reload();
	}
	static xml(xml) { return new DOMParser().parseFromString(xml, 'text/xml'); }

	static async loadDOI(doi) {
		return await fetch(`https://api.crossref.org/works/${doi}.xml`).then(x => x.text())
		// return new DOMParser().parseFromString(publication, 'text/xml');
	}
	static async transform(crossrefXML) {
		const XSLT = await fetch('./src/bib.xsl').then(x => x.text());
		// console.log('xsl', XSLT)
		const XSLP = new XSLTProcessor();
		XSLP.importStylesheet(XML.parse(XSLT));
		let output = XSLP.transformToFragment(XML.parse(crossrefXML), document);
		console.log('transformed',output);
		return XML.stringify(output)
	}
}

// let xml = new XMLSerializer().serializeToString(this).replace(/xmlns=".*?"/g, ''), 'text/xml'); // some platforms need to reparse the xml
// let output = XSLP.transformToFragment(xml, document);
