// ==UserScript==
// @name         Show Only Pterodactyl Console
// @namespace    https://sirjimmothy.github.io/
// @version      1.0
// @description  Hide all superfluous Pterodactyl console elements
// @author       Sir_Jimmothy
// @match        https://yourdomain.com/server/(.*)
// @icon         https://pterodactyl.io/logos/pterry.svg
// @grant        none
// ==/UserScript==

(() => {
	'use strict';

	function page_load() {

		let prev_height = 0;

		let header = document.querySelector('div#logo').parentNode;
		header.style.display = 'none';

		let menu = header.parentNode.nextSibling;
		menu.style.display = 'none';

		let section	= document.querySelector('section.fade-appear-done.fade-enter-done');
		let centre	= section.children[0].children[1];

		centre.children[1].style.display = 'none';
		centre.children[0].classList.remove('col-span-3','lg:col-span-3');
		centre.children[0].classList.add('col-span-4','lg:col-span-4');

		// Hide items
		let graphs = section.children[0].children[2];
		graphs.style.display = 'none';

		let footer = section.children[1];
		footer.style.display = 'none';

		// Custom CSS
		let style = document.createElement('style');
		style.innerHTML = `
			.mb-4 { margin-bottom: 0 !important; }
		
			@media (min-width: 640px) {
				.jjahje { margin: 0 !important; }
			}
		`;
		document.body.appendChild(style);

		function adjust_sizes() {
			section.children[0].style.maxWidth = 'calc(100% - 1em)';

			let height			= window.innerHeight;
			let size_top		= section.children[0].children[0].getBoundingClientRect();
			let term_height	= height - size_top.height - 55;

			// Don't do anything if the height hasn't changed
			if (term_height === prev_height) { return; }

			// Store new height
			prev_height = term_height;

			let elems = [
				'canvas.xterm-text-layer',
				'canvas.xterm-selection-layer',
				'canvas.xterm-link-layer',
				'canvas.xterm-cursor-layer',
			];
			for (let x = 0; x < elems.length; x++) {
				let elem = document.querySelector(elems[x]);
				elem.style.width = '100%';
				elem.setAttribute('width','100%');

				elem.style.height = term_height + 'px';
				elem.setAttribute('width',term_height + 'px');
			}

			let terminal = document.querySelector('.xterm-screen');
			terminal.style.width = '100%';
			terminal.style.height = term_height + 'px';
		}

		// Set dimensions automatically with window resize
		setInterval(adjust_sizes,100);

	}

	let load_test = setInterval(() => {
		let logo = document.querySelector('div#logo');
		if (logo && (logo.parentNode || '')) {
			setTimeout(page_load,1000);
			clearInterval(load_test);
		}
	},100);

})();
