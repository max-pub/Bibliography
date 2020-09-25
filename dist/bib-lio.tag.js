console.log('bib-lio', import.meta.url);
const XSLT = new DOMParser().parseFromString(`<?xml version="1.0"?>
		<xsl:stylesheet version="1.0"  xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >
		<xsl:template match='/*'>
		<a class='title' href='https://doi.org/{//doi}' target='_blank'>
			<xsl:value-of select='//journal_article//title' />
		</a>
		<div class='journal'>
			<a class='date'>
				<span class='year'>
					<xsl:value-of select='//journal//year' />
				</span>
				<!-- <span class='month'>
					<xsl:variable name="month" select="//journal//month" />
					<xsl:choose>
						<xsl:when test="$month = 1">JAN</xsl:when>
						<xsl:when test="$month = 2">Feb</xsl:when>
						<xsl:when test="$month = 3">Mar</xsl:when>
						<xsl:when test="$month = 4">Apr</xsl:when>
						<xsl:when test="$month = 5">May</xsl:when>
						<xsl:when test="$month = 6">JUN</xsl:when>
						<xsl:when test="$month = 7">07</xsl:when>
						<xsl:when test="$month = 8">08</xsl:when>
						<xsl:when test="$month = 9">09</xsl:when>
						<xsl:when test="$month = 10">10</xsl:when>
						<xsl:when test="$month = NOV">11</xsl:when>
						<xsl:when test="$month = DEC">12</xsl:when>
						<xsl:otherwise></xsl:otherwise>
					</xsl:choose>
				</span> -->
			</a>
			<a class='journal' href='https://portal.issn.org/resource/ISSN/{//journal//issn}' target='_blank'>
				<xsl:value-of select='//journal//full_title' />
			</a>
		</div>
		<div class='authors'>
			<xsl:for-each select='//contributors/person_name'>
				<a class='author {@sequence}' href='{ORCID}' target='_blank'>
					<span class='given'>
						<xsl:value-of select='given_name' />
					</span>
					<span class='family'>
						<xsl:value-of select='surname' />
					</span>
				</a>
			</xsl:for-each>
		</div>
		<a>
			<xsl:value-of select='count(//citation)' /> citations
		</a>
		<a class='pdf' href='https://www.sci-hub.ren/{//doi}' target='_blank'>pdf</a>
	</xsl:template>
		</xsl:stylesheet>
		`, 'text/xml');
const XSLP = new XSLTProcessor();
XSLP.importStylesheet(XSLT);
let STYLE = document.createElement('style');
STYLE.appendChild(document.createTextNode(`@import url('https://max.pub/css/base.css');
	@import url('https://max.pub/css/publicSans.css');
	:host {
		display: block;
		background: #222;
		padding: 1rem;
	}
	.title {
		font-size: 1.5rem;
		color: var(--text-mark)
	}
	.publisher {
		font-size: 1.3rem;
	}
	div {
		/* padding: 1rem; */
	}
	.date {
		font-weight: 400;
		margin-right: 1rem;
	}
	.month {
		color: gray;
		margin-left: .5rem;
		text-transform: capitalize;
	}
	div:nth-child(even) {
		/* background: #333; */
	}
	h3 {
		color: var(--text-back)
	}
	.author::before {
		/* content: '• '; */
	}
	htm>div {
		margin: .7rem 0;
	}
	.year {
		font-weight: normal;
	}
	.journal {
		color: #fff
	}
	.author {
		/* background: #333; */
		/* padding: .1rem .1rem; */
		display: inline-block;
		margin-right: .9rem;
		border-radius: 5px;
	}
	.author .given {
		color: gray;
		margin-right: .3rem
	}
	.author.first * {
		/* color: lighten(var(--text-mark), 90%); */
		/* color: var(--text-mark) */
	}
	.author:not([href='']) {
		/* color: red; */
		/* color: var(--text-mark); */
		/* filter: brightness(70%); */
		background: #333;
		padding: 0 .3rem
	}
	.author:hover * {
		/* font-weight: bold; */
		filter: brightness(100%);
		color: var(--text-mark);
	}
	.pdf {
		float: right;
	}`));
class WebTag extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open', delegatesFocus: true });
		this.shadowRoot.appendChild(STYLE.cloneNode(true)); //: CSS
		this.$HTM = document.createElement('htm')
		this.shadowRoot.appendChild(this.$HTM)
	}
	async connectedCallback() {
		this.$attachMutationObservers();
		this.$attachEventListeners();
		this.$onFrameChange();  //: onFrameChange
		await this.$render() //: XSLT
	}
	$attachMutationObservers() {
		this.modelObserver = new MutationObserver(events => {
			if ((events[0].type == 'attributes') && (events[0].target == this)) {
				this.$onFrameChange(
					this.att,//Object.fromEntries(events.map(e => [e.attributeName, this.getAttribute(e.attributeName)])),
					Object.fromEntries(events.map(e => [e.attributeName, e.oldValue]))
				);
			} else {
				if (this.$autoUpdate !== false) this.$render(events); //: XSLT
			}
		}).observe(this, { attributes: true, characterData: true, attributeOldValue: true, childList: true, subtree: true });
	}
	$attachEventListeners() {
		let action = (event, key) => {
			try {
				let target = event.composedPath()[0];
				let action = target.closest(`[${key}]`);
				this[action.getAttribute(key)](action, event, target)
			}
			catch { }
		}
	}
	$clear(R) {
		while (R.lastChild)
			R.removeChild(R.lastChild);
	}
	get $view() {
		return this.$HTM;
	}
	set $view(HTML) {
		console.log('set view',HTML);
		this.$clear(this.$view);
		if (typeof HTML == 'string')
			HTML = new DOMParser().parseFromString(HTML, 'text/html').firstChild
		this.$view.appendChild(HTML);
	}
	get $data() {
		return this;
	}
	set $data(XML) {
		console.log('set data 1',XML);
		this.$clear(this.$data);
		if (typeof XML == 'string')
			XML = new DOMParser().parseFromString(XML, 'text/xml').firstChild
		console.log('set data 2',XML);
		this.appendChild(XML);
	}
	$render(events) {
		return new Promise((resolve, reject) => {
			window.requestAnimationFrame(t => {
				const t1 = new Date().getTime();
				let xml = new DOMParser().parseFromString(new XMLSerializer().serializeToString(this).replace(/xmlns=".*?"/g, ''), 'text/xml'); // some platforms need to reparse the xml
				let output = XSLP.transformToFragment(xml, document);
				this.$view = output;
				resolve()
			});
		});
	}
	get $a() {  // attributes
		return new Proxy(
			Object.fromEntries(Array.from(this.attributes).map(x => [x.nodeName, x.nodeValue])),
			{
				set: (target, key, value) => {
					this.setAttribute(key, value);
					return Reflect.set(target, key, value);
				}
			}
		)
	}
};
class bib_lio extends WebTag {
		async $onFrameChange() {
			let doi = this.$a.doi
			this.load(doi)
			let res = await fetch(`https://www.sci-hub.ren/10.1038/s41598-020-60607-0`).then(x => x.text())
			console.log(res);
		}
		async load(doi) {
			`https://api.crossref.org/works/${doi}.xml`;
			console.log('doi', doi);//& format=unixsd
			let result = await fetch('./test/test2.xml').then(x => x.text()); //return result;
			console.log('res', result)
			this.$data = result;
		}
	}
window.customElements.define('bib-lio', bib_lio)