// camera
canvas.el.onmousedown = () => {
	game.pause();
	addEventListener("mousemove", moveCamera);
	addEventListener("mouseup", () => {
		removeEventListener("mousemove", moveCamera);
		game.start();
	}, {once: true});
}
function moveCamera(e) {
	game.x += e.movementX;
	game.y += e.movementY;
	game.root.style.left = game.x + "px";
	game.root.style.top = game.y + "px";
	canvas.redraw();
}


// debug
onauxclick = e => {
	let input = game.root.appendChild(document.createElement("input"));
	input.className = "input colored " + ["red", "yellow", "green", "blue", "purple"][Math.floor(Math.random() * 5)] + " cell";
	input.style = `left: ${e.x - game.x}px; top: ${e.y - game.y - document.querySelector("header").offsetHeight}px`;
	input.setAttribute("maxlength", 2);
	input.focus();
	input.onblur = () => input.remove();
	input.onkeydown = e => {if (e.key == "Enter") {
		let value = input.value[0].toUpperCase() + input.value.substring(1).toLowerCase();
		if (Atom.symbols.includes(value)) {
			let atom = new Atom;
			atom.symbol = value;
			atom.x = input.offsetLeft;
			atom.y = input.offsetTop;
			atom.add();
		}
		input.blur();
	}}
	return false;
}