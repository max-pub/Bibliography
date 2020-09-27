console.log('cross-ref', import.meta.url);
const HTML = document.createElement('template');
HTML.innerHTML = `<main></main>`;
let STYLE = document.createElement('style');
STYLE.appendChild(document.createTextNode(`@import url('https://max.pub/css/base.css');
	@import url('https://max.pub/css/publicSans.css');
	.title {
		font-size: 1.7rem;
		color: var(--text-mark)
	}
	.publisher {
		font-size: 1.3rem;
	}
	div {
		padding: 1rem;
	}
	div:nth-child(even) {
		background: #333;
	}
	h3 {
		color: var(--text-back)
	}
	.author {
		background: #444;
		padding: .2rem .5rem;
		display: inline-block;
		margin: .2rem;
		border-radius: 5px;
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
		this.$applyHTML(); //: HTML
		this.$attachMutationObservers();
		this.$attachEventListeners();
		this.$onFrameChange();  //: onFrameChange
	}
	$attachMutationObservers() {
		this.modelObserver = new MutationObserver(events => {
			if ((events[0].type == 'attributes') && (events[0].target == this)) {
				this.$onFrameChange(
					this.att,//Object.fromEntries(events.map(e => [e.attributeName, this.getAttribute(e.attributeName)])),
					Object.fromEntries(events.map(e => [e.attributeName, e.oldValue]))
				);
			} else {
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
	$applyHTML() {
		this.$view = HTML.content.cloneNode(true)
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
class cross_ref extends WebTag {
		async $onFrameChange() {
			let search = this.$a.search
			console.log('frame', search)
			if (search) {
				let result = await this.searchAPI(search)
				console.log('res', result)
				this.show(result);
			}
		}
		show(list) {
			let html = '';
			for (let paper of list) {
				html += `<div>`;
				html += `<a class='title' href='https://doi.org/${paper.DOI}' target='_blank'>${paper.title}</a>`;
				html += `<a class='date'>${paper.issued['date-parts'][0].join('-')}</a>`
				html += `<a class='publisher'>${paper.publisher}</a>`;
				for (let author of paper.author?.filter(x => x.given)?.filter(x => !x.given.startsWith('&')) ?? []) {
					html += `<a class='author'>${author.given} ${author.family}</a>\n`
				}
				html += `<div>${paper.type}</div>`
				html += `</div>`;
			}
			this.$view = `<main>${html}</main>`;
		}
		async searchAPI(query) {
			console.log('crossref', query);//& format=unixsd
			let result = await fetch('./test2.json').then(x => x.json()); //return result;
			return result.message.items;//.map(this.crossrefConverter);
		}
		async selectPaper(node, event) {
			let selection = event.composedPath()[0].closest('reference');
			console.log('select paper', selection);
			selection.setAttribute('short-DOI', await this.shortDOI(selection.getAttribute('DOI')));
			console.log('select paper', node);
			this.dispatchEvent(new CustomEvent("select", { bubbles: true, detail: selection }));
			this.$('dialog').close();
		}
	}
window.customElements.define('cross-ref', cross_ref)