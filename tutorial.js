async function tutorial() {
	document.getElementById("tutorial-button").disabled = true;

	// adding atoms
	await prompt(
		"to add an atom, right click & enter an atomic symbol (e.g. Na)",
		new Promise(r => {
			let observer = new MutationObserver(records => {
				for (const record of records) for (const node of record.addedNodes) if (node instanceof Atom) {
					game.root.dispatchEvent(new Event("atomadd"));
					observer.disconnect();
				}
			});
			observer.observe(game.root, {childList: true});
			game.root.addEventListener("atomadd", r, {once: true});
		})
	);

	// moving camera
	await prompt(
		"click and drag to move the camera",
		new Promise(r => {
			canvas.el.addEventListener("mousedown", () => {
				addEventListener("mousemove", () => setTimeout(r, 500), {once: true});
			}, {once: true});
		})
	);

	// moving atoms
	await prompt(
		"to slingshot an atom, hold click on one and drag back",
		new Promise(r => {
			let detectSlingshot = e => {
				if (e.target instanceof Atom || e.target.parentElement instanceof Atom) {
					addEventListener("mouseup", () => setTimeout(r, 100));
					removeEventListener("mousedown", detectSlingshot);
				}
			}
			addEventListener("mousedown", detectSlingshot);
		})
	);

	// atom bonding
	await prompt(
		"atoms might react when close enough. bond two atoms (for example, Na and Cl)",
		checkWithInterval(() => {return Boolean(game.bonds.length)})
	);
	await prompt("if you made NaCl, Cl is now an anion! hover over it to see its new charge and name");
	await prompt("try building more complex structures! (for example, NH<sub>3</sub>)");

	// periodic table
	await prompt(
		"open the periodic table by right clicking an atom or using the button in the top right",
		checkWithInterval(() => {return !document.getElementById("info").classList.contains("hidden")}),
	);
	await prompt("you can view information about atoms on the left, and switch between atoms on the right");
	await prompt(
		"close the periodic table with the button in the top right",
		checkWithInterval(() => {return document.getElementById("info").classList.contains("hidden")}),
	);

	// end
	await prompt("that's it! you're ready to go.");
	document.getElementById("tutorial-button").disabled = false;

	async function prompt(message, promise) {
		let box = document.createElement("div");
		box.classList.add("colored", "white", "tutorial-prompt");
		box.innerHTML = message;
		document.body.appendChild(box);
		if (promise) {
			await promise;
			box.style.setProperty("--status", palette.green);
		}
		else {
			box.style.setProperty("--status", palette.green);
			await new Promise(r => setTimeout(r, 2500));
		}
		box.animate({opacity: 0}, 300).finished.then(() => box.remove());
	}
	function checkWithInterval(condition) {
		return new Promise(r => {
			let interval = setInterval(() => {
				if (condition()) {
					clearInterval(interval);
					r();
				}
			}, 500);
		});
	}
}


document.getElementById("tutorial-button").onclick = tutorial;